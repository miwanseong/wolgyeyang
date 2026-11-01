// Game additions; these foods do not redefine any original character or nation lore.
export const foodQualities=['소박한','정성 담긴','훌륭한','명작'];
export const cookingGroups={meal:'식사',snack:'간식',drink:'음료'};
export const cookingTools={fire:'직화',pot:'냄비',pan:'프라이팬',kettle:'주전자',oven:'오븐',jar:'절임병'};
export const cookingIngredients=[
 ['mushroom','갈색 버섯',8,45],['onion','양파',8,120],['egg','방목 달걀',12,90],['milk','산양 우유',14,35],['butter','발효 버터',18,120],['spice','향신료 주머니',22,720],['cabbage','양배추',12,120],['kelp','해풍 다시마',9,60],['clam','모래 조개살',14,25],['rice','도정한 쌀',10,240],['beans','말린 콩',8,360],['pepper','붉은 고추',10,120],['iceberry','서리 열매',0,60],['emberpepper','잔불 고추',0,120],['moonsalt','달빛 소금',0,720],['flour','제분 밀가루',10,240]
];
const slot=(key,amount,...options)=>({key,amount,options:options.length?options:[key]});
const veg=(n=1)=>slot('vegetable',n,'carrot','potato','onion','cabbage','mushroom');
const fish=(n=1)=>slot('fish',n,'riverfish','deepfish');
const fruit=(n=1)=>slot('fruit',n,'apple','wildberry','iceberry');
// id, name, tool, ingredients, output per batch, group, unlock, shelf minutes, HP, hunger, thirst, bonus
const rows=[
 ['bread','시골 빵','oven',[slot('wheat',2)],1,'meal','basic',120,40,24,0,{staminaRegen:.3}],
 ['porridge','따뜻한 곡물죽','pot',[slot('grain',1,'rice','wheat'),veg()],2,'meal','basic',45,18,25,8,{staminaRegen:.4}],
 ['roastpotato','잿불 감자','fire',[slot('potato',1)],1,'snack','basic',60,12,18,0,{}],
 ['skewer','여행자의 고기꼬치','fire',[slot('meat',1),slot('salt',1)],1,'meal','basic',50,25,28,0,{attack:1}],
 ['herbtea','숲향 약초차','kettle',[slot('herb',1)],2,'drink','basic',35,8,3,28,{manaRegen:.3}],
 ['berrymix','산딸기 한 줌','fire',[fruit(2)],2,'snack','basic',25,8,12,8,{}],
 ['stew','변경 스튜','pot',[slot('potato',2),slot('carrot',1),slot('meat',1),slot('salt',1)],2,'meal','lesson',50,48,44,8,{staminaRegen:.8}],
 ['grilledfish','소금구이 생선','fire',[fish(),slot('salt',1)],1,'meal','basic',40,28,30,0,{defense:1}],
 ['mushroomsoup','들버섯 수프','pot',[slot('mushroom',2),veg(),slot('salt',1)],2,'meal','lesson',40,22,27,12,{manaRegen:.4}],
 ['omelet','허브 오믈렛','pan',[slot('egg',2),slot('herb',1)],1,'meal','lesson',35,26,25,0,{defense:1}],
 ['pancake','버터 팬케이크','pan',[slot('flour',1),slot('milk',1),slot('egg',1)],2,'snack','lesson',60,20,22,0,{staminaRegen:.4}],
 ['fishsoup','어부의 맑은탕','pot',[fish(),slot('onion',1),slot('salt',1)],2,'meal','lesson',40,26,30,15,{defense:1}],
 ['beanstew','콩과 채소 한 냄비','pot',[slot('beans',2),veg(2)],3,'meal','lesson',50,20,32,5,{staminaRegen:.6}],
 ['applecompote','모닥불 사과 조림','pot',[slot('apple',2),slot('honey',1)],2,'snack','lesson',90,18,18,4,{manaRegen:.3}],
 ['ration','건조 여행식','fire',[slot('bread',1),slot('meat',1),slot('salt',1)],2,'meal','lesson',720,15,50,0,{staminaRegen:.7}],
 ['jerky','훈연 육포','fire',[slot('meat',2),slot('salt',2)],3,'snack','lesson',720,12,24,0,{attack:1}],
 ['applepie','격자 사과 파이','oven',[slot('apple',2),slot('flour',2),slot('butter',1)],3,'snack','book_hearth',120,25,25,0,{staminaRegen:.5}],
 ['cheesebread','노릇한 치즈빵','oven',[slot('flour',2),slot('cheese',1)],2,'meal','book_hearth',120,30,32,0,{defense:1}],
 ['roastveg','구운 뿌리채소','oven',[veg(3),slot('butter',1)],2,'meal','book_hearth',60,20,28,0,{staminaRegen:.5}],
 ['fishpie','어부의 생선 파이','oven',[fish(2),slot('flour',2),slot('butter',1)],3,'meal','book_hearth',90,35,36,0,{defense:1.5}],
 ['berryjam','진홍 열매 잼','jar',[slot('wildberry',3),slot('honey',1)],2,'snack','book_preserve',1440,12,16,0,{manaRegen:.3}],
 ['pickles','새콤한 채소 절임','jar',[veg(3),slot('salt',2)],3,'snack','book_preserve',1440,10,16,4,{defense:1}],
 ['saltfish','소금에 절인 생선','jar',[fish(2),slot('salt',3)],3,'meal','book_preserve',1440,15,32,0,{staminaRegen:.5}],
 ['honeyfruit','꿀에 재운 과일','jar',[fruit(3),slot('honey',2)],3,'snack','book_preserve',1440,15,18,4,{manaRegen:.4}],
 ['seaweedrice','다시마 주먹밥','pot',[slot('rice',2),slot('kelp',1),slot('salt',1)],3,'meal','book_coast',90,20,34,0,{defense:1}],
 ['clamchowder','조개 우유 수프','pot',[slot('clam',2),slot('milk',1),slot('potato',1)],2,'meal','book_coast',35,36,32,12,{defense:1.5}],
 ['spicyfish','붉은 향신 생선','pan',[fish(2),slot('pepper',1),slot('spice',1)],2,'meal','book_coast',45,32,34,0,{attack:1.5}],
 ['butterclam','버터 조개구이','pan',[slot('clam',2),slot('butter',1)],2,'snack','book_coast',30,25,20,0,{staminaRegen:.6}],
 ['lavendertea','달향 약초차','kettle',[slot('moonherb',1),slot('honey',1),slot('herb',1)],2,'drink','explore_forest',40,15,5,30,{manaRegen:.7}],
 ['moonrice','달빛 버섯 솥밥','pot',[slot('rice',2),slot('mushroom',2),slot('moonherb',1)],3,'meal','explore_forest',60,28,38,0,{spell:1.5}],
 ['iceinfusion','서리 열매 우림차','kettle',[slot('iceberry',2),slot('honey',1)],2,'drink','explore_highlands',60,12,4,35,{manaRegen:.6}],
 ['mountainstew','고개의 사냥꾼 스튜','pot',[slot('meat',2),slot('mushroom',1),slot('iceberry',1)],2,'meal','explore_highlands',60,40,42,0,{defense:2}],
 ['emberbroth','잔불 고추 전골','pot',[slot('emberpepper',1),slot('meat',2),veg()],2,'meal','explore_ruins',50,38,40,0,{attack:2}],
 ['smokedmushroom','숯향 버섯꼬치','fire',[slot('mushroom',3),slot('emberpepper',1)],2,'snack','explore_ruins',120,20,22,0,{attack:1.5}],
 ['abyssstew','심해의 푸른 수프','pot',[slot('deepfish',2),slot('moonsalt',1),slot('kelp',1)],2,'meal','explore_coast',45,42,38,15,{spell:2}],
 ['sailortea','뱃사람의 달소금 차','kettle',[slot('moonsalt',1),slot('herb',2),slot('honey',1)],2,'drink','explore_coast',60,18,3,35,{staminaRegen:.8}],
 ['harvestplatter','수확제 채소 모둠','pan',[slot('carrot',2),slot('cabbage',2),slot('butter',1)],3,'meal','quest_farmer',70,32,38,0,{defense:2}],
 ['innfeast','여관의 원정대 식탁','pot',[slot('meat',3),slot('potato',2),slot('spice',1)],4,'meal','quest_innkeeper',60,45,46,5,{staminaRegen:1}],
 ['healerbrew','약초사의 꿀 달임','kettle',[slot('herb',3),slot('honey',2),slot('moonherb',1)],3,'drink','quest_healer',60,28,5,30,{manaRegen:.8}],
 ['pilgrimloaf','순례자의 씨앗 빵','oven',[slot('wheat',3),slot('beans',1),slot('honey',1)],3,'meal','quest_merchant',720,30,44,0,{defense:1.5}]
];
export const cookingRecipes=Object.fromEntries(rows.map(([id,name,tool,ingredients,yieldCount,group,unlock,shelf,heal,hunger,thirst,bonus],icon)=>[id,{id,name,tool,ingredients,yieldCount,group,unlock,shelfMinutes:shelf,heal,hunger,thirst,bonus,icon,level:unlock==='basic'?1:unlock==='lesson'?2:unlock.startsWith('book')?3:4,price:Math.round((heal+hunger+thirst*.4)*.8+Object.keys(bonus).length*8),seconds:2}]));
export const recipeBooks={book_hearth:{name:'화덕과 반죽',cost:35},book_preserve:{name:'오래 두는 식탁',cost:35},book_coast:{name:'해안의 한 냄비',cost:45}};
export const recipeSites={explore_forest:{name:'숲속 야영자의 메모',region:'forest',x:50,y:16},explore_highlands:{name:'고개 산장의 조리 기록',region:'highlands',x:40,y:76},explore_ruins:{name:'폐성 경비대의 식사 기록',region:'ruins',x:38,y:43},explore_coast:{name:'옛 부두의 선원 수첩',region:'coast',x:115,y:86}};
export const cookingQualityScale=[1,1.12,1.25,1.4];
export const mealEffectSeconds=180;
export const rawShelfMinutes={wheat:240,bread:120,meat:30,riverfish:20,deepfish:20,carrot:120,potato:180,apple:90,herb:90,moonherb:60,wildberry:30,honey:1440,cheese:180,...Object.fromEntries(cookingIngredients.map(([id,,,life])=>[id,life])),...Object.fromEntries(Object.values(cookingRecipes).map(r=>[r.id,r.shelfMinutes]))};
export const cookingCropSeeds=[['onion','양파','onion_seed','양파 씨앗'],['cabbage','양배추','cabbage_seed','양배추 씨앗'],['rice','벼','rice_seed','볍씨'],['beans','콩','beans_seed','콩 씨앗']];
export function cookingLevel(p){return Math.min(10,1+Math.floor(Math.sqrt((p.lifeXP?.cooking||0)/12)));}
export function unlockDescription(r){if(r.unlock==='basic')return '기본 조리법';if(r.unlock==='lesson')return '여관주인 수업 · 요리 숙련 2 · 12 브론즈';if(recipeBooks[r.unlock])return '요리책 「'+recipeBooks[r.unlock].name+'」';if(recipeSites[r.unlock])return recipeSites[r.unlock].name;return ({quest_farmer:'농부',quest_innkeeper:'여관주인',quest_healer:'약초사',quest_merchant:'잡화상'})[r.unlock]+' 의뢰 완료 후 전수';}
export function ingredientLabel(s,items){return s.options.map(id=>items[id]?.name||id).join(' / ')+' ×'+s.amount;}
