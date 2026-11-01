// Playable frontier fish are new game species, not claims about the user's original canon.
export const fishRarities=[{name:'흔함',color:'#bbc8bd',weight:60},{name:'드묾',color:'#86bd91',weight:25},{name:'희귀',color:'#81b4da',weight:10},{name:'영웅',color:'#ba95df',weight:4},{name:'전설',color:'#e9bd66',weight:1}];
export const fishGrades=[{name:'보통',color:'#b8beb8',value:1},{name:'동빛',color:'#c0926c',value:1.2},{name:'은빛',color:'#bacddd',value:1.5},{name:'금빛',color:'#e1be67',value:2},{name:'오색',color:'#c3a0e5',value:2.8}];
export const fishPrefixes=[{id:'clear',name:'맑은',length:1,weight:1},{id:'sleek',name:'윤기 나는',length:1.03,weight:1.04},{id:'plump',name:'살오른',length:1,weight:1.22},{id:'swift',name:'날렵한',length:1.08,weight:.92},{id:'stout',name:'묵직한',length:.98,weight:1.35},{id:'giant',name:'거대한',length:1.18,weight:1.1},{id:'moonlit',name:'월광을 머금은',length:1.06,weight:1.08},{id:'ancient',name:'오래된',length:1.12,weight:1.18}];
export const fishHabitats={river:{name:'변경의 강',regions:['village'],cap:150},stream:{name:'숲의 계류',regions:['forest'],cap:180},pond:{name:'초원의 물길',regions:['meadow'],cap:170},alpine:{name:'산악 호수',regions:['highlands'],cap:220},shore:{name:'은빛 해안',regions:['coast'],cap:360},marsh:{name:'안개 습지',regions:['marsh'],cap:240},reef:{name:'떠도는 섬의 암초',regions:['island'],cap:400},abyss:{name:'잠든 심해',regions:['deep'],cap:600}};
const names=[
['은비늘 피라미','붉은지느러미 황어','돌틈 미꾸리','둥근배 붕어','홍점 강준치','청동가시 농어','거울비늘 잉어','검은점 송어','붉은수염 메기','먹등 강배스','갈대창 꼬치고기','은물결 연어','유리달 장어','요드 황금잉어','고대 판갑철갑상어','강의 수호 용어'],
['잎빛 버들치','호박빛 산천어','이끼무늬 망둑','붉은계류 황어','보랏점 송어','줄무늬 곤들매기','긴꼬리 갈색장어','구리빛 꺽지','가시등 배스','그늘수염 메기','무지개 연어','은수염 철갑상어','야광 숲장어','백령 비단잉어','사슴뿔 지느러미어','달문양 고대잉어'],
['연못 해바라기어','붉은못 피라미','진흙빛 미꾸리','노랑배 붕어','얼룩비늘 텐치','푸른등 퍼치','홍비늘 잉어','먹빛 도미','은풀 초어','옥빛 큰입농어','갈색수염 메기','긴꼬리 백장어','꽃빛 반딧불어','우윳빛 거울잉어','금관 비단잉어','거대 호수철갑어'],
['은얼음 버들치','푸른 곤들매기','흑점 산송어','바위턱 망둑','흰지느러미 농어','검은줄 연어','붉은산 송어','창백한 여울장어','이끼갑옷 메기','은판 철갑상어','보랏빛 냉수꼬치','푸른얼음 연어','투명 수정어','돌뿔 바위어','설백 긴장어','사파이어 고대호수어'],
['은빛 정어리','금멸치','청록 고등어','붉은 참돔','먹꼬리 숭어','주황 암초농어','별점 가자미','보라줄 바다농어','푸른 참치','갑옷 우럭','긴은 갈치','검은곰치','산호날개 쏠배감펭','진주빛 가오리','옥돛 청새치','고대 황금해룡어'],
['검은 갯벌망둑','이끼등 미꾸리','붉은눈 늪피라미','올리브 붕어','갈색 폐어','갈대수염 메기','녹갑 가아','노란늪 장어','먹비늘 가물치','가시 늪물고기','구리판 갑옷어','보라늪 꼬치고기','유령빛 흰메기','연꽃무늬 잉어','가시왕 거대가아','고대 자색늪뱀어'],
['주황 흰동가리','푸른 양쥐돔','노란 나비고기','보랏빛 놀래기','청록 앵무고기','반점 바리','붉은산호 도미','줄무늬 쥐치','옥날개 날치','은창 바라쿠다','장식가시 쏠배감펭','주황곰치','야광 조개무늬가오리','청록돛 황새치','금빛 암초수호어','푸른 고대실러캔스'],
['잔광 샛비늘치','흑룡 심해어','투명 유리어','붉은눈 심해장어','보라 미끼아귀','은도끼어','검은갑옷 실러캔스','긴리본 심해어','야광 청굴장어','붉은 주름상어','보라 심해가오리','창백한 산갈치','별무늬 고대아귀','백색 심연뱀어','보랏갑옷 왕어','고대 푸른심연룡어']
];
const rarity=[0,0,0,0,0,1,1,1,1,2,2,2,3,3,4,4],behaviors=['smooth','dart','sink','float','smooth','dart','sink','smooth','dart','float','dart','smooth','sink','dart','float','dart'];
export const fishSpecies=names.flatMap((group,h)=>group.map((name,i)=>{const habitat=Object.keys(fishHabitats)[h],cap=fishHabitats[habitat].cap,maxCM=Math.round(cap*(.12+i*.055)),thin=/장어|뱀|갈치|리본/.test(name);return {id:'fish_'+String(h*16+i+1).padStart(3,'0'),name,habitat,rarity:rarity[i],difficulty:16+rarity[i]*13+(i%4)*3,behavior:behaviors[i],minCM:Math.max(4,Math.round(maxCM*.4)),maxCM,density:thin?5:10+(i%4)*4,price:10+rarity[i]*18+i*2,season:i<8?null:(i+h)%4,time:i<12?'any':i%2?'night':'twilight',atlas:Math.floor(h/2),icon:h%2*16+i};}));
export const fishById=Object.fromEntries(fishSpecies.map(s=>[s.id,s]));
export function fishName(f){const s=fishById[f.speciesId],prefix=fishPrefixes.find(x=>x.id===f.prefix);return (prefix?prefix.name+' ':'')+(s?.name||'알 수 없는 물고기');}
export function fishValue(f){const s=fishById[f.speciesId];if(!s)return 0;return Math.max(1,Math.round(s.price*(1+Math.sqrt(f.weightKG)*.35)*fishGrades[f.grade].value));}
export function fishDisplaySize(f){return .2+Math.log1p(f.lengthCM/75)*1.75;}
