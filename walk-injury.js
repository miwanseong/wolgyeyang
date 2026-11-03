import{PLAYER_POSES}from'./player-art.js?v=faf82fb8c86d';
import{SIDE_POSES}from'./side-art.js?v=faf82fb8c86d';
import{sideFrame}from'./gait.js?v=faf82fb8c86d';
import{WALK_ARMS,SIDE_ARMS}from'./walk-injury-data.js?v=faf82fb8c86d';
export function containsPixel(poly,x,y){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function walkInjuryPose(direction,clock,moving,arms=1){
 const side=moving&&(direction===1||direction===2),frame=side?sideFrame(clock,false,true):moving?((Math.floor(clock)%4)+4)%4:1,p=side?SIDE_POSES[0][frame]:PLAYER_POSES[direction][frame],data=side?SIDE_ARMS[frame]:WALK_ARMS[direction][frame];
 const keep=direction===3||direction===6||direction===7?1:direction===2?0:0;
 const surviving=side?(direction===1?0:1):keep,removed=arms>=2?[0,1]:[1-surviving],width=side?p.width:p.width,dx=side?-p.pivot*width:-width/2,mirror=side&&direction===2,sign=mirror?-1:1;
 return{side,frame,p,data,removed,width,dx,mirror,key:(side?'side':'walk'+direction)+':'+frame+':'+arms,grip:{x:(dx+data[surviving].hand[0]/p.w*width)*sign,y:-56+data[surviving].hand[1]/p.h*61},occluded:!side&&direction===1};
}
export function makeInjuryFrame(image,pose){
 const tile=document.createElement('canvas');tile.width=pose.p.w;tile.height=pose.p.h;const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,pose.p.x,pose.p.y,pose.p.w,pose.p.h,0,0,tile.width,tile.height);
 // Clear whole source pixels only: retain the exact original colors and gait, with no blended replacement edges.
 for(let y=0;y<tile.height;y++)for(let x=0;x<tile.width;x++)if(pose.removed.some(i=>containsPixel(pose.data[i].poly,x+.5,y+.5)))c.clearRect(x,y,1,1);
 return tile;
}
