import path from 'node:path';
export function configFromEnv(env = process.env) {
  const number = (name, fallback, min, max) => {
    const n = Number(env[name] ?? fallback);
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name}: ${min}~${max} 사이 숫자가 필요합니다.`);
    return n;
  };
  const mode = env.APP_MODE || 'demo';
  if (!['demo', 'live'].includes(mode)) throw new Error('APP_MODE must be demo or live');
  const tts = env.TTS_ENABLED === 'false' ? 'none' : (env.TTS_PROVIDER || 'naver');
  if (!['naver', 'openai', 'none'].includes(tts)) throw new Error('Invalid TTS_PROVIDER');
  return { mode, tts, port: number('PORT', 3000, 1024, 65535),
    model: env.OPENAI_MODEL || 'gpt-5.6-luna',
    idleMs: number('IDLE_SECONDS', 45, 15, 3600) * 1000,
    dailyLimit: number('DAILY_TURN_LIMIT', 200, 1, 10000),
    cooldownMs: number('USER_COOLDOWN_SECONDS', 4, 0, 120) * 1000,
    queueLimit: 30, maxAgeMs: 90000, playbackTimeoutMs: 60000,
    dataDir: path.resolve(env.DATA_DIR || '.runtime'), env };
}
