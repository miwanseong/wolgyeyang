export const CHECKS={
 haerin:{label:'취소 기록을 근거로 되묻는다',skill:'통찰',stat:2,dc:6,flag:'relayCancel',success:'원본은 안 지웠어요. 취소 뒤 다시 걸려 온 줄을 화면에서 숨겼을 뿐이에요. …뿐이라고 말하면, 덜한 일이 되나요? 서랍의 수정 번호도 제 번호예요.',failure:'그건 제가 설명해도 믿지 않으실 거잖아요. 서랍을 직접 보세요. …지금은 더 말 못 하겠어요.'},
 mijeong:{label:'열쇠와 빗장의 차이를 대조한다',skill:'관찰',stat:1,dc:5,item:'receipt',success:'맞아. 열쇠가 돌았으니까 문도 열렸다고 믿고 싶었어. 정우가 덧댄 빗장은 별개였는데. 접수증의 해제 표시도 그 빗장을 말한 게 아니야.',failure:'잠깐, 손이 떨려서… 자국이 잘 안 보인다. 내가 기억하는 것보다 수첩에 적어 둔 게 정확할 거야. 말로 하면 또 핑계가 섞일 것 같아.'},
 dohyun:{label:'순환·분리·투입 순서를 함께 검증한다',skill:'기술',stat:0,dc:5,item:'relayCopy',success:'네, 그 순서가 맞습니다. 냉각부터요. 점검판의 아홉 관은 전부 이어져야 해요. 왼쪽 위 유입부터 왼쪽 아래 배출까지, 열린 끝 하나도 없이. 그건 제가 확인할게요. 이번에는 직접 보고요.',failure:'제가 너무 줄여 말했네요. 벽에 걸린 절체 순서가 제가 하는 말보다 정확해요. 모르면 손을 떼세요. 모른다고 하는 게 잘못된 건 아니니까요.'},
 parking:{label:'물병·장갑과 주차 흔적을 조사한다',skill:'관찰',stat:1,dc:5,success:'장갑은 말라 있고 물병 표면에는 아직 물방울이 남았다. 세 차량은 먼지가 끊긴 주차선 안에 있다. 동행자들이 최근 실제로 도착했다는 흔적이다.',failure:'어두워 차가 들어온 순서까지는 알 수 없다. 다만 벤치의 물병과 장갑, 세 주차 차량은 눈앞에 분명히 있다.'}
};
export const EQUIPMENT={
 recorder:{name:'휴대용 녹음기',skill:'통찰',bonus:1,description:'목소리를 반복해서 듣는다. 말의 모순을 놓치지 않으려는 서하의 습관.'},
 lens:{name:'검사용 확대경',skill:'관찰',bonus:1,description:'당직실에서 빌린 확대경. 작은 자국과 날짜를 대조한다.'},
 tester:{name:'절연 회로 시험기',skill:'기술',bonus:1,description:'도현이 건넨 비접촉 시험기. 전원 작업은 절체 순서에 따른다.'}
};
export const CHARACTER={name:'서하',background:'기록 대조인',traits:'의심이 많고, 숫자에는 강하다. 타인의 말을 믿기 전에 자기 기록부터 의심해야 한다.',skills:{통찰:2,관찰:1,기술:0}};
export function investigationState(s){const r=s.investigation??={stress:0,rolls:{}};r.gear??=['recorder'];if(r.equipped===undefined)r.equipped=r.gear[0]??null;return r;}
export function equip(s,id){const r=investigationState(s);if(id!==null&&!r.gear.includes(id))return false;r.equipped=id;return true;}
export function validInvestigation(r){
 if(r===undefined)return true;
 if(!r||typeof r!=='object'||Array.isArray(r)||!Number.isInteger(r.stress)||r.stress<0||r.stress>4||!r.rolls||typeof r.rolls!=='object'||Array.isArray(r.rolls))return false;
 if(r.equipped!==undefined&&r.gear===undefined)return false;
 if(r.gear!==undefined&&(!Array.isArray(r.gear)||new Set(r.gear).size!==r.gear.length||r.gear.some(k=>!Object.hasOwn(EQUIPMENT,k))||(r.equipped!==null&&!r.gear.includes(r.equipped))))return false;
 return Object.entries(r.rolls).every(([key,v])=>Object.hasOwn(CHECKS,key)&&v&&Number.isInteger(v.die)&&v.die>=1&&v.die<=6&&Number.isInteger(v.bonus)&&v.bonus>=0&&v.bonus<=1&&(v.gear===undefined?Number.isInteger(v.spent)&&v.spent>=0&&v.spent<=1:Number.isInteger(v.gear)&&v.gear>=0&&v.gear<=1)&&v.total===v.die+CHECKS[key].stat+v.bonus+(v.gear??v.spent*2)&&v.success===(v.total>=CHECKS[key].dc));
}
export function checkPreview(s,key){if(!Object.hasOwn(CHECKS,key))return null;const c=CHECKS[key],r=investigationState(s),g=EQUIPMENT[r.equipped];return{...c,bonus:+!!(c.flag&&s.flags[c.flag]||c.item&&s.bag.includes(c.item)),gear:g?.skill===c.skill?g.bonus:0,equipment:g?.name||'장비 없음'};}
export function resolveCheck(s,key,_legacy=false,random=Math.random){
 if(!s.flags.chapter2||!Object.hasOwn(CHECKS,key))return null;
 const r=investigationState(s);if(r.rolls[key])return r.rolls[key];
 const c=checkPreview(s,key),value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
 const die=1+Math.floor(value*6),total=die+c.stat+c.bonus+c.gear,success=total>=c.dc;
 const result={die,bonus:c.bonus,gear:c.gear,total,success};r.rolls[key]=result;r.stress=Math.min(4,r.stress+(success?0:1));return result;
}
export function checkText(s,key,r){const c=CHECKS[key];return `주사위 ${r.die} + ${c.skill} ${c.stat} + 증거 ${r.bonus} + 장비 ${r.gear??r.spent*2} = ${r.total} / 난도 ${c.dc}\n${r.success?'성공':'실패'}\n\n${r.success?c.success:c.failure}`;}
