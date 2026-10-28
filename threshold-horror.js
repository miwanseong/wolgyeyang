import {sight} from './world.js?v=35d4de009dfc';
export class ThresholdHorror{
 constructor(){this.state=null;this.map=null;this.delay=55;this.rest=0;this.active=null;}
 update(map,s,dt,allowed=true){
  if(this.state!==s){this.state=s;this.map=null;this.active=null;this.rest=0;}
  if(this.map!==map.id){this.map=map.id;this.active=null;this.delay=s.flags['horror_visit_'+map.id]?24:55;s.flags['horror_visit_'+map.id]=true;}
  if(!allowed)return null;
  if(this.active){this.active.elapsed+=dt;if(this.active.elapsed>=this.active.duration){const end=this.active;this.active=null;this.rest=100;return{kind:'ended',door:end.door};}return null;}
  if(this.rest>0){this.rest-=dt;return null;}this.delay-=dt;if(this.delay>0||map.outdoor||s.flags['horror_shadow_'+map.id])return null;
  const door=map.objects.filter(o=>o.internalDoor&&(!map.grid||sight(map,s,o))&&!map.openDoors?.has(o.id)&&Math.hypot(o.x-s.x,o.y-s.y)>60&&Math.hypot(o.x-s.x,o.y-s.y)<220).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(!door)return null;s.flags['horror_shadow_'+map.id]=true;this.active={door,elapsed:0,duration:2.6};return{kind:'shadow',door};
 }
}
export function drawThresholdShadow(c,event,g,sheet,pose,reduced=false){
 if(!event)return;const u=Math.min(1,event.elapsed/event.duration),fade=Math.min(1,u*8,(1-u)*8),width=Math.max(3,g.w*.12),height=g.h*.72;
 c.save();c.beginPath();c.rect(g.x+g.w*.44,g.y+g.h*.12,width,height);c.clip();c.fillStyle=`rgba(138,133,125,${fade*.7})`;c.fillRect(g.x,g.y,g.w,g.h);
 c.globalAlpha=fade;c.filter='brightness(0)';const x=g.x+g.w*(reduced?.5:-.5+u*2),h=g.h*.82,w=h*pose.w/pose.h;c.drawImage(sheet,pose.x,pose.y,pose.w,pose.h,x-w/2,g.y+g.h*.08,w,h);c.restore();
}
