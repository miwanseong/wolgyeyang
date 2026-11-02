import {assetImage} from './assets.js';
import {farmingMotionRows} from '/asset-layout.js';
export const farmingImage=assetImage('/assets/farming-motion.webp');
export function farmingFrame(m,now=Date.now()){return Math.max(0,Math.min(7,Math.floor((now-m.startedAt)/125)));}
export function drawFarmingActor(ctx,index,actor,x,y,w,h){const m=actor.farmMotion,im=farmingImage;if(!m||m.endsAt<Date.now()||!im.naturalWidth||actor.hurtUntil>Date.now())return false;const y0=farmingMotionRows[index]*im.height/887,sh=(farmingMotionRows[index+1]-farmingMotionRows[index])*im.height/887;ctx.save();ctx.translate(x,y);if(actor.facing<0)ctx.scale(-1,1);ctx.drawImage(im,farmingFrame(m)*im.width/8,y0,im.width/8,sh,-w/2,-h,w,h);ctx.restore();return true;}
