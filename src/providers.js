import { emotions, instructions, persona } from './persona.js';
export function validateReply(data) {
  if (!data || typeof data.reply !== 'string' || !data.reply.trim() || data.reply.length > 180 ||
      !emotions.includes(data.emotion) || !Number.isFinite(data.emotion_score) || data.emotion_score < 0 || data.emotion_score > 1) {
    throw new Error('AI 응답 형식이 올바르지 않아 발화를 중단했습니다.');
  }
  return { reply: data.reply.trim(), emotion: data.emotion, emotionScore: data.emotion_score };
}
export function createProviders(config) {
  const env = config.env;
  async function ai(route, body, signal, audio = false) {
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.startsWith('your_')) throw new Error('OPENAI_API_KEY를 .env에 설정해 주세요.');
    const response = await fetch(`https://api.openai.com/v1/${route}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.any([signal, AbortSignal.timeout(25000)].filter(Boolean))
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Object.assign(new Error('OpenAI request failed'), { status: response.status });
    }
    return audio ? Buffer.from(await response.arrayBuffer()) : response.json();
  }
  let demoIndex = 0;
  return {
    async reply(event, history, signal) {
      if (config.mode === 'demo') {
        const lines = [persona.greeting, '흰 눈이 무섭다고? 나는 화면 밝기를 걱정했는데. 조금 낮춰 둘까.',
          '이건 내가 만든 이야기야. 어제 꺼 둔 라디오가 오늘 아침에 혼자 인사를 하더라. 문제는 아직 전원선을 안 샀다는 거야.',
          '오늘은 유난히 조용하네. 이런 날은 건반에서 손을 떼는 순간까지 들릴 것 같아.'];
        const reply = event.kind === 'donation' ? '후원 고마워. 오늘 방송국 불은 조금 더 켜 둘 수 있겠네.' : lines[demoIndex++ % lines.length];
        return { reply, emotion: event.kind === 'donation' ? 'happy' : 'neutral', emotionScore: 0.35 };
      }
      // Moderation covers all viewer-controlled text, including display names.
      if (event.kind !== 'idle') {
        const check = await ai('moderations', { model: 'omni-moderation-latest', input: `${event.nickname}\n${event.message}` }, signal);
        if (!check.results?.length || check.results.some(r => r.flagged)) throw new Error('검토가 필요한 채팅을 건너뛰었습니다.');
      }
      const response = await ai('responses', {
        model: config.model, store: false, instructions, max_output_tokens: 800,
        input: [...history.slice(-8).flatMap(h => [
          { role: 'user', content: JSON.stringify(h.event) }, { role: 'assistant', content: h.reply }
        ]), { role: 'user', content: JSON.stringify(event) }],
        text: { format: { type: 'json_schema', name: 'vtuber_reply', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['reply', 'emotion', 'emotion_score'],
          properties: { reply: { type: 'string' }, emotion: { type: 'string', enum: emotions }, emotion_score: { type: 'number' } }
        } } }
      }, signal);
      if (response.status !== 'completed') throw new Error('AI 응답이 완료되지 않았습니다.');
      const result = validateReply(JSON.parse((response.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text).join('')));
      const check = await ai('moderations', { model: 'omni-moderation-latest', input: result.reply }, signal);
      if (!check.results?.length || check.results.some(r => r.flagged)) throw new Error('검토가 필요한 AI 발화를 차단했습니다.');
      return result;
    },
    async speech(text, signal) {
      if (config.mode === 'demo' || config.tts === 'none') return null;
      if (config.tts === 'openai') {
        return ai('audio/speech', { model: env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
          voice: env.OPENAI_TTS_VOICE || 'marin', input: text,
          instructions: '젊은 성인 여성의 차분하고 또렷한 한국어. 낮은 강도의 자연스러운 대화. 속삭임이나 과장된 애교 없이.' }, signal, true);
      }
      if (!env.NAVER_TTS_CLIENT_ID || !env.NAVER_TTS_CLIENT_SECRET) throw new Error('네이버 TTS 인증 정보를 .env에 설정해 주세요.');
      const response = await fetch('https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
        method: 'POST', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
        headers: { 'X-NCP-APIGW-API-KEY-ID': env.NAVER_TTS_CLIENT_ID, 'X-NCP-APIGW-API-KEY': env.NAVER_TTS_CLIENT_SECRET,
          'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ speaker: env.NAVER_TTS_SPEAKER || 'nara', text, format: 'mp3', speed: '0', pitch: '0', volume: '0' })
      });
      if (!response.ok) throw new Error(`네이버 TTS 요청 실패 (${response.status})`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 100 || buffer.length > 5_000_000) throw new Error('TTS 오디오 크기가 올바르지 않습니다.');
      return buffer;
    }
  };
}

