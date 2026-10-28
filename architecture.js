// Space planning is shared by both chapters: circulation, wet rooms and service rooms
// have distinct fixtures; furniture dimensions use one world scale.
export const SPACE_PLANS={
 relayDrain:{use:'기록동 하부 집수·배수 점검 공간',circulation:'낙하/점검계단→배수 연결로→수압 조작실→남쪽 우회로→안전계단',service:'수위차 우회 밸브와 수동 수문을 분리하고 배관은 벽에 고정'},
 lobby:{use:'공동주택 공용 현관',circulation:'접수대→중앙복도→세대 현관 / 동쪽 계단',service:'각 세대 욕실, 관리실·수변전실은 별실'},
 management:{use:'관리 업무·문서 보관',circulation:'방문자 대기→접수 책상→잠금 보관함',service:'문서장은 벽면, 업무 책상 뒤 작업 통로'},
 apartment:{use:'101호 자매의 집',circulation:'현관→거실→침실·주방·욕실',service:'주방·욕실은 생활 공간과 문으로 분리'},
 unit102:{use:'102호 옛집',circulation:'현관→거실 / 침실·독립 주방·욕실',service:'샤워·변기·세면대를 용도별 배치'},
 unit103:{use:'103호 관리인 옛집',circulation:'현관→순찰 준비 공간 / 침실·주방·욕실',service:'근무용 비품과 생활용품 분리'},
 unit104:{use:'104호 임시 문서 정리실',circulation:'현관→작업 거실→잠금 기록방',service:'기존 세대의 욕실·소형 주방 보존'},
 basement:{use:'공용 창고·전기 설비',circulation:'계단 전실→분리된 창고·수변전실',service:'침구 상자와 전기 작업대를 분리'},
 upper:{use:'기록실·방송실',circulation:'계단 전실→기록실 / 조정실→녹음 부스',service:'흡음·관찰창·제어 장비는 해당 방에만'},
 relayYard:{use:'중계소 외부 마당',circulation:'주차 구획→보행 통로→접수동',service:'우수 배수·대기 공간과 차량 동선 분리'},
 relayEntry:{use:'중계소 공용 접수층',circulation:'접수→연결 복도→기록동·당직실·계단',service:'남녀 화장실은 공용 복도에서 각각 진입'},
 relayArchive:{use:'기록 보존·청취',circulation:'복도→원본 열람 / 대조·청취→복원 보관',service:'서가와 장비 앞 작업 통로 확보'},
 relayPlant:{use:'지하 설비층',circulation:'계단→공용 복도→펌프실·절체실',service:'수계 배관과 전기 제어는 벽으로 분리'},
 relaySignal:{use:'원본 청취·송출층',circulation:'계단→전실→청취 부스·제어실',service:'방음문·장비 랙·귀환 연결문'},
};
export function applyArchitecture(M,prop){
 const fixture=(m,id,x,y,name,index,extra={})=>M[m].objects.push(prop(id,'sanitary',x,y,name,{sanitary:index,w:10,back:12,front:9,description:name+'의 위치와 배관이 벽면에 맞춰져 있다.',...extra}));
 const leaf=(m,id,x,y,name)=>M[m].objects.push(prop(id,'door',x+.5,y+.5,name,{internalDoor:true,cells:[[x,y]],facing:'north',solid:true,w:20,h:13,doorType:'service'}));
 const room=(m,x,y,w,h,name)=>{const a=M[m];for(let yy=y-1;yy<=y+h;yy++)for(let xx=x-1;xx<=x+w;xx++)if(a.grid[yy]?.[xx]!==undefined)a.grid[yy][xx]=xx>=x&&xx<x+w&&yy>=y&&yy<y+h?1:2;a.rooms.push({x,y,w,h,name});};
 while(M.relayEntry.grid.length<40)M.relayEntry.grid.push(Array(M.relayEntry.w).fill(0));M.relayEntry.h=40;
 // Two independent public WC rooms off the existing public corridor, not through offices.
 for(const [sex,x,door]of [['남자',8,12],['여자',24,28]]){
  room('relayEntry',x,30,10,8,sex+' 화장실');leaf('relayEntry','wc-'+door,door,29,sex+' 화장실 출입문');M.relayEntry.objects.at(-1).doorType='bathroom';
  fixture('relayEntry','wc-'+door+'-toilet',x+1.5,33,sex+' 화장실 좌변기',0);
  fixture('relayEntry','wc-'+door+'-basin',x+7.5,29.5,sex+' 화장실 세면대',1,{lineBasin:true,mount:true,facing:'north',solid:false,w:32});
  
  fixture('relayEntry','wc-'+door+'-partition',x+3,33,'용변 칸막이',3,{w:5,back:25,front:10,mount:true,solid:false,facing:'west'});
  for(let xx=x;xx<=x+3;xx++)M.relayEntry.grid[31][xx]=2;for(let yy=31;yy<=35;yy++)M.relayEntry.grid[yy][x+3]=2;for(let xx=x;xx<=x+3;xx++)M.relayEntry.grid[35][xx]=2;leaf('relayEntry','wc-'+door+'-stall',x+1,35,sex+' 화장실 안쪽 칸 문');
  if(sex==='여자'){for(let xx=x+4;xx<=x+6;xx++)M.relayEntry.grid[31][xx]=2;for(let yy=31;yy<=35;yy++)M.relayEntry.grid[yy][x+6]=2;for(let xx=x+4;xx<=x+6;xx++)M.relayEntry.grid[35][xx]=2;leaf('relayEntry','wc-'+door+'-stall2',x+4,35,'여자 화장실 두 번째 칸 문');}
  fixture('relayEntry','wc-'+door+'-second',sex==='남자'?x+6:x+4.5,sex==='남자'?29.5:33,sex==='남자'?'남자 화장실 소변기':'여자 화장실 두 번째 좌변기',sex==='남자'?2:0,sex==='남자'?{mount:true,facing:'north',solid:false}:{});
  M.relayEntry.objects=M.relayEntry.objects.filter(o=>o.id!=='wc-'+door+'-partition');
  if(sex==='남자'){M.relayEntry.objects=M.relayEntry.objects.filter(o=>o.id!=='wc-'+door+'-second');for(const [i,y]of [31.5,34,36.5].entries())fixture('relayEntry','wc-urinal-'+i,x+10,y,'남자 화장실 오른쪽 벽 소변기 '+(i+1),2,{urinalSide:true,decorativeOnly:true,mount:true,facing:'east',solid:false});}
  fixture('relayEntry','wc-'+door+'-bin',x+9.7,37.6,'위생용품 수거함',5,{w:4,back:6,front:3,slimBin:true});
  M.relayEntry.objects.push(prop('wc-'+door+'-sign','sign',door-1.5,29.5,sex+' 화장실 표지',{solid:false,mount:true,facing:'north',decorativeOnly:true,roomSign:sex+' 화장실',signSex:sex}));
 }
 // The vacant flat still has the wet services of a home.
 room('unit104',5,20,4,5,'104호 · 욕실');for(let y=21;y<=23;y++)for(let x=9;x<=11;x++)M.unit104.grid[y][x]=1;for(let y=20;y<=24;y++)M.unit104.grid[y][9]=2;leaf('unit104','104-bath-door',9,22,'104호 욕실 문');M.unit104.objects.at(-1).facing='east';
 fixture('unit104','104-toilet',6,21,'104호 변기',0);fixture('unit104','104-basin',6,24,'104호 세면대',1);
 room('unit104',21,20,6,5,'104호 · 소형 주방');for(let y=21;y<=23;y++)for(let x=19;x<=21;x++)M.unit104.grid[y][x]=1;
 for(let y=20;y<=24;y++)M.unit104.grid[y][20]=2;leaf('unit104','104-kitchen-door',20,22,'104호 주방 문');M.unit104.objects.at(-1).facing='east';
 M.unit104.objects.push(prop('104-kitchen','counter',24,20.5,'104호 소형 싱크와 조리대',{kitchenTile:2,w:28,back:20,front:10,description:'원래 세대의 소형 주방. 문서 정리실로 쓰던 때도 수도와 가스 밸브는 잠가 두었다.'}));
 for(const id of ['unit102','unit103']){fixture(id,id+'-toilet',5,20,id.slice(4)+'호 변기',0);fixture(id,id+'-basin',8.5,20,id.slice(4)+'호 세면대',1);}
 M.relayArchive.objects.push(prop('relay-seal-desk','desk',8,20,'원본 인계 봉인대',{standardDesk:true,recordRoute:'A',w:23,back:20,front:10,description:'원본 전체의 인수 번호를 묶어 봉인하는 자리. 내 통화만 골라 빼지 않고 복원·인계한다.'}),prop('relay-edit-card','desk',46,18,'부분 사본 발급대',{standardDesk:true,recordRoute:'B',w:23,back:20,front:10,description:'편집용 관리카드 발급대. 정우의 조작 이력만 빠르게 복사할 수 있으나, 누락된 통화 원본은 확인하지 않은 사본이다.'}));
 M.relaySignal.objects.push(prop('relay-booth-release','panel',20,10,'청취 부스 비상 잠금 해제기',{trapRelease:true,technical:7,w:10,back:12,front:8,description:'문틀에 연결된 기계식 비상 해제 손잡이.'}),prop('relay-partial-copy','monitor',42,15,'부분 사본 편집 단말',{partialExport:true,regional:1,w:20,back:22,front:10,description:'관리카드로 지정한 원격 잠금 이력만 복사한다.'}));
 for(const [id,m]of Object.entries(M)){
  for(const o of m.objects){if(o.internalDoor&&/욕실|화장실|칸 문/.test(o.name))o.doorType='bathroom';}
  m.spacePlan=SPACE_PLANS[id]||m.spacePlan;m.wetCells=new Set();for(const r of m.rooms.filter(r=>/욕실|화장실/.test(r.name)))for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(m.grid[y]?.[x]===1)m.wetCells.add(x+','+y);
  for(const o of m.objects){
   if(o.kind==='desk'&&!o.mount&&!o.module&&o.counter===undefined&&o.technical===undefined&&o.facility===undefined&&o.regional===undefined&&o.supply===undefined&&!o.hideKind&&!o.hiddenClue){o.standardDesk=true;o.deskWidth=64;}
  }
  for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++)if(m.grid[y][x]===0&&[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>m.grid[y+dy]?.[x+dx]===1))m.grid[y][x]=2;
 }
 M.lobby.rooms.push({x:3,y:12,w:35,h:5,name:'중앙 공용 복도'},{x:5,y:17,w:13,h:7,name:'현관 접수·대기'},{x:35,y:9,w:6,h:15,name:'동쪽 계단 전실'});
}
