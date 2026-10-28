// Present-tense events follow discoveries, not elapsed idle time.
export function prepareStoryFlow(s){
 if(s.flags.storyFlowV1)return;
 s.flags.storyFlowV1=true;
 for(const [seen,old]of [['storyPowerSeen','power'],['storyIntakeSeen','relayIncoming'],['storyArchiveAlarm','relayCompared'],['storyPowerReturn','relayPower'],['storyVoiceReaction','relayLastVoice'],['storyVerifierSeen','relayCancel']])if(s.flags[old])s.flags[seen]=true;
 if(s.bag.includes('relayCopy')||s.flags.relayCompared){s.flags.storyArchiveAlarm=true;s.flags.storyDrainEscaped=true;}
}
export const FALL_ZONE={x:46.5*32,y:26.5*32,w:3*32,h:3*32};
export function nextStoryBeat(s){
 prepareStoryFlow(s);const f=s.flags;
 if(!f.chapter2&&f.power&&!f.storyPowerSeen&&s.map==='lobby')return'powerPhone';
 if(!f.chapter2)return null;
 if(s.map==='relayDrain'&&!f.storyLightAccident&&s.bag.includes('flashlight')&&s.x>12*32&&s.x<24*32&&s.y>10*32&&s.y<14*32)return'lightAccident';
 if(s.map==='relayArchive'){
  if(f.relayIncoming&&!f.storyIntakeSeen)return'intakeDoor';
  if(f.relayCancel&&!f.storyVerifierSeen)return'cancelEyes';
  if(s.bag.includes('relayCopy')&&!f.storyArchiveAlarm)return'archiveAlarm';
  if(f.storyArchiveAlarm&&!f.storyDrainEscaped&&!f.storyHelpWitness&&!f.storyProtectRecord)return'archiveChoice';
  if(f.storyProtectRecord&&!f.storyFell&&!f.storyDrainEscaped&&s.x>=FALL_ZONE.x&&s.x<FALL_ZONE.x+FALL_ZONE.w&&s.y>=FALL_ZONE.y&&s.y<FALL_ZONE.y+FALL_ZONE.h)return'floorFall';
 }
 if(s.map==='relayPlant'&&f.relayPower&&!f.storyPowerReturn)return'powerReturn';
 if(s.map==='relaySignal'&&f.relayLastVoice&&!f.storyVoiceReaction)return'voiceReaction';
 return null;
}
export function chooseStormResponse(s,choice){
 if(!s.bag.includes('relayCopy')||!s.flags.storyArchiveAlarm||s.flags.storyDrainEscaped||s.flags.storyHelpWitness||s.flags.storyProtectRecord)return false;
 if(choice==='witness')s.flags.storyHelpWitness=true;else if(choice==='record')s.flags.storyProtectRecord=true;else return false;
 return true;
}
export function storyExitBlocked(s,o){return o.id==='relay-archive-back'&&s.flags.storyArchiveAlarm&&!s.flags.storyDrainEscaped;}
export function storyAction(s,action){
 if(s.map!=='relayDrain')return null;
 if(action==='bypass'){if(s.flags.storyDrainBypass)return{line:'우회 배수관에서 물이 빠지고 있다.'};s.flags.storyDrainBypass=true;return{line:'밸브를 돌리자 물살이 옆 배수관으로 꺾였다. 철문을 누르던 물소리가 낮아졌다.',sound:'valve'};}
 if(action==='gate'){
  if(s.flags.storyDrainReleased)return{line:'레버는 열린 쪽에 걸려 있다. 남쪽 점검로로 빠져나갈 수 있다.'};
  if(!s.flags.storyDrainBypass)return{line:'레버가 움직이지 않아. 물이 반대쪽에서 밀고 있어… 옆의 우회 배수 밸브부터 열어야겠어.'};
  s.flags.storyDrainReleased=true;s.flags['open_story-drain-gate']=true;return{line:'철문이 들렸다.\n…뒤에서, 물 밟는 소리가 멎었어. 내가 멈추니까 같이 멈췄어.',sound:'shutter',pursuit:true};
 }
 return null;
}
export function storyObjective(s){
 if(s.map==='relayDrain'){if(s.flags.flashlightBroken)return'손전등에 물이 들어갔다 · 서쪽 작업 안전함에서 예비 작업등을 찾는다';if(!s.flags.storyDrainBypass)return'배수 점검로에서 빠져나간다 · 동쪽 조작실의 우회 배수 밸브를 연다';if(!s.flags.storyDrainReleased)return'수압이 낮아졌다 · 바로 옆 배수문 레버로 남쪽 점검로를 연다';return'열린 남쪽 배수문을 지나 서쪽 안전계단으로 올라간다';}
 if(s.map==='relayArchive'&&s.flags.storyArchiveAlarm&&!s.flags.storyDrainEscaped)return s.flags.storyHelpWitness?'미정이 확보한 동쪽 점검 계단으로 연결 복도를 우회한다':'기록을 방수 봉투에 넣었다 · 무너진 연결 복도 대신 동쪽 점검 통로를 확인한다';
 return null;
}
export function stormEndingBeat(s){
 if(s.flags.storyHelpWitness)return['같이 돌아온 사람','미정이 좁은 계단에서 내 손을 놓지 않았다. 밖에 나온 뒤에도 내 대답을 기다렸다.\n정우가 한 일만 말할지, 내가 끝낸 통화까지 말할지. 이번에는 내 말을 들어 줄 사람이 눈앞에 있었다.',''];
 if(s.flags.storyProtectRecord)return['물에 젖지 않은 봉투','떨어질 때도 봉투를 놓지 않았다. 내 몸보다 먼저 끌어안은 기록이었다.\n밖에서는 내가 무엇을 지킨 건지, 왜 그 줄을 챙겼는지 내 말로 설명해야 했다.',''];
 return null;
}

// A supply found before an accident becomes a real additional choice afterwards.
export function replaceWetLight(s){
 if(!s.flags.flashlightBroken||!s.bag.includes('spareLight'))return false;
 s.bag=s.bag.filter(id=>id!=='spareLight');s.flags.flashlightBroken=false;s.flags.temporaryLighter=false;s.flags.temporaryPhone=false;s.flags.storyLightReplaced=true;s.flashlight=true;return true;
}

export function useEmergencyLight(s,source){
 if(!s.flags.flashlightBroken)return false;
 if(source==='lighter'&&!s.bag.includes('lighter'))return false;
 if(!['lighter','phone'].includes(source))return false;
 s.flags.temporaryLighter=source==='lighter';s.flags.temporaryPhone=source==='phone';s.flashlight=false;return true;
}
