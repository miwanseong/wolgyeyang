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
 if((enemy.punish||enemy.doorWait)&&!s.hidden){enemy.target={x:s.x,y:s.y};if(enemy.pressureDoor?.(map,s,dt)){enemy.punish=Math.max(enemy.punish,1);return null;}}
 if(enemy.punish&&!s.hidden)enemy.navigate(enemy.arena.grid?{...map,grid:enemy.arena.grid}:map,s,dt,s.body?.legs===2?48:s.body?.leg?94:145);
 if(enemy.punish&&!enemy.grace&&!s.hidden&&Math.hypot(s.x-enemy.x,s.y-enemy.y)<20&&clear(map,enemy,s))return 'caught';
 return null;
}

export function followsThroughExit(kind,portal=null){return kind!=='redlight'||!!portal&&portal.kind!=='stairs';}
export function watcherArena(map,s){
 // Room thresholds are not escape boundaries; only leaving the map rebinds the arena.
 return{mapId:map.id||s.map,room:null,grid:null,cells:map.grid?new Set(map.grid.flatMap((row,y)=>row.flatMap((v,x)=>v===1?[x+','+y]:[]))):null};
}
export function inWatcherArena(arena,map,p){return(!arena.mapId||arena.mapId===(map.id||p.map))&&(!arena.cells||arena.cells.has(Math.floor(p.x/32)+','+Math.floor(p.y/32)));}
export function bindWatcher(map,s,enemy,canMove,findPath){
 const arena=watcherArena(map,s),candidates=[];
 if(!arena.cells)return true;
 for(const key of arena.cells){const[x,y]=key.split(',').map(Number),p={x:x*32+16,y:y*32+16},d=Math.hypot(p.x-s.x,p.y-s.y);if(d>=185&&d<=460&&canMove(map,p.x,p.y))candidates.push({...p,score:Math.abs(d-270)});}
 candidates.sort((a,b)=>a.score-b.score);const bounded={...map,grid:arena.grid||map.grid};
 for(const p of candidates.slice(0,20))if(findPath(bounded,p,s).length){Object.assign(enemy,{x:p.x,y:p.y,arena,path:[],repath:0});return true;}
 return false;
}
