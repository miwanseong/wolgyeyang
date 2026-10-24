import {sight} from './world.js?v=0116eea318de';
// Installed luminaires, not a light permanently attached to the player.
export const LAMPS={
 unit104:[[14.5,14,70,'fault']],
 relayEntry:[[14,10,190,'steady'],[35,11,155,'steady'],[38,19,140,'steady'],[12,26,180,'steady'],[32,26,185,'steady']],
 relayArchive:[[12,12,150,'steady'],[38,12,150,'fault'],[16,26,130,'steady'],[39,27,130,'steady']],
 relayPlant:[[12,12,100,'fault'],[35,12,105,'fault'],[46,26,105,'steady'],[14,32,80,'fault']],
 relaySignal:[[13,15,125,'steady'],[37,15,145,'steady'],[34,28,95,'fault']],
 relayYard:[[12,19,110,'steady'],[30,13,130,'steady'],[24,7,105,'steady']]
};
export function lampStrength(kind,t,reduced=false){if(kind!=='fault')return 1;if(reduced)return .4;const cycle=(t%11000)/1000;return cycle<.12||cycle>.24&&cycle<.37||cycle>1.1&&cycle<1.28?.08:cycle<2.2?.55:.35;}
export function witnessesEntry(map,enemy,s){
 if(!enemy.active)return false;
 const dx=s.x-enemy.x,dy=s.y-enemy.y,d=Math.hypot(dx,dy);
 if(d>104||!sight(map,enemy,s))return false;
 if(d<28)return true;
 const bearing=Math.atan2(dy,dx),facing=enemy.facing??0,angle=Math.atan2(Math.sin(bearing-facing),Math.cos(bearing-facing));
 return Math.abs(angle)<Math.PI/3;
}
export const PUDDLES=[[9,17.7,42,11],[18,20.1,55,14],[28,22.8,45,12],[32.8,15.2,36,10],[22,8.2,31,8]];

export function inPuddle(s){return s.map==='relayYard'&&PUDDLES.some(([x,y,rx,ry])=>Math.pow((s.x-x*32)/rx,2)+Math.pow((s.y-y*32)/ry,2)<=1);}
