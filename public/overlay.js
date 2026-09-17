function connect() {
  const ws = new WebSocket(`ws://${location.host}/events`);
  ws.onmessage = event => { const { type, data } = JSON.parse(event.data);
    if (type === 'state') { document.getElementById('subtitle').hidden = !data.current || data.paused; document.getElementById('line').textContent = data.current?.reply || ''; }
    if (type === 'stop') document.getElementById('subtitle').hidden = true;
  };
  ws.onclose = () => { document.getElementById('subtitle').hidden = true; setTimeout(connect, 2000); };
  ws.onerror = () => ws.close();
}
connect();
