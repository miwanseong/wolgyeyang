// Authored frontier expansion, not an assertion about original-world capitals.
export const townDistricts=[{name:'우물 광장',x:64,y:49,w:27,h:15,detail:'공동 우물과 시장, 화덕으로 사람들이 모인다.'},{name:'살림 골목',x:92,y:62,w:31,h:28,detail:'처마와 작은 마당을 따라 주민의 집이 앞뒤로 놓였다.'},{name:'성문 장터',x:154,y:54,w:35,h:25,detail:'교량을 건넌 행상과 성문 손님을 받는 음식·고기·빵 상점.'},{name:'등불 뒷골목',x:158,y:81,w:30,h:17,detail:'운송 인부의 집, 수선방, 붉은 등불의 야간 유흥가. 광장과 다른 밤의 표정을 지닌다.'}];
export const townBuildings=[{id:'butcher',name:'성문 푸줏간',x:156,y:56,w:6,h:6,doorX:159,doorY:62,room:'butcher'},{id:'bakery',name:'성문 제빵소',x:169,y:53,w:6,h:7,doorX:172,doorY:60,room:'bakery'},{id:'gatehouse',name:'동쪽 성문 수비동',x:180,y:48,w:9,h:10,doorX:184,doorY:58,room:'gatehall'},{id:'mudhouse',name:'짐꾼의 흙집',x:155,y:83,w:5,h:4,doorX:157,doorY:87,room:'mudhome'},{id:'lanternhouse',name:'붉은 등불 살롱',x:176,y:86,w:7,h:6,doorX:179,doorY:92,room:'lanternhall'}];
export const townRoads=[{region:'village',x:151,y:70.5,w:38,h:3},{region:'village',x:158,y:62,w:3,h:25},{region:'village',x:158,y:62,w:28,h:2.5},{region:'village',x:171,y:60,w:2.5,h:13},{region:'village',x:183,y:58,w:2.5,h:15},{region:'village',x:157,y:86,w:24,h:2},{region:'village',x:174,y:86,w:1.5,h:8},{region:'village',x:174,y:92.5,w:6,h:1.5}];
const prop=(id,index,x,y,name,story,solid=false,w=1.3,h=1.5)=>({id,index,x,y,region:'village',name,story,solid,w,h});
export const townLandmarks=[
 prop('meat-stall',0,162,66,'흐린 날의 고깃간','매대 아래 소금 자국은 어제 팔리지 않은 고기를 염장한 흔적이다. 주인은 뼈를 끓여 짐꾼들에게 국물을 나눈다.',true,2.3,2),
 prop('bread-stall',1,170,67,'아침 빵 노점','바닥의 밀가루 발자국은 제빵소에서 이 노점까지 이어진다. 성문이 열리는 시각에 맞춰 첫 빵이 나온다.',true,2.3,2),
 prop('fish-stall',2,176,66,'강 건너 생선판','푸줏간과 거리를 둔 생선판. 얼음 대신 젖은 천과 차가운 룬 돌로 아침 어획을 식힌다.',true,2.3,2),
 prop('vegetable-stall',3,165,75,'계절 채소 장수','농가마다 남는 작물이 달라 매일 같은 채소가 쌓이지 않는다. 빈 바구니는 먼 밭의 홍수 소식을 전한다.',true,2.3,2),
 prop('cloth-stall',4,176,75,'여행자의 천막 수선대','망토를 새로 팔기보다 찢어진 곳을 꿰매는 일이 많다. 바늘 상자는 세 번의 피난길을 견뎠다.',true,2.3,2),
 prop('soup-counter',6,181,75,'밤에도 따뜻한 솥','성문이 닫혀 돌아가지 못한 손님을 위해 묽은 수프를 남겨 둔다. 불을 끄는 시각은 종소리보다 늦다.',true,2,1.6),
 prop('broken-cart',8,154,76,'부러진 운송 수레','돌바람 고개에서 축이 부러진 수레다. 임시로 받친 돌에는 운송조합의 빚 표식이 남았다.',true,2.2,1.4),
 prop('laundry',11,161,89,'골목의 빨랫줄','수비대 셔츠와 아이의 작은 양말이 같은 줄에 걸려 있다. 성문 뒤에도 누군가의 평범한 하루가 이어진다.',false,2.4,1.4),
 prop('drain',13,163,81,'낮은 배수로','포장도로에서 밀려온 빗물이 이 골목으로 모인다. 흙집의 젖은 벽과 높낮이가 맞닿아 있다.',false,1.6,.8),
 prop('noticeboard',14,155,69,'성문 공고판','통행세 공고 아래 실종자를 찾는 쪽지가 겹겹이 붙었다. 이름이 지워진 자국만 남은 쪽지도 있다.',true,1.2,1.8),
 prop('red-lantern',16,175,90,'붉은 등불','홍등가의 입구를 밝히는 등불. 음악과 유흥의 거리지만 골목의 다른 집과 주민을 하나로 단정할 수는 없다.',false,.8,1.5),
 prop('cobbler',19,168,88,'구두 수선대','밑창의 못과 꿰맨 가죽 조각. 먼 길을 가는 사람이 많아지는 계절이면 이 자리는 밤에도 비지 않는다.',true,1.5,1.2),
 prop('rain-crock',21,154,88,'빗물 받는 항아리','새는 처마 아래 옮겨 둔 항아리다. 흙집에 들어가면 비 오는 날 같은 소리를 들을 수 있다.',false,.8,1.2),
 prop('patched-road',24,91,72,'갈라진 옛 포장','수레가 지나가는 중심부만 돌을 다시 깔았다. 곁의 오래된 돌에는 지난 겨울 서리가 만든 틈이 남았다.',false,2,1),
 prop('mud-ruts',25,160,82,'진흙 수레바퀴 자국','장터의 포장길은 여기서 끝난다. 짐꾼의 발자국은 돌이 없는 가장 낮은 골목으로 향한다.',false,2,1),
 prop('old-bell',29,186,64,'교체된 성문 종','새 종을 달고 남은 낡은 종이다. 가장자리의 금은 한때 급하게 울렸던 밤의 기록이다.',true,1.5,1.8),
 prop('herb-yard',27,94,88,'치료소의 작은 약초밭','햇볕이 짧게 드는 오후를 골라 심은 약초다. 높은 담 대신 낮은 울타리를 쓴 이유가 보인다.',false,2,1.1)
];
townLandmarks.push(
 {...prop('forest-rest',20,92,43,'벌목꾼이 남긴 장작','갈라진 장작은 젖지 않도록 돌 위에 올려 두었다. 이 길의 야영자는 다음 사람을 위한 불씨를 남긴다.',false,1.4,1.1),region:'forest'},
 {...prop('boar-cart',8,89,77,'가시뿌리의 돌진 흔적','수레를 옆으로 찢은 홈이 뿌리 멧돼지의 엄니 높이와 맞는다. 갈림길 표식은 이 너머를 피하라고 가리킨다.',true,2.2,1.4),region:'forest'},
 {...prop('warden-bell',29,103,63,'피난 행렬의 마지막 종','끊어진 종줄 아래 피난민이 남긴 이름이 새겨졌다. 파수꾼은 아직 끝나지 않은 통행 순서를 기다린다.',false,1.5,1.8),region:'ruins'}
);
export function townAction(p,a){if(a.type!=='inspectPlace')return null;const s=townLandmarks.find(s=>s.id===a.id&&s.region===p.region&&Math.hypot(s.x-p.x,s.y-p.y)<=3);if(!s)throw Error('조사할 장소 가까이 이동하세요.');p.townJournal??=[];if(!p.townJournal.includes(s.id)){p.townJournal.push(s.id);p.xp=(p.xp||0)+3;}return s.name+' — '+s.story;}
export function marketAccess(p){return ['shop','butcher','bakery'].includes(p.region)||p.region==='village'&&(Math.hypot(p.x-71,p.y-53)<=2.5||townLandmarks.slice(0,6).some(s=>Math.hypot(p.x-s.x,p.y-s.y)<=3));}
export function marketStock(p){if(p.region==='butcher')return ['meat','salt','leather'];if(p.region==='bakery')return ['wheat','flour','egg','milk','butter','honey'];if(p.region!=='village')return null;const vendor=townLandmarks.slice(0,6).filter(s=>Math.hypot(s.x-p.x,s.y-p.y)<=3).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!vendor)return null;return ({'meat-stall':['meat','salt','leather'],'bread-stall':['wheat','flour','egg','milk','butter','honey'],'fish-stall':['riverfish','deepfish','salt','kelp','clam'],'vegetable-stall':['carrot','potato','onion','cabbage','beans','rice','pepper'],'cloth-stall':['leather','rope','raincloak','bedroll'],'soup-counter':['herb','spice','cheese','apple','salt']})[vendor.id]||null;}
