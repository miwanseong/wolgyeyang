export function mirrorVisit(s){
 const flash=!!s.flags.mirrorSeenTwice&&!s.flags.mirrorHaunt;
 if(!s.flags.mirrorSeenOnce)s.flags.mirrorSeenOnce=true;else s.flags.mirrorSeenTwice=true;
 if(flash)s.flags.mirrorHaunt=true;return flash;
}
export function canUnseal104(s){return s.bag.includes('receipt')&&!!s.flags.power;}
export function redLightUpdate(enemy,map,s,dt,clear){
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
 if(enemy.punish&&!s.hidden)enemy.navigate(map,s,dt,s.body?.leg?94:145);
 if(enemy.punish&&!enemy.grace&&!s.hidden&&Math.hypot(s.x-enemy.x,s.y-enemy.y)<20&&clear(map,enemy,s))return 'caught';
 return null;
}
