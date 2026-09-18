import { EventEmitter } from 'node:events';
import { randomUUID, createHash } from 'node:crypto';
import { topics } from './persona.js';
export class Engine extends EventEmitter {
  constructor(config, providers, budget, now = Date.now) {
    super(); Object.assign(this, { config, providers, budget, now });
    this.paused = true; this.auto = false; this.busy = false; this.player = null;
    this.queue = []; this.history = []; this.logs = []; this.seen = new Map(); this.users = new Map();
    this.current = null; this.audio = new Map(); this.lastActivity = now(); this.topic = 0; this.priorityRun = 0;
  }
  snapshot() {
    return { mode: this.config.mode, tts: this.config.mode === 'demo' ? 'browser-demo' : this.config.tts,
      paused: this.paused, auto: this.auto, busy: this.busy, player: !!this.player,
      queue: this.queue.length, current: this.current, logs: this.logs, budget: this.budget.snapshot() };
  }
  changed() { this.emit('state', this.snapshot()); }
  log(type, message) {
    this.logs.push({ id: randomUUID(), type, message, at: this.now() });
    this.logs = this.logs.slice(-60); this.changed();
  }
  ingest(raw) {
    if (this.paused) return { ok: false, reason: '진행이 정지되어 있습니다.' };
    const kind = ['chat', 'donation', 'subscription', 'idle'].includes(raw.kind) ? raw.kind : 'chat';
    const nickname = String(raw.nickname || '시청자').replace(/[\x00-\x1f]/g, '').slice(0, 40);
    const message = String(raw.message || '').trim();
    if (!message || message.length > 500) return { ok: false, reason: '메시지는 1~500자로 입력해 주세요.' };
    const now = this.now();
    for (const map of [this.seen, this.users]) for (const [key, stamp] of map) if (now - stamp > 120000) map.delete(key);
    const key = raw.id ? `${kind}:${raw.id}` : kind === 'chat' ? createHash('sha256').update(`${raw.userId || nickname}:${message}`).digest('hex') : null;
    if (key && this.seen.has(key)) return { ok: false, reason: '중복 메시지입니다.' };
    const user = String(raw.userId || nickname);
    if (kind === 'chat' && this.users.has(user) && now - this.users.get(user) < this.config.cooldownMs) return { ok: false, reason: '잠시 후 다시 입력해 주세요.' };
    if (this.queue.length >= this.config.queueLimit) return { ok: false, reason: '대기열이 가득 찼습니다.' };
    if (this.seen.size > 5000) this.seen.delete(this.seen.keys().next().value);
    if (this.users.size > 5000) this.users.delete(this.users.keys().next().value);
    if (key) this.seen.set(key, now);
    if (kind === 'chat') this.users.set(user, now);
    this.queue.push({ id: randomUUID(), kind, nickname, message, at: now });
    this.lastActivity = now;
    if (kind !== 'idle') this.log('chat', `${nickname}: ${message}`);
    else this.changed();
    void this.pump();
    return { ok: true, queued: true };
  }
  claim(player) {
    if (this.player && this.player !== player) return false;
    this.player = player; this.changed(); void this.pump(); return true;
  }
  release(player) {
    if (this.player !== player) return;
    this.player = null; this.stop('음성 재생 화면 연결이 끊어져 진행을 정지했습니다.');
  }
  start() { this.paused = false; this.lastActivity = this.now(); this.changed(); void this.pump(); }
  stop(reason = '진행을 정지했습니다.') {
    this.paused = true; this.queue = []; this.abort?.abort();
    clearTimeout(this.playbackTimer); this.current = null;
    this.emit('stop'); this.log('system', reason);
  }
  setAuto(value) { this.auto = value; this.lastActivity = this.now(); this.changed(); }
  tick() {
    if (!this.paused && this.player && !this.busy && !this.current && !this.queue.length && this.auto && this.now() - this.lastActivity >= this.config.idleMs) {
      this.ingest({ kind: 'idle', nickname: '진행 큐', message: topics[this.topic++ % topics.length] });
    }
    void this.pump();
  }
  ack(player, id, success) {
    if (player !== this.player || !this.current || this.current.id !== id) return false;
    clearTimeout(this.playbackTimer);
    if (!success) { this.stop('음성 재생에 실패했습니다. 음성 활성화와 출력 장치를 확인해 주세요.'); return true; }
    this.history.push({ event: this.current.event, reply: this.current.reply }); this.history = this.history.slice(-8);
    this.current = null; this.lastActivity = this.now(); this.emit('mouth', 0); this.changed(); void this.pump(); return true;
  }
  async pump() {
    if (this.paused || !this.player || this.busy || this.current) return;
    this.queue = this.queue.filter(e => this.now() - e.at < this.config.maxAgeMs);
    // At most three priority events in a row when ordinary chat is waiting.
    let index = this.priorityRun < 3 ? this.queue.findIndex(e => ['donation', 'subscription'].includes(e.kind)) : this.queue.findIndex(e => e.kind === 'chat');
    if (index < 0) index = 0;
    const event = this.queue.splice(index, 1)[0];
    if (!event) return;
    this.priorityRun = ['donation', 'subscription'].includes(event.kind) ? this.priorityRun + 1 : 0;
    this.busy = true; const controller = new AbortController(); this.abort = controller; this.changed();
    try {
      if (this.config.mode === 'live') this.budget.reserve();
      const result = await this.providers.reply(event, this.history, controller.signal);
      if (controller.signal.aborted || this.paused) return;
      const audio = await this.providers.speech(result.reply, controller.signal);
      if (controller.signal.aborted || this.paused || !this.player) return;
      const id = randomUUID();
      if (audio) { this.audio.set(id, audio); while (this.audio.size > 5) this.audio.delete(this.audio.keys().next().value); }
      this.current = { id, ...result, event, audioUrl: audio ? `/audio/${id}.mp3` : null,
        demoSpeech: this.config.mode === 'demo', startedAt: this.now() };
      this.log('ai', result.reply); this.emit('utterance', this.current);
      this.playbackTimer = setTimeout(() => this.stop('재생 완료 신호가 없어 진행을 정지했습니다.'), this.config.playbackTimeoutMs);
    } catch (error) {
      if (!controller.signal.aborted) this.log('error', error.status ? `외부 API 요청 실패 (${error.status}). 인증/한도를 확인하세요.` : safeError(error));
      this.lastActivity = this.now();
    } finally {
      this.busy = false; this.changed();
      if (!this.current && !this.paused) setTimeout(() => void this.pump(), 1000).unref();
    }
  }
  close() { this.stop(); this.removeAllListeners(); }
}
function safeError(error) {
  // Provider bodies can contain request text or keys; surface only our Korean messages.
  return /^[가-힣]/.test(error.message || '') ? error.message.slice(0, 150) : '외부 서비스 처리에 실패했습니다. 설정과 연결을 확인해 주세요.';
}
