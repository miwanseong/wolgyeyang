import { Scene, facingDirection } from "./scene.js?v=e33230e235db";
import { MAPS, sight, canMove, worldFor, nearestObject, ECHO_ZONES } from "./world.js?v=e33230e235db";
import { locomotion, Pursuer } from "./mechanics.js?v=e33230e235db";
import { AudioDirector, TRACKS } from "./audio.js?v=e33230e235db";
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
} from "./state.js?v=e33230e235db";
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
  enemy = new Pursuer(),
  sound = new AudioDirector((message) => toast(message));
function toast(text) {
  clearTimeout(toastTimer);
  $("toast").textContent = text;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3200);
}
function cue() {
  return enemy.active
    ? enemy.mode === "chase" ? "chase" : "hunt"
    : pursuerTrail ? "hunt" : state.ending
      ? state.ending === "witness"
        ? "aftermath"
        : "reliefAlt"
      : forcedCue ||
        {
          lobby: "lobby",
          management: state.flags.locker ? "evidence" : "deduction",
          apartment: state.flags.seen_home_desk ? "warm" : "home",
          basement: state.flags.power ? "motif" : "basement",
          upper: state.flags.listened ? "panic" : "upper",
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
function objective() {
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
  if(!state.flags.shutterOpen)return "2층 방송 조정실 · 오른쪽 비상 제어반으로 현관 셔터를 연다";
  return "1층 현관으로 돌아가 기록의 운명을 결정한다";
}
function transition(to, spawn, portal = null) {
  if (traveling) return;
  traveling = true;
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
    if (!pursuerTrail && state.flags.power && ["basement", "upper"].includes(to)) {
      huntDelay = to === "upper" ? 12 : 7;
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
      addNote(
        "records",
        "2023년 11월 4일: 서윤은 지하 방화문 개방을 요청했다. 정우는 잠금을 유지했고, 해린은 접수 기록을 지웠다. 도현은 문 뒤의 소리를 들었다. 미정은 예비 열쇠를 넘겼다. 신고를 취소한 확인자는 서하. 2026년 철거 통지에서 여섯 이름을 다시 발견했다.",
      );
      say(
        "입주 기록철",
        "2023년 11월 4일, 23시 41분.\n서윤은 주민 안전 증언을 녹음하다 지하에 갇혔다.\n정우는 무단 출입 방지를 이유로 방화문 사슬을 풀지 않았다.\n해린은 구조 요청을 방송 시험으로 처리해 접수 기록을 지웠다.\n도현은 지하 문을 두드리는 소리를 신고했다.\n미정이 예비 열쇠를 가져왔을 때는 이미 늦었다.\n마지막 줄: 「취소 확인 — 서하」.\n서윤은 퇴거한 것이 아니었다. 우리는 문 뒤에 남겨 두었다.",
      );
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
      say("수동 복귀","복귀 스위치를 끝까지 누른다. 아래층에서 모터와 쇠사슬이 울린다.\n현관 셔터가 올라갔다. 녹음과 기록을 확인하지 않고도 떠날 수 있다. 하지만 그날의 일은 다시 묻힌다.");
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
      addNote(
        "tape",
        "서윤의 마지막 녹음: 지하 방화문이 밖에서 잠겨 있다. 서하는 전화를 받았지만 신고를 취소했다. 서윤이 남긴 부탁은 접수증과 녹음을 건물 밖으로 가져가 달라는 것.",
      );
      pendingEvent = () => showEvent("memory", "녹음에 남은 밤", "불이 꺼진 복도. 그날의 나는, 돌아보지 말았어야 했다.");
      forcedCue = "memory";
      sound.effect("glass");
      scene.burst(30*32,4.5*32,"glass");
      huntDelay = 2;
      scene.impact();scene.haunt("내 목소리 들었잖아");
      say(
        "녹음 속 서윤",
        "「언니. 지하 방화문이 밖에서 잠겼어.\n전화 받았잖아. 관리실에서 내 목소리 들었잖아.\n정우 아저씨 말만 믿고 왜 신고를 취소했어?\n정우가 문을 잠갔다는 것도, 언니가 들었다는 것도… 지우지 마.\n이번에는 접수증하고 이 녹음을 밖으로 가져가 줘.」\n\n나는 기억을 잃은 게 아니었다. 기억하지 않기로 했었다.\n녹음 끝에 미정의 목소리가 이어졌다.\n「유품은 내가 보관했어. 현관 셔터는 정전 때 내려와. 전기를 살리고 조정실 오른쪽 비상 제어반에서 복귀시켜. 이번에는 가지고 나가 줘.」",
      );
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
      say(
        "서하",
        "문은 열렸다. 기록을 가져가면, 누구도 이 밤을 지울 수 없다.\n두고 가면… 나는 다시 아무것도 모르는 사람이 된다.",
        [
          ...(state.flags.listened&&state.bag.includes("evidence")?[["기록을 가지고 나간다", () => ending("witness")]]:[]),
          ["기록을 두고 떠난다", () => ending("return")],
          ["아직 돌아본다", closeDialog],
        ],
      );
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
function ending(choice) {
  if (!finish(state, choice)) return;
  enemy.reset();
  pursuerTrail=null;huntDelay=0;
  forcedCue = choice === "witness" ? "aftermath" : "reliefAlt";
  say(
    choice === "witness" ? "결말 01 — 증언" : "결말 02 — 귀환",
    choice === "witness"
      ? "철거 예정 시각이 지났다. 나는 여섯 사람의 이름을 하나도 빠뜨리지 않고 적었다.\n누군가 문을 닫았다는 사실도. 내가 그 신고를 취소했다는 사실도.\n\n첫 번째 밤이 끝났습니다. 후속 이야기는 제작 중입니다."
      : "내 손에는 아무것도 없었다. 휴대폰에 발신자 없는 메시지가 도착했다.\n「언니. 이번에도 잊었어?」\n\n첫 번째 밤이 끝났습니다. 후속 이야기는 제작 중입니다.",
    [
      [
        "다시 탐색한다",
        () => {
          state.ending = null;
          closeDialog();
        },
      ],
      [
        "휴대폰",
        () => {
          closeDialog();
          openPhone();
        },
      ],
    ],
  );
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
            state = restore(slot(i));
            pursuerTrail=null;
            enemy.reset();
            huntDelay =
              state.flags.power && ["basement", "upper"].includes(state.map)
                ? 8
                : 0;
            scene.begin(state, worldFor(state));
            closePhone();
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
      "월계아파트 · 층별 안내\n\n2F 서쪽 기록실 / 동쪽 방송실\n       ↕ 동쪽 계단\n1F 서쪽 관리실 / 중앙 현관 / 동쪽 101호\n       ↕ 동쪽 계단\nB1 서쪽 공용 창고 / 동쪽 수변전실\n\n현재: " +
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
      next = restore(slot(1));
    } catch {
      toast("저장된 기억을 읽지 못했다.");
      return;
    }
  }
  state = next;
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
    state.flags.power && ["basement", "upper"].includes(state.map) ? 8 : 0;
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
      "2026년 11월 3일, 23시 41분. 철거까지 여섯 시간.\n3년 전 이 집에서 동생 서윤이 사라졌다. 오늘은 내 이름으로 유품 보관 통지서가 왔다.\n그때 나는 야간 관리실에서 서윤의 구조 신고를 취소했다. 사고라는 말을 믿고, 동생의 전화를 외면했다.\n유품 통지서를 들고 들어오자 정전과 함께 현관 셔터가 떨어졌다. 마지막 녹음과 접수 기록을 찾아 밖으로 나가야 한다.\n서윤의 메모에는 「열쇠는 101호 신발장에」라고 적혀 있다.\n\n접수대 충전 거치대에서 손전등부터 챙기자.\nWASD 이동 · Shift 달리기 · F 손전등(획득 후) · E 조사\nTab 휴대폰: 저장·소지품·목표와 단서. 위험할 때는 불을 끄고 숨자.",
    );
  if (state.flags.relocated) toast("새 가구 배치 옆의 안전한 위치로 옮겼다. 소지품과 기록은 그대로다.");
  if (state.flags.migrated)
    toast("옛 기억의 위치를 새 현관으로 옮겼다. 소지품과 단서는 보존했다.");
}
let pendingEvent = null;
function showEvent(kind, title, caption, after = () => {}) {
  if (eventActive) return;
  eventActive = true; keys.clear(); state.running = false;
  const screen = $("event-cg");
  $("event-image").src = {capture: "assets/event-capture.png?v=e33230e235db", memory: "assets/event-memory.png?v=e33230e235db"}[kind];
  $("event-image").alt = kind === "capture" ? "어두운 복도에서 정우의 그림자에게 붙잡힌 서하" : "풀려 나온 카세트테이프와 혼자 남은 서하의 기억";
  $("event-title").textContent = title; $("event-caption").textContent = caption;
  screen.hidden = false;
  if (kind === "capture") sound.effect("capture");
  const button = $("event-continue"); button.disabled = true; button.focus();
  setTimeout(() => { button.disabled = false; button.focus(); }, 900);
  button.onclick = () => { screen.hidden = true; eventActive = false; keys.clear(); after(); if (!dialog) canvas.focus(); };
}
function caught() {
  showEvent("capture", "다시, 현관", "복도 끝의 발소리가 내 뒤에서 멎었다.", recoverAfterCapture);
}
function recoverAfterCapture() {
  pursuerTrail=null;
  enemy.reset();
  huntDelay = 0;
  huntCooldown = 18;
  state.hidden = false;
  state.stamina = 100;
  state.exhausted = false;
  state.map = "lobby";
  state.x = 11 * 32;
  state.y = 20 * 32;
  state.flashlight = state.bag.includes("flashlight");
  scene.begin(state, worldFor(state));
  forcedCue = "missing";
  say(
    "서하",
    "목덜미에 차가운 손이 닿았다.\n눈을 뜨자 다시 현관이었다. 손에 쥔 물건은 그대로다.\n\n달리기는 거리를 벌리지만 오래 버틸 수 없다.\n손전등을 끄고 청소함에 숨거나, 방화문을 닫아 시간을 벌자.",
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
        ["basement", "upper"].includes(state.map)
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
      huntCooldown = 28;
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
      state.flags.power &&
      ["basement", "upper"].includes(state.map)
    )
      huntDelay = 14;
  }
  if((dialog||phone)&&!traveling)locomotion(state,0,0,false,dt,worldFor(state));
  scene.moved(dx, dy, dt, state.running);
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
  if (eventActive) { if (!["tab","enter"," "].includes(k)) e.preventDefault(); return; }
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
