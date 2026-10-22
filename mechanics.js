import { canMove, sight, findPath } from "./world.js?v=e33230e235db";
export function locomotion(s, dx, dy, sprint, dt, map) {
  const n = Math.hypot(dx, dy),
    wantsRun = !!(n && sprint && s.stamina > 0 && !s.exhausted && !s.hidden),
    oldX = s.x,
    oldY = s.y;
  if (n && !s.hidden) {
    dx /= n;
    dy /= n;
    s.facing = Math.atan2(dy, dx);
    const speed = wantsRun ? 190 : 102;
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
    this.x = 0;
    this.y = 0;
    this.path = [];
    this.target=null;
    this.repath = 0;
    this.lost = 0;
    this.alert = 0;
    this.stunned = 0;
    this.grace = 3;
    this.mode = "idle";
    this.age=0;this.motion="search";this.rushClock=4.5;this.windup=0;this.rush=0;
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
    if(!possible.length)for (let y = 2; y < map.h - 2; y++)
      for (let x = 2; x < map.w - 2; x++) {
        const p = { x: x * 32 + 16, y: y * 32 + 16 },d = Math.hypot(p.x - s.x, p.y - s.y);
        if(d>260&&d<550&&canMove(map,p.x,p.y)){
          const path=findPath(map,p,s);if(path.length)possible.push({...p,score:path.length+(sight(map,p,s)?3:0)});
        }
      }
    if(!possible.length)return false;
    possible.sort((a,b)=>a.score-b.score);
    const p=possible[0];
    Object.assign(this,{x:p.x,y:p.y,active:true,mode:'search',target:{x:s.x,y:s.y}});
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
  update(map, s, dt) {
    if (!this.active) return null;
    this.age+=dt;
    this.grace = Math.max(0, this.grace - dt);
    this.stunned = Math.max(0, this.stunned - dt);
    if (this.stunned) {this.motion="search";return null;}
    const d = Math.hypot(s.x - this.x, s.y - this.y),
      visible =
        !s.hidden && d < (s.flashlight ? 300 : 180) && sight(map, this, s),
      heard = !s.hidden && s.running && d < 430;
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
    this.windup=Math.max(0,this.windup-dt);this.rush=Math.max(0,this.rush-dt);
    if(this.motion==='windup'&&!this.windup)this.rush=.65;
    if(this.mode==='chase'&&!s.hidden){
      this.rushClock+=dt;
      if(this.rushClock>4.5&&!this.grace&&d<170&&!this.rush&&!this.windup){this.windup=.65;this.rushClock=0;}
    }else{this.rushClock=4.5;this.windup=0;this.rush=0;}
    this.motion=this.age<1.2&&this.grace>0?'rise':this.windup>0?'windup':this.rush>0?'lunge':this.mode==='chase'?'crawl':'search';
    this.repath -= dt;
    if (this.target && this.repath <= 0) {
      this.path = findPath(map, this, this.target);
      this.repath = 0.45;
    }
    // BFS ends when the target tile is reached; finish the last few pixels too.
    const next = this.path[0] || (this.target && sight(map, this, this.target) ? this.target : null);
    if (next) {
      const dx = next.x - this.x,
        dy = next.y - this.y,
        dist = Math.hypot(dx, dy),
        speed = this.motion==="rise"?25:this.motion==="windup"?12:this.motion==="lunge"?170:this.mode === "chase" ? 125 : 85;
      if (dist < 5) this.path.shift();
      else {
        const step = Math.min(dist, speed * dt);
        if (canMove(map, this.x + (dx / dist) * step, this.y))
          this.x += (dx / dist) * step;
        if (canMove(map, this.x, this.y + (dy / dist) * step))
          this.y += (dy / dist) * step;
      }
    }
    if (!this.grace && !s.hidden && Math.hypot(s.x - this.x, s.y - this.y) < 20)
      return "caught";
    return null;
  }
}
