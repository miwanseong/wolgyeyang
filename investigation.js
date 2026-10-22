export const CHECKS={
 haerin:{label:'취소 기록을 근거로 되묻는다',skill:'통찰',stat:2,dc:6,flag:'relayCancel',success:'해린은 「원본은 안 지웠어요. 취소 뒤 다시 걸려 온 줄을 화면에서 숨겼을 뿐이에요」라고 인정했다. 수정 이력 서랍을 다시 확인할 이유가 생겼다.',failure:'해린은 시선을 피하며 「서랍을 직접 보세요」라고만 답한다. 추가 진술은 얻지 못했다. 수정 이력 서랍은 그대로 조사할 수 있다.'},
 mijeong:{label:'열쇠와 빗장의 차이를 대조한다',skill:'관찰',stat:1,dc:5,item:'receipt',success:'미정은 원래 자물쇠와 정우가 덧댄 빗장이 별개였다고 분명히 말했다. 접수증의 「해제」 표시는 원래 제어기에만 해당한다.',failure:'미정의 손이 떨려 열쇠 자국을 판독하기 어렵다. 당직 수첩에 같은 설명이 남아 있다고 알려 줬다.'},
 dohyun:{label:'순환·분리·투입 순서를 함께 검증한다',skill:'기술',stat:0,dc:5,item:'relayCopy',success:'도현은 회선 분리 전에 냉각부터 확인하라고 강조한다. 배관 점검판은 좌상단 유입에서 좌하단 배출까지 열린 끝 없이 아홉 관을 모두 써야 한다.',failure:'설비 약어가 익숙하지 않다. 도현이 벽의 절체 순서 안내를 짚어 줬다. 안내문을 읽고 배관을 조작하는 길은 막히지 않았다.'},
 parking:{label:'물병·장갑과 주차 흔적을 조사한다',skill:'관찰',stat:1,dc:5,success:'장갑은 말라 있고 물병 표면에는 아직 물방울이 남았다. 세 차량은 먼지가 끊긴 주차선 안에 있다. 동행자들이 최근 실제로 도착했다는 흔적이다.',failure:'어두워 차가 들어온 순서까지는 알 수 없다. 다만 벤치의 물병과 장갑, 세 주차 차량은 눈앞에 분명히 있다.'}
};
export function investigationState(s){return s.investigation??={focus:3,stress:0,rolls:{}};}
export function validInvestigation(r){
 if(r===undefined)return true;
 if(!r||typeof r!=='object'||Array.isArray(r)||!Number.isInteger(r.focus)||r.focus<0||r.focus>3||!Number.isInteger(r.stress)||r.stress<0||r.stress>4||!r.rolls||typeof r.rolls!=='object'||Array.isArray(r.rolls))return false;
 return Object.entries(r.rolls).every(([key,v])=>Object.hasOwn(CHECKS,key)&&v&&Number.isInteger(v.die)&&v.die>=1&&v.die<=6&&Number.isInteger(v.bonus)&&v.bonus>=0&&v.bonus<=1&&Number.isInteger(v.spent)&&v.spent>=0&&v.spent<=1&&v.total===v.die+CHECKS[key].stat+v.bonus+v.spent*2&&v.success===(v.total>=CHECKS[key].dc));
}
export function checkPreview(s,key){const c=CHECKS[key];if(!Object.hasOwn(CHECKS,key))return null;const bonus=!!(c.flag&&s.flags[c.flag]||c.item&&s.bag.includes(c.item));return{...c,bonus:+bonus,focus:investigationState(s).focus};}
export function resolveCheck(s,key,spend=false,random=Math.random){
 if(!s.flags.chapter2||!Object.hasOwn(CHECKS,key))return null;
 const r=investigationState(s);if(r.rolls[key])return r.rolls[key];
 if(spend&&r.focus<1)return null;
 const c=checkPreview(s,key),value=random();if(!Number.isFinite(value)||value<0||value>=1)return null;
 const die=1+Math.floor(value*6),spent=spend?1:0,total=die+c.stat+c.bonus+spent*2,success=total>=c.dc;
 const result={die,bonus:c.bonus,spent,total,success};r.rolls[key]=result;r.focus-=spent;r.stress=Math.min(4,r.stress+(success?0:1));
 return result;
}
export function checkText(s,key,result){const c=CHECKS[key];return `1d6 ${result.die} + ${c.skill} ${c.stat} + 증거 ${result.bonus} + 집중 ${result.spent*2} = ${result.total} / 난도 ${c.dc}\n${result.success?'성공':'실패 · 조사 경로는 유지'}\n\n${result.success?c.success:c.failure}\n\n이 판정은 기록됩니다. 같은 조사를 반복해 다시 굴릴 수 없습니다.`;}
