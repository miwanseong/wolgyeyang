import {canMove,sight,clearSegment} from './world.js?v=c8043874a319';
export const OMEN_ART=[{"x":50,"y":123,"w":444,"h":330},{"x":575,"y":58,"w":423,"h":400},{"x":1059,"y":61,"w":438,"h":393},{"x":149,"y":543,"w":245,"h":428},{"x":651,"y":541,"w":248,"h":438},{"x":1081,"y":566,"w":405,"h":423}];
export function rememberedHides(map,s){return map.objects.filter(o=>o.hide&&(s.flags['hide_known_'+map.id+'_'+o.id]||s.flags['seen_'+o.id]));}
export function rememberHide(map,s,o){if(!o?.hide)return false;s.flags['hide_known_'+map.id+'_'+o.id]=true;s.flags['seen_'+o.id]=true;return true;}
export function floorOmenAnchor(map,s){
 for(const distance of [64,88,112])for(const turn of [0,.45,-.45,.9,-.9,1.4,-1.4]){
  const angle=s.facing+turn,p={x:s.x+Math.cos(angle)*distance,y:s.y+Math.sin(angle)*distance,angle};
  if(canMove(map,p.x,p.y)&&clearSegment(map,s,p)&&sight(map,s,p))return p;
 }
 return null;
}
export class RoomHaunts{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.map=null;this.state=null;this.active=null;this.quiet=55;this.story=null;this.pendingKind=null;}
 update(map,s,dt,allowed=true,threat=false){
  if(this.map!==map.id||this.state!==s){this.reset();this.map=map.id;this.state=s;}
  const story=[!!s.flags.power,!!s.flags.listened,!!s.flags.relayCancel,!!s.flags.relayPower];
  if(this.story&&story.some((v,i)=>v&&!this.story[i])){this.pendingKind=s.flags.chapter2?'blood':'footsteps';this.quiet=this.active?8:Math.min(this.quiet,1.8);}
  this.story=story;
  if(threat||s.hidden||s.ending){this.pendingKind=null;this.active=null;this.quiet=Math.max(12,this.quiet);return null;}
  if(!allowed)return null;
  if(this.active){
   const e=this.active;e.elapsed+=dt;
   if((e.kind==='blood'||e.kind==='footsteps')&&e.elapsed>1.3){const p=e.points[0];if(Math.hypot(s.x-p.x,s.y-p.y)<28||Math.cos(Math.atan2(p.y-s.y,p.x-s.x)-s.facing)<-.25)e.elapsed=Math.max(e.elapsed,e.duration-.6);}
   if(e.elapsed>=e.duration)this.active=null;
   return null;
  }
  this.quiet-=dt;if(this.quiet>0)return null;
  const anchor=floorOmenAnchor(map,s);if(!anchor){this.quiet=3;return null;}
  const visits=s.omenVisits||(s.omenVisits={}),key=map.id,count=Number(visits[key])||0;
  const sequence=s.flags.chapter2?['footsteps','blood','shadow','knock']:['blood','footsteps','knock','shadow'];const offset={apartment:1,upper:2,basement:3,relayArchive:1,relayPlant:3,relaySignal:2,relayYard:2}[map.id]||0;let kind=this.pendingKind||sequence[(count+offset)%sequence.length];
  const fixture=map.objects.filter(o=>(o.swivel||o.internalDoor)&&Math.hypot(o.x-s.x,o.y-s.y)<200&&sight(map,s,o)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(kind==='knock'&&!fixture)kind='shadow';
  const points=[anchor];if(kind==='footsteps')for(let i=1;i<5;i++){const p={x:anchor.x+Math.cos(anchor.angle)*i*15,y:anchor.y+Math.sin(anchor.angle)*i*15,angle:anchor.angle};if(!clearSegment(map,points.at(-1),p))break;points.push(p);}
  this.active={kind,points,elapsed:0,duration:kind==='shadow'?2.4:kind==='knock'?2.2:4.6,fixture:fixture?.id,swivel:!!fixture?.swivel,seed:count+map.id.length};
  this.pendingKind=null;visits[key]=count+1;this.quiet=100+this.random()*65;
  return{kind,sound:kind==='blood'||kind==='footsteps'?'bloodDrip':kind==='knock'?'omenKnock':'whisper',...this.active};
 }
}
export function omenOpacity(e){return Math.max(0,Math.min(1,e.elapsed/.22,(e.duration-e.elapsed)/.6));}
export function drawFloorOmen(c,e,reduced=false,atlas=null){
 if(!atlas||!e||!['blood','footsteps'].includes(e.kind))return;
 c.save();c.globalAlpha=omenOpacity(e)*.94;
 if(e.kind==='blood'){
  const p=e.points[0],r=OMEN_ART[e.seed%3],grow=reduced?1:.45+Math.min(1,e.elapsed/.75)*.55,w=48*grow,h=w*r.h/r.w;
  c.drawImage(atlas,r.x,r.y,r.w,r.h,p.x-w/2,p.y-h/2,w,h);
 }else for(let i=0;i<e.points.length;i++){
  if(e.elapsed<i*.32)continue;const p=e.points[i],r=OMEN_ART[3+i%2];
  c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);c.translate(i%2?4:-4,0);
  c.drawImage(atlas,r.x,r.y,r.w,r.h,-4,-8,8,16);c.restore();
 }
 c.restore();
}
