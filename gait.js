import {SIDE_POSES} from './side-art.js?v=58afa086feda';
export const PLAYER_STRIDE=72,NPC_STRIDE=40;
export function actorStride(actor,running=false){return actor===0?(running?96:PLAYER_STRIDE):actor===2?32:NPC_STRIDE;}
export function advanceGait(clock,distance,stride=PLAYER_STRIDE){return clock+Math.max(0,distance)/stride*4;}
export function footContacts(before,after){return Math.max(0,Math.floor(after/2)-Math.floor(before/2));}
export function sideFrame(clock,mirror=false,moving=true){return moving?((Math.floor(clock*2)%8)+8)%8:2;}
export function sideGrip(actor,clock,mirror=false,moving=true){const p=SIDE_POSES[actor][sideFrame(clock,mirror,moving)];return{x:(p.grip[0]-p.pivot)*p.width*(mirror?-1:1),y:-56+p.grip[1]*61};}
export function drawSide(c,atlas,actor,clock,x,y,mirror=false,moving=true){const p=SIDE_POSES[actor][sideFrame(clock,false,moving)];c.save();c.translate(x,y);if(mirror)c.scale(-1,1);c.drawImage(atlas,p.x,p.y,p.w,p.h,-p.pivot*p.width,-56,p.width,61);c.restore();}
