export function travelSound(portal){return portal?.kind==='stairs'?null:'door';}
export const TRACKS = {
  main: "user_creepy_soundscape.mp3",
  lobby: "user_creepy_soundscape.mp3",
  home: "user_creepy_soundscape.mp3",
  memory: "dread_rooms.wav",
  warm: "dread_rooms.wav",
  basement: "dread_depths.wav",
  upper: "dread_depths.wav",
  deduction: "user_creepy_soundscape.mp3",
  evidence: "user_creepy_soundscape.mp3",
  missing: "dread_depths.wav",
  motif: "dread_depths.wav",
  hunt: "hunt_search.wav",
  chase: "hunt_pursuit.wav",
  panic: "dread_depths.wav",
  aftermath: "bgm_atfermath.mp3",
  relief: "dread_hall.wav",
  reliefAlt: "bgm_relief_alt.mp3",
};
export const FOOTSTEP_GROUPS={wood:['stepWood0','stepWood1','stepWood2','stepWood3'],carpet:['stepCarpet0','stepCarpet1','stepCarpet2','stepCarpet3'],water:['stepWater0','stepWater1'],concrete:['stepConcrete0','stepConcrete1','stepConcrete2','stepConcrete3']};
export const EFFECTS = {
  doorClose:'cc0_door_close.wav',fireDoor:'cc0_latch.wav',fireDoorClose:'cc0_metal_hit.wav',heartbeat:'cc0_heartbeat.wav',
  paperAlt:'cc0_paper_alt.wav',diceAlt1:'cc0_dice_1.wav',diceAlt2:'cc0_dice_2.wav',
  ...Object.fromEntries(Object.entries(FOOTSTEP_GROUPS).flatMap(([surface,keys])=>keys.map((key,i)=>[key,'cc0_step_'+surface+'_'+i+'.wav']))),
  scream:"user_female_scream.mp3",whisper:"user_ghost_whisper.wav",lighter:"user_lighter.mp3",screamAlt:"user_female_scream_alt.mp3",crowdNormal:"crowd_murmur.wav",
  mirrorLaugh:"cc0_cackle.wav",
  bloodDrip: "cc0_step_water_1.wav",
  omenKnock: "cc0_three_knocks.wav",
  hallucination: "cc0_ghost_breath.wav",
  checkSuccess: "cc0_item.wav",
  checkFailure: "cc0_thud.wav",
  photo: "sfx_camera_shutter.mp3",
  dice: "cc0_dice_0.wav",
  giggle: "cc0_cackle.wav",
  puzzleSlide: "cc0_creak.wav",
  puzzleTurn: "cc0_latch.wav",
  paper: "cc0_paper.wav",
  pen: "fx_pen.wav",
  stamp: "cc0_soft_hit.wav",
  apparition: "cc0_ghost_breath.wav",
  scrape: "cc0_cloth.wav",
  rush: "cc0_cloth.wav",
  flashlightOn: "cc0_switch.wav",
  flashlightOff: "cc0_switch.wav",
  item: "cc0_item.wav",
  drawer: "cc0_creak.wav",
  save: "cc0_switch.wav",
  capture: "cc0_soft_hit.wav",
  door: "cc0_door_open.wav",
  thud: "cc0_thud.wav",
  glass: "sfx_glass_breaking.mp3",
};
const EFFECT_VARIANTS={paper:['paper','paperAlt'],dice:['dice','diceAlt1','diceAlt2']};
export const EFFECT_MIX={mirrorLaugh:{gain:.65,duration:1.8,fade:.1,cooldown:15,duck:.6},giggle:{gain:.4,duration:1.1,fade:.1,cooldown:45},door:{gain:.8,duration:1.8,fade:.08},doorClose:{gain:.8,duration:1.8,fade:.08},fireDoor:{gain:.7,duration:1,fade:.06},fireDoorClose:{gain:.65,duration:1,fade:.08},heartbeat:{gain:.65,duration:1,cooldown:.95},apparition:{gain:.65,duration:3,fade:.25,cooldown:12,duck:.75},rush:{gain:.7,duration:.7,fade:.06,cooldown:.6},scrape:{gain:.6,duration:.7,fade:.05,cooldown:.25},bloodDrip:{gain:.55,duration:.4,fade:.05,cooldown:.3},scream:{gain:.42,duration:2.4,fade:.2,cooldown:8,duck:.38},screamAlt:{gain:.55,duration:2.4,fade:.2,cooldown:8,duck:.38},whisper:{gain:.38,duration:4.8,fade:.3,cooldown:45,duck:.65},lighter:{gain:.8,duration:.6,cooldown:.65}};
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
    this.buffers = new Map();this.loadingBuffers=new Map();this.effectTimes=new Map();this.ducks=new Map();
    this.stepIndex = 0;this.clipVariants=new Map();
    this.playedEffects = 0;
    this.lastError = "";this.doorRequestedAt=-Infinity;this.doorSource=null;
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
    for(const name of ["scream","screamAlt","whisper","lighter","door","doorClose","paper","heartbeat","mirrorLaugh","giggle","apparition","omenKnock",...Object.values(FOOTSTEP_GROUPS).flat()])this.loadEffect(name).catch(()=>{});
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
        this.musicLevel*Math.min(1,...this.ducks.values()),
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
  async loadEffect(name){
    if(this.buffers.has(name))return this.buffers.get(name);
    if(this.loadingBuffers.has(name))return this.loadingBuffers.get(name);
    const promise=fetch('assets/audio/'+EFFECTS[name]+new URL(import.meta.url).search).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(buffer=>{this.buffers.set(name,buffer);return buffer;}).finally(()=>this.loadingBuffers.delete(name));
    this.loadingBuffers.set(name,promise);return promise;
  }
  crowdLevel(level=0,distorted=false){
    if(!this.ctx||!this.enabled)return;
    const key='crowdNormal';this.crowdDesiredKey=key;this.crowdTarget=level*(distorted?.18:1);this.crowdDistorted=distorted;
    if(this.crowdGain)this.crowdGain.gain.setTargetAtTime(this.crowdTarget,this.ctx.currentTime,.4);
    if(!level||this.crowdSourceKey===key||this.crowdLoadingKey===key)return;
    this.crowdLoadingKey=key;const token=(this.crowdToken||0)+1;this.crowdToken=token;
    this.loadEffect(key).then(buffer=>{
      if(token!==this.crowdToken||this.crowdDesiredKey!==key||!this.enabled)return;
      const old=this.crowdSource,oldGain=this.crowdGain;if(old){oldGain.gain.setTargetAtTime(0,this.ctx.currentTime,.12);old.stop(this.ctx.currentTime+.6);}
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;gain.gain.setTargetAtTime(this.crowdTarget,this.ctx.currentTime,.4);source.connect(gain).connect(this.fxBus);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.crowdGain=gain;this.crowdSource=source;this.crowdSourceKey=key;
    }).catch(()=>this.error('배경 군중 음원을 불러오지 못했습니다.')).finally(()=>{if(token===this.crowdToken)this.crowdLoadingKey=null;});
  }
  async effect(name, level=1,pan=0) {
    if (!this.ctx || !this.enabled || !EFFECTS[name]) return;
    if(['door','doorClose','fireDoor','fireDoorClose'].includes(name)){const now=performance.now();if(now-this.doorRequestedAt<650)return;this.doorRequestedAt=now;}
    const mix=EFFECT_MIX[name],now=this.ctx.currentTime||0;if(mix&&now-(this.effectTimes.get(name)??-Infinity)<mix.cooldown)return;if(mix)this.effectTimes.set(name,now);
    try {
      const variants=EFFECT_VARIANTS[name]||[name],index=this.clipVariants.get(name)||0,clip=variants[index%variants.length];this.clipVariants.set(name,index+1);this.lastEffectFile=EFFECTS[clip];
      let buffer = this.buffers.get(clip);
      if(!buffer)buffer=await this.loadEffect(clip);
      if(!this.enabled)return;
      const s = this.ctx.createBufferSource();
      s.buffer = buffer;
      const gain=this.ctx.createGain();gain.gain.value=Math.max(0,Math.min(1,level))*(mix?.gain??1);
      s.connect(gain);const stereo=pan&&this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;if(stereo){stereo.pan.value=Math.max(-.85,Math.min(.85,pan));gain.connect(stereo).connect(this.fxBus);}else gain.connect(this.fxBus);
      const duration=mix?Math.min(mix.duration,buffer.duration):buffer.duration;
      if(mix?.fade)gain.gain.setTargetAtTime(0,this.ctx.currentTime+Math.max(0,duration-mix.fade),mix.fade/4);
      if(mix?.duck){this.ducks.set(s,mix.duck);this.musicBus?.gain.setTargetAtTime(this.musicLevel*Math.min(1,...this.ducks.values()),this.ctx.currentTime,.04);}
      s.onended=()=>{if(mix?.duck){this.ducks.delete(s);this.musicBus?.gain.setTargetAtTime(this.musicLevel*Math.min(1,...this.ducks.values()),this.ctx.currentTime,.25);}stereo?.disconnect();gain.disconnect();s.disconnect();if(this.doorSource===s)this.doorSource=null;};
      if(['door','doorClose','fireDoor','fireDoorClose'].includes(name)){this.doorSource?.stop();this.doorSource=s;gain.gain.setTargetAtTime(0,this.ctx.currentTime+Math.max(.05,duration-.08),.03);s.start(0,0,Math.min(2.6,duration));}else if(mix)s.start(0,0,duration);else s.start();
      this.playedEffects++;
    } catch {
      this.error("효과음을 불러오지 못했습니다: " + name);
    }
  }
  step(surface, running) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx,
      rate = c.sampleRate,
      length = Math.floor(rate * (surface==='water'?.18:.11)),
      b = c.createBuffer(1, length, rate),
      data = b.getChannelData(0);
    let sample = 0;
    for (let i = 0; i < length; i++) {
      sample = sample * 0.62 + (Math.random() * 2 - 1) * 0.38;
      data[i] =
        sample *
        Math.exp(-i / (length * (surface==='water'?.4:.16))) *
        (surface === "wood" ? 0.75 : 1);
    }
    const source = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    source.buffer = b;
    filter.type = "lowpass";
    filter.frequency.value = surface === "wood" ? 850 : surface==='water'?3200:1900;
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
  heartbeat(){return this.effect('heartbeat',.75);}

  get energy() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data.reduce((s, n) => s + Math.abs(n - 128), 0) / data.length;
  }
}
