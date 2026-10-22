import { STORY, CINEMATICS, ORIGINALS, canSurrender } from "./story.js?v=55c5ee831762";
import { Scene, facingDirection } from "./scene.js?v=55c5ee831762";
import { MAPS, sight, canMove, worldFor, nearestObject, ECHO_ZONES } from "./world.js?v=55c5ee831762";
import { locomotion, Pursuer, StillnessHaunt } from "./mechanics.js?v=55c5ee831762";
import { enterChapterTwo, relayObjective, relayAction, migrateStorySave } from "./chapter.js?v=55c5ee831762";
import { AudioDirector, TRACKS } from "./audio.js?v=55c5ee831762";
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
} from "./state.js?v=55c5ee831762";
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
const scene = new Scene(canvas, MAPS.lobby),
  stillness = new StillnessHaunt(),
  enemy = new Pursuer(),
  sound = new AudioDirector((message) => toast(message));
function toast(text) {
  clearTimeout(toastTimer);
  $("toast").textContent = text;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3200);
}
function cue() {
  if(!$('story-sequence').hidden&&forcedCue)return forcedCue;
  return enemy.active
    ? enemy.mode === "chase" ? "chase" : "hunt"
    : pursuerTrail || stillness.active ? "hunt" : state.ending
      ? ["witness","surrender","signal","fragment"].includes(state.ending)
        ? "aftermath"
        : "reliefAlt"
      : forcedCue ||
        {
          lobby: "lobby",
          management: state.flags.locker ? "evidence" : "deduction",
          apartment: state.flags.seen_home_desk ? "warm" : "home",
          basement: state.flags.power ? "motif" : "basement",
          upper: state.flags.listened ? "panic" : "upper",
          relayEntry: "missing",
          relayArchive: "deduction",
          relayPlant: "basement",
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
  dialogReturn = document.activeElement;
  dialog = true;
  keys.clear();
  $("speaker").textContent = speaker;
  $("portrait").hidden = speaker !== "서하";
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
function pickup(key) {
  if (!state.bag.includes(key)) {
    take(state, key);
    sound.effect("item");
    scene.burst(nearest?.x||state.x,nearest?.y||state.y,"spark");
    toast(`${ITEMS[key]} 획득 · 기록 앱에서 단서 확인`);
  }
}
function canHunt(mapId=state.map){
 if(state.ending||state.bag.includes('relayExport'))return false;
 return state.flags.chapter2?state.flags.relayPower&&['relayArchive','relayPlant','relaySignal'].includes(mapId):state.flags.power&&['basement','upper'].includes(mapId);
}
function openRelayAction(o,choice=null){
 const r=relayAction(state,o,choice);if(!r)return;
 if(r.sound)sound.effect(r.sound);
 if(r.haunt)scene.haunt(r.haunt);
 if(r.hunt)huntDelay=r.hunt;
 if(r.exported){enemy.reset();pursuerTrail=null;huntDelay=0;stillness.reset();}
 if(r.cinematic){playCinematic(r.cinematic);return;}
 const actions=r.choices?[...r.choices.map(([label,key])=>[label,()=>openRelayAction(o,key)]),['돌아가기',closeDialog]]:undefined;
 say(r.title,r.text,actions);
}
function startChapterTwo(){
 if(!enterChapterTwo(state))return;
 closeDialog();enemy.reset();pursuerTrail=null;huntDelay=0;huntCooldown=45;stillness.reset();
 scene.begin(state,worldFor(state));revealRoom('제2장 · 회신을 기다리는 곳');
 say('제2장 · 산북 시설중계소',state.notes.find(n=>n.id==='chapter2-arrival').text+'\n\n접수동은 남쪽 대기실, 북서쪽 접수실, 북동쪽 당직실로 나뉜다. 먼저 서쪽 접수실의 인계 기록을 확인하자.\n\nTab: 휴대폰 · 기록/소지품/지도 · 저장 슬롯은 이전 챕터와 함께 사용할 수 있다.');
}
function objective() {
  if(state.flags.chapter2&&!state.hidden&&!enemy.active)return relayObjective(state);
  if (state.ending) return "기억의 끝";
  if (state.hidden) return "숨을 죽인다 · E로 나오기";
  if (enemy.active)
    return enemy.mode === "chase"
      ? "그가 들었다. Shift로 달리고, 청소함에 숨어라."
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
  if(state.flags.listened&&!state.bag.includes("receipt"))return "101호 주방 식탁 · 원본 접수증을 챙겨 취소 서명과 안내를 확인한다";
  if(!state.flags.shutterOpen)return "2층 방송 조정실 · 오른쪽 비상 제어반으로 현관 셔터를 연다";
  return "1층 현관으로 돌아가 기록의 운명을 결정한다";
}
function transition(to, spawn, portal = null) {
  if (traveling) return;
  traveling = true;
  stillness.reset();
  keys.clear();
  const from=state.map,following=enemy.active||!!pursuerTrail;
  const arrival=MAPS[to].objects.find(o=>o.to===from);
  pursuerTrail=following?{map:to,remaining:2.4,entry:{x:arrival?.x??spawn[0]*32,y:arrival?.y??spawn[1]*32,targetX:spawn[0]*32,targetY:spawn[1]*32}}:null;
  enemy.reset();
  huntDelay = 0;
  state.hidden = false;
  sound.effect("door");
  $("travel").textContent = MAPS[to].name;
  $("travel").hidden = false;
  setTimeout(() => {
    state.map = to;
    [state.x, state.y] = spawn.map((n) => n * 32);
    scene.begin(state, worldFor(state));
    if (!pursuerTrail && canHunt(to)) {
      huntDelay = state.flags.chapter2 ? 24 : to === "upper" ? 12 : 7;
      toast("계단 아래에서 발소리가 따라온다. 숨을 곳을 먼저 확인하자.");
    }
    if(pursuerTrail)toast("문 너머에서도 긁는 소리가 이어진다. 계단만으로는 따돌릴 수 없다.");
    updateSound();
  }, 250);
  setTimeout(() => {
    traveling = false;
    $("travel").hidden = true;
  }, 850);
}
function hide() {
  if (state.hidden) {
    state.hidden = false;
    toast("문을 조금 열고 밖으로 나왔다.");
  } else {
    state.hidden = true;
    state.flashlight = false;
    keys.clear();
    sound.effect("door");
    toast("손전등을 끄고 숨었다 · E로 나오기");
  }
  updateSound();
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
  if(o.internalDoor){
    const open=state.flags['open_'+id]??!!o.defaultOpen;
    if(open&&Math.abs(state.x-o.x)<o.w+7&&Math.abs(state.y-o.y)<o.h+5){toast('문에서 한 걸음 비킨 뒤 닫아야 한다.');return;}
    state.flags['open_'+id]=!open;
    if(o.barrier&&open){if(enemy.active)enemy.stunned=3.8;const mapId=state.map;setTimeout(()=>{if(state.map===mapId)state.flags['open_'+id]=true;},3800);}
    sound.effect('door');toast(o.name+(open?'을 닫았다.':'을 열었다.'));return;
  }
  if (o.to) {
    if(o.requires&&!state.bag.includes(o.requires)&&!state.flags[o.requires]){
      say(o.name,({relayBadge:'기록동 출입증이 필요하다. 서쪽 접수실의 인계대 서랍을 확인하자.',relayCopy:'회신 대조 사본이 필요하다. 기록동에서 최초 접수·취소 통화·원격 회신을 대조해야 한다.',relayPower:'비상 회선이 꺼져 있다. 냉각 밸브 개방 → 기존 입력 분리 → 비상 회선 투입을 마쳐야 한다.',relayShortcut:'송출층 안쪽에서 잠긴 연결문이다. 반대편으로 돌아가 내부 빗장을 열어야 한다.'})[o.requires]);return;
    }
    if(o.unlockShortcut){state.flags.relayShortcut=true;toast("내부 빗장을 밀어 접수동 연결문을 열었다.");}
    state.flags["seen_"+id]=true;
    transition(o.to, o.spawn, o);
    return;
  }
  if (o.hide) {
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
  scene.inspect(o);
  state.flags["seen_" + id] = true;
  if(o.chapterAction){openRelayAction(o);return;}
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
    if(state.flags.power&&!state.flags.mirrorHaunt){state.flags.mirrorHaunt=true;scene.haunt('아직 보고 있어');sound.effect('scrape');}
    say(o.name,'거울이 있다.\n다가선 나의 얼굴이 유리에 비친다.\n고개를 돌렸는데도, 유리 안의 눈은 조금 늦게 따라온다.');
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
      addNote(
        "desk",
        "관리인 메모: 서윤 사건의 원본 접수증과 녹음은 전자 보관함에 봉인. 비밀번호는 철거일, 날짜 먼저 월 나중. 예비 퓨즈는 지하 창고 작업대에 있다.",
      );
      say(
        "관리인의 메모",
        "「보관함 번호는 철거일.\n날짜를 먼저, 월을 나중에. 잊지 말 것.」\n뒷면에는 「서윤 사건 원본 접수증·녹음 봉인」.\n보관함이 열리지 않으면 지하 창고 작업대의 퓨즈로 전력을 복구하라고 적혀 있다.",
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
      eventActive=true;keys.clear();state.running=false;
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
            sound.effect("door");
            forcedCue = "evidence";
            say(
              "서하",
              "녹음테이프와 철거 전 입주 기록.\n기록의 마지막 줄은 지워져 있다.\n「신고를 취소한 사람: 서하」",
            );
            addNote(
              "evidence",
              "보관함: 녹음테이프, 철거 전 입주 기록. 신고 취소자에 내 이름이 있다.",
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
      sound.effect("door");
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
      state.flags.listened = true;
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
        "사진은 없다. 유리 아래에 희미한 글씨가 남아 있다.\n「우리는 여섯이었다. 끝까지.」",
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
  eventActive=true;keys.clear();state.running=false;stillness.reset();
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
  storyButton('원본을 모두 가지고 경찰서에 가서 자수한다',()=>ending('surrender'),!canSurrender(state));
  storyButton('「내가 죽인 건 아니야」 · 원격 기록을 확인하러 간다',()=>ending('return'),!state.flags.listened||!state.bag.includes('tape'));
  storyButton('아직 챙길 것이 있다 · 건물로 돌아간다',()=>{eventActive=false;$('story-sequence').hidden=true;canvas.focus();});
  $('story-evidence').textContent=ORIGINALS.map(k=>(state.bag.includes(k)?'✓ ':'미확보 · ')+ITEMS[k]).join('   /   ')+(state.flags.listened?'':'\n방송실에서 테이프를 먼저 들어야 한다.');
  $('story-actions').querySelector('button:not(:disabled)')?.focus();
}
function ending(choice){
  if(!finish(state,choice))return;
  playCinematic(choice==='return'?'denial':'surrender');
}
let storyTimer;
function playCinematic(id){
  const film=CINEMATICS[id];if(!film)return;
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
  phoneApp=null;document.querySelector('.phone').classList.remove('in-app');
  $('phone-app-header').hidden=true;$('phone-content').textContent=worldFor(state).name+'\n\n지금 할 일: '+objective();
  document.querySelector('[data-app]')?.focus();
}
function app(name) {
  phoneApp=name;document.querySelector('.phone').classList.add('in-app');
  $('phone-app-header').hidden=false;$('phone-app-back').focus();$('phone-app-title').textContent={save:'기억 저장',load:'기억 불러오기',bag:'소지품',notes:'사건 기록',map:'층별 안내',settings:'설정'}[name]||name;
  const content = $("phone-content");
  content.replaceChildren();
  content.scrollTop=0;
  if (name === "save" || name === "load") {
    for (let i = 1; i <= 3; i++) {
      const b = document.createElement("button");
      let saved = null;
      try {
        if (slot(i)) saved = restore(slot(i));
      } catch {}
      b.textContent = `${i} · ${saved ? MAPS[saved.map].name : "빈 슬롯"} — ${name === "save" ? "기억 저장" : "기억 복원"}`;
      b.disabled = name === "load" && !saved;
      b.onclick = () => {
        try {
          if (name === "save") {
            const write = () => {
              localStorage.setItem(`janryu-save-${i}`, JSON.stringify(state));
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
            state = migrateStorySave(restore(slot(i)));
            pursuerTrail=null;
            enemy.reset();
            huntDelay =
              canHunt()
                ? 8
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
  if (name === "bag")
    content.textContent = state.bag.map((k) => "— " + ITEMS[k]).join("\n");
  if (name === "notes")
    content.textContent = state.notes.length
      ? "지금 할 일: " + objective() + "\n\n" + state.notes.map((n) => n.text).join("\n\n")
      : "목표: " +
        objective() +
        "\n\n기록과 물건을 조사하면 단서가 이곳에 남는다.";
  if (name === "map")
    content.textContent =
      (state.flags.chapter2?"산북 시설중계소 · 구역 안내\n\n접수동: 남쪽 대기실 / 서쪽 접수실 / 동쪽 당직실\n서쪽 접수실 북문 ↔ 기록동: 서쪽 접수 원본 / 동쪽 대조 청취실\n동쪽 당직실 계단 ↓ 설비동: 서쪽 냉각 순환 / 동쪽 전원 절체\n설비동 동쪽 계단 ↑ 송출층: 서쪽 최종 청취 / 동쪽 송출 콘솔\n\n현재: ":"월계아파트 · 층별 안내\n\n2F 서쪽 기록실 / 동쪽 방송실\n       ↕ 동쪽 계단\n1F 서쪽 관리실 / 중앙 현관 / 동쪽 101호\n       ↕ 동쪽 계단\nB1 서쪽 공용 창고 / 동쪽 수변전실\n\n현재: ") +
      worldFor(state).name +
      "\n\n" +
      objective() +
      "\n\n위험 시 청소함에 숨는다. 달리기는 소음을 만든다.";
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
    const test = document.createElement("button");
    test.textContent = "발소리·효과음 확인";
    test.onclick = () => {
      sound.step(worldFor(state).floor, false);
      sound.effect("door");
    };
    content.append(test);
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
  state = next;
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
    canHunt() ? 8 : 0;
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
  $("event-image").src = {capture: "assets/event-capture.png?v=55c5ee831762", memory: "assets/event-memory.png?v=55c5ee831762"}[kind];
  $("event-image").alt = kind === "capture" ? "어두운 복도에서 정우의 그림자에게 붙잡힌 서하" : "풀려 나온 카세트테이프와 혼자 남은 서하의 기억";
  $("event-title").textContent = title; $("event-caption").textContent = caption;
  screen.hidden = false;
  if (kind === "capture") sound.effect("capture");
  const button = $("event-continue"); button.disabled = true; button.focus();
  setTimeout(() => { button.disabled = false; button.focus(); }, 900);
  button.onclick = () => { screen.hidden = true; eventActive = false; keys.clear(); after(); if (!dialog) canvas.focus(); };
}
function caught() {
  showEvent("capture", state.flags.chapter2?"다시, 중계소 접수동":"다시, 현관", "복도 끝의 발소리가 내 뒤에서 멎었다.", recoverAfterCapture);
}
function recoverAfterCapture() {
  pursuerTrail=null;
  enemy.reset();
  huntDelay = 0;
  huntCooldown = 18;
  state.hidden = false;
  state.stamina = 100;
  state.exhausted = false;
  stillness.reset();
  state.map = state.flags.chapter2?"relayEntry":"lobby";
  state.x = (state.flags.chapter2?44:11) * 32;
  state.y = (state.flags.chapter2?30:20) * 32;
  state.flashlight = state.bag.includes("flashlight");
  scene.begin(state, worldFor(state));
  forcedCue = "missing";
  say(
    "서하",
    (state.flags.chapter2?"눈을 뜨자 중계소 접수동이었다. 대조한 기록과 복구한 설비는 그대로다.":"목덜미에 차가운 손이 닿았다.\n눈을 뜨자 다시 현관이었다. 손에 쥔 물건은 그대로다.")+"\n\n달리기는 거리를 벌리지만 오래 버틸 수 없다.\n손전등을 끄고 보관장에 숨거나, 방화문을 닫아 시간을 벌자.",
  );
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
  if(document.hidden){stillness.reset();return;}
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
        if(enemy.follow(worldFor(state),trail.entry,state)){sound.effect('apparition');scene.apparition();scene.haunt('뒤돌아보지 마');toast('그가 방금 지나온 문을 밀고 들어왔다.');}
      }
    }
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
          toast("정우의 그림자가 깨어났다. 뛰거나, 불을 끄고 숨자.");
        }
      }
    }
    const zone=ECHO_ZONES[state.map];
    if(zone&&state.flags.power&&!state.hidden&&!state.flags['echo_'+state.map]&&Math.hypot(state.x-zone.x,state.y-zone.y)<zone.radius){
      state.flags['echo_'+state.map]=true;scene.appear(...zone.at,zone.text);sound.effect('scrape');addNote('echo_'+state.map,'서윤의 잔상. 돌아보려는 순간 얼굴이 나를 향했다. 추격하는 정우와는 다른 모습이었다.');
    }
    const result = enemy.update(worldFor(state), state, dt);
    if (result === "caught") caught();
    if (result === "escaped") {
      huntCooldown = state.flags.chapter2 ? 80 : 28;
      toast("발소리가 멀어졌다.");
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
      huntDelay = state.flags.chapter2 ? 55 : 14;
  }
  const idle=stillness.update(worldFor(state),state,dt,Math.hypot(dx,dy),!eventActive&&!dialog&&!phone&&!traveling&&!state.hidden&&!enemy.active&&!pursuerTrail&&!state.ending&&document.hasFocus());
  if(idle?.kind==='warning'){sound.effect('scrape',.35);toast('가만히 있는데, 다른 사람의 숨소리가 가까워진다.');}
  if(idle?.kind==='appear'){scene.appear(idle.x,idle.y,'왜 여기서 기다려');scene.echo.idle=true;scene.echo.duration=6.4;sound.effect('apparition');toast('정우가 아니다. 서윤의 잔상이 한 걸음씩 다가온다. 움직여서 벗어나자.');}
  if(idle?.kind==='disperse'&&scene.echo?.idle){scene.echo=null;toast('움직이자, 뒤의 숨소리가 끊겼다.');}
  if(!stillness.active&&scene.echo?.idle)scene.echo=null;
  if((dialog||phone)&&!traveling)locomotion(state,0,0,false,dt,worldFor(state));
  scene.moved(dx, dy, dt, state.running);
  if(!scene.moving&&!dialog&&!phone&&!state.hidden)scene.direction=facingDirection(Math.cos(state.facing),Math.sin(state.facing));
  if (scene.moving) {
    stepClock += dt;
    if (stepClock > (state.running ? 0.25 : 0.43)) {
      stepClock = 0;
      sound.step(worldFor(state).floor, state.running);
    }
  } else stepClock = 0.2;
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
    if(distance<420&&ghostStepClock>(enemy.motion==='lunge'?.18:enemy.motion==='crawl'?.38:.7)){
      ghostStepClock=0;sound.effect('scrape',Math.max(.1,1-distance/460));
    }
    lastGhostMotion=enemy.motion;
  }else{ghostStepClock=0;lastGhostMotion=null;}
  const map = worldFor(state);
  scene.map=map;
  nearest = state.hidden ? null : nearestObject(map,state);
  $("interaction").hidden =
    (!nearest && !state.hidden) || dialog || phone || traveling;
  $("interaction").querySelector("span").textContent = state.hidden
    ? "숨은 곳에서 나온다"
    : (nearest?.id === "exit" && state.flags.shutterOpen ? "열린 현관 · 밖으로" : nearest?.name) || "";
  $("objective").textContent = objective();
  if ($("room-name").textContent !== map.name) {
    $("room-name").textContent = map.name;
    revealRoom(map.name);
  }
  $("status").textContent = state.hidden
    ? "숨을 죽이고 있다."
    : enemy.active
      ? enemy.mode === "chase"
        ? "발소리가 가까워진다."
        : "그가 마지막으로 본 자리를 찾고 있다."
      : "[Shift] 달리기  ·  [F] 손전등  ·  [E] 조사";
  $("stamina-fill").style.width = state.stamina + "%";
  $("stamina").classList.toggle("low", state.stamina < 28);
  $("stamina-value").textContent = state.exhausted
    ? "숨 고르기"
    : Math.ceil(state.stamina) + "%";
  $("flash-state").textContent = !state.bag.includes("flashlight") ? "LIGHT / 미소지" : state.flashlight
    ? "LIGHT / ON"
    : "LIGHT / OFF";
  $("threat").textContent = pursuerTrail ? "층간 추적 중 — 문 너머에서 따라온다" : enemy.active
    ? enemy.mode === "chase"
      ? "발각됨 — 달리거나 숨으세요"
      : "수색 중 — 불을 끄고 숨으세요"
    : "";
  $("threat").hidden = !enemy.active&&!pursuerTrail;
  updateSound();
  scene.draw(state, t, dt, nearest, dialog, enemy);
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
  if (!started || eventActive || dialog || phone || state.hidden) return;
  if(!state.bag.includes("flashlight")){toast("접수대에서 손전등을 먼저 챙겨야 한다.");return;}
  state.flashlight = !state.flashlight;
  sound.effect(state.flashlight ? "flashlightOn" : "flashlightOff");
  toast(
    state.flashlight ? "손전등을 켰다." : "손전등을 껐다. 발각 거리가 줄었다.",
  );
}
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (eventActive) {
    if(!$('story-sequence').hidden&&k==='tab'){
      e.preventDefault();const buttons=[...$('story-actions').querySelectorAll('button:not(:disabled)')];
      if(buttons.length){const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}return;
    }
    if(!$('story-sequence').hidden&&$('story-sequence').dataset.mode==='departure'&&k==='escape'){$('story-actions').querySelector('button:last-child').click();return;}
    if (!["tab","enter"," "].includes(k))e.preventDefault();return;
  }
  if (e.target.matches("input,select") && k !== "escape") return;
  if (k === "escape") {
    if (dialog) closeDialog();
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
    if (!e.repeat) interact();
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
