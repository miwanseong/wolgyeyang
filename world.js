export const TILE = 32;
const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill(0));
function map(id, name, w, h, floor, rects) {
  const grid = blank(w, h);
  for (const [x, y, rw, rh] of rects)
    for (let j = y; j < y + rh; j++)
      for (let i = x; i < x + rw; i++) grid[j][i] = 1;
  const copy = grid.map((r) => [...r]);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++)
      if (
        !copy[y][x] &&
        [-1, 0, 1].some((dy) =>
          [-1, 0, 1].some((dx) => copy[y + dy]?.[x + dx] === 1),
        )
      )
        grid[y][x] = 2;
  return { id, name, w, h, floor, grid, rooms: [], objects: [] };
}
const prop = (id, kind, x, y, name, extra = {}) => ({
  id,
  kind,
  x: x * 32,
  y: y * 32,
  name,
  ...extra,
});
const door = (id, x, y, name, to, spawn, extra = {}) =>
  prop(id, "door", x, y, name, { to, spawn, solid: false, ...extra });
const M = {
  lobby: map("lobby", "1F · 현관과 중앙 복도", 44, 28, "stone", [
    [3, 12, 35, 5],
    [5, 17, 13, 7],
    [5, 8, 5, 4],
    [24, 8, 5, 4],
    [35, 9, 6, 15],
  ]),
  management: map("management", "1F · 관리실", 30, 24, "wood", [
    [3, 4, 24, 15],
    [12, 19, 5, 2],
  ]),
  apartment: map("apartment", "1F · 101호", 34, 28, "wood", [
    [12, 18, 10, 7],
    [4, 5, 14, 13],
    [18, 5, 11, 7],
    [18, 13, 11, 5],
  ]),
  basement: map("basement", "B1 · 지하 설비층", 46, 32, "concrete", [
    [3, 17, 38, 5],
    [5, 5, 16, 12],
    [27, 5, 14, 12],
    [36, 22, 5, 4],
  ]),
  upper: map("upper", "2F · 기록 보관층", 46, 30, "wood", [
    [3, 17, 38, 5],
    [4, 5, 17, 12],
    [26, 5, 15, 12],
    [36, 22, 5, 3],
  ]),
};
M.lobby.objects = [
  prop("notice", "notice", 9, 7.5, "벽에 붙은 철거 안내문", {
    mount: true,
    solid: false,
  }),
  prop("flashlight", "box", 8, 21, "경비실의 손전등", {
    solid: true,
    description: "충전 표시등이 희미하게 켜져 있다.",
  }),
  door("manager-door", 7.5, 9, "관리실로 들어간다", "management", [14, 19.5]),
  door("apartment-door", 26, 9, "101호 문을 연다", "apartment", [16, 23]),
  door("stairs-up", 38, 11, "계단 · 2층으로", "upper", [38, 23], {
    kind: "stairs",
    label: "2F ↑",
  }),
  door("stairs-down", 38, 23, "계단 · 지하 1층으로", "basement", [38, 24], {
    kind: "stairs",
    label: "B1 ↓",
  }),
  prop("exit", "exit", 11, 23, "잠긴 현관", { solid: false }),
  prop("bench-lobby", "bench", 15, 18, "기다리는 의자", {
    description: "방석 하나만 먼지가 없다. 누가 방금 일어났을까.",
  }),
  prop("radiator-lobby", "radiator", 31, 12, "차가운 난방 배관", {
    description: "지하에서 일정한 간격으로 금속을 긁는 소리가 올라온다.",
  }),
  prop("photo", "photo", 18.5, 20, "입주민 단체사진", {
    mount: true,
    solid: false,
    description: "사진 속 얼굴은 여섯. 맨 뒤의 정우만 얼굴이 긁혀 있다.",
  }),
];
M.management.objects = [
  door("manager-back", 14, 20, "중앙 복도로", "lobby", [7.5, 11]),
  prop("desk", "desk", 10, 9, "관리인의 책상"),
  prop("locker", "locker", 23, 6, "전자 보관함"),
  prop("calendar", "calendar", 16, 3.5, "벽에 걸린 달력", {
    mount: true,
    solid: false,
  }),
  prop("manager-chair", "chair", 10, 11, "밀려난 의자", {
    description:
      "의자를 밀자 영수증이 나온다. 「계단 방화문은 소음 때문에 자동 폐쇄됩니다.」",
  }),
  prop("manager-files", "shelf", 5, 6, "민원 서류철", {
    description:
      "「발소리가 들려도 돌아보지 말 것. 정우의 근무는 이미 끝났다.」",
  }),
  prop("safe-closet", "cabinet", 5, 14, "몸을 숨길 청소함", {
    hide: true,
    description:
      "안쪽에서 문을 닫을 수 있다. 불을 끄고 숨으면 발소리가 멀어질지도 모른다.",
  }),
  prop("manager-rack", "cabinet", 23, 12, "빈 열쇠 보관장", {
    description: "101호 열쇠가 빠진 자리. 손글씨로 「신발」이라고 적혀 있다.",
  }),
];
M.apartment.objects = [
  door("home-back", 16, 24, "101호를 나간다", "lobby", [26, 11]),
  prop("shoe", "shoe", 13.25, 21, "현관 신발장 서랍"),
  prop("bed-home", "bed", 8, 9, "서윤의 침대", {
    w: 45,
    h: 27,
    description:
      "이불은 막 들춰진 것처럼 접혀 있다. 아래에 적힌 숫자 04. 「날짜부터」라는 낙서.",
  }),
  prop("home-desk", "desk", 14, 6, "서윤의 작은 책상", {
    description:
      "공책: 「관리실 보관함은 철거일. 일 → 월. 지하 창고에 예비 퓨즈.」",
  }),
  prop("home-window", "window", 6, 4.5, "침실 창문", {
    mount: true,
    solid: false,
    description: "밖의 사람은 멈춰 있는데 그림자만 움직인다.",
  }),
  prop("home-closet", "cabinet", 5, 15, "낡은 옷장", {
    hide: true,
    description: "문 안쪽의 손자국은 모두 아래를 향하고 있다.",
  }),
  prop("kitchen", "bench", 24, 7, "사용하지 않은 식탁", {
    description:
      "식기는 두 사람 몫이다. 한쪽 의자에는 누군가 오래 앉아 있었다.",
  }),
  prop("kitchen-rack", "shelf", 26, 10, "부엌 수납장", {
    description: "물컵 여섯 개. 그중 하나만 뒤집혀 있다.",
  }),
  prop("home-photo", "photo", 13, 4.5, "뒤집힌 사진", {
    mount: true,
    solid: false,
    description: "서윤과 나. 사진 뒤에 「언니가 문을 열었어」라고 적혀 있다.",
  }),
];
M.basement.rooms = [
  { x: 5, y: 5, w: 16, h: 12, name: "공용 창고" },
  { x: 27, y: 5, w: 14, h: 12, name: "수변전실" },
];
M.basement.objects = [
  door("basement-up", 38, 25, "계단 · 1층으로", "lobby", [38, 21], {
    kind: "stairs",
    label: "1F ↑",
  }),
  prop("box", "box", 11, 8, "창고의 공구 상자"),
  prop("power", "panel", 35, 6, "수변전실 분전반"),
  prop("basement-crates-a", "crates", 7, 7, "철거 물품 상자", {
    description: "봉인 번호 06. 빈 상자 안에서 누군가 숨을 들이쉰다.",
  }),
  prop("basement-crates-b", "crates", 17, 7, "101호 이삿짐", {
    description: "상자의 봉인은 안쪽에서 찢겨 있다.",
  }),
  prop("basement-shelves", "shelf", 7, 13, "폐기물 보관 선반", {
    description: "예비 퓨즈는 공구 상자에 보관한다는 표지가 붙어 있다.",
  }),
  prop("basement-hide", "cabinet", 18, 14, "철제 청소함", {
    hide: true,
    description: "안에서 잠글 수 있는 낡은 청소함. 숨을 죽일 공간은 있다.",
  }),
  prop("pipes", "radiator", 30, 7, "응결수가 떨어지는 배관", {
    description: "난방은 끊긴 지 오래인데 배관은 미지근하다.",
  }),
  prop("basement-rack", "rack", 39, 12, "비상 발전 장치", {
    description:
      "주 전력 복구 뒤 방화문이 작동한다. 2층 방송실 회로와 연결되어 있다.",
  }),
  prop("warning", "notice", 23, 16.5, "벽면의 안전 수칙", {
    mount: true,
    solid: false,
    description:
      "「큰 소리는 그를 부릅니다. 달리지 마세요. 접근 시 방화문을 닫거나 청소함에 숨으세요.」",
  }),
];
M.upper.rooms = [
  { x: 4, y: 5, w: 17, h: 12, name: "기록실" },
  { x: 26, y: 5, w: 15, h: 12, name: "방송실" },
];
M.upper.objects = [
  door("upper-down", 38, 24, "계단 · 1층으로", "lobby", [38, 13], {
    kind: "stairs",
    label: "1F ↓",
  }),
  prop("records", "shelf", 8, 7, "입주 기록철"),
  prop("player", "player", 33, 8, "방송실 카세트 플레이어"),
  prop("archive-a", "shelf", 5, 10, "연도별 민원 기록", {
    description:
      "정우의 마지막 근무일: 11월 4일. 이후의 출근 기록에는 서명 대신 손톱 자국만 있다.",
  }),
  prop("archive-b", "shelf", 17, 7, "취소된 신고 접수철", {
    description: "접수 시간은 모두 23:41. 같은 1분을 수십 번 반복하고 있다.",
  }),
  prop("archive-hide", "cabinet", 17, 14, "기록실 보관장", {
    hide: true,
    description: "문틈으로 복도가 보인다. 손전등을 끄고 들어가면 숨을 수 있다.",
  }),
  prop("broadcast-chair", "chair", 33, 11, "방송 담당자의 의자", {
    description: "의자가 천천히 돌아간다. 누가 앉아 있던 것처럼.",
  }),
  prop("mirror", "monitor", 38, 6, "꺼진 모니터"),
  prop("speaker-rack", "rack", 28, 6, "방송 장비 랙", {
    description: "붉은 표시는 없다. 전원 램프만 희미한 백색으로 켜져 있다.",
  }),
  prop("window", "window", 30, 4.5, "복도 너머 창문", {
    mount: true,
    solid: false,
  }),
  prop("fire-door", "door", 23, 19, "기록층 방화문을 닫는다", {
    solid: false,
    barrier: true,
    description: "잠깐 추격을 늦출 수 있다. 문을 닫아도 오래 버티지는 못한다.",
  }),
];
M.basement.objects.push(prop('utility-hide','cabinet',39,9.5,'수변전실 청소함',{hide:true,description:'분전반 옆 피난용 청소함. 불을 끄고 몸을 숨길 수 있다.'}));
M.upper.objects.push(prop('broadcast-hide','cabinet',39,10,'방송실 장비 보관장',{hide:true,description:'케이블이 빠진 보관장. 안에서 문을 닫을 수 있다.'}));
// Reused cabinet/shelf modules form purposeful furniture groups along room boundaries.
const furnish = (map, entries) => {
  for (const [id,kind,x,y,name,description] of entries) M[map].objects.push(prop(id,kind,x,y,name,{description}));
};
furnish('management',[
 ['files-north-a','shelf',8,5.6,'퇴거 접수 서류','마지막 퇴거자는 서윤. 날짜 칸만 흰 수정액으로 덮여 있다.'],
 ['files-north-b','shelf',11,5.6,'열쇠 인수 장부','101호 예비 열쇠는 입주자가 보관. 서랍의 긁힌 자국이 떠오른다.'],
 ['manager-cabinet','cabinet',25,16.5,'봉인된 회계장','철거 보상금 지급 명단. 여섯 사람의 이름 중 하나가 두 번 적혔다.'],
]);
furnish('apartment',[
 ['home-chair','chair',14,8,'책상 앞 의자','의자 다리에 줄을 감은 흔적. 책상 위 공책은 그대로 펼쳐져 있다.'],
 ['bedside','cabinet',11,7.5,'침대 옆 협탁','작은 서랍에는 마른 꽃잎만 남았다. 그 아래 먼지에는 두 사람의 손자국.'],
 ['kitchen-seat-a','chair',22.4,10,'식탁 왼쪽 의자','두 사람 몫의 식사. 서윤의 자리는 창문을 등지고 있다.'],
 ['kitchen-seat-b','chair',25.6,11.5,'식탁 오른쪽 의자','의자 밑에서 밟힌 영수증이 나온다. 구입한 건 식사가 아니라 건전지 여섯 개.'],
 ['kitchen-cabinet','cabinet',20,6.4,'싱크대 옆 찬장','빈 접시 사이에 손전등 건전지 포장이 끼어 있다. 누군가 밤을 준비했다.'],
]);
M.apartment.objects.find(o=>o.id==='kitchen').y=10*32;
M.apartment.objects.find(o=>o.id==='kitchen-rack').y=6.5*32;
furnish('basement',[
 ['storage-row-a','crates',9,5.8,'회수된 우편 상자','수취인 불명. 모두 이 건물 주소인데 한 통도 배달되지 않았다.'],
 ['storage-row-b','crates',12,5.8,'폐기 예정 증거물','분류 번호 0411. 관리실 달력의 날짜와 같다.'],
 ['storage-row-c','shelf',19,10,'안전 장구 선반','귀마개만 전부 사라졌다. 경비 일지에는 발소리를 듣지 말라고 적혀 있다.'],
 ['utility-row-a','rack',28.5,11,'오래된 변압기','전원은 끊겼는데 안쪽의 철심은 아직 떨린다.'],
 ['utility-row-b','rack',28.5,14,'방송실 연결 장치','윗층 방송실과 이어진 회로. 퓨즈를 넣으면 그곳도 깨어난다.'],
]);
furnish('upper',[
 ['archive-row-a','shelf',11,5.8,'철거 전 촬영 기록','사진 속 복도에는 매번 같은 그림자가 찍혀 있다.'],
 ['archive-row-b','shelf',14,5.8,'야간 경비 일지','23시 41분 이후의 문장은 모두 같은 글씨다. 문을 열지 마시오.'],
 ['archive-row-c','shelf',5.5,13.5,'미접수 신고함','서윤은 신고를 여섯 번 했다. 접수 확인은 한 번도 없다.'],
 ['broadcast-rack-b','rack',28,9,'끊어진 통신 장비','바깥으로 나가는 회선만 잘려 있다. 방송은 건물 안에서만 들린다.'],
 ['broadcast-rack-c','rack',28,12,'예비 녹음 장치','빈 카세트 껍질. 남은 테이프는 관리실 보관함에 있다는 스티커.'],
]);
// Room entrances are actual openings, rather than painted doors through solid walls.
for (const id of ["basement", "upper"]) {
  const m = M[id];
  for(const [left,right] of (id==="basement"?[[5,20],[27,40]]:[[4,20],[26,40]]))for(let x=left;x<=right;x++)m.grid[16][x]=2;
  for (const x of id === "basement" ? [13, 33] : [12, 33])
    for (let y = 15; y <= 17; y++) {
      m.grid[y][x] = 1;
      m.grid[y][x + 1] = 1;
    }
}
for (const m of Object.values(M)) {
  for (const o of m.objects) {
    o.solid ??= !o.mount && !["door", "stairs", "exit"].includes(o.kind);
    o.w ??= o.kind === "bed" ? 43 : o.kind === "chair" ? 13 : ["bench","desk","shelf","player"].includes(o.kind) ? 31 : 23;
    o.h ??= o.kind === "chair" ? 10 : 17;
  }
}
export const MAPS = M;
export function canMove(map, x, y, ignoreProps = false) {
  for (const dx of [-7, 7])
    for (const dy of [-5, 5])
      if (
        map.grid[Math.floor((y + dy) / 32)]?.[Math.floor((x + dx) / 32)] !== 1
      )
        return false;
  return (
    ignoreProps ||
    !map.objects.some(
      (o) =>
        o.solid && Math.abs(x - o.x) < o.w + 6 && Math.abs(y - o.y) < o.h + 4,
    )
  );
}
export function sight(map, a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y),
    steps = Math.ceil(d / 12);
  for (let i = 1; i < steps; i++) {
    const x = a.x + ((b.x - a.x) * i) / steps,
      y = a.y + ((b.y - a.y) * i) / steps;
    if (map.grid[Math.floor(y / 32)]?.[Math.floor(x / 32)] !== 1) {
      const mounted =
        map.grid[Math.floor(b.y / 32)]?.[Math.floor(b.x / 32)] === 2;
      if (!mounted || Math.hypot(x - b.x, y - b.y) > 32) return false;
    }
  }
  return true;
}
export function findPath(map, from, to) {
  const start = [Math.floor(from.x / 32), Math.floor(from.y / 32)],
    goal = [Math.floor(to.x / 32), Math.floor(to.y / 32)],
    q = [start],
    seen = new Set([start.join(",")]),
    parent = new Map();
  let head = 0;
  while (head < q.length) {
    const v = q[head++];
    if (v[0] === goal[0] && v[1] === goal[1]) {
      const path = [];
      let p = v;
      while (p.join(",") !== start.join(",")) {
        path.unshift({ x: p[0] * 32 + 16, y: p[1] * 32 + 16 });
        p = parent.get(p.join(","));
      }
      return path;
    }
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const n = [v[0] + dx, v[1] + dy],
        key = n.join(",");
      if (seen.has(key) || !canMove(map, n[0] * 32 + 16, n[1] * 32 + 16))
        continue;
      seen.add(key);
      parent.set(key, v);
      q.push(n);
    }
  }
  return [];
}
