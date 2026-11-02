import {assetImage} from './assets.js';
export const catImage=assetImage('/assets/cat-motion.webp');
export function catFrame(cat,time=Date.now()){return cat.moving?Math.floor(time/140)%4:0;}
export function drawCat(ctx,cat,x,y,width=32,height=28){if(!catImage.naturalWidth)return;const sw=catImage.width/4,sh=catImage.height/3;ctx.save();ctx.translate(x,y);if(cat.facing<0)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(catImage,catFrame(cat)*sw,cat.type*sh,sw,sh,-width/2,-height,width,height);ctx.restore();}
