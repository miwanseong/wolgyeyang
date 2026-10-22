import { MAPS, sight, worldFor } from "./world.js?v=006f099ffcd5";
import { take, note } from "./state.js?v=006f099ffcd5";
export const RELAY_MAPS=['relayEntry','relayArchive','relayPlant','relaySignal'];
export function enterChapterTwo(s){
 if(!['witness','return'].includes(s.ending)||s.flags.chapter2)return false;
 s.flags.originalKept=s.ending==='witness';s.flags.chapter2=true;s.ending=null;
 if(!s.flags.originalKept)s.bag=s.bag.filter(k=>!['notice','receipt','evidence','tape'].includes(k));
 s.map='relayEntry';s.x=44*32;s.y=30*32;s.stamina=100;s.hidden=false;s.running=false;
 take(s,'flashlight');s.flashlight=true;
 note(s,'chapter2-arrival',s.flags.originalKept
  ?'02:13 · 산북 재난중계소. 접수증 뒷면의 「원본 회신 보관처」를 따라왔다. 가져온 녹음 끝에는 취소 이후의 회신이 없다. 서윤이 기다린 마지막 답을 이곳에서 찾아야 한다.'
  :'02:13 · 산북 재난중계소. 두고 온 기록의 주소만 기억했다. 지금은 나의 증언을 뒷받침할 원본이 없다. 취소 이력과 회신 사본부터 다시 찾아야 한다.');
 return true;
}
export function relayObjective(s){
 if(s.flags.relayComplete)return '두 번째 밤의 기록 · 휴대폰에서 결말을 저장할 수 있다';
 if(!s.bag.includes('relayBadge'))return '접수동 서쪽 접수실 · 해린의 인계대에서 출입증과 인계 기록을 찾는다';
 if(!s.flags.relayIncoming||!s.flags.relayCancel||!s.flags.relayOverride)return '기록동 · 최초 접수지, 취소 통화, 원격 회신을 각각 조사한다';
 if(!s.bag.includes('relayCopy'))return '기록동 동쪽 대조대 · 세 기록을 실제 시각 순으로 대조한다';
 if(!s.flags.relayCooling)return s.bag.includes('relayWheel')?'설비동 서쪽 순환실 · 수동 핸들을 빈 냉각 밸브 축에 연결한다':'접수동 당직실 계단 ↓ · 설비동 정비대의 수동 핸들을 챙긴다';
 if(!s.flags.relayIsolated)return '설비동 동쪽 절체실 · 기존 입력 분리 스위치를 내린다';
 if(!s.flags.relayPower)return '설비동 동쪽 절체실 · 냉각·분리 확인 후 비상 회선을 투입한다';
 if(!s.flags.relayLastVoice)return '설비동 계단 ↑ 송출층 · 서쪽 청취실에서 마지막 회신을 듣는다';
 if(!s.flags.relayErasure)return '기록동 동쪽 청취실 · 해린의 수정 이력에서 지워진 문장을 확인한다 (송출층 북쪽 연결문 개방)';
 if(!s.flags.relayProofTimeline||!s.flags.relayProofAccount)return '송출층 동쪽 콘솔 · 실제 처리 순서와 취소자의 책임을 대조한다';
 return '송출층 동쪽 콘솔 · 송출 방식을 결정한다. 미정·도현의 기록은 선택 조사로 남아 있다';
}
const records={
 register:['relayRegistered','해린의 인계 기록','「삭제 요청은 취소 이력과 별도 보관한다. 서하에게: 당신이 취소한 것은 신고다. 정우가 유지한 것은 잠금이다. 같은 줄로 합쳐 쓰지 마.」\n\n서랍의 기록동 출입증을 챙겼다. 인계대 뒤의 연결문으로 기록동에 갈 수 있다.'],
 dutyNote:['relayDuty','미정의 당직 수첩','「아파트에서 나온 뒤 산북중계소로 가. 23:47 회신은 건물에 보낸 적이 없어. 통신 장애가 아니라, 여기서 막은 거야. 나는 문을 열 열쇠만 줬어. 그걸로 다 했다고 생각했어.」\n\n미정은 구조 요청이 끝난 뒤에도 기다린 사람이 있다는 것을 알고 있었다.'],
 incoming:['relayIncoming','23:41 · 서윤의 최초 접수','「지하에서 나갈 수가 없어요. 방화문 손잡이가 안 움직여요. 언니가 전화를 받았어요. 끊지 말아 주세요.」\n\n2023년 11월 4일 · 원본 접수 시각 23:41. 요청은 방화문 개방. 상태는 미처리. 음향 단서: 호출음 세 번.'],
 cancel:['relayCancel','23:43 · 서하의 취소 통화','「아니요. 잘못 신고했어요. 지금 관리인이 확인하고 있어요. 취소해 주세요.」\n\n2023년 11월 4일 · 취소 시각 23:43. 서윤의 신고 내용은 이 통화로 지워지지 않았다. 음향 단서: 짧은 종료음 한 번.\n나는 문이 열렸는지 묻지 않았다.'],
 override:['relayOverride','23:47 · 정우의 원격 회신','「현장 확인 전까지 잠금을 유지합니다. 개방 요청은 취소됐습니다.」\n\n2023년 11월 4일 · 회신 시각 23:47. 수신 대기는 계속됐지만 발신함에는 보내지지 않은 회신이 남았다. 음향 단서: 확인음 두 번.\n취소 통화 뒤에 누군가 다시 잠금을 유지했다.'],
 erasure:['relayErasure','해린의 수정 이력','지워진 문장: 「취소자의 응답 여부: 응답함. 현장 개방 확인: 확인하지 않음.」\n\n해린의 덧글: 「서하가 받았다는 줄을 지웠다. 정우가 잠금을 유지한 줄도 지웠다. 두 문장을 지우니 아무 일도 없었던 밤처럼 보였다.」'],
 pressure:['relayPressure','도현의 설비 관찰지','「23:47 회신등이 켜졌는데도 배관은 멈췄다. 소리를 들은 나는 아무도 없다고 적었다. 기계 소리라고 하면 사람을 못 들은 게 되니까.」\n\n도현은 문 뒤의 소리를 들었다. 여섯 사람의 침묵은 같은 이유에서 시작되지 않았다.'],
 lastVoice:['relayLastVoice','송출되지 않은 서윤의 회신','「언니. 신고는 취소됐다고 했어. 그런데 문은 안 열렸어. 누가 내 말을 끝까지 들으면… 열어 달라는 말이었는지만 남겨 줘. 누굴 미워하라는 게 아니야.」\n\n서윤의 목소리는 나를 부른 뒤 끝나지 않았다. 답이 오기를 기다리며 한참 숨을 쉬었다.\n나는 이번에는 그 침묵까지 들었다.\n\n송출층 북쪽의 접수동 연결문이 열렸다. 해린의 수정 이력과 다른 사람들의 기록도 돌아볼 수 있다.'],
 names:['relayNames','여섯 칸의 송출 확인 명부','서윤: 개방을 요청했다. 정우: 잠금을 유지했다. 서하: 확인하지 않고 취소했다. 해린: 두 처리 내역을 지웠다. 도현: 들은 것을 기계 소리로 적었다. 미정: 열쇠를 건넨 뒤 기다리지 않았다.\n\n누구의 책임도 다른 사람의 한 줄로 덮을 수 없다.'],
};
function result(title,text,extra={}){return {title,text,...extra};}
export function relayAction(s,o,choice=null){
 if(!s.flags.chapter2||!MAPS[s.map]?.objects.includes(o)||!o.chapterAction||Math.hypot(s.x-o.x,s.y-o.y)>=70||!sight(worldFor(s),s,o))return null;
 const action=o.chapterAction;
 if(records[action]){
  const [flag,title,text]=records[action];const first=!s.flags[flag];s.flags[flag]=true;note(s,o.id,text);
  if(action==='register')take(s,'relayBadge');
  return result(title,text,{sound:['cancel','override','lastVoice'].includes(action)?'scrape':'drawer',haunt:first&&action==='lastVoice'?'이번에는 끝까지 들어':null});
 }
 if(action==='compare'){
  if(s.bag.includes('relayCopy'))return result(o.name,'대조를 마친 사본은 소지품과 기록 앱에 남아 있다. 다음은 접수동 당직실의 계단 아래, 냉각 설비다.');
  if(!s.flags.relayIncoming||!s.flags.relayCancel||!s.flags.relayOverride)return result(o.name,'서류와 데크 세 곳을 먼저 조사해야 한다.\n서쪽 최초 접수지 / 동쪽 취소 통화 데크 / 동쪽 원격 회신 단말.');
  if(choice===null)return result(o.name,'세 기록은 한 번의 통화가 아니다. 실제로 일어난 순서대로 대조한다.\n기록 앱에 각 시각과 발신 내용이 남아 있다.',{choices:[['접수 → 취소 → 잠금 유지 회신','chronological'],['접수 → 잠금 유지 회신 → 취소','wrong'],['취소 → 접수 → 잠금 유지 회신','wrong']]});
  if(choice!=='chronological')return result(o.name,'시각이 맞지 않는다. 23:41, 23:43, 23:47의 순서와 각 발신 내용을 다시 확인하자. 기록은 사라지지 않았다.');
  take(s,'relayCopy');s.flags.relayCompared=true;note(s,'relay-comparison','23:41 접수 → 23:43 취소 → 23:47 잠금 유지. 취소가 개방을 뜻하지 않았다. 해린의 삭제 이력을 붙인 사본을 확보했다.');
  return result('대조 사본 출력','출력된 종이의 빈 줄에서 서윤의 손글씨가 떠오른다.\n「답을 보내 줘. 아직 기다리고 있어.」\n\n접수동으로 돌아가 당직실 계단을 내려간다. 송출기를 살리려면 냉각 밸브를 열고 회선을 절체해야 한다.',{sound:'item',haunt:'아직 기다리고 있어'});
 }
 if(action==='wheel'){
  if(s.flags.relayCooling||s.bag.includes('relayWheel'))return result(o.name,'핸들이 있던 받침만 남았다. 설치 위치는 이 방 동쪽의 냉각 순환 밸브다.');
  take(s,'relayWheel');return result(o.name,'정비대에서 사각 홈의 수동 핸들을 챙겼다.\n같은 방 동쪽 배관의 빈 축에 맞는다.',{sound:'item'});
 }
 if(action==='cooling'){
  if(s.flags.relayCooling)return result(o.name,'핸들이 고정되어 있고 순환 밸브가 열려 있다. 다음은 동쪽 절체실의 기존 입력 분리 스위치다.');
  if(!s.bag.includes('relayWheel'))return result(o.name,'손으로 돌릴 수 없는 사각 축이 드러나 있다. 이 방 서쪽 정비대에서 분리 보관한 핸들을 찾아야 한다.');
  s.bag=s.bag.filter(k=>k!=='relayWheel');s.flags.relayCooling=true;
  note(s,'relay-cooling','수동 핸들을 냉각 밸브 축에 연결하고 개방했다. 기존 입력을 분리한 다음 비상 회선을 투입한다.');
  return result(o.name,'사각 홈을 맞추고 핸들을 돌렸다. 배관 안쪽으로 물이 흐른다.\n맞은편 절체실로 가 기존 입력부터 분리하자.',{sound:'door'});
 }
 if(action==='isolate'){
  if(!s.flags.relayCooling)return result(o.name,'운전 안내: 먼저 서쪽 순환실의 냉각 밸브를 열 것. 순환 확인 없이 절체할 수 없다.');
  s.flags.relayIsolated=true;return result(o.name,'기존 입력을 분리했다. 과거의 확인음이 한 번 울린 뒤 끊겼다.\n옆의 비상 회선 제어반으로 이동한다.',{sound:'thud'});
 }
 if(action==='transfer'){
  if(!s.flags.relayCooling||!s.flags.relayIsolated)return result(o.name,'투입 차단. 냉각 밸브 개방과 기존 입력 분리를 먼저 확인해야 한다.\n퓨즈를 넣거나 다른 물건을 꽂는 장치가 아니다.');
  if(s.flags.relayPower)return result(o.name,'비상 회선이 유지되고 있다. 이 방 북쪽 계단으로 송출층에 갈 수 있다.');
  s.flags.relayPower=true;return result(o.name,'비상 회선을 투입했다. 위층 장비 팬이 돌아간다.\n계단 안쪽에서 바닥을 짚는 소리가 들렸다.\n송출층에 올라가기 전에 장비 보관장과 방화문 위치를 확인하자.',{sound:'apparition',haunt:'대답하지 마',hunt:20});
 }
 if(action==='transmit'){
  if(s.flags.relayComplete)return result(o.name,'송출 기록은 휴대폰의 사건 기록 앱에 남았다. 이곳에서 기억을 저장하거나 계속 둘러볼 수 있다.');
  if(!s.flags.relayPower||!s.bag.includes('relayCopy')||!s.flags.relayLastVoice)return result(o.name,'대조 사본, 비상 회선, 마지막 회신 청취가 모두 필요하다. 서쪽 청취실에서 서윤의 목소리를 끝까지 듣자.');
  if(!s.flags.relayErasure)return result(o.name,'대조 사본에 지워진 문장의 출처가 없다. 기록동 동쪽 청취실의 「해린의 수정 이력 서랍」을 확인해야 한다.\n송출층 북쪽 연결문으로 접수동까지 바로 돌아갈 수 있다.');
  if(!s.flags.relayProofTimeline){
   if(choice==='proof-time'){s.flags.relayProofTimeline=true;note(s,'relay-proof-time','신고 취소가 문을 연 것이 아니다. 취소 이후에도 정우가 잠금을 유지했다.');}
   else return result('최종 대조 1 · 취소와 개방','기록에 없는 내용을 덧붙이지 않는다. 접수 취소 뒤 방화문은 어떻게 되었는가?',{choices:[['취소와 함께 문이 열렸다','wrong-proof'],['23:47에 잠금 유지 회신이 남았다','proof-time']]});
  }
  if(!s.flags.relayProofAccount){
   if(choice==='proof-account'){s.flags.relayProofAccount=true;note(s,'relay-proof-account','정우의 잠금 유지와 서하의 확인 없는 취소는 둘 다 남겨야 한다. 해린의 삭제 이력도 함께 보존한다.');choice=null;}
   else return result('최종 대조 2 · 지워진 이름','해린이 지운 두 줄을 어떻게 복원해야 하는가?',{choices:[['정우의 잠금 유지와 서하의 확인 없는 취소를 모두 남긴다','proof-account'],['잠근 사람만 남기고 취소자의 이름은 뺀다','wrong-proof']]});
  }
  if(choice===null)return result(o.name,s.flags.originalKept?'가져온 원본과 중계소 사본이 일치한다. 누구의 이름도 지우지 않고 전송할 수 있다.':'아파트에 두고 온 원본은 없다. 이곳에서 복원한 사본이라는 사실을 밝혀야 한다. 나의 증언만으로 빈 줄을 채울 수는 없다.',{choices:[[s.flags.originalKept?'원본과 수정 이력을 함께 보낸다':'복원 사본임을 밝히고 보낸다','send'],['취소 이력만 지우고 보낸다','redact'],['아직 보내지 않는다','back']]});
  if(choice==='back')return result(o.name,'손을 뗐다. 기록은 남아 있다. 아직 조사하지 않은 수첩과 수정 이력을 돌아볼 수 있다.');
  if(!['send','redact'].includes(choice))return null;
  s.flags.relayComplete=true;
  s.ending=choice==='redact'?'silence':s.flags.originalKept?'signal':'fragment';
  const endings={
   signal:['두 번째 밤 — 남겨진 응답','원본과 사본, 그리고 내가 취소한 통화를 함께 보냈다.\n기계는 내 이름을 묻지 않았다. 내 이름도 이미 기록 안에 있었다.\n\n송출등이 꺼진 뒤 처음으로 회신이 왔다.\n「들었어.」\n\n서윤의 목소리인지 내 기억인지, 끝내 확인할 수 없었다. 다만 이번에는 지우지 않았다.'],
   fragment:['두 번째 밤 — 불완전한 증언','나는 원본을 두고 왔다고 적었다. 기억으로 메운 문장을 증거라고 부르지 않았다.\n사본의 빈 줄도 그대로 보냈다.\n\n회신은 오지 않았다. 대신 발신함의 「대기」가 사라졌다.\n아무것도 모른다고 말하던 밤은 끝났다. 증명하지 못한 것을 말해야 하는 아침이 남았다.'],
   silence:['두 번째 밤 — 두 번째 취소','취소 통화의 줄을 지우자 문서가 매끈해졌다.\n정우의 이름만 남고 내 이름은 사라졌다.\n\n송출 완료음이 울렸다. 곧 접수함에 새 신고가 들어왔다.\n「언니. 전화 받았잖아.」\n\n나는 같은 밤을 다른 장소에서 다시 시작했다.'],
  };
  const [title,text]=endings[s.ending];note(s,'relay-ending',title+'\n'+text);return result(title,text,{ending:true,sound:'save'});
 }
 return null;
}
