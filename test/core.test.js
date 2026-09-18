import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Engine } from '../src/engine.js';
import { configFromEnv } from '../src/config.js';
import { Budget } from '../src/store.js';
import { normalizeEvent, Chzzk } from '../src/chzzk.js';
import { validateReply } from '../src/providers.js';
import { createApp } from '../server.js';
import WebSocket from 'ws';
import { once } from 'node:events';
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(t, providers, env = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'vtuber-'));
  const config = configFromEnv({ DATA_DIR: dir, USER_COOLDOWN_SECONDS: '0', ...env });
  const budget = new Budget(path.join(dir, 'budget.json'), 2);
  const engine = new Engine(config, providers || { reply: async () => ({ reply: '안녕', emotion: 'neutral', emotionScore: .3 }), speech: async () => null }, budget);
  t.after(() => { engine.close(); rmSync(dir, { recursive: true, force: true }); });
  return { engine, config, budget, dir };
}
test('serial playback, single owner, correct ACK required', async t => {
  const { engine: e } = fixture(t); e.start();
  e.ingest({ message: '하나' }); await flush(); assert.equal(e.current, null);
  assert.equal(e.claim('a'), true); assert.equal(e.claim('b'), false); await flush();
  const id = e.current.id; e.ingest({ message: '둘' }); await flush();
  assert.equal(e.current.id, id); assert.equal(e.queue.length, 1);
  assert.equal(e.ack('b', id, true), false); assert.equal(e.ack('a', 'wrong', true), false);
  assert.equal(e.ack('a', id, true), true); await flush();
  assert.notEqual(e.current.id, id); assert.equal(e.history.length, 1);
  e.release('a'); assert.equal(e.paused, true); assert.equal(e.current, null);
});
test('stop during generation cannot publish stale speech', async t => {
  let resolve; let speechCalls = 0;
  const { engine: e } = fixture(t, { reply: () => new Promise(r => { resolve = r; }), speech: async () => { speechCalls++; } });
  e.claim('a'); e.start(); e.ingest({ message: '하나' }); e.stop(); e.start();
  resolve({ reply: '늦은 응답' }); await flush(); assert.equal(e.current, null); assert.equal(speechCalls, 0);
});
test('duplicate, bounded queue and per-user cooldown', t => {
  const { engine: e } = fixture(t, undefined, { USER_COOLDOWN_SECONDS: '4' }); e.start();
  assert.equal(e.ingest({ message: 'a', nickname: 'one' }).ok, true);
  assert.equal(e.ingest({ message: 'a', nickname: 'one' }).ok, false);
  assert.equal(e.ingest({ message: 'b', nickname: 'one' }).ok, false);
  for (let i = 0; i < 29; i++) assert.equal(e.ingest({ message: 'x', nickname: String(i) }).ok, true);
  assert.equal(e.ingest({ message: 'overflow', nickname: 'overflow' }).ok, false);
});
test('priority messages do not starve chat', async t => {
  const { engine: e } = fixture(t); e.start();
  e.ingest({ message: 'ordinary' });
  for (let i = 0; i < 5; i++) e.ingest({ kind: 'donation', message: `thanks${i}` });
  e.claim('a'); await flush();
  for (let i = 0; i < 3; i++) { assert.equal(e.current.event.kind, 'donation'); e.ack('a', e.current.id, true); await flush(); }
  assert.equal(e.current.event.kind, 'chat');
});
test('idle needs player, enabled automation and elapsed time', async t => {
  const { engine: e } = fixture(t); let clock = 100000; e.now = () => clock;
  e.start(); e.setAuto(true); clock += 60000; e.tick(); assert.equal(e.queue.length, 0);
  e.claim('a'); e.tick(); await flush(); assert.equal(e.current.event.kind, 'idle');
});
test('expired queue entries are not spoken', async t => {
  const { engine: e } = fixture(t); let clock = 100000; e.now = () => clock;
  e.start(); e.ingest({ message: 'old' }); clock += 100000; e.claim('a'); await flush(); assert.equal(e.current, null);
});
test('budget survives restart and refuses third reservation', t => {
  const { budget, dir } = fixture(t); budget.reserve(); budget.reserve();
  const reloaded = new Budget(path.join(dir, 'budget.json'), 2);
  assert.equal(reloaded.snapshot().turns, 2); assert.throws(() => reloaded.reserve());
});
test('official events normalize without treating donations as system instructions', () => {
  assert.equal(normalizeEvent('chat', JSON.stringify({ profile: { nickname: 'a' }, content: 'hi', messageTime: 1 })).message, 'hi');
  assert.equal(normalizeEvent('donation', { donatorNickname: 'a', payAmount: '1000', donationText: 'hello' }).kind, 'donation');
  assert.equal(normalizeEvent('subscription', { subscriberNickname: 'a', month: 2 }).nickname, 'a');
  assert.throws(() => normalizeEvent('chat', 'invalid'));
});
test('reply validation rejects arbitrary output and invalid emotions', () => {
  assert.throws(() => validateReply({ reply: 'x', emotion: 'execute', emotion_score: 1 }));
  assert.throws(() => validateReply({ reply: 'x'.repeat(181), emotion: 'happy', emotion_score: .5 }));
  assert.equal(validateReply({ reply: '안녕', emotion: 'happy', emotion_score: 0 }).emotionScore, 0);
});
test('OAuth requires matching state and browser cookie; replay fails', async t => {
  const { config } = fixture(t, undefined, { CHZZK_CLIENT_ID: 'client', CHZZK_CLIENT_SECRET: 'secret' });
  const c = new Chzzk(config, () => {}, () => {}); c.token = async () => {};
  const auth = c.authURL(); const state = new URL(auth.url).searchParams.get('state');
  await assert.rejects(c.callback('code', state, 'bad'));
  await c.callback('code', state, auth.browserKey);
  await assert.rejects(c.callback('code', state, auth.browserKey));
});
test('HTTP and websocket integration protects controls and delivers demo speech', async t => {
  const { config } = fixture(t); const app = createApp(config);
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); config.port = app.server.address().port;
  t.after(async () => { app.close(); await new Promise(resolve => app.server.close(resolve)); });
  const base = `http://127.0.0.1:${config.port}`;
  const bootstrap = await (await fetch(base + '/api/bootstrap')).json();
  assert.equal(bootstrap.state.paused, true);
  assert.equal((await fetch(base + '/api/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"action":"start"}' })).status, 403);
  const headers = { 'Content-Type': 'application/json', Origin: base, Authorization: `Bearer ${bootstrap.token}` };
  const ws = new WebSocket(`ws://127.0.0.1:${config.port}/events`, { origin: base });
  const frames = []; ws.on('message', raw => frames.push(JSON.parse(raw))); await once(ws, 'open');
  ws.send(JSON.stringify({ type: 'claim', token: bootstrap.token }));
  await fetch(base + '/api/control', { method: 'POST', headers, body: '{"action":"start"}' });
  await fetch(base + '/api/test', { method: 'POST', headers, body: '{"message":"hello"}' });
  for (let i = 0; i < 50 && !frames.find(x => x.type === 'speak'); i++) await new Promise(r => setTimeout(r, 10));
  assert.ok(frames.find(x => x.type === 'speak')?.data.demoSpeech);
  await fetch(base + '/api/control', { method: 'POST', headers, body: '{"action":"stop"}' });
  assert.equal(app.engine.current, null); assert.equal(app.engine.paused, true); ws.close();
});
