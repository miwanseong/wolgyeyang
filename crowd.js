import {advanceGait,actorStride} from './gait.js?v=0626962de89e';
import {canMove,findPath} from './world.js?v=0626962de89e';
export const CROWD_ROUTES={
 relayYard:[[[24,18],[30,18]],[[25,25],[31,25]],[[8,14],[17,14]]],
 relayEntry:[[[10,25],[20,25]],[[26,26],[36,26]],[[18.7,13],[19,15]]],
 relayArchive:[[[16,14],[19,15]],[[34,14],[41,14]]],
 relayPlant:[[[31,26],[43,26]]],
 relaySignal:[[[29,28],[41,28]]]
};
export class Crowd{
 constructor(){this.map=null;this.people=[];}
 update(map,s,dt,allowed=true){
  if(this.map!==map.id){this.map=map.id;this.people=(CROWD_ROUTES[map.id]||[]).map((route,i)=>({ambient:true,column:i%3,route,x:route[0][0]*32,y:route[0][1]*32,target:1,wait:i*.8,walk:i,path:[],repath:0,direction:i%4,moving:false}));}
  if(s.flags.relayLastVoice)return [];
  for(const n of this.people){
   n.moving=false;if(!allowed)continue;n.wait-=dt;if(n.wait>0)continue;
   const p={x:n.route[n.target][0]*32,y:n.route[n.target][1]*32};n.repath-=dt;
   if(n.repath<=0){n.path=findPath(map,n,p);n.repath=.9;}
   const next=n.path[0]||p,dx=next.x-n.x,dy=next.y-n.y,d=Math.hypot(dx,dy);
   if(d<5)n.path.shift();if(Math.hypot(p.x-n.x,p.y-n.y)<8){n.target=1-n.target;n.wait=2;n.repath=0;continue;}
   const step=Math.min(d,dt*(s.flags.relayPower?13:29));if(d){const x=n.x+dx/d*step,y=n.y+dy/d*step;if(canMove(map,x,y)&&Math.hypot(x-s.x,y-s.y)>26){n.x=x;n.y=y;n.walk=advanceGait(n.walk,step,actorStride(n.column+1));n.moving=true;n.direction=Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy<0?3:0;}}
  }
  return this.people;
 }
}
