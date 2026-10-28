import {hollowStage} from './hollow-art.js?v=54ec5e85cbbf';
import {isRelayGhost,relayGhostUpdate,nextPatrolTarget} from './relay-ghosts.js?v=54ec5e85cbbf';
import {redLightUpdate} from './encounters.js?v=54ec5e85cbbf';
import {bodyState} from './body.js?v=54ec5e85cbbf';
import { canMove, sight, findPath, clearSegment, doorOpen } from "./world.js?v=54ec5e85cbbf";
export class StillnessHaunt {
  constructor(){this.reset();}
  reset(){this.map=null;this.still=0;this.cooldown=0;this.warned=false;this.active=0;this.origin=null;}
  update(map,s,dt,moved,allowed=true){
    if(this.map!==map.id){this.reset();this.map=map.id;}
    if(!allowed||s.hidden||s.ending){this.still=0;this.warned=false;this.active=0;return null;}
    this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.active){
      this.active=Math.max(0,this.active-dt);
      if(Math.hypot(s.x-this.origin.x,s.y-this.origin.y)>40){this.active=0;return {kind:'disperse'};}
    }
    if(moved>.1){this.still=0;this.warned=false;return null;}
    if(this.cooldown)return null;
    this.still+=dt;
    if(this.still>=100){
      const candidates=[];
      for(let i=0;i<16;i++){
        const angle=s.facing+Math.PI+(i%2?-1:1)*Math.ceil(i/2)*Math.PI/8;
        const p={x:s.x+Math.cos(angle)*96,y:s.y+Math.sin(angle)*96};
        if(canMove(map,p.x,p.y)&&sight(map,s,p))candidates.push(p);
      }
      if(!candidates.length)return null;
      this.still=0;this.warned=false;this.cooldown=240;this.active=6.4;this.origin={x:s.x,y:s.y};
      return {kind:'appear',...candidates[0]};
    }
    if(this.still>=85&&!this.warned){this.warned=true;return {kind:'warning'};}
    return null;
  }
}
export function locomotion(s, dx, dy, sprint, dt, map) {
  const n = Math.hypot(dx, dy),
    wantsRun = !!(n && sprint && s.stamina > 0 && !bodyState(s).leg && !s.exhausted && !s.hidden),
    oldX = s.x,
    oldY = s.y;
  if (n && !s.hidden) {
    dx /= n;
    dy /= n;
    s.facing = Math.atan2(dy, dx);
    const speed = bodyState(s).legs===2 ? 42 : bodyState(s).leg ? 78 : wantsRun ? 190 : 102;
    if (canMove(map, s.x + dx * speed * dt, s.y)) s.x += dx * speed * dt;
    if (canMove(map, s.x, s.y + dy * speed * dt)) s.y += dy * speed * dt;
  }
  s.running = wantsRun && Math.hypot(s.x - oldX, s.y - oldY) > 0.001;
  if (s.running) {
    s.stamina = Math.max(0, s.stamina - dt * 26);
    if (!s.stamina) s.exhausted = true;
  } else {
    s.stamina = Math.min(100, s.stamina + dt * 17);
    if (s.stamina >= 32) s.exhausted = false;
  }
  return [s.x - oldX, s.y - oldY];
}
export class Pursuer {
  constructor() {
    this.reset();
  }
  reset() {
    this.active = false;
    this.walkDistance=0;this.walking=false;this.hollowStage=0;this.hiddenTime=0;this.kind="jeongwoo";this.arena=null;this.intro=false;this.hollowTime=0;this.doorWait=null;this.doorEvent=null;this.phaseTime=0;this.signal=null;this.punish=0;this.lastPlayer=null;
    this.x = 0;
    this.y = 0;
    this.path = [];
    this.target=null;
    this.repath = 0;
    this.routeTarget=null;
    this.lost = 0;
    this.alert = 0;
    this.stunned = 0;
    this.grace = 3;
    this.mode = "idle";
    this.facing=0;this.age=0;this.motion="search";this.rushClock=4.5;this.windup=0;this.rush=0;
  }
  spawn(map, s) {
    this.reset();
    const possible = [];
    const entrances=map.id==='basement'?[[13.5,17.5],[33.5,17.5],[38,24]]:map.id==='upper'?[[12.5,17.5],[33.5,17.5],[38,23]]:[];
    for(const [x,y] of entrances){
      const p={x:x*32,y:y*32},d=Math.hypot(p.x-s.x,p.y-s.y);
      if(d<220||d>650||!canMove(map,p.x,p.y))continue;
      const path=findPath(map,p,s);if(path.length)possible.push({...p,score:path.length});
    }
    if(!possible.length){
      const candidates=[];
      for(let y=2;y<map.h-2;y++)for(let x=2;x<map.w-2;x++){
        const p={x:x*32+16,y:y*32+16},d=Math.hypot(p.x-s.x,p.y-s.y);
        if(d>260&&d<550&&canMove(map,p.x,p.y))candidates.push({...p,score:d+(sight(map,p,s)?0:600)});
      }
      candidates.sort((a,b)=>a.score-b.score);
      // Test promising entrances first, rather than hundreds of full route searches.
      const direct=candidates.find(p=>clearSegment(map,p,s));
      if(direct)possible.push(direct);
      else for(const p of candidates.slice(0,24)){if(findPath(map,p,s).length){possible.push(p);break;}}
    }
    if(!possible.length)return false;
    possible.sort((a,b)=>a.score-b.score);
    const p=possible[0];
    Object.assign(this,{x:p.x,y:p.y,active:true,mode:'search',target:{x:s.x,y:s.y}});
    if(s.flags.chapter2){this.kind='listener';this.hollowTime=40;this.target=null;}
    return true;
  }
  follow(map,entry,s) {
    this.reset();let point=canMove(map,entry.x,entry.y)?entry:null;
    if(!point){let distance=Infinity;for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
      const p={x:x*32+16,y:y*32+16},d=Math.hypot(p.x-entry.x,p.y-entry.y);
      if(d<distance&&d<96&&canMove(map,p.x,p.y)){point=p;distance=d;}
    }}
    if(!point)return false;
    Object.assign(this,{active:true,x:point.x,y:point.y,age:1.2,grace:1.2,mode:'search',target:{x:entry.targetX??entry.x,y:entry.targetY??entry.y}});
    return true;
  }
  navigate(map,target,dt,speed){
    this.repath-=dt;
    const changed=!this.routeTarget||Math.hypot(target.x-this.routeTarget.x,target.y-this.routeTarget.y)>20;
    if(this.repath<=0||changed){this.path=findPath(map,this,target);this.routeTarget={x:target.x,y:target.y};this.repath=.45;}
    let distance=speed*dt,moved=0;
    while(distance>.001&&this.path.length){
      const next=this.path[0],dx=next.x-this.x,dy=next.y-this.y,d=Math.hypot(dx,dy);
      if(d<.1){this.path.shift();continue;}
      const step=Math.min(d,distance),point={x:this.x+dx/d*step,y:this.y+dy/d*step};
      if(!clearSegment(map,this,point)){this.path=[];this.repath=0;break;}
      this.facing=Math.atan2(dy,dx);this.x=point.x;this.y=point.y;distance-=step;moved+=step;
      if(step>=d-.001){this.path.shift();break;}
    }
    this.walking=moved>.001;this.walkDistance=(this.walkDistance||0)+moved;
    return moved;
  }
  pressureDoor(map,s,dt){
    if(!this.target)return false;
    if(this.doorWait){
      const d=map.objects.find(o=>o.id===this.doorWait.id);
      if(!d||doorOpen(map,d)){this.doorWait=null;return false;}
      this.motion='search';this.doorWait.time+=dt;
      if(this.doorWait.time>=this.doorWait.delay){s.flags['open_'+d.id]=true;map.openDoors?.add(d.id);this.doorEvent={id:d.id,opened:true};this.doorWait=null;this.repath=0;}
      return true;
    }
    if(findPath(map,this,this.target).length)return false;
    const closed=map.objects.filter(o=>o.internalDoor&&!doorOpen(map,o));if(!closed.length)return false;
    const open={...map,openDoors:new Set(map.objects.filter(o=>o.internalDoor).map(o=>o.id))},route=findPath(open,this,this.target);if(!route.length)return false;
    let from=this,approach=this,door=null;
    outer:for(const p of route){const distance=Math.hypot(p.x-from.x,p.y-from.y),steps=Math.max(1,Math.ceil(distance/4)),start={x:from.x,y:from.y};for(let i=1;i<=steps;i++){const q={x:start.x+(p.x-start.x)*i/steps,y:start.y+(p.y-start.y)*i/steps};if(!clearSegment(map,approach,q)){door=closed.find(o=>Math.abs(q.x-o.x)<o.w+17&&Math.abs(q.y-o.y)<o.h+17);break outer;}approach=q;}from=p;}
    if(!door)return false;
    if(Math.hypot(this.x-approach.x,this.y-approach.y)>4)this.navigate(map,approach,dt,this.kind==='hollow'?100:95);
    else {this.doorWait={id:door.id,time:0,delay:door.doorType==='fire'?5.5:3.5};this.doorEvent={id:door.id,opened:false};}
    return true;
  }
  update(map, s, dt) {
    if (!this.active) return null;
    this.walking=false;this.age+=dt;
    this.hiddenTime=s.hidden&&!s.hideSpot?.witnessed?(this.hiddenTime||0)+dt:0;
    if(this.hiddenTime>=6){this.active=false;this.mode='gone';return 'escaped';}
    if(this.kind==='redlight')return redLightUpdate(this,map,s,dt,clearSegment);
    if(this.kind==='hollow'){this.hollowStage=hollowStage(s);this.hollowTime-=dt;if(this.hollowTime<=0){this.active=false;this.mode='gone';return 'escaped';}}
    if(s.hidden&&s.flags.chapter2&&s.hideSpot?.witnessed){
      const h=s.hideSpot;this.mode='chase';this.motion='search';this.lost=0;
      const dx=s.x-this.x,dy=s.y-this.y,d=Math.hypot(dx,dy);
      if(d>38)this.navigate(map,s,dt,100);
      else{h.opening=Math.min(1,h.opening+dt/1.3);if(h.opening>=1)return 'caught';}
      return null;
    }

    if(isRelayGhost(this.kind))return relayGhostUpdate(this,map,s,dt,clearSegment);
    this.grace = Math.max(0, this.grace - dt);
    this.stunned = Math.max(0, this.stunned - dt);
    if (this.stunned) {this.motion="search";return null;}
    const d = Math.hypot(s.x - this.x, s.y - this.y),
      visible =
        !s.hidden && d < (this.kind==='hollow'?260:s.flashlight ? 300 : 180) && sight(map, this, s),
      heard = this.kind!=='hollow' && !s.hidden && s.running && d < 430;
    if (visible || heard) {
      this.alert = 1;
      this.lost = 0;
      this.mode = "chase";
      this.target = { x: s.x, y: s.y };
    } else {
      this.lost += dt;
      if (this.lost > 2) this.mode = "search";
      if ((s.hidden && this.lost > 4) || this.lost > 18) {
        this.active = false;
        this.mode = "gone";
        return "escaped";
      }
    }
    if(this.kind==='hollow'&&this.mode!=='chase'&&(!this.target||Math.hypot(this.x-this.target.x,this.y-this.target.y)<18))this.target=nextPatrolTarget(this,map);
    if(this.pressureDoor(map,s,dt))return null;
    this.windup=Math.max(0,this.windup-dt);this.rush=Math.max(0,this.rush-dt);
    if(this.motion==='windup'&&!this.windup)this.rush=.65;
    if(this.kind==='jeongwoo'&&this.mode==='chase'&&!s.hidden){
      this.rushClock+=dt;
      if(this.rushClock>4.5&&!this.grace&&d<170&&clearSegment(map,this,s)&&!this.rush&&!this.windup){this.windup=.65;this.rushClock=0;}
    }else{this.rushClock=4.5;this.windup=0;this.rush=0;}
    this.motion=this.age<1.2&&this.grace>0?'rise':this.windup>0?'windup':this.rush>0?'lunge':this.mode==='chase'?'crawl':'search';
    if(this.target){
      const speed=this.kind==='hollow'?(this.mode!=='chase'?38:bodyState(s).legs===2?48:bodyState(s).leg?92:118):this.motion==='rise'?25:this.motion==='windup'?12:this.motion==='lunge'?170:this.mode==='chase'?125:85;
      this.navigate(map,this.target,dt,speed);
    }
    if (!this.grace && !s.hidden && Math.hypot(s.x - this.x, s.y - this.y) < 20 && clearSegment(map,this,s))
      return "caught";
    return null;
  }
}

const PROGRESS_FLAGS=['power','locker','listened','shutterOpen','chapter2','relayIncoming','relayCancel','relayOverride','relayCompared','relaySlide','relayLogic','relayPipes','relayCooling','relayIsolated','relayPower','relayLastVoice','relaySync','relayErasure','relayProofTimeline','relayProofAccount'];
export function progressSignature(s){return JSON.stringify([s.bag.slice().sort(),s.notes.map(n=>n.id).sort(),PROGRESS_FLAGS.map(k=>!!s.flags[k])]);}
export class ProgressHaunt{
 constructor(){this.reset();}
 reset(){this.signature=null;this.elapsed=0;this.warned=false;this.cooldown=0;}
 update(s,dt,allowed=true){
  const signature=progressSignature(s);
  if(this.signature!==signature){this.signature=signature;this.elapsed=0;this.warned=false;return null;}
  if(!allowed||s.ending)return null;
  this.cooldown=Math.max(0,this.cooldown-dt);if(this.cooldown)return null;
  this.elapsed+=dt;
  const pressure=s.flags.chapter2?(s.investigation?.stress||0)*5:0;
  if(this.elapsed>=240-pressure){this.elapsed=0;this.warned=false;this.cooldown=300;return {kind:'insist'};}
  if(this.elapsed>=215-pressure&&!this.warned){this.warned=true;return {kind:'warning'};}
  return null;
 }
}
