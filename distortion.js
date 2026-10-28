// A saved exploration clock ages the building; it never moves collision walls or exits.
export function distortionStage(s){const n=s.flags?.chapter2?(s.relayExposure||0):0;return n>=900?3:n>=480?2:n>=180?1:0;}
export function advanceDistortion(s,dt,allowed=true){if(!allowed||!s.flags.chapter2||!(s.flags.relayIncoming||s.flags.relayCancel)||s.ending||s.bag.includes('relayExport'))return;const before=distortionStage(s);s.relayExposure=Math.min(86400,(s.relayExposure||0)+Math.max(0,dt));return distortionStage(s)>before?distortionStage(s):null;}
export function drawDistortion(c,map,s,t,reduced,atlas,art){
 const stage=distortionStage(s);if(!stage)return;
 const strength=Math.min(1,((s.relayExposure||0)-120)/780),seed=map.id.length*7;
 c.save();c.beginPath();for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++)if(map.grid[y][x]===1)c.rect(x*32,y*32,32,32);c.clip();
 // Stains remain in the same world positions on every revisit and spread with time.
 for(let y=2;y<map.h-2;y++)for(let x=2;x<map.w-2;x++){
  if(map.grid[y][x]!==1)continue;let n=Math.imul(x+seed,374761393)^Math.imul(y+11,668265263);n=Math.imul(n^(n>>>13),1274126177);const hash=((n^(n>>>16))>>>0)%193;
  if(hash<stage*4){c.fillStyle=`rgba(31,12,17,${.08+strength*.2})`;c.beginPath();c.ellipse(x*32+15,y*32+16,14+strength*22,4+strength*10,hash,0,7);c.fill();
   if(stage>=2&&atlas){const p=art[hash%3];c.save();c.globalAlpha=.18+strength*.32;c.drawImage(atlas,p.x,p.y,p.w,p.h,x*32-7,y*32+3,44,22);c.restore();}}
  if(hash<stage*8){c.strokeStyle=`rgba(83,48,48,${.1+strength*.23})`;c.lineWidth=.7;c.beginPath();c.moveTo(x*32,y*32);c.lineTo(x*32+8,y*32+13);c.lineTo(x*32+5,y*32+21);c.lineTo(x*32+22,y*32+32);c.stroke();}
 }
 if(stage>=2)for(const o of map.objects.filter(o=>!o.mount&&o.solid&&!o.internalDoor&&!o.to)){c.fillStyle=`rgba(4,3,7,${.1+strength*.2})`;c.beginPath();c.moveTo(o.x-10,o.y);c.lineTo(o.x+9,o.y);c.lineTo(o.x+20+strength*26,o.y+35+strength*35);c.lineTo(o.x+4,o.y+30+strength*30);c.closePath();c.fill();}
 c.restore();
 // Wet runs originate on actual wall faces, rather than floating over empty space.
 if(stage>=2){c.save();c.strokeStyle=`rgba(66,24,33,${.16+strength*.35})`;c.lineWidth=1;for(let y=1;y<map.h-1;y++)for(let x=1;x<map.w-1;x++)if(map.grid[y][x]===2&&map.grid[y+1]?.[x]===1&&(x*17+y*31+seed)%7===0){const xx=x*32+13;c.beginPath();c.moveTo(xx,y*32+9);c.bezierCurveTo(xx-3,y*32+24,xx+7,y*32+35,xx+2,y*32+45+strength*18);c.stroke();}c.restore();}
}
