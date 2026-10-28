import {canMove,findPath,sight} from './world.js?v=1b5f6d415336';
import {advanceGait,actorStride} from './gait.js?v=1b5f6d415336';
// The hunter still has one player target; civilians actively seek cover instead of freezing.
export function fleeActor(map,s,n,threat,dt){
 n.grabbed=Math.max(0,(n.grabbed||0)-dt);
 if(n.dying){n.dying+=dt;n.moving=false;if(n.dying>=1.2){n.gone=true;s.crowdRemains??=[];if(!s.crowdRemains.some(r=>r.map===map.id&&r.index===n.crowdIndex))s.crowdRemains.push({map:map.id,index:n.crowdIndex,x:n.x,y:n.y});s.flags['crowdLost_'+map.id+'_'+n.crowdIndex]=true;}return true;}
 if(!threat?.active){n.fleePath=null;return false;}
 const distance=Math.hypot(threat.x-n.x,threat.y-n.y);
 if(distance>380||!sight(map,n,threat)&&!n.fleePath)return false;
 n.panic=3;n.wait=0;n.moving=false;
 if(distance<34&&!n.catchSeen&&(n.ambient||!s.flags['npcCaught_'+n.id])){n.catchSeen=true;n.grabbed=.65;if(n.ambient){n.dying=.01;s.flags['crowdCaught_'+map.id]=true;return true;}s.flags['npcCaught_'+n.id]=true;s.flags['npcEscaped_'+n.id]=true;s.flags['npcInjured_'+n.id]=true;n.injury=n.id==='mijeong'?'leg':'arm';n.reactionLine=({haerin:'놔…! 서하 씨, 문 쪽으로!',mijeong:'발 놔! 뛰어, 뒤돌아보지 마!',dohyun:'잡혔… 아니, 손 뺐습니다. 물러나세요!'})[n.id];}
 if(n.grabbed)return true;
 n.fleeRepath=(n.fleeRepath||0)-dt;
 if(n.fleeRepath<=0||!n.fleePath?.length){
  const candidates=[];
  for(let y=2;y<map.h-2;y+=2)for(let x=2;x<map.w-2;x+=2){const p={x:x*32+16,y:y*32+16},travel=Math.hypot(p.x-n.x,p.y-n.y),away=Math.hypot(p.x-threat.x,p.y-threat.y);if(travel>50&&travel<280&&away>distance+35&&canMove(map,p.x,p.y))candidates.push({...p,score:away-travel*.2+(!sight(map,p,threat)?180:0)});}
  candidates.sort((a,b)=>b.score-a.score);n.fleePath=[];
  for(const p of candidates.slice(0,16)){const path=findPath(map,n,p);if(path.length){n.fleePath=path;break;}}n.fleeRepath=.7;
 }
 const p=n.fleePath?.[0];if(!p)return true;const dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy);if(d<5){n.fleePath.shift();return true;}
 const step=Math.min(d,dt*(n.injury==='leg'?50:n.catchSeen?124:102)),x=n.x+dx/d*step,y=n.y+dy/d*step;
 if(canMove(map,x,y)){n.x=x;n.y=y;n.walk=advanceGait(n.walk,step,actorStride(n.column+1));n.moving=true;n.direction=Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy<0?3:0;}else n.fleeRepath=0;
 return true;
}
export function assistResident(s,id,mode,isRecoveryItem){
 if(!['haerin','mijeong','dohyun'].includes(id)||!s.flags['npcInjured_'+id]||s.flags['npcRescued_'+id]&&mode==='escort')return false;
 if(mode==='thread'){const item=s.bag.find(isRecoveryItem);if(!item)return false;s.bag=s.bag.filter(k=>k!==item);s.flags['npcInjured_'+id]=false;s.flags['npcHealed_'+id]=true;}
 else if(mode!=='escort')return false;
 s.flags['npcRescued_'+id]=true;return true;
}
export function residentOutcome(s){
 const names={haerin:'해린',mijeong:'미정',dohyun:'도현'},lines=[];
 for(const [id,name]of Object.entries(names)){if(s.flags['npcHealed_'+id])lines.push(name+'의 잃었던 윤곽이 돌아왔다. 내가 감아 준 실이 바닥으로 풀렸다.');else if(s.flags['npcRescued_'+id])lines.push(name+'에게는 잃은 자리가 남았다. 부축해 나온 사람의 무게가 아직 팔에 남아 있다.');else if(s.flags['npcInjured_'+id])lines.push(name+'은 빈 소매와 다친 몸을 안고 다른 사람의 도움으로 빠져나왔다. 나는 바로 곁에 있었지만 손을 내밀지 않았다.');}
 return lines.length?['같이 나온 사람들',lines.join('\n'),'']:null;
}
