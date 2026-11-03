export function addShadowSpaces(M,map,prop,door){
 const m=M.oldBoiler=map('oldBoiler','B1 · 퇴역 설비실과 옛 인계 전실',36,29,'concrete',[[5,5,11,11],[14,12,10,4],[22,7,8,13],[24,19,6,6]]);
 m.chapter=1;m.utilityWall=true;m.rooms=[{x:5,y:5,w:11,h:11,name:'퇴역 보일러 · 차단된 설비 구역'},{x:14,y:12,w:10,h:4,name:'옛 통신 인계 전실'},{x:22,y:7,w:8,h:13,name:'후면 점검실'},{x:24,y:19,w:6,h:6,name:'건조 마당 점검계단'}];
 const put=(id,kind,x,y,name,extra={})=>m.objects.push(prop(id,kind,x,y,name,extra));
 // One-tile door in a partition; an L-shaped approach keeps the cabinet out of view.
 for(let y=7;y<=19;y++)m.grid[y][22]=2;m.grid[14][22]=1;
 put('shadow-inner-door','door',22.5,14.5,'옛 인계 전실 문',{internalDoor:true,cells:[[22,14]],facing:'east',doorType:'service',w:13,h:20});
 m.objects.push(door('shadow-court-back',27,25,'점검계단 · 건조 마당으로','rearCourt',[18,7],{kind:'stairs',label:'건조 마당 ↑'}));
 M.rearCourt.objects.push(door('court-shadow-stair',18,4.5,'옛 설비실 점검계단','oldBoiler',[27,23],{exploreGate:'serviceKey',kind:'stairs',label:'옛 설비실 ↓',lockedLine:'건조 마당에서 내려가는 별도 점검계단. 관리인 공용 열쇠로 여는 문이다.'}));
 // The condemned asbestos room remains sealed; the dry service entrance leads
 // only to the decommissioned equipment and handover vestibule on this side.
 const wall=M.serviceHall.objects.find(o=>o.id==='service-condemned');
 Object.assign(wall,{name:'그림자가 사라진 옛 출입구',shadowAction:'wall'});delete wall.exploreSealed;
 wall.description='봉쇄된 옛 출입구. 철거 구역 철판 안쪽을 벽돌로 메웠다. 우측 작은 점검도에는 건조 마당의 별도 설비 점검계단이 표시돼 있다.';
 put('shadow-old-opening','detail',5.5,12,'벽돌로 막힌 옛 출입구 반대편',{details:6,mount:true,facing:'east',solid:false,description:'복도에서 보았던 문틀의 반대편. 화재 뒤 메운 벽돌의 이음새가 남았다. 이 벽을 뚫고 복도로 돌아갈 수는 없다.'});
 put('shadow-boiler-a','rack',8,6.5,'철거를 기다리는 소형 보일러',{regional:6,w:30,back:31,front:10,description:'가스 밸브가 봉인되고 주 전원이 분리된 퇴역 설비. 불을 붙이거나 다시 돌릴 수 없다.'});
 put('shadow-boiler-b','rack',13,6.5,'분리된 순환 펌프',{regional:6,w:22,back:24,front:10,description:'배관 끝에 마개가 씌워져 있다. 펌프 아래 받침은 벽 쪽에 고정돼 있다.'});
 put('shadow-pipe','detail',10,4.5,'봉인된 배관과 수압계',{storyArt:5,mount:true,facing:'north',solid:false,decorativeOnly:true});
 put('shadow-circuit','panel',14,10,'임시 인계함 저전압 분리 스위치',{technical:7,shadowAction:'isolate',w:12,back:17,front:8});
 put('shadow-latch','panel',13.5,14,'인계함 수동 걸쇠 손잡이',{technical:7,shadowAction:'release',w:10,back:15,front:7});
 put('shadow-carbon-cabinet','cabinet',10,14,'철거 전 임시 통신 인계함',{roomCabinet:'keys',facing:'north',shadowAction:'carbon',w:18,back:20,front:8});
 put('shadow-workbench','desk',26,8,'철거 설비 점검 작업대',{standardDesk:true,w:28,back:20,front:10,description:'분리한 접점과 피복을 벗긴 통신선을 작은 트레이에 나눠 두었다. 보일러 부품과 서류는 섞여 있지 않다.'});
 put('shadow-toolcart','rack',28.5,12,'잠금 공구 운반함',{exploreArt:2,w:17,back:20,front:8,description:'절연 공구와 폐기 접점만 남았다.'});
 put('shadow-folded-cloth','detail',25,17,'기름 묻은 정비 천',{laundryTile:5,solid:false,decorativeOnly:true,floorCloth:true});
 put('shadow-hide','desk',26,17,'점검 책상 아래',{standardDesk:true,hide:true,hideKind:'desk',w:24,back:20,front:10,description:'가림판 아래로 몸을 낮출 수 있다.'});
 put('shadow-stair-plan','detail',29.5,21,'설비실 피난·점검도',{facilityFrame:6,mount:true,facing:'west',solid:false,description:'계단 → 후면 점검실 → 옛 인계 전실. 복도 쪽 출입구는 화재 뒤 폐쇄. 돌아갈 때도 건조 마당 점검계단을 이용할 것.'});
 M.basement.objects.push(prop('basement-name-envelope','cabinet',10,9,'계절옷 보관 봉투',{roomCabinet:'storage',facing:'north',w:19,back:20,front:8,description:'겨울옷만 따로 넣어 둔 천 보관함. 공구와 전기 부품은 없는 자리다.'}));
 M.relayEntry.objects.push(prop('relay-clock-note','side-table',18,14,'대기 의자 옆 작은 보관 쪽지',{decor:5,w:16,back:18,front:8,description:'시계는 분실물함에 있고, 이 작은 탁자에는 낡은 보관 쪽지만 따로 남아 있다.'}));
 const shelf=M.relayArchive.objects.find(o=>o.id==='relay-shelf-c');shelf.description='서가 옆 벽에는 유난히 반사광이 세다. 책등의 먼지는 그대로인데, 빛 속에서 세로 이음새만 사라져 보인다.';
 M.relayArchive.objects.push(door('quiet-hidden-door',20,5.5,'서가 옆 보존실 점검문','relayQuiet',[12,17],{visibleWhen:'secretShelfOpen',doorType:'service'}));
 const quiet=M.relayQuiet=map('relayQuiet','2F · 작은 보존실',25,22,'wood',[[5,5,15,12],[10,16,5,3]]);quiet.chapter=2;quiet.rooms=[{x:5,y:5,w:15,h:11,name:'주민 방송 소자료 보존'},{x:10,y:16,w:5,h:3,name:'서가 옆 점검문'}];
 quiet.objects.push(door('quiet-return',12,19,'대조 기록동으로','relayArchive',[20,8]));
 quiet.objects.push(prop('quiet-shelf','shelf',9,6.5,'주민 안내 방송 묶음',{regional:7,w:26,back:25,front:9,description:'비상 통화와 분리해 둔 주민 안내 연습 자료. 여기에 사건의 통화 원본은 없다.'}),prop('quiet-personal-drawer','side-table',15,10,'보존 봉투를 둔 작은 탁자',{decor:5,w:16,back:18,front:8,description:'개인 물품 반환용 봉투. 바깥에는 서윤의 이름이 작게 쓰여 있다.'}),prop('quiet-chair','chair',15,12,'열람 의자',{w:13,back:13,front:8,description:'작은 탁자 앞에 놓인 낡은 의자.'}),prop('quiet-curtain','curtain',18,4.5,'빛바랜 차광 커튼',{decor:1,mount:true,facing:'north',solid:false,description:'낮빛이 종이를 바래게 하지 않도록 닫아 둔 커튼.'}));

}
