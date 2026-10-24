export function mirrorVisit(s){
 const flash=!!s.flags.mirrorSeenTwice&&!s.flags.mirrorHaunt;
 if(!s.flags.mirrorSeenOnce)s.flags.mirrorSeenOnce=true;else s.flags.mirrorSeenTwice=true;
 if(flash)s.flags.mirrorHaunt=true;return flash;
}
export function canUnseal104(s){return s.bag.includes('unit104Key');}
export function redLightUpdate(enemy,map,s,dt,clear){
 enemy.arena??=watcherArena(map,s);if(!inWatcherArena(enemy.arena,map,s)){enemy.active=false;enemy.mode='gone';enemy.punish=0;return 'escaped';}
 enemy.hollowTime-=dt;if(enemy.hollowTime<=0){enemy.active=false;enemy.mode='gone';return 'escaped';}
 enemy.grace=Math.max(0,enemy.grace-dt);enemy.phaseTime=(enemy.phaseTime||0)+dt;
 const cycle=enemy.phaseTime%9,old=enemy.signal;
 enemy.signal=cycle<5?'away':cycle<6?'turn':'watch';enemy.motion=enemy.signal;
 if(enemy.signal!==old)enemy.signalEvent=enemy.signal;
 const moving=enemy.lastPlayer&&Math.hypot(s.x-enemy.lastPlayer.x,s.y-enemy.lastPlayer.y)>.12;
 enemy.lastPlayer={x:s.x,y:s.y};
 if(enemy.signal==='watch'&&cycle>6.35&&moving&&!s.hidden&&!enemy.grace&&Math.hypot(s.x-enemy.x,s.y-enemy.y)<340&&clear(map,enemy,s))enemy.punish=3;
 enemy.punish=Math.max(0,(enemy.punish||0)-dt);
 enemy.mode=enemy.punish?'chase':'search';
 if(enemy.punish&&!s.hidden)enemy.navigate(enemy.arena.grid?{...map,grid:enemy.arena.grid}:map,s,dt,s.body?.legs===2?48:s.body?.leg?94:145);
 if(enemy.punish&&!enemy.grace&&!s.hidden&&Math.hypot(s.x-enemy.x,s.y-enemy.y)<20&&clear(map,enemy,s))return 'caught';
 return null;
}

export function followsThroughExit(kind){return kind!=='redlight';}
export function watcherArena(map,s){
 const room=(map.rooms||[]).filter(r=>s.x>=r.x*32&&s.x<(r.x+r.w)*32&&s.y>=r.y*32&&s.y<(r.y+r.h)*32).at(-1)||null;
 if(!map.grid)return{mapId:map.id||s.map,room,grid:null,cells:null};
 const doors=new Set(map.objects.filter(o=>o.internalDoor).flatMap(o=>o.cells||[[Math.floor(o.x/32),Math.floor(o.y/32)]]).map(([x,y])=>x+','+y));
 const cells=new Set(),queue=[[Math.floor(s.x/32),Math.floor(s.y/32)]];
 for(let i=0;i<queue.length;i++){const[x,y]=queue[i],key=x+','+y;if(cells.has(key)||map.grid[y]?.[x]!==1||doors.has(key)||room&&(x<room.x||x>=room.x+room.w||y<room.y||y>=room.y+room.h))continue;cells.add(key);queue.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);}
 return{mapId:map.id||s.map,room,cells,grid:map.grid.map((row,y)=>row.map((v,x)=>cells.has(x+','+y)?v:2))};
}
export function inWatcherArena(arena,map,p){return(!arena.mapId||arena.mapId===(map.id||p.map))&&(!arena.cells||arena.cells.has(Math.floor(p.x/32)+','+Math.floor(p.y/32)));}
export function bindWatcher(map,s,enemy,canMove,findPath){
 const arena=watcherArena(map,s),candidates=[];
 if(!arena.cells)return true;
 for(const key of arena.cells){const[x,y]=key.split(',').map(Number),p={x:x*32+16,y:y*32+16},d=Math.hypot(p.x-s.x,p.y-s.y);if(d>=185&&d<=460&&canMove(map,p.x,p.y))candidates.push({...p,score:Math.abs(d-270)});}
 candidates.sort((a,b)=>a.score-b.score);const bounded={...map,grid:arena.grid};
 for(const p of candidates.slice(0,20))if(findPath(bounded,p,s).length){Object.assign(enemy,{x:p.x,y:p.y,arena,path:[],repath:0});return true;}
 return false;
}
