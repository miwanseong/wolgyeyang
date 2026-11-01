import {stepMotion,facing} from '/motion.js';
export class LocalMovement{
 constructor(send){this.send=send;this.seq=Date.now()*1000;this.history=[];this.state=null;this.input={dx:0,dy:0,run:false};this.sent={dx:0,dy:0,run:false};this.lastSent=-1000;this.lastFrame=0;this.received=0;this.error={x:0,y:0};}
 reset(){this.state=null;this.history=[];this.lastFrame=0;this.error={x:0,y:0};this.sent={dx:0,dy:0,run:false};}
 reconcile(p,world,now=performance.now()){
  this.received=now;if(!this.state||this.state.region!==p.region||Math.hypot(p.x-this.state.x,p.y-this.state.y)>4){this.state={x:p.x,y:p.y,region:p.region};this.error={x:0,y:0};this.history=[];return;}
  const ack=p.movement,entry=ack&&this.history.find(h=>h.seq===ack.seq);if(!entry&&(this.input.dx||this.input.dy)&&this.history.length)return;let target={...p};
  if(entry){let at=Math.min(now,entry.at+Math.max(0,ack.simAt-ack.acceptedAt)),input=entry;at=Math.max(at,now-450);for(const h of this.history.filter(h=>h.at>at)){const next=stepMotion(target,input,(h.at-at)/1000,world.regions[p.region]);Object.assign(target,next);input=h;at=h.at;}Object.assign(target,stepMotion(target,input,(now-at)/1000,world.regions[p.region]));}
  this.error={x:target.x-this.state.x,y:target.y-this.state.y};if(Math.hypot(this.error.x,this.error.y)>2.5){this.state.x=target.x;this.state.y=target.y;this.error={x:0,y:0};}
  this.history=this.history.filter(h=>now-h.at<5000);
 }
 frame(p,world,input,now=performance.now()){
  if(!this.state||this.state.region!==p.region)this.reconcile(p,world,now);
  this.input=input;const changed=input.dx!==this.sent.dx||input.dy!==this.sent.dy||input.run!==this.sent.run,moving=!!(input.dx||input.dy);
  if(changed||moving&&now-this.lastSent>=85){const packet={...input,seq:++this.seq};this.sent={...input};this.lastSent=now;this.history.push({...packet,at:now});this.send(packet);}
  const dt=Math.min(.1,Math.max(0,(now-(this.lastFrame||now))/1000));this.lastFrame=now;
  if(now-this.received<750){const effective=p.hp<=0||p.recoveryUntil>Date.now()?{dx:0,dy:0,run:false}:input,next=stepMotion({...p,...this.state},effective,dt,world.regions[p.region]);this.state.x=next.x;this.state.y=next.y;const factor=1-Math.exp(-dt*14);let cx=this.error.x*factor,cy=this.error.y*factor;if(moving){const along=cx*input.dx+cy*input.dy,limit=5.9*dt;if(along<-limit*.25){cx+=input.dx*(-limit*.25-along);cy+=input.dy*(-limit*.25-along);}else if(along>limit*.6){cx-=input.dx*(along-limit*.6);cy-=input.dy*(along-limit*.6);}}this.state.x+=cx;this.state.y+=cy;this.error.x-=cx;this.error.y-=cy;}
  return {...p,...this.state,renderLocal:true,faceDirection:facing(input.dx,input.dy,p.faceDirection),facing:input.dx<0?-1:input.dx>0?1:p.facing,running:input.run&&(p.stamina||0)>2,movingUntil:moving?Date.now()+160:p.movingUntil};
 }
}
