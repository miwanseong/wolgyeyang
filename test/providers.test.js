import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviders } from '../src/providers.js';

const config = { mode: 'live', tts: 'openai', model: 'test-model', env: { OPENAI_API_KEY: 'test-key' } };
const event = { kind: 'chat', nickname: '청취자', message: '안녕' };
const safe = { results: [{ flagged: false }] };
const reply = { reply: '안녕. 잘 왔어.', emotion: 'neutral', emotion_score: 0.3 };
function mockAPI(t, replies) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    options.signal.throwIfAborted(); calls.push({ url, ...options, body: JSON.parse(options.body) });
    const next = replies.shift();
    assert.ok(next, 'unexpected extra API call');
    return next instanceof Response ? next : Response.json(next);
  });
  return calls;
}
test('native API preserves moderation, schema, history and extracts message text after reasoning', async t => {
  const text = JSON.stringify(reply);
  const calls = mockAPI(t, [safe, { status: 'completed', output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', content: [{ type: 'output_text', text: text.slice(0, 20) }, { type: 'output_text', text: text.slice(20) }] }
  ] }, safe]);
  const result = await createProviders(config).reply(event, [{ event, reply: '이전 답변' }]);
  assert.equal(result.reply, reply.reply);
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/v1/moderations', '/v1/responses', '/v1/moderations']);
  assert.equal(calls[0].body.input, '청취자\n안녕');
  assert.equal(calls[1].body.text.format.strict, true);
  assert.equal(calls[1].body.input[1].content, '이전 답변');
  assert.equal(calls[1].body.store, false);
  assert.equal(calls[2].body.input, reply.reply);
});
test('native API blocks flagged input before generation and flagged output before speech', async t => {
  const flagged = { results: [{ flagged: true }] };
  const calls = mockAPI(t, [flagged]);
  await assert.rejects(createProviders(config).reply(event, []), /채팅/);
  assert.equal(calls.length, 1);
  mockAPI(t, [safe, { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] }, flagged]);
  await assert.rejects(createProviders(config).reply(event, []), /발화/);
});
test('native API refuses incomplete and refusal responses', async t => {
  for (const response of [{ status: 'incomplete', output: [] }, { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] }]) {
    mockAPI(t, [safe, response]);
    await assert.rejects(createProviders(config).reply(event, []));
  }
});
test('native speech returns unchanged audio bytes', async t => {
  const bytes = Buffer.from([0x49, 0x44, 0x33, 0, 255]);
  const calls = mockAPI(t, [new Response(bytes)]);
  assert.deepEqual(await createProviders(config).speech('안녕'), bytes);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/audio/speech');
  assert.equal(calls[0].headers.Authorization, 'Bearer test-key');
});
test('native API preserves aborts and HTTP status without leaking response bodies or retrying', async t => {
  const calls = mockAPI(t, [new Response('private provider detail', { status: 429 })]);
  await assert.rejects(createProviders(config).reply(event, []), e => e.status === 429 && !e.message.includes('private'));
  assert.equal(calls.length, 1);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(createProviders(config).reply(event, [], controller.signal), { name: 'AbortError' });
  assert.equal(calls.length, 1);
});
test('demo remains offline without an API key', async t => {
  const calls = mockAPI(t, []);
  const provider = createProviders({ ...config, mode: 'demo', env: {} });
  assert.ok((await provider.reply(event, [])).reply);
  assert.equal(await provider.speech('안녕'), null);
  assert.equal(calls.length, 0);
});
