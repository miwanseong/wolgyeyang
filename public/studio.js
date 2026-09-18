const $ = id => document.getElementById(id);
let token, ws, state, audioContext, audioSource, audio, analyser, speech, currentId, demoTimer, mouthTimer, reconnectTimer;
let ownsPlayer = false; let wantPlayer = false;
const feedback = message => { $('feedback').textContent = message; };
async function post(route, body) {
  const response = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || data.reason || '요청 실패');
  return data;
}
function render(s) {
  state = s;
  $('mode').textContent = s.mode === 'demo' ? 'DEMO · 무료 테스트' : 'LIVE MODE · API 연결';
  $('notice').textContent = s.mode === 'demo' ? '데모는 정해진 예시 대사와 브라우저 음성을 사용합니다. 실제 AI 응답은 .env에서 live 모드를 선택하세요.' : '실제 AI·음성 API를 사용합니다. 이 화면의 진행 시작은 OBS 송출을 시작하지 않습니다.';
  $('run-state').textContent = s.paused ? '정지' : s.current ? '발화 중' : s.busy ? '생성 중' : '대기 중';
  $('queue').textContent = `대기 ${s.queue}`;
  $('chzzk').textContent = s.chzzk; $('vts').textContent = s.vts;
  $('player').textContent = s.player ? (ownsPlayer ? '이 창에서 재생' : '다른 창에서 재생') : '활성화 필요';
  $('budget').textContent = `${s.budget.turns} / ${s.budget.limit}`;
  $('auto').checked = s.auto;
  $('emotion').textContent = (s.current?.emotion || 'neutral').toUpperCase();
  $('caption').textContent = s.current?.reply || (s.paused ? '방송 진행이 멈춰 있어. 준비되면 다시 불러 줘.' : '네 이야기를 듣고 있어.');
  document.body.classList.toggle('speaking', !!s.current);
  const logs = s.logs; const container = $('messages');
  const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  const signature = logs.map(l => l.id).join(',');
  if (container.dataset.signature !== signature && logs.length) {
    container.dataset.signature = signature; container.replaceChildren();
    for (const log of logs) {
      const div = document.createElement('div'); div.className = `message ${log.type}`;
      const label = document.createElement('small'); label.textContent = `${log.type === 'ai' ? '월계향' : log.type === 'chat' ? '청취자' : '방송국'} · ${new Date(log.at).toLocaleTimeString('ko-KR')}`;
      const p = document.createElement('p'); p.textContent = log.message; div.append(label, p); container.append(div);
    }
    if (nearBottom) container.scrollTop = container.scrollHeight;
  }
}
function send(message) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
function stopAudio() {
  currentId = null; clearTimeout(demoTimer); clearInterval(mouthTimer);
  if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
  if (speech) { speech.onend = null; speech.onerror = null; window.speechSynthesis?.cancel(); speech = null; }
}
function finish(id, ok) {
  if (id !== currentId) return;
  stopAudio(); send({ type: 'done', id, ok });
  if (!ok) feedback('재생 실패: 브라우저 음성 권한과 출력 장치를 확인하고 다시 활성화해 주세요.');
}
async function speak(data) {
  if (!ownsPlayer) return;
  stopAudio(); currentId = data.id; const id = data.id;
  try {
    if (data.audioUrl) {
      await audioContext.resume(); if (id !== currentId) return;
      audio.src = data.audioUrl; audio.onended = () => finish(id, true); audio.onerror = () => finish(id, false);
      await audio.play(); if (id !== currentId) return;
      const values = new Uint8Array(analyser.fftSize);
      mouthTimer = setInterval(() => {
        analyser.getByteTimeDomainData(values);
        const rms = Math.sqrt(values.reduce((sum, x) => sum + ((x - 128) / 128) ** 2, 0) / values.length);
        send({ type: 'mouth', id, value: Math.min(1, rms * 5) });
      }, 70);
    } else if (data.demoSpeech && 'speechSynthesis' in window) {
      speech = new SpeechSynthesisUtterance(data.reply); speech.lang = 'ko-KR'; speech.rate = 1;
      const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ko')); if (voice) speech.voice = voice;
      speech.onend = () => finish(id, true); speech.onerror = () => finish(id, false);
      speechSynthesis.speak(speech); // Demo only: browser voice is not the production character voice.
    } else {
      demoTimer = setTimeout(() => finish(id, true), Math.max(2000, data.reply.length * 90));
    }
  } catch { finish(id, false); }
}
async function connect() {
  try {
    const response = await fetch('/api/bootstrap'); if (!response.ok) throw new Error();
    const bootstrap = await response.json(); token = bootstrap.token; render(bootstrap.state);
    ws = new WebSocket(`ws://${location.host}/events`);
    ws.onopen = () => { feedback('방송국에 연결됐습니다.'); if (wantPlayer) send({ type: 'claim', token }); };
    ws.onmessage = event => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'state') render(data);
      if (type === 'stop') stopAudio();
      if (type === 'speak') void speak(data);
      if (type === 'claimed') { ownsPlayer = data; if (!data) wantPlayer = false;
        $('enable-audio').textContent = data ? '✓ 이 창에서 음성 재생 중' : '① 이 창에서 음성 활성화';
        feedback(data ? '음성이 활성화됐습니다. 진행을 시작해 주세요.' : '다른 창이 음성을 재생 중입니다. 그 창을 닫은 후 다시 눌러 주세요.'); }
    };
    ws.onclose = () => { stopAudio(); ownsPlayer = false; feedback('연결이 끊겼습니다. 재접속 후 진행 시작을 눌러 주세요.'); reconnectTimer = setTimeout(connect, 2000); };
    ws.onerror = () => ws.close();
  } catch { feedback('서버 연결 실패. npm start 실행 상태를 확인해 주세요.'); reconnectTimer = setTimeout(connect, 3000); }
}
$('enable-audio').onclick = async () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext(); audio = new Audio(); analyser = audioContext.createAnalyser(); analyser.fftSize = 512;
      audioSource = audioContext.createMediaElementSource(audio); audioSource.connect(analyser); analyser.connect(audioContext.destination);
    }
    await audioContext.resume(); wantPlayer = true; send({ type: 'claim', token });
  } catch { feedback('브라우저에서 오디오를 시작하지 못했습니다. Chrome/Edge에서 다시 시도해 주세요.'); }
};
for (const [id, action] of [['start','start'],['stop','stop'],['connect-vts','vts'],['connect-chzzk','chzzk']]) $(id).onclick = () => {
  if (action === 'stop') stopAudio();
  post('/api/control', { action }).catch(e => feedback(e.message));
};
$('auto').onchange = event => post('/api/control', { action: 'auto', enabled: event.target.checked }).catch(e => feedback(e.message));
$('authorize').onclick = async () => { try { const { url } = await post('/api/chzzk/auth', {}); location.assign(url); } catch (e) { feedback(e.message); } };
$('chat-form').onsubmit = async event => {
  event.preventDefault(); const message = $('input').value.trim(); if (!message) return;
  try { await post('/api/test', { message }); $('input').value = ''; feedback('대기열에 추가했습니다.'); } catch (e) { feedback(e.message); }
};
window.addEventListener('beforeunload', () => { clearTimeout(reconnectTimer); send({ type: 'release' }); stopAudio(); });
void connect();
