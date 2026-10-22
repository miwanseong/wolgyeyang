// Chapter two is a separate location. Its records and power system never reuse
// the apartment's fuse, locker or shutter actions.
export function addRelayChapter(M,map,prop,door){
 const rooms={
  relayEntry:['02 · 산북중계소 / 접수동',52,36,'stone',[[4,23,43,6],[8,7,13,15],[25,7,18,15],[41,29,6,3],[4,17,4,8]]],
  relayArchive:['02 · 산북중계소 / 대조 기록동',58,38,'wood',[[4,24,49,6],[5,6,20,17],[29,6,21,17],[46,30,7,4],[51,18,5,10]]],
  relayPlant:['02 · 산북중계소 / 지하 냉각 설비',58,38,'concrete',[[4,24,49,6],[5,6,20,17],[29,6,21,17],[46,30,7,4],[7,29,14,6]]],
  relaySignal:['02 · 산북중계소 / 비상 송출층',56,40,'carpet',[[4,26,47,5],[5,7,17,18],[26,7,22,18],[43,31,8,4],[7,30,13,7]]],
 };
 for(const [id,[name,w,h,floor,rects]]of Object.entries(rooms)){M[id]=map(id,name,w,h,floor,rects);M[id].chapter=2;}
 function put(m,id,kind,x,y,name,extra={}){const o=prop(id,kind,x,y,name,extra);M[m].objects.push(o);return o;}
 function leaf(m,id,x,y,name){
  M[m].grid[y][x]=1;
  put(m,id,'door',x+.5,y+.5,name,{internalDoor:true,cells:[[x,y]],facing:'north',doorType:'service',solid:true,defaultOpen:false});
 }
 function link(m,id,x,y,name,to,spawn,extra={}){M[m].objects.push(door(id,x,y,name,to,spawn,{doorType:'fire',...extra}));}
 function detail(m,id,index,x,y,name,description,extra={}){return put(m,id,'detail',x,y,name,{details:index,w:16,back:22,front:12,description,...extra});}
 function wall(m,id,index,x,y,name,description,extra={}){return detail(m,id,index,x,y,name,description,{mount:true,solid:false,facing:'north',...extra,...(extra.decor!==undefined?{details:undefined}:{})});}
 function furniture(m,id,kind,x,y,name,description,extra={}){return put(m,id,kind,x,y,name,{description,...extra});}
 function action(m,id,kind,x,y,name,chapterAction,description,extra={}){return furniture(m,id,kind,x,y,name,description,{chapterAction,...extra});}
 function hide(m,x,y){furniture(m,m+'-hide','cabinet',x,y,'비어 있는 장비 보관장','선반을 비워 둔 장비 보관장. 불을 끄고 몸을 숨길 수 있다.',{hide:true,w:24,back:30,front:12});}
 function shelf(m,id,x,y,col=0){furniture(m,id,'shelf',x,y,'번호별 기록 서가','사건 번호별로 정리된 문서. 통로를 비워 두고 벽을 따라 배치했다.',{regional:7,w:28,back:28,front:10});}
 // Reception: two enclosed offices open onto a wide, furnished waiting corridor.
 leaf('relayEntry','relay-reception-door',14,22,'접수실 방화문');
 leaf('relayEntry','relay-duty-door',32,22,'당직실 방화문');
 link('relayEntry','relay-entry-archive',14,6,'연결 통로 · 기록동','relayArchive',[49,32],{requires:'relayBadge'});
 link('relayEntry','relay-entry-plant',32,9,'내려가는 계단 · 설비동','relayPlant',[49,32],{kind:'stairs',label:'B1 ↓'});
 action('relayEntry','relay-register','desk',13,11,'해린의 야간 인계대','register','인수 대상: 월계동 신고 접수 원본. 기록동 출입증은 인계대 서랍에 남겨 두었다.',{w:38,back:30,front:14});
 detail('relayEntry','relay-register-printer',4,18,11,'접수실 프린터','23:41 접수 / 23:43 취소 / 23:47 원격 잠금 유지. 세 장 모두 같은 번호를 가리킨다.');
 wall('relayEntry','relay-entry-board',5,12,6.5,'시설 구역 안내','접수동 → 기록동에서 취소 이력 대조 → 지하 냉각 회로 복구 → 송출층. 비상 송출은 복원 기록과 냉각 확인이 모두 필요하다.');
 furniture('relayEntry','relay-entry-chair','chair',13,13,'접수대 회전 의자','의자는 바깥 문을 등지고 있다.',{swivel:true,w:12,h:10});
 shelf('relayEntry','relay-entry-files',18,17,0);
 wall('relayEntry','relay-entry-curtain',0,18,6.5,'접수실 암막 커튼','유리에 산길 대신 현관 복도가 비친다.',{decor:0,fixture:'curtain'});
 action('relayEntry','relay-duty-note','desk',30.5,13,'미정의 당직 수첩','dutyNote','02:13. 중계소에는 연락하지 않았다. 녹음이 먼저 도착해 있었다.',{w:38,back:30,front:14});
 furniture('relayEntry','relay-duty-sofa','bench',30.5,18,'당직용 긴 의자','접힌 담요가 하나. 서윤이 잠들었던 자리가 아니라, 서윤을 기다리던 자리다.',{w:39,back:24,front:10});
 detail('relayEntry','relay-duty-linen',9,36,18,'갈아 놓은 침구','담요는 마른 상태인데, 밑에 남은 자국만 젖어 있다.');
 detail('relayEntry','relay-duty-coat',0,39,10,'미정의 외투 걸이','산길에서 입었던 외투. 주머니에는 여섯 이름을 적은 종이 조각이 있다.',{w:12});
 wall('relayEntry','relay-duty-intercom',3,38,6.5,'내선 수화기','수화기 속에서 종이가 넘어가는 소리만 난다.');
 hide('relayEntry',39,17);
 for(const [x,id]of [[10,'a'],[23,'b'],[36,'c']])furniture('relayEntry','relay-wait-'+id,'bench',x,27,'벽 쪽 대기 의자','각 의자 아래의 먼지 자국이 바깥 문에서 기록동으로 이어진다.',{w:37,back:18,front:10});
 detail('relayEntry','relay-entry-umbrella',1,44,27,'젖은 우산꽂이','들어올 때 비는 오지 않았다.');
 // Archive: raw intake and return-channel records are on different sides.
 leaf('relayArchive','relay-raw-door',15,23,'접수 기록실 문');
 leaf('relayArchive','relay-audit-door',39,23,'대조 청취실 문');
 link('relayArchive','relay-archive-back',49,34,'연결 통로 · 접수동','relayEntry',[14,8]);
 for(const [x,y,col,id]of [[9,8,0,'a'],[13,8,1,'b'],[18,8,2,'c'],[9,17,0,'d'],[18,17,2,'e']])shelf('relayArchive','relay-shelf-'+id,x,y,col);
 action('relayArchive','relay-incoming','desk',13,12,'23:41 · 최초 접수지','incoming','서윤의 신고 원본. 방화문 개방 요청이 접수되었다.',{w:38,back:27,front:13});
 wall('relayArchive','relay-raw-label',5,12,5.5,'접수 원본 분류표','원본은 접수 시각대로 분류한다. 통화 내용과 처리 결과를 같은 것으로 취급하지 말 것.');
 action('relayArchive','relay-cancel','player',33,10,'23:43 · 취소 통화 데크','cancel','서하의 음성이 담긴 취소 통화. 전화가 끝나도 회선은 닫히지 않았다.',{technical:6,w:46,back:30,front:16});
 action('relayArchive','relay-override','monitor',44,10,'23:47 · 원격 회신 단말','override','정우의 원격 잠금 유지 확인. 「취소」와 「잠금 유지」는 별개의 처리였다.',{regional:1,w:24,back:30,front:12});
 action('relayArchive','relay-compare','desk',38,18,'세 기록을 대조하는 작업대','compare','접수 → 취소 → 원격 회신의 순서를 정리하면 원본 사본을 발급할 수 있다.',{w:38,back:28,front:14});
 detail('relayArchive','relay-audit-printer',4,44,18,'대조 출력기','대조를 마친 기록만 복제한다. 지워진 줄도 여백에 함께 인쇄된다.');
 action('relayArchive','relay-erasure','detail',31,18,'해린의 수정 이력 서랍','erasure','수정 이력지에는 지운 문장이 그대로 남았다.',{details:6,w:22,back:22,front:12});
 wall('relayArchive','relay-archive-curtain',0,34,5.5,'청취실 두꺼운 커튼','커튼은 소리를 가리지 못한다.',{decor:0,fixture:'curtain'});
 detail('relayArchive','relay-archive-reel',7,45,14,'분리된 청취 케이블','입력과 출력 케이블에 같은 이름표가 달렸다.');
 furniture('relayArchive','relay-listen-chair','chair',38,20,'대조대 의자','의자가 천천히 입구를 향한다.',{swivel:true,w:12,h:10});
 hide('relayArchive',47,20);
 // Machinery: a mechanical cooling valve and a two-stage electrical transfer.
 leaf('relayPlant','relay-cooling-door',15,23,'냉각 순환실 방화문');
 leaf('relayPlant','relay-switch-door',39,23,'전원 절체실 방화문');
 link('relayPlant','relay-plant-back',49,32,'계단 · 접수동','relayEntry',[32,9],{kind:'stairs',label:'접수동 ↑'});
 link('relayPlant','relay-plant-signal',39,8,'계단 · 송출층','relaySignal',[47,33],{kind:'stairs',label:'송출층 ↑'});
 action('relayPlant','relay-handwheel','desk',10,10,'정비대의 수동 핸들','wheel','분리 보관한 냉각 밸브 핸들. 연결 축의 사각 홈과 맞는다.',{w:31,back:24,front:12,chapterVisual:'wheel-source'});
 action('relayPlant','relay-cooling','rack',18,16,'핸들이 빠진 냉각 순환 밸브','cooling','빈 밸브 축이 배관 앞에 보인다. 억지로 전원을 올리기 전에 순환 밸브를 열어야 한다.',{regional:6,w:30,back:27,front:13,chapterVisual:'valve'});
 detail('relayPlant','relay-mop',2,7,19,'누수 정리 도구','양동이에 떨어지는 물방울과 배관 안쪽 소리가 반 박자 어긋난다.');
 wall('relayPlant','relay-cooling-guide',5,12,5.5,'절체 순서 안내','① 냉각 밸브 개방 ② 기존 입력 분리 ③ 비상 회선 투입. 기존 입력을 분리하지 않으면 과거 회신이 계속 되돌아온다.');
 action('relayPlant','relay-isolator','panel',33,11,'기존 입력 분리 스위치','isolate','아파트 쪽 회신선을 먼저 분리해야 한다.',{technical:7,w:22,back:36,front:14,chapterVisual:'isolator'});
 action('relayPlant','relay-transfer','panel',44,11,'비상 회선 절체 제어반','transfer','냉각과 분리 상태를 확인한 뒤 투입한다. 퓨즈를 끼우는 장치가 아니다.',{technical:7,w:22,back:36,front:14,chapterVisual:'power'});
 action('relayPlant','relay-pressure','desk',38,19,'도현의 설비 관찰지','pressure','회선이 살아 있을 때만 움직인 압력계의 기록.',{w:38,back:28,front:14});
 wall('relayPlant','relay-plant-vent',11,37,5.5,'비상 배기구','멈춘 날개 뒤에서 누군가 바닥을 긁는다.');
 hide('relayPlant',47,20);
 // Transmission floor: separate listening booth and equipment/control room.
 leaf('relaySignal','relay-booth-door',14,25,'최종 청취실 방음문');
 leaf('relaySignal','relay-control-door',37,25,'비상 송출실 방화문');
 link('relaySignal','relay-signal-back',47,33,'계단 · 설비동','relayPlant',[39,8],{kind:'stairs',label:'설비동 ↓'});
 link('relaySignal','relay-shortcut-out',32,6,'비상 연결문 · 접수동','relayEntry',[41,8],{unlockShortcut:true});
 link('relayEntry','relay-shortcut-in',41,6,'안쪽에서 잠긴 송출층 연결문','relaySignal',[32,8],{requires:'relayShortcut'});
 action('relaySignal','relay-last-voice','player',13,13,'서윤의 마지막 회신','lastVoice','건물에서 들은 녹음 이후의 목소리. 서윤은 신고가 취소된 뒤에도 회신을 기다렸다.',{technical:6,w:46,back:30,front:16});
 wall('relaySignal','relay-booth-curtain',0,13,6.5,'청취실 차음 커튼','문 밖의 소리를 가리기 위한 커튼. 안쪽 소리는 복도로 새고 있다.',{decor:0,fixture:'curtain'});
 furniture('relaySignal','relay-booth-chair','chair',13,16,'회신을 기다리는 의자','서윤이 앉았던 의자가 아니다. 서하가 앉을 자리다.',{swivel:true,w:12,h:10});
 detail('relaySignal','relay-mic-reel',7,18,19,'마이크 케이블','선은 제어실 벽 안쪽으로 이어진다.');
 for(const [x,id]of [[30,'a'],[34,'b'],[39,'c'],[44,'d']])furniture('relaySignal','relay-equipment-'+id,'panel',x,10,'비상 송출 장비 랙','서로 다른 회선 번호를 담당하는 랙. 초록 불빛 대신 작은 흰 표시등이 켜졌다.',{technical:7,w:20,back:36,front:12});
 action('relaySignal','relay-transmitter','player',36,19,'원본 대조·내보내기 콘솔','transmit','원본·취소 이력·잠금 회신을 하나의 기록으로 송출한다.',{technical:6,w:46,back:30,front:16});
 action('relaySignal','relay-six-names','desk',44,19,'송출 확인 명부','names','서하, 서윤, 정우, 해린, 도현, 미정. 여섯 이름 중 비워 둔 칸은 없다.',{w:31,back:28,front:12});
 hide('relaySignal',47,23);
 put('relayEntry','relay-final-exit','exit',44.5,32.5,'중계소 남쪽 외부 출입문',{chapterAction:'leaveRelay',solid:false,doorType:'service'});
 // Furniture is arranged as work and rest groups, leaving the door approaches clear.
 for(const [m,id,kind,x,y,name,description,extra]of [
  ['relayEntry','relay-reception-cabinet','cabinet',10,8,'인계 서류장','접수대에서 손을 뻗어 꺼낼 수 있도록 놓인 서류장.',{w:22,back:30,front:10}],
  ['relayEntry','relay-reception-lamp','detail',11,16,'접수실 독서등','인계 문서를 읽던 작은 독서 자리.',{details:8,w:12,back:16,front:10}],
  ['relayEntry','relay-reception-table','side-table',13,18,'인수 확인용 보조 탁자','서명을 기다리던 펜 받침만 남았다.',{decor:5,w:15,h:14}],
  ['relayEntry','relay-reception-seat','armchair',15,18,'인수 대기용 안락의자','접수대와 보조 탁자를 향해 놓인 의자.',{decor:6,w:18,back:22,front:12}],
  ['relayEntry','relay-duty-cabinet','cabinet',27,9,'당직 비품장','당직실 문 안쪽 벽을 따라 놓인 비품장.',{w:22,back:30,front:10}],
  ['relayEntry','relay-duty-table','side-table',34,18,'담요 옆 보조 탁자','식은 물컵 아래에 원형 먼지 자국이 남았다.',{decor:5,w:15,h:14}],
  ['relayEntry','relay-duty-lamp','detail',28,18,'당직실 스탠드','의자와 서류 사이를 비추던 조명.',{details:8,w:12,back:16,front:10}],
  ['relayArchive','relay-reading-desk','desk',11,20,'원본 열람 책상','서가에서 꺼낸 기록을 펼쳐 놓던 책상.',{w:31,back:28,front:12}],
  ['relayArchive','relay-reading-chair','chair',11,21.5,'열람 책상 의자','문서함이 아니라 열람대에 맞춰 놓인 의자.',{swivel:true,w:12,h:10}],
  ['relayArchive','relay-reading-lamp','detail',8.5,20,'열람 조명','깨진 전구 아래에만 종이 가루가 모였다.',{details:8,w:12,back:16,front:10}],
  ['relayArchive','relay-copy-cabinet','cabinet',21,13,'미대조 사본 서랍장','대조를 마치지 못한 사본은 이곳에 분리했다.',{w:22,back:30,front:10}],
  ['relayArchive','relay-deck-chair','chair',33,12.5,'취소 통화 청취 의자','데크 앞에 맞춰 놓인 의자. 케이블을 밟지 않게 통로에서 비켜 있다.',{swivel:true,w:12,h:10}],
  ['relayArchive','relay-audit-cabinet','cabinet',31,7,'회신 기록 보관장','원본 통화와 회신 기록을 서로 다른 보관장에 두었다.',{w:22,back:30,front:10}],
  ['relayPlant','relay-pipe-west','rack',8,8,'냉각 배관 분기','정비대 뒤 벽을 따라 이어진 순환 배관.',{regional:6,w:28,back:26,front:12}],
  ['relayPlant','relay-filter-rack','cabinet',21,9,'냉각 필터 보관장','교체 필터가 규격별로 정리돼 있다. 핸들은 서쪽 정비대에 있다.',{regional:7,w:28,back:28,front:10}],
  ['relayPlant','relay-maintenance-reel','detail',15,10,'정비용 케이블 릴','작업 구역 밖으로 밀어 둔 케이블 릴.',{details:7,w:18,back:20,front:10}],
  ['relayPlant','relay-service-bench','bench',10,18,'정비 대기용 긴 의자','공구함을 올리지 않은 대기용 의자.',{w:38,back:22,front:10}],
  ['relayPlant','relay-meter-chair','chair',38,21.5,'설비 기록대 의자','압력계 기록을 남기던 자리.',{swivel:true,w:12,h:10}],
  ['relaySignal','relay-console-side','desk',30,15,'송출 순서 기록대','회선 번호와 대조 결과를 옮겨 적던 보조 책상.',{w:31,back:28,front:12}],
  ['relaySignal','relay-console-chair','chair',30,17,'보조 기록대 의자','비상 송출 콘솔로 가는 중앙 통로는 비워 두었다.',{swivel:true,w:12,h:10}],
  ['relaySignal','relay-signal-monitor','monitor',44,15,'회신 상태 모니터','대기 중인 회선들이 같은 시각을 반복한다.',{regional:1,w:24,back:30,front:12}],
  ['relaySignal','relay-booth-bench','bench',9,21,'청취실 대기 의자','혼자 듣지 못할 때 곁에 앉으라고 놓은 의자.',{w:38,back:22,front:10}],
  ['relaySignal','relay-booth-coat','detail',18,9,'청취실 외투 걸이','여섯 사람 중 누구의 옷도 걸려 있지 않다.',{details:0,w:12,back:22,front:10}],
 ])furniture(m,id,kind,x,y,name,description,extra);
 wall('relayEntry','relay-reception-frame',0,15,6.5,'접수실 벽의 액자','유리에 서하의 모습만 흐리게 비친다.',{decor:7,hauntedPortrait:true});
 wall('relayPlant','relay-cooling-vent',11,18,5.5,'순환실 배기구','바람은 멈췄는데 안쪽에서 물소리가 난다.');
 wall('relaySignal','relay-channel-board',5,30,6.5,'송출 회선 배치도','회선은 번호별로 분리되어 있다. 기록을 지우는 대신 원본과 수정 이력을 함께 보낸다.');
 // Bent side galleries and a lower maintenance bay distinguish the silhouettes.
 wall('relayArchive','relay-archive-portrait',0,53,17.5,'사라지는 초상','눈동자가 내가 움직이는 쪽을 향한다. 밀판을 복원한 뒤 그림 속 사람이 사라졌다.',{decor:7,hauntedPortrait:true});
 wall('relaySignal','relay-gallery-portrait',0,13,37.5,'귀환 복도의 초상','액자 안의 여자는 복도 끝을 보고 있다. 내가 돌아서자 시선이 달라졌다.',{decor:7,hauntedPortrait:true,facing:'south'});
 wall('relayEntry','relay-portrait-notice',5,6,16.5,'인계 사진 보관 안내','사진의 눈이 나를 따라온다. 기록을 맞춘 뒤에도 여자가 안에 있는지 확인하고 싶지 않다.');
 detail('relayArchive','relay-gallery-box',6,54,22,'복원 대기 문서 상자','복원 번호가 찍힌 문서 상자. 밀판의 인쇄 번호는 왼쪽 위에서 오른쪽 아래로 읽는다.');
 furniture('relaySignal','relay-gallery-seat','bench',10,34,'초상 맞은편 긴 의자','앉은 사람의 윤곽만 먼지에서 지워졌다.',{w:38,back:18,front:10});
 wall('relayPlant','relay-sump-guide',5,12,35.5,'배관 점검도','점검판 좌상단 왼쪽으로 유입 → 아홉 관 순환 → 좌하단 아래로 배출. 열린 관 끝은 누수다.',{facing:'south'});
 detail('relayPlant','relay-sump-tools',2,9,33,'집수정 청소 도구','배수 트렌치 주변에만 바퀴 자국이 남아 있다.');
 wall('relayPlant','relay-locker-guide',5,17,5.5,'정비대 검증 표지','잠금함 A·B·C의 문장 중 정확히 하나만 참이다. 핸들 위치 하나를 가정하고 참인 문장을 세어 볼 것.');
 for(const [m,id,x,y]of [['relayEntry','relay-entry-clock',30,6.5],['relayArchive','relay-archive-clock',20,5.5],['relaySignal','relay-signal-clock',43,6.5]])wall(m,id,5,x,y,'멈춘 점검 시계','초침이 한 칸 되돌아간다. 원본 기록의 시각은 이 시계가 아니라 접수지에 남아 있다.');
 M.relayEntry.rooms.push({x:4,y:17,w:4,h:7,name:'꺾인 인계 사진 통로'});
 M.relayArchive.rooms.push({x:51,y:18,w:5,h:10,name:'동쪽 복원 사진 보관 통로'});
 M.relayPlant.rooms.push({x:7,y:30,w:14,h:5,name:'집수정 점검 구역'});
 M.relaySignal.rooms.push({x:7,y:31,w:13,h:6,name:'초상이 걸린 귀환 통로'});
 const work=M.relayPlant.objects.find(o=>o.id==='relay-handwheel');
 Object.assign(work,{module:{row:2,col:1,group:'relay-maintenance-work'},w:31,back:40,front:16});
 for(const [x,col]of [[8,0],[12,2]])furniture('relayPlant','relay-maintenance-end-'+col,'desk',x,10,'정비대 작업 공간','핸들 받침 양옆에 정비 도구를 정리한 작업대.',{module:{row:2,col,group:'relay-maintenance-work'},partOf:'relay-handwheel',w:31,back:40,front:16});
 for(const id of Object.keys(rooms)){
  M[id].rooms.push({x:4,y:id==='relaySignal'?26:id==='relayEntry'?23:24,w:42,h:5,name:'방화문이 이어지는 연결 복도'});
  wall(id,id+'-extinguisher',11,id==='relayEntry'?22:6,id==='relaySignal'?25.5:id==='relayEntry'?22.5:23.5,'연결 복도 소화기함','압력계와 안전핀이 그대로다.',{technical:11,details:undefined});
 }
}
