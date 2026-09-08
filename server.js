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

const state = {
  emotion: 'neutral',
  emotionScore: 0.5,
  lastUser: '',
  lastMessage: '',
  lastReply: '',
  connected: false,
  messages: []
};

let chzzkChat = null;
let processing = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/state', (_req, res) => {
  res.json(state);
});

app.post('/api/test', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const nickname = String(req.body?.nickname || '테스트 시청자').trim();

  if (!message) return res.status(400).json({ error: 'message is required' });
  const result = await handleChat({ nickname, message, source: 'test' });
  res.json(result);
});

function pushMessage(item) {
  state.messages.push(item);
  if (state.messages.length > 50) state.messages.shift();
}

async function handleChat({ nickname, message, source = 'chzzk' }) {
  if (processing) {
    return { ok: false, skipped: true, reason: 'AI is processing another message' };
  }

  processing = true;
  state.lastUser = nickname;
  state.lastMessage = message;
  pushMessage({ type: 'chat', nickname, message, source, at: Date.now() });

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: `당신은 치지직에서 방송하는 AI 버튜버다.
시청자에게 자연스럽고 짧게 대답한다. 너무 긴 답변은 하지 않는다.
캐릭터의 감정 상태도 함께 결정한다.
반드시 아래 JSON 하나만 출력한다. 마크다운 코드블록을 사용하지 않는다.
{"reply":"방송에서 말할 문장","emotion":"neutral|happy|angry|sad|surprised|shy","emotion_score":0.0}
감정 점수는 0.0~1.0이다. reply는 한국어로 작성한다.`,
      input: `${nickname}: ${message}`
    });

    let data;
    try {
      data = JSON.parse(response.output_text.trim());
    } catch {
      data = {
        reply: response.output_text.trim(),
        emotion: 'neutral',
        emotion_score: 0.5
      };
    }

    const reply = String(data.reply || '').slice(0, 300);
    const emotion = ['neutral', 'happy', 'angry', 'sad', 'surprised', 'shy'].includes(data.emotion)
      ? data.emotion
      : 'neutral';
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
        instructions: '한국어로 자연스럽고 또렷하게 말한다. 밝고 친근한 인터넷 방송 진행자 톤. 과장된 연기 금지.'
      });
      const buffer = Buffer.from(await speech.arrayBuffer());
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
      const fs = await import('node:fs/promises');
      await fs.mkdir(path.join(__dirname, 'public', 'audio'), { recursive: true });
      await fs.writeFile(path.join(__dirname, 'public', 'audio', id), buffer);
      audioUrl = `/audio/${id}`;
    }

    return { ok: true, reply, emotion, emotionScore, audioUrl };
  } catch (error) {
    console.error(error);
    return { ok: false, error: error.message };
  } finally {
    processing = false;
  }
}

async function connectChzzk() {
  const channelId = process.env.CHZZK_CHANNEL_ID;
  if (!channelId) {
    console.log('[CHZZK] CHZZK_CHANNEL_ID가 없어 채팅 연결을 건너뜁니다.');
    return;
  }

  const options = {};
  if (process.env.CHZZK_NID_AUT && process.env.CHZZK_NID_SES) {
    options.nidAuth = process.env.CHZZK_NID_AUT;
    options.nidSession = process.env.CHZZK_NID_SES;
  }

  const client = new ChzzkClient(options);
  chzzkChat = client.chat({ channelId, pollInterval: 30_000 });

  chzzkChat.on('connect', () => {
    state.connected = true;
    console.log('[CHZZK] connected');
    chzzkChat.requestRecentChat(30);
  });

  chzzkChat.on('reconnect', () => {
    state.connected = true;
    console.log('[CHZZK] reconnected');
  });

  chzzkChat.on('disconnect', () => {
    state.connected = false;
    console.log('[CHZZK] disconnected');
  });

  chzzkChat.on('chat', async (chat) => {
    if (chat.hidden) return;
    const nickname = chat.profile?.nickname || '시청자';
    const message = chat.message || '';
    if (!message.trim()) return;
    await handleChat({ nickname, message });
  });

  chzzkChat.on('donation', async (donation) => {
    const nickname = donation.profile?.nickname || '시청자';
    const amount = donation.extras?.payAmount || 0;
    const message = donation.message || '';
    await handleChat({
      nickname,
      message: message ? `${amount}원 후원. 메시지: ${message}` : `${amount}원 후원했어. 감사 인사를 해줘.`,
      source: 'donation'
    });
  });

  try {
    await chzzkChat.connect();
  } catch (error) {
    state.connected = false;
    console.error('[CHZZK] connection failed:', error.message);
  }
}

app.listen(port, async () => {
  console.log(`AI VTuber server: http://localhost:${port}`);
  await connectChzzk();
});
