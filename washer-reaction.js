import{canMove,clearSegment,findPath}from'./world.js?v=999088c371b1';
export const washerLanding=o=>({x:o.x,y:o.y+26});
export function planWasherRecoil(map,s,o){
 const start={x:s.x,y:s.y},head=washerLanding(o),away=Math.atan2(s.y-o.y,s.x-o.x);let best=null;
 for(const distance of [128,160,192])for(const angle of [away,away+.45,away-.45,away+.9,away-.9,away+1.4,away-1.4,away+Math.PI,0,Math.PI/2,Math.PI,-Math.PI/2]){
  const end={x:start.x+Math.cos(angle)*distance,y:start.y+Math.sin(angle)*distance};if(!canMove(map,end.x,end.y))continue;
  const points=[start,...findPath(map,start,end)];if(points.length<2)continue;let length=0,valid=true;
  for(let i=1;i<points.length;i++){if(!clearSegment(map,points[i-1],points[i])){valid=false;break;}length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);}if(!valid||length>260)continue;
  const separation=Math.hypot(end.x-head.x,end.y-head.y),plan={points,length,separation};if(!best||separation>best.separation)best=plan;
  if(separation>=144)return plan;
 }
 return best||{points:[start],length:0,separation:Math.hypot(start.x-head.x,start.y-head.y)};
}
export function recoilPoint(plan,progress){let distance=plan.length*Math.max(0,Math.min(1,progress));for(let i=1;i<plan.points.length;i++){const a=plan.points[i-1],b=plan.points[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(distance<=d)return{x:a.x+(b.x-a.x)*(d?distance/d:0),y:a.y+(b.y-a.y)*(d?distance/d:0)};distance-=d;}return{...plan.points.at(-1)};}
