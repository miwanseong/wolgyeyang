export const RELAY_KINDS=['listener','usher'];
export const isRelayGhost=kind=>RELAY_KINDS.includes(kind);
export const RELAY_POSES=[[67,12,241,442],[468,21,213,433],[815,11,274,443],[1192,19,330,437],[58,471,303,515],[434,471,275,515],[831,472,255,514],[1175,472,330,514]];
export function relayPose(enemy,t,reduced=false){const row=enemy.kind==='usher'?4:0;return RELAY_POSES[row+(enemy.mode==='chase'&&enemy.target&&Math.hypot(enemy.x-enemy.target.x,enemy.y-enemy.target.y)<75?3:enemy.mode==='search'?2:reduced?0:Math.floor(t/300)%2)];}
export function relayGhostUpdate(e,map,s,dt,clear){
 e.hollowTime-=dt;if(e.hollowTime<=0){e.active=false;e.mode='gone';return 'escaped';}e.grace=Math.max(0,e.grace-dt);
 const distance=Math.hypot(e.x-s.x,e.y-s.y),moving=e.lastPlayer&&Math.hypot(s.x-e.lastPlayer.x,s.y-e.lastPlayer.y)>.12,line=clear(map,e,s);
 e.lastPlayer={x:s.x,y:s.y};
 const noticed=!s.hidden&&(e.kind==='listener'?moving&&distance<(s.running?420:line?170:85):line&&distance<(s.flashlight?350:110));
 if(noticed){e.target={x:s.x,y:s.y};e.lost=0;e.mode='chase';e.alert=1;}else{e.lost+=dt;if(e.lost>2)e.mode='search';if(e.lost>14){e.active=false;e.mode='gone';return 'escaped';}}
 e.motion=e.mode==='chase'?'walk':'listen';
 if(e.pressureDoor(map,s,dt))return null;
 if(e.target)e.navigate(map,e.target,dt,s.body?.legs===2?36:s.body?.leg?65:e.kind==='listener'?112:96);
 if(!e.grace&&!s.hidden&&distance<20&&line)return 'caught';return null;
}
