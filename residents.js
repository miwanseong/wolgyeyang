import {canMove,findPath,sight} from './world.js?v=abbeb66692c5';
export const RESIDENTS=[
 {id:'haerin',name:'해린',column:0,map:'relayEntry',route:[[16,14],[16,16]],outside:[[18,22],[19,22]]},
 {id:'mijeong',name:'미정',column:1,map:'relayEntry',route:[[35,16],[37,16]],outside:[[22,23],[24,23]]},
 {id:'dohyun',name:'도현',column:2,map:'relayPlant',route:[[35,17],[40,17]],outside:[[26,21],[28,21]]},
];
export function residentPhase(s){return s.flags.relayLastVoice?3:s.flags.relayPower?2:s.flags.relayCompared?1:0;}
export class Residents{
 constructor(){this.reset();}
 reset(){this.map=null;this.actors=[];}
 update(map,s,dt,allowed=true){
  const phase=residentPhase(s),definitions=RESIDENTS.filter(n=>(phase===3?'relayYard':n.map)===map.id);
  if(this.map!==map.id||this.phase!==phase){this.map=map.id;this.phase=phase;this.actors=definitions.map(n=>{const route=phase===3?n.outside:n.route;return{...n,npc:true,phase,route,x:route[0][0]*32,y:route[0][1]*32,target:1,wait:1,path:[],repath:0,walk:0,direction:0,moving:false};});}
  if(!allowed)return this.actors;
  for(const n of this.actors){
   n.moving=false;n.wait=Math.max(0,n.wait-dt);
   if(n.wait)continue;
   const target={x:n.route[n.target][0]*32,y:n.route[n.target][1]*32};
   n.repath-=dt;if(n.repath<=0){n.path=findPath(map,n,target);n.repath=.6;}
   const p=n.path[0]||target,dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy);
   if(d<5&&n.path.length)n.path.shift();
   if(Math.hypot(target.x-n.x,target.y-n.y)<7){n.target=(n.target+1)%n.route.length;n.wait=phase===2?4:2;n.repath=0;continue;}
   if(d>0){const step=Math.min(d,dt*(phase===2?15:32)),x=n.x+dx/d*step,y=n.y+dy/d*step;
    if((Math.hypot(x-s.x,y-s.y)>26||Math.hypot(x-s.x,y-s.y)>Math.hypot(n.x-s.x,n.y-s.y))&&canMove(map,x,y)){n.x=x;n.y=y;n.walk+=dt*5;n.moving=true;n.direction=Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy<0?3:0;}
   }
   if(phase>=1&&Math.hypot(n.x-s.x,n.y-s.y)<160){const x=s.x-n.x,y=s.y-n.y;n.direction=Math.abs(x)>Math.abs(y)?x>0?2:1:y<0?3:0;}
  }
  return this.actors;
 }
 nearest(map,s){return this.actors.filter(n=>Math.hypot(n.x-s.x,n.y-s.y)<64&&sight(map,s,n)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;}
}
export function residentDialogue(s,n){
 const phase=residentPhase(s),lines={
  haerin:[
   '연락 받고 먼저 왔어요. 원본을 대조하려면 담당자가 있어야 하니까요. 미정 씨는 당직실에, 도현 씨는 지하 냉각실에 있어요.\n출입증은 인계대 서랍에 뒀어요. 기록동은 북쪽 연결문, 지하 계단은 동쪽 당직실 안입니다.',
   '사본을 받았네요. …그런데 왜 내 이름까지 같이 출력됐죠? 수정한 건 표시뿐이었어요. 원본은 지우지 않았다고요.\n해린은 내가 멈출 때마다 같은 걸음 수만큼 멈춘다.',
   '확인했습니다. 문은 열렸습니다. 확인했습니다.\n입술은 멎었는데 내선에서 같은 말이 한 번 더 들린다. 해린은 한참 뒤에야 「지금 나는 아무 말도 안 했어요」라고 한다.',
   '내 수정 이력도 같이 내세요. 안쪽에서 들리는 목소리는 제 것이 아니에요. 세 사람은 밖에서 기다릴게요.'
  ],
  mijeong:[
   '네 전화 받고 관리 열쇠를 가지고 왔어. 증거를 버리러 오는 줄 알았으면 안 왔지.\n당직실엔 침대와 차 끓일 곳이 있어. 현장 직원은 거기서 쉬었어. 이곳은 아파트가 아니라 시설 중계소야. 바깥 마당으로 나가면 세 사람 차가 모두 있을 거야.',
   '그날도 내가 건넨 열쇠는 맞았어. 덧댄 빗장이 열리지 않았을 뿐이지. 그 말만 되풀이하면 내가 늦었다는 사실이 없어질까.\n미정의 그림자는 한 박자 늦게 고개를 돌린다.',
   '서하야, 누가 웃었니? 나는 아니야. 사람들 목소리가 내선에서 새고 있어. 우리는 밖으로 나갈게. 네가 확인하려던 기록은 끝까지 들어.',
   '여기 셋 다 있어. 방 안에서 우리를 봤다면 따라가지 마. 문 밖의 찬 공기를 한번 느끼고, 네가 챙긴 기록이 뭔지 다시 봐.'
  ],
  dohyun:[
   '해린 씨가 원본 장비를 봐 달래서 왔어요. 도면 없이 전원부터 올리면 안 됩니다.\n서쪽은 펌프와 순환 배관, 동쪽은 입력 분리와 절체반입니다. 정비대 잠금함에서 핸들을 찾고, 배관 점검판을 맞춘 뒤 밸브를 여세요.',
   '문 두드리는 소리를 들었어요. 배관 소리라고 고친 건 나중이에요. …당신도 기록을 고쳤습니까?\n도현이 내 손의 봉투만 바라본다.',
   '분리한 회선에서 왜 다시 음성이 들어오죠? 원본 데크는 위층입니다. 냉각은 유지할 테니, 우리 셋은 외부 마당으로 빠질게요.\n계기판에는 아무도 누르지 않은 확인 표시가 반복된다.',
   '안전한 출구는 이쪽이에요. 기계가 꺼져도 남는 소리가 있어요. 고장으로 적어서 없앨 수 있는 건 아니겠죠.'
  ]};
 return lines[n.id][phase];
}
