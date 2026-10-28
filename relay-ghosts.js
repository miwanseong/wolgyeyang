import {canMove,findPath} from './world.js?v=fa18be954288';
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
 if(e.mode==='search'&&(!e.target||Math.hypot(e.x-e.target.x,e.y-e.target.y)<18)){e.target=null;e.target=nextPatrolTarget(e,map);}
 e.motion=e.mode==='chase'?'walk':'search';
 if(e.pressureDoor(map,s,dt))return null;
 if(e.target)e.navigate(map,e.target,dt,s.body?.legs===2?32:s.body?.leg?55:e.mode==='search'?38:e.kind==='listener'?112:96);
 if(!e.grace&&!s.hidden&&distance<20&&line)return 'caught';return null;
}

export function relayWalkFrame(e){const side=Math.abs(Math.cos(e.facing||0))>.65,back=!side&&Math.sin(e.facing||0)<0;return{frame:Math.floor((e.walkDistance||0)/14)%4,row:(e.kind==='usher'?2:0)+(side?1:0),back,flip:side&&Math.cos(e.facing||0)<0};}

export const RELAY_WALK_POSES=[[126,3,178,327],[399,3,175,327],[685,5,179,318],[973,5,183,325],[118,330,189,300],[397,330,184,300],[671,331,199,299],[966,330,188,300],[86,630,248,323],[365,630,241,323],[651,630,289,323],[940,630,238,322],[97,953,216,296],[385,953,221,295],[668,953,223,298],[961,958,211,290]];
export const RELAY_BACK_POSES=[[134,26,212,442],[474,27,216,436],[848,18,206,452],[1208,26,206,438],[69,481,308,504],[463,476,285,509],[820,479,306,506],[1199,477,263,503]];
export function drawRelay(c,art,walk,back,e,t,reduced=false){const f=relayWalkFrame(e),moving=e.walking,pose=moving?(f.back?RELAY_BACK_POSES[(e.kind==='usher'?4:0)+f.frame]:RELAY_WALK_POSES[f.row*4+f.frame]):relayPose(e,t,reduced),image=moving?(f.back?back:walk):art,h=82,w=h*pose[2]/pose[3];c.save();c.translate(e.x,e.y);if(moving&&f.flip)c.scale(-1,1);c.drawImage(image,...pose,-w/2,-h,w,h);c.restore();}

export function nextPatrolTarget(e,map){const seed=e.patrolIndex=(e.patrolIndex||0)+1;for(let i=0;i<12;i++){const angle=(seed+i)*Math.PI/4,r=72+(i%3)*32,p={x:e.x+Math.cos(angle)*r,y:e.y+Math.sin(angle)*r};if(canMove(map,p.x,p.y)&&findPath(map,e,p).length)return p;}return null;}
