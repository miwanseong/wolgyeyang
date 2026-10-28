export function callFor(s,id){
 if(id==='entry-intercom'&&s.flags.power&&s.flags.storyPowerSeen&&!s.flags.callLobbyDone)return{flag:'callLobbyDone',speaker:'수화기 너머',first:'…열렸어? 네가 직접 봤어?',question:'누구야? 지금 어디에서 전화하는 거야?',reply:'열렸다고 한 사람. 그 사람을 찾고 있어. 문 앞에는 아직 아무도 안 왔어.',last:'내가 했던 확인을 되묻고 있어… 끊었는데도 상대 숨소리가 한 번 더 들렸다. 봉인된 접수 기록을 확인해야겠어.'};
 if(id==='relay-duty-intercom'&&s.flags.relayPower&&!s.flags.callRelayDone)return{flag:'callRelayDone',speaker:'내선 너머',first:'언니… 이번에는 끊지 마.',question:'서윤이야? 네 목소리, 원본에 남아 있는 거야?',reply:'내가 두 번째로 전화했을 때… 언니는 내 말을 다 듣지 않았어.',last:'전화가 끊기며 재생 장치 돌아가는 소리가 남았다. 실시간 전화인지 녹음인지 모르겠어. 데크에서 마지막 구간을 직접 들어야 해.'};
 return null;
}
