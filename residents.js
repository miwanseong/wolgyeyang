import {canMove,findPath,sight} from './world.js?v=eaf575030a38';
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
   '연락 받고 먼저 왔어요. 원본과 제가 수정한 화면을 같이 대조하려고요. 출입증은 인계대 서랍에 있어요. 저는 취소 뒤의 재통화 한 줄을 화면에서 숨겼습니다.',
   '사본에 제 수정 번호가 있네요. 원본을 지운 게 아니라 표시를 숨긴 겁니다. 기록동 수정 이력 서랍에 남은 출력물로 확인할 수 있어요.',
   '전원을 넣은 뒤부터 내선이 과거의 답변을 반복해요. 방금 「확인했습니다」는 제가 한 말이 아니에요. 우리는 밖으로 나갈게요. 목소리가 들려도 저를 따라오라는 뜻으로 듣지 마세요.',
   '여기 셋 다 나왔어요. 제 수정 번호도 증거에 넣어 주세요. 안에서 제 목소리가 들려도 저는 여기 있어요.'
  ],
  mijeong:[
   '비 많이 맞았네. 열쇠는 가지고 왔어. 원래 잠금장치는 이걸로 열렸지만, 정우가 덧댄 빗장은 열 수 없었어. 그 차이를 당직 수첩에 적어 놨어.',
   '접수증에 해제라고 찍혀 있어도 빗장이 열렸다는 뜻은 아니었어. 당직 수첩에는 내가 직접 돌려 본 시각도 있어. 내 기억보다 그걸 봐 줘.',
   '내선에서 네 동생 목소리가 나왔어. 지금 전화한 게 아니라 그날 녹음이라는 거지? 난 해린이랑 밖에서 기다릴게. 안에 누가 남았다고 해서 혼자 찾으러 가지 마.',
   '해린, 도현, 나. 셋 다 여기 있어. 봉투에 원본과 사본을 따로 넣었니? 나중에 누가 고쳤는지 구분할 수 있어야 해.'
  ],
  dohyun:[
   '젖은 손으로 절체반을 만지지 마세요. 저는 장비 확인을 맡았어요. 냉각이 멈춰 있어서 지금은 녹음 데크 전원을 올릴 수 없습니다. 먼저 서쪽 순환실을 확인해야 해요.',
   '진술서에서 문 두드리는 소리를 배관 진동으로 고쳤습니다. 처음 적은 진술은 접수 원본 뒤에 남아 있어요. 고친 사유까지 같이 보존해 주세요.',
   '원본 데크가 돌아갑니다. 서로 다른 장비에서 뜬 복제 신호는 재생 위치와 극성을 맞춰야 해요. 기준 펄스가 겹치면 끊긴 통화를 분리해 들을 수 있습니다. 원본 자체를 편집하는 건 아닙니다.',
   '장비 운전 기록도 가져가세요. 원격 응답이 왔다는 사실과 문이 실제로 열렸다는 사실은 다릅니다. 보고서에서 제가 그 둘을 섞었습니다.'
  ]};
 return lines[n.id][phase];
}

export function residentExpression(s,n){if(residentPhase(s)===2)return 2;const r=s.investigation?.rolls[n.id];if(r)return r.success?3:1;return [0,1,2,3][residentPhase(s)];}

export const RESIDENT_QUESTIONS={
 haerin:[['왜 다시 연락했어요?','서하 씨가 가져온 접수증에는 재통화가 없잖아요. 제가 화면에서 숨긴 줄이에요. 원본 녹음과 수정 이력을 같이 보면 제가 숨긴 시각까지 드러나요. 그 둘을 같이 내려고 연락했어요.'],['표시만 고쳤다는 게 무슨 뜻이죠?','접수 화면에 보이는 줄과 장비에 남는 줄은 달라요. 취소 뒤 다시 걸려 온 줄, 저는 화면에서만 안 보이게 했어요. 원본에서조차 없어진 건 아니었어요. 서랍의 출력물 모서리를 보세요. 제 손글씨가 아니라 기계가 찍은 수정 번호예요.']],
 mijeong:[['그 열쇠로 왜 못 열었어요?','원래 잠금장치는 열렸어. 손목에 힘이 풀릴 만큼 돌려 봤으니까 알아. 그런데 문은 한 치도 안 움직였지. 그때 왜 다른 걸 의심하지 못했을까. 내 열쇠가 틀렸다는 생각만 했어. 누가 안쪽에 뭘 덧댔다는 생각은 못 하고.'],['아직 여길 지키는 이유가 있어요?','당직 수첩과 열쇠를 직접 넘기려고 기다렸어. 열쇠에는 그날 돌리다 긁힌 자국이 남아 있어. 도구함의 확대경으로 봐. 수첩 시각이랑 대조하면 내가 문 앞에 늦게 간 사실도 확인될 거야.']],
 dohyun:[['무슨 소리를 들었어요?','세 번. 같은 간격은 아니었어요. 그걸 배관 진동이라고 적었습니다. 그때 펌프는 정지 상태였어요. 운전 기록을 보고도 배관 진동이라고 고쳤습니다. 지금도 불규칙한 소리가 나면 시간을 재요. 이번에는… 사람 소리인지 먼저 들어야겠죠.'],['시험기는 빌릴 수 있나요?','정비대의 세 시험 접점을 복귀 순서대로 눌러 주세요. 지워진 순서는 정비대 옆 표찰에 남아 있어요. 시험이 끝나면 공구함 잠금이 풀립니다. 본 회선과 분리된 시험기예요. 그걸로 사고 설비를 켜지는 마세요.']],
};

export const FOLLOW_UP={
 haerin:[['원본과 수정 이력을 둘 다 가져가면 증명할 수 있겠네요.','네. 취소 통화 데크와 수정 이력 서랍의 번호가 같아야 합니다. 제 말만 받아 적지 말고 두 번호를 확인해 주세요.'],['그럼 취소 뒤에도 서윤에게 전화가 왔다는 거죠?','네. 수신 이력은 23:44예요. 무슨 말을 했는지는 송출층의 원본 데크에 남아 있어요.']],
 mijeong:[['해제 접수증만 보고 문이 열렸다고 믿으면 안 됐어요.','그래. 수첩의 열쇠 사용 시각과 23:47 잠금 유지 회신을 같이 봐. 취소 이후에도 문이 안 열렸다는 증거가 돼.'],['그 자국과 수첩을 함께 남길게요.','내가 제때 도착했다고 적지는 마. 시각을 그대로 남겨. 네가 고칠 이유는 없어.']],
 dohyun:[['펌프가 꺼져 있었다면 제 최초 보고도 틀린 거네요.','네. 운전 기록에는 정지가 남아 있습니다. 최초 진술과 수정 진술을 겹쳐 놓으면 무엇을 바꿨는지 확인됩니다.'],['시험 접점으로 확인하고 도구를 빌릴게요.','표찰의 B, A, C 순서입니다. 본 회선은 냉각 확인 뒤에 분리하고 투입하세요. 시험 접점과 전원 절체반을 혼동하면 안 됩니다.']]
};

RESIDENT_QUESTIONS.haerin.push(['이곳은 정확히 어떤 곳이에요?','아파트 위탁관리사가 쓰던 시설 출동 중계소예요. 주민의 출동 요청과 원격 명령, 녹음의 백업을 보관합니다. 접수 완료 신호와 문이 실제 열린 신호는 별개인데, 그날 보고서는 둘을 같은 뜻으로 썼어요.']);
FOLLOW_UP.haerin.push(['그럼 여기서는 통화 기록과 실제 설비 기록을 대조해야겠네요.','맞아요. 기록동에서 접수와 취소, 잠금 유지 회신을 먼저 비교해 주세요. 마지막 통화는 송출층 원본 데크에 있어요. 내선에서 반복되는 목소리 대신 기록의 시각과 발신자를 확인해야 합니다.']);
