import { Scene, facingDirection } from "./scene.js?v=13554faf5db8";
import { MAPS, sight, canMove } from "./world.js?v=13554faf5db8";
import { locomotion, Pursuer } from "./mechanics.js?v=13554faf5db8";
import { AudioDirector, TRACKS } from "./audio.js?v=13554faf5db8";
import {
  initial,
  ITEMS,
  take,
  note,
  restore,
  unlock,
  repair,
  finish,
} from "./state.js?v=13554faf5db8";
const $ = (id) => document.getElementById(id),
  canvas = $("world");
let state = initial(),
  started = false,
  dialog = false,
  eventActive = false,
  phone = false,
  keys = new Set(),
  last = 0,
  nearest = null,
  toastTimer,
  traveling = false,
  stepClock = 0,
  heartClock = 0,
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
    ? "chase"
    : state.ending
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
  if (!state.bag.includes("key"))
    return "1층 101호 · 현관 신발에서 관리실 열쇠를 찾는다";
  if (!state.flags.desk)
    return "1층 관리실 · 잠긴 서랍에서 보관함 단서를 찾는다";
  if (!state.flags.power && !state.bag.includes("fuse"))
    return "동쪽 계단 ↓ B1 · 공용 창고에서 예비 퓨즈를 찾는다";
  if (!state.flags.power) return "B1 수변전실 · 분전반에 퓨즈를 장착한다";
  if (!state.flags.locker) return "1층 관리실 · 날짜와 월 단서로 보관함을 연다";
  if (!state.flags.listened)
    return "동쪽 계단 ↑ 2층 방송실 · 테이프를 재생한다";
  return "1층 현관으로 돌아가 기록의 운명을 결정한다";
}
function transition(to, spawn) {
  if (traveling) return;
  traveling = true;
  keys.clear();
  enemy.reset();
  huntDelay = 0;
  state.hidden = false;
  sound.effect("door");
  $("travel").textContent = MAPS[to].name;
  $("travel").hidden = false;
  setTimeout(() => {
    state.map = to;
    [state.x, state.y] = spawn.map((n) => n * 32);
    scene.begin(state, MAPS[to]);
    if (state.flags.power && ["basement", "upper"].includes(to)) {
      huntDelay = to === "upper" ? 12 : 7;
      toast("계단 아래에서 발소리가 따라온다. 숨을 곳을 먼저 확인하자.");
    }
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
  if (o.to) {
    state.flags["seen_"+id]=true;
    transition(o.to, o.spawn);
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
  switch (id) {
    case "flashlight":
      say(
        "경비실의 손전등",
        "손전등은 이미 챙겼다. F로 빛을 끌 수 있다.\n빛과 달리는 소리는 정우의 그림자에게 위치를 알린다.\n숨을 때는 청소함에 들어가 불을 끄자.",
      );
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
        "신발장 서랍 안쪽에 작은 열쇠가 들어 있다.\n서윤은 늘 이곳에 열쇠를 숨겼다.\n…나는 그걸 어떻게 기억하고 있지?",
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
        "관리인 메모: 보관함 비밀번호는 철거일. 날짜를 먼저, 월을 나중에. 네 자리.",
      );
      say(
        "관리인의 메모",
        "「보관함 번호는 철거일.\n날짜를 먼저, 월을 나중에. 잊지 말 것.」\n뒷면에는 여섯 사람의 서명 자국이 남아 있다.",
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
        "기록실: 서하 · 서윤 · 정우 · 해린 · 도현 · 미정. 여섯 명 모두 같은 날 퇴거했다.",
      );
      say(
        "입주 기록철",
        "서하. 서윤. 정우. 해린. 도현. 미정.\n여섯 명 모두 같은 날 퇴거했다.\n내 이름 옆에만 서명이 없다.",
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
      pickup("fuse");
      say(
        "공구 상자",
        "사용하지 않은 예비 퓨즈가 있다.\n포장 안에는 「방송실 회로」라고 적힌 쪽지가 끼워져 있다.",
      );
      break;
    case "power":
      if (state.flags.power) {
        say("분전반", "전류가 낮게 울린다. 관리실과 방송실 회로가 살아 있다.");
        break;
      }
      if (!repair(state)) {
        say("분전반", "퓨즈 하나가 비어 있다.\n벽의 화살표는 창고를 가리킨다.");
        break;
      }
      sound.effect("thud");
      state.stamina=100;
      toast("전력 복구 · 방송 장치가 켜졌다");
      scene.burst(nearest.x,nearest.y,"spark");
      scene.impact();
      huntDelay = 1.5;
      forcedCue = "panic";
      say(
        "서하",
        "퓨즈가 들어맞았다.\n복도 끝에서 무언가 켜지는 소리가 들린다.",
      );
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
        "서윤의 녹음: 문을 연 사람보다, 문이 있었다는 사실을 지우는 사람이 무서워. 이번에는 기록을 남겨 줘.",
      );
      pendingEvent = () => showEvent("memory", "녹음에 남은 밤", "불이 꺼진 복도. 그날의 나는, 돌아보지 말았어야 했다.");
      forcedCue = "memory";
      sound.effect("glass");
      scene.burst(30*32,4.5*32,"glass");
      huntDelay = 2;
      scene.impact();
      say(
        "녹음 속 서윤",
        "「언니. 문을 연 사람이 무서운 게 아니야.\n문이 있었다는 사실을 지우는 사람이 무서워.\n이번에는… 기록을 남겨 줘.」\n\n테이프가 멈춘다. 현관 잠금장치가 풀리는 소리가 난다.",
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
      if (!state.flags.listened) {
        say(
          "현관",
          "밖에서 누군가 문을 두드린다.\n「네가 남긴 것부터 찾아.」\n2층 방송실의 플레이어가 떠오른다.",
        );
        break;
      }
      say(
        "서하",
        "문은 열렸다. 기록을 가져가면, 누구도 이 밤을 지울 수 없다.\n두고 가면… 나는 다시 아무것도 모르는 사람이 된다.",
        [
          ["기록을 가지고 나간다", () => ending("witness")],
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
  if (enemy.active) {
    toast("발소리가 너무 가깝다. 지금은 휴대폰을 꺼낼 수 없다.");
    return;
  }
  phone = true;
  keys.clear();
  $("phone-modal").hidden = false;
  $("phone-content").textContent = MAPS[state.map].name + "\n" + objective();
  $("phone-modal").querySelector("[data-app]")?.focus();
}
function closePhone() {
  phone = false;
  forcedCue=null;
  updateSound();
  $("phone-modal").hidden = true;
  keys.clear();
  canvas.focus();
}
function app(name) {
  const content = $("phone-content");
  content.replaceChildren();
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
            enemy.reset();
            huntDelay =
              state.flags.power && ["basement", "upper"].includes(state.map)
                ? 8
                : 0;
            scene.begin(state, MAPS[state.map]);
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
      ? state.notes.map((n) => n.text).join("\n\n")
      : "목표: " +
        objective() +
        "\n\n기록과 물건을 조사하면 단서가 이곳에 남는다.";
  if (name === "map")
    content.textContent =
      "월계아파트 · 층별 안내\n\n2F 서쪽 기록실 / 동쪽 방송실\n       ↕ 동쪽 계단\n1F 서쪽 관리실 / 중앙 현관 / 동쪽 101호\n       ↕ 동쪽 계단\nB1 서쪽 공용 창고 / 동쪽 수변전실\n\n현재: " +
      MAPS[state.map].name +
      "\n\n" +
      objective() +
      "\n\n위험 시 청소함에 숨는다. 달리기는 소음을 만든다.";
  if (name === "settings") {
    content.textContent =
      "음향 · 제공해 주신 MP3 20개\n현재 BGM: " +
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
      sound.step(MAPS[state.map].floor, false);
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
  enemy.reset();
  huntCooldown = 0;
  huntDelay =
    state.flags.power && ["basement", "upper"].includes(state.map) ? 8 : 0;
  scene.begin(state, MAPS[state.map]);
  $("title-screen").hidden = true;
  $("play-screen").hidden = false;
  canvas.tabIndex = 0;
  canvas.focus();
  sound.start(cue()).catch(() => toast("소리 재생 버튼을 눌러 주세요."));
  if (!load)
    say(
      "서하",
      "23시 41분. 철거 전날, 내 이름으로 된 유품 보관 통지서가 도착했다.\n경비실에서 챙긴 손전등을 켰다. 동생 서윤이 사라진 집.\n101호 현관 신발장에 관리실 열쇠를 숨기곤 했다.\n\nWASD로 이동 · Shift로 달리기 · F 손전등 · E 조사\n위험하면 청소함에 숨고 불을 끄자.",
    );
  if (state.flags.migrated)
    toast("옛 기억의 위치를 새 현관으로 옮겼다. 소지품과 단서는 보존했다.");
}
let pendingEvent = null;
function showEvent(kind, title, caption, after = () => {}) {
  if (eventActive) return;
  eventActive = true; keys.clear(); state.running = false;
  const screen = $("event-cg");
  $("event-image").src = {capture: "assets/event-capture.png?v=13554faf5db8", memory: "assets/event-memory.png?v=13554faf5db8"}[kind];
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
  enemy.reset();
  huntDelay = 0;
  huntCooldown = 18;
  state.hidden = false;
  state.stamina = 100;
  state.exhausted = false;
  state.map = "lobby";
  state.x = 11 * 32;
  state.y = 20 * 32;
  state.flashlight = true;
  scene.begin(state, MAPS.lobby);
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
  const dt = Math.min((t - last) / 1000, 0.035);
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
      MAPS[state.map],
    );
    huntCooldown = Math.max(0, huntCooldown - dt);
    if (huntDelay > 0) {
      huntDelay -= dt;
      if (
        huntDelay <= 0 &&
        !enemy.active &&
        ["basement", "upper"].includes(state.map)
      ) {
        if (enemy.spawn(MAPS[state.map], state)) {
          sound.effect("thud");
          scene.impact();
          toast("정우의 그림자가 깨어났다. 뛰거나, 불을 끄고 숨자.");
        }
      }
    }
    const result = enemy.update(MAPS[state.map], state, dt);
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
      !huntDelay &&
      !huntCooldown &&
      state.flags.power &&
      ["basement", "upper"].includes(state.map)
    )
      huntDelay = 14;
  }
  if((dialog||phone)&&!traveling)locomotion(state,0,0,false,dt,MAPS[state.map]);
  scene.moved(dx, dy, dt, state.running);
  if (scene.moving) {
    stepClock += dt;
    if (stepClock > (state.running ? 0.25 : 0.43)) {
      stepClock = 0;
      sound.step(MAPS[state.map].floor, state.running);
    }
  } else stepClock = 0.2;
  if (enemy.active) {
    heartClock += dt;
    if (heartClock > 1.1) {
      heartClock = 0;
      sound.heartbeat();
    }
  }
  const map = MAPS[state.map];
  nearest = state.hidden
    ? null
    : map.objects
        .filter(
          (o) =>
            Math.hypot(o.x - state.x, o.y - state.y) <
              (o.kind === "stairs" ? 76 : 70) && sight(map, state, o),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - state.x, a.y - state.y) -
            Math.hypot(b.x - state.x, b.y - state.y),
        )[0] || null;
  $("interaction").hidden =
    (!nearest && !state.hidden) || dialog || phone || traveling;
  $("interaction").querySelector("span").textContent = state.hidden
    ? "숨은 곳에서 나온다"
    : (nearest?.id === "exit" && state.flags.listened ? "열린 현관 · 밖으로" : nearest?.name) || "";
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
  $("flash-state").textContent = state.flashlight
    ? "LIGHT / ON"
    : "LIGHT / OFF";
  $("threat").textContent = enemy.active
    ? enemy.mode === "chase"
      ? "발각됨 — 달리거나 숨으세요"
      : "수색 중 — 불을 끄고 숨으세요"
    : "";
  $("threat").hidden = !enemy.active;
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
$("sound").onclick = toggleAudio;
$("touch-interact").onclick = interact;
document
  .querySelectorAll("[data-app]")
  .forEach((b) => (b.onclick = () => app(b.dataset.app)));
for (let i = 0; i < 24; i++) $("windows").append(document.createElement("div"));
function flashlight() {
  if (!started || eventActive || dialog || phone || state.hidden) return;
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
    else if (phone) closePhone();
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
