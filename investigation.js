export const CHECKS={
 theft:{label:'수정 이력 봉투를 몰래 꺼낸다',skill:'손재주',stat:1,dc:5,success:'접힌 탄소 사본을 챙겼다. 숨김 전 목록에 23:44 수신 행이 남아 있다. 해린에게 출처를 숨긴 채 묻는다면 신뢰를 잃을 수도 있다.',failure:'봉투가 서랍 레일에 걸렸다. 해린이 돌아본다. 손을 뗐다. 이제 허락 없이 같은 서랍에 손대기는 어렵다.'},
 request:{label:'누락된 통화를 찾기 위해 수정 전 목록을 요청한다',skill:'설득',stat:1,dc:5,flag:'relayErasure',success:'…이 사본 가져가세요.23시44분, 취소 뒤에도 전화가 왔어요. 제가 그 행을 화면에서 숨겼어요.',failure:'지금 제 말만 믿고 넘어가면 안 돼요. 기록동의 원본 조작 이력을 먼저 봐 주세요. 그 뒤에도 물으신다면… 대답할게요.'},
 lostbox:{label:'분실물 함의 걸린 잠금쇠를 푼다',skill:'손재주',stat:1,dc:5,success:'걸린 잠금쇠를 풀었다. 안에는 인수표와 함께 보관된 점검용 손목시계가 있다.',failure:'작은 잠금쇠가 헛돈다. 억지로 돌리지 않고 손을 뗐다. 필수 증거가 보관된 함은 아니다.'},
 haerin:{label:'취소 기록을 근거로 되묻는다',skill:'통찰',stat:2,dc:6,flag:'relayCancel',success:'원본은 안 지웠어요. 취소 뒤 다시 걸려 온 줄을 화면에서 숨겼을 뿐이에요. …뿐이라고 말하면, 덜한 일이 되나요? 서랍의 수정 번호도 제 번호예요.',failure:'그건 제가 설명해도 믿지 않으실 거잖아요. 서랍을 직접 보세요. …지금은 더 말 못 하겠어요.'},
 mijeong:{label:'열쇠와 빗장의 차이를 대조한다',skill:'관찰',stat:1,dc:5,item:'receipt',success:'열쇠는 돌아갔지만 문은 안 움직였어. 덧댄 장치를 누가 조작했는지는 내가 못 봤어. 내 수첩에 적힌 관찰과 정우가 쓴 인수 요약을 따로 봐 줘.',failure:'잠깐, 손이 떨려서… 자국이 잘 안 보인다. 내가 기억하는 것보다 수첩에 적어 둔 게 정확할 거야. 말로 하면 또 핑계가 섞일 것 같아.'},
 dohyun:{label:'순환·분리·투입 순서를 함께 검증한다',skill:'기술',stat:0,dc:5,item:'relayCopy',success:'네, 그 순서가 맞습니다. 냉각부터요. 점검판의 아홉 관은 전부 이어져야 해요. 왼쪽 위 유입부터 왼쪽 아래 배출까지, 열린 끝 하나도 없이. 그건 제가 확인할게요. 이번에는 직접 보고요.',failure:'제가 너무 줄여 말했네요. 벽에 걸린 절체 순서가 제가 하는 말보다 정확해요. 모르면 손을 떼세요. 모른다고 하는 게 잘못된 건 아니니까요.'},
 parking:{label:'물병·장갑과 주차 흔적을 조사한다',skill:'관찰',stat:1,dc:5,success:'물병은 뚜껑이 닫혀 있고, 장갑과 벤치 좌석은 비에 젖어 있다. 세 대의 차량은 주차 구획 안에 있다. 사람이 오지 않는 폐건물이라는 생각은 맞지 않는다.',failure:'어두워 차가 들어온 순서까지는 알 수 없다. 다만 벤치의 물병과 장갑, 세 주차 차량은 눈앞에 분명히 있다.'}
};
export const SLOTS={head:'머리',body:'몸통',accessory:'장신구',hand:'손'};
export const EQUIPMENT={
 headset:{slot:'head',name:'점검용 청취 헤드셋',skill:'통찰',bonus:1,description:'작은 음성 차이를 듣는 유선 청취 장비. 원본 대조실의 비품이다.'},
 vest:{slot:'body',name:'공구 고정 작업 조끼',skill:'손재주',bonus:1,description:'도구가 부딪히지 않게 고정하는 안주머니가 있다. 조용히 물건을 다룰 때 도움이 된다.'},
 watch:{slot:'accessory',name:'점검용 손목시계',skill:'관찰',bonus:1,description:'초침과 눈금을 비교해 기록의 시간 차이를 확인한다.'},

 recorder:{slot:'hand',name:'휴대용 녹음기',skill:'통찰',bonus:1,description:'목소리를 반복해서 듣는다. 말의 모순을 놓치지 않으려는 서하의 습관.'},
 lens:{slot:'hand',name:'검사용 확대경',skill:'관찰',bonus:1,description:'당직실에서 빌린 확대경. 작은 자국과 날짜를 대조한다.'},
 tester:{slot:'hand',name:'절연 회로 시험기',skill:'기술',bonus:1,description:'도현이 건넨 비접촉 시험기. 전원 작업은 절체 순서에 따른다.'}
};
export const CHARACTER={name:'서하',background:'전직 야간 관리 보조',traits:'의심이 많고, 숫자에는 강하다. 타인의 말을 믿기 전에 자기 기록부터 의심해야 한다.',skills:{통찰:2,관찰:1,기술:0,손재주:1,설득:1}};
export function investigationState(s){const r=s.investigation??={stress:0,sanity:100,rolls:{}};r.gear??=['recorder'];if(r.equipped===undefined)r.equipped=r.gear[0]??null;
 r.slots??={head:null,body:null,accessory:null,hand:r.equipped&&EQUIPMENT[r.equipped]?.slot==='hand'?r.equipped:null};return r;}
export function equip(s,id,slot=null){const r=investigationState(s);slot??=id?EQUIPMENT[id]?.slot:'hand';if(!Object.hasOwn(SLOTS,slot)||id!==null&&(!r.gear.includes(id)||EQUIPMENT[id]?.slot!==slot))return false;r.slots[slot]=id;if(slot==='hand')r.equipped=id;return true;}
export function checkRewards(s,key,result){if(!result.success){if(key==='theft')s.flags.drawerSuspicion=true;return;}if(['theft','request'].includes(key)){if(!s.bag.includes('auditMemo'))s.bag.push('auditMemo');s.flags[key==='theft'?'memoStolen':'memoPermitted']=true;}if(key==='lostbox'){const r=investigationState(s);if(!r.gear.includes('watch'))r.gear.push('watch');}}
export function validInvestigation(r){
 if(r===undefined)return true;
 if(!r||typeof r!=='object'||Array.isArray(r)||!Number.isInteger(r.stress)||r.stress<0||r.stress>4||!r.rolls||typeof r.rolls!=='object'||Array.isArray(r.rolls))return false;
 if(r.sanity!==undefined&&(!Number.isInteger(r.sanity)||r.sanity<0||r.sanity>100))return false;
 if(r.equipped!==undefined&&r.gear===undefined)return false;
 if(r.gear!==undefined&&(!Array.isArray(r.gear)||new Set(r.gear).size!==r.gear.length||r.gear.some(k=>!Object.hasOwn(EQUIPMENT,k))||(r.equipped!==null&&!r.gear.includes(r.equipped))))return false;
 if(r.slots!==undefined&&(!r.slots||typeof r.slots!=='object'||Array.isArray(r.slots)||Object.keys(r.slots).length!==4||Object.keys(r.slots).some(k=>!Object.hasOwn(SLOTS,k))||Object.entries(r.slots).some(([slot,id])=>id!==null&&(!r.gear?.includes(id)||EQUIPMENT[id]?.slot!==slot))||r.slots.hand!==r.equipped))return false;
 return Object.entries(r.rolls).every(([key,v])=>Object.hasOwn(CHECKS,key)&&v&&Number.isInteger(v.die)&&v.die>=1&&v.die<=6&&Number.isInteger(v.bonus)&&v.bonus>=0&&v.bonus<=1&&(v.gear===undefined?Number.isInteger(v.spent)&&v.spent>=0&&v.spent<=1:Number.isInteger(v.gear)&&v.gear>=0&&v.gear<=3)&&v.total===v.die+CHECKS[key].stat+v.bonus+(v.gear??v.spent*2)&&v.success===(v.total>=CHECKS[key].dc));
}
export function checkPreview(s,key){if(!Object.hasOwn(CHECKS,key))return null;const c=CHECKS[key],r=investigationState(s),gear=Object.values(r.slots).filter(Boolean).map(id=>EQUIPMENT[id]).filter(g=>g.skill===c.skill);return{...c,bonus:+!!(c.flag&&s.flags[c.flag]||c.item&&s.bag.includes(c.item)),gear:Math.min(3,gear.reduce((sum,g)=>sum+g.bonus,0)),equipment:gear.map(g=>g.name).join(' + ')||'관련 장비 없음'};}
export function resolveCheck(s,key,_legacy=false,random=Math.random){
 if(!s.flags.chapter2||!Object.hasOwn(CHECKS,key))return null;
 const r=investigationState(s);if(r.rolls[key]?.success){checkRewards(s,key,r.rolls[key]);return r.rolls[key];}
 const c=checkPreview(s,key),value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
 const die=1+Math.floor(value*6),total=die+c.stat+c.bonus+c.gear,success=total>=c.dc;
 const result={die,bonus:c.bonus,gear:c.gear,total,success};r.rolls[key]=result;r.stress=Math.min(4,r.stress+(success?0:1));checkRewards(s,key,result);return result;
}
export function checkText(s,key,r){const c=CHECKS[key];return `주사위 ${r.die} + ${c.skill} ${c.stat} + 증거 ${r.bonus} + 장비 ${r.gear??r.spent*2} = ${r.total} / 난도 ${c.dc}\n${r.success?'성공':'실패'}\n\n${r.success?c.success:c.failure}`;}
