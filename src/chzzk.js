import io from 'socket.io-client';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readJSON, writeJSON } from './store.js';
const BASE = 'https://openapi.chzzk.naver.com';
export function normalizeEvent(kind, raw) {
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!d || typeof d !== 'object') throw new Error('Invalid event');
  if (kind === 'chat') return { kind, userId: d.senderChannelId, nickname: d.profile?.nickname || '시청자', message: d.content,
    id: d.messageTime ? `${d.channelId}:${d.senderChannelId}:${d.messageTime}:${d.content}` : undefined };
  if (kind === 'donation') return { kind, userId: d.donatorChannelId, nickname: d.donatorNickname || '익명의 후원자',
    message: `${String(d.payAmount || '0').slice(0, 15)}원 후원. ${String(d.donationText || '짧게 감사해 줘.').slice(0, 450)}` };
  return { kind: 'subscription', userId: d.subscriberChannelId, nickname: d.subscriberNickname || '시청자',
    message: `${Number(d.month) || 1}개월 구독. 짧게 감사해 줘.` };
}
export class Chzzk {
  constructor(config, onEvent, onStatus) {
    this.config = config; this.onEvent = onEvent; this.onStatus = onStatus;
    this.file = path.join(config.dataDir, 'chzzk-tokens.json'); this.tokens = readJSON(this.file, null);
    this.status = '미연결'; this.pending = new Map(); this.generation = 0; this.retryMs = 2000;
  }
  setStatus(value) { this.status = value; this.onStatus(); }
  authURL() {
    if (!this.config.env.CHZZK_CLIENT_ID || !this.config.env.CHZZK_CLIENT_SECRET) throw new Error('치지직 앱 Client ID와 Secret을 먼저 설정해 주세요.');
    for (const [key, entry] of this.pending) if (Date.now() - entry.at > 300000) this.pending.delete(key);
    if (this.pending.size >= 10) throw new Error('진행 중인 인증이 많습니다. 잠시 후 다시 시도하세요.');
    const state = randomBytes(24).toString('hex'); const browserKey = randomBytes(24).toString('hex');
    this.pending.set(state, { at: Date.now(), browserKey });
    const url = new URL('https://chzzk.naver.com/account-interlock');
    url.search = new URLSearchParams({ clientId: this.config.env.CHZZK_CLIENT_ID,
      redirectUri: this.config.env.CHZZK_REDIRECT_URI || `http://localhost:${this.config.port}/auth/chzzk/callback`, state }).toString();
    return { url: url.toString(), browserKey };
  }
  async token(body) {
    const r = await fetch(`${BASE}/auth/v1/token`, { method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body,
        clientId: this.config.env.CHZZK_CLIENT_ID, clientSecret: this.config.env.CHZZK_CLIENT_SECRET }) });
    if (!r.ok) throw new Error(`치지직 인증 실패 (${r.status})`);
    const payload = await r.json(); const data = payload.content || payload;
    if (!data.accessToken || !data.refreshToken) throw new Error('치지직 인증 응답이 올바르지 않습니다.');
    this.tokens = { ...data, expiresAt: Date.now() + Number(data.expiresIn || 86400) * 1000 };
    writeJSON(this.file, this.tokens);
  }
  async callback(code, state, browserKey) {
    const pending = this.pending.get(state);
    if (!pending || !browserKey || browserKey.length !== pending.browserKey.length ||
        !timingSafeEqual(Buffer.from(browserKey), Buffer.from(pending.browserKey)) || Date.now() - pending.at > 300000) throw new Error('인증 요청이 만료되었거나 브라우저가 일치하지 않습니다. 다시 연결해 주세요.');
    this.pending.delete(state);
    if (typeof code !== 'string' || !code || code.length > 2048) throw new Error('인증 코드가 올바르지 않습니다.');
    await this.token({ grantType: 'authorization_code', code, state });
  }
  async request(route, method = 'GET', params) {
    const url = new URL(BASE + route);
    if (params) url.search = new URLSearchParams(params).toString();
    const r = await fetch(url, { method, signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${this.tokens.accessToken}` } });
    if (!r.ok) throw new Error(`치지직 API 실패 (${r.status})`);
    const data = await r.json(); return data.content ?? data;
  }
  async connect() {
    this.disconnect(); const generation = this.generation;
    if (!this.tokens) { this.setStatus('인증 필요'); return; }
    this.enabled = true; this.setStatus('연결 중');
    try {
      if (this.tokens.expiresAt < Date.now() + 60000) await this.token({ grantType: 'refresh_token', refreshToken: this.tokens.refreshToken });
      if (generation !== this.generation) return;
      const { url } = await this.request('/open/v1/sessions/auth');
      if (generation !== this.generation) return;
      const endpoint = new URL(url);
      if (endpoint.protocol !== 'https:' || !/^ssio\d+\.nchat\.naver\.com$/.test(endpoint.hostname)) throw new Error('치지직 세션 주소를 확인할 수 없습니다.');
      const socket = this.socket = io(url, { transports: ['websocket'], reconnection: false, forceNew: true, timeout: 10000 });
      let subscribed = false;
      this.watchdog = setTimeout(() => this.retry(generation), 15000);
      socket.on('SYSTEM', async raw => {
        if (generation !== this.generation) return;
        try {
          const event = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (event.type === 'revoked') { this.disconnect(); this.setStatus('권한 해제됨 · 다시 인증 필요'); return; }
          if (event.type !== 'connected' || subscribed) return;
          subscribed = true;
          for (const kind of ['chat', 'donation', 'subscription']) {
            await this.request(`/open/v1/sessions/events/subscribe/${kind}`, 'POST', { sessionKey: event.data.sessionKey });
            if (generation !== this.generation) return;
          }
          clearTimeout(this.watchdog); this.retryMs = 2000; this.setStatus('연결됨');
          this.refreshTimer = setTimeout(() => void this.connect(), Math.max(1000, this.tokens.expiresAt - Date.now() - 60000));
        } catch { this.retry(generation); }
      });
      for (const kind of ['chat', 'donation', 'subscription']) socket.on(kind.toUpperCase(), raw => {
        if (generation !== this.generation) return;
        try {
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (this.config.env.CHZZK_CHANNEL_ID && data.channelId !== this.config.env.CHZZK_CHANNEL_ID) return;
          this.onEvent(normalizeEvent(kind, data));
        } catch { /* Ignore malformed upstream events; never speak raw wire data. */ }
      });
      socket.on('disconnect', () => this.retry(generation));
      socket.on('connect_error', () => this.retry(generation));
      socket.on('error', () => this.retry(generation));
    } catch { this.retry(generation); }
  }
  retry(generation) {
    if (generation !== this.generation || !this.enabled || this.retryTimer) return;
    this.setStatus('연결 실패 · 재시도 중 (인증·조회 권한 확인)');
    this.retryTimer = setTimeout(() => { this.retryTimer = null; void this.connect(); }, this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, 60000);
  }
  disconnect() {
    this.enabled = false; this.generation += 1;
    clearTimeout(this.watchdog); clearTimeout(this.refreshTimer); clearTimeout(this.retryTimer); this.retryTimer = null;
    this.socket?.removeAllListeners(); this.socket?.disconnect(); this.socket = null;
    this.setStatus('미연결');
  }
}
