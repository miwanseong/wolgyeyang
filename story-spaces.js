export function addStorySpaces(M,map,prop,door){
 const m=M.relayDrain=map('relayDrain','B2 · 중계소 배수 점검로',40,32,'concrete',[[5,5,11,9],[12,10,19,4],[25,8,10,10],[29,16,6,12],[8,24,24,4],[5,17,8,10]]);m.chapter=2;
 m.rooms=[{x:5,y:5,w:11,h:9,name:'낙하 지점 · 바닥 아래 집수 공간'},{x:12,y:10,w:19,h:4,name:'침수된 점검 연결로'},{x:25,y:8,w:10,h:10,name:'수압 우회 조작실'},{x:8,y:24,w:24,h:4,name:'남쪽 귀환 점검로'},{x:5,y:17,w:8,h:10,name:'안전계단 전실'}];
 const put=(id,kind,x,y,name,extra={})=>m.objects.push(prop(id,kind,x,y,name,{...extra}));
 put('story-drain-inlet','detail',10,4.5,'위쪽의 찢어진 점검 덮개',{storyArt:1,mount:true,facing:'north',solid:false,decorativeOnly:true});
 put('story-drain-fallen-beam','detail',6,6,'점검 덮개 아래 떨어진 부재',{storyArt:2,w:18,back:18,front:8,description:'부식된 덮개 받침과 젖은 석고 조각. 천장의 찢어진 자리 바로 아래다.'});
 put('story-drain-supply','cabinet',5.8,12.5,'벽 쪽 작업 안전함',{storySupply:true,technical:2,w:13,back:23,front:8,description:'절연 장갑과 마른 천, 밀봉된 예비 작업등을 보관하는 벽 쪽 안전함.'});
 put('story-drain-procedure','detail',32,7.5,'배수문 현장 조작 카드',{details:6,mount:true,facing:'north',solid:false,description:'연결 복도 점검판 부식. 우천 시 점검 계단 이용. 수압이 남으면 우회 배수 밸브를 열고 남쪽 수문을 들어 올릴 것. 아래에는 물이 번진 점검 날짜가 남았다.'});
 put('story-drain-pipe-a','detail',20,9.5,'배수 주관과 접합부',{storyArt:5,mount:true,facing:'north',solid:false,description:'기록동 아래를 지나 집수정으로 이어지는 관. 빗물이 연결 복도 아래로 샜다.'});
 put('story-drain-pipe-b','detail',30,7.5,'우회 배관과 수압계',{storyArt:5,mount:true,facing:'north',solid:false,description:'배수문 상류의 압력을 우회관으로 빼는 장치다.'});
 put('story-drain-valve','rack',27,12,'우회 배수 밸브',{storyAction:'bypass',regional:6,w:18,back:22,front:10,description:'물살을 옆 관으로 돌리는 수동 밸브.'});
 put('story-drain-lever','panel',33,13,'남쪽 배수문 레버',{storyAction:'gate',technical:7,w:10,back:15,front:8,description:'수위 차가 작아졌을 때 들어 올리는 수동 레버.'});
 // One actual wall aperture, not a gate sitting across open floor.
 for(let x=29;x<=34;x++)m.grid[18][x]=2;m.grid[18][31]=1;
 put('story-drain-gate','door',31.5,18.5,'남쪽 점검로 수문',{internalDoor:true,storyGate:true,cells:[[31,18]],facing:'north',w:20,h:13,solid:true});
 put('story-drain-bags','detail',34,16,'누수 정리 자재',{storyArt:6,w:15,back:13,front:8,description:'지하 작업자들이 통로 옆에 모아 둔 모래주머니와 호스.'});
 put('story-drain-outfall','detail',12,28.5,'벽면 배수구',{storyArt:7,mount:true,facing:'south',solid:false,decorativeOnly:true});
 m.objects.push(door('story-drain-exit',7,17,'안전계단 · 설비동으로','relayPlant',[49,31],{kind:'stairs',label:'B1 ↑',stopPursuit:true,storyEscape:true}));
 const a=M.relayArchive;
 a.objects.push(prop('story-archive-hatch','detail',48,28,'연결 복도의 점검 덮개',{storyFloorHatch:true,solid:false,description:'연결 복도 바닥에 고정한 점검 덮개. 아래의 배수관을 확인할 때 여는 자리다.'}));
 a.objects.push(door('story-archive-service',44,26,'미정이 연 점검 계단','relayDrain',[7,7],{kind:'stairs',visibleWhen:'storyHelpWitness',label:'점검로 ↓',storyDescent:true}));
 a.objects.find(o=>o.id==='relay-audit-door').storyKey='relayAuditKey';
}
