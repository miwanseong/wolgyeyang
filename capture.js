import {isRelayGhost,RELAY_POSES} from './relay-ghosts.js?v=58afa086feda';
import {WATCHER_POSES} from './watcher-art.js?v=58afa086feda';
import {HOLLOW_POSES,drawEyeCluster} from './hollow-art.js?v=58afa086feda';
import { restore } from './state.js?v=58afa086feda';

// Validate before ranking: a damaged newer slot must not hide a usable checkpoint.
export function checkpoints(read) {
  const valid=[];
  for(let slot=1;slot<=3;slot++){
    try{
      const raw=read(slot);if(!raw)continue;
      const data=JSON.parse(raw),state=restore(raw);
      valid.push({slot,state,savedAt:Number.isFinite(data.savedAt)&&data.savedAt>0&&data.savedAt<=8.64e15?data.savedAt:0});
    }catch{}
  }
  return valid.sort((a,b)=>b.savedAt-a.savedAt||a.slot-b.slot);
}
export function latestCheckpoint(read){return checkpoints(read)[0]||null;}
export function capturePose(seconds) {
  // Anticipation, impact, sustained struggle, release, then loss of vision.
  const ends=[.22,.42,.62,.88,1.15,1.45,1.85,2.25,2.7,3.15,3.6,4.25];
  const frame=ends.findIndex(end=>seconds<end);
  return {frame:frame<0?11:frame,black:Math.max(0,Math.min(1,(seconds-3.7)/1.2)),done:seconds>=5.2};
}
export class CaptureAnimation {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.time=0;
    this.image=new Image();this.image.src='assets/capture-sequence.png?v=58afa086feda';
    this.relay=new Image();this.relay.src='assets/relay-ghosts.png?v=58afa086feda';
    this.watcher=new Image();this.watcher.src='assets/watcher-sprites.png?v=58afa086feda';
    this.hollow=new Image();this.hollow.src='assets/hollow-hunter.png?v=58afa086feda';this.ready=Promise.all([this.relay.decode().catch(()=>{}),this.image.decode().catch(()=>{}),this.hollow.decode().catch(()=>{}),this.watcher.decode().catch(()=>{})]);
  }
  reset(kind="jeongwoo",stage=0){this.time=0;this.kind=kind;this.stage=stage;}
  draw(dt,reduced=false){
    this.time+=dt;const p=capturePose(this.time),c=this.ctx,w=this.canvas.width,h=this.canvas.height;
    c.fillStyle='#080809';c.fillRect(0,0,w,h);
    if(isRelayGhost(this.kind)&&this.relay.naturalWidth){const q=RELAY_POSES[this.kind==='listener'?3:7],sh=q[3]*.58,scale=Math.min(w*.8/q[2],h/sh);c.drawImage(this.relay,q[0],q[1],q[2],sh,(w-q[2]*scale)/2,(h-sh*scale)/2,q[2]*scale,sh*scale);}
    else if(this.kind==='redlight'&&this.watcher.naturalWidth){const p=WATCHER_POSES[6],sw=p[2],sh=p[3]*.48,scale=Math.min(w*.75/sw,h/sh);c.drawImage(this.watcher,p[0],p[1],sw,sh,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);}
    else if(this.kind==='hollow'&&this.stage&&this.hollow.naturalWidth){c.save();const scale=Math.min(w/120,h/110);c.translate(w/2,h*.88);c.scale(scale,scale);drawEyeCluster(c,this.hollow,{x:0,y:0,hollowStage:this.stage,age:8,motion:'lunge'},this.time*1000,reduced);c.restore();}
    else if(this.kind==='hollow'&&this.hollow.naturalWidth){const pose=HOLLOW_POSES[reduced?5:4+Math.min(3,Math.floor(this.time/.7))],scale=Math.min(w/pose.w,h/pose.h)*(reduced?1:.9+Math.min(this.time,3)*.06);c.drawImage(this.hollow,pose.x,pose.y,pose.w,pose.h,(w-pose.w*scale)/2,(h-pose.h*scale)/2,pose.w*scale,pose.h*scale);}
    else if(this.image.naturalWidth){
      const sw=this.image.width/4,sh=this.image.height/3;
      const scale=Math.min(w/sw,h/sh)*(.92+Math.min(this.time,3)*.018);
      const shake=reduced?0:Math.sin(this.time*43)*Math.max(0,1-this.time/3)*5;
      c.imageSmoothingEnabled=false;
      c.drawImage(this.image,(p.frame%4)*sw,Math.floor(p.frame/4)*sh,sw,sh,(w-sw*scale)/2+shake,(h-sh*scale)/2,sw*scale,sh*scale);
    }
    const vignette=c.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,h*.65);
    vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#000e');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    c.fillStyle=`rgba(0,0,0,${p.black})`;c.fillRect(0,0,w,h);
    return p;
  }
}
