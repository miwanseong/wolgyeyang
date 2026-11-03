import {pickupBlocked} from './body.js?v=1d9826df86db';

const remember=(s,id,text)=>{if(!s.notes.some(n=>n.id===id))s.notes.push({id,text});};
export const SHADOW_ITEMS={
 serviceCarbon:'옛 통신 인계함의 23:44 탄소 인수지',
};
export const SHADOW_DESCRIPTION='동생이 아니라 야간 경비가 남긴 통신 인계지야. 23:44 지하 내선 재수신, 응답석 01. 통화 내용은 없지만, 취소 뒤에 전화가 한 번 더 왔다는 흔적이 남아 있어. 수정 전 번호를 원본과 맞춰 봐야겠어.';

// The wall is never traversable. The old opening was bricked up after the fire;
// the courtyard service entrance reaches its other side by an actual staircase.
export function nextShadowBeat(s){
 const f=s.flags;if(f.chapter2)return null;
 if(s.map==='serviceHall'&&s.bag.includes('flashlight')&&!f.shadowWallSeen)return'shadowWall';
 if(s.map==='oldBoiler'&&f.shadowCabinetOpen&&!f.shadowRoomFinished&&s.bag.includes('serviceCarbon'))return'shadowReturn';
 return null;
}
export function shadowObjective(s){
 const f=s.flags;if(f.chapter2||!f.shadowWallExamined||f.shadowRoomFinished)return null;
 if(!s.bag.includes('serviceKey'))return'그림자가 사라진 옛 출입구 · 관리실 공용 열쇠를 확보한다';
 if(!s.bag.includes('laundryKey'))return'후면 복도의 경비 열쇠판 → 공동 세탁실 → 건조 마당의 옛 설비 점검계단';
 if(!s.bag.includes('rearKey'))return'공동 세탁실 배수를 낮추고 후면 현관 열쇠로 건조 마당에 나간다';
 if(s.map!=='oldBoiler')return'건조 마당 북쪽 옛 설비 점검계단 · 막힌 출입구의 반대편을 확인한다';
 if(!f.shadowCircuitOff)return'퇴역 설비실 · 임시 인계함의 살아 있는 저전압 전원을 분리한다';
 if(!f.shadowCabinetOpen)return'퇴역 설비실 · 통신 인계함 옆 수동 걸쇠를 푼다';
 return'퇴역 설비실의 통신 인계함에 남은 탄소 인수지를 챙긴다';
}
export function shadowAction(s,o){
 const action=o.shadowAction;if(!action)return null;
 const f=s.flags;
 if(action==='wall'){
  f.shadowWallSeen=true;f.shadowWallExamined=true;
  const text='그림자가 사라진 자리에 문틀 자국이 있어. 벽돌 색도 달라.\n화재 뒤 폐쇄한 옛 설비 출입구… 벽을 뜯을 수는 없어. 옆 점검도에 건조 마당 쪽 별도 점검계단이 남아 있어. 저 벽 뒤로 돌아갈 수 있겠어.';
  remember(s,'shadow-wall',text);return{line:text,sound:'paper'};
 }
 if(action==='isolate'){
  if(f.shadowCircuitOff)return{line:'저전압 전원을 분리해 뒀어. 표시등은 꺼져 있어.'};
  f.shadowCircuitOff=true;return{line:'통신 인계함의 저전압 전원을 분리했다. 보일러 전원과는 다른 회선이야.\n기계 소리가 멎었는데… 벽 너머에서 누가 숨을 들이켰어.',sound:'flashlightOff'};
 }
 if(action==='release'){
  if(!f.shadowCircuitOff)return{line:'전동 걸쇠가 잡고 있어. 옆 표시등이 살아 있네. 전원을 분리한 뒤 수동 손잡이를 당겨야겠어.'};
  if(f.shadowCabinetOpen)return{line:'걸쇠는 열린 위치에 걸려 있어. 바로 옆 통신 인계함을 열 수 있어.'};
  f.shadowCabinetOpen=true;return{line:'손잡이를 당기자 작은 걸쇠가 풀렸어.\n옆 인계함 안에 종이가 남아 있어. 바람도 없는데 모서리가 떨려.',sound:'drawer'};
 }
 if(action==='carbon'){
  if(!f.shadowCabinetOpen)return{line:'철거 전 임시 통신 인계함. 문은 작은 걸쇠에 걸려 있어. 옆에 수동 손잡이와 저전압 분리 스위치가 있다.'};
  if(s.bag.includes('serviceCarbon'))return{line:'인수지를 챙긴 자리만 남았어. 적힌 응답석 번호는01… 내 자리였어.'};
  if(pickupBlocked(s))return{line:'종이를 꺼내려면 남은 손을 비워야 해. 손전등부터 내려놓자. R.'};
  s.bag.push('serviceCarbon');remember(s,'shadow-carbon',SHADOW_DESCRIPTION);
  return{line:'23:44. 지하 내선에서 다시 전화가 왔다고 적혀 있어. 응답석01… 내가 앉았던 자리야.\n여기에는 누가 무슨 말을 했는지 없어. 통화 원본은 산북 시설중계소에 보관했다고 적혀 있어.\n저 그림자는 왜 나를 이쪽까지 데려온 거지?',sound:'paper'};
 }
 return null;
}
export function finishShadowRoom(s){
 if(!s.bag.includes('serviceCarbon')||!s.flags.shadowCabinetOpen||s.flags.shadowRoomFinished)return false;
 s.flags.shadowRoomFinished=true;
 remember(s,'shadow-room-finished','막힌 출입구 반대편에서23:44 재수신 인수지를 찾았다. 인계함 앞에서 사라진 그림자의 손이 잠깐 문을 두드렸다. 「언니」라는 목소리. 서윤인지 아직 확인할 수 없다.104호 사진과 아파트 테이프를 확보해 중계소 원본의 응답석01·재수신 번호를 확인한다.');return true;
}

export function verifyShadowRecord(s){
 if(!s.bag.includes('serviceCarbon')||!s.flags.relayErasure)return false;
 s.flags.shadowRecordMatched=true;
 remember(s,'shadow-matched','아파트 탄소 인수지의23:44 지하 내선·응답석01이 해린의 숨김 전 수신 행과 일치한다. 그림자가 가리킨 것은 출구가 아니라 내가 끊은 두 번째 전화의 흔적이었다. 통화의 내용은 송출층 원본으로 확인해야 한다.');return true;
}
export function fullExportReady(s){
 const f=s.flags;return !!(f.relayIncoming&&f.relayCancel&&f.relayOverride&&s.bag.includes('relayCopy')&&f.relayErasure&&f.relayLastVoice&&f.storyVoiceReaction&&(f.storyAcceptedCall||f.storyRefusedCall));
}
export function relayClosureReady(s){return !!(s.bag.includes('relayExport')&&!s.flags.relayRedacted&&fullExportReady(s));}
export function completeRelayClosure(s,answer){
 if(!relayClosureReady(s)||s.flags.relayClosure)return false;
 if(!['accept','refuse'].includes(answer))return false;
 s.flags.storyAcceptedCall=answer==='accept';s.flags.storyRefusedCall=answer==='refuse';s.flags.relayClosure=true;
 remember(s,'relay-final-answer',answer==='accept'?'서윤의 마지막 요청에 내 말로 답했다. 「문은 열리지 않았어. 네 전화를 받은 내가 끊었어.」 통화 종료음이 울렸다. 내 책임을 인정한 말도 원본과 함께 진술한다.':'원본은 지우지 않았지만 서윤의 마지막 질문에는 답하지 못했다. 통화 종료음은 나지 않았다. 답하지 않은 사실까지 진술에 남긴다.');return true;
}
export function relayEndingId(s,hasAllOriginals){
 if(s.flags.relayRedacted)return'silence';
 if(!s.flags.relayClosure)return null;
 if(s.flags.storyRefusedCall)return'unanswered';
 if(s.flags.shadowRoomFinished&&s.flags.shadowRecordMatched&&s.flags.storyAcceptedCall)return'answered';
 return hasAllOriginals?'signal':'fragment';
}
