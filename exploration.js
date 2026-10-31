import {pickupBlocked} from './body.js?v=ae58b5091df2';
// Side wings have physical purposes, supply chains and finite discoveries.
export const EXPANSION_MAPS=['serviceHall','laundry','rearCourt','relayService','relayWorkshop','relayStore'];
export function addExploration(M,map,prop,door){
 const make=(id,name,floor,rects,rooms,chapter=1)=>{const m=M[id]=map(id,name,32,28,floor,rects);m.chapter=chapter;m.rooms=rooms.map(([x,y,w,h,name])=>({x,y,w,h,name}));m.spacePlan={use:name,circulation:rooms.map(r=>r[4]).join('→'),service:'용도별 비품은 벽 가장자리, 중앙 이동 통로는 비워 둔다'};return m;};
 make('serviceHall','1F · 후면 관리 복도','stone',[[4,7,9,16],[11,13,17,5],[23,5,5,12]],[[4,7,9,7,'경비 인계 전실'],[4,14,9,9,'후면 현관'],[13,13,15,5,'후면 연결 복도']]);
 make('laundry','1F · 공동 세탁실','stone',[[4,7,18,9],[6,15,7,9],[20,13,6,11]],[[4,7,13,9,'세탁 작업 구역'],[17,7,5,9,'분실물·열쇠 인계'],[6,18,7,6,'세탁실 전실'],[20,18,6,6,'뒷마당 출입 전실']]);
 make('rearCourt','외부 · 후면 건조 마당','concrete',[[4,5,24,18]],[[4,5,24,18,'배수로와 공동 건조 마당']]);M.rearCourt.outdoor=true;
 make('relayService','B1 · 정비 연결 복도','concrete',[[4,5,8,18],[10,15,18,5],[22,5,6,14]],[[4,5,8,10,'설비동 연결 전실'],[4,15,24,5,'정비 복도'],[22,5,6,10,'부품 보관 전실']],2);
 make('relayWorkshop','B1 · 통신 정비 작업실','concrete',[[4,5,23,14],[7,18,7,6]],[[4,5,12,14,'계측·커넥터 정비'],[16,5,11,14,'공구와 열쇠 관리'],[7,19,7,5,'작업실 전실']],2);
 make('relayStore','B1 · 밀봉 부품 보관실','concrete',[[4,5,14,10],[7,14,7,10]],[[4,5,7,10,'방습 포장·인수 구역'],[11,5,7,10,'음성 회선 예비 부품'],[7,15,7,9,'보관실 전실']],2);
 const put=(m,id,kind,x,y,name,e={})=>M[m].objects.push(prop(id,kind,x,y,name,e));
 const link=(m,id,x,y,name,to,spawn,e={})=>M[m].objects.push(door(id,x,y,name,to,spawn,e));
 // Both ends of every connection are real wall doorways, not unmarked teleports.
 link('lobby','west-service-door',4.5,19,'후면 관리 복도 출입문','serviceHall',[8,21],{facing:'east'});
 link('serviceHall','service-lobby',8,23,'현관 복도로','lobby',[7,19]);
 link('serviceHall','service-laundry',25,4.5,'잠긴 공동 세탁실','laundry',[9,22],{exploreGate:'laundryKey',lockedLine:'열쇠 구멍에 세탁실 비품 표찰이 걸려 있어. 경비 인계함에 반납하던 열쇠였지.'});
 link('laundry','laundry-back',9,24,'후면 관리 복도로','serviceHall',[25,7]);
 link('laundry','laundry-court',23,24,'후면 건조 마당 출입문','rearCourt',[9,7],{exploreGate:'rearKey',lockedLine:'후면 현관 열쇠로 여는 문이야. 세탁실 담당자가 분실물함과 함께 관리했었지.'});
 link('rearCourt','court-back',9,4.5,'세탁실로','laundry',[23,22]);
 link('relayPlant','plant-service-wing',6,17,'정비 연결 복도','relayService',[8,21],{kind:'stairs',label:'정비동 ↓'});
 link('relayService','service-plant',8,23,'설비동으로','relayPlant',[8,17],{kind:'stairs',label:'설비동 ↑'});
 link('relayService','service-workshop',8,4.5,'통신 정비 작업실','relayWorkshop',[10,22]);
 link('relayWorkshop','workshop-back',10,24,'정비 연결 복도로','relayService',[8,7]);
 link('relayService','service-store',25,4.5,'잠긴 밀봉 부품실','relayStore',[10,22],{exploreGate:'partsKey',lockedLine:'방습 부품 보관실. 정비 담당자의 비품 열쇠가 있어야 열려. 정비 작업대에서 인수 서명을 하던 곳이야.'});
 link('relayStore','store-back',10,24,'정비 연결 복도로','relayService',[25,7]);
 put('serviceHall','service-duty-drawer','desk',7,6.5,'경비 인계 열쇠판',{exploreAction:'laundryKey',exploreArt:4,mount:true,facing:'north',solid:false});
 put('serviceHall','service-bench','bench',6,16,'작업화 교체 벤치',{exploreArt:5,w:26,back:14,front:7,description:'순찰 때 신던 고무 장화가 아래에 가지런히 들어 있다.'});
 put('serviceHall','service-cleaning','cabinet',12.5,10,'청소 비품함',{roomCabinet:'cleaning',facing:'west',w:11,description:'걸레와 중성 세제를 둔 함. 사건 서류를 보관하는 곳이 아니다.'});
 put('serviceHall','service-condemned','door',4.5,11,'폐쇄된 옛 보일러실',{sealed:true,architecture:2,exploreSealed:'천장 석면 철거 구역. 자물쇠 바깥을 철판으로 덧댔다. 열쇠를 구해도 이쪽으로는 들어갈 수 없어.'});
 for(const [i,id]of ['washer-7','washer-9','washer-11','washer-13','washer-15'].entries())put('laundry',id,'rack',6+i*1.2,8,'공동 세탁기 '+(i+1),{washer:true,exploreArt:0,w:17,back:18,front:8,description:'기계 옆면이 이어지도록 설치된 전면 투입식 세탁기. 뒤쪽 급수관과 배수관이 같은 벽을 따라간다.'});
 put('laundry','laundry-cart','rack',5.5,14,'젖은 세탁물 운반 카트',{exploreArt:1,w:19,back:18,front:8,description:'흰 시트 아래에서 물이 떨어진다. 세탁실 밖으로 옮길 때 쓰던 바퀴 달린 카트.'});
 put('laundry','laundry-valve','rack',20.8,10,'배수 우회 밸브',{regional:6,exploreAction:'laundryDrain',w:12,back:15,front:8});
 put('laundry','laundry-lost-property','bench',22,13,'젖은 분실물 인계 상자',{exploreArt:5,exploreAction:'rearKey',w:23,back:14,front:8});
 put('laundry','laundry-hide','desk',15.5,14,'작업대 아래',{standardDesk:true,hide:true,hideKind:'desk',w:24,back:20,front:10,description:'아래 가림판 뒤로 몸을 낮출 수 있다.'});
 put('laundry','laundry-folding','desk',17.5,8,'세탁물 개는 작업대',{laundryTile:7,w:39,back:18,front:9,description:'기계에서 꺼낸 옷을 접는 작업대. 세제와 마른 수건을 구분해 놓았다.'});
 for(const [i,x,y]of [[0,9,12],[1,18,13],[2,8,18],[3,24,19]])put('laundry','laundry-floor-'+i,'detail',x,y,'바닥에 떨어진 세탁물',{laundryTile:5,floorCloth:true,solid:false,decorativeOnly:true});
 for(const [i,x,y]of [[0,5,11],[1,24,17]])put('laundry','laundry-basket-'+i,'rack',x,y,'세탁 바구니',{laundryTile:6,w:12,back:11,front:7,description:'젖은 옷이 든 낮은 바구니. 통로 가장자리로 밀어 놓았다.'});
 for(const [i,x,y]of [[0,10,11],[1,19,14],[2,11,18]])put('rearCourt','court-drying-'+i,'rack',x,y,'시트가 걸린 건조대',{laundryTile:4,w:36,back:25,front:12,description:'펼쳐 놓은 금속 건조대. 집게 자국이 남은 흰 시트가 걸려 있다.'});
 put('rearCourt','court-key-cabinet','cabinet',24,5.5,'철거 준비 열쇠 인계함',{technical:2,exploreAction:'unit104Key',w:12,back:20,front:8,description:'철거 준비 때 각 방 비품 열쇠를 통합 인계한 잠금함. 관리인 공용 열쇠로 연다.'});
 put('rearCourt','court-planter','rack',23,7,'갈라진 화단',{exploreArt:7,w:24,back:18,front:8,description:'오래된 뿌리가 배수 방향으로 뻗었다. 화단 아래에 얕은 배수로가 있다.'});
 put('rearCourt','court-bench','bench',7,7,'접힌 우비를 둔 벤치',{exploreArt:5,w:25,back:12,front:8,exploreAction:'courtMemory'});
 put('rearCourt','court-pump-door','door',27.5,12,'침하로 폐쇄된 펌프실',{doorType:'fire',exploreSealed:'문틀 아래가 가라앉고 봉인 볼트가 박혀 있어. 안쪽은 침하 조사 구역이다. 힘으로 열면 무너질 수 있어.'});
 put('rearCourt','court-crates','rack',25,18,'덮개를 씌운 주민 보관 상자',{exploreArt:6,w:22,back:18,front:8});
 put('relayService','service-parts-board','detail',5.5,4.5,'정비동 배치도',{facilityFrame:6,mount:true,facing:'north',solid:false,description:'서쪽 작업실: 계측·비품 열쇠. 동쪽 보관실: 밀봉된 커넥터. 송출층 데크는 같은 모델의 회선 어댑터만 사용할 것.'});
 put('relayService','service-toolcart','rack',25,16,'폐기 공구 운반함',{exploreArt:2,w:20,back:17,front:8});
 put('relayService','service-danger-door','door',4.5,11,'침수된 고압실',{doorType:'fire',exploreSealed:'고압 전기실. 바닥에 물이 찼고 안전 잠금이 내려와 있다. 도현의 작업 구역 밖이야. 들어가면 안 돼.'});
 put('relayWorkshop','workshop-testbench','desk',9,7,'회선 커넥터 계측 작업대',{facilityFrame:5,exploreAction:'partsKey',w:25,back:20,front:10});
 put('relayWorkshop','workshop-tools','rack',23,7,'정비 공구함',{exploreArt:2,w:20,back:20,front:10});
 put('relayWorkshop','workshop-spares','rack',23,14,'반납 부품 상자',{exploreArt:6,w:23,back:18,front:8,description:'단선·부식된 부품을 빨간 반환 봉투에 분리해 두었다. 재생용 예비품과 섞지 않는다.'});
 put('relayWorkshop','workshop-hide','desk',8,15,'계측 책상 아래',{standardDesk:true,hide:true,hideKind:'desk',w:24,back:20,front:10,description:'전면 가림판 뒤에 몸을 숨길 수 있다.'});
 for(const [x,y]of [[7,7],[23,7],[23,13]])put('relayStore','parts-crate-'+x+'-'+y,'rack',x,y,'밀봉 회선 부품 상자',{exploreArt:6,w:24,back:19,front:9,description:'연식과 단자 형식별로 포장해 벽 쪽에 쌓아 두었다.'});
 put('relayStore','parts-coupler','desk',13.5,12,'원본 재생 데크용 어댑터 보관대',{standardDesk:true,exploreAction:'deckCoupler',w:25,back:20,front:10});
 put('relayStore','parts-return','cabinet',15.5,5.6,'미사용 반환 비품함',{roomCabinet:'storage',facing:'north',exploreAction:'storeThread',w:12,back:20,front:8});

 // Use cabinet sprites for cabinets: technical frame 2 is a full-size acoustic door.
 for(const m of Object.values(M))for(const o of m.objects)if(o.kind==='cabinet'&&o.technical===2){o.roomCabinet=o.id==='court-key-cabinet'?'keys':'storage';delete o.technical;}
 for(const [id,x,y,facing]of [['parts-crate-7-7',7,5.6,'north'],['parts-crate-23-7',12,5.6,'north'],['parts-crate-23-13',17.5,10.5,'west']]){const o=M.relayStore.objects.find(o=>o.id===id);Object.assign(o,{x:x*32,y:y*32,facing,roomCabinet:'parts',name:'밀봉 부품 분류 선반',w:facing==='north'?18:11,description:'봉인 포장의 회선 부품을 모델별 작은 칸에 나눠 둔 선반. 바닥 통로를 비우고 벽을 따라 설치했다.'});delete o.exploreArt;}
 for(const [i,y]of [10,14].entries())put('relayStore','parts-side-shelf-'+i,'cabinet',4.5,y,'서쪽 벽 예비 비품 선반',{roomCabinet:'parts',facing:'east',w:11,back:19,front:8,description:'서쪽 벽에 등을 붙인 분류 선반. 측면에서 작은 부품함의 끝과 배선 꾸러미가 보인다.'});
 const safety=M.relayDrain.objects.find(o=>o.id==='story-drain-supply');Object.assign(safety,{x:5.45*32,facing:'east',w:11});

 for(const id of EXPANSION_MAPS){const m=M[id],floor=m.grid.map(row=>row.map(v=>v===1));for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(!floor[y][x]){let near=false;for(let dy=-3;dy<=3&&!near;dy++)for(let dx=-3;dx<=3;dx++)if(floor[y+dy]?.[x+dx]){near=true;break;}if(near)m.grid[y][x]=2;}m.utilityWall=true;}

}
export function prepareExploration(s){if(s.flags.explorationV1)return;s.flags.explorationV1=true;if(s.flags.relayPower||s.flags.relayLastVoice||s.bag.includes('relayExport'))s.flags.deckCouplerInstalled=true;}
export function explorationGate(s,o){if(!o.exploreGate)return null;return s.bag.includes(o.exploreGate)?null:o.lockedLine;}
export function explorationAction(s,o){
 const a=o.exploreAction;if(!a)return null;if(a!=='laundryDrain'&&pickupBlocked(s))return{line:'남은 손에 손전등을 쥐고 있어. R로 내려놓고 집어야 해.'};
 if(a==='partsKey'&&s.bag.includes('partsKey'))return{line:'도현 씨에게 받은 열쇠의 비품 인수표야. 정비동 동쪽 밀봉 부품실이라고 적혀 있어.'};
 if(a==='laundryDrain'){if(s.flags.laundryDrained)return{line:'배수관을 따라 물이 빠지고 있다.'};s.flags.laundryDrained=true;return{line:'밸브를 열자 분실물 선반 아래까지 차 있던 물이 내려갔다.\n세탁기는 꺼져 있는데… 뒤에서 한 바퀴 돌아가는 소리가 났어.',sound:'valve'};}
 if(a==='rearKey'&&!s.flags.laundryDrained)return{line:'선반 아래에 배수가 역류했어. 전선이 물에 잠겨 있어… 먼저 벽의 우회 밸브로 물을 빼야 해.'};
 if(a==='unit104Key'&&!s.bag.includes('serviceKey'))return{line:'공용 관리 열쇠로 여는 인계함이야. 관리실 비품 열쇠부터 챙겨야겠어.'};
 const supply={unit104Key:['unit104Key','104호 임시 문서실 표찰. 철거 준비로103호에서 이곳에 옮겨 놓은 열쇠야. 인수표에는 서윤이 점검 사진을 정리했다고 적혀 있어. 이제104호 안을 확인할 수 있어.'],laundryKey:['laundryKey','경비 인계 열쇠판의 반납 고리. 세탁실 표찰이 달린 열쇠가 있어.'],rearKey:['rearKey','분실물 상자 옆 인계 고리에 걸린 후면 현관 열쇠. 누가 마지막으로 퇴근했는지 이름만 지워졌어.'],partsKey:['partsKey','계측기 옆 비품 인수 봉투의 열쇠. 동쪽 밀봉 부품실용이야.'],deckCoupler:['deckCoupler','봉인 포장의 모델 번호가 원본 데크와 같아. 부식된 회선 어댑터를 이걸로 교체할 수 있어.'],storeThread:['knotThreadService','폐기 예정 천 주머니 안에서 매듭실이 따라 나왔다. 손에 감기던 그 느낌이야… 하나만 남아 있어.'],courtMemory:['courtSlip','젖지 않게 접힌 세탁 인수표. 「11월3일, 서윤: 사진 보관 주머니와 근무복 인수」. 서류를 숨기러 온 게 아니라 근무를 마치고 돌아갈 준비를 했던 거야.']};
 const [item,line]=supply[a]||[];if(!item)return null;const flag='exploreTaken_'+a;if(s.flags[flag])return{line:'비어 있는 인수 자리와 떼어 낸 봉인만 남았다.'};s.flags[flag]=true;return{item,line,sound:'paper'};
}
export function explorationBeat(s){prepareExploration(s);const f=s.flags;
 const spec=s.map==='serviceHall'?['hallKnock','service-condemned','걸음을 멈췄는데도 소리가 났어. 보일러실 안에서… 똑, 똑, 똑. 누가 문을 두드리고 있어.','omenKnock']:
 s.map==='rearCourt'?['courtWindow','court-key-cabinet','시트 사이로 지나간 그림자가 저 열쇠함 앞에서 멈췄어. 바닥에 젖은 자국이 남아 있어.','stepWater0']:
 s.map==='relayService'&&f.exploreTaken_deckCoupler?['returnShadow','service-danger-door','올 때는 없던 젖은 발자국이 앞서 가고 있어.\n고압실 문 아래에서 끝났어. 따라 들어가면 안 돼.','stepWater0']:
 s.map==='relayWorkshop'&&f.exploreTaken_partsKey?['toolKnock','workshop-tools','공구함 서랍이 안에서 밀렸어. 누가 열쇠를 돌려놓으라는 듯이…\n등 뒤에서 열쇠 고리가 한 번 더 울렸어.','omenKnock']:
 s.map==='relayStore'&&f.exploreTaken_deckCoupler?['crateEyes','parts-crate-23-7','분류함 칸 사이에 눈이 있었어. 내가 들고 있는 부품이 아니라… 내 얼굴을 보고 있었어.\n이걸 데크에 연결하고 원본을 들어야 해.','apparition']:null;
 if(!spec||f['exploreSeen_'+spec[0]])return null;
 return{kind:'explore_'+spec[0],focus:spec[1],line:spec[2],sound:spec[3],eyes:spec[0]==='crateEyes',washer:spec[0]==='washerTurn',shadow:spec[0]==='courtWindow'||spec[0]==='returnShadow'};
}
export function explorationObjective(s){
 if(!s.flags.chapter2&&s.flags.listened&&s.bag.includes('tape')&&!s.bag.includes('inspectionPhotos')&&!s.bag.includes('unit104Key'))return s.bag.includes('rearKey')?'후면 건조 마당의 열쇠 인계함에서104호 열쇠를 찾아 사진 원본을 확인한다':s.bag.includes('laundryKey')?'후면 관리 복도 → 공동 세탁실 → 건조 마당의 열쇠 인계함을 확인한다':'104호 열쇠 반납처를 확인한다 · 현관 서쪽 후면 관리 복도의 경비 인계 열쇠판';
 if(s.map==='laundry')return !s.flags.laundryDrained?'세탁실 물을 빼기 위해 벽의 배수 우회 밸브를 연다':!s.bag.includes('rearKey')?'분실물 인계 선반에서 후면 출입 열쇠를 확인한다':'후면 현관 열쇠로 건조 마당을 확인하거나 관리 복도로 돌아간다';
 if(!s.flags.routeB&&s.flags.chapter2&&s.flags.relayPower&&!s.flags.deckCouplerInstalled&&!s.flags.relayLastVoice)return s.bag.includes('deckCoupler')?'송출층 원본 데크에 회선 어댑터를 연결한다':s.bag.includes('partsKey')?'정비 연결 복도 동쪽 밀봉 부품실에서 같은 모델의 회선 어댑터를 찾는다':'원본 데크의 부식된 어댑터를 교체한다 · 설비층 서쪽 정비 연결 복도 → 통신 정비 작업실';
 return null;
}

export function washerFrame(time,reduced=false,horror=false){return (horror?4:0)+(reduced?0:Math.floor(time/(horror?140:220))%4);}
export function shadowWalkFrame(age){return Math.floor(age*8)%8;}

// The change persists silently; investigating it is the only attack trigger.
const washerDwell=new WeakMap();
export function tickWasher(s,dt,allowed=true){
 if(s.map!=='laundry'||!allowed||s.flags.washerReleased)return;
 const age=(washerDwell.get(s)||0)+dt;washerDwell.set(s,age);
 if(age>=12)s.flags.washerChanged=true;
}
export function canReleaseWasher(s,o,busy=false){return o.id==='washer-11'&&s.flags.washerChanged&&!s.flags.washerReleased&&!busy;}
