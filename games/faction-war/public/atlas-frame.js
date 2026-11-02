// Rendering metadata: source rectangles are independent of collision/tile size.
export const natureFrames=[[8,35,460,547],[432,10,321,574],[759,59,450,528],[1208,0,328,586],[25,582,325,410],[370,625,399,353],[770,644,432,348],[1205,597,306,382]];
const columns=[[12,244],[244,472],[472,698],[698,893],[893,1104],[1104,1320],[1320,1554],[1554,1774]];
export function actorFrame(image,row,column,rows){const [x,end]=columns[column];return [x,rows[row],end-x,rows[row+1]-rows[row]];}
export function drawAtlasFrame(ctx,image,frame,x,y,w,h){ctx.drawImage(image,...frame,x,y,w,h);}
// Keep only the main connected sprite inside a tree/insect rectangle. Adjacent
// crowns overlap atlas columns; rectangular tile slicing alone cannot isolate them.
export function isolatedFrame(image,rect){const [x,y,w,h]=rect,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,x,y,w,h,0,0,w,h);const data=ctx.getImageData(0,0,w,h),a=data.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
 for(let k=0;k<w*h;k++){if(seen[k]||a[k*4+3]<90)continue;let head=0,tail=1;queue[0]=k;seen[k]=1;while(head<tail){const p=queue[head++],px=p%w;for(const n of [px?p-1:-1,px<w-1?p+1:-1,p-w,p+w])if(n>=0&&n<w*h&&!seen[n]&&a[n*4+3]>=90){seen[n]=1;queue[tail++]=n;}}if(tail>largest.length)largest=queue.slice(0,tail);}
 const keep=new Uint8Array(w*h);for(const p of largest)keep[p]=1;for(let k=0;k<w*h;k++)if(!keep[k])a[k*4+3]=0;ctx.putImageData(data,0,0);return c;}

export const desertFrames=[[25,12,397,587],[382,198,350,398],[704,226,394,362],[1107,130,416,458],[27,731,314,246],[403,734,312,236],[745,608,447,379],[1217,585,299,403]];
const dodgeFrames=[[[6,174,310,261],[343,164,280,271],[636,188,310,247],[960,184,283,251]],[[3,453,325,232],[328,476,300,208],[628,471,317,214],[949,471,299,214]],[[32,719,281,216],[337,725,291,210],[650,713,282,222],[962,728,277,207]],[[5,940,312,280],[337,951,285,269],[623,950,316,270],[960,958,284,261]]];
export function dodgeFrameRect(classIndex,frame){return dodgeFrames[Math.max(0,Math.min(3,frame))][classIndex];}
export function normalizedDodge(image,classIndex,frame){const rect=dodgeFrameRect(classIndex,frame),c=document.createElement('canvas');c.width=340;c.height=290;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,...rect,(340-rect[2])/2,290-rect[3],rect[2],rect[3]);return c;}
