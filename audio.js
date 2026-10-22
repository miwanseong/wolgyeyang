export const TRACKS = {
  main: "bgm_main.mp3",
  lobby: "bgm_unease.mp3",
  home: "bgm_cabin.mp3",
  memory: "bgm_memory.mp3",
  warm: "bgm_warm_memory.mp3",
  basement: "bgm_uncanny.mp3",
  upper: "audiobgm_urban_pulse.mp3",
  deduction: "bgm_deduction.mp3",
  evidence: "bgm_evidence.mp3",
  missing: "audiobgm_missing_key.mp3",
  motif: "audiobgm_uncanny_motif.mp3",
  chase: "bgm_violin_dread.mp3",
  panic: "bgm_flustered.mp3",
  aftermath: "bgm_atfermath.mp3",
  relief: "bgm_relief.mp3",
  reliefAlt: "bgm_relief_alt.mp3",
};
const EFFECTS = {
  door: "audiosfx_door_open.mp3",
  thud: "audiosfx_thud.mp3",
  glass: "sfx_glass_breaking.mp3",
  shutter: "sfx_camera_shutter.mp3",
};
export class AudioDirector {
  constructor(onError = () => {}) {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.65;
    this.musicLevel = 0.62;
    this.fxLevel = 0.9;
    this.cue = null;
    this.element = null;
    this.currentGain = null;
    this.errors = onError;
    this.buffers = new Map();
    this.stepIndex = 0;
    this.playedEffects = 0;
    this.lastError = "";
    this.token = 0;
  }
  async start(cue = "main") {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.musicBus = this.ctx.createGain();
      this.fxBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicLevel;
      this.fxBus.gain.value = this.fxLevel;
      this.musicBus.connect(this.master);
      this.fxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.analyser = this.ctx.createAnalyser();
      this.master.connect(this.analyser);
      this.analyser.fftSize = 256;
    }
    await this.ctx.resume();
    this.enabled = true;
    this.apply();
    this.play(cue);
  }
  apply() {
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.05,
      );
    if (this.musicBus)
      this.musicBus.gain.setTargetAtTime(
        this.musicLevel,
        this.ctx.currentTime,
        0.05,
      );
    if (this.fxBus)
      this.fxBus.gain.setTargetAtTime(this.fxLevel, this.ctx.currentTime, 0.05);
  }
  error(message) {
    if (this.lastError === message) return;
    this.lastError = message;
    this.errors(message);
  }
  play(cue) {
    if (!TRACKS[cue] || cue === this.cue || !this.ctx) return;
    this.cue = cue;
    const old = this.element,
      oldGain = this.currentGain,
      now = this.ctx.currentTime;
    const el = new Audio("assets/audio/" + TRACKS[cue]);
    el.loop = true;
    el.preload = "auto";
    const source = this.ctx.createMediaElementSource(el),
      gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 1.2);
    source.connect(gain).connect(this.musicBus);
    this.element = el;
    this.currentGain = gain;
    el.addEventListener(
      "error",
      () => this.error("배경음 파일을 재생하지 못했습니다: " + TRACKS[cue]),
      { once: true },
    );
    el.play().catch((e) => {
      if (el === this.element && e.name !== "AbortError")
        this.error("소리 재생 버튼을 다시 눌러 주세요. " + e.name);
    });
    if (old) {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + 1.1);
      setTimeout(() => {
        old.pause();
        old.removeAttribute("src");
        old.load();
        source;
        oldGain.disconnect();
      }, 1300);
    }
  }
  async effect(name) {
    if (!this.ctx || !this.enabled || !EFFECTS[name]) return;
    try {
      let buffer = this.buffers.get(name);
      if (!buffer) {
        const r = await fetch("assets/audio/" + EFFECTS[name]);
        if (!r.ok) throw Error(r.status);
        buffer = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.buffers.set(name, buffer);
      }
      const s = this.ctx.createBufferSource();
      s.buffer = buffer;
      s.connect(this.fxBus);
      s.start();
      this.playedEffects++;
    } catch {
      this.error("효과음을 불러오지 못했습니다: " + name);
    }
  }
  step(surface, running) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx,
      rate = c.sampleRate,
      length = Math.floor(rate * 0.11),
      b = c.createBuffer(1, length, rate),
      data = b.getChannelData(0);
    let sample = 0;
    for (let i = 0; i < length; i++) {
      sample = sample * 0.62 + (Math.random() * 2 - 1) * 0.38;
      data[i] =
        sample *
        Math.exp(-i / (length * 0.16)) *
        (surface === "wood" ? 0.75 : 1);
    }
    const source = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    source.buffer = b;
    filter.type = "lowpass";
    filter.frequency.value = surface === "wood" ? 850 : 1900;
    gain.gain.value = running ? 0.75 : 0.48;
    source.playbackRate.value = 0.88 + (this.stepIndex++ % 3) * 0.11;
    source.connect(filter).connect(gain).connect(this.fxBus);
    source.start();
    this.playedEffects++;
    const o = c.createOscillator(),
      g = c.createGain();
    o.frequency.value = surface === "wood" ? 115 : 73;
    g.gain.setValueAtTime(running ? 0.25 : 0.13, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
    o.connect(g).connect(this.fxBus);
    o.start();
    o.stop(c.currentTime + 0.1);
  }
  heartbeat() {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    for (const offset of [0, 0.16]) {
      const o = c.createOscillator(),
        g = c.createGain();
      o.frequency.value = 47;
      g.gain.setValueAtTime(0.001, c.currentTime + offset);
      g.gain.linearRampToValueAtTime(0.16, c.currentTime + offset + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + 0.13);
      o.connect(g).connect(this.fxBus);
      o.start(c.currentTime + offset);
      o.stop(c.currentTime + offset + 0.15);
    }
  }
  get energy() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data.reduce((s, n) => s + Math.abs(n - 128), 0) / data.length;
  }
}
