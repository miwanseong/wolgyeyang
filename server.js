import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { configFromEnv } from './src/config.js';
import { Budget } from './src/store.js';
import { createProviders } from './src/providers.js';
import { Engine } from './src/engine.js';
import { Chzzk } from './src/chzzk.js';
import { VTS } from './src/vts.js';
import { persona } from './src/persona.js';
if (existsSync('.env')) loadEnvFile('.env');
const root = path.dirname(fileURLToPath(import.meta.url));
export function createApp(config = configFromEnv(), overrides = {}) {
  const app = express(); const server = http.createServer(app);
  const controlToken = randomBytes(32).toString('hex');
  const engine = new Engine(config, overrides.providers || createProviders(config), overrides.budget || new Budget(path.join(config.dataDir, 'budget.json'), config.dailyLimit));
  let chzzk, vts;
  const state = () => ({ ...engine.snapshot(), persona, chzzk: chzzk?.status || '미연결', vts: vts?.status || '미연결' });
  const broadcast = (type, data) => { for (const ws of wss.clients) if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, data })); };
  const update = () => broadcast('state', state());
  const allowedHost = host => [`localhost:${config.port}`, `127.0.0.1:${config.port}`, `[::1]:${config.port}`].includes(host);
  const allowedOrigin = origin => [`http://localhost:${config.port}`, `http://127.0.0.1:${config.port}`, `http://[::1]:${config.port}`].includes(origin);
  const validToken = token => typeof token === 'string' && token.length === controlToken.length && timingSafeEqual(Buffer.from(token), Buffer.from(controlToken));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    if (!allowedHost(req.headers.host)) return res.status(403).json({ error: 'Local host required' });
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self' blob:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; frame-ancestors 'none'" });
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) res.set('Cache-Control', 'no-store');
    if (req.headers['sec-fetch-site'] === 'cross-site' && req.path !== '/auth/chzzk/callback') return res.status(403).end();
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET') return next();
    if (!allowedOrigin(req.headers.origin) || !validToken(req.headers.authorization?.replace(/^Bearer /, ''))) return res.status(403).json({ error: '운영 화면에서 다시 시도해 주세요.' });
    next();
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/events' || !allowedHost(req.headers.host) || !allowedOrigin(req.headers.origin)) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  chzzk = new Chzzk(config, event => engine.ingest(event), update);
  vts = new VTS(config, update);
  engine.on('state', update);
  engine.on('stop', () => { vts.setMouth(0); broadcast('stop'); });
  engine.on('mouth', n => vts.setMouth(n));
  engine.on('utterance', utterance => {
    void vts.emotion(utterance.emotion);
    engine.player?.send(JSON.stringify({ type: 'speak', data: utterance }));
  });
  wss.on('connection', ws => {
    ws.alive = true; ws.on('pong', () => { ws.alive = true; });
    ws.send(JSON.stringify({ type: 'state', data: state() }));
    ws.on('message', raw => {
      try {
        const m = JSON.parse(raw);
        if (m.type === 'claim' && validToken(m.token)) ws.send(JSON.stringify({ type: 'claimed', data: engine.claim(ws) }));
        if (m.type === 'release') engine.release(ws);
        if (m.type === 'done') engine.ack(ws, m.id, m.ok === true);
        if (m.type === 'mouth' && ws === engine.player && engine.current && m.id === engine.current.id && Date.now() - (ws.mouthAt || 0) > 55) {
          ws.mouthAt = Date.now(); vts.setMouth(m.value);
        }
      } catch { /* Malformed local frames are ignored. */ }
    });
    ws.on('close', () => engine.release(ws));
    ws.on('error', () => engine.release(ws));
  });
  app.get('/api/bootstrap', (_req, res) => res.json({ token: controlToken, state: state() }));
  app.get('/api/state', (_req, res) => res.json(state()));
  app.post('/api/test', (req, res) => res.json(engine.ingest({ kind: 'chat', nickname: '테스트 청취자', message: req.body?.message })));
  app.post('/api/control', (req, res) => {
    switch (req.body?.action) {
      case 'start': engine.start(); break;
      case 'stop': engine.stop(); break;
      case 'auto': engine.setAuto(req.body.enabled === true); break;
      case 'vts': void vts.connect(); break;
      case 'chzzk': if (config.mode !== 'live') return res.status(400).json({ error: '실제 채팅 연결은 APP_MODE=live에서 사용할 수 있습니다.' }); void chzzk.connect(); break;
      default: return res.status(400).json({ error: '알 수 없는 동작입니다.' });
    }
    res.json({ ok: true });
  });
  app.post('/api/chzzk/auth', (_req, res) => {
    try {
      const { url, browserKey } = chzzk.authURL();
      res.cookie('chzzk_auth', browserKey, { httpOnly: true, sameSite: 'lax', maxAge: 300000, path: '/auth/chzzk/callback' });
      res.json({ url });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
  app.get('/auth/chzzk/callback', async (req, res) => {
    const cookie = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('chzzk_auth='))?.slice(11);
    try { await chzzk.callback(req.query.code, req.query.state, cookie); res.clearCookie('chzzk_auth', { path: '/auth/chzzk/callback' }); res.redirect('/?authorized=1'); }
    catch { res.status(400).type('text').send('치지직 인증 실패. 운영 화면에서 다시 인증해 주세요.'); }
  });
  app.get('/audio/:file', (req, res) => {
    const match = /^([0-9a-f-]{36})\.mp3$/.exec(req.params.file); const audio = match && engine.audio.get(match[1]);
    if (!audio) return res.status(404).end(); res.set('Cache-Control', 'no-store').type('audio/mpeg').send(audio);
  });
  app.use(express.static(path.join(root, 'public')));
  app.use((err, _req, res, _next) => res.status(err.status === 413 ? 413 : 400).json({ error: '요청을 처리할 수 없습니다.' }));
  const tick = setInterval(() => engine.tick(), 1000);
  const heartbeat = setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } } }, 10000);
  const close = () => { clearInterval(tick); clearInterval(heartbeat); engine.close(); chzzk.disconnect(); vts.disconnect(); for (const ws of wss.clients) ws.terminate(); wss.close(); };
  return { app, server, engine, chzzk, vts, close };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = configFromEnv(); const instance = createApp(config);
  instance.server.listen(config.port, '127.0.0.1', () => console.log(`월계향 방송국 (${config.mode}) · http://localhost:${config.port}`));
  instance.server.on('error', () => { console.error('서버를 시작할 수 없습니다. 포트 중복 및 .env 설정을 확인하세요.'); instance.close(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { instance.close(); instance.server.close(); });
}

