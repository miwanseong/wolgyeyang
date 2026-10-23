import {canMove,findPath,sight} from './world.js?v=33fa1af3e093';
export const RESIDENTS=[
 {id:'haerin',name:'해린',column:0,map:'relayEntry',route:[[13,10],[16,10]],outside:[[18,22],[19,22]]},
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
 nearest(map,s){return this.actors.filter(n=>Math.hypot(n.x-s.x,n.y-s.y)<(n.id==='haerin'&&map.id==='relayEntry'?110:64)&&sight(map,s,n)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;}
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
   '젖었네. 앉아, 물부터 마시고. 네가 어릴 때도 그렇게 손을 꼭 쥐고 있었지. 혼날 말이 있으면.\n열쇠는 가지고 왔어. 닦아도 손에서 쇠 냄새가 안 빠지는 것 같더라. 네가 증거를 버리자고 했으면 난 안 왔어. 그건 알아 둬.',
   '그날도 내가 건넨 열쇠는 맞았어. 덧댄 빗장이 열리지 않았을 뿐이지. 그 말만 되풀이하면 내가 늦었다는 사실이 없어질까.\n미정의 그림자는 한 박자 늦게 고개를 돌린다.',
   '서하야, 누가 웃었니? 나는 아니야. 사람들 목소리가 내선에서 새고 있어. 우리는 밖으로 나갈게. 네가 확인하려던 기록은 끝까지 들어.',
   '여기 셋 다 있어. 방 안에서 우리를 봤다면 따라가지 마. 문 밖의 찬 공기를 한번 느끼고, 네가 챙긴 기록이 뭔지 다시 봐.'
  ],
  dohyun:[
   '거기, 젖은 손으로 만지지 마세요. 죄송합니다. 사람보다 장비부터 보게 돼서요. 해린 씨 연락 받고 왔습니다.\n당시 보고서에는 정상이라고 썼어요. 그 단어가 제 이름 옆에 아직 붙어 있더군요. 장비가 정상이었다는 뜻이지, 제가 정상적으로 행동했다는 뜻은 아니었는데.',
   '문 두드리는 소리를 들었어요. 배관 소리라고 고친 건 나중이에요. …당신도 기록을 고쳤습니까?\n도현이 내 손의 봉투만 바라본다.',
   '분리한 회선에서 왜 다시 음성이 들어오죠? 원본 데크는 위층입니다. 냉각은 유지할 테니, 우리 셋은 외부 마당으로 빠질게요.\n계기판에는 아무도 누르지 않은 확인 표시가 반복된다.',
   '안전한 출구는 이쪽이에요. 기계가 꺼져도 남는 소리가 있어요. 고장으로 적어서 없앨 수 있는 건 아니겠죠.'
  ]};
 return lines[n.id][phase];
}

export function residentExpression(s,n){if(residentPhase(s)===2)return 2;const r=s.investigation?.rolls[n.id];if(r)return r.success?3:1;return [0,1,2,3][residentPhase(s)];}

export const RESIDENT_QUESTIONS={
 haerin:[['왜 다시 연락했어요?','원본의 끝에 제 수정 번호가 남아 있었어요. 지운 줄만 알았는데, 숨긴 시간까지 남더라고요. 서하 씨가 먼저 말해 주길 기다렸어요. 그러면 제 차례는 안 올 줄 알고. 비겁하죠. 그래도 오늘은 제 이름을 빼지 않을게요.'],['표시만 고쳤다는 게 무슨 뜻이죠?','접수 화면에 보이는 줄과 장비에 남는 줄은 달라요. 취소 뒤 다시 걸려 온 줄, 저는 화면에서만 안 보이게 했어요. 원본에서조차 없어진 건 아니었어요. 서랍의 출력물 모서리를 보세요. 제 손글씨가 아니라 기계가 찍은 수정 번호예요.']],
 mijeong:[['그 열쇠로 왜 못 열었어요?','원래 잠금장치는 열렸어. 손목에 힘이 풀릴 만큼 돌려 봤으니까 알아. 그런데 문은 한 치도 안 움직였지. 그때 왜 다른 걸 의심하지 못했을까. 내 열쇠가 틀렸다는 생각만 했어. 누가 안쪽에 뭘 덧댔다는 생각은 못 하고.'],['아직 여길 지키는 이유가 있어요?','지키는 게 아니라 못 떠나는 거야. 침대 시트도 갈고 물도 끓이고, 멀쩡한 하루처럼 만들면 그날도 하루 중 하나가 될 줄 알았어. 도구함의 확대경 써. 나는 요새 작은 글씨가 안 보여. 보여도 읽고 싶지 않을 때가 있고.']],
 dohyun:[['무슨 소리를 들었어요?','세 번. 같은 간격은 아니었어요. 그걸 배관 진동이라고 적었습니다. 실제 배관 소리는 일정해요. 알고도 그렇게 쓴 겁니다. 지금도 불규칙한 소리가 나면 시간을 재요. 이번에는… 사람 소리인지 먼저 들어야겠죠.'],['시험기는 빌릴 수 있나요?','정비대의 세 시험 접점을 복귀 순서대로 눌러 주세요. 지워진 순서는 정비대 옆 표찰에 남아 있어요. 시험이 끝나면 공구함 잠금이 풀립니다. 본 회선과 분리된 시험기예요. 그걸로 사고 설비를 켜지는 마세요.']],
};
