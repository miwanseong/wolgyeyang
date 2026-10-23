import {GAIT_ART} from './gait-art.js?v=4c269a40fa1c';
export const PLAYER_STRIDE=64,NPC_STRIDE=48;
export function actorStride(actor){return actor===0?PLAYER_STRIDE:actor===2?32:NPC_STRIDE;}
export function advanceGait(clock,distance,stride=PLAYER_STRIDE){return clock+Math.max(0,distance)/stride*4;}
export function footContacts(before,after){return Math.max(0,Math.floor(after/2)-Math.floor(before/2));}
export function gaitPose(clock,stride=PLAYER_STRIDE){
 const phase=((clock/4)%1+1)%1,span=stride/4;
 const foot=p=>{const stance=p<.5,q=stance?p*2:(p-.5)*2;return{x:stance?-span+2*span*q:span-2*span*q,y:5-(stance?0:4*Math.sin(q*Math.PI)),stance};};
 const near=foot(phase),far=foot((phase+.5)%1),bob=-.8*Math.pow(Math.sin(phase*Math.PI*2),2);
 return{phase,near,far,bob,hip:{x:0,y:-23+bob}};
}
export function kneeFor(hip,ankle,planted=false){if(planted)return{x:(hip.x+ankle.x)/2,y:(hip.y+ankle.y)/2};const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy),length=Math.max(13.5,d/2+.01),angle=Math.atan2(dy,dx)+Math.acos(Math.min(1,d/(2*length)));return{x:hip.x+Math.cos(angle)*length,y:hip.y+Math.sin(angle)*length};}
function bone(c,atlas,rect,from,to,width){const dx=to.x-from.x,dy=to.y-from.y;c.save();c.translate(from.x,from.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);c.drawImage(atlas,rect.x,rect.y,rect.w,rect.h,-width/2,-1,width,Math.hypot(dx,dy)+2);c.restore();}
function leg(c,atlas,source,foot,hip,width){const ankle={x:foot.x,y:foot.y-3.5},knee=kneeFor(hip,ankle,foot.stance||foot.y>=4.99);bone(c,atlas,{...source,h:source.h*.46},hip,knee,width);bone(c,atlas,{...source,y:source.y+source.h*.42,h:source.h*.46},knee,ankle,width*1.05);c.drawImage(atlas,source.x,source.y+source.h*.85,source.w,source.h*.15,foot.x-6,foot.y-4,9,5);}
export function rigGrip(actor,clock,mirror=false,moving=true){const a=GAIT_ART[actor],p=moving?gaitPose(clock):{bob:0},scale=a.height/a.body.h;return{x:(a.grip[0]-a.anchor)*scale*.92*(mirror?-1:1),y:-56+(a.grip[1]-a.body.y)*scale+p.bob};}
export function drawGait(c,atlas,actor,clock,x,y,mirror=false,moving=true){const a=GAIT_ART[actor],p=moving?gaitPose(clock,actorStride(actor)):{bob:0,hip:{x:0,y:-23},near:{x:-2,y:5,stance:true},far:{x:2,y:5,stance:true}},scale=a.height/a.body.h,body=a.body;c.save();c.translate(x,y);if(mirror)c.scale(-1,1);
 c.save();c.filter=(c.filter==='none'?'':c.filter)+' brightness(.7)';leg(c,atlas,a.far,p.far,p.hip,a.legWidth);c.restore();leg(c,atlas,a.near,p.near,p.hip,a.legWidth);
 const bx=(body.x-a.anchor)*scale*.92,bw=body.w*scale*.92,by=-56+p.bob;
 if(a.skirt){const cut=.82,top=a.height*cut;c.drawImage(atlas,body.x,body.y,body.w,body.h*cut,bx,by,bw,top);c.drawImage(atlas,body.x,body.y+body.h*cut,body.w,body.h*(1-cut),bx,by+top,bw,53-top);}else c.drawImage(atlas,body.x,body.y,body.w,body.h,bx,by,bw,a.height);
 c.restore();return p;
}
