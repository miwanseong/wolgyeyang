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

M.apartment.objects.push(prop('living-bench','bench',25,15.5,'거실의 긴 의자',{description:'두 사람이 나란히 앉던 자리. 방석 밑에는 서윤의 이름표가 눌려 있다.'}),prop('living-photo','photo',29.5,15,'거실 벽의 사진',{mount:true,solid:false,description:'세 해 전의 우리. 사진을 돌리면 날짜 대신 「전화는 받았다」라는 글씨가 보인다.'}));
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
for (const m of Object.values(M)) {
  for (const o of m.objects) {
    o.solid ??= !o.mount && !["door", "stairs", "exit"].includes(o.kind);
    o.w ??= o.kind === "bed" ? 43 : o.kind === "chair" ? 13 : ["bench","desk","shelf","player"].includes(o.kind) ? 31 : 23;
    o.h ??= o.kind === "chair" ? 10 : 17;
  }
}
export const MAPS = M;
export function worldFor(s){
 const m=MAPS[s.map];return {...m,openDoors:new Set(m.objects.filter(o=>o.internalDoor&&s.flags?.['open_'+o.id]).map(o=>o.id))};
}
export function opaque(map,x,y){return map.grid[y]?.[x]!==1&&!map.glassCells?.has(x+','+y)}
export function closedDoorAt(map,x,y){return map.objects.some(o=>o.internalDoor&&!map.openDoors?.has(o.id)&&Math.abs(x-o.x)<o.w&&Math.abs(y-o.y)<o.h)}

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
        o.solid && !(o.internalDoor&&map.openDoors?.has(o.id)) && Math.abs(x - o.x) < o.w + 6 && y > o.y - (o.back ?? o.h) - 4 && y < o.y + (o.front ?? o.h) + 4,
    )
  );
}
export function sight(map, a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y),
    steps = Math.ceil(d / 12);
  const targetDoor=map.objects.find(o=>o.internalDoor&&o.id===b.id);
  for (let i = 1; i < steps; i++) {
    const x = a.x + ((b.x - a.x) * i) / steps,
      y = a.y + ((b.y - a.y) * i) / steps;
    if(closedDoorAt(map,x,y)&&Math.hypot(x-b.x,y-b.y)>Math.max(targetDoor?.w||0,targetDoor?.h||0)+1)return false;
    if (opaque(map,Math.floor(x/32),Math.floor(y/32))) {
      const mounted =
        map.grid[Math.floor(b.y / 32)]?.[Math.floor(b.x / 32)] === 2;
      if (!mounted || Math.hypot(x - b.x, y - b.y) > 32) return false;
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
