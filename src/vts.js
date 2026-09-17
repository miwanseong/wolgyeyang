import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { readJSON, writeJSON } from './store.js';
export class VTS {
  constructor(config, onStatus) {
    this.config = config; this.onStatus = onStatus; this.status = '미연결'; this.pending = new Map(); this.mouth = 0;
    this.file = path.join(config.dataDir, 'vts-token.json');
    this.identity = { pluginName: 'Wolgyeyang Radio', pluginDeveloper: 'miwanseong' };
    this.hotkeys = JSON.parse(config.env.VTS_HOTKEYS || '{}');
  }
  setStatus(value) { this.status = value; this.onStatus(); }
  request(messageType, data = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) return Promise.reject(new Error('VTS 연결 없음'));
    const requestID = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(requestID); reject(new Error('VTS 응답 시간 초과')); }, messageType === 'AuthenticationTokenRequest' ? 60000 : 5000);
      this.pending.set(requestID, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ apiName: 'VTubeStudioPublicAPI', apiVersion: '1.0', requestID, messageType, data }));
    });
  }
  async connect() {
    if (this.connecting) return;
    this.connecting = true; this.disconnect(); this.setStatus('승인 대기');
    try {
      const url = new URL(this.config.env.VTS_URL || 'ws://127.0.0.1:8001');
      if (url.protocol !== 'ws:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('VTS는 로컬 주소만 지원합니다.');
      const socket = this.socket = new WebSocket(url, { handshakeTimeout: 5000 });
      socket.on('message', raw => {
        try {
          const message = JSON.parse(raw); const p = this.pending.get(message.requestID); if (!p) return;
          clearTimeout(p.timer); this.pending.delete(message.requestID);
          if (message.messageType === 'APIError') p.reject(new Error(`VTS API 오류 ${message.data?.errorID}`)); else p.resolve(message.data);
        } catch { /* Ignore invalid frames. */ }
      });
      socket.on('error', () => this.setStatus('연결 오류 · VTS API 설정 확인'));
      socket.on('close', () => { clearInterval(this.timer); this.setStatus('미연결'); });
      await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
      let token = readJSON(this.file, null)?.token;
      if (!token) {
        token = (await this.request('AuthenticationTokenRequest', this.identity)).authenticationToken;
        writeJSON(this.file, { token });
      }
      const auth = await this.request('AuthenticationRequest', { ...this.identity, authenticationToken: token });
      if (!auth.authenticated) { writeJSON(this.file, { token: null }); throw new Error('VTS 인증 만료 · 다시 연결해 주세요.'); }
      const model = await this.request('CurrentModelRequest');
      this.setStatus(model.modelLoaded ? `연결됨 · ${model.modelName}` : '연결됨 · 모델을 불러오세요');
      this.timer = setInterval(() => this.frame(), 65);
    } catch { this.disconnect(); this.setStatus('연결 실패 · VTS API 활성화/승인 확인 후 다시 연결'); }
    finally { this.connecting = false; }
  }
  async frame() {
    if (this.frameBusy) return;
    this.frameBusy = true;
    try {
      const mouth = Date.now() - (this.mouthAt || 0) > 350 ? 0 : this.mouth;
      await this.request('InjectParameterDataRequest', { faceFound: true, mode: 'set', parameterValues: [
        { id: 'MouthOpen', value: mouth },
      ] });
    } catch { clearInterval(this.timer); this.setStatus('입 파라미터 연결 오류 · 모델 설정 확인'); }
    finally { this.frameBusy = false; }
  }
  setMouth(value) { this.mouth = Math.max(0, Math.min(1, Number(value) || 0)); this.mouthAt = Date.now(); }
  async emotion(emotion) {
    const hotkeyID = this.hotkeys[emotion]; if (!hotkeyID || !this.timer) return;
    try { await this.request('HotkeyTriggerRequest', { hotkeyID }); }
    catch { this.setStatus('표정 핫키 오류 · VTS_HOTKEYS 확인'); }
  }
  disconnect() {
    clearInterval(this.timer); this.timer = null; this.mouth = 0;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('VTS 연결 해제')); }
    this.pending.clear();
    if (this.socket) { this.socket.removeAllListeners(); this.socket.on('error', () => {}); this.socket.terminate(); this.socket = null; }
    this.setStatus('미연결');
  }
}
