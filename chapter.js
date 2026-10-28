import {learnFamilyBinding} from './haunt-causality.js?v=fa5ea17edd12';
import {prepareStoryFlow,storyObjective} from './story-flow.js?v=fa5ea17edd12';
import {bodyState} from './body.js?v=fa5ea17edd12';
import { hasOriginals, CINEMATICS, STORY } from "./story.js?v=fa5ea17edd12";
import { MAPS, sight, worldFor } from "./world.js?v=fa5ea17edd12";
import { take, note } from "./state.js?v=fa5ea17edd12";
export const RELAY_MAPS=['relayYard','relayEntry','relayArchive','relayPlant','relaySignal','relayDrain'];
export function migrateStorySave(s){
 const replacements={receipt:STORY.receipt,records:STORY.records,tape:STORY.firstTape};
 const ids={register:'relay-register',dutyNote:'relay-duty-note',incoming:'relay-incoming',cancel:'relay-cancel',override:'relay-override',erasure:'relay-erasure',pressure:'relay-pressure',lastVoice:'relay-last-voice',names:'relay-six-names'};
 for(const [key,id]of Object.entries(ids))replacements[id]=records[key][2];
 s.notes=s.notes.map(n=>replacements[n.id]?{...n,text:replacements[n.id]}:n);
 if(s.flags.chapter2&&!s.flags.storyV3){
  s.flags.denial=true;
  for(const key of ['relayLastVoice','relayErasure','relayProofTimeline','relayProofAccount','relayComplete','relayExported'])s.flags[key]=false;
  s.ending=null;
  s.notes=s.notes.filter(n=>!['relay-ending','relay-proof-time','relay-proof-account','relay-export'].includes(n.id));
 }
 if(s.bag.includes('relayCopy'))s.flags.relaySlide=true;
 if(s.bag.includes('relayWheel')||s.flags.relayCooling)s.flags.relayLogic=true;
 if(s.flags.relayCooling)s.flags.relayPipes=true;
 prepareStoryFlow(s);if(s.flags.relayLastVoice&&s.flags.storyVoiceReaction)learnFamilyBinding(s);s.flags.storyV3=true;return s;
}
export function enterChapterTwo(s){
 if(s.ending!=='return'||!s.flags.denial||s.flags.chapter2)return false;
 s.flags.originalKept=hasOriginals(s);s.flags.chapter2=true;s.ending=null;
 s.map='relayYard';s.x=28*32;s.y=16*32;s.stamina=100;s.hidden=false;s.running=false;
 take(s,'flashlight');s.flashlight=bodyState(s).arms<2;
 note(s,'chapter2-arrival','02:13 · 산북 시설중계소. 지하 화재 때 시설 출동과 원격 잠금 명령을 중계한 위탁관리 시설이다. 소방서나 119 상황실이 아니다.\n접수증 뒷면의 R-17 안내를 따라 해린에게 원본 대조를 요청했다. 해린은 설비 담당 도현과 사고 당시 야간 경비였던 미정을 불렀다. 출입 목적은 잘린 녹음의 원본 확인이다. 동행인 명단은 접수대의 방문 인수 기록에 남겼다. 내가 직접 잠근 건 아니었다는 걸 확인하고 싶었다. 봉투의 원본은 버리지 않았다.');
 return true;
}
export function relayObjective(s){
 const urgent=storyObjective(s);if(urgent)return urgent;
 if(s.flags.relayTrapActive)return '청취 부스의 문이 잠겼다 · 방 안쪽의 기계식 비상 손잡이를 찾아 밖의 두드림이 멎을 때 당긴다';
 if(s.map==='relayYard'&&s.bag.includes('relayExport'))return '외부 마당 서쪽 산길·정류장 표지 · 증거를 가지고 떠난다';
 if(s.map==='relayYard'&&!s.flags.relayLastVoice)return '동쪽 현관 → 안내·접수동 · 인계대와 해린을 찾는다';
 if(s.flags.relayComplete)return '제출된 기록';
 if(s.bag.includes('relayExport'))return '접수동 남쪽 외부 출입문 · 증거 봉투를 가지고 밖으로 나간다';
 if(!s.bag.includes('relayBadge'))return '잘린 통화의 원본을 확인한다 · 접수동 해린에게 기록동 출입을 요청한다';
 if(!s.flags.relayIncoming||!s.flags.relayCancel||!s.flags.relayOverride)return '내 취소가 문 개방을 뜻했는지 확인한다 · 기록동 접수 원본·취소 녹음·잠금 회신을 조사한다';
 if(!s.bag.includes('relayCopy')&&!s.flags.relaySlide&&s.flags.relayIncoming&&s.flags.relayCancel&&s.flags.relayOverride)return '잘린 구간의 파일 번호를 찾는다 · 기록동 원본 색인 단말을 복원한다';
 if(!s.bag.includes('relayCopy'))return '누락된 통화의 파일 번호를 조회한다 · 기록동 원본 색인 단말';
 if(s.flags.relayLastVoice&&!s.bag.includes('relayExport'))return '원본 통화를 확인했다 · 같은 데크에서 저장 매체를 챙긴 뒤 건물 밖으로 나간다';
 if(s.flags.routeB&&!s.bag.includes('relayExport'))return 'B루트 · 접수동 북쪽 관리카드 연결문으로 송출층 편집 단말에 간다. 원본을 확인하려면 봉인대에서 경로를 바꿀 수 있다';

 if(!s.flags.relayCooling)return s.bag.includes('relayWheel')?'설비동 서쪽 순환실 · 수동 핸들을 빈 냉각 밸브 축에 연결한다':'통화 원본 데크의 전원을 켠다 · 도현에게 복구를 부탁하거나 직접 설비를 점검한다';
 if(!s.flags.relayIsolated)return '설비동 동쪽 절체실 · 기존 입력 분리 스위치를 내린다';
 if(!s.flags.relayPower)return '설비동 동쪽 절체실 · 냉각·분리 확인 후 비상 회선을 투입한다';
 if(!s.flags.relayLastVoice)return '취소 뒤 동생이 다시 전화했는지 확인한다 · 송출층 원본 데크에서 누락 구간을 재생한다';
 if(!s.flags.relayErasure)return '기록동 동쪽 청취실 · 해린의 수정 이력에서 지워진 문장을 확인한다 (송출층 북쪽 연결문으로 복귀 가능)';
 if(!s.flags.relayProofTimeline||!s.flags.relayProofAccount)return '송출층 동쪽 콘솔 · 실제 처리 순서와 취소자의 책임을 대조한다';
 return '송출층 동쪽 콘솔 · 기록 내보내기 방식을 결정한다. 미정·도현의 기록은 선택 조사로 남아 있다';
}
export const records={
 "register": [
  "relayRegistered",
  "해린의 야간 인계대",
  "사고 당시 이곳은 여러 공동주택의 시설 출동과 원격 문 제어를 맡은 위탁관리 중계소였다. 119 출동을 취소할 권한은 없었다.\n해린의 처리 보고: 「23:43 취소 뒤 추가 수신은 없었다. 중복 표시를 정리하고 목록을 인계했다.」\n원본 조작 이력은 별도 보관한다. 기록동 출입증은 인계 서랍에 있다."
 ],
 "dutyNote": [
  "relayDuty",
  "미정의 예비 열쇠 인수 기록",
  "정우의 열쇠 인수 요약: 「열쇠가 돌아갔으므로 현장 문도 열렸다.」\n미정의 직접 기록: 「문 밖에 덧대어져 있던 장치 때문에 내 열쇠는 소용이 없었다. 원래 잠금장치만 돌았다. 전원을 내리면 풀릴 거라고 생각했는데 그것도 아니었다.\n정우를 기다리지 말고 바로 119에 연락했어야 했다. 내가 열쇠를 줬다는 말로 그 시간을 덮지 말아 줘.」\n추가 전동 빗장은 피난문에 달아서는 안 되는 장치였다."
 ],
 "incoming": [
  "relayIncoming",
  "23:41 · 최초 시설 출동 요청",
  "2023년 11월 4일. 서윤은 소방 점검표 위조를 확인하려고 지하 서류 창고에 내려갔다. 노후 배선에서 불이 났고, 정우가 반출 방지용으로 덧댄 빗장이 출구를 막았다.\n「언니. 서류 챙겨 나갈게. 문 좀 열어 줘. 연기가 들어와.」\n내부 구조 출동 접수 23:41 / 요청: 문 개방과 현장 출동. 119에 접수됐다는 뜻이 아니다."
 ],
 "cancel": [
  "relayCancel",
  "23:43 · 확인하지 않은 개방 확인",
  "서하: 「제가 현장 개방 확인했습니다. 시설 출동 취소해 주세요.」\n메타데이터: 23:42 제어기 응답 R-17 수신 / 문 열림 접점: 수신 없음.\n화면의 「해제 완료」는 명령이 도착했다는 뜻이었다. 문이 실제로 열렸다는 뜻이 아니었다.\n정우가 직접 내려가겠다고 했고, 나는 눈앞의 표시를 믿는 편을 택했다. 하지만 문 앞에 가지 않고 「확인했다」고 말한 것은 나였다."
 ],
 "override": [
  "relayOverride",
  "23:47 · 수동 잠금 유지 로그",
  "정우의 수동 조작 23:47 / 기존 잠금 유지. 자동 화재 연동이 아니라 사람이 다시 누른 명령이었다.\n녹음: 「장부 들고 나가면 점검표 건까지 다 끝나요. 잠깐만 막아 둬요. 내가 데리고 나올 테니까.」\n정우는 계약과 점검표 위조가 드러나는 것을 두려워했다. 구조를 미루면 서류를 회수할 수 있다고 생각했다. 그 몇 분 동안 문 뒤로 연기가 들어갔다."
 ],
 "erasure": [
  "relayErasure",
  "해린의 삭제 이력 · 23:44 수신",
  "해린은 위조 점검표의 서류 담당자였다. 현장에 없었다는 이유로 자신은 사고와 무관하다고 말했고, 관리 화면에서 두 줄을 숨겼다.\n① 취소자 현장 미확인 ② 취소 후 재통화 23:44, 응답자 서하.\n원본 조작 이력에는 숨김 이전 값이 남았다. 「시험 방송」으로 바꾼 것은 표시 항목이지, 실제 통화 원본이 아니었다.\n테이프에서 빠진 1분은 없어진 시간이 아니었다. 내가 한 번 더 전화를 받은 시간이었다."
 ],
 "pressure": [
  "relayPressure",
  "도현의 최초 진술과 수정본",
  "최초 진술: 「시험 시간이라고 붙여 놨지만, 사람이 문을 두드리는 것 같았다.」\n수정본: 「월계아파트 B1 배수펌프 운전 중의 규칙적인 진동이었다.」\n정우가 근거 없이 소란 피운 책임을 묻겠다고 하자 도현은 처음 문장을 고쳤다. 들은 소리를 확신할 수 없었다는 말과, 확인하러 가지 않았다는 사실은 다른 것이었다."
 ],
 "lastVoice": [
  "relayLastVoice",
  "복원된 23시 44분",
  "서윤: 「언니. 아직 안 열렸어. 아까 취소하면 안 돼. 다시 불러 줘.」\n서하: 「내가 확인했다고 해 버렸어. 지금 다시 부르면…」\n서윤: 「그럼 지금 문 앞에 와 줘.」\n통화 지속 41초. 종료 조작: 수신자 서하.\n\n나는 처음에는 표시를 잘못 믿었다. 그 다음에는 문이 안 열렸다는 말을 들었다. 다시 요청하면 방금 한 거짓 확인이 드러날까 봐 끊었다."
 ],
 "names": [
  "relayNames",
  "서로 다른 여섯 칸",
  "서윤은 위조된 점검표를 찾으러 갔다. 정우는 불법 빗장을 달고 구조를 미뤘다. 서하는 개방을 확인하지 않고 확인했다고 말한 뒤 재통화까지 끊었다.\n해린은 자기 서류 책임을 피하려 표시 기록을 숨겼다. 도현은 보복이 두려워 최초 진술을 고쳤다. 미정은 무력한 열쇠를 믿고 도움을 늦췄다.\n다 같은 행동도, 다 같은 책임도 아니다. 한 사람의 잘못을 밝혀도 다른 사람의 행동은 사라지지 않는다."
 ]
};
function result(title,text,extra={}){return {title,text,...extra};}
export function relayAction(s,o,choice=null){
 if(!s.flags.chapter2||!MAPS[s.map]?.objects.includes(o)||!o.chapterAction||Math.hypot(s.x-o.x,s.y-o.y)>=70||!sight(worldFor(s),s,o))return null;
 const action=o.chapterAction;
 if(action==='lastVoice'&&choice==='collectOriginal'&&s.flags.relayLastVoice){take(s,'relayExport');s.flags.relayExported=true;s.flags.relayRedacted=false;s.flags.routeA=true;s.flags.routeB=false;s.bag=s.bag.filter(k=>k!=='editPass');note(s,'relay-export','23:44 통화 원본과 복원 시각·파일 번호를 함께 보존했다. 서하의 종료 조작도 빠짐없이 저장했다.');return result('원본 녹음 확보','재생한 원본 통화와 파일 번호를 저장 매체에 옮겨 봉투에 넣었다.\n내 목소리도… 이번에는 끝까지 남겼다. 이제 이걸 가지고 밖으로 나가자.',{exported:true,sound:'item'});}
 if(action==='lastVoice'&&!s.flags.relayPower)return result(o.name,'원본 복원 데크의 전원이 꺼져 있다. 전용 회선은 냉각을 복구한 뒤에만 켤 수 있다.');
 if(action==='lastVoice'&&!s.flags.relayLastVoice&&!s.flags.relaySync)return result(o.name,'두 복제 신호가 어긋나 말소리가 묻힌다. 기준 펄스를 먼저 대조해야 한다.',{puzzle:'sync'});
 if(records[action]){
  const [flag,title,text]=records[action];const first=!s.flags[flag];s.flags[flag]=true;note(s,o.id,text);
  if(action==='register')take(s,'relayBadge');
  if(action==='incoming'&&first){take(s,'relayAuditKey');}
  return result(title,text,{sound:['cancel','override','lastVoice'].includes(action)?'scrape':'paper',choices:action==='lastVoice'&&!s.bag.includes('relayExport')?[['내 목소리까지 포함한 통화 원본을 챙긴다','collectOriginal']]:undefined,haunt:first&&action==='lastVoice'?'이번에는 끝까지 들어':null});
 }
 if(action==='compare'){
  if(s.bag.includes('relayCopy'))return result(o.name,'파일 번호를 조회한 출력 사본은 이미 챙겼다. 비어 있는 번호는 수정 전 목록과 대조해야 한다.');
  if(!s.flags.relayIncoming||!s.flags.relayCancel||!s.flags.relayOverride)return result(o.name,'서류와 데크 세 곳을 먼저 조사해야 한다.\n서쪽 최초 접수지 / 동쪽 취소 통화 데크 / 동쪽 원격 회신 단말.');
  if(!s.flags.relaySlide)return result(o.name,'원본 색인 단말의 매체 배열이 어긋나 파일 번호를 읽을 수 없다. 인덱스 조각을 원래 번호대로 맞춰야 한다.',{puzzle:'slide'});
  // This terminal physically searches the file index; it is not a desk for choosing a conclusion.
  take(s,'relayCopy');s.flags.relayCompared=true;note(s,'relay-comparison','23:41 접수 →23:43 취소 →23:47 잠금 유지. 취소가 개방을 뜻하지 않았다. 원본 색인에서 그 사이 녹음 파일 번호 하나가 비었다. 수정 전 목록을 구해 잘린 구간의 원본을 찾아야 한다.');
  return result('원본 색인 조회 결과','23:41 접수 →23:43 취소 →23:47 잠금 유지. 내 취소 뒤에도 문은 잠겨 있었다.\n그 사이 녹음 파일 번호가 하나 비어 있다. 인계 목록에는 없는 파일이다. 해린의 수정 전 목록과 원본 저장 매체를 확인해야 한다.',{sound:'item',haunt:'아직 기다리고 있어'});
 }
 if(action==='wheel'){
  if(s.flags.relayCooling||s.bag.includes('relayWheel'))return result(o.name,'핸들이 있던 받침만 남았다. 설치 위치는 이 방 동쪽의 냉각 순환 밸브다.');
  if(!s.flags.relayLogic)return result(o.name,'핸들은 검증 표지가 붙은 세 잠금함 중 하나에 보관되어 있다.',{puzzle:'logic'});
  take(s,'relayWheel');return result(o.name,'정비대에서 사각 홈의 수동 핸들을 챙겼다.\n같은 방 동쪽 배관의 빈 축에 맞는다.',{sound:'item'});
 }
 if(action==='cooling'){
  if(s.flags.relayCooling)return result(o.name,'핸들이 고정되어 있고 순환 밸브가 열려 있다.');
  if(!s.bag.includes('relayWheel'))return result(o.name,'손으로 돌릴 수 없는 사각 축이 드러나 있다. 이 방 서쪽 정비대에서 분리 보관한 핸들을 찾아야 한다.');
  if(!s.flags.relayPipes)return result(o.name,'점검판의 배관이 분리되어 있다. 회전 관을 연결해야 한다.',{puzzle:'pipes'});
  s.bag=s.bag.filter(k=>k!=='relayWheel');s.flags.relayCooling=true;
  note(s,'relay-cooling','수동 핸들을 냉각 밸브 축에 연결하고 개방했다. 기존 입력을 분리한 다음 비상 회선을 투입한다.');
  return result(o.name,'사각 홈을 맞추고 핸들을 돌렸다. 배관 안쪽으로 물이 흐른다.',{sound:'valve'});
 }
 if(action==='isolate'){
  if(!s.flags.relayCooling)return result(o.name,'운전 안내: 먼저 서쪽 순환실의 냉각 밸브를 열 것. 순환 확인 없이 절체할 수 없다.');
  s.flags.relayIsolated=true;return result(o.name,'기존 입력을 분리했다. 과거의 확인음이 한 번 울린 뒤 끊겼다.',{sound:'thud'});
 }
 if(action==='transfer'){
  if(!s.flags.relayCooling||!s.flags.relayIsolated)return result(o.name,'투입 차단. 냉각 밸브 개방과 기존 입력 분리를 먼저 확인해야 한다.\n퓨즈를 넣거나 다른 물건을 꽂는 장치가 아니다.');
  if(s.flags.relayPower)return result(o.name,'비상 회선이 유지되고 있다. 이 방 북쪽 계단으로 송출층에 갈 수 있다.');
  s.flags.relayPower=true;return result(o.name,'비상 회선을 투입했다. 원본 복원 데크의 팬이 위층에서 돌아가기 시작했다.\n통화가 잘린 구간을 재생할 수 있다. 계단 안쪽에서 열쇠가 흔들리는 소리가 들렸다.',{sound:'apparition',haunt:'대답하지 마',hunt:20});
 }
 if(action==='leaveRelay'){
  if(!s.bag.includes('relayExport'))return result(o.name,'지금은 돌아갈 수 없어. 아직 그 전화가 끝나지 않았어.');
  s.flags.relayComplete=true;s.ending=s.flags.relayRedacted?'silence':hasOriginals(s)?'signal':'fragment';
  note(s,'relay-ending',CINEMATICS[s.ending].label);return {cinematic:s.ending};
 }
 if(action==='transmit'){
  if(choice==='wrong-proof')return result(o.name,'선택한 진술과 원본 기록이 일치하지 않는다.',{mistake:true});
  if(s.bag.includes('relayExport'))return result(o.name,'대조 기록과 23:44 통화를 증거 매체로 내보냈다.');
  if(!s.flags.relayPower||!s.bag.includes('relayCopy')||!s.flags.relayLastVoice)return result(o.name,'대조 사본, 비상 회선, 마지막 회신 청취가 모두 필요하다. 서쪽 청취실에서 서윤의 목소리를 끝까지 듣자.');
  if(!s.flags.relayErasure)return result(o.name,'대조 사본에 지워진 문장의 출처가 없다. 기록동 동쪽 청취실의 「해린의 수정 이력 서랍」을 확인해야 한다.');
  if(s.flags.routeA){if(choice==='redact')return result(o.name,'봉인한 전체 원본에서 내 통화만 골라 빼지 않기로 했다.');s.flags.relayProofTimeline=true;s.flags.relayProofAccount=true;}
  if(!s.flags.relayProofTimeline){
   if(choice==='proof-time'){s.flags.relayProofTimeline=true;note(s,'relay-proof-time','신고 취소가 문을 연 것이 아니다. 취소 이후에도 정우가 잠금을 유지했다.');}
   else return result('최종 대조 1 · 취소와 개방','기록에 없는 내용을 덧붙이지 않는다. 접수 취소 뒤 방화문은 어떻게 되었는가?',{choices:[['취소와 함께 문이 열렸다','wrong-proof'],['23:47에 잠금 유지 회신이 남았다','proof-time']]});
  }
  if(!s.flags.relayProofAccount){
   if(choice==='proof-account'){s.flags.relayProofAccount=true;note(s,'relay-proof-account','23:44 수신자 서하의 종료 조작과 23:47 정우의 잠금 유지를 함께 보존한다. 취소 뒤에도 나는 문이 안 열렸다는 말을 들었다.');choice=null;}
   else return result('최종 대조 2 · 수신 기록','삭제 전 원본에는 어떤 행동이 함께 기록되어 있는가?',{choices:[['23:44 내 재통화 종료와 23:47 정우의 잠금 유지','proof-account'],['정우의 잠금 유지뿐이고 내 재통화는 없다','wrong-proof']]});
  }
  if(choice===null)return result(o.name,s.flags.originalKept?'가져온 원본과 중계소 사본이 일치한다. 누구의 이름도 지우지 않고 전송할 수 있다.':'확보하지 못한 원본이 있다. 이곳에서 복원한 사본이라는 사실을 밝혀야 한다. 나의 증언만으로 빈 줄을 채울 수는 없다.',{choices:[[s.flags.originalKept?'내 재통화까지 포함한 전체 기록을 증거 매체로 내보낸다':'복원 사본임을 표시하고 전체 기록을 내보낸다','send'],...(s.flags.routeA?[]:[['내 재통화와 취소 이력은 빼고 내보낸다','redact']]),['아직 내보내지 않는다','back']]});
  if(choice==='back')return result(o.name,'손을 뗐다. 기록은 남아 있다. 아직 조사하지 않은 수첩과 수정 이력을 돌아볼 수 있다.');
  if(!['send','redact'].includes(choice))return null;
  s.flags.relayRedacted=choice==='redact';s.flags.relayExported=true;take(s,'relayExport');
  note(s,'relay-export',s.flags.relayRedacted?'정우의 조작은 남기고 내 취소와 재통화는 제외했다. 원본은 내 봉투에 남아 있다.':'취소와 재통화, 수동 잠금 유지의 조작 이력을 모두 보존했다. 원본과 복원 경위를 구분해 증거 매체로 내보냈다.');
  return result('증거 매체 분리','기록이 담긴 매체를 분리해 봉투에 넣었다. 반복 재생되던 확인음이 멎는다.',{sound:'item',exported:true});
 }
 return null;
}

export function acquireRelayMap(s){if(s.flags.relayMap)return false;s.flags.relayMap=true;return true;}
