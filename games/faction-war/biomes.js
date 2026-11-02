import {continentSurface,continentBlocked} from './continent.js';
// Authored landmarks plus seeded scatter, shared collision/rendering coordinates.
const cache=new Map();
export function biomeObjects(region){if(cache.has(region))return cache.get(region);const out=[];const land=region==='highlands'?2:region==='ruins'?3:region==='deep'?4:-1;if(land>=0)for(let i=0;i<(region==='deep'?70:45);i++){const x=10+(i*37.71)%170,y=14+(i*23.93)%116;if(['forest','ruins'].includes(region)&&Math.hypot(x-96,y-72)<12)continue;if(Math.abs(y-72)<5||Math.abs(x-72)<5||Math.abs(y-24)<5||Math.abs(x-120)<5)continue;out.push({x,y,index:region==='deep'?i%3===0?5:4:land,w:region==='deep'?2:2.8,h:region==='deep'?2.2:region==='highlands'?2.6:3.6,solid:region!=='deep'});}if(region==='deep')out.unshift(...[{x:112,y:14,index:4,w:3,h:2.6},{x:128,y:18,index:5,w:2.8,h:3.5},{x:108,y:24,index:5,w:2.4,h:3},{x:132,y:27,index:4,w:3.4,h:2.8}].map(o=>({...o,solid:false})));cache.set(region,out);return out;}
export function biomeBlocked(region,x,y){return continentBlocked(region,x,y)||terrainCliff(region,x,y)||biomeObjects(region).some(o=>o.solid&&Math.hypot(x-o.x,y-o.y)<.65);}
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const mound=(x,y,cx,cy,rx,ry,h)=>h*Math.pow(Math.max(0,1-((x-cx)/rx)**2-((y-cy)/ry)**2),2);
function terrace(x,y){const edge=Math.min(x-74,110-x,y-36,58-y);let h=2.6*smooth(edge/1.3);if(x>=91&&x<=99&&y>=24&&y<=72){const ramp=y<36?smooth((y-24)/12):y>58?smooth((72-y)/14):1;h=Math.max(h,2.6*ramp*smooth(Math.min(x-90,100-x)/2));}return h;}
export function elevation(region,x,y){
 const sample=continentSurface(region,x,y);if(sample)return sample.height;
 if(Math.abs(x-147)<5)return 0;
 let h=0;
 if(region==='village'){if(x>=63&&x<=142&&y>=40&&y<=100||x>=151&&y>=45&&y<=100)return 0;h=mound(x,y,49,94,23,26,2.1)+mound(x,y,30,45,20,22,1.5);h*=smooth(Math.abs(y-72)/4);}
 else if(region==='forest'){h=terrace(x,y)+mound(x,y,135,100,26,22,1.8)+mound(x,y,45,90,23,18,1.2);h*=smooth(Math.abs(y-24)/2.5);}
 else if(region==='highlands'){if(Math.abs(y-72)<4||Math.abs(x-72)<4||y<9||x<9)return 0;const ridge=Math.max(0,Math.sin(x*.075)*Math.cos(y*.065)),fade=Math.min(1,(Math.abs(y-72)-4)/6,(Math.abs(x-72)-4)/6,(x-9)/6,(y-9)/6);h=Math.max(0,ridge*3.8*fade);}
 else if(region==='coast'){h=(mound(x,y,112,40,24,20,2.5)+mound(x,y,48,78,30,12,1.1))*smooth((94-y)/12);}
 else if(region==='meadow')h=mound(x,y,100,96,38,25,1.2)+mound(x,y,35,48,28,18,.8);
 else if(region==='marsh')h=mound(x,y,50,47,18,17,.8)+mound(x,y,98,98,20,15,1.1);
 else if(region==='island')h=mound(x,y,98,93,39,31,3)+mound(x,y,44,38,20,18,1.4);
 else if(region==='ruins')h=mound(x,y,155,99,28,24,2.1);
 else if(region==='deep')h=mound(x,y,100,62,32,28,1.8)+mound(x,y,44,105,30,19,1.1);
 return Math.max(0,h);
}
export function terrainSlope(region,x,y){return Math.hypot((elevation(region,x+.15,y)-elevation(region,x-.15,y))/.3,(elevation(region,x,y+.15)-elevation(region,x,y-.15))/.3);}
export function terrainCliff(region,x,y){return region==='forest'&&terrainSlope(region,x,y)>1.65;}
