import {fleeActor} from './npc-threat.js?v=25209e3f9bf5';
import {npcCorruption,corruptionReply,FEAR_LINES} from './resident-corruption.js?v=25209e3f9bf5';
import {advanceGait,actorStride} from './gait.js?v=25209e3f9bf5';
import {canMove,findPath,sight} from './world.js?v=25209e3f9bf5';
export const RESIDENTS=[
 {id:'haerin',name:'해린',column:0,map:'relayEntry',route:[[13,10],[16,10]],outside:[[18,22],[19,22]]},
 {id:'mijeong',name:'미정',column:1,map:'relayEntry',route:[[35,16],[37,16]],outside:[[22,23],[24,23]]},
 {id:'dohyun',name:'도현',column:2,map:'relayPlant',route:[[35,17],[40,17]],outside:[[26,21],[28,21]]},
];
export function residentPhase(s){return s.flags.relayLastVoice?3:s.flags.relayPower?2:s.flags.relayCompared?1:0;}
export class Residents{
 constructor(){this.reset();}
 reset(){this.map=null;this.actors=[];}
 update(map,s,dt,allowed=true,threat=null){
  const phase=residentPhase(s);let definitions=RESIDENTS.filter(n=>(phase===3?'relayYard':n.map)===map.id);
  if(s.flags.storyHelpWitness&&phase<3&&['relayDrain','relayPlant','relaySignal'].includes(map.id)){const route=map.id==='relayDrain'?[[7,7],[8,7]]:map.id==='relayPlant'?[[48,30],[49,30]]:[[47,33],[48,33]];definitions=[...definitions.filter(n=>n.id!=='mijeong'),{...RESIDENTS.find(n=>n.id==='mijeong'),route}];}

  if(phase<3&&map.chapter===2&&!map.outdoor){for(const base of RESIDENTS)if(s.flags['npcRescued_'+base.id]&&s.flags['npcInjured_'+base.id]&&!definitions.some(n=>n.id===base.id)){let point=null;for(let a=0;a<8;a++){const p={x:s.x+Math.cos(a*Math.PI/4)*50,y:s.y+Math.sin(a*Math.PI/4)*50};if(canMove(map,p.x,p.y)&&findPath(map,p,s).length){point=p;break;}}if(point)definitions.push({...base,route:[[point.x/32,point.y/32],[point.x/32,point.y/32]]});}}
  if(this.map!==map.id||this.phase!==phase){this.map=map.id;this.phase=phase;this.actors=definitions.map(n=>{const route=phase===3?n.outside:n.route;return{...n,npc:true,phase,route,x:route[0][0]*32,y:route[0][1]*32,target:1,wait:1,path:[],repath:0,walk:0,direction:0,moving:false};});}
  for(const n of this.actors){n.injury=s.flags['npcInjured_'+n.id]?(n.id==='mijeong'?'leg':'arm'):null;n.corruption=npcCorruption(s);n.panic=Math.max(0,(n.panic||0)-dt);if(threat?.active&&Math.hypot(threat.x-n.x,threat.y-n.y)<420&&sight(map,n,threat)){s.flags['witnessed_ghost_'+n.id]=true;s.flags['witnessed_'+threat.kind+'_'+n.id]=true;n.panic=3;n.direction=Math.abs(threat.x-n.x)>Math.abs(threat.y-n.y)?threat.x>n.x?2:1:threat.y<n.y?3:0;n.reactionLine=FEAR_LINES[n.id];}if(n.panic)n.moving=false;}
  if(!allowed){for(const n of this.actors)n.moving=false;return this.actors;}
  for(const n of this.actors){
   n.moving=false;if(fleeActor(map,s,n,threat,dt))continue;if(n.panic)continue;n.wait=Math.max(0,n.wait-dt);
   if(n.wait)continue;
   const escort=s.flags['npcRescued_'+n.id]&&s.flags['npcInjured_'+n.id]&&phase<3;const target=escort?{x:s.x,y:s.y}:{x:n.route[n.target][0]*32,y:n.route[n.target][1]*32};if(escort&&Math.hypot(s.x-n.x,s.y-n.y)<55)continue;
   n.repath-=dt;if(n.repath<=0){n.path=findPath(map,n,target);n.repath=.6;}
   const p=n.path[0]||target,dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy);
   if(d<5&&n.path.length)n.path.shift();
   if(Math.hypot(target.x-n.x,target.y-n.y)<7){n.target=(n.target+1)%n.route.length;n.wait=phase===2?4:2;n.repath=0;continue;}
   if(d>0){const step=Math.min(d,dt*(escort?48:n.corruption>=2?13:phase===2?15:32)),x=n.x+dx/d*step,y=n.y+dy/d*step;
    if((Math.hypot(x-s.x,y-s.y)>26||Math.hypot(x-s.x,y-s.y)>Math.hypot(n.x-s.x,n.y-s.y))&&canMove(map,x,y)){n.x=x;n.y=y;n.walk=advanceGait(n.walk,step,actorStride(n.column+1));n.moving=true;n.direction=Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy<0?3:0;}
   }
   if(phase>=1&&!n.moving&&Math.hypot(n.x-s.x,n.y-s.y)<160){const x=s.x-n.x,y=s.y-n.y;n.direction=Math.abs(x)>Math.abs(y)?x>0?2:1:y<0?3:0;}
  }
  return this.actors;
 }
 nearest(map,s){return this.actors.filter(n=>Math.hypot(n.x-s.x,n.y-s.y)<(n.id==='haerin'&&map.id==='relayEntry'?110:64)&&sight(map,s,n)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;}
}
export function residentDialogue(s,n){const reaction=corruptionReply(s,n),witness=s.flags['witnessed_ghost_'+n.id]?({haerin:'서하 씨도 봤죠? 같은 방에 있던 저 형체요. 제가 화면을 잘못 본 게 아니에요. 출입문 쪽을 계속 보고 있어 주세요.',mijeong:'나도 봤어. 네 뒤로 오던 그거… 사람 발걸음이 아니었어. 혼자 보고 있다고 생각하지 마. 나도 여기 있었어.',dohyun:'저도 같은 곳에서 봤습니다. 장비 그림자라고 생각했는데, 저쪽이 움직일 때 제 그림자는 그대로였어요.'})[n.id]:'';const answer=residentAccount(s,n);const escaped=s.flags['npcEscaped_'+n.id]?({haerin:'방금 제 팔을 잡았어요. 분명 손이 닿았어요… 문 쪽으로 먼저 뛰었어요. 아직 안쪽에 있어요.',mijeong:'잡혔을 때 발목이 얼어붙는 줄 알았어. 바짓단이 찢어지고 발을 딛을 수 없었어. 네가 본 게 맞아. 나도 잡혔어.',dohyun:'팔을 붙잡혔습니다. 작업복이 걸려서 손을 빼냈어요. 단순한 그림자가 아니에요. 그래도 부품 위치는 알려 드릴 수 있습니다.'})[n.id]:'';const injury=s.flags['npcInjured_'+n.id]?(n.id==='mijeong'?'발을 딛을 자리가 없어… 조금만 부축해 줘. 수첩은 품 안에 있어.':'소매 안이 비었어요… 잡힌 부분이 없어졌어요. 기록은 놓치지 않았어요.'):s.flags['npcHealed_'+n.id]?'감아 준 실이 풀리자 감각이 돌아왔어요. 나를 두고 가지 않아 줘서 고마워요.':'';const lead=[injury,escaped,witness,reaction].filter(Boolean).join('\n');return lead?lead+'\n\n'+answer:answer;}
function residentAccount(s,n){
 if(s.map==='relayDrain'&&n.id==='mijeong')return '계단부터 확인했어. 여기서는 남쪽 수문을 지나야 설비동으로 올라갈 수 있어. 수압 때문에 걸린 거라면 옆 우회 밸브를 먼저 열어야 해. 먼저 갈 테니 내 목소리 말고 손전등을 보고 와. 이상한 소리가 나도 혼자 돌아보지 말고.';
 if(s.flags['deduced_'+n.id])return ({haerin:'23:44 수신 행을 보셨군요. 그 줄은 제가 화면에서 숨겼어요. 통화 내용을 바꾼 건 아니지만 없었다고 적은 건 제 거짓말입니다. 수정 이력도 함께 가져가 주세요.',mijeong:'정우가 쓴 요약은 내가 확인한 내용과 달라. 나는 열쇠가 돌아간 것과 문이 안 움직인 것만 봤어. 화면을 누가 고쳤는지는 몰라. 그건 내 증언으로 채우면 안 돼.',dohyun:'운전표에 정지가 남아 있네요. 펌프 소리라고 적은 제 보고는 틀렸습니다. 직접 확인하지 않았고, 정우가 책임을 묻겠다고 하자 진술을 바꿨습니다.'})[n.id];
 if(n.id==='haerin'&&(s.flags.relayErasure||s.investigation?.rolls.haerin?.success))return '숨긴 행이 원본에는 남아 있었죠. 제가 원본을 지운 건 아니지만, 취소 뒤 수신이 없었다고 인계한 건 잘못입니다. 수정 이력을 원본 통화와 같이 보존해 주세요.';
 if(n.id==='haerin'&&s.flags.drawerSuspicion)return '서랍에 손댄 거 봤어요. 필요한 기록은 정식으로 요청하세요. 제 허락 없이 물건을 꺼내려 한 일은 잊지 않을 겁니다. 원본 조작 이력을 확인하는 건 막지 않겠어요.';
 const phase=residentPhase(s),lines={
  haerin:[
   '가져오신 녹음에서 빠진 구간을 확인하러 오셨죠. 아파트의 통화 원본은 이곳 기록동에 남아 있어요. 출입증은 인계대 서랍에 두었어요. 제가 인계한 목록에는 취소 뒤 통화가 없습니다. 다만… 화면 목록과 원본 파일은 따로 보관돼요.',
   '사본에 제 수정 번호가 있네요. 표시를 정리해서 그래요. 취소 뒤에 다시 걸려 온 전화는 없었던 걸로 압니다. 수정 전 목록은 제 개인 인계 서랍에 있어요. 그 사본까지 가져가겠다는 건가요?',
   '전원을 넣은 뒤부터 내선이 과거의 답변을 반복해요. 방금 「확인했습니다」는 제가 한 말이 아니에요. 우리는 밖으로 나갈게요. 목소리가 들려도 저를 따라오라는 뜻으로 듣지 마세요.',
   '여기 셋 다 나왔어요. 제 수정 번호도 증거에 넣어 주세요. 안에서 제 목소리가 들려도 저는 여기 있어요.'
  ],
  mijeong:[
   '나는 그때 월계아파트 야간 경비였어. 예비 열쇠를 건넸고 뒤늦게 문 앞에도 갔지. 열쇠는 돌아갔는데 문은 움직이지 않았어. 내가 본 건 당직 수첩에 적어 놨어.',
   '그 접수 화면은 내가 다루던 게 아니야. 누가 무슨 기록을 숨겼는지는 몰라. 나는 도착 시각과 열쇠를 돌린 일만 증언할 수 있어. 수첩을 고치지 말고 그대로 가져가.',
   '수화기에서 네 동생 같은 목소리가 났어. 지금 온 전화인지 녹음인지 나는 구별을 못 하겠어. 난 해린이랑 밖으로 나갈게. 내 증언은 수첩에 적힌 데까지만 믿어 줘.',
   '우리 셋 다 밖에 있어. 내 수첩과 열쇠도 챙겼니? 나는 문을 열지 못했다는 사실과 도착이 늦었다는 사실을 숨기지 않을게.'
  ],
  dohyun:[
   '젖은 손으로 절체반을 만지지 마세요. 저는 장비 확인을 맡았어요. 냉각이 멈춰 있어서 지금은 녹음 데크 전원을 올릴 수 없습니다. 먼저 서쪽 순환실을 확인해야 해요.',
   '진술서에서 문 두드리는 소리를 배관 진동으로 고쳤습니다. 처음 적은 진술은 접수 원본 뒤에 남아 있어요. 고친 사유까지 같이 보존해 주세요.',
   '원본 데크가 돌아갑니다. 서로 다른 장비에서 뜬 복제 신호는 재생 위치와 극성을 맞춰야 해요. 기준 펄스가 겹치면 끊긴 통화를 분리해 들을 수 있습니다. 원본 자체를 편집하는 건 아닙니다.',
   '장비 운전 기록도 가져가세요. 원격 응답이 왔다는 사실과 문이 실제로 열렸다는 사실은 다릅니다. 보고서에서 제가 그 둘을 섞었습니다.'
  ]};
 return lines[n.id][phase];
}

export function residentExpression(s,n){if(n.panic)return 2;if(residentPhase(s)===2)return 2;const r=s.investigation?.rolls[n.id];if(r)return r.success?3:1;return [0,1,2,3][residentPhase(s)];}

export const RESIDENT_QUESTIONS={
 haerin:[['왜 다시 연락했어요?','원본 대조를 원한다고 하셔서 도현 씨와 미정 씨도 불렀어요. 정우가 잠금을 유지한 회신이 남아 있거든요. 그 기록을 확인하면 당시 책임도 분명해질 거라고 생각했어요.'],['표시만 고쳤다는 게 무슨 뜻이죠?','같은 사건 번호가 반복된 행을 정리했어요. 인계 목록에는 필요한 통화가 다 있다고 생각했습니다. 원본과 차이가 난다면 기록동의 수정 이력 번호부터 확인하시죠.']],
 mijeong:[['그 열쇠로 왜 못 열었어요?','원래 잠금장치는 열렸어. 손목에 힘이 풀릴 만큼 돌려 봤으니까 알아. 그런데 문은 한 치도 안 움직였지. 그때 왜 다른 걸 의심하지 못했을까. 내 열쇠가 틀렸다는 생각만 했어. 누가 안쪽에 뭘 덧댔다는 생각은 못 하고.'],['아직 여길 지키는 이유가 있어요?','당직 수첩과 열쇠를 직접 넘기려고 기다렸어. 열쇠에는 그날 돌리다 긁힌 자국이 남아 있어. 도구함의 확대경으로 봐. 수첩 시각이랑 대조하면 내가 문 앞에 늦게 간 사실도 확인될 거야.']],
 dohyun:[['무슨 소리를 들었어요?','세 번. 같은 간격은 아니었어요. 그걸 배관 진동이라고 적었습니다. 그때 펌프는 정지 상태였어요. 운전 기록을 보고도 배관 진동이라고 고쳤습니다. 지금도 불규칙한 소리가 나면 시간을 재요. 이번에는… 사람 소리인지 먼저 들어야겠죠.'],['시험기는 빌릴 수 있나요?','정비대의 세 시험 접점을 복귀 순서대로 눌러 주세요. 지워진 순서는 정비대 옆 표찰에 남아 있어요. 시험이 끝나면 공구함 잠금이 풀립니다. 본 회선과 분리된 시험기예요. 그걸로 사고 설비를 켜지는 마세요.']],
};

export const FOLLOW_UP={
 haerin:[['잘린 구간이 정말 없는 통화인지, 수정 전 목록과 원본으로 확인할게요.','네. 취소 통화 데크와 수정 이력 서랍의 번호가 같아야 합니다. 제 말만 받아 적지 말고 두 번호를 확인해 주세요.'],['정리한 행이 정말 중복인지 원본과 대조해 볼게요.','기록동 수정 이력 서랍에 정리 전 값이 남아 있을 거예요. 제 말만 듣고 결론 내리지는 마세요.']],
 mijeong:[['해제 접수증만 보고 문이 열렸다고 믿으면 안 됐어요.','내가 문을 열지 못한 건 수첩에 적었어. 23:47 회신이 무엇을 뜻하는지는 담당자에게 확인해. 나는 그 장치를 본 적이 없어.'],['그 자국과 수첩을 함께 남길게요.','내가 제때 도착했다고 적지는 마. 시각을 그대로 남겨. 네가 고칠 이유는 없어.']],
 dohyun:[['펌프가 꺼져 있었다면 제 최초 보고도 틀린 거네요.','네. 운전 기록에는 정지가 남아 있습니다. 최초 진술과 수정 진술을 겹쳐 놓으면 무엇을 바꿨는지 확인됩니다.'],['시험 접점으로 확인하고 도구를 빌릴게요.','표찰의 B, A, C 순서입니다. 본 회선은 냉각 확인 뒤에 분리하고 투입하세요. 시험 접점과 전원 절체반을 혼동하면 안 됩니다.']]
};

RESIDENT_QUESTIONS.haerin.push(['이곳은 정확히 어떤 곳이에요?','아파트 위탁관리사가 쓰던 시설 출동 중계소예요. 주민의 출동 요청과 원격 명령, 녹음의 백업을 보관합니다. 접수 완료 신호와 문이 실제 열린 신호는 별개인데, 그날 보고서는 둘을 같은 뜻으로 썼어요.']);
FOLLOW_UP.haerin.push(['그럼 여기서는 통화 기록과 실제 설비 기록을 대조해야겠네요.','맞아요. 기록동에서 접수와 취소, 잠금 유지 회신을 먼저 비교해 주세요. 마지막 통화는 송출층 원본 데크에 있어요. 내선에서 반복되는 목소리 대신 기록의 시각과 발신자를 확인해야 합니다.']);

// Original question indexes stay stable so old conversation notes remain valid.
export function residentQuestions(s,id){
 const has=k=>s.bag.includes(k),f=k=>!!s.flags[k],requirements={
  haerin:[()=>has('tape')||has('relayBadge'),()=>has('auditMemo')||f('relayErasure')||f('relayRegistered')&&has('relayCopy'),()=>true],
  mijeong:[()=>has('receipt')||f('relayDuty'),()=>has('restoredRoster')||has('rosterScrap')||f('relayDuty')],
  dohyun:[()=>has('pumpLog')||f('relayPressure'),()=>f('seen_relay-circuit-tester')||['A','B','C'].some(k=>f('seen_relay-test-'+k))||f('relayLogic')||s.investigation?.gear?.includes('tester')]
 };
 return (RESIDENT_QUESTIONS[id]||[]).map(([label,line],index)=>({label,line,index})).filter(q=>f('question_'+id+'_'+q.index)||requirements[id]?.[q.index]?.());
}
export function residentActions(s,id){
 const has=k=>s.bag.includes(k),f=k=>!!s.flags[k];
 return {check:!!({haerin:has('auditMemo')||f('relayErasure')||f('relayLastVoice'),mijeong:has('receipt')&&f('relayDuty'),dohyun:f('seen_relay-cooling-guide')||f('relayCooling')||f('relayIsolated')})[id],request:id==='haerin'&&(has('relayCopy')||has('auditMemo')||f('relayErasure')),power:id==='dohyun'&&has('relayCopy')&&!f('relayPower')};
}
