import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { ChzzkClient } from 'chzzk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const state = { emotion: 'neutral', emotionScore: 0.5, lastUser: '', lastMessage: '', lastReply: '', connected: false, messages: [] };
let processing = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/state', (_req, res) => res.json(state));

app.post('/api/test', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const nickname = String(req.body?.nickname || '테스트 시청자').trim();
  if (!message) return res.status(400).json({ error: 'message is required' });
  res.json(await handleChat({ nickname, message, source: 'test' }));
});

function pushMessage(item) {
  state.messages.push(item);
  if (state.messages.length > 50) state.messages.shift();
}

async function handleChat({ nickname, message, source = 'chzzk' }) {
  if (processing) return { ok: false, skipped: true, reason: 'AI is processing another message' };
  processing = true;
  state.lastUser = nickname;
  state.lastMessage = message;
  pushMessage({ type: 'chat', nickname, message, source, at: Date.now() });

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: `당신은 치지직에서 방송하는 AI 버튜버다.
시청자에게 실제 방송에서 말할 법한 자연스럽고 짧은 한국어로 대답한다.
불필요하게 설명하거나 길게 말하지 않는다.
캐릭터의 감정도 판단한다.
반드시 JSON 하나만 출력한다. 마크다운 코드블록을 사용하지 않는다.
{"reply":"방송에서 말할 문장","emotion":"neutral|happy|angry|sad|surprised|shy","emotion_score":0.0}
감정 점수는 0.0~1.0이다.`,
      input: `${nickname}: ${message}`
    });

    let data;
    try { data = JSON.parse(response.output_text.trim()); }
    catch { data = { reply: response.output_text.trim(), emotion: 'neutral', emotion_score: 0.5 }; }

    const reply = String(data.reply || '').slice(0, 300);
    const emotion = ['neutral', 'happy', 'angry', 'sad', 'surprised', 'shy'].includes(data.emotion) ? data.emotion : 'neutral';
    const emotionScore = Math.max(0, Math.min(1, Number(data.emotion_score) || 0.5));
    state.emotion = emotion;
    state.emotionScore = emotionScore;
    state.lastReply = reply;
    pushMessage({ type: 'ai', message: reply, emotion, emotionScore, at: Date.now() });

    let audioUrl = null;
    if (process.env.TTS_ENABLED !== 'false') {
      const speech = await openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE || 'marin',
        input: reply,
        instructions: '한국어로 자연스럽고 또렷하게 말한다. 인터넷 방송 진행자처럼 친근하게 말하되 과장된 연기는 하지 않는다.'
      });
      const buffer = Buffer.from(await speech.arrayBuffer());
      const fs = await import('node:fs/promises');
      const dir = path.join(__dirname, 'public', 'audio');
      await fs.mkdir(dir, { recursive: true });
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
      await fs.writeFile(path.join(dir, id), buffer);
      audioUrl = `/audio/${id}`;
    }
    return { ok: true, reply, emotion, emotionScore, audioUrl };
  } catch (error) {
    console.error(error);
    return { ok: false, error: error.message };
  } finally { processing = false; }
}

async function connectChzzk() {
  const channelId = process.env.CHZZK_CHANNEL_ID;
  if (!channelId) { console.log('[CHZZK] channel ID not configured'); return; }
  const options = {};
  if (process.env.CHZZK_NID_AUT && process.env.CHZZK_NID_SES) {
    options.nidAuth = process.env.CHZZK_NID_AUT;
    options.nidSession = process.env.CHZZK_NID_SES;
  }
  const client = new ChzzkClient(options);
  const chat = client.chat({ channelId, pollInterval: 30_000 });
  chat.on('connect', (chatChannelId) => {
    state.connected = true;
    console.log(`[CHZZK] connected: ${chatChannelId}`);
    chat.requestRecentChat(30);
  });
  chat.on('reconnect', (chatChannelId) => { state.connected = true; console.log(`[CHZZK] reconnected: ${chatChannelId}`); });
  chat.on('disconnect', () => { state.connected = false; console.log('[CHZZK] disconnected'); });
  chat.on('chat', async (item) => {
    if (item.hidden || !item.message?.trim()) return;
    await handleChat({ nickname: item.profile?.nickname || '시청자', message: item.message });
  });
  chat.on('donation', async (item) => {
    const nickname = item.profile?.nickname || '익명의 후원자';
    const amount = item.extras?.payAmount || 0;
    const message = item.message || '';
    await handleChat({ nickname, message: `${amount}원 후원. ${message || '감사 인사를 해줘.'}`, source: 'donation' });
  });
  chat.on('subscription', async (item) => {
    const nickname = item.profile?.nickname || '시청자';
    await handleChat({ nickname, message: `${item.extras?.month || 1}개월 구독했어. 감사 인사를 해줘.`, source: 'subscription' });
  });
  try { await chat.connect(); }
  catch (error) { state.connected = false; console.error('[CHZZK] connection failed:', error.message); }
}

app.listen(port, async () => { console.log(`AI VTuber server: http://localhost:${port}`); await connectChzzk(); });
