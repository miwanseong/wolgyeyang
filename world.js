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
    [4, 5, 13, 13],
    [18, 5, 11, 7],
    [18, 13, 11, 6],
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
      "의자를 돌리자 설비 점검표가 보인다. 「정전 시 현관 방화 셔터 하강. 전원 복구 후 방송 조정실에서 수동 복귀.」",
  }),
  prop("manager-files", "shelf", 5, 6, "민원 서류철", {
    description:
      "정우의 사고 보고서: 2024년, 방화문 사슬을 풀러 지하에 내려간 뒤 문 뒤에서 숨진 채 발견. 점검표 아래에는 「근무는 끝났는데 왜 아직 순찰하는가」라고 적혔다.",
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
// Furniture is assembled as continuous 64px modules, sharing back edges and floor baselines.
// Each module occupies exactly two 32px tiles; no per-image floating margins.
function run(m, key, row, startX, y, ids, names) {
  ids.forEach((id,i)=>{
    let o=M[m].objects.find(o=>o.id===id);
    if(!o){
      const labels=[['민원 기록철','퇴거 서류','봉인된 장부'],['주방 서랍','조리대','식기 보관장'],['작업대 서류','전화기와 메모','사무용 서랍'],['전력계 장비반','차단기 패널','통신 회로반']][row];
      const texts={management:'같은 날 접수된 신고들이 묶여 있다. 접수 번호는 서로 다른데 취소 확인자의 서명은 모두 내 글씨다.',apartment:row===1?'식기는 두 사람 몫이다. 사용한 컵 아래에서 접수증이 비친다. 누군가 버리려다 다시 숨겨 둔 종이다.':'서윤의 작업 기록. 지하 방화문을 열어 달라는 메모가 마지막 페이지마다 반복된다.',basement:row===3?'관리실 보관함과 2층 방송실의 공용 회로. 퓨즈를 넣으면 두 장치에 전원이 돌아간다.':'창고의 물품이 용도별로 나뉘어 있다. 예비 퓨즈는 가운데 작업대의 작은 공구함에 보관한다.',upper:row===0?'취소된 신고의 사본. 정우는 잠금을 풀지 않았고, 해린은 접수를 지웠다. 원본과 마지막 녹음만 밖으로 가져가면 이 밤을 증언할 수 있다.':'같은 회로로 이어진 방송 장비. 카세트 데크는 방 가운데 연결된 책상 위에 있다.',lobby:'철거 접수대. 유품 통지서 옆에 101호 열쇠 보관 위치가 적혀 있다.'};
      o=prop(id,row===0?'shelf':row===1?'cabinet':row===2?'desk':'rack',0,0,names?.[i]||labels[i%3],{description:texts[m]});M[m].objects.push(o)
    }
    Object.assign(o,{x:(startX+1+i*2)*32,y:y*32,module:{row,group:key,col:i===0?0:i===ids.length-1?2:1},w:31,back:row===0||row===3?52:40,front:16});
  });
}
// Management: a wall-to-wall archive, central connected workbench, lower record cabinets.
run('management','north',0,4,5.5,['manager-files','files-north-a','files-north-b','files-north-c','files-north-d','files-north-e']);
run('management','work',2,7,9,['manager-work-left','desk','manager-work-right']);
run('management','south',0,20,17,['manager-cabinet-a','manager-rack','manager-cabinet-b']);
// Apartment: bedroom shelving and study line share the north wall; the kitchen is a full counter run.
run('apartment','bedroom-books',0,5,6.5,['home-books-a','home-books-b']);
run('apartment','study',2,11,6.5,['home-study-left','home-desk','home-study-right']);
run('apartment','counter',1,18,6.5,['kitchen-cabinet','kitchen-counter-a','kitchen-sink','kitchen-counter-b','kitchen-rack']);
// Basement: two real storage aisles and an equipment wall; toolbox sits on a workbench.
run('basement','storage-north',0,5,6.5,['basement-shelves','storage-row-a','storage-row-b','storage-row-c','storage-row-d','storage-row-e','storage-row-f']);
run('basement','storage-work',2,8,11,['storage-work-left','box','storage-work-right']);
run('basement','electrical-north',3,27,6.5,['utility-north-a','utility-north-b','utility-north-c','power','utility-north-e','utility-north-f']);
// Records and broadcast equipment use the same physical grid and aligned front edges.
run('upper','archive-north',0,4,6.5,['records','archive-north-b','archive-north-c','archive-north-d','archive-b','archive-north-f','archive-north-g']);
run('upper','archive-aisle',0,5,11.5,['archive-a','archive-middle-b','archive-middle-c','archive-middle-d']);
run('upper','broadcast-north',3,26,6.5,['speaker-rack','broadcast-rack-b','broadcast-rack-c','broadcast-rack-d','mirror','broadcast-rack-f','broadcast-rack-g']);
run('upper','broadcast-desk',2,30,10,['broadcast-work-left','player','broadcast-work-right']);
// Reception is visible from the entrance, so the player arrives inside a furnished vestibule.
run('lobby','reception',2,5,18,['reception-ledger','arrival-letter','flashlight']);
const move=(m,id,x,y,extra={})=>Object.assign(M[m].objects.find(o=>o.id===id),{x:x*32,y:y*32,...extra});
move('management','calendar',22,3.5);
move('apartment','bed-home',6.5,11.5);move('apartment','home-closet',5.5,16);
move('apartment','kitchen',24,10,{kind:'table',collectible:'receipt',description:'컵을 들어 올리자 접힌 접수증이 나온다. 2023년 11월 4일 23:41, 지하 방화문 개방 요청. 요청자는 서윤. 취소 확인 서명은 나, 서하다.'});
M.apartment.objects.push(prop('home-chair','chair',14,9,'책상 앞 의자',{description:'공책을 보던 자리에 앉아 본다. 페이지에는 지하 방화문 그림이 여러 번 반복된다.'}),prop('bedside','cabinet',9.5,11.5,'침대 옆 협탁',{description:'서윤의 야간 작업 기록. 마지막 페이지는 지하 방화문 앞에서 끝난다.'}),prop('kitchen-seat-a','chair',22,11.5,'식탁 왼쪽 의자',{description:'서윤의 자리. 식사는 손대지 않은 채 굳어 있다.'}),prop('kitchen-seat-b','chair',26,11.5,'식탁 오른쪽 의자',{description:'내 자리. 컵 밑으로 접수증의 모서리가 보인다.'}));
move('upper','broadcast-chair',33,13,{swivel:true});move('management','manager-chair',10,12,{swivel:true});
move('upper','broadcast-hide',39,10);move('basement','utility-hide',39,10.5);
// Props on worktops are part of the furniture, with collectible contents drawn in place.
move('basement','box',11,11,{module:{row:2,col:1,group:'storage-work'},contents:'fuse'});
move('lobby','arrival-letter',8,18,{collectible:'notice',contents:'letter',name:'접수대에 놓인 유품 보관 통지서',description:'서윤의 유품은 관리실 전자 보관함에 있다. 06:00 철거와 함께 폐기. 동봉된 서윤의 메모: 「예비 열쇠는 101호 현관 신발장에. 이번에는 신고를 취소하지 마.」'});
move('apartment','home-photo',3.5,9);
move('upper','window',25.5,13);
move('basement','basement-crates-a',7,14);move('basement','basement-crates-b',19,11);
M.basement.objects=M.basement.objects.filter(o=>o.id!=='pipes');
// Window and radiator bays define corridor rhythm without blocking the walking lane.
for (const [i,x] of [13,19,31].entries()) {
  M.lobby.objects.push(prop('hall-window-'+i,'window',x,11.5,'복도 창문',{mount:true,solid:false,description:'유리 너머의 철거 가림막이 흔들린다. 바깥에서는 이 건물 안을 볼 수 없다.'}));
}

M.apartment.objects.push(prop('living-bench','bench',25,15.5,'거실 소파',{description:'두 사람이 나란히 앉던 자리. 방석 밑에는 서윤의 이름표가 눌려 있다.'}),prop('living-photo','photo',29.5,15,'거실 벽의 사진',{mount:true,solid:false,description:'세 해 전의 우리. 사진을 돌리면 날짜 대신 「전화는 받았다」라는 글씨가 보인다.'}));
for(const [i,x] of [16,22,34].entries())M.lobby.objects.push(prop('sealed-unit-'+i,'door',x,11,'봉인된 '+(102+i)+'호 문',{solid:false,sealed:true,description:'철거 봉인이 붙어 있다. 안쪽에서 손잡이가 한 번 내려갔다가 멈춘다. 문은 열리지 않는다.'}));
for(const [i,x] of [22,28].entries())M.lobby.objects.push(prop('sealed-store-'+i,'door',x,17,'폐쇄된 공용실 문',{solid:false,sealed:true,description:'사건 뒤 폐쇄한 공용실. 문틈을 막은 종이에는 2023년 11월 4일의 접수 번호가 적혀 있다.'}));
M.management.rooms=[{x:3,y:4,w:24,h:15,name:'관리실 · 접수와 문서 보관'}];
M.apartment.rooms=[{x:4,y:5,w:14,h:13,name:'101호 · 침실과 공부방'},{x:18,y:5,w:11,h:7,name:'101호 · 부엌'}];
// Regional materials and silhouettes differ while the layout retains shared grid lines.
for(const [m,id,index] of [
 ['apartment','living-bench',0],['apartment','bedside',2],
 ['basement','basement-crates-a',4],['basement','basement-crates-b',5],['basement','basement-rack',6],
 ['upper','speaker-rack',10],['upper','broadcast-rack-b',11],['upper','broadcast-rack-c',9],['upper','broadcast-rack-d',10],['upper','mirror',11],['upper','broadcast-rack-f',9],['upper','broadcast-rack-g',11],
 ['upper','broadcast-work-left',9],['upper','player',8],['upper','broadcast-work-right',11]
])M[m].objects.find(o=>o.id===id).regional=index;
const warehouse=[7,4,7,5,7,6,7];
M.basement.objects.filter(o=>o.module?.group==='storage-north').forEach((o,i)=>{o.regional=warehouse[i]});
M.basement.objects.filter(o=>o.module?.group==='storage-work').forEach((o,i)=>{o.regional=[4,5,6][i]});
M.basement.objects.find(o=>o.id==='box').name='이동식 공구대의 공구함';
M.apartment.objects.find(o=>o.id==='living-bench').y=16.5*32;
M.apartment.objects.push(prop('living-tv','monitor',25,14,'거실의 브라운관 텔레비전',{regional:1,w:25,back:36,front:12,description:'전원선을 뽑아도 화면의 잡음이 멈추지 않는다. 유리에 비친 내 뒤에서 누군가 네발로 기어간다.'}),prop('home-plant','cabinet',20.5,22,'현관의 마른 화분',{regional:3,w:12,h:12,description:'잎이 창문 대신 집 안쪽을 향한다. 화분 밑에는 오래된 물자국이 고여 있다.'}));
M.lobby.objects.push(prop('lobby-plant','cabinet',16.5,22,'접수대 옆 관엽 화분',{regional:3,w:12,h:12,description:'먼지에 덮인 잎 사이에 경비실 영수증이 끼어 있다. 손전등은 이 집의 밤마다 충전되었다.'}));
// A flat is entered through a foyer; living, bedroom and kitchen have physical walls/hinged doors.
for(let x=4;x<=17;x++)M.apartment.grid[18][x]=2;
for(const [x,y] of [[17,15],[17,16],[23,12],[24,12]])M.apartment.grid[y][x]=1;
M.apartment.objects.push(
 prop('bedroom-door','door',17.5,16,'침실 문',{internalDoor:true,facing:'east',w:13,h:36,solid:true,cells:[[17,15],[17,16]],description:'현관에서 거실로 이어진 복도 옆 침실. 손잡이를 돌려 열 수 있다.'}),
 prop('kitchen-door','door',24,12.5,'주방 문',{internalDoor:true,facing:'north',w:36,h:13,solid:true,cells:[[23,12],[24,12]],description:'거실과 분리된 주방의 문. 안쪽 식탁이 희미하게 보인다.'})
);
M.apartment.rooms=[{x:12,y:19,w:10,h:6,name:'101호 · 현관'},{x:18,y:13,w:11,h:6,name:'101호 · 거실'},{x:4,y:5,w:13,h:13,name:'101호 · 침실'},{x:18,y:5,w:11,h:7,name:'101호 · 주방'}];
Object.assign(M.apartment.objects.find(o=>o.id==='shoe'),{x:13*32,facing:'east',w:18,h:20});
Object.assign(M.apartment.objects.find(o=>o.id==='home-closet'),{x:5*32,facing:'east',w:18,h:23});
Object.assign(M.management.objects.find(o=>o.id==='safe-closet'),{x:4*32,facing:'east',w:18,h:23});
// Bedrooms are furnished with a bed, study, wardrobe and one compact bookshelf, not an archive wall.
M.apartment.objects=M.apartment.objects.filter(o=>o.id!=='home-books-b');
const homeShelf=M.apartment.objects.find(o=>o.id==='home-books-a');delete homeShelf.module;homeShelf.kind='shelf';homeShelf.x=8*32;homeShelf.name='서윤의 작은 책장';homeShelf.description='방송 원고와 생활 수첩이 섞여 있다. 마지막 원고 제목은 「철거 전에 남길 목소리」.';
M.management.objects=M.management.objects.filter(o=>!['files-north-c','files-north-d','files-north-e'].includes(o.id));
M.management.objects.find(o=>o.id==='files-north-b').module.col=2;
// The broadcast room has a glazed recording booth, a control desk and acoustic treatment.
M.upper.objects=M.upper.objects.filter(o=>!['broadcast-rack-d','broadcast-rack-f','broadcast-rack-g'].includes(o.id));
const gear=['speaker-rack','broadcast-rack-b','broadcast-rack-c','mirror'];
gear.forEach((id,i)=>{const o=M.upper.objects.find(o=>o.id===id);o.x=(27+i*2)*32;o.y=10*32;o.module.col=i===0?0:i===3?2:1});
['broadcast-work-left','player','broadcast-work-right'].forEach((id,i)=>{const o=M.upper.objects.find(o=>o.id===id);o.x=(28+i*2)*32;o.y=13.5*32});
Object.assign(M.upper.objects.find(o=>o.id==='broadcast-chair'),{x:30*32,y:15.5*32});
Object.assign(M.upper.objects.find(o=>o.id==='broadcast-hide'),{x:39*32,y:14*32});
M.upper.glassCells=new Set();
for(let x=26;x<=40;x++)M.upper.grid[9][x]=2;
for(let x=26;x<=37;x++)M.upper.glassCells.add(x+',9');
for(const x of [38,39])M.upper.grid[9][x]=1;
for(let i=0;i<4;i++)M.upper.objects.push(prop('studio-glass-'+i,'studio-glass',27.5+i*3,9,'녹음 부스의 방음 유리',{mount:true,solid:false,architecture:7,description:'믹싱 데스크와 마이크 부스를 분리하는 두꺼운 방음 유리. 두드리는 소리는 건너편으로 전달되지 않는다.'}));
M.upper.objects.push(prop('studio-door','door',39,9.5,'녹음 부스 방음문',{internalDoor:true,facing:'north',w:36,h:13,solid:true,cells:[[38,9],[39,9]],description:'문을 닫으면 부스 안의 소리가 유리 너머로 새지 않는다.'}),prop('studio-mic','microphone',31,7,'서윤이 사용한 녹음 마이크',{architecture:4,w:12,h:12,description:'팝 필터 뒤에 서윤의 이름표가 걸려 있다. 그녀는 주민들의 증언을 이 부스에서 녹음했다.'}),prop('studio-onair','onair',35,9,'녹음 표시등',{architecture:5,mount:true,solid:false,description:'복구한 방송 회로에 연결된 녹음 표시등.'}));
for(const x of [28,32,36,39])M.upper.objects.push(prop('acoustic-'+x,'acoustic',x,4.5,'녹음 부스의 흡음 패널',{architecture:6,mount:true,solid:false,description:'목소리의 울림을 줄이는 흡음재. 벽 뒤의 긁는 소리까지 막지는 못한다.'}));
M.upper.rooms=[{x:4,y:5,w:17,h:11,name:'기록 보관실'},{x:26,y:10,w:15,h:6,name:'방송 조정실'},{x:26,y:5,w:15,h:4,name:'방음 녹음 부스'}];
M.upper.objects.push(prop('shutter-control','panel',35,14,'현관 셔터 비상 제어반',{w:15,h:15,description:'방송 비상 회로와 연결된 현관 방화 셔터의 수동 복귀 스위치.'}));
const exit=M.lobby.objects.find(o=>o.id==='exit');exit.kind='shutter';exit.name='내려온 현관 방화 셔터';exit.architecture=0;
M.lobby.objects.filter(o=>o.sealed).forEach(o=>o.architecture=2);
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
// Technical fixtures use their own artwork and apertures measured from the collision grid.
Object.assign(M.management.objects.find(o=>o.id==='manager-rack'),{name:'101호의 관리 서류철',description:'101호 서류철의 열쇠 인수 메모. 「야간 관리실 서랍 열쇠는 101호 신발장」이라고 적혀 있다.'});
Object.assign(M.management.objects.find(o=>o.id==='locker'),{technical:4,w:27,back:26,front:13,name:'전자 잠금식 문서 보관함'});
for(const id of ['broadcast-rack-b','broadcast-rack-c'])M.upper.objects=M.upper.objects.filter(o=>o.id!==id);
for(const [id,x] of [['speaker-rack',27],['mirror',39]]){
 const o=M.upper.objects.find(o=>o.id===id);delete o.module;delete o.regional;
 Object.assign(o,{x:x*32,y:10.5*32,technical:7,w:22,back:36,front:14});
}
const mixer=M.upper.objects.find(o=>o.id==='player');delete mixer.regional;delete mixer.module;
Object.assign(mixer,{technical:6,w:46,back:30,front:16,name:'믹싱 콘솔의 카세트 데크'});
M.upper.objects=M.upper.objects.filter(o=>!['broadcast-work-left','broadcast-work-right','window'].includes(o.id));
// One observation window, not a glass wall covered by equipment racks.
M.upper.objects=M.upper.objects.filter(o=>!o.id.startsWith('studio-glass-'));
M.upper.glassCells=new Set();for(let x=29;x<=35;x++)M.upper.glassCells.add(x+',9');
for(let i=0;i<2;i++)M.upper.objects.push(prop('studio-glass-'+i,'studio-glass',30.5+i*3,9,'조정실 관찰창',{mount:true,solid:false,architecture:7,description:'마이크 부스를 바라보는 이중 관찰창. 창 아래 흡음 벽과 별도 방음문이 두 공간을 분리한다.'}));
Object.assign(M.upper.objects.find(o=>o.id==='shutter-control'),{x:37*32,y:9*32,mount:true,solid:false,name:'벽면 비상 셔터 제어반'});
Object.assign(M.upper.objects.find(o=>o.id==='studio-door'),{doorType:'acoustic',aperture:64});
for(const [m,id,x,name,type,cells] of [
 ['upper','studio-entry-door',34,'방송 조정실 방음문','acoustic',[[33,16],[34,16]]],
 ['upper','archive-door',13,'기록실 출입문','service',[[12,16],[13,16]]],
 ['basement','storage-door',14,'공용 창고 철제문','service',[[13,16],[14,16]]],
 ['basement','utility-door',34,'전기실 방화문','fire',[[33,16],[34,16]]]
])M[m].objects.push(prop(id,'door',x,16.5,name,{internalDoor:true,doorType:type,aperture:64,facing:'north',solid:true,w:36,h:13,cells,description:'벽의 개구부에 맞춘 문틀. E로 손잡이를 돌려 열고 닫는다.'}));
// A cross-corridor compartment wall: the fire door is attached to jambs, not floating.
for(let y=17;y<=21;y++)M.upper.grid[y][23]=2;
for(const y of [19,20])M.upper.grid[y][23]=1;
Object.assign(M.upper.objects.find(o=>o.id==='fire-door'),{x:23.5*32,y:20*32,internalDoor:true,defaultOpen:true,solid:true,doorType:'fire',aperture:64,facing:'east',w:13,h:36,cells:[[23,19],[23,20]],name:'계단 전실 방화문',description:'도어 클로저가 달린 철제 방화문. E로 닫으면 잠시 추격을 막지만 곧 다시 밀려 열린다.'});
// A dwelling includes a wet room off its foyer, separate from sleeping and cooking areas.
for(let y=19;y<=25;y++)for(let x=3;x<=11;x++)M.apartment.grid[y][x]=2;
for(let y=20;y<=24;y++)for(let x=4;x<=10;x++)M.apartment.grid[y][x]=1;
for(const y of [22,23])M.apartment.grid[y][11]=1;
M.apartment.rooms.push({x:4,y:20,w:7,h:5,name:'101호 · 욕실'});
M.apartment.objects.push(
 prop('bathroom-door','door',11.5,23,'욕실 문',{internalDoor:true,solid:true,facing:'east',aperture:64,w:13,h:36,cells:[[11,22],[11,23]],doorType:'residential'}),
 prop('bath-sink','sink',6,21,'욕실 세면대',{technical:8,w:16,back:25,front:10,description:'수도는 끊겼다. 거울 아래 물때 사이로 손가락 자국이 남아 있다.'}),
 prop('bath-toilet','toilet',9,21,'욕실 변기',{technical:9,w:17,back:25,front:12,description:'물탱크는 비어 있다. 탱크 안에 숨겨진 물건은 없다.'}),
 prop('bath-shower','shower',6,24,'욕실 샤워 구역',{technical:10,w:22,back:30,front:10,description:'배수구가 마른 머리카락으로 막혀 있다. 물이 없는 배관에서 방금 물방울 소리가 났다.'})
);
for(const [m,x,y] of [['upper',25.5,19],['basement',25.5,19],['lobby',41.5,19]]){
 // Recessed fire extinguisher on the outside face of a corridor wall.
 if(M[m].grid[Math.floor(y)]?.[Math.floor(x)]!==2)continue;
 M[m].objects.push(prop(m+'-extinguisher','extinguisher',x,y,'벽면 소화기함',{technical:11,mount:true,solid:false,description:'유리 안의 분말 소화기. 봉인과 압력계는 그대로지만 손잡이에 오래된 손자국이 있다.'}));
}
Object.assign(M.upper.objects.find(o=>o.id==='mirror'),{id:'broadcast-patch-rack',x:40*32,y:12*32,name:'패치 패널 장비 랙',description:'조정실과 녹음 부스의 마이크 배선이 모인 패치 패널. 연결 케이블은 바닥 가장자리를 따라 정리돼 있다.'});
// Art, action and description are one fixture contract. Shipping cartons never repair circuits.
for(const o of M.basement.objects){
 if(o.regional!==undefined||o.module?.group==='storage-work'||o.module?.group==='electrical-north'){delete o.regional;delete o.module;}
 if(o.id==='box')Object.assign(o,{fixture:'fuse-source',artRole:'toolbox',supply:1,name:'작업대의 열린 공구함',w:35,back:24,front:14,contents:'fuse'});
 else if(o.id==='power')Object.assign(o,{fixture:'fuse-socket',artRole:'fuse-panel',supply:3,name:'비상 제어 회로의 퓨즈 홀더',x:35*32,y:4.5*32,mount:true,solid:false,w:26,h:18,description:'24V 비상 제어 회로함. 뚜껑 안의 두 금속 클립 사이에 유리관 퓨즈 하나가 빠져 있다.'});
 else if(o.id.startsWith('utility-north-'))Object.assign(o,{artRole:'junction',supply:5,mount:true,solid:false,y:4.5*32,description:'닫힌 접속함. 배선이 옆 제어 회로함으로 이어져 있다. 이 함에는 퓨즈를 넣는 홀더가 없다.'});
 else if(o.id.startsWith('storage-row-')||o.id.startsWith('basement-crates-'))Object.assign(o,{artRole:'moving-boxes',supply:0,w:24,back:26,front:12,name:'봉인된 가정용 이삿짐',description:o.id==='basement-crates-b'?'101호의 이삿짐. 상자 옆에는 「침구·겨울옷」. 테이프가 안쪽에서 찢겼지만 공구나 전기 부품은 없다.':'그릇과 옷을 포장한 이삿짐 상자. 표에 적힌 물품과 내용이 일치한다. 철거 전 주인을 기다리는 짐이다.'});
 else if(o.id==='storage-work-left')Object.assign(o,{supply:0,artRole:'moving-boxes',name:'운반 대기 중인 이삿짐',description:'작업대와 구분해 묶어 둔 생활용품 상자. 전기 부품은 옆 작업대의 열린 공구함에 있다.'});
 else if(o.id==='storage-work-right')Object.assign(o,{supply:5,artRole:'junction',name:'벽면 배선 접속함',mount:true,solid:false,x:19*32,y:4.5*32,description:'창고 조명 배선의 접속함. 봉인 나사가 잠겨 있다. 퓨즈 교체 장소가 아니다.'});
}
for(const id of ['basement-shelves','storage-row-b','storage-row-d','storage-row-f']){
 const o=M.basement.objects.find(o=>o.id===id);delete o.supply;Object.assign(o,{regional:7,artRole:'storage-rack',name:'생활용품을 보관한 철제 선반',description:'금속 선반 위에 이삿짐과 서류 상자가 나뉘어 있다. 예비 전기 부품은 이 선반이 아니라 별도 작업대의 공구함에 보관한다.'});
}
Object.assign(M.basement.objects.find(o=>o.id==='basement-rack'),{regional:6,artRole:'drain-pipes',name:'배수 밸브와 감긴 호스',description:'배수관의 밸브와 정리된 호스. 전선이나 퓨즈를 연결하는 장치가 아니다.'});
M.basement.objects.find(o=>o.id==='utility-hide').description='분전반 옆의 큰 청소용품 보관장. 불을 끄고 안에서 문을 닫을 수 있다.';
// Settle the sink/worktop/stove as different modules, rather than repeating a sink sprite.
const kitchenKinds=[['kitchen-cabinet',0,'가스레인지와 환풍 후드','가스 밸브가 잠겨 있다. 버너 위에 맞춰 달린 환풍 후드의 스위치를 눌러도 팬이 돌지 않는다.'],['kitchen-counter-a',1,'주방 조리대','칼자국이 남은 빈 조리대. 식탁과 싱크 사이에 조리할 공간이 확보돼 있다.'],['kitchen-sink',2,'주방 싱크대','수전 하나와 개수대 하나. 배수구 안에는 아무것도 없다.'],['kitchen-counter-b',1,'주방 서랍장','수저와 행주가 용도별로 나뉘어 있다.'],['kitchen-rack',3,'식기 건조대','컵 두 개가 엎어져 있다. 접수증은 건조대가 아니라 식탁의 컵 아래에 있었다.']];
for(const [id,index,name,description]of kitchenKinds){const o=M.apartment.objects.find(o=>o.id===id);delete o.module;Object.assign(o,{kitchenTile:index,artRole:'kitchen-'+index,name,description,w:31,back:36,front:14});}
Object.assign(M.apartment.objects.find(o=>o.id==='living-tv'),{x:26.5*32});
Object.assign(M.apartment.objects.find(o=>o.id==='living-bench'),{x:26.5*32});
Object.assign(M.apartment.objects.find(o=>o.id==='kitchen'),{w:46,back:24,front:20});
for(const id of ['kitchen-seat-a','kitchen-seat-b'])M.apartment.objects.find(o=>o.id===id).y=10*32;
// The vanity sits at the end of a short L-shaped return, out of the initial sightline.
for(let y=19;y<=25;y++)for(let x=22;x<=29;x++)if(M.apartment.grid[y][x]!==1)M.apartment.grid[y][x]=2;
for(let y=20;y<=24;y++)for(let x=25;x<=28;x++)M.apartment.grid[y][x]=1;
for(let y=23;y<=24;y++)for(let x=22;x<=28;x++)M.apartment.grid[y][x]=1;
M.apartment.rooms.push({x:25,y:20,w:4,h:5,name:'101호 · 안쪽 화장대'});
M.apartment.objects.push(
 prop('vanity-mirror','mirror',27,19.5,'화장대의 거울',{decor:2,reach:130,facing:'north',mount:true,solid:false,fixture:'mirror',artRole:'reflective-mirror',description:'거울이 있다. 서하가 다가서면 유리 안의 얼굴도 고개를 든다.'}),
 prop('vanity-table','vanity',27,21,'꽃병이 놓인 화장대',{decor:3,partOf:'vanity-mirror',w:27,back:24,front:12,description:'서윤이 쓰던 화장대. 꽃병과 서랍이 제자리에 있다. 거울 아래에는 「언니는 내 전화를 받았다」라고 긁혀 있다.'}),
 prop('vanity-curtain-left','curtain',25.5,19.5,'화장대 옆 암막 커튼',{decor:0,fixture:'curtain',facing:'north',mount:true,solid:false,description:'안쪽 벽의 창을 가린 암막 커튼. 천 뒤에서는 가느다란 바람만 샌다.'}),
 prop('vanity-curtain-right','curtain',28.5,19.5,'접힌 창가 커튼',{decor:1,fixture:'curtain',facing:'north',mount:true,solid:false,description:'커튼이 조금 열려 있다. 유리에 비치는 방 안의 불빛만 보인다.'}),
 prop('nook-screen','screen',24.5,22,'안쪽을 가리는 접이식 가림막',{decor:4,w:12,h:17,description:'거실에서 바로 보이지 않도록 꺾어 세운 가림막. 아래쪽으로 화장대 앞의 좁은 통로가 이어진다.'}),
 prop('home-curtain','curtain',6,4.5,'침실 창의 커튼',{decor:1,fixture:'curtain',facing:'north',mount:true,solid:false,description:'오래 열지 않은 창에 레이스 커튼이 걸려 있다. 천이 움직인 뒤에야 유리의 손자국이 보인다.'})
);
M.apartment.objects=M.apartment.objects.filter(o=>o.id!=='home-window');
Object.assign(M.apartment.objects.find(o=>o.id==='nook-screen'),{x:24.5*32,y:23.5*32,w:22,h:12});
M.apartment.objects.push(
 prop('living-armchair','armchair',20,15.5,'거실의 안락의자',{decor:6,w:18,back:22,front:12,description:'긴 의자 옆에서 마주 보도록 놓인 안락의자. 팔걸이에 작은 손톱 자국이 있다.'}),
 prop('living-side-table','side-table',22,15.5,'천을 덮은 작은 탁자',{decor:5,w:15,h:14,description:'안락의자 옆의 작은 독서용 탁자. 펼치다 만 수첩에는 서윤이 정리한 주민 증언 순서가 적혀 있다.'}),
 prop('bedroom-frame','photo',10,4.5,'침실 벽의 액자',{decor:7,facing:'north',mount:true,solid:false,reflective:true,description:'서윤과 나의 오래된 사진. 가까이 서면 액자의 유리 위로 지금 내 모습이 흐리게 겹친다.'}),
 prop('kitchen-fridge','fridge',28,9,'주방 냉장고',{kitchenTile:4,w:18,back:36,front:12,description:'전원이 끊긴 냉장고. 문틈의 고무 패킹은 오래전에 굳어 있다.'}),
 prop('kitchen-hood','hood',19,4.5,'가스레인지 위 환풍 후드',{kitchenTile:5,partOf:'kitchen-cabinet',mount:true,solid:false,description:'버너 위에 맞춰 달린 환풍 후드. 스위치를 눌러도 팬은 돌지 않는다.'})
);
// Break long repeated shelf runs into compact archives and function-specific furnishings.
M.upper.objects.find(o=>o.id==='archive-north-c').module.col=2;
M.upper.objects.find(o=>o.id==='archive-middle-b').module.col=2;
for(const [id,index,x,y,name,description]of [
 ['archive-north-d',4,12,6.5,'기록 출력용 프린터','취소된 접수 기록의 출력물이 용지 받침에 남아 있다. 종이 아래에는 서로 다른 사람의 확인 도장이 겹쳤다.'],
 ['archive-b',6,16,6.5,'녹음테이프 분류 서랍','연도별 녹음테이프가 작은 서랍으로 나뉘어 있다. 서윤 사건의 원본 자리만 비었다. 원본은 관리실 전자 문서함에 있다.'],
 ['archive-north-f',5,14,4.5,'연도별 보관 위치표','보관 위치표의 2023년 항목만 여러 번 지웠다. 종이에 남은 눌린 자국은 취소 접수 번호다.'],
 ['archive-north-g',0,19,7,'기록실의 외투 걸이','목 부분이 젖은 작업복 한 벌. 옷 아래 그림자는 발이 두 개가 아니다.'],
 ['archive-middle-c',9,18.5,13,'덮개 천을 보관한 스툴','서류함을 덮었던 천을 접어 둔 자리. 맨 아래 천만 아직 차갑다.'],
 ['archive-middle-d',7,35,7,'녹음 부스의 케이블 릴','마이크 케이블을 감은 이동식 릴. 선 끝은 사용하지 않은 채 묶여 있다.']
]){const o=M.upper.objects.find(o=>o.id===id);delete o.module;Object.assign(o,{details:index,x:x*32,y:y*32,name,description,w:index===0?12:24,back:24,front:12,mount:index===5,solid:index!==5});}
for(const [m,id,index,x,y,name,description,mount]of [
 ['lobby','entry-umbrella',1,6.5,22,'현관 우산꽂이','말라붙은 우산 아래에만 새 물방울이 맺혔다.',false],
 ['lobby','entry-intercom',3,5.5,7.5,'현관 인터폰','수화기를 들어도 연결음은 없다. 내려놓은 뒤에만 숨소리가 들린다.',true],
 ['management','office-printer',4,21,10,'관리실 프린터','용지 걸림으로 멈춘 프린터. 접수 취소 확인서의 끝부분만 인쇄됐다.',false],
 ['management','office-board',5,14,3.5,'야간 근무 게시판','근무표와 연락처가 서로 다른 크기의 종이로 붙어 있다. 서하의 이름 옆에 취소 확인 서명이 남았다.',true],
 ['apartment','bedroom-lamp',8,11,13,'침실 스탠드','전구가 빠져 있다. 갓 안쪽으로 긁은 숫자 04가 남았다.',false],
 ['apartment','bedroom-linen',9,5.5,13.5,'접어 둔 침구','이삿짐에 넣지 못한 침구. 천 사이에 갇힌 비누 냄새가 아직 남았다.',false],
 ['basement','utility-mop',2,29,13,'설비실 청소 도구','대걸레와 빈 청소용 버킷. 바닥의 물자국은 버킷에서 떨어진 것이 아니다.',false],
 ['basement','basement-vent',11,37,4.5,'전기실 환기구','환기 덕트의 날개가 멈췄다. 그 안에서만 바람이 거꾸로 들어온다.',true],
 ['upper','studio-notice',5,28,4.5,'녹음 순서 메모','서윤이 적은 녹음 순서. 마지막 칸은 증언자 대신 「언니가 듣고 있다」라고 적혀 있다.',true]
])M[m].objects.push(prop(id,'detail',x,y,name,{details:index,w:16,back:22,front:12,mount,solid:!mount,description}));
Object.assign(M.upper.objects.find(o=>o.id==='broadcast-chair'),{x:31.5*32,y:14.4*32});
M.upper.objects.push(prop('archive-reading-table','side-table',12.5,12.5,'독서 자리의 작은 탁자',{decor:5,w:15,h:14,description:'기록을 펼쳐 보던 독서 자리. 수첩에는 23시 41분의 녹음 번호가 여러 번 적혔다.'}),prop('archive-reading-chair','armchair',14.5,12.5,'기록실 독서 의자',{decor:6,w:18,back:22,front:12,description:'작은 탁자와 스탠드 사이에 놓인 의자. 방석에 누군가 앉았던 자국이 서서히 돌아온다.'}),prop('archive-reading-lamp','detail',16,12.5,'독서 자리의 스탠드',{details:8,w:12,back:16,front:10,description:'전원선을 빼도 갓 안쪽의 작은 그림자가 움직인다.'}));
// Every fixture has a single explicit semantic action; plain props remain inspection only.
for(const m of Object.values(M))for(const o of m.objects){o.fixture??=o.collectible?'document':o.internalDoor?'door':o.hide?'hide':'inspect';}
// Single-leaf doors occupy one 32px opening; never stretch a leaf across two tiles.
for(const m of Object.values(M))for(const o of m.objects.filter(o=>o.internalDoor)){
 const cell=o.cells.at(-1);for(const [x,y] of o.cells)m.grid[y][x]=2;
 m.grid[cell[1]][cell[0]]=1;o.cells=[cell];o.x=(cell[0]+.5)*32;o.y=(cell[1]+.5)*32;o.aperture=32;
 if(o.facing==='east'||o.facing==='west'){o.w=13;o.h=20;}else{o.w=20;o.h=13;}
}
for(const m of Object.values(M))for(const o of m.objects){
 if(o.kind==='door'){o.doorType??=o.sealed?'sealed':m.id==='apartment'||o.id==='apartment-door'?'residential':'service';o.aperture??=32;}
}

for (const m of Object.values(M)) {
  for (const o of m.objects) {
    o.solid ??= !o.mount && !["door", "stairs", "exit"].includes(o.kind);
    o.w ??= o.kind === "bed" ? 43 : o.kind === "chair" ? 13 : ["bench","desk","shelf","player"].includes(o.kind) ? 31 : 23;
    o.h ??= o.kind === "chair" ? 10 : 17;
  }
}
for(const m of Object.values(M))for(const o of m.objects){
 if((o.kind==='door'&&!o.internalDoor)||o.kind==='shutter'){const a=wallAnchor(m,o);o.x=a.x;o.y=a.y;}
 if(o.mount&&!o.facing){const x=Math.floor(o.x/32),y=Math.floor(o.y/32);o.facing=m.grid[y+1]?.[x]===1?'north':m.grid[y-1]?.[x]===1?'south':m.grid[y]?.[x+1]===1?'east':'west';}
}
export function wallAnchor(map,o){
 if(o.kind==='stairs'||o.barrier||o.internalDoor)return {x:o.x,y:o.y};
 let best=null;const ox=Math.floor(o.x/32),oy=Math.floor(o.y/32);
 for(let y=oy-3;y<=oy+3;y++)for(let x=ox-3;x<=ox+3;x++)if(map.grid[y]?.[x]===2){const d=Math.hypot(x+.5-o.x/32,y+.5-o.y/32);if(!best||d<best.d)best={x,y,d};}
 return best?{x:best.x*32+16,y:best.y*32+16}:{x:o.x,y:o.y};
}
export const ECHO_ZONES={
 lobby:{x:30*32,y:14*32,radius:120,at:[31*32,14*32],text:'신고를 취소한 사람'},
 basement:{x:34*32,y:14*32,radius:100,at:[31*32,14*32],text:'문 뒤에 두고 갔잖아'},
 apartment:{x:26*32,y:23*32,radius:90,at:[26*32,22.5*32],text:'이번에도 모른 척할 거야'},
 upper:{x:38*32,y:20*32,radius:110,at:[36*32,19*32],text:'내 목소리를 지우지 마'}
};
export const MAPS = M;
export function nearestObject(map,s){
 return map.objects.filter(o=>!o.partOf&&Math.hypot(o.x-s.x,o.y-s.y)<(o.reach||(o.kind==='stairs'?76:70))&&sight(map,s,o)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;
}
export function fixtureVisual(o,s){
 if(o.fixture==='fuse-source')return {sheet:'supply',index:s.flags.fuseTaken||s.flags.power||s.bag.includes('fuse')?2:1};
 if(o.fixture==='fuse-socket')return {sheet:'supply',index:s.flags.power?4:3};
 if(o.supply!==undefined)return {sheet:'supply',index:o.supply};
 return null;
}
export function worldFor(s){
 const m=MAPS[s.map];return {...m,openDoors:new Set(m.objects.filter(o=>o.internalDoor&&(s.flags?.['open_'+o.id]??o.defaultOpen)).map(o=>o.id))};
}
export function opaque(map,x,y){return map.grid[y]?.[x]!==1&&!map.glassCells?.has(x+','+y)}
export function doorOpen(map,o){return map.openDoors?map.openDoors.has(o.id):!!o.defaultOpen}
export function closedDoorAt(map,x,y){return map.objects.some(o=>o.internalDoor&&!doorOpen(map,o)&&Math.abs(x-o.x)<o.w&&Math.abs(y-o.y)<o.h)}

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
        o.solid && !(o.internalDoor&&doorOpen(map,o)) && Math.abs(x - o.x) < o.w + 6 && y > o.y - (o.back ?? o.h) - 4 && y < o.y + (o.front ?? o.h) + 4,
    )
  );
}
export function sight(map, a, b) {
  if(b.mount&&b.facing){
    if(b.facing==='north'&&a.y<b.y-3||b.facing==='south'&&a.y>b.y+3||b.facing==='east'&&a.x<b.x-3||b.facing==='west'&&a.x>b.x+3)return false;
  }
  const d = Math.hypot(b.x - a.x, b.y - a.y),
    steps = Math.ceil(d / 12);
  const targetDoor=map.objects.find(o=>o.internalDoor&&o.id===b.id);
  for (let i = 1; i < steps; i++) {
    const x = a.x + ((b.x - a.x) * i) / steps,
      y = a.y + ((b.y - a.y) * i) / steps;
    if(closedDoorAt(map,x,y)&&Math.hypot(x-b.x,y-b.y)>Math.max(targetDoor?.w||0,targetDoor?.h||0)+1)return false;
    if (opaque(map,Math.floor(x/32),Math.floor(y/32))) {
      // Handle interaction tolerates the last few pixels of a door jamb. This
      // endpoint exception applies only to that door, never to actors or rays.
      if(targetDoor&&Math.hypot(x-b.x,y-b.y)<=Math.max(targetDoor.w,targetDoor.h)+8)continue;
      const mounted =
        map.grid[Math.floor(b.y / 32)]?.[Math.floor(b.x / 32)] === 2;
      if (!mounted || Math.hypot(x - b.x, y - b.y) > 40) return false;
    }
  }
  return true;
}
export function clearSegment(map,a,b){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8));
  for(let i=1;i<=steps;i++)if(!canMove(map,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
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
      if (seen.has(key) || !clearSegment(map, v===start?from:{x:v[0]*32+16,y:v[1]*32+16}, {x:n[0]*32+16,y:n[1]*32+16}))
        continue;
      seen.add(key);
      parent.set(key, v);
      q.push(n);
    }
  }
  return [];
}
