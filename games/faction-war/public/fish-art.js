import {assetImage} from './assets.js';
import {fishAtlasRows} from '/asset-layout.js';
import {fishById} from '/fish-catalog.js';
export const fishAtlasFiles=['fish-river.webp','fish-lake.webp','fish-shore.webp','fish-abyss.webp'];export const fishImages=fishAtlasFiles.map(name=>{const im=assetImage('/assets/'+name);return im;});
export function drawFish(ctx,fish,x,y,w,h){const s=fishById[fish.speciesId||fish.id];if(!s)return;const im=fishImages[s.atlas];if(!im.naturalWidth)return;const sw=im.width/4,rows=fishAtlasRows[s.atlas],row=Math.floor(s.icon/4),sy=rows[row],sh=rows[row+1]-sy;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,s.icon%4*sw,sy,sw,sh,x,y,w,h);}
export function fishIcon(fish,w=96,h=48){const c=document.createElement('canvas');c.width=w;c.height=h;c.className='fish-icon';const s=fishById[fish.speciesId||fish.id];if(!s)return c;const paint=()=>drawFish(c.getContext('2d'),fish,0,0,w,h),im=fishImages[s.atlas];if(im.complete)paint();else im.addEventListener('load',paint,{once:true});return c;}
