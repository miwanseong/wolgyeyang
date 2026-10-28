import {callFor} from './phone-calls.js?v=178ec9dc0c70';
import {assistResident} from './npc-threat.js?v=178ec9dc0c70';
import {prepareExploration,explorationGate,explorationAction,explorationBeat,explorationObjective} from './exploration.js?v=178ec9dc0c70';
import {learnFamilyBinding,noteManifestation} from './haunt-causality.js?v=178ec9dc0c70';
import {prepareStoryFlow,nextStoryBeat,chooseStormResponse,storyExitBlocked,storyAction,replaceWetLight,useEmergencyLight} from './story-flow.js?v=178ec9dc0c70';
import {ensureRun,recordDeathReturn} from './return-memory.js?v=178ec9dc0c70';
import {ThresholdHorror} from './threshold-horror.js?v=178ec9dc0c70';
import {MEMENTOS,MEMENTO_MONOLOGUES,collectMemento,collectedMementos,claimMementoRewards} from './mementos.js?v=178ec9dc0c70';
import {chooseRecordRoute,beginLockEvent,tickLockEvent,releaseLock,TRAP_DOORS,routeFilm} from './route-events.js?v=178ec9dc0c70';
import {acquireRelayMap} from './chapter.js?v=178ec9dc0c70';
import {npcCorruption,startNpcScream,FEAR_LINES,protagonistReaction,noticeNpc} from './resident-corruption.js?v=178ec9dc0c70';
import {advanceDistortion} from './distortion.js?v=178ec9dc0c70';
import {hollowStage} from './hollow-art.js?v=178ec9dc0c70';
import {isRelayGhost} from './relay-ghosts.js?v=178ec9dc0c70';
import {collectRecovery,discoverThread} from './body.js?v=178ec9dc0c70';
import {ArrivalScene,ROSTER,ROSTER_FOOT,routeGate,canPreserve,firstListening} from './chapter1-route.js?v=178ec9dc0c70';
import {MirrorView} from './mirror.js?v=178ec9dc0c70';
import {mirrorVisit,canUnseal104,followsThroughExit} from './encounters.js?v=178ec9dc0c70';
import {bodyState,bodyDescription,captureConsequence,recoverLimb,canHoldLight,lowerLightForPickup,isRecoveryItem,pickupBlocked,stowLight} from './body.js?v=178ec9dc0c70';
import {RandomHunt} from './random-hunt.js?v=178ec9dc0c70';
import {RoomHaunts,rememberHide} from './haunting.js?v=178ec9dc0c70';
import {travelSound} from './audio.js?v=178ec9dc0c70';
import {footContacts} from './gait.js?v=178ec9dc0c70';
import {Inventory,itemIcon,itemDescription} from './inventory.js?v=178ec9dc0c70';
import {ReasoningPanel,comparisonView} from './reasoning.js?v=178ec9dc0c70';
import {inPuddle,witnessesEntry} from './facility.js?v=178ec9dc0c70';
import {sanity,strain,Hallucinations} from './mental.js?v=178ec9dc0c70';
import {Atmosphere} from './atmosphere.js?v=178ec9dc0c70';
import {CHARACTER,EQUIPMENT,equip,CHECKS,checkPreview,resolveCheck,checkText,investigationState} from './investigation.js?v=178ec9dc0c70';
import {Crowd} from './crowd.js?v=178ec9dc0c70';
import {FOLLOW_UP,RESIDENT_QUESTIONS,residentQuestions,residentActions,Residents,residentDialogue,residentExpression} from './residents.js?v=178ec9dc0c70';
import { PuzzlePanel } from './puzzles.js?v=178ec9dc0c70';
import { CaptureAnimation, checkpoints } from './capture.js?v=178ec9dc0c70';
import { STORY, CINEMATICS, ORIGINALS, canSurrender,canSeekOriginal } from "./story.js?v=178ec9dc0c70";
import { Scene, facingDirection } from "./scene.js?v=178ec9dc0c70";
import { MAPS, sight, canMove, worldFor, nearestObject, ECHO_ZONES, findPath } from "./world.js?v=178ec9dc0c70";
import { locomotion, Pursuer, StillnessHaunt, ProgressHaunt } from "./mechanics.js?v=178ec9dc0c70";
import { enterChapterTwo,arrivalBodyLine, relayObjective, relayAction, migrateStorySave } from "./chapter.js?v=178ec9dc0c70";
import { AudioDirector, TRACKS } from "./audio.js?v=178ec9dc0c70";
import {
  initial,
  ITEMS,
  take,
  note,
  restore,
  unlock,
  repair,
  canRepair,
  collectFuse,
  finish,
} from "./state.js?v=178ec9dc0c70";
const $ = (id) => document.getElementById(id),
  canvas = $("world");
let state = initial(),
  started = false,
  dialog = false,
  eventActive = false,
  phone = false,
  phoneApp = null,
  pursuerTrail = null,
  keys = new Set(),
  last = 0,
  nearest = null,
  toastTimer,
  traveling = false,
  stepClock = 0,
  heartClock = 0,
  ghostStepClock = 0,
  lastGhostMotion = null,
  huntDelay = 0,
  huntCooldown = 0,
  forcedCue = null;
const captureAnimation = new CaptureAnimation($("capture-animation"));
const injuryAnimation=new CaptureAnimation($("injury-animation")),randomHunt=new RandomHunt();
let injuryFinished=false;
const mirrorView=new MirrorView($('mirror-view'));
function openMirror(){closeDialog();eventActive=true;keys.clear();mirrorView.open(mirrorVisit(state));$('mirror-modal').hidden=false;$('mirror-close').disabled=true;$('mirror-modal').tabIndex=-1;$('mirror-modal').focus();}
$('mirror-close').onclick=()=>{if($('mirror-close').disabled)return;mirrorView.active=false;$('mirror-modal').hidden=true;eventActive=false;canvas.focus();};
const arrivalScene=new ArrivalScene();
function introduceEnemy(){
 if(!enemy.active)return false;const flag=state.flags.chapter2&&enemy.kind==='hollow'?'met_relay_hollow_'+hollowStage(state):'met_'+enemy.kind;if(state.flags[flag])return false;
 if(enemy.kind==='jeongwoo'){
  const map=worldFor(state),candidates=[];for(const o of map.objects.filter(o=>o.kind==='stairs'||o.to||o.internalDoor))for(const [dx,dy]of [[0,48],[0,-48],[48,0],[-48,0],[0,80],[0,-80]]){const p={x:o.x+dx,y:o.y+dy},d=Math.hypot(p.x-state.x,p.y-state.y);if(d>190&&d<650&&canMove(map,p.x,p.y)&&findPath(map,p,state).length)candidates.push({...p,score:(o.kind==='stairs'?0:o.to?500:1000)+Math.hypot(p.x-enemy.x,p.y-enemy.y)});}
  candidates.sort((a,b)=>a.score-b.score);if(candidates[0]){enemy.x=candidates[0].x;enemy.y=candidates[0].y;enemy.path=[];enemy.repath=0;}
 }
 state.flags[flag]=true;noteManifestation(state,enemy.kind);keys.clear();
 const text=enemy.kind==='listener'?'얼굴이 없어… 귀만 저렇게 커.\n내 발소리가 날 때마다 고개를 든다. 조용히, 소리를 끊어야 해.':enemy.kind==='usher'?'저건 직원이 아니야. 열쇠가 혼자 흔들리고 있어.\n빛을 비추자 이쪽을 봤어. 불을 끄고 모퉁이를 돌아야겠어.':enemy.kind==='jeongwoo'?'문 너머에서… 손바닥으로 바닥을 끄는 소리가 나.\n고개가 저렇게 꺾일 수는 없는데.':enemy.kind==='hollow'&&state.flags.chapter2?['아파트에서 봤던 눈이야… 여기까지 따라온 거야?\n모퉁이를 돌아서 시선을 끊자.','방금… 눈이 하나 더 벌어졌어. 전에는 저렇지 않았는데.','눈마다 다른 곳을 보고 있어. 그 사이에 실 같은 게… 움직여.','눈이 겹쳐서 열리고 있어. 내가 본 걸… 저것도 전부 보고 있는 거야?'][hollowStage(state)]:enemy.kind==='hollow'?'허공에 눈이 떠 있어. 시선이 닿은 자리에서 내 윤곽이 흐려진다.': '등을 보일 때만 발소리가 났어. 고개가 돌아오자… 먼지가 멎었어.\n저 얼굴이 돌아올 때는, 나도 멈춰야 해.';
 say('서하',text,[['소리가 난 쪽을 본다',()=>{closeDialog();eventActive=true;$('threat').hidden=true;$('objective').textContent='소리가 난 곳을 바라본다.';$('status').textContent='숨을 삼켰다.';state.facing=Math.atan2(enemy.y-state.y,enemy.x-state.x);arrivalScene.start(enemy);scene.cinematicFocus=enemy;forcedCue='hunt';sound.effect('scrape',.4);}]]);return true;
}
let deathCheckpoint=null, captureFinished=false;
let lastDoorAction=-Infinity;let lockCinematic=0;
const hallucinations=new Hallucinations();
let checkTimer=null,checkTicker=null,checkEpoch=0;
const puzzlePanel=new PuzzlePanel($("puzzle-modal"),{
 sound:name=>sound.effect(name),wrong:()=>{strain(state,12);sound.effect('checkFailure');scene.impact();},
 close:()=>{$("puzzle-modal").hidden=true;eventActive=false;keys.clear();canvas.focus();}
});
const scene = new Scene(canvas, MAPS.lobby),
  stillness = new StillnessHaunt(),
  progressHaunt = new ProgressHaunt(),
  residents = new Residents(),
  crowd = new Crowd(),
  enemy = new Pursuer(),
  sound = new AudioDirector((message) => toast(message));
function toast(text) {
  clearTimeout(toastTimer);
  $("toast").textContent = text;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3200);
}
function cue() {
  if(!$("death-screen").hidden||!$("injury-screen").hidden)return "hunt";
  if(!$('story-sequence').hidden&&forcedCue)return forcedCue;
  return enemy.active
    ? enemy.mode === "chase" ? "chase" : "hunt"
    : pursuerTrail || stillness.active || progressHaunt.warned ? "hunt" : state.ending
      ? ["witness","surrender","signal","fragment","preserve"].includes(state.ending)
        ? "aftermath"
        : "reliefAlt"
      : forcedCue ||
        {
          lobby: "lobby",
          management: state.flags.locker ? "evidence" : "deduction",
          apartment: state.flags.seen_home_desk ? "warm" : "home",
          basement: state.flags.power ? "motif" : "basement",
          upper: state.flags.listened ? "panic" : "upper",
          relayYard: "missing",
          relayEntry: "missing",
          relayArchive: "deduction",
          relayPlant: "basement",
          relayDrain: "basement",
          serviceHall:"lobby",laundry:"basement",rearCourt:"missing",relayService:"basement",relayWorkshop:"motif",relayStore:"deduction",
          relaySignal: "motif",
        }[state.map];
}
function updateSound() {
  sound.play(cue());
  $("sound").textContent = sound.enabled ? "소리 끄기" : "소리 켜기";
}
function toggleAudio() {
  if (!sound.ctx) {
    sound.start(cue());
    return;
  }
  sound.enabled = !sound.enabled;
  sound.apply();
  updateSound();
}
let typing = false,
  typingTimer,
  dialogReturn = null;
function finishTyping() {
  const was = typing;
  clearTimeout(typingTimer);
  typing = false;
  $("dialog-text").classList.add("revealed");
  return was;
}
function typeText(text) {
  clearTimeout(typingTimer);
  const p = $("dialog-text");
  p.classList.remove("revealed");
  p.setAttribute("aria-label", text);
  p.replaceChildren();
  Array.from(text).forEach((char, i) => {
    const span = document.createElement("span");
    span.className = "glyph";
    span.setAttribute("aria-hidden", "true");
    span.textContent = char;
    span.style.animationDelay = `${i * 17}ms`;
    p.append(span);
  });
  typing = !scene.reduced;
  typingTimer = setTimeout(() => (typing = false), text.length * 17 + 100);
  if (scene.reduced) finishTyping();
}
function closeDialog() {
  clearTimeout(checkTimer);clearInterval(checkTicker);checkEpoch++;$("check-die").hidden=true;
  finishTyping();
  scene.focus = null;
  dialog = false;
  forcedCue = null;
  $("dialog").hidden = true;
  keys.clear();
  (dialogReturn || canvas).focus?.();
  dialogReturn = null;
  updateSound();
  if (pendingEvent) { const next = pendingEvent; pendingEvent = null; next(); }
}
function say(speaker, text, actions = [["계속", closeDialog]]) {
  $("check-die").hidden=true;
  dialogReturn = document.activeElement;
  dialog = true;
  keys.clear();
  $("speaker").textContent = speaker;
  const person=scene.npcs.find(n=>!n.ambient&&n.name===speaker),face=$("npc-portrait");
  $("portrait").hidden = speaker !== "서하";face.hidden=!person;
  if(person){const corruption=npcCorruption(state),expression=corruption||residentExpression(state,person);face.style.backgroundImage=corruption?"url('assets/resident-corruption.png?v=178ec9dc0c70')":"url('assets/resident-portraits.png?v=178ec9dc0c70')";face.dataset.corruption=corruption;face.style.backgroundSize='400% 300%';face.style.backgroundPosition=`${expression*100/3}% ${person.column*50}%`;face.setAttribute('aria-label',person.name+' · '+(corruption?['','비명과 불안','얼굴 번짐','괴수화'][corruption]:['평상','경계','불안','후회'][expression]));face.dataset.expression=expression;face.dataset.person=person.id;}
  typeText(text);
  $("dialog-actions").replaceChildren();
  for (const [label, fn] of actions) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = fn;
    $("dialog-actions").append(b);
  }
  $("dialog").hidden = false;
  $("dialog-actions").querySelector("button")?.focus();
  updateSound();
}
function addNote(id, text) {
  note(state, id, text);
}
const acquiredPanel=document.createElement('aside');acquiredPanel.id='item-acquisition';acquiredPanel.hidden=true;acquiredPanel.setAttribute('aria-live','polite');document.body.append(acquiredPanel);
let observedState=null,observedItems=new Set(),acquisitionQueue=[],acquisitionUntil=0;
function observeAcquisitions(t){
 const ids=()=>[...state.bag,...(state.investigation?.gear||[])];
 if(observedState!==state){observedState=state;observedItems=new Set(ids());acquisitionQueue=[];acquiredPanel.hidden=true;acquisitionUntil=0;}
 claimMementoRewards(state);
 for(const id of ids())if(!observedItems.has(id)){observedItems.add(id);acquisitionQueue.push(id);}
 // Removed items may be found again, but loading never re-announces the saved bag.
 for(const id of observedItems)if(!ids().includes(id))observedItems.delete(id);
 if(t<acquisitionUntil)return;
 const id=acquisitionQueue.shift();if(!id){acquiredPanel.hidden=true;return;}
 acquiredPanel.dataset.item=id;acquiredPanel.replaceChildren(itemIcon(id));const text=document.createElement('div'),heading=document.createElement('strong'),description=document.createElement('p');heading.textContent=(ITEMS[id]||EQUIPMENT[id]?.name||id)+' 획득';description.textContent=MEMENTO_MONOLOGUES[id]||EQUIPMENT[id]?.description||itemDescription(id);text.append(heading,description);acquiredPanel.append(text);acquiredPanel.hidden=false;acquisitionUntil=t+3400;
}
function mementoText(memory){
 const monologue=MEMENTO_MONOLOGUES[Object.keys(MEMENTOS).find(id=>MEMENTOS[id]===memory)]||memory.text;const rewards=claimMementoRewards(state);if(!rewards.length)return monologue;
 const first=discoverThread(state);return monologue+'\n\n흩어진 종이를 함께 묶자, 엉켜 있던 실 한 타래가 손에 남았다.\n'+(first||'이 느낌… 잃은 자리를 붙잡아 주던 실과 같아.');
}
function pickup(key) {
  if(pickupBlocked(state)){toast('남은 손이 비지 않는다. F로 손전등을 내려놓아야 해.');return false;}
  if (!state.bag.includes(key)) {
    take(state, key);
    sound.effect("item");
    scene.burst(nearest?.x||state.x,nearest?.y||state.y,"spark");
    toast(`${ITEMS[key]} 획득 · 기록 앱에서 단서 확인`);
  }
  return true;
}
function canHunt(mapId=state.map){
 if(state.flags.relayTrapActive||thresholdHorror.active)return false;
 if(state.ending||state.bag.includes('relayExport'))return false;
 return state.flags.chapter2?state.flags.relayPower&&['relayArchive','relayPlant','relaySignal'].includes(mapId):state.flags.power&&['basement','upper'].includes(mapId);
}
function openRelayAction(o,choice=null){
 if(pickupBlocked(state)&&['incoming','register','compare','lastVoice','wheel','export'].includes(o.chapterAction)){say('서하','남은 손으로 수화기나 매체를 집을 수 없어. F로 손전등부터 내려놓자.');return;}
 prepareExploration(state);
 if(o.chapterAction==='lastVoice'&&state.flags.relayPower&&!state.flags.relayLastVoice&&!state.flags.deckCouplerInstalled){
  state.flags.deckCouplerNeeded=true;
  say('서하','데크는 켜졌는데 회선 접점이 부식됐어. 잡음이 아니라 단자 문제야.\n도현 씨가 말했던 같은 모델의 밀봉 어댑터… 설비층 서쪽 정비동에서 찾아야 해.',[...(state.bag.includes('deckCoupler')?[['같은 모델의 회선 어댑터로 교체한다',()=>{state.bag=state.bag.filter(k=>k!=='deckCoupler');state.flags.deckCouplerInstalled=true;sound.effect('drawer');closeDialog();openRelayAction(o,choice);}]]:[]),['데크에서 손을 뗀다',closeDialog]]);return;
 }

 const r=relayAction(state,o,choice);if(!r)return;
 if(r.trap&&!state.flags.relayTrapSeen)state.flags.relayTrapPending=true;
 if(r.sound)sound.effect(r.sound);
 if(r.haunt)scene.haunt(r.haunt);
 if(r.hunt)huntDelay=r.hunt;
 if(r.exported){enemy.reset();pursuerTrail=null;huntDelay=0;stillness.reset();}
 if(r.cinematic){playCinematic(r.cinematic);return;}
 if(r.puzzle){closeDialog();eventActive=true;keys.clear();puzzlePanel.open(state,r.puzzle,()=>openRelayAction(o));return;}
 let actions=r.choices?[...r.choices.map(([label,key])=>[label,()=>openRelayAction(o,key)]),['돌아가기',closeDialog]]:undefined;
 if(r.mistake)strain(state,10);
 if(o.chapterAction==='register'){const n=scene.npcs.find(n=>n.id==='haerin');actions=[[state.flags.relayMap?'받아 둔 시설 배치도를 다시 본다':'데스크의 시설 배치도를 조사한다',()=>{if(!acquireRelayMap(state)){say('서하','이미 받은 배치도야. 휴대폰에 찍어 뒀어. 우측 상단 지도에서도 길과 기억해 둔 은신처를 확인할 수 있어.');return;}addNote('relay-map','안내 데스크에서 시설 전체 배치도를 받았다. 접수동 북쪽은 기록동, 당직실 안 계단 아래는 설비동, 설비동 동쪽 계단 위는 송출층이다.');sound.effect('paper');toast('시설 배치도를 챙겼다 · 우측 상단 지도');say('서하','접수동, 기록동, 지하 설비동, 송출층. 건물 연결이 이렇게 되는구나. 접수동의 당직실 안에 지하 계단이 표시돼 있다.');}],['계속',closeDialog]];if(n)actions.push(['카운터 뒤 해린에게 묻는다',()=>talkResident(n)]);}

 say(r.title,r.text,actions);
}
function talkResident(o){
 const b=bodyState(state),loss=b.leg?'leg':b.arm?'arm':null,lossKey='noticedPlayer_'+o.id+'_'+loss;
 if(loss&&!state.flags[lossKey]){state.flags[lossKey]=true;const concern=loss==='leg'?({haerin:'잠깐… 다리가…! 여기까지 기어오신 거예요? 움직이지 마세요. 어디 잡을 곳이 필요하세요?',mijeong:'서하야, 다리가 왜…! 잠깐만, 내 손 잡아. 여기까지 어떻게 온 거야?',dohyun:'바닥을 짚지 마세요. 젖은 선이 있습니다. 다리가… 도움이 필요하십니까? 우선 마른 쪽으로 오세요.'})[o.id]:({haerin:'소매가 비었어요… 다치신 거예요? 남은 손까지 떨리는데 제가 봉투를 받아 드릴까요?',mijeong:'팔이… 언제 이렇게 된 거야. 혼자 버티지 말고 말해. 잠깐 기대도 돼.',dohyun:'팔을 다치셨군요. 장비는 제가 맡겠습니다. 힘줘서 스위치를 누르지 마세요.'})[o.id];say(o.name,concern,[['잠깐 부축해 주세요',()=>say('서하','잠깐만 기대도 될까요… 여기가 아직 아파요.',[["기록 이야기를 이어 간다",()=>talkResident(o)]])],['아직 움직일 수 있어요. 가져온 기록을 봐 주세요',()=>talkResident(o)]]);return;}
 const shock=noticeNpc(state,o);if(shock){state.running=false;state.facing=Math.atan2(o.y-state.y,o.x-state.x);say('서하',shock,[['대답을 기다린다',()=>talkResident(o)]]);scene.focus=o;return;}
 const dx=state.x-o.x,dy=state.y-o.y;o.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?2:1):(dy<0?3:0);
 const text=residentDialogue(state,o);state.flags['talked_'+o.id]=true;
 addNote('person_'+o.id+'_'+o.phase,o.name+' · '+text);
 const options=residentActions(state,o.id),comparison=comparisonView(state,o.id);
 const help=[];
 if(state.flags['npcInjured_'+o.id]){
  if(state.bag.some(isRecoveryItem))help.push(['매듭실을 감아 잃은 윤곽을 되찾아 준다',()=>{if(assistResident(state,o.id,'thread',isRecoveryItem)){o.injury=null;sound.effect('item');say('서하','실이 빈 자리로 감겼다. 사라졌던 윤곽이 조금씩 돌아온다.\n손 잡아요. 이번에는 두고 가지 않을게요.');}}]);
  if(!state.flags['npcRescued_'+o.id])help.push(['다친 몸을 부축해 함께 나가겠다고 약속한다',()=>{if(assistResident(state,o.id,'escort',isRecoveryItem)){sound.effect('clothHide');say('서하','내 어깨에 기대요. 없는 자리를 억지로 딛지 말아요.\n문을 확인하고 같이 나갈게요.');}}]);
 }
 const questions=residentQuestions(state,o.id).map(({label,line,index:i})=>[label,()=>{state.flags['question_'+o.id+'_'+i]=true;addNote('question_'+o.id+'_'+i,o.name+' · '+line);const [reply,answer]=FOLLOW_UP[o.id][i];const back=[['다른 이야기를 묻는다',()=>talkResident(o)],['대화를 마친다',closeDialog]];
 say('서하',label,[['말을 듣는다',()=>say(o.name,line,[[reply,()=>say('서하',reply,[['답변을 듣는다',()=>say(o.name,answer,back)]])],...back])]]);}]);
 say(o.name,text,[...help,...questions,...(options.power?[["원본 데크의 전원 복구를 부탁한다",()=>{if(!state.bag.includes('relayCopy')){say('도현','먼저 기록동 원본 색인에서 누락된 파일 번호를 찾아 주세요. 어떤 데크를 살려야 하는지 확인되면 제가 설비를 맡겠습니다.');return;}for(const key of ['relayLogic','relayPipes','relayCooling','relayIsolated','relayPower','relayTechnicianRestored'])state.flags[key]=true;state.bag=state.bag.filter(k=>k!=='relayWheel');sound.effect('flashlightOn');say('도현','냉각과 절체는 제가 맡겠습니다. 점검표에 원본 데크 회선 어댑터의 접점 부식이 남아 있어요. 전원을 올리는 것만으로는 재생이 안 됩니다. 설비층 서쪽 정비동 작업대에서 보관실 비품 열쇠를 챙겨 같은 모델의 밀봉 어댑터를 가져오세요. 그걸 송출층 원본 데크에 연결한 뒤 두 신호를 맞추면 됩니다.');}]]:[]),...(options.check?[[CHECKS[o.id].label+(state.investigation?.rolls[o.id]?'':' · 판정'),()=>say('서하',({haerin:'취소 뒤에 다시 온 전화가 빠져 있어요. 해린 씨가 숨긴 건가요?',mijeong:'열쇠가 돌아갔는데 문은 안 열렸어요. 빗장이 따로 있었던 거죠?',dohyun:'냉각 확인 뒤에 기존 입력을 분리하고 비상 회선을 투입하는 거죠?'})[o.id],[['답변을 듣는다',()=>openCheck(o.id,o.name)]])]]:[]),...(comparison.sourceReady&&comparison.evidenceReady?[['말과 기록을 나란히 본다',()=>openReasoning(o.id)]]:[]),...(options.request?[['잘린 통화를 찾기 위해 수정 전 목록을 요청한다 · 설득',()=>say('서하','제가 가져온 녹음에는 잘린 구간이 있어요. 인계 목록에서 빠진 파일이 원본에는 남았는지 확인하고 싶어요. 수정 전 목록의 사본을 주세요.',[['사본 제공을 설득한다',()=>openCheck('request','해린')],['말을 거둔다',closeDialog]])]]:[]),['대화를 마친다',closeDialog]]);
}
function openCheck(key,speaker='서하'){
 if(pickupBlocked(state)&&['theft','request','lostbox'].includes(key)){say('서하','손을 비워야 꺼낼 수 있어. F로 손전등을 내려놓자.');return;}
 if(key==='request'&&!state.flags.relayCompared&&!state.flags.relayErasure&&!state.bag.includes('relayCopy')&&!state.bag.includes('auditMemo')){say('해린','어떤 기록이 빠졌다는 건지 먼저 확인해 주세요. 기록동의 접수와 취소 녹음, 잠금 회신에는 각각 원본 파일 번호가 있어요. 제 인계 목록과 번호가 다르면… 수정 전 사본을 내드릴지 이야기하죠.');return;}
 const c=checkPreview(state,key);if(!c)return;const recorded=state.investigation?.rolls[key];if(recorded?.success){say(speaker,recorded.success?c.success:c.failure);return;}closeDialog();eventActive=true;keys.clear();
 const panel=$('roll-panel');panel.hidden=false;
 const title=$('roll-title'),die=$('roll-face'),score=$('roll-score'),result=$('roll-result'),button=$('roll-button');
 title.textContent=c.label;die.textContent='◇';score.textContent=`1d6 + ${c.skill} ${c.stat} + 증거 ${c.bonus} + 장비 ${c.gear} / 난도 ${c.dc}`;
 result.textContent=c.equipment;button.disabled=false;button.textContent=recorded?'다시 시도한다 · 실패 시 정신력 −12':'주사위 굴리기';
 const finish=r=>{die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][r.die-1];score.textContent=`${r.die} + ${c.stat} + ${r.bonus} + ${r.gear??r.spent*2} = ${r.total} / 난도 ${c.dc}`;result.textContent=r.success?'성공':'실패';panel.dataset.result=r.success?'success':'failure';button.disabled=false;button.textContent='조사로 돌아가기';button.onclick=()=>{panel.hidden=true;eventActive=false;canvas.focus();say(speaker,r.success?c.success:c.failure);};button.focus();};
  panel.dataset.result='pending';button.onclick=()=>{panel.dataset.result='rolling';button.disabled=true;const r=resolveCheck(state,key);if(!r)return;if(!r.success)strain(state,12);sound.effect('dice');state.notes=state.notes.filter(n=>n.id!=='check_'+key);addNote('check_'+key,checkText(state,key,r));let f=0;
 const timer=setInterval(()=>{die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][f++%6];},65);
 setTimeout(()=>{clearInterval(timer);sound.effect(r.success?'checkSuccess':'checkFailure',.6);finish(r);},scene.reduced?0:900);};button.focus();
}
function startChapterTwo(){
 if(!enterChapterTwo(state))return;
 closeDialog();enemy.reset();pursuerTrail=null;huntDelay=0;huntCooldown=45;stillness.reset();
 scene.begin(state,worldFor(state));revealRoom('제2장 · 외부 진입 마당');
 say('서하',arrivalBodyLine(state)+'\n\n정우가 문을 잠갔어. 나는 화면에 열린 걸 보고 취소했을 뿐이야… 그랬을 거야.\n하지만 아파트 녹음은 중간이 잘려 있었다. 여기 남은 원본을 들으면, 내가 취소한 뒤 무슨 일이 있었는지 확인할 수 있어.\n잘린 통화의 원본부터 찾자. 설비는 도현 씨에게 부탁할 수 있어. 내가 확인해야 할 건 그날 내 목소리야.');
}
const inventory=new Inventory({sound:name=>sound.effect(name),sanity,recover:useThread});
const reasoning=new ReasoningPanel($('reasoning-panel'),{sound:name=>sound.effect(name),wrong:()=>strain(state,10),close:()=>{eventActive=false;$('reasoning-panel').hidden=true;keys.clear();canvas.focus();}});
function openReasoning(id=null){closeDialog();if(phone)closePhone();eventActive=true;keys.clear();reasoning.open(state,id);}
let sanityNoticeTimer;
window.addEventListener('sanity-loss',e=>{const n=$('sanity-loss'),d=e.detail;n.textContent=`정신력 −${d.amount} · ${d.before} → ${d.after}`;n.hidden=false;clearTimeout(sanityNoticeTimer);sanityNoticeTimer=setTimeout(()=>n.hidden=true,3000);});
const thresholdHorror=new ThresholdHorror();
const atmosphere=new Atmosphere(()=>sound),roomHaunts=new RoomHaunts();
function objective() {
  prepareExploration(state);const exploring=explorationObjective(state);if(exploring&&!enemy.active)return exploring;
  if(state.flags.chapter2&&!state.hidden&&!enemy.active)return relayObjective(state);
  if (state.ending) return "기억의 끝";
  if (state.hidden) return "숨을 죽인다 · E로 나오기";
  if(enemy.active&&enemy.kind==='redlight')return enemy.punish?'내 움직임을 봤다. 시야 밖으로 벗어나야 해.':enemy.signal==='watch'?'멈춰. 아직 이쪽을 보고 있어.':'고개를 돌렸을 때만 움직이자.';
  if(enemy.active&&isRelayGhost(enemy.kind))return enemy.kind==='listener'?'발소리를 멈추고 시선을 끊을 곳을 찾아야 한다.':'불을 끄고 모퉁이를 돌아야 한다.';
  if(enemy.active&&enemy.kind==='hollow')return '모퉁이를 돌아 시선을 끊고 숨을 곳을 찾아야 한다.';
  if (enemy.active)
    return enemy.mode === "chase"
      ? (bodyState(state).leg?"들켰다. 장애물을 돌아 숨을 곳을 찾아야 한다.":"그가 들었다. Shift로 달리고, 청소함에 숨어라.")
      : "손전등을 끄고 발소리가 멀어지기를 기다려라.";
  if (!state.bag.includes("flashlight")) return "현관 접수대 · 손전등을 먼저 챙긴다";
  if (pursuerTrail) return "층을 넘어 발소리가 따라온다. 움직여서 거리를 벌리거나 몸을 숨겨라.";
  if (!state.bag.includes("key"))
    return "1층 101호 · 신발장 서랍의 열쇠로 관리실 서랍을 연다";
  if (!state.flags.desk)
    return "1층 관리실 · 잠긴 서랍에서 보관함 단서를 찾는다";
  if (!state.flags.power && !state.bag.includes("fuse"))
    return "동쪽 계단 ↓ B1 · 공용 창고에서 예비 퓨즈를 찾는다";
  if (!state.flags.power) return "B1 전기실 · 열린 회로함의 빈 퓨즈 홀더를 채운다";
  if (!state.flags.locker) return "1층 관리실 · 날짜와 월 단서로 보관함을 연다";
  if (!state.flags.listened)
    return "동쪽 계단 ↑ 2층 방송실 · 테이프를 재생한다";
  if(state.flags.listened&&!state.bag.includes("receipt"))return "1층 관리실 전자 보관함 · 원본 접수증을 확인한다";
  if(!state.flags.shutterOpen)return "2층 방송 조정실 · 오른쪽 비상 제어반으로 현관 셔터를 연다";
  return "1층 현관으로 돌아가 기록의 운명을 결정한다";
}
function transition(to, spawn, portal = null) {
  if (traveling) return;
  traveling = true;
  stillness.reset();
  keys.clear();
  const from=state.map,followingKind=enemy.active?enemy.kind:pursuerTrail?.kind,leftWatcher=followingKind==='redlight'&&!followsThroughExit(followingKind,portal),following=!portal?.stopPursuit&&(enemy.active||!!pursuerTrail)&&followsThroughExit(followingKind,portal);
  if(leftWatcher)randomHunt.spare(75);
  const arrival=MAPS[to].objects.find(o=>o.to===from);
  pursuerTrail=following?{kind:followingKind,map:to,remaining:5.5,entry:{x:arrival?.x??spawn[0]*32,y:arrival?.y??spawn[1]*32,targetX:spawn[0]*32,targetY:spawn[1]*32}}:null;
  enemy.reset();
  huntDelay = 0;
  state.hidden = false;
  const arrivalSound=travelSound(portal);
  if(arrivalSound)sound.effect(arrivalSound);
  $("travel").textContent = MAPS[to].name;
  $("travel").hidden = false;
  setTimeout(() => {
    state.map = to;
    [state.x, state.y] = spawn.map((n) => n * 32);
    scene.begin(state, worldFor(state));
    if (!pursuerTrail && canHunt(to)) {
      huntDelay = state.flags.chapter2 ? 70 : to === "upper" ? 55 : 45;
      if(!leftWatcher)toast("계단 아래에서 발소리가 따라온다. 숨을 곳을 먼저 확인하자.");
    }
    if(leftWatcher)toast('계단을 내려서자 웃음이 끊겼다.');
    if(pursuerTrail)toast(followingKind==='redlight'?'문 너머에서 다시 웃음이 들린다.':'문 너머에서도 긁는 소리가 이어진다. 계단만으로는 따돌릴 수 없다.');
    if(portal?.storyDescent){state.flags.storyDrainEntered=true;say('미정','이쪽이야. 위쪽 통로는 버텨 주지 않을 거야. 아래 점검로로 돌아가자. 원본은 아직 송출층에 있어.');}
    if(portal?.storyEscape){state.flags.storyDrainEscaped=true;randomHunt.spare(100);say('서하',state.flags.storyHelpWitness?'미정 씨 손을 놓지 않고 계단을 올랐다. 문을 닫으니 아래의 발소리가 끊겼다.\n도현 씨가 있는 설비층이야. 원본 데크의 전원을 부탁하자.':'수문이 닫히며 물소리가 멀어졌다. 봉투는 젖지 않았어.\n여기가 설비층… 도현 씨에게 원본 데크를 살려 달라고 해야 해.');}
    updateSound();
  }, 250);
  setTimeout(() => {
    traveling = false;
    $("travel").hidden = true;
  }, 850);
}
function hide() {
  const spot=nearest;
  if (state.hidden) {
    if(state.hideSpot?.witnessed&&state.hideSpot.opening>0){handleCapture(enemy.kind);return;}
    state.hidden = false;state.hideSpot=null;
    toast("조심스럽게 밖으로 나왔다.");
  } else {
    if(state.flags.chapter2&&!spot?.hide)return;
    state.hideSpot=state.flags.chapter2?{id:spot.id,x:spot.x,y:spot.y,kind:spot.hideKind,witnessed:witnessesEntry(worldFor(state),enemy,state),opening:0}:null;
    rememberHide(worldFor(state),state,spot);
    state.hidden = true;
    state.flashlight = false;
    keys.clear();
    sound.effect(state.flags.chapter2?(spot.hideKind==='vent'?'ventCover':'clothHide'):'wardrobe');
    toast(state.flags.chapter2?(spot.hideKind==='vent'?'환풍구 덮개를 당겨 닫았다.':'책상 아래 가림판 뒤로 몸을 낮췄다.'):'손전등을 끄고 숨었다 · E로 나오기');
  }
  updateSound();
}
function open104(o){
 if(enemy.active){toast('지금은 열쇠를 맞출 틈이 없다.');return;}
 if(state.flags.hidden104Open){transition('unit104',[15,22],o);return;}
 if(!canUnseal104(state)){say('서하','이 문… 자료실로 쓰던 곳이었지.\n열쇠를 반납하는 걸 본 것 같은데… 누구에게 줬더라.');return;}
 say('서하','103호 열쇠함의104호 표찰. 이 열쇠가 맞아. 철거 확인띠 아래의 자물쇠에 넣는다.',[['104호 열쇠로 문을 연다',()=>{state.flags.hidden104Open=true;state.flags['seen_'+o.id]=true;closeDialog();transition('unit104',[15,22],o);}],['열쇠를 거둔다',closeDialog]]);
}
function hiddenClue(o){
 if(o.hiddenClue==='thread'){
  if(state.flags.hiddenThreadTaken){say('수선 일지','서윤이 낡은 사진 보관 주머니를 꿰매던 실.\n「사진 밖으로 밀려나면, 남은 윤곽에 매듭을 묶어.」 마지막 줄은 나를 향한 것처럼 읽힌다.');return;}
  state.flags.hiddenThreadTaken=true;pickup('knotThread');pickup('knotThreadSecond');addNote('knot-thread','104호의 수선용 매듭실. 잃은 윤곽을 붙잡는다. 소지품에서 잃은 부위를 골라 사용할 수 있다.');say('서하',discoverThread(state)||'사진 주머니를 꿰매던 실이야. 내 그림자 쪽으로 저절로 감긴다.');
 }
}
function routeInteract(o){
 const action=o.routeAction;
 if(enemy.active&&enemy.mode==='chase'&&!action.startsWith('entry')){toast('지금은 살필 틈이 없다.');return;}
 if(action==='roster'){if(state.bag.includes('rosterScrap')){state.flags.rosterRestored=true;addNote('night-roster',ROSTER_FOOT);}showRoster();return;}
 if(action.startsWith('entry')){if(!state.bag.includes('serviceKey')&&!state.flags['entered_'+action.slice(5)]){say('서하','잠겼네… 공용 열쇠가 있었지.\n마지막으로 누가 가지고 있었더라…');return;}state.flags['entered_'+action.slice(5)]=true;state.flags['seen_'+o.id]=true;closeDialog();transition('unit'+action.slice(5),[19,22],o);return;}
 if(action==='lighter'){if(!state.bag.includes('lighter'))pickup('lighter');say('서하','서윤이 방수 봉투의 밀랍을 떼던 라이터.\n종이는 태우지 않고, 밀랍만 살짝 데웠었지.');return;}
 if(action==='rosterPiece'){if(!state.bag.includes('rosterScrap'))pickup('rosterScrap');say('미정의 인계 봉투','「서하: 전화 접수. 미정: 동문 순찰 및 예비 열쇠 인계. 정우: 지하 순찰 및 비상 대응.」\n관리실 야간 근무표와 같은 격자와 찢긴 가장자리. 게시판의 빈 모서리에 맞을 것 같다.');return;}
 if(action==='keybox'){if(!routeGate(state,action)){say('서하','작은 열쇠 구멍… 이 비품함도 잠가 뒀구나.\n예전에 공용 열쇠로 열었던 것 같은데…');return;}if(!state.bag.includes('unit104Key'))pickup('unit104Key');say('104호 열쇠 표찰','「임시 문서실104호. 11월3일 사용 후 관리인에게 반납.」\n함께 접힌 문서실 인수표: 이용자 서윤(주간 서무 보조), 용도 점검 사진·입주민 민원 자료 정리.\n서윤이 서류를 정리하던 방이야. 관리실 열쇠와 달리 이 열쇠는 퇴근할 때 반납했구나. 자료가 남아 있다면, 왜 거기에 있는지도 알 수 있어.');return;}
 if(action==='wax'){if(state.flags.hiddenWaxOpen){say(o.name,'떼어 낸 밀랍과 서명이 이어지는 봉투. 보관함 열쇠는 이미 챙겼다.');return;}if(!routeGate(state,action)){say(o.name,o.description+'\n굳은 밀랍을 잡아당기면 봉투와 서명도 찢어질 것 같다.');return;}
 say('서하','내가 아는 서윤의 봉인 방식이야. 밀랍만 데워 들어 올리면 서명과 종이는 남길 수 있어.',[['라이터로 밀랍만 데운다',()=>{closeDialog();sound.effect('lighter');scene.waxHeat={x:o.x,y:o.y,until:performance.now()+1500};state.flags.hiddenWaxOpen=true;pickup('archiveKey');addNote('wax-packet','서윤이 서명해 봉한 열쇠 봉투. 밀랍만 데워 봉투와 서명을 보존했다.');say('서하','서명은 이어져 있어. 봉투 속의 작은 열쇠… 저 금속 보관함의 열쇠겠지.');}],['손을 뗀다',closeDialog]]);return;}
 if(action==='cabinet'){if(!routeGate(state,action)){say(o.name,'보관함 표찰에 「점검 사진 원본」이라고 적혀 있다. 손잡이 아래 작은 열쇠 구멍. 옆 밀랍 봉투에 「사진함 열쇠」라고 적혀 있다.');return;}
 if(!state.bag.includes('inspectionPhotos')){state.flags.hiddenBoxOpen=true;pickup('inspectionPhotos');addNote('104-photos','11월3일18:20 서윤 촬영.임시 문서실 인수표의 날짜와 필름 번호가 일치한다. 피난 방향의 수동 해제 장치를 막은 불법 추가 빗장이 보인다. 사진은 화재 전 상태이며23:47 실제 조작자를 증명하지 않는다.');}
 say('서하','촬영 일지와 필름 번호가 맞아. 불이 나기 전날, 서윤이 직접 찍고 정리한 사진이야.\n이건 불법 개조의 흔적이지, 그날 밤 누가 손잡이를 잡았는지까지 말해 주지는 않아.\n내 접수증과 녹음도 함께 가지고 나가자.');return;}
}
function showRoster(){
 eventActive=true;keys.clear();const modal=$('roster-modal');modal.hidden=false;modal.classList.toggle('restored',!!state.flags.rosterRestored);$('roster-rows').replaceChildren();
 for(const row of ROSTER){const tr=document.createElement('tr');for(const text of row){const td=document.createElement('td');td.textContent=text;tr.append(td);}$('roster-rows').append(tr);}
 $('roster-fragment').textContent=state.flags.rosterRestored?ROSTER_FOOT:'';$('roster-take').hidden=!state.flags.rosterRestored||state.bag.includes('restoredRoster');$('roster-close').focus();sound.effect('paper');
}
$('roster-take').onclick=()=>{if(!state.flags.rosterRestored)return;if(!pickup('restoredRoster'))return;state.bag=state.bag.filter(k=>k!=='rosterScrap');state.flags.rosterTaken=true;$('roster-modal').hidden=true;eventActive=false;canvas.focus();};
$('roster-close').onclick=()=>{$('roster-modal').hidden=true;eventActive=false;canvas.focus();};
function useThread(item,part){
 if(!recoverLimb(state,part,item))return;closePhone();sound.effect('paper');scene.impact();say('서하',part==='leg'?'발끝이 바닥에 닿았다. 실을 당기자 차갑던 자리에 감각이 돌아온다.\n이번에는… 놓치지 말자.':'빈 소매 안으로 손가락의 감각이 돌아온다. 매듭실은 손안에서 가루가 됐다.\n빛을 다시 잡을 수 있어.');
}
function interact() {
  if (eventActive || dialog || phone || !started || traveling) return;
  if (state.hidden) {
    hide();
    return;
  }
  if (!nearest) return;
  const o = nearest,
    id = o.id;
  if(['entry-intercom','relay-duty-intercom'].includes(o.id)&&callFor(state,o.id)){answerPhone(o);return;}
  const handling=o.memento||o.recoveryItem||o.routeAction&&!o.routeAction.startsWith('entry')&&o.routeAction!=='roster'||o.recordRoute||o.partialExport||o.pumpLog||o.lostbox||o.fixture==='fuse-source'||o.exploreAction&&o.exploreAction!=='laundryDrain'||o.storySupply||o.hiddenClue||['lighter','rosterPiece','keybox','wax'].includes(o.routeAction)||o.collectible||['locker','flashlight','fuse','archive','shoe','desk','archive-original'].includes(o.id);if(handling&&pickupBlocked(state)){say('서하','남은 손에 손전등을 쥐고 있어. F로 내려놓고 집어야 해.');return;}
  if(o.exploreSealed){say('서하',o.exploreSealed);return;}
  if(o.exploreAction){const r=explorationAction(state,o);if(r){if(r.item)pickup(r.item);if(r.sound)sound.effect(r.sound);if(r.item==='courtSlip')addNote('courtSlip',r.line);say('서하',r.item&&isRecoveryItem(r.item)?discoverThread(state)||r.line:r.line);}return;}
  if(o.storySupply){
   const repair=()=>{if(replaceWetLight(state)){sound.effect('flashlightOn');say('서하','밀봉을 뜯어 작업등을 켰다. 젖은 손전등 대신 이걸 쓰자.');}};
   if(!state.flags.storySupplyTaken){state.flags.storySupplyTaken=true;pickup('spareLight');}
   say('서하',state.flags.flashlightBroken?'밀봉된 작업등은 젖지 않았어. 이걸로 바꿀 수 있어.':'절연 장갑 옆에 포장된 작업등이 있어. 하나 챙겨 두자.',[...(state.flags.flashlightBroken&&state.bag.includes('spareLight')?[['젖은 손전등을 예비 작업등으로 교체한다',repair]]:[]),['안전함을 닫는다',closeDialog]]);return;
  }
  if(o.storyFloorHatch){if(state.flags.storyArchiveAlarm&&state.flags.storyProtectRecord&&!state.flags.storyDrainEscaped){startStoryShot('floorFall');return;}say('서하',o.description+(state.flags.storyHelpWitness?'\n미정 씨가 이쪽 대신 옆 점검 계단으로 오라고 했어.':''));return;}
  if(o.storyAction){const r=storyAction(state,o.storyAction);if(r){if(r.sound)sound.effect(r.sound);if(r.pursuit)startStoryShot('drainPursuit');else say('서하',r.line);}return;}
  if(o.routeAction){routeInteract(o);return;}
  if(o.hidden104){open104(o);return;}
  if(o.hiddenClue){hiddenClue(o);return;}
  if(o.memento&&!o.lostbox&&!state.bag.includes(o.memento)){const memory=MEMENTOS[o.memento];say(o.name,o.description||'가구 틈에 오래된 종이가 끼어 있다.',[['작은 보관물을 따로 살펴본다',()=>{if(collectMemento(state,o.memento)){if(o.memento==='memoryScript'&&!state.flags.relayTrapSeen)state.flags.relayTrapPending=true;sound.effect('paper');say('서하',mementoText(memory));}}],['그대로 둔다',closeDialog]]);return;}
  if(o.recordRoute){if(!state.bag.includes('relayCopy')){say('서하','어떤 통화가 빠졌는지 먼저 파일 번호를 확인해야 해.');return;}if(state.bag.includes('relayExport')){say('서하','이미 챙긴 증거 매체의 봉인은 여기서 바꾸지 않겠어.');return;}say('서하',o.description,[['이 방식으로 기록을 챙긴다',()=>{if(!chooseRecordRoute(state,o.recordRoute)){say('서하','전체 원본으로 봉인한 기록을 다시 골라 빼고 싶지는 않아.');return;}addNote('route-'+o.recordRoute,o.description);sound.effect('paper');say('서하',o.recordRoute==='A'?'내 목소리도 빼지 않을 거야. 원본을 끝까지 듣고 이 봉투에 같이 넣자.':'정우가 잠금을 유지했다는 부분만 있으면… 내가 직접 잠근 건 아니라는 걸 보일 수 있어. 관리카드로 편집실부터 가자.');}],['봉투에서 손을 뗀다',closeDialog]]);return;}
  if(o.partialExport){if(!state.flags.routeB){say('서하','부분 사본 편집용 관리카드가 없다.');return;}say('서하','이 단말은 정우의 조작 이력만 복사한다. 빠진 통화 원본은 확인하지 않은 채 나가게 돼.',[['잠금 이력 사본만 챙긴다',()=>{state.flags.relayRedacted=true;state.flags.relayExported=true;pickup('relayExport');enemy.reset();pursuerTrail=null;huntDelay=0;say('서하','정우의 기록만 들어 있는 사본. 원본을 더 확인할 수도 있었지만… 지금은 이걸로 나가겠어.');}],['아직 복사하지 않는다',closeDialog]]);return;}
  if(o.trapRelease){if(!state.flags.relayTrapActive){say(o.name,'기계식 잠금 해제 손잡이. 정상 위치에 놓여 있다.');return;}if(!releaseLock(state)){say('서하','손잡이가 버티고 있어. 밖에서 누르는 힘이… 두드리는 소리가 멎으면 다시 당겨 보자.');return;}sound.effect('door');scene.cinematicFocus=null;say('서하','손잡이가 돌아갔어. 나가자… 문 밖의 소리가 또 가까워지기 전에.');scene.focus=MAPS[state.map].objects.find(o=>o.id==='relay-quiet-inner-door');return;}
  if(o.internalDoor){
    if(o.storyGate){say('서하','안쪽 레버에 물린 수문이야. 동쪽 조작실에서 움직여야 해.');return;}
    if(o.storyKey&&!state.bag.includes(o.storyKey)&&!state.flags.relayIncoming){say('서하','대조실 비품 열쇠… 접수 원본 인수 봉투에 같이 보관했었지. 서쪽 원본부터 확인하자.');return;}
    if(state.flags.relayTrapActive&&TRAP_DOORS.includes(o.id)){say('서하','잠겼어. 밖에서 누가 잡고 있는 것 같아. 방 안에 비상 해제 손잡이가 있어야 하는데…');return;}
    if(performance.now()-lastDoorAction<650)return;
    const open=state.flags['open_'+id]??!!o.defaultOpen;
    if(open&&Math.abs(state.x-o.x)<o.w+7&&Math.abs(state.y-o.y)<o.h+5){toast('문에서 한 걸음 비킨 뒤 닫아야 한다.');return;}
    lastDoorAction=performance.now();state.flags['open_'+id]=!open;
    if(open&&enemy.active)enemy.repath=0;
    sound.effect(o.doorType==='fire'?(open?'fireDoorClose':'fireDoor'):(open?'doorClose':'door'));toast(o.name+(open?'을 닫았다.':'을 열었다.'));return;
  }
  if (o.to) {
    const locked=explorationGate(state,o);if(locked){sound.effect('puzzleTurn',.3);say('서하',locked);return;}
    if(storyExitBlocked(state,o)){say('서하','천장 부재가 내려앉았어. 위에서 계속 물이 새고 있어… 이 문으로 밀고 들어가면 안 돼. 동쪽 점검 통로를 봐야 해.');return;}
    if(o.requires==='relayShortcut'&&state.flags.routeB&&state.bag.includes('editPass')&&!state.flags.relayShortcut){state.flags.relayShortcut=true;sound.effect('drawer');toast('편집 관리카드로 연결문 잠금을 해제했다.');}
    if(o.requires&&!state.bag.includes(o.requires)&&!state.flags[o.requires]){
      say(o.name,({relayBadge:'기록동 출입증이 필요하다. 서쪽 접수실의 인계대 서랍을 확인하자.',relayCopy:'회신 대조 사본이 필요하다. 기록동에서 최초 접수·취소 통화·원격 회신을 대조해야 한다.',relayPower:'비상 회선이 꺼져 있다. 냉각 밸브 개방 → 기존 입력 분리 → 비상 회선 투입을 마쳐야 한다.',relayShortcut:'송출층 안쪽에서 잠긴 연결문이다. 반대편으로 돌아가 내부 빗장을 열어야 한다.'})[o.requires]);return;
    }
    if(o.unlockShortcut){state.flags.relayShortcut=true;toast("내부 빗장을 밀어 접수동 연결문을 열었다.");}
    state.flags["seen_"+id]=true;
    transition(o.to, o.spawn, o);
    return;
  }
  if(enemy.active&&enemy.mode==='chase'&&!o.hide&&!o.barrier){toast('지금은 조사할 수 없다. 먼저 따돌려야 한다.');return;}
  if(o.deductionStation){openReasoning();return;}
  if(o.pumpLog){pickup('pumpLog');addNote('pump-operation','월계아파트 B1 배수펌프 원격 운전 원장: 2023.11.04 / 23:40–23:50 정지. 소음 발생 시각에도 해당 펌프는 운전하지 않았다.');sound.effect('paper');say(o.name,'월계아파트 B1 배수펌프의 원격 기록이다. 2023년11월4일23:40–23:50 정지. 같은 시각을 펌프 운전 중이었다고 적은 보고서와 맞지 않는다. 원장을 챙겼다.');return;}
  if(o.covertDrawer){say(o.name,state.bag.includes('auditMemo')?'숨김 전 탄소 사본은 이미 챙겼다.':'해린의 수정 전 수신 목록이 보이는 봉투. 개인 인계 서랍이다.',state.bag.includes('auditMemo')?undefined:[['몰래 봉투를 꺼낸다 · 손재주 판정',()=>openCheck('theft')],['해린에게 사본을 요청한다 · 설득 판정',()=>openCheck('request','해린')],['손을 뗀다',closeDialog]]);return;}
  if(o.lostbox){if(investigationState(state).gear.includes('watch')){say(o.name,'점검용 시계의 천 주머니와 인수표가 남았다.',o.memento&&!state.bag.includes(o.memento)?[['천 주머니의 보관 쪽지를 펼친다',()=>{collectMemento(state,o.memento);say('서하',mementoText(MEMENTOS[o.memento]));}],["돌아간다",closeDialog]]:undefined);return;}say(o.name,'분실물 인수표에 점검용 손목시계가 표시돼 있다. 작은 잠금쇠가 걸려 있다.',[['걸린 잠금쇠를 푼다 · 손재주 판정',()=>openCheck('lostbox')],['손을 뗀다',closeDialog]]);return;}
  if(o.testContact){
    if(state.flags.relayTesterUnlocked){toast('시험 접점은 이미 복귀했다. 공구 트레이가 열려 있다.');return;}
    const expected=!state.flags.relayTestB?'B':!state.flags.relayTestA?'A':'C';
    if(o.testContact===expected){state.flags['relayTest'+expected]=true;sound.effect('puzzleTurn');if(expected==='C'){state.flags.relayTesterUnlocked=true;sound.effect('save');toast('접점 세 개가 복귀했다. 공구 트레이의 잠금이 풀렸다.');}else toast('시험 접점이 복귀했다.');}
    else{strain(state,8);state.flags.relayTestA=false;state.flags.relayTestB=false;state.flags.relayTestC=false;sound.effect('puzzleSlide');toast('복귀 표시가 꺼졌다. 순서를 다시 확인하자.');}return;
  }
  if(o.equipment==='tester'&&!state.flags.relayTesterUnlocked){say(o.name,'공구 트레이에 잠금이 걸려 있다. 옆 표찰에는 「복귀: B → A → C」라고 새겨져 있다.');return;}
  if(o.equipment){const r=investigationState(state);if(!r.gear.includes(o.equipment)){r.gear.push(o.equipment);sound.effect('item');addNote('equipment_'+o.equipment,EQUIPMENT[o.equipment].description);}say(o.name,EQUIPMENT[o.equipment].description+'\n휴대폰 소지품에서 부위에 맞게 착용할 수 있다.');return;}
  if (o.hide) {
    if(state.flags.chapter2&&!enemy.active){say(o.name,o.description,[['위치를 기억한다',()=>{rememberHide(worldFor(state),state,o);closeDialog();toast('은신처 위치를 기억했다. 미니맵에 작은 원으로 표시했다.');}],['안쪽을 확인한다',()=>{closeDialog();nearest=o;hide();}]]);return;}
    hide();
    return;
  }
  if (o.barrier) {
    if (enemy.active) {
      enemy.stunned = 3.8;
      sound.effect("thud");
      state.flags["seen_" + id] = true;
      toast("방화문을 닫았다. 잠깐 시간을 벌었다.");
    } else say(o.name, o.description);
    return;
  }
  if (enemy.active && enemy.mode === "chase") {
    toast("지금은 조사할 수 없다. 먼저 따돌려야 한다.");
    return;
  }

  if(o.id==='relay-yard-bench'){scene.inspect(o);say(o.name,o.description,[['물건을 자세히 조사한다 · 관찰 판정',()=>openCheck('parking')],['돌아가기',closeDialog]]);return;}
  if(o.npc){talkResident(o);return;}
  scene.inspect(o);
  state.flags["seen_" + id] = true;
  if(o.chapterAction){openRelayAction(o);return;}
  if(o.recoveryItem){const item=collectRecovery(state,o),first=item&&discoverThread(state);say(first?'서하':o.name,first||(item?'포장 천 사이에서 작은 실타래를 챙겼다. 실 끝이 그림자 쪽으로 당겨진다.':'천과 포장지만 남아 있다. 실타래는 이미 챙겼다.'));if(item){sound.effect('paper');toast('매듭실을 챙겼다.');}return;}
  if(o.collectible){
    if(!state.bag.includes(o.collectible)){
      pickup(o.collectible);addNote(o.collectible,o.description);
      say(o.name,o.description+'\n\nTab → 소지품·기록에서 다시 확인할 수 있다.');
    }else say(o.name,'챙긴 문서는 휴대폰의 기록 앱에 남아 있다.\n'+o.description);
    return;
  }
  if(o.fixture==='curtain'){
    const open=state.flags['curtain_'+id]??o.decor===1;state.flags['curtain_'+id]=!open;
    say(o.name,(open?'커튼을 천천히 닫았다. 창에 비치던 방 안의 모습이 천 뒤로 사라진다.':'커튼을 조금 걷었다. 바깥은 어둡고, 창에는 내 뒤의 방만 비친다.')+'\n'+o.description);return;
  }
  if(o.fixture==='mirror'){
    openMirror();
    return;
  }
  switch (id) {
    case "flashlight":
      if(!state.bag.includes('flashlight')){
        pickup('flashlight');state.flashlight=true;
        addNote('flashlight','미정의 인수표: 손전등은 충전대에 두었습니다. 서윤의 메모와 유품 통지서는 바로 옆 접수대에 있습니다.');
        say('접수대의 손전등','충전대에서 손전등을 꺼냈다. 스위치를 누르자 좁은 빛이 켜진다.\nF로 켜고 끌 수 있다. 빛은 그에게 내 위치를 알린다.\n옆의 통지서와 101호 신발장부터 확인하자.');
      }else say('빈 충전대','손전등은 이미 챙겼다. F로 켜고 끌 수 있다.');
      break;
    case "notice":
      addNote(
        "notice",
        "철거 공지: 11월 4일, 모든 입주 기록 폐기. 관리실 보관함은 정전 시 잠긴다.",
      );
      say(
        "철거 안내문",
        "11월 4일. 오전 여섯 시 철거 예정.\n「남겨진 물품은 관리실에 보관합니다.」\n아래에는 내 이름이 적혀 있다. 서하.",
      );
      break;
    case "shoe":
      if (state.bag.includes("key")) {
        say(
          "열린 신발장",
          "열쇠를 꺼낸 자리만 밝게 남아 있다.\n신발 한 짝이 조금 돌아가 있다. 방금 내가 건드렸던가.",
        );
        break;
      }
      sound.effect("drawer");
      pickup("key");
      say(
        "서하",
        "신발장 서랍 안쪽에 작은 열쇠가 들어 있다.\n야간 관리실을 맡았던 내 서랍 열쇠다.\n서윤은 「언니가 또 잊으면 여기」라고 써 두었다.",
      );
      break;
    case "desk":
      if (!state.bag.includes("key")) {
        say(
          "관리인의 책상",
          "책상 서랍이 잠겨 있다. 손잡이에 「101」이라고 적혀 있다.",
        );
        break;
      }
      state.flags.desk = true;
      if(!state.bag.includes('serviceKey'))pickup('serviceKey');
      addNote(
        "desk",
        "관리인 메모: 서윤 사건의 원본 접수증과 녹음은 전자 보관함에 봉인. 비밀번호는 철거일, 날짜 먼저 월 나중. 예비 퓨즈는 지하 창고 작업대에 있다.",
      );
      say(
        "관리인의 메모",
        "「보관함 번호는 철거일.\n날짜를 먼저, 월을 나중에. 잊지 말 것.」\n뒷면에는 「서윤 사건 원본 접수증·녹음 봉인」.\n보관함이 열리지 않으면 지하 창고 작업대의 퓨즈로 전력을 복구하라고 적혀 있다.\n서랍 안의 공용 마스터키도 챙겼다. 퇴거한102·103호와 관리인 비품함용이다.",
      );
      break;
    case "calendar":
      addNote(
        "calendar",
        "달력: 11월 4일에 동그라미. 숫자 04 아래에 날짜, 11 아래에 월이라고 적혔다.",
      );
      say(
        "뒤집힌 달력",
        "11월. 4일에만 동그라미가 쳐져 있다.\n누군가 작은 글씨로 적었다.\n「날짜가 먼저야. 이번에는 잊지 마.」",
      );
      break;
    case "records":
      addNote('records',STORY.records);say('사고 처리 기록철',STORY.records);
      break;
    case "box":
      if (state.bag.includes("fuse") || state.flags.power) {
        say(
          "공구 상자",
          "뚜껑을 열어 둔 상자. 퓨즈가 있던 홈은 비어 있다.\n가져갈 수 있는 것은 더 없다.",
        );
        break;
      }
      if(lowerLightForPickup(state))toast('손전등을 내려놓고 공구함을 연다.');
      if(!collectFuse(state,o)){say(o.name,'공구함을 살펴보지만 꺼낼 수 있는 퓨즈가 없다.');break;}
      sound.effect('item');scene.burst(o.x,o.y,'spark');toast('예비 퓨즈 획득 · 공구함의 흰 트레이가 비었다.');
      say(
        "공구 상자",
        "열린 공구함의 흰 트레이에서 유리관 퓨즈 하나를 꺼냈다.\n「24V 비상 제어 회로 — 전기실 벽면 홀더용」.\n전기를 되살리면 유품과 마지막 녹음을 확인할 수 있다.",
      );
      break;
    case "power":
      if (state.flags.power) {
        say("분전반", "전류가 낮게 울린다. 관리실과 방송실 회로가 살아 있다.");
        break;
      }
      if (!canRepair(state,o)) {
        say("분전반", "퓨즈 하나가 비어 있다.\n열린 덮개 안의 두 금속 클립 사이가 비어 있다.\n같은 유리관 퓨즈는 서쪽 창고의 열린 공구함에 보관한다.");
        break;
      }
      eventActive=true;keys.clear();state.running=false;sound.crowdLevel(0);
      scene.startFuse(o,()=>{
        eventActive=false;if(!repair(state,o))return;
      sound.effect("thud");
      state.stamina=100;
      toast("전력 복구 · 방송 장치가 켜졌다");
      scene.burst(o.x,o.y-38,"spark");
      scene.impact();
      huntDelay = 1.5;
      forcedCue = "panic";
      say(
        "서하",
        "전기실 벽의 열린 제어 회로함. 비어 있던 홀더의 두 클립 사이에 유리관 퓨즈가 들어맞았다.\n24V 제어 회로 표시등이 켜진다. 복도 끝에서 무언가 움직이는 소리가 들린다.",
      );
      });
      break;
    case "locker":
      if (state.flags.locker) {
        if(!state.bag.includes('receipt')){pickup('receipt');addNote('receipt',STORY.receipt);say('보관함 안쪽의 접수 서류',STORY.receipt);break;}
        say(
          "전자 보관함",
          "보관함은 비어 있다. 그 안에 있던 것은 이제 내 손에 있다.",
        );
        break;
      }
      if (!state.flags.power) {
        say(
          "전자 보관함",
          "표시창이 꺼져 있다. 설비실의 전력을 복구해야 한다.",
        );
        break;
      }
      say(
        "전자 보관함",
        "네 자리 비밀번호를 입력하세요.\n수집한 단서는 휴대폰의 기록 앱에 남아 있다.",
        [],
      );
      {
        const input = document.createElement("input");
        input.inputMode = "numeric";
        input.maxLength = 4;
        input.placeholder = "0000";
        input.setAttribute("aria-label", "보관함 네 자리 비밀번호");
        const b = document.createElement("button");
        b.textContent = "열기";
        const submit = () => {
          if (unlock(state, input.value) === "ok") {
            sound.effect("fireDoor");
            forcedCue = "evidence";
            say(
              "서하",
              "봉인 봉투 안에 원본 접수증, 녹음테이프와 철거 전 입주 기록이 함께 들어 있다.\n접수증에는 내가 현장 개방을 확인했다고 서명했다.\n「신고를 취소한 사람: 서하」",
            );
            addNote(
              "evidence",
              "보관함: 원본 접수증, 녹음테이프, 철거 전 입주 기록. 신고 취소자에 내 이름이 있다.",
            );
          } else {
            sound.effect("thud");
            input.value = "";
            input.placeholder = "다시";
            input.setAttribute("aria-invalid", "true");
            toast("번호가 맞지 않습니다. 날짜 → 월 순서입니다.");
            input.focus();
          }
        };
        b.onclick = submit;
        input.onkeydown = (e) => {
          if (e.key === "Enter") submit();
        };
        const back = document.createElement("button");
        back.textContent = "돌아가기";
        back.className = "secondary";
        back.onclick = closeDialog;
        $("dialog-actions").append(input, b, back);
        input.focus();
      }
      break;
    case "shutter-control":
      if(!state.flags.power){say("셔터 비상 제어반","비상 회로가 죽어 있다. 지하 분전반을 먼저 복구해야 한다.");break;}
      if(state.flags.shutterOpen){say("셔터 비상 제어반","복귀 표시등이 켜져 있다. 1층 현관 셔터는 올라가 있다.");break;}
      state.flags.shutterOpen=true;
      sound.effect("shutter");
      addNote("shutter","방송 조정실 비상 제어반으로 현관 셔터를 수동 복귀했다. 출구는 1층. 기록을 남길지는 내가 결정한다.");
      say("수동 복귀","복귀 스위치를 끝까지 누른다. 아래층에서 모터와 쇠사슬이 울린다.\n현관 셔터가 올라갔다. 밖으로 나가기 전에 원본 접수증과 녹음, 입주 기록을 챙기자.");
      break;
    case "player":
      if (!state.flags.power) {
        say("카세트 플레이어", "전원이 들어오지 않는다.");
        break;
      }
      if (!state.bag.includes("tape")) {
        say(
          "카세트 플레이어",
          "빈 테이프 데크.\n관리실에 보관된 녹음이 있다면 재생할 수 있겠다.",
        );
        break;
      }
      if(!firstListening(state)){say('녹음 기록',STORY.firstTape);break;}
      state.stamina=100;
      addNote('tape',STORY.firstTape);
      pendingEvent=()=>showEvent('memory','잘린 녹음','23시 43분 뒤의 일분이 빠져 있었다.');
      forcedCue='memory';huntDelay=2;scene.impact();scene.haunt('확인했다고 말했잖아');
      say('보관된 녹음',STORY.firstTape);
      break;
    case "mirror":
      say(
        "꺼진 모니터",
        state.flags.power
          ? "화면에는 아무것도 없다. 내 얼굴만 비친다.\n눈을 감았는데, 화면 속의 나는 아직 나를 보고 있다."
          : "유리 표면에 손자국이 여섯 개 남아 있다.",
      );
      break;
    case "photo":
      say(
        "비어 있는 액자",
        "사진은 없다. 유리 아래에 희미한 글씨가 남아 있다.\n「확인했다고 말한 사람은, 문 앞에 없었다.」",
      );
      break;
    case "shelf":
      say(
        "수납장",
        "번호가 지워진 물품 보관 상자들.\n상자 하나에는 내 이름이 두 번 적혀 있다.",
      );
      break;
    case "window":
      say(
        "닫힌 창문",
        "건너편 방의 불이 꺼진다.\n이 건물에는 더 이상 사람이 없다고 했다.",
      );
      break;
    case "exit":
      if (!state.flags.shutterOpen) {
        say(
          "내려온 방화 셔터",
          "철제 슬랫이 출구를 가리고 있다.\n비상 복귀 안내: 지하 전력 복구 → 2층 방송 조정실 수동 제어반.\n셔터 아래에는 안쪽에서 긁힌 손자국이 남아 있다.",
        );
        break;
      }
      showDeparture();
      break;
    default:
      if (id === "home-desk") {
        addNote("home-desk", o.description);
        forcedCue = "memory";
      }
      if (id === "bed-home") addNote("bed", o.description);
      if (id === "warning") addNote("survival", o.description);
      say(
        o.name,
        o.description || "오래된 물건. 건드린 자리에 먼지가 흐트러진다.",
      );
      break;
  }
}
function storyScreen(mode){
  finishTyping();pendingEvent=null;dialog=false;scene.focus=null;phone=false;phoneApp=null;
  $('dialog').hidden=true;$('phone-modal').hidden=true;$('event-cg').hidden=true;
  eventActive=true;keys.clear();state.running=false;sound.crowdLevel(0);stillness.reset();
  const screen=$('story-sequence');screen.hidden=false;screen.dataset.mode=mode;screen.dataset.shot='0';
  $('story-stamp').hidden=true;$('story-evidence').textContent='';$('story-actions').replaceChildren();
  $('story-art').style.backgroundImage='';return screen;
}
function storyButton(label,fn,disabled=false){
  const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=fn;$('story-actions').append(b);return b;
}
function showDeparture(){
  storyScreen('departure');$('story-art').style.backgroundImage=`url(${canvas.toDataURL('image/png')})`;
  $('story-kicker').textContent='월계아파트 · 열린 현관';$('story-heading').textContent='내 이름이 적힌 봉투';
  $('story-line').textContent='나는 문이 열렸다고 확인했다.\n그 확인이 거짓이었다는 목소리가 봉투 안에 있다.';
  storyButton('가진 녹음을 들고 경찰서에 가서 자수한다',()=>ending('surrender'),!canSurrender(state));
  storyButton('「내가 죽인 건 아니야」 · 원격 기록을 확인하러 간다',()=>ending('return'),!canSeekOriginal(state));
  if(canPreserve(state))storyButton('104호 촬영 원본과 인수 경위를 함께 봉인해 제출한다',()=>ending('preserve'));
  storyButton('아직 챙길 것이 있다 · 건물로 돌아간다',()=>{eventActive=false;$('story-sequence').hidden=true;canvas.focus();});
  $('story-evidence').textContent=ORIGINALS.map(k=>(state.bag.includes(k)?'✓ ':'미확보 · ')+ITEMS[k]).join('   /   ')+(state.bag.includes('inspectionPhotos')?'\n✓ 104호 점검 사진 원본':'\n104호 점검 사진 원본 미확보 · 원격 기록 확인 경로 잠김')+(state.flags.listened?'':'\n방송실에서 테이프를 먼저 들어야 한다.');
  $('story-actions').querySelector('button:not(:disabled)')?.focus();
}
function ending(choice){
  if(!finish(state,choice))return;
  playCinematic(choice==='return'?'denial':choice==='preserve'?'preserve':'surrender');
}
let storyTimer;
function playCinematic(id){
  const film=routeFilm(state,id,CINEMATICS[id]);if(!film)return;
  const screen=storyScreen('cinematic');screen.dataset.film=id;enemy.reset();pursuerTrail=null;huntDelay=0;
  forcedCue=film.cue;updateSound();$('story-art').dataset.panel=film.panel;
  const beats=film.beats.map(b=>[...b]);
  if(id==='denial'&&!state.bag.includes('receipt'))beats[2]=['보관 쪽지','「원격 명령 원본은 산북 시설중계소.」\n접수증도 확인하지 않은 채 나는 결백을 증명하러 가고 있었다.','보관 쪽지를 펼친다'];
  let index=0;
  const show=()=>{
    clearTimeout(storyTimer);screen.dataset.shot=String(index);if(film.panel===0&&index===2)sound.effect('stamp');$('story-kicker').textContent=id==='denial'?'잔류 · 제2장으로':'잔류 · 새벽';
    const [heading,line,action]=beats[index];$('story-heading').textContent=heading;$('story-line').textContent=line;
    $('story-stamp').hidden=!(film.panel===0&&index>=2);$('story-actions').replaceChildren();
    const last=index===beats.length-1;
    const button=storyButton(action||(last?(id==='denial'?'중계소에 도착한다':'장면을 마친다'):'다음 장면'),()=>{
      if(index<beats.length-1){if(action)sound.effect(film.panel===0&&index===1?'pen':'paper');index++;show();return;}
      if(id==='denial'){screen.hidden=true;eventActive=false;startChapterTwo();return;}
      screen.dataset.mode='final';$('story-stamp').hidden=true;$('story-kicker').textContent='ENDING';$('story-heading').textContent=film.label;
      $('story-line').textContent='';$('story-actions').replaceChildren();storyButton('처음으로',()=>location.reload()).focus();
      try{const raw=JSON.parse(localStorage.getItem('janryu-endings')||'[]');localStorage.setItem('janryu-endings',JSON.stringify([...new Set([...(Array.isArray(raw)?raw:[]),id])]));}catch{}
    },true);
    storyTimer=setTimeout(()=>{button.disabled=false;button.focus();},scene.reduced?350:1800);
  };show();
}
function resumeConclusion(){
  if(state.ending==='return'){state.flags.denial=true;playCinematic('denial');}
  else if(state.ending==='witness'){
    if(canSurrender(state)){state.ending='surrender';playCinematic('surrender');}
    else{state.ending=null;toast('접수증 원본까지 챙긴 뒤 출구에서 진술할지 결정하자.');}
  }else if(CINEMATICS[state.ending])playCinematic(state.ending);
}

function slot(i) {
  try {
    return localStorage.getItem(`janryu-save-${i}`);
  } catch {
    return null;
  }
}
function openPhone() {
  if (eventActive || dialog || !started || traveling) return;
  if (enemy.active || pursuerTrail) {
    toast("발소리가 너무 가깝다. 지금은 휴대폰을 꺼낼 수 없다.");
    return;
  }
  phone = true;
  state.flags.phoneLearned = true;
  $("phone-hint").hidden = true;
  keys.clear();
  $("phone-modal").hidden = false;
  phoneHome();
}
function closePhone() {
  phone = false;
  phoneApp=null;
  forcedCue=null;
  updateSound();
  $("phone-modal").hidden = true;
  keys.clear();
  canvas.focus();
}
function phoneHome(){
  $('phone-content').classList.remove('inventory-view');
  phoneApp=null;document.querySelector('.phone').classList.remove('in-app');
  $('phone-app-header').hidden=true;$('phone-content').textContent=worldFor(state).name+'\n\n지금 할 일: '+objective();
  document.querySelector('[data-app]')?.focus();
}
function app(name) {
  phoneApp=name;document.querySelector('.phone').classList.add('in-app');
  $('phone-app-header').hidden=false;$('phone-app-back').focus();$('phone-app-title').textContent={save:'기억 저장',load:'기억 불러오기',bag:'소지품',notes:'사건 기록',map:'층별 안내',settings:'설정',memories:'남겨진 일상'}[name]||name;
  const content = $("phone-content");
  content.classList.remove('inventory-view');content.replaceChildren();
  content.scrollTop=0;
  if (name === "save" || name === "load") {
    for (let i = 1; i <= 3; i++) {
      const b = document.createElement("button");
      let saved = null;
      try {
        if (slot(i)) saved = restore(slot(i));
      } catch {}
      b.textContent = `${i} · ${saved ? MAPS[saved.map].name+" · "+conditionLabel(saved) : "빈 슬롯"} — ${name === "save" ? "기억 저장" : "기억 복원"}`;
      b.disabled = name === "load" && !saved;
      b.onclick = () => {
        try {
          if (name === "save") {
            const write = () => {
              localStorage.setItem(`janryu-save-${i}`, JSON.stringify({...state,savedAt:Date.now()}));
              sound.effect("save");
              toast("기억을 저장했다.");
              app(name);
            };
            if (saved) {
              content.replaceChildren();
              const confirm = document.createElement("button");
              confirm.textContent = "기존 기억을 덮어쓴다";
              confirm.onclick = write;
              const cancel = document.createElement("button");
              cancel.textContent = "돌아가기";
              cancel.onclick = () => app(name);
              content.append(confirm, cancel);
            } else write();
          } else {
            clearTimeout(sanityNoticeTimer);$('sanity-loss').hidden=true;state = migrateStorySave(restore(slot(i)));ensureRun(state);clearReturnEffect();progressHaunt.reset();residents.reset();
            pursuerTrail=null;
            enemy.reset();
            huntDelay =
              canHunt()
                ? 45
                : 0;
            scene.begin(state, worldFor(state));
            stillness.reset();
            closePhone();
            if(state.ending)resumeConclusion();
            updateSound();
            toast("기억을 복원했다.");
          }
        } catch {
          toast("이 브라우저에서 기억을 저장하거나 읽을 수 없다.");
        }
      };
      content.append(b);
    }
    return;
  }
  if(name==='memories'){const found=collectedMementos(state);content.textContent='남겨진 일상 · '+found.length+'/'+Object.keys(MEMENTOS).length+'\n사건 기록과 따로 모아 둔 작은 물건들.\n3개 / 6개를 모으면 매듭실을 한 타래씩 얻는다. 각 보상은 한 번뿐이다.\n'+(state.flags.memoryReward3?'3개 보상 · 받음':'3개 보상 · '+Math.max(0,3-found.length)+'개 남음')+'\n'+(state.flags.memoryReward6?'6개 보상 · 받음':'6개 보상 · '+Math.max(0,6-found.length)+'개 남음')+'\n\n'+Object.entries(MEMENTOS).map(([id,m])=>state.bag.includes(id)?m.name+'\n'+m.text:'아직 찾지 못한 물건').join('\n\n');return;}
  if(name==='bag'){inventory.render(content,state,ITEMS);return;}
  if (name === "notes")
    content.textContent = state.notes.length
      ? "지금 할 일: " + objective() + "\n\n" + state.notes.map((n) => n.text).join("\n\n")
      : "목표: " +
        objective() +
        "\n\n기록과 물건을 조사하면 단서가 이곳에 남는다.";
  if(name==='notes'){const memories=document.createElement('button');memories.textContent='남겨진 일상 · '+collectedMementos(state).length+'/'+Object.keys(MEMENTOS).length;memories.onclick=()=>app('memories');content.prepend(memories);}
  if(name==='notes'&&state.flags.chapter2){const b=document.createElement('button');b.textContent='말과 기록을 나란히 본다';b.onclick=()=>openReasoning();content.prepend(b);}
  if (name === "map")
    content.textContent =
      (state.flags.chapter2?"산북 시설중계소 · 구역 안내\n\n외부 마당 ↔ 접수동 서쪽 현관\n해린: 안내실 / 미정: 당직 휴게실 / 도현: 지하 정비실\n접수동: 남쪽 대기실 / 서쪽 접수실 / 동쪽 당직실\n서쪽 접수실 북문 ↔ 기록동: 서쪽 접수 원본 / 동쪽 대조 청취실\n동쪽 당직실 계단 ↓ 설비동: 서쪽 냉각 순환 / 동쪽 전원 절체\n설비동 동쪽 계단 ↑ 송출층: 서쪽 최종 청취 / 동쪽 송출 콘솔\n\n현재: ":"월계아파트 · 층별 안내\n\n2F 서쪽 기록실 / 동쪽 방송실\n       ↕ 동쪽 계단\n1F 서쪽 관리실 / 중앙 현관 / 동쪽 101호\n       ↕ 동쪽 계단\nB1 서쪽 공용 창고 / 동쪽 수변전실\n\n현재: ") +
      worldFor(state).name +
      "\n\n" +
      objective() +
      (state.flags.chapter2?"\n\n책상 아래와 환풍구를 미리 확인하자. 보고 있는 앞에서 숨으면 들킨다.":"\n\n위험 시 청소함에 숨는다. 달리기는 소음을 만든다.");
  if(name==='map'&&state.flags.chapter2&&!state.flags.relayMap)content.textContent+='\n\n안내 데스크에서 시설 배치도를 조사하면 화면 우측 상단에서 볼 수 있다.';
  if (name === "settings") {
    content.textContent =
      "음향 · 공포 BGM / 용도별 효과음\n현재 BGM: " +
      (sound.cue || "시작 대기") +
      "\n";
    const toggle = document.createElement("button");
    toggle.textContent = sound.enabled ? "모든 소리 끄기" : "소리 재생";
    toggle.onclick = () => {
      toggleAudio();
      app(name);
    };
    content.append(toggle);
    for (const [key, label] of [
      ["volume", "전체"],
      ["musicLevel", "BGM"],
      ["fxLevel", "효과음·발소리"],
    ]) {
      const l = document.createElement("label");
      l.textContent = label;
      const range = document.createElement("input");
      range.type = "range";
      range.min = 0;
      range.max = 100;
      range.value = sound[key] * 100;
      range.setAttribute("aria-label", label + " 음량");
      range.oninput = () => {
        sound[key] = +range.value / 100;
        sound.apply();
      };
      l.append(range);
      content.append(l);
    }
    const effects=document.createElement('select');effects.setAttribute('aria-label','효과음 미리 듣기');for(const[key,label]of [['stepWood0','나무 바닥 발소리'],['stepConcrete0','콘크리트 발소리'],['stepCarpet0','카펫 발소리'],['stepWater0','젖은 바닥'],['door','문 열기'],['doorClose','문 닫기'],['paper','종이 넘기기'],['dice','주사위 굴리기'],['omenKnock','문 두드리기'],['apparition','숨소리'],['mirrorLaugh','괴이의 웃음'],['heartbeat','심장박동'],['fireDoorClose','금속문 닫힘'],['flashlightOn','손전등 스위치']]){const op=document.createElement('option');op.value=key;op.textContent=label;effects.append(op);}content.append(effects);
    const test=document.createElement('button');test.textContent='선택한 효과음 듣기';test.onclick=()=>effects.value.startsWith('step')?sound.step(({stepWood0:'wood',stepConcrete0:'concrete',stepCarpet0:'carpet',stepWater0:'water'})[effects.value],false):sound.effect(effects.value,.7);content.append(test);
    const credits=document.createElement('button');credits.textContent='음원 출처';credits.onclick=async()=>{const r=await fetch('audio-credits.txt'+new URL(import.meta.url).search);if(r.ok){content.textContent=await r.text();$('phone-app-title').textContent='음원 출처';}};content.append(credits);
    const select = document.createElement("select");
    select.setAttribute("aria-label", "BGM 미리 듣기");
    for (const [key, file] of Object.entries(TRACKS)) {
      const op = document.createElement("option");
      op.value = key;
      op.textContent = file;
      op.selected = sound.cue === key;
      select.append(op);
    }
    select.onchange = () => {
      forcedCue = select.value;
      sound.play(select.value);
    };
    content.append(select);
    const p = document.createElement("p");
    p.textContent =
      "WASD 이동 · Shift 달리기\nF 손전등 · E 조사/숨기/나오기\nTab 휴대폰 · Esc 닫기\n추격 중에는 휴대폰과 일반 조사를 할 수 없다.";
    content.append(p);
  }
}
function begin(load = false) {
  clearTimeout(sanityNoticeTimer);$('sanity-loss').hidden=true;
  let next = initial();
  if (load) {
    if (!slot(1)) {
      toast("1번 슬롯에 저장된 기억이 없다.");
      return;
    }
    try {
      next = migrateStorySave(restore(slot(1)));
    } catch {
      toast("저장된 기억을 읽지 못했다.");
      return;
    }
  }
  clearReturnEffect();ensureRun(next,!load);prepareStoryFlow(next);
  $("injury-screen").hidden=true;state = next;progressHaunt.reset();residents.reset();
  stillness.reset();
  addNote(
    "orientation",
    "1층 서쪽: 관리실 / 동쪽: 101호 / 맨 동쪽: 위아래 계단. 지하 서쪽: 공용 창고 / 동쪽: 수변전실. 2층 서쪽: 기록실 / 동쪽: 방송실. 손전등은 마우스 또는 이동 방향을 따른다.",
  );
  forcedCue = load ? null : "main";
  started = true;
  pursuerTrail=null;
  enemy.reset();
  huntCooldown = 0;
  huntDelay =
    canHunt() ? 45 : 0;
  scene.begin(state, worldFor(state));
  $("phone-hint").hidden = !!state.flags.phoneLearned;
  $("title-screen").hidden = true;
  $("play-screen").hidden = false;
  canvas.tabIndex = 0;
  canvas.focus();
  sound.start(cue()).catch(() => toast("소리 재생 버튼을 눌러 주세요."));
  if (!load)
    say(
      "서하",
      STORY.prologue,
    );
  if(load&&state.ending)resumeConclusion();
  if (state.flags.relocated) toast("새 가구 배치 옆의 안전한 위치로 옮겼다. 소지품과 기록은 그대로다.");
  if (state.flags.migrated)
    toast("옛 기억의 위치를 새 현관으로 옮겼다. 소지품과 단서는 보존했다.");
}
let pendingEvent = null;
function showEvent(kind, title, caption, after = () => {}) {
  if (eventActive) return;
  eventActive = true; keys.clear(); state.running = false;
  const screen = $("event-cg");
  $("event-image").src = {capture: "assets/event-capture.png?v=178ec9dc0c70", memory: "assets/event-memory.png?v=178ec9dc0c70"}[kind];
  $("event-image").alt = kind === "capture" ? "어두운 복도에서 정우의 그림자에게 붙잡힌 서하" : "풀려 나온 카세트테이프와 혼자 남은 서하의 기억";
  $("event-title").textContent = title; $("event-caption").textContent = caption;
  screen.hidden = false;
  if (kind === "capture") sound.effect("capture");
  const button = $("event-continue"); button.disabled = true; button.focus();
  setTimeout(() => { button.disabled = false; button.focus(); }, 900);
  button.onclick = () => { screen.hidden = true; eventActive = false; keys.clear(); after(); if (!dialog) canvas.focus(); };
}
function caught(kind="jeongwoo") {
  if(eventActive)return;
  eventActive=true;keys.clear();state.running=false;sound.crowdLevel(0);
  deathCheckpoint=checkpoints(slot)[0]||null;captureFinished=false;
  captureAnimation.reset(kind,hollowStage(state));
  $("death-title").textContent=kind==='hollow'?'실체가 남지 않았다.':kind==='redlight'?'웃음이 바로 앞에서 멎었다.':'숨이 멎었다.';
  document.querySelector("#death-result small").textContent=kind==='hollow'?'잔류 · 실체 소멸':'잔류 · 사망';
  $("capture-animation").setAttribute("aria-label",isRelayGhost(kind)?'중계소의 괴이가 서하를 붙잡고 시야가 사라진다':kind==='hollow'?'허공의 눈들이 남은 실체를 삼키고 시야가 사라진다':kind==='redlight'?'돌아보던 얼굴이 시야를 가득 채운다':'정우가 서하를 덮쳐 목을 조른다');
  $("death-screen").hidden=false;$("death-screen").tabIndex=-1;$("death-screen").focus();
  $("death-result").hidden=true;$("death-retry").disabled=true;
  sound.effect(kind==='hollow'?"screamAlt":"scream",.9);sound.effect("capture",.2);
  updateSound();
}
function handleCapture(kind=enemy.kind){if(eventActive)return;const result=captureConsequence(state,kind);if(result.fatal){caught(kind);return;}injuredCapture(kind,result);}
function injuredCapture(kind,result){
  eventActive=true;keys.clear();state.running=false;state.hidden=false;state.hideSpot=null;
  enemy.reset();pursuerTrail=null;huntDelay=0;huntCooldown=100;randomHunt.spare(100);stillness.reset();
  injuryFinished=false;injuryAnimation.reset(kind,hollowStage(state));$('injury-screen').hidden=false;$('injury-result').hidden=true;$('injury-resume').disabled=true;
  $('injury-title').textContent=result.part==='leg'?(result.count===2?'일어나야 하는데… 바닥에서 떨어지지 않아.':'발끝에 힘을 줬는데… 아무것도 닿지 않아.'):(result.count===2?'이제… 빛을 잡을 손이 없어.':'남은 손으로, 빛을 놓치지 말자.');
  $('injury-detail').textContent=(result.part==='leg'?(result.count===2?'두 손으로 바닥을 짚었다. 몸을 끌면… 아직 움직일 수 있어.':'무릎 아래를 더듬었다. 있어야 할 곳이 비어 있었다.\n숨부터 고르자. 벽을 짚으면… 움직일 수 있어.'):(result.count===2?'두 소매가 비었다. 불이 켜진 곳을 찾아야 해.':'소매가 텅 비어 흔들렸다. 남은 손으로 떨어진 손전등을 움켜쥐었다.\n뭔가 집으려면… 잠시 빛을 내려놓아야겠어.'));
  sound.effect('screamAlt',.9);sound.effect('capture',.2);sound.crowdLevel(0);$('injury-screen').tabIndex=-1;$('injury-screen').focus();
}
$('injury-resume').onclick=()=>{if(!injuryFinished)return;$('injury-screen').hidden=true;eventActive=false;keys.clear();canvas.focus();};
function conditionLabel(s){const b=bodyState(s);return b.leg||b.arm?[b.leg?'다리 결손':null,b.arm?'팔 결손':null].filter(Boolean).join(' · '):'신체 정상';}
function renderDeathSlots(){
 const valid=checkpoints(slot),list=$("death-slots");list.replaceChildren();
 for(let i=1;i<=3;i++){
  const entry=valid.find(v=>v.slot===i),button=document.createElement('button');
  button.disabled=!entry;button.setAttribute('aria-pressed',String(!!entry&&entry.slot===deathCheckpoint?.slot));
  const date=entry?.savedAt?new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'short'}).format(entry.savedAt):'시각 미기록';
  button.textContent=entry?`${i}번 · ${MAPS[entry.state.map].name} · ${date} · ${conditionLabel(entry.state)}`:`${i}번 · 빈 슬롯 또는 읽을 수 없는 저장`;
  button.onclick=()=>{deathCheckpoint=entry;renderDeathSlots();list.querySelectorAll('button')[i-1].focus();};list.append(button);
 }
 $("death-checkpoint").textContent=deathCheckpoint?`${deathCheckpoint.slot}번을 선택했습니다. 저장 이후의 진행은 사라집니다.`:'불러올 수 있는 저장이 없습니다. 처음부터 시작합니다.';
 $("death-retry").textContent=deathCheckpoint?'선택한 저장 불러오기':'처음부터 시작하기';
 $("death-new").hidden=!valid.length;
}
$("death-new").onclick=()=>{deathCheckpoint=null;recoverAfterCapture();};
let returnTimer;
function clearReturnEffect(){storyShot=null;scene.cinematicFocus=null;scene.storyFalling=0;scene.storyVerifier=null;scene.storyLightFailure=false;scene.explorationShadow=null;clearTimeout(returnTimer);$('play-screen').classList.remove('returning-memory');$('play-screen').removeAttribute('data-return-stage');}
function reactToDeathReturn(){
 let storage;try{storage=localStorage;}catch{}const reaction=recordDeathReturn(state,storage);
 strain(state,reaction.sanityLoss);clearReturnEffect();$('play-screen').dataset.returnStage=String(reaction.stage);$('play-screen').classList.add('returning-memory');returnTimer=setTimeout(clearReturnEffect,reaction.duration);
 if(reaction.stage>=2)scene.impact();if(reaction.echo)scene.haunt(reaction.echo);sound.effect('heartbeat',reaction.stage>=3?.8:.45);if(reaction.stage>=3)sound.effect('hallucination',.32);
 say('서하',reaction.text);scene.focus=null;state.running=false;
}
function recoverAfterCapture() {
  if(!captureFinished)return;
  $("death-screen").hidden=true;eventActive=false;keys.clear();
  pursuerTrail=null;enemy.reset();stillness.reset();
  huntDelay=0;huntCooldown=30;stepClock=0;heartClock=0;
  traveling=false;phone=false;phoneApp=null;dialog=false;pendingEvent=null;
  $("phone-modal").hidden=true;$("dialog").hidden=true;
  forcedCue=null;
  if(!deathCheckpoint){const run=ensureRun(state);begin(false);state.runId=run;reactToDeathReturn();return;}
  const run=ensureRun(state);
  clearTimeout(sanityNoticeTimer);$('sanity-loss').hidden=true;state=migrateStorySave(deathCheckpoint.state);state.runId=run;progressHaunt.reset();residents.reset();
  scene.begin(state,worldFor(state));
  huntDelay=canHunt()?45:0;
  $("phone-hint").hidden=!!state.flags.phoneLearned;
  canvas.focus();updateSound();
  if(state.ending)resumeConclusion();
  if(!state.ending)reactToDeathReturn();
}
$("death-retry").onclick=recoverAfterCapture;
let storyShot=null;
function stormChoice(){
 say('서하','출력기 위로 물이 떨어진다. 연결 복도에서 철판이 휘는 소리가 났다.\n방금 찾은 파일 번호가 젖으면 원본을 찾기 어려워질 거야. 미정 씨도 저 복도 쪽에 있어…',[
 ['미정에게 점검 출구부터 함께 확인하자고 부른다',()=>{if(chooseStormResponse(state,'witness')){closeDialog();say('미정','내가 계단을 볼게. 저 덮개 위로 오지 말고 옆 점검문으로 와. 같이 내려가자.');}}],
 ['출력 기록을 방수 봉투에 넣고 직접 출구를 확인한다',()=>{if(chooseStormResponse(state,'record')){closeDialog();say('서하','파일 번호부터 지키자. 봉투를 잠그고 복도로 나갔다.\n…바닥에서 물이 올라오고 있어.');}}]
 ]);
}
function startStoryShot(kind){
 if(kind.startsWith('explore_')){const e=explorationBeat(state);if(!e||e.kind!==kind)return;state.flags['exploreSeen_'+kind.slice(8)]=true;startExplorationShot(e);return;}
 if(kind==='archiveChoice'){stormChoice();return;}
 if(kind==='lightAccident'){state.flags.storyLightAccident=true;state.flags.flashlightBroken=true;state.flashlight=false;}
 eventActive=true;keys.clear();state.running=false;enemy.reset();pursuerTrail=null;randomHunt.spare(100);huntDelay=0;thresholdHorror.active=null;scene.thresholdHorror=null;
 const map=worldFor(state),find=id=>map.objects.find(o=>o.id===id),point=kind==='lightAccident'?find('story-drain-pipe-a'):kind==='cancelEyes'?find('relay-cancel'):kind==='powerPhone'?find('entry-intercom'):kind==='intakeDoor'?find('relay-audit-door'):kind==='archiveAlarm'?find('story-archive-hatch'):kind==='powerReturn'?find('relay-plant-signal'):kind==='drainPursuit'?{x:17*32,y:12*32}:null;
 const seen={cancelEyes:'storyVerifierSeen',powerPhone:'storyPowerSeen',intakeDoor:'storyIntakeSeen',archiveAlarm:'storyArchiveAlarm',powerReturn:'storyPowerReturn',voiceReaction:'storyVoiceReaction',floorFall:'storyFell',drainPursuit:'storyDrainPursuit'}[kind];if(seen)state.flags[seen]=true;
 storyShot={kind,elapsed:0,duration:kind==='floorFall'?1.5:kind==='voiceReaction'?2.8:2.2,focus:point||{x:state.x,y:state.y}};scene.cinematicFocus=storyShot.focus;
 if(kind==='lightAccident'){sound.effect('glass',.5);scene.impact();}else if(kind==='archiveAlarm'||kind==='floorFall'){sound.effect('shutter',.7);scene.impact();forcedCue='panic';}else if(kind==='powerPhone'||kind==='voiceReaction'){if(kind==='powerPhone')sound.phoneRing();else sound.effect('whisper',.4);forcedCue='panic';}else sound.effect('omenKnock',.5);
 if(kind==='cancelEyes'){scene.storyVerifier={x:storyShot.focus.x+32,y:storyShot.focus.y+12,hollowStage:0,age:4,target:state};noteManifestation(state,'hollow');}
 if(kind==='voiceReaction'){for(let i=0;i<12;i++){const angle=i*Math.PI/6,p={x:state.x+Math.cos(angle)*72,y:state.y+Math.sin(angle)*72};if(canMove(map,p.x,p.y)&&sight(map,state,p)){scene.echo={...p,elapsed:0,duration:3.6};storyShot.focus=p;break;}}storyShot.duration=3.6;}
 if(kind==='drainPursuit'&&enemy.follow(map,{x:17*32,y:12*32,targetX:state.x,targetY:state.y},state)){enemy.kind='hollow';enemy.hollowTime=35;enemy.grace=4;noteManifestation(state,'hollow');state.flags['met_relay_hollow_'+hollowStage(state)]=true;}
 updateSound();
}
function startExplorationShot(e){
 eventActive=true;keys.clear();state.running=false;enemy.reset();pursuerTrail=null;randomHunt.spare(75);huntDelay=0;thresholdHorror.active=null;scene.thresholdHorror=null;
 const point=worldFor(state).objects.find(o=>o.id===e.focus)||state;storyShot={kind:e.kind,elapsed:0,duration:2.4,focus:point,exploration:e};scene.cinematicFocus=point;sound.effect(e.sound,.6);updateSound();
}
function finishStoryShot(kind){
 const exploration=storyShot?.exploration;

 eventActive=false;storyShot=null;scene.cinematicFocus=null;scene.storyFalling=0;scene.storyVerifier=null;scene.storyLightFailure=false;forcedCue=null;keys.clear();
 if(exploration){scene.explorationShadow=null;scene.storyLightFailure=false;say('서하',exploration.line);return;}
 if(kind==='lightAccident'){
  const options=state.bag.includes('spareLight')?[['챙겨 둔 예비 작업등으로 교체한다',()=>{replaceWetLight(state);sound.effect('flashlightOn');say('서하','포장 안은 말라 있어. 켜졌다… 여기서는 발밑부터 보자.');}],['벽의 비상등을 따라 안전함으로 돌아간다',closeDialog]]:[['벽의 비상등을 따라 작업 안전함을 찾는다',closeDialog]];
  if(state.bag.includes('lighter'))options.unshift(['1층에서 챙긴 라이터를 켠다',()=>{useEmergencyLight(state,'lighter');sound.effect('lighter');say('서하','서윤의 봉투를 열 때 썼던 라이터… 불은 붙어. 손으로 가리고 안전함까지 가자.');}]);
  options.push(['휴대폰 화면으로 발밑을 비춘다',()=>{useEmergencyLight(state,'phone');say('서하','화면 밝기를 올렸다. 가까운 바닥 정도는 보여. 벽의 비상등 아래 안전함을 찾아야 해.');}]);
  say('서하','관에서 떨어진 물이 손전등 안으로 스며들었다. 빛이 떨리더니 꺼졌어.\n천장에 비친 건 내 그림자가 아니었어… 지금은 저 비상등을 따라가야 해.',options);return;
 }
 if(kind==='powerPhone'){say('서하','전기를 올리자 현관 인터폰이 울리기 시작했어. 이 시간에 누가…\n수화기 표시등이 깜빡이고 있어. 확인해 보자.');scene.focus=MAPS[state.map].objects.find(o=>o.id==='entry-intercom');}
 if(kind==='cancelEyes')say('서하','완료 표시는 켜져 있는데, 문이 열렸다는 칸은 비어 있어.\n저 눈… 내가 보지 않고 확인했다고 쓴 칸에서 번졌어. 서윤 얼굴이 아니야. 빈 기록이 나를 보고 있어.');
 if(kind==='intakeDoor')say('서하','봉투 안에 대조실 비품 열쇠가 있었어.\n문 뒤에서 먼저 잠금쇠가 울렸어… 아직 열쇠를 넣지도 않았는데. 내 취소 통화는 저 안에 있어.');
 if(kind==='archiveAlarm')stormChoice();
 if(kind==='floorFall'){
  state.map='relayDrain';state.x=9*32;state.y=8*32;state.flags.storyDrainEntered=true;scene.begin(state,worldFor(state));sound.effect('bloodDrip',.65);say('서하','철판이 발밑에서 접혔다. 봉투를 끌어안은 채 아래로 떨어졌어…\n다리는 움직여. 위로는 못 돌아가겠어. 물이 흐르는 방향으로, 올라갈 계단을 찾아야 해.');
 }
 if(kind==='powerReturn')say('서하',state.flags.storyHelpWitness?'전등이 위층까지 차례로 켜진다. 미정 씨가 내 팔을 잡았어.\n저 위에서… 방금 끊은 것처럼 전화가 울리고 있어. 원본은 아직 거기 있어.':'위층으로 전원이 올라가자 내선이 혼자 연결됐다.\n「언니, 아직 안 열렸어.」\n잘린 구간이야. 이번에는 데크 앞에서 끝까지 들어야 해.');
 if(kind==='voiceReaction'){
  learnFamilyBinding(state);const taken=state.bag.includes('relayExport'),actions=taken?[['봉투를 닫고 밖으로 향한다',closeDialog]]:[['내 목소리까지 포함한 원본을 챙긴다',()=>openRelayAction(MAPS.relaySignal.objects.find(o=>o.chapterAction==='lastVoice'),'collectOriginal')],['아직 데크에서 손을 뗀다',closeDialog]];
  say('서윤','언니. 이번에는… 끝까지 들었어?',[
   ['서윤의 목소리에 대답한다',()=>{state.flags.storyAcceptedCall=true;state.flags.storyRefusedCall=false;say('서하','네가 죽어서 나를 해치려는 게 아니었어. 문 앞에 와 달라는 말을 끝내지 못한 거야.\n문은 열리지 않았는데, 받은 사람이었던 내가 다 끝났다고 남기고 끊었으니까… 너는 그 대답 안에서 계속 기다렸어.\n피난문에도, 남은 원본에도, 그 말을 한 나한테도. 이번에는 네 말이 맞았다고, 내 목소리까지 남길게.',actions);}],
   ['아직 내 탓이라고 말할 수 없다',()=>{state.flags.storyRefusedCall=true;state.flags.storyAcceptedCall=false;say('서하','직접 잠근 건 정우였어. 내가 가도 못 열었을 수 있잖아…\n그런데 왜 아직도, 내 대답을 기다리는 거야. 이제 네가 무슨 말을 했는지는 다 알아 버렸는데.',[['데크에서 손을 뗀다',closeDialog],['그래도 내 통화까지 원본에 남긴다',()=>openRelayAction(MAPS.relaySignal.objects.find(o=>o.chapterAction==='lastVoice'),'collectOriginal')]]);}]
  ]);
 }
 if(kind==='drainPursuit'){
  const map=worldFor(state),entry={x:17*32,y:12*32,targetX:state.x,targetY:state.y};
  if(!state.flags.storyDrainEscaped&&!enemy.active&&enemy.follow(map,entry,state)){enemy.kind='hollow';enemy.hollowTime=35;enemy.grace=4;state.flags['met_relay_hollow_'+hollowStage(state)]=true;}
  say('서하','우회관이 멎자, 다른 물소리가 들렸어.\n저건 내가 낸 소리가 아니야. 열린 남쪽 수문으로 빠져나가자.');
 }
 updateSound();
}
function updateStoryShot(t,dt){
 const shot=storyShot;shot.elapsed+=dt;
 if(shot.exploration){const e=shot.exploration;scene.storyLightFailure=shot.elapsed*1000+1;scene.storyVerifier=e.eyes&&shot.elapsed>.8&&shot.elapsed<1.05?{x:shot.focus.x,y:shot.focus.y+40,hollowStage:0,age:4,target:state}:null;scene.explorationShadow=e.shadow?{x:shot.focus.x-40+shot.elapsed*32,y:shot.focus.y+24,opacity:Math.sin(Math.min(1,shot.elapsed/2.4)*Math.PI)}:null;if(!scene.reduced)scene.shake=shot.elapsed>.8&&shot.elapsed<1.1?.18:0;}

 if(shot.kind==='lightAccident'){scene.storyLightFailure=true;scene.storyVerifier=shot.elapsed>.7&&shot.elapsed<.9?{x:shot.focus.x,y:shot.focus.y+55,hollowStage:0,age:4,target:state}:null;} scene.cinematicFocus=shot.focus;
 if(shot.kind==='floorFall'){scene.storyFalling=Math.min(1,shot.elapsed/shot.duration);if(!scene.reduced)scene.shake=.12;}
 scene.draw(state,t,dt,null,false,enemy);atmosphere.update(state,worldFor(state),enemy,t,dt,false);
 if(shot.kind==='floorFall'){const c=canvas.getContext('2d');c.fillStyle=`rgba(0,0,0,${Math.max(0,(shot.elapsed/shot.duration-.55)/.45)})`;c.fillRect(0,0,canvas.width,canvas.height);}
 if(shot.elapsed>=shot.duration)finishStoryShot(shot.kind);
}
let ringClock=0,ringState=null;
function answerPhone(o){
 const call=callFor(state,o.id);if(!call)return;if(pickupBlocked(state)){say('서하','수화기를 잡을 손이 없어. F로 손전등을 내려놓자.');return;}
 say('서하','수화기 안쪽에서 연결음이 떨린다.',[["수화기를 들어 전화를 받는다",()=>{scene.focus=o;scene.receiver=o.id;sound.effect('puzzleTurn',.5);say(call.speaker,call.first,[[call.question,()=>say('서하',call.question,[["상대의 대답을 듣는다",()=>{sound.effect('whisper',.3);say(call.speaker,call.reply,[["수화기를 내려놓는다",()=>{state.flags[call.flag]=true;scene.receiver=null;addNote(call.flag,call.last);closeDialog();say('서하',call.last);}]]);}]] )]]);}],["아직 받지 않는다",closeDialog]]);
}
let roomTimer;
function revealRoom(name) {
  clearTimeout(roomTimer);
  $("room-reveal").textContent = name;
  $("room-reveal").classList.add("show");
  roomTimer = setTimeout(() => $("room-reveal").classList.remove("show"), 2500);
}
function render(t) {
  requestAnimationFrame(render);
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  if (!started) return;
  observeAcquisitions(t);
  if(ringState!==state){ringState=state;ringClock=0;}ringClock=Math.max(0,ringClock-dt);if(!ringClock&&!dialog&&!phone&&!eventActive&&!traveling&&!enemy.active){const ringing=worldFor(state).objects.find(o=>callFor(state,o.id));if(ringing){sound.phoneRing();ringClock=7;}}
  if(document.hidden){stillness.reset();return;}
  if(!$("death-screen").hidden){
    const pose=captureAnimation.draw(dt,scene.reduced);
    if(pose.done&&!captureFinished){
      captureFinished=true;$("death-result").hidden=false;
      renderDeathSlots();
      $("death-retry").disabled=false;$("death-retry").focus();
    }
    return;
  }
  if(!$('injury-screen').hidden){const pose=injuryAnimation.draw(dt*2,scene.reduced);if(pose.done&&!injuryFinished){injuryFinished=true;$('injury-result').hidden=false;$('injury-resume').disabled=false;$('injury-resume').focus();}return;}
  if(mirrorView.active){const m=mirrorView.draw(dt,scene.reduced);if(m.laugh)sound.effect('mirrorLaugh',.5);if(m.closable&&$('mirror-close').disabled){$('mirror-close').disabled=false;$('mirror-close').focus();}return;}
  if(storyShot){updateStoryShot(t,dt);return;}
  if(!eventActive&&!dialog&&!phone&&!traveling){const beat=nextStoryBeat(state)||(!enemy.active&&!pursuerTrail?explorationBeat(state)?.kind:null);if(beat){startStoryShot(beat);if(storyShot)updateStoryShot(t,dt);return;}}
  if(arrivalScene.active){arrivalScene.update(enemy,worldFor(state),state,dt);scene.cinematicFocus=arrivalScene.focus(enemy,state);scene.draw(state,t,dt,null,false,enemy);atmosphere.update(state,worldFor(state),enemy,t,dt,false);if(!arrivalScene.active){scene.cinematicFocus=null;eventActive=false;forcedCue=null;keys.clear();canvas.focus();}return;}
  if(lockCinematic>0){lockCinematic=Math.max(0,lockCinematic-dt);scene.draw(state,t,dt,null,false,enemy);if(!lockCinematic){eventActive=false;scene.cinematicFocus=null;say('서하','문이 닫혔어… 종이를 꺼낸 것뿐인데.\n밖에서 누가 두드리고 있어. 숨을 죽이자.');scene.focus=MAPS.relaySignal.objects.find(o=>o.id==='relay-quiet-inner-door');}return;}
  if(state.flags.relayTrapPending&&!dialog&&!eventActive&&!enemy.active&&!traveling&&beginLockEvent(state)){state.flags.relayTrapPending=false;huntDelay=0;huntCooldown=60;randomHunt.spare(90);sound.effect('doorClose');sound.effect('thud',.5);eventActive=true;keys.clear();lockCinematic=2;thresholdHorror.active=null;scene.thresholdHorror=null;scene.cinematicFocus=MAPS.relaySignal.objects.find(o=>o.id==='relay-quiet-inner-door');}
  const knock=tickLockEvent(state,dt,!dialog&&!phone&&!eventActive&&!traveling);if(knock){sound.effect('omenKnock',.7,Math.max(-.8,Math.min(.8,(13*32-state.x)/250)));if(!scene.reduced)scene.shake=.16;}
  const decay=advanceDistortion(state,dt,!eventActive&&!dialog&&!phone&&!traveling&&document.hasFocus());
  if(decay){sound.effect('scrape',.2);addNote('building-change-'+decay,['','같은 복도 바닥에 마르지 않는 얼룩이 늘었다.','벽의 이음새에서 검붉은 줄기가 흘러내린다.','다시 돌아와도 얼룩은 지워지지 않는다. 가구의 그림자만 길어졌다.'][decay]);}
  if(!canHoldLight(state)||state.flags.flashlightBroken)state.flashlight=false;
  let dx = 0,
    dy = 0;
  if (!eventActive && !dialog && !phone && !traveling) {
    [dx, dy] = locomotion(
      state,
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0),
      keys.has("shift"),
      dt,
      worldFor(state),
    );
    if(pursuerTrail){
      pursuerTrail.remaining-=dt;
      if(pursuerTrail.remaining<=0){const trail=pursuerTrail;pursuerTrail=null;
        if(enemy.follow(worldFor(state),trail.entry,state)){enemy.kind=trail.kind||'jeongwoo';if(enemy.kind==='hollow'||enemy.kind==='redlight'||isRelayGhost(enemy.kind))enemy.hollowTime=35;sound.effect('apparition');scene.apparition();scene.haunt('뒤돌아보지 마');toast('그가 방금 지나온 문을 밀고 들어왔다.');}
      }
    }
    if(randomHunt.update(worldFor(state),state,dt,enemy,!thresholdHorror.active&&!state.flags.relayTrapActive&&!pursuerTrail&&!stillness.active&&!state.hidden&&document.hasFocus())){huntDelay=0;forcedCue=null;scene.apparition();}
    huntCooldown = Math.max(0, huntCooldown - dt);
    if (huntDelay > 0) {
      huntDelay -= dt;
      if (
        huntDelay <= 0 &&
        !enemy.active &&
        canHunt()
      ) {
        if (enemy.spawn(worldFor(state), state)) {
          sound.effect("apparition");
          scene.apparition();scene.haunt('문을 닫은 건 너였어');
          lastGhostMotion=null;
          toast(state.flags.chapter2?'복도 끝에서 무언가 소리를 듣고 있다.':'정우의 그림자가 깨어났다. 뛰거나, 불을 끄고 숨자.');
        }
      }
    }
    const zone=ECHO_ZONES[state.map];
    if(zone&&!enemy.active&&state.flags.power&&!state.hidden&&!state.flags['echo_'+state.map]&&Math.hypot(state.x-zone.x,state.y-zone.y)<zone.radius){
      state.flags['echo_'+state.map]=true;scene.appear(...zone.at,zone.text);sound.effect('scrape');addNote('echo_'+state.map,'서윤의 잔상. 돌아보려는 순간 얼굴이 나를 향했다. 추격하는 정우와는 다른 모습이었다.');
    }
    if(state.flags.chapter2&&!state.hidden&&!enemy.active){
      const map=worldFor(state),portrait=map.objects.find(o=>o.hauntedPortrait&&Math.hypot(state.x-o.x,state.y-o.y)<170&&sight(map,state,o));
      if(portrait){
        const seen='portrait_seen_'+portrait.id,escaped='portrait_gone_'+portrait.id;
        if(!state.flags.relaySlide)state.flags[seen]=true;
        if(state.flags.relaySlide&&state.flags[seen]&&!state.flags[escaped]){
          state.flags[escaped]=true;sound.effect('apparition');scene.haunt('그림 안에는 아무도 없어');
          const x=state.x-Math.cos(state.facing)*70,y=state.y-Math.sin(state.facing)*70;
          if(canMove(map,x,y)&&sight(map,state,{x,y}))scene.appear(x,y,'뒤에서 보고 있어');
          toast('액자는 비어 있다. 내 뒤에서 옷자락 소리가 났다.');
        }
      }
    }
    if(enemy.active){stillness.reset();scene.echo=null;roomHaunts.active=null;scene.omen=null;}
    if(introduceEnemy())return;
    const result = enemy.update(worldFor(state), state, dt);
    if(enemy.doorEvent){const e=enemy.doorEvent;enemy.doorEvent=null;sound.effect(e.opened?'door':'omenKnock',.65);toast(e.opened?'손잡이가 끝까지 돌아갔다. 문이 밀려 열린다.':'문 반대편에서 손잡이를 더듬는 소리가 난다.');}
    if(enemy.signalEvent){if(enemy.signalEvent==='turn'){sound.effect('whisper',.4);toast('고개가 돌아온다…');}enemy.signalEvent=null;}
    if (result === "caught") handleCapture(enemy.kind);
    if (result === "escaped") {
      huntCooldown = state.flags.chapter2 ? 120 : 100;
      toast(enemy.kind==='redlight'?'멀리서 들리던 웃음이 잦아들었다.':'발소리가 멀어졌다.');
      forcedCue = "relief";
      setTimeout(() => {
        forcedCue = null;
      }, 4500);
    }
    if (
      !enemy.active &&
      !pursuerTrail &&
      !huntDelay &&
      !huntCooldown &&
      canHunt() && !state.ending
    )
      huntDelay = state.flags.chapter2 ? 140 : 100;
  }
  const urge=progressHaunt.update(state,dt,!thresholdHorror.active&&!state.flags.relayTrapActive&&!eventActive&&!dialog&&!phone&&!traveling&&!state.hidden&&!enemy.active&&!pursuerTrail&&!state.ending&&document.hasFocus());
  if(urge?.kind==='warning'){sound.effect('whisper',.55);scene.haunt('언제까지 모른 척할 거야');toast('속삭임이 끊겼다.');}
  if(urge?.kind==='insist'){
    if(canHunt()&&enemy.spawn(worldFor(state),state)){sound.effect('apparition');scene.apparition();scene.haunt('대답할 때까지 기다릴게');}
    else if(state.flags.chapter2){scene.haunt('수화기를 내려놓지 마');sound.effect('scrape',.35);}
    else{
      const map=worldFor(state);for(let i=0;i<8;i++){const angle=state.facing+Math.PI+i*Math.PI/4,x=state.x+Math.cos(angle)*110,y=state.y+Math.sin(angle)*110;if(canMove(map,x,y)&&sight(map,state,{x,y})){scene.appear(x,y,'찾아 줘. 아직 여기 있어');sound.effect('scrape',.5);break;}}
    }
  }
  const idle=stillness.update(worldFor(state),state,dt,Math.hypot(dx,dy),!thresholdHorror.active&&!state.flags.relayTrapActive&&!eventActive&&!dialog&&!phone&&!traveling&&!state.hidden&&!enemy.active&&!pursuerTrail&&!state.ending&&document.hasFocus());
  if(idle?.kind==='warning'){sound.effect('whisper',.65);toast('가만히 있는데, 다른 사람의 숨소리가 가까워진다.');}
  if(idle?.kind==='appear'&&state.flags.chapter2){if(enemy.spawn(worldFor(state),state)){sound.effect('apparition');scene.apparition();}stillness.reset();}
  if(idle?.kind==='appear'&&!state.flags.chapter2){scene.appear(idle.x,idle.y,'왜 여기서 기다려');scene.echo.idle=true;scene.echo.duration=6.4;sound.effect('apparition');toast('정우가 아니다. 서윤의 잔상이 한 걸음씩 다가온다. 움직여서 벗어나자.');}
  if(idle?.kind==='disperse'&&scene.echo?.idle){scene.echo=null;toast('움직이자, 뒤의 숨소리가 끊겼다.');}
  if(!stillness.active&&scene.echo?.idle)scene.echo=null;
  if((dialog||phone)&&!traveling)locomotion(state,0,0,false,dt,worldFor(state));
  const beforeWalk=scene.walk;scene.moved(dx, dy, dt, state.running);
  if(!scene.moving&&!dialog&&!phone&&!state.hidden)scene.direction=facingDirection(Math.cos(state.facing),Math.sin(state.facing));
  if(scene.moving&&(bodyState(state).leg?Math.floor(scene.walk/4)>Math.floor(beforeWalk/4):footContacts(beforeWalk,scene.walk))){if(bodyState(state).legs===2)sound.effect('scrape',.18);else sound.step(inPuddle(state)?'water':worldFor(state).floor,state.running);}
  if (enemy.active) {
    heartClock += dt;
    if (heartClock > 1.1) {
      heartClock = 0;
      sound.heartbeat();
    }
  }
  if(enemy.active&&!eventActive&&!dialog&&!phone){
    const distance=Math.hypot(enemy.x-state.x,enemy.y-state.y);
    ghostStepClock+=dt;
    if(enemy.motion==='lunge'&&lastGhostMotion!=='lunge'){sound.effect('rush');scene.impact();}
    if(enemy.kind!=='hollow'&&(enemy.kind!=='redlight'||enemy.punish)&&distance<420&&ghostStepClock>(enemy.kind==='hollow'?2.8:enemy.motion==='lunge'?.18:enemy.motion==='crawl'?.38:.7)){
      ghostStepClock=0;sound.effect(enemy.kind==='hollow'?'bloodDrip':'scrape',Math.max(.1,1-distance/460)*(enemy.kind==='hollow'?.35:1));
    }
    lastGhostMotion=enemy.motion;
  }else{ghostStepClock=0;lastGhostMotion=null;}
  const map = worldFor(state);
  scene.map=map;
  const omen=roomHaunts.update(map,state,dt,!eventActive&&!dialog&&!phone&&!traveling&&document.hasFocus(),enemy.active||!!pursuerTrail||!!stillness.active||!!thresholdHorror.active||!!state.flags.relayTrapActive);
  scene.omen=roomHaunts.active;
  const threshold=thresholdHorror.update(map,state,dt,!eventActive&&!dialog&&!phone&&!traveling&&!enemy.active&&!pursuerTrail&&!state.flags.relayTrapActive&&!roomHaunts.active&&!stillness.active);scene.thresholdHorror=thresholdHorror.active;
  if(threshold?.kind==='shadow'){sound.effect('scrape',.25,Math.max(-.8,Math.min(.8,(threshold.door.x-state.x)/300)));}
  if(threshold?.kind==='ended'){const key='seoDoorShadow'+(state.flags.chapter2?'2':'1');if(!state.flags[key]){state.flags[key]=true;say('서하','문틈으로… 누가 지나갔어.\n발소리는 멎었는데, 아직 저쪽에 있는 것 같아.');scene.focus=threshold.door;}const chair=map.objects.find(o=>o.swivel&&Math.hypot(o.x-state.x,o.y-state.y)<220);if(chair)scene.chairTurns.set(chair.id,t);}
  if(omen&&!thresholdHorror.active){sound.effect(omen.sound,omen.kind==='knock'?.6:.4);if(!scene.reduced&&omen.swivel&&omen.kind==='knock')scene.chairTurns.set(omen.fixture,t);if(!scene.reduced&&omen.kind==='shadow')scene.shake=.12;}

  scene.npcs=[...residents.update(map,state,dt,!eventActive&&!dialog&&!phone&&!traveling,enemy)];
  for(const n of scene.npcs)if(state.flags['npcEscaped_'+n.id]&&!state.flags['npcEscapeReacted_'+n.id]){state.flags['npcEscapeReacted_'+n.id]=true;scene.burst(n.x,n.y-20,'blood');sound.effect('screamAlt',.6);scene.impact();toast(n.name+'의 몸이 붙잡혔다. 소매와 그림자의 일부가 뜯긴 채 빠져나온다.');addNote('npc-escape-'+n.id,n.name+'도 같은 괴이에게 잡혔다. 잃은 윤곽을 남기고 빠져나왔다. 구조가 필요하다.');}
  const background=crowd.update(map,state,dt,!eventActive&&!dialog&&!phone&&!traveling,enemy);
  if(state.flags['crowdCaught_'+map.id]&&!state.flags['crowdCaughtReacted_'+map.id]){state.flags['crowdCaughtReacted_'+map.id]=true;sound.effect('screamAlt',.65);scene.impact();toast('도망치던 사람의 발소리가 끊겼다. 돌아보니… 방금 있던 자리가 비었다.');}
  scene.npcs.push(...background);
  if(startNpcScream(state,map,scene.npcs.filter(n=>n.npc&&sight(map,state,n)),enemy,!thresholdHorror.active&&!eventActive&&!dialog&&!phone&&!traveling&&!pursuerTrail)){sound.effect('screamAlt',.65);sound.crowdLevel(0);for(const n of scene.npcs.filter(n=>n.npc)){n.panic=3;n.wait=3;n.moving=false;n.direction=2;n.reactionLine=FEAR_LINES[n.id];}addNote('crowd-scream',map.outdoor?'건물 안쪽에서 여성의 비명이 났다. 밖에 있던 동행인들도 소리 난 쪽을 돌아봤다.':'군중 사이에서 여성의 비명이 터졌다. 다른 사람들도 소리 난 쪽을 돌아봤다.');}

  const reaction=protagonistReaction(state,scene.npcs.filter(n=>n.npc&&sight(map,state,n)),!thresholdHorror.active&&!eventActive&&!dialog&&!phone&&!traveling&&!enemy.active&&!pursuerTrail&&!stillness.active&&!progressHaunt.warned);
  if(reaction?.line){state.running=false;state.facing=Math.atan2(reaction.target.y-state.y,reaction.target.x-state.x);keys.clear();say('서하',reaction.line,[['숨을 고른다',closeDialog]]);scene.focus=reaction.target;addNote('seo-reaction-'+reaction.kind+'-'+npcCorruption(state),reaction.line);}

  sound.crowdLevel(state.flags.chapter2&&!eventActive&&!state.hidden&&!enemy.active&&!pursuerTrail&&!stillness.active&&!progressHaunt.warned&&!(state.flags.npcScreamHeard&&(state.relayExposure||0)-(state.npcScreamAt||0)<5)?Math.min(.5,background.filter(n=>Math.hypot(n.x-state.x,n.y-state.y)<320).length*.12)*((dialog||phone) ? .3 : 1):0,state.flags.relayPower);
  nearest = state.hidden ? null : nearestObject(map,state);
  const person=!state.hidden?residents.nearest(map,state):null;
  if(person&&((state.flags['npcInjured_'+person.id]&&Math.hypot(person.x-state.x,person.y-state.y)<64)||!nearest||Math.hypot(person.x-state.x,person.y-state.y)<Math.hypot(nearest.x-state.x,nearest.y-state.y)-8))nearest=person;
  $("interaction").hidden =
    (!nearest && !state.hidden) || dialog || phone || traveling;
  $("interaction").querySelector("span").textContent = state.hidden
    ? "숨은 곳에서 나온다"
    : (nearest?.id === "exit" && state.flags.shutterOpen ? "열린 현관 · 밖으로" : nearest?.name) || "";
  $("objective").textContent = objective();$("objective").hidden=!!state.flags.chapter2;
  if ($("room-name").textContent !== map.name) {
    $("room-name").textContent = map.name;
    document.querySelector('.game-top .eyebrow').textContent=state.flags.chapter2?'원본 대조 · 2026.11.04 02:13 / 산북중계소':'철거 예정 06:00 / 현재 23:41';
    document.querySelector('.chapter').textContent=state.flags.chapter2?'CHAPTER 02 · 회신을 기다리는 곳':'NIGHT 01 · 마지막 입주자';
    const floor={basement:'B1F',upper:'02F',relayPlant:'B1F',relayDrain:'B2F',relayService:'B1F',relayWorkshop:'B1F',relayStore:'B1F',rearCourt:'OUTSIDE',relaySignal:'02F',relayYard:'OUTSIDE'}[state.map]||'01F';
    document.querySelector('.stage-label').replaceChildren(document.createTextNode(state.flags.chapter2?'SANBUK RELAY STATION ':'WOLGYE APARTMENT '),Object.assign(document.createElement('span'),{textContent:floor}));
    canvas.setAttribute('aria-label',map.name+' 탐색 지도');
    revealRoom(map.name);
  }
  const area=map.rooms.filter(r=>state.x>=r.x*32&&state.x<(r.x+r.w)*32&&state.y>=r.y*32&&state.y<(r.y+r.h)*32).at(-1);
  $("area-name").textContent=area?.name||map.name;
  $("status").textContent = state.hidden
    ? "숨을 죽이고 있다."
    : enemy.active
      ? enemy.mode === "chase"
        ? "발소리가 가까워진다."
        : "그가 마지막으로 본 자리를 찾고 있다."
      : "[Shift] 달리기  ·  [F] 손전등  ·  [E] 조사";
  $("touch-run").disabled=bodyState(state).leg;$("touch-light").disabled=!canHoldLight(state);
  $("stamina-fill").style.width = state.stamina + "%";
  $("stamina").classList.toggle("low", state.stamina < 28);
  $("stamina-value").textContent = bodyState(state).leg?"—":state.exhausted
    ? "숨 고르기"
    : Math.ceil(state.stamina) + "%";
  const bodyText=bodyDescription(state);$("body-state").hidden=!bodyText;$("body-state").textContent=bodyText;
  $("flash-state").textContent = !canHoldLight(state) ? "LIGHT / —" : !state.bag.includes("flashlight") ? "LIGHT / 미소지" : state.flags.flashlightBroken ? (state.flags.temporaryLighter?"LIGHT / 라이터":state.flags.temporaryPhone?"LIGHT / 휴대폰":"LIGHT / 침수") : state.flags.lightStowed ? "LIGHT / 내려놓음" : state.flashlight
    ? "LIGHT / ON"
    : "LIGHT / OFF";
  $("threat").textContent = pursuerTrail ? "층간 추적 중 — 문 너머에서 따라온다" : enemy.active
    ? enemy.mode === "chase"
      ? (bodyState(state).leg?"발각됨 — 장애물을 돌아 숨으세요":"발각됨 — 달리거나 숨으세요")
      : "수색 중 — 불을 끄고 숨으세요"
    : "";
  if(enemy.active&&isRelayGhost(enemy.kind))$('threat').textContent=enemy.kind==='listener'?'발소리가 멎자, 귀가 기울어진다…':'열쇠 소리가 복도 끝에서 다가온다…';
  if(enemy.active&&enemy.kind==='redlight')$('threat').textContent=enemy.punish?'웃음이 가까워진다…':enemy.signal==='watch'?'저 얼굴이 이쪽을 보고 있다.':enemy.signal==='turn'?'고개가 돌아온다…':'등을 돌렸다. 지금이라면…';
  $("threat").hidden = !enemy.active&&!pursuerTrail;
  updateSound();
  if(state.hideSpot?.opening>0&&state.hideSpot.opening<.1&&!state.flags.hideOpeningHeard){sound.effect('scrape');state.flags.hideOpeningHeard=true;}
  if(!state.hidden)state.flags.hideOpeningHeard=false;
  const illusion=hallucinations.update(state,dt,!eventActive&&!dialog&&!phone&&!traveling&&!enemy.active&&!state.hidden&&document.hasFocus());
  if(illusion){sound.effect('hallucination',illusion==='severe'?.85:.55);scene.appear(state.x+55,state.y-24,'확인했습니다');if(illusion==='severe')scene.haunt('확인하지 않았어');}
  $('sanity-meter').hidden=!state.flags.chapter2;$('sanity-meter').textContent=state.flags.chapter2?'정신력 '+sanity(state):'';
  $('play-screen').classList.toggle('fractured',!!state.flags.chapter2&&sanity(state)<=20);
  scene.draw(state, t, dt, nearest, dialog, enemy);
  atmosphere.update(state,worldFor(state),enemy,t,dt,started&&!eventActive);
}
$("dialog-text").onclick = finishTyping;
$("new-game").disabled = true;
scene.assets.then(
  () => {
    $("new-game").disabled = false;
  },
  (e) => toast(e.message),
);
$("new-game").onclick = () => begin();
$("continue").onclick = () => begin(true);
$("phone-open").onclick = () =>
  started ? openPhone() : toast("새 게임을 시작하면 휴대폰을 사용할 수 있다.");
$("phone-close").onclick = closePhone;
$("phone-app-back").onclick = phoneHome;
$("phone-home-button").onclick = phoneHome;
$("phone-hint-dismiss").onclick = () => { state.flags.phoneLearned = true; $("phone-hint").hidden = true; };
$("sound").onclick = toggleAudio;
$("touch-interact").onclick = interact;
document
  .querySelectorAll("[data-app]")
  .forEach((b) => (b.onclick = () => app(b.dataset.app)));
for (let i = 0; i < 24; i++) $("windows").append(document.createElement("div"));
function flashlight() {
 if(!started||eventActive||dialog||phone||state.hidden)return;
 if(state?.flags.flashlightBroken){if(state.flags.temporaryLighter||state.flags.temporaryPhone){stowLight(state,true);toast('임시 조명을 내려놓았다.');return;}state.flags.lightStowed=false;const source=state.bag.includes('lighter')?'lighter':'phone';useEmergencyLight(state,source);sound.effect(source==='lighter'?'lighter':'flashlightOff');toast(source==='lighter'?'라이터 불을 손으로 가렸다.':'휴대폰 화면으로 가까운 바닥을 비췄다.');return;}
  if (!started || eventActive || dialog || phone || state.hidden) return;
  if(!state.bag.includes("flashlight")){toast("접수대에서 손전등을 먼저 챙겨야 한다.");return;}
  if(!canHoldLight(state)){state.flashlight=false;toast("잡으려 해도 두 소매만 흔들린다.");return;}
  stowLight(state,state.flashlight||!state.flags.lightStowed);
  sound.effect(state.flashlight ? "flashlightOn" : "flashlightOff");
  toast(
    state.flashlight ? (bodyState(state).arms===1?"남은 손으로 손전등을 들어 올렸다.":"손전등을 들어 올렸다.") : "손전등을 내려놓았다. 손이 비었다.",
  );
}
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if(e.repeat&&["e","enter"," "].includes(k)){e.preventDefault();return;}
  if (eventActive) {
    if(!$('roster-modal').hidden){if(k==='tab'){e.preventDefault();const buttons=[...$('roster-modal').querySelectorAll('button:not([hidden])')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}if(k==='escape'||k==='e')$('roster-close').click();return;}
    if(arrivalScene.active){e.preventDefault();return;}
    if(mirrorView.active){if(k==='tab'){e.preventDefault();if(!$('mirror-close').disabled)$('mirror-close').focus();}if((k==='e'||k==='escape')&&!$('mirror-close').disabled)$('mirror-close').click();return;}
    if(!$('reasoning-panel').hidden){reasoning.key(e);return;}
    if(!$('roll-panel').hidden){if(k==='tab'){e.preventDefault();$('roll-button').focus();}return;}

    if(!$("puzzle-modal").hidden){puzzlePanel.key(e);if(!["enter"," ","tab"].includes(k))e.preventDefault();return;}
    if(!$('injury-screen').hidden){if(k==='tab'){e.preventDefault();if(injuryFinished)$('injury-resume').focus();}else if(!injuryFinished)e.preventDefault();return;}
    if(!$("death-screen").hidden){
      if(k==='tab'){e.preventDefault();if(captureFinished){const bs=[...$('death-result').querySelectorAll('button:not(:disabled):not([hidden])')],i=bs.indexOf(document.activeElement);bs[(i+(e.shiftKey?-1:1)+bs.length)%bs.length]?.focus();}}
      else if(!captureFinished)e.preventDefault();
      return;
    }
    if(!$('story-sequence').hidden&&k==='tab'){
      e.preventDefault();const buttons=[...$('story-actions').querySelectorAll('button:not(:disabled)')];
      if(buttons.length){const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}return;
    }
    if(!$('story-sequence').hidden&&$('story-sequence').dataset.mode==='departure'&&k==='escape'){$('story-actions').querySelector('button:last-child').click();return;}
    if (!["tab","enter"," "].includes(k))e.preventDefault();return;
  }
  if (e.target.matches("input,select") && k !== "escape") return;
  if (k === "escape") {
    if (dialog){scene.receiver=null;closeDialog();}
    else if (phone) {if(phoneApp)phoneHome();else closePhone();}
    return;
  }
  if (k === "tab" && !dialog) {
    e.preventDefault();
    phone ? closePhone() : openPhone();
    return;
  }
  if (dialog && (k === "e" || k === " ")) {
    e.preventDefault();
    if (!finishTyping()) {
      const b = $("dialog-actions").querySelector("button");
      if (b?.textContent === "계속") b.click();
    }
    return;
  }
  if (dialog || phone || traveling) return;
  if (k === "f" && !e.repeat) {
    flashlight();
    return;
  }
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k))
    e.preventDefault();
  if (k === "e" || k === "enter") {
    e.preventDefault();if (!e.repeat) interact();
    return;
  }
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (sound.ctx) {
    if (document.hidden) sound.ctx.suspend();
    else sound.ctx.resume();
  }
});
for (const b of document.querySelectorAll("[data-move]")) {
  const key = { up: "w", down: "s", left: "a", right: "d" }[b.dataset.move];
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    keys.add(key);
  };
  b.onpointerup =
    b.onpointercancel =
    b.onlostpointercapture =
      () => keys.delete(key);
}
$("touch-run").onpointerdown = (e) => {
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  keys.add("shift");
};
$("touch-run").onpointerup =
  $("touch-run").onpointercancel =
  $("touch-run").onlostpointercapture =
    () => keys.delete("shift");
$("touch-light").onclick = flashlight;
canvas.addEventListener("pointermove", (e) => {
  if (
    !started ||
    eventActive ||
    dialog ||
    phone ||
    traveling ||
    e.pointerType !== "mouse" ||
    !scene.view
  )
    return;
  const r = canvas.getBoundingClientRect(),
    v = scene.view,
    x = ((e.clientX - r.left) * canvas.width) / r.width / v.z + v.cx,
    y = ((e.clientY - r.top) * canvas.height) / r.height / v.z + v.cy;
  state.facing = Math.atan2(y - state.y, x - state.x);
  if (!scene.moving)
    scene.direction = facingDirection(Math.cos(state.facing), Math.sin(state.facing));
});
requestAnimationFrame(render);
