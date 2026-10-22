export const TRACKS = {
  main: "dread_hall.wav",
  lobby: "dread_hall.wav",
  home: "dread_rooms.wav",
  memory: "dread_rooms.wav",
  warm: "dread_rooms.wav",
  basement: "dread_depths.wav",
  upper: "dread_depths.wav",
  deduction: "dread_rooms.wav",
  evidence: "dread_rooms.wav",
  missing: "dread_depths.wav",
  motif: "dread_depths.wav",
  hunt: "hunt_search.wav",
  chase: "hunt_pursuit.wav",
  panic: "dread_depths.wav",
  aftermath: "bgm_atfermath.mp3",
  relief: "dread_hall.wav",
  reliefAlt: "bgm_relief_alt.mp3",
};
export const EFFECTS = {
  giggle: "fx_female_giggle.wav",
  puzzleSlide: "fx_puzzle_slide.wav",
  puzzleTurn: "fx_puzzle_turn.wav",
  paper: "fx_paper.wav",
  pen: "fx_pen.wav",
  stamp: "fx_stamp.wav",
  apparition: "fx_apparition.wav",
  scrape: "fx_ghost_scrape.wav",
  rush: "fx_ghost_rush.wav",
  flashlightOn: "fx_flashlight_on.wav",
  flashlightOff: "fx_flashlight_off.wav",
  item: "fx_item.wav",
  drawer: "fx_drawer.wav",
  save: "fx_save.wav",
  capture: "fx_capture.wav",
  door: "audiosfx_door_open.mp3",
  thud: "audiosfx_thud.mp3",
  glass: "sfx_glass_breaking.mp3",
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
      now = this.ctx.currentTime,
      fade = ["hunt","chase"].includes(cue) ? 0.12 : 1.2;
    const el = new Audio("assets/audio/" + TRACKS[cue] + new URL(import.meta.url).search);
    el.loop = true;
    el.preload = "auto";
    const source = this.ctx.createMediaElementSource(el),
      gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + fade);
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
      oldGain.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => {
        old.pause();
        old.removeAttribute("src");
        old.load();
        oldGain.disconnect();
      }, fade*1000+100);
    }
  }
  async effect(name, level=1) {
    if (!this.ctx || !this.enabled || !EFFECTS[name]) return;
    try {
      let buffer = this.buffers.get(name);
      if (!buffer) {
        const r = await fetch("assets/audio/" + EFFECTS[name] + new URL(import.meta.url).search);
        if (!r.ok) throw Error(r.status);
        buffer = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.buffers.set(name, buffer);
      }
      const s = this.ctx.createBufferSource();
      s.buffer = buffer;
      const gain=this.ctx.createGain();gain.gain.value=Math.max(0,Math.min(1,level));
      s.connect(gain).connect(this.fxBus);
      s.onended=()=>gain.disconnect();
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
