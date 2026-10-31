import{bodyState,injuryDirection}from'./body.js?v=ae58b5091df2';
export const CRAWL_SCALE=.132,CRAWL_STRIDE=42;
export const ARM_CRAWL_RECTS=[[[38,28,307,240],[428,23,299,231],[795,25,314,246],[1194,25,305,229]],[[13,198,371,237],[411,197,357,244],[768,206,384,231],[1169,196,355,243]],[[27,623,357,239],[414,619,354,245],[768,638,384,224],[1152,619,334,243]],[[20,753,298,237],[431,753,275,238],[806,753,313,248],[1203,753,297,238]]];
export const SINGLE_CRAWL_RECTS=[[[47,30,291,238],[430,25,285,229],[813,28,292,242],[1198,28,290,227]],[[14,273,348,220],[441,273,293,221],[778,274,364,219],[1219,274,287,225]],[[34,505,350,227],[422,505,291,217],[790,507,362,228],[1152,507,332,222]],[[22,737,292,221],[444,739,271,222],[814,739,330,222],[1213,740,265,221]]];
const MOUTHS=[[[189,177],[569,177],[956,177],[1336,177]],[[98,341],[474,342],[854,347],[1218,340]],[[327,770],[693,773],[1104,785],[1468,773]],[[185,840],[569,840],[957,840],[1338,840]]];
const SINGLE_MOUTHS=[[[189,177],[570,177],[956,177],[1338,177]],[[104,406],[489,408],[871,407],[1257,408]],[[285,648],[661,647],[1062,650],[1457,649]],[[185,825],[572,825],[956,825],[1336,825]]];
const clocks=new WeakMap();
export function crawlMotion(s){let c=clocks.get(s);const mode=bodyState(s).arms;if(!c||c.map!==s.map||c.mode!==mode){c={x:s.x,y:s.y,map:s.map,mode,distance:0};clocks.set(s,c);}const step=Math.hypot(s.x-c.x,s.y-c.y);if(step<=32)c.distance+=step;else c.distance=0;c.x=s.x;c.y=s.y;return{distance:c.distance,phase:(c.distance%CRAWL_STRIDE)/CRAWL_STRIDE};}
export function crawlSpeed(s){return 42*(1-.3*Math.sin(crawlMotion(s).phase*Math.PI*4));}
export function crawlPose(s,direction){const row=injuryDirection(direction),frame=Math.min(3,Math.floor(crawlMotion(s).phase*4)),single=bodyState(s).arms>0;let index=frame,mirror=false;
 if(row===3&&single){index=frame%2?1:2;mirror=frame%2===1;}else if(frame===3&&(row===0||row===3)){index=1;mirror=true;}
 const rect=(single?SINGLE_CRAWL_RECTS:ARM_CRAWL_RECTS)[row][index],mouth=(single?SINGLE_MOUTHS:MOUTHS)[row][index],pivot=mouth[0]+(row===1?80:row===2?-80:0),sign=mirror?-1:1;
 return{row,frame,index,mirror,rect,atlas:single?'single':row===1||row===2?'side':'arms',dx:(rect[0]-pivot)*CRAWL_SCALE,dy:5-rect[3]*CRAWL_SCALE,w:rect[2]*CRAWL_SCALE,h:rect[3]*CRAWL_SCALE,mouth:{x:(mouth[0]-pivot)*CRAWL_SCALE*sign,y:5-(rect[1]+rect[3]-mouth[1])*CRAWL_SCALE}};
}
