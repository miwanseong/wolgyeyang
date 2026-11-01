import {randomUUID} from 'node:crypto';
import {items,villagers,bonuses} from './content.js';
import {villageSites} from './layout.js';
import {cookingRecipes,rawShelfMinutes,cookingLevel,cookingQualityScale,foodQualities,recipeBooks,recipeSites,mealEffectSeconds} from './cooking-data.js';
const own=(o,k)=>Object.hasOwn(o,k),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const amount=n=>{if(!Number.isInteger(n)||n<1||n>20)throw Error('수량은 1~20 사이의 정수로 선택하세요.');return n;};
const perishable=id=>own(rawShelfMinutes,id);
const shelf=id=>rawShelfMinutes[id]*60000;
const storageFactor=l=>l.storage==='cellar'?2.5:1;
export function freshness(l,now=Date.now()){return Math.max(0,Math.min(1,(l.freshUntil-now)/(shelf(l.item)*storageFactor(l))));}
export function initializeCooking(p,now=Date.now()){
 p.inv??={};p.lifeXP??={};for(const key of ['farming','cooking','foraging','fishing','smithing'])p.lifeXP[key]??=0;
 p.cooking??={known:[],seen:[],lots:[],records:{},books:[],booksRead:[],spoiled:0};const c=p.cooking;
 for(const r of Object.values(cookingRecipes)){if(r.unlock==='basic'&&!c.known.includes(r.id))c.known.push(r.id);if((r.unlock==='basic'||r.unlock==='lesson'&&cookingLevel(p)>=2)&&!c.seen.includes(r.id))c.seen.push(r.id);}
 for(const l of c.lots)if(l.freshUntil<=now){if(l.storage!=='cellar')p.inv[l.item]=Math.max(0,(p.inv[l.item]||0)-l.count);c.spoiled=Math.min(9999,c.spoiled+l.count);l.count=0;}
 c.lots=c.lots.filter(l=>l.count>0);
 syncPantry(p,now);
 return c;
}
function addLot(p,item,count,quality,now,origin='acquired',freshUntil=now+shelf(item),cost=0){
 const lots=p.cooking.lots;
 // Combine only equivalent batches without renewing the oldest food's lifetime.
 let lot=lots.find(l=>l.item===item&&l.quality===quality&&l.storage==='bag'&&l.origin===origin&&Math.abs(l.freshUntil-freshUntil)<5000&&l.unitCost===cost);
 if(!lot&&lots.length>=192)throw Error('식품 묶음 한도 192개입니다. 먼저 먹거나 보관품을 정리하세요.');
 if(lot){lot.count+=count;lot.freshUntil=Math.min(lot.freshUntil,freshUntil);}
 else {lot={id:randomUUID(),item,count,quality,storage:'bag',origin,freshUntil,madeAt:now,unitCost:cost};lots.push(lot);}
 return lot;
}
export function syncPantry(p,now=Date.now(),quality=0){
 if(!p.cooking)return;
 for(const id of Object.keys(rawShelfMinutes)){
  const lots=p.cooking.lots.filter(l=>l.item===id&&l.storage==='bag').sort((a,b)=>a.freshUntil-b.freshUntil),tracked=lots.reduce((n,l)=>n+l.count,0),count=p.inv[id]||0;
  if(count>tracked){if(p.cooking.lots.length>=192){const l=lots[0];if(l)l.count+=count-tracked;else {p.inv[id]=tracked;p.cooking.overflow=(p.cooking.overflow||0)+count-tracked;}}else addLot(p,id,count-tracked,quality,now);}
  if(count<tracked){let remove=tracked-count;for(const l of lots){const n=Math.min(l.count,remove);l.count-=n;remove-=n;if(!remove)break;}}
 }
 p.cooking.lots=p.cooking.lots.filter(l=>l.count>0);
}
function consume(p,item,count){if((p.inv[item]||0)<count)throw Error('재료가 부족합니다.');p.inv[item]-=count;if(perishable(item)){let left=count;for(const l of p.cooking.lots.filter(l=>l.item===item&&l.storage==='bag').sort((a,b)=>a.freshUntil-b.freshUntil)){const n=Math.min(l.count,left);l.count-=n;left-=n;if(!left)break;}p.cooking.lots=p.cooking.lots.filter(l=>l.count>0);}}
function consumeLot(p,l,count){l.count-=count;if(l.storage==='bag')p.inv[l.item]-=count;p.cooking.lots=p.cooking.lots.filter(l=>l.count>0);}
export function planIngredients(p,r,count=1,choices={}){
 amount(count);if(!choices||typeof choices!=='object'||Array.isArray(choices)||Object.keys(choices).some(k=>!r.ingredients.some(s=>s.key===k)))throw Error('잘못된 대체 재료 선택입니다.');
 const need={};for(const s of r.ingredients){const explicit=choices[s.key];if(explicit!==undefined&&!s.options.includes(explicit))throw Error('허용되지 않은 대체 재료입니다.');const id=explicit||s.options.find(id=>(p.inv[id]||0)-(need[id]||0)>=s.amount*count)||s.options[0];need[id]=(need[id]||0)+s.amount*count;if((p.inv[id]||0)<need[id])throw Error((items[id]?.name||id)+'이 부족합니다.');}return need;
}
export function maxCookCount(p,r,choices={}){let max=0;for(let n=1;n<=20;n++){try{planIngredients(p,r,n,choices);max=n;}catch{break;}}return max;}
export function cookingPlace(world,p,r,now=Date.now()){
 const kitchen=p.region==='inn'||p.region==='village'&&distance(p,villageSites.kitchen)<=2.5;
 const camp=!kitchen&&(world.camps||[]).some(c=>c.region===p.region&&c.until>now&&distance(p,c)<3.2);
 if(!kitchen&&!camp)throw Error('불을 피운 모닥불이나 여관 공동 화덕 가까이 가세요.');
 if(r.tool==='oven'&&!kitchen)throw Error('이 요리는 마을 오븐에서 구워야 합니다.');
 const tools={pot:'pot',pan:'pan',kettle:'kettle',jar:'preservingjar'};
 if(tools[r.tool]&&!p.inv[tools[r.tool]])throw Error((items[tools[r.tool]]?.name||r.tool)+'를 챙겨 오세요.');
 return {kitchen,camp};
}
function batchPlan(world,p,r,count,choices,now){const need=planIngredients(p,r,count,choices),place=cookingPlace(world,p,r,now);const water=['pot','kettle'].includes(r.tool)?count:0,fuel=place.camp?Math.ceil(count/5):0;if((p.water||0)<water)throw Error('물주머니에 조리용 물 '+water+'회분이 필요합니다.');if((p.inv.timber||0)<fuel)throw Error('모닥불 장작 '+fuel+'개가 필요합니다.');if((p.inv[r.id]||0)+count*r.yieldCount+(r.id==='bread'?(bonuses(p).cook||0)*count:0)>999)throw Error('완성 음식 보관 한도 999개를 넘습니다.');if(p.cooking.lots.length>=192)throw Error('식품 묶음을 먼저 정리하세요.');return {need,water,fuel};}
function ingredientScore(p,need,now){let fresh=0,quality=0,total=0;for(const [id,n]of Object.entries(need)){let left=n;const lots=p.cooking.lots.filter(l=>l.item===id&&l.storage==='bag').sort((a,b)=>a.freshUntil-b.freshUntil);if(!perishable(id)){fresh+=n;total+=n;continue;}for(const l of lots){const use=Math.min(left,l.count);fresh+=freshness(l,now)*use;quality+=l.quality*use;total+=use;left-=use;if(!left)break;}}return {fresh:fresh/Math.max(1,total),quality:quality/Math.max(1,total)};}
export function foodValue(l,now=Date.now()){const base=cookingRecipes[l.item]?.price||items[l.item]?.price||0;return Math.max(1,Math.floor(base*cookingQualityScale[l.quality]*(.5+.5*freshness(l,now))));}
function record(p,r,quality,count,now){const c=p.cooking;c.records[r.id]??={count:0,batches:0,bestQuality:0,firstCookedAt:now};const entry=c.records[r.id];entry.count+=count;entry.batches++;entry.bestQuality=Math.max(entry.bestQuality,quality);entry.lastCookedAt=now;}
function oldest(p,item){return p.cooking.lots.filter(l=>l.storage==='bag'&&l.item===item).sort((a,b)=>a.freshUntil-b.freshUntil)[0];}
function startEat(p,l,now){p.handTool='none';p.showcase=null;p.charging=null;if(!l||l.storage!=='bag'||l.freshUntil<=now)throw Error('가방에 있는 신선한 음식을 선택하세요.');const r=cookingRecipes[l.item],raw={apple:[10,8,5],cheese:[20,15,0],wildberry:[5,6,4]};if(!r&&!raw[l.item])throw Error('날재료는 조리한 뒤 드세요.');if(p.hp>=p.maxHp&&p.hunger>=100&&p.thirst>=100&&!r?.bonus)throw Error('지금은 식사가 필요하지 않습니다.');p.cooking.eating=l.id;p.activity={kind:'eatDish',startedAt:now,endsAt:now+1200,x:p.x,y:p.y,region:p.region};return '잠시 앉아 음식을 먹습니다.';}
function orderBoard(world,p){const day=1+Math.floor((world.clock||0)/1200),c=p.cooking;if(c.orderDay===day)return;c.orderDay=day;const known=c.known.map(id=>cookingRecipes[id]).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id));c.orders=Array.from({length:3},(_,i)=>{const r=known[(day*3+i)%known.length];return {id:day+'-'+i,recipe:r.id,count:i+1,minQuality:i===2?1:0,status:'offered',reward:r.price*(i+1)*2};});}
export function cookingAction(world,p,a,{at,near=(a,b)=>distance(a,b)<=2.5,random=Math.random,internal=false,now=Date.now()}={}){
 initializeCooking(p,now);const c=p.cooking;
 if(c.lots.length>=190&&['farm','gather','buygood','filletFish','request','explore'].includes(a.type))throw Error('식품 묶음을 정리한 뒤 새 물품을 받으세요.');
 const legacy={bread:'bread',stew:'stew',ration:'ration',lavendertea:'lavendertea',fishmeal:'grilledfish'};
 if(a.type==='cook'||a.type==='craft'&&own(legacy,a.recipe))a={type:'cookDish',recipe:a.type==='cook'?'bread':legacy[a.recipe],count:1};
 if(a.type==='eat'&&perishable(a.item||'bread'))return startEat(p,oldest(p,a.item||'bread'),now);
 if(a.type==='sell'||a.type==='sellgood'&&perishable(a.item)){const id=a.type==='sell'?'bread':a.item;a={type:'sellFood',lotId:oldest(p,id)?.id,count:a.type==='sell'?1:a.count};}
 if(['depositGoods','withdrawGoods'].includes(a.type)&&perishable(a.item))throw Error('신선 식품은 식품 보관함에서 관리하세요. 판매는 식품 장부를 사용합니다.');
 if(a.type==='buygood'&&own(cookingRecipes,a.item))throw Error('완성 요리는 직접 조리하세요.');
 if(a.type==='cancelCooking'){if(!c.job&&!c.eating)throw Error('진행 중인 식사나 조리가 없습니다.');c.job=null;c.eating=null;p.activity=null;return '재료를 쓰지 않고 조리를 접었습니다.';}
 if(a.type==='buyRecipeBook'){at('market');const book=own(recipeBooks,a.book)?recipeBooks[a.book]:null;if(!book||c.books.includes(a.book)||c.booksRead.includes(a.book))throw Error('이미 보유하거나 읽은 요리책입니다.');if(p.gold<book.cost)throw Error('요리책 구매비가 부족합니다.');p.gold-=book.cost;c.books.push(a.book);for(const r of Object.values(cookingRecipes).filter(r=>r.unlock===a.book))if(!c.seen.includes(r.id))c.seen.push(r.id);return '요리책 「'+book.name+'」을 구했습니다.';}
 if(a.type==='readRecipeBook'){if(!c.books.includes(a.book))throw Error('보유한 요리책을 선택하세요.');const recipes=Object.values(cookingRecipes).filter(r=>r.unlock===a.book);for(const r of recipes)if(!c.known.includes(r.id))c.known.push(r.id);c.books=c.books.filter(b=>b!==a.book);c.booksRead.push(a.book);return recipes.length+'가지 조리법을 익혔습니다.';}
 if(a.type==='discoverRecipe'){const site=own(recipeSites,a.site)?recipeSites[a.site]:null;if(!site||p.region!==site.region||!near(p,site))throw Error('조리 기록이 남은 장소 가까이 찾아가세요.');const discovered=Object.values(cookingRecipes).filter(r=>r.unlock===a.site);if(discovered.every(r=>c.known.includes(r.id)))throw Error('이미 읽은 조리 기록입니다.');for(const r of discovered){if(!c.seen.includes(r.id))c.seen.push(r.id);if(!c.known.includes(r.id))c.known.push(r.id);}return site.name+'에서 '+discovered.length+'가지 조리법을 배웠습니다.';}
 if(a.type==='learnRecipe'){const r=own(cookingRecipes,a.recipe)?cookingRecipes[a.recipe]:null;if(!r||c.known.includes(r.id))throw Error('이미 알거나 배울 수 없는 조리법입니다.');const id=r.unlock==='lesson'?'innkeeper':r.unlock.startsWith('quest_')?r.unlock.slice(6):null,n=villagers.find(n=>n.id===id);if(!n||p.region!=='village'||!near(p,n))throw Error('조리법을 가르쳐 주는 주민 가까이 가세요.');if(r.unlock==='lesson'){if(cookingLevel(p)<2||p.gold<12)throw Error('요리 숙련 2와 12 브론즈가 필요합니다.');p.gold-=12;}else if(p.requests?.[id]!=='done')throw Error('이 주민의 의뢰를 먼저 완료하세요.');c.known.push(r.id);if(!c.seen.includes(r.id))c.seen.push(r.id);return r.name+' 조리법을 배웠습니다.';}
 if(a.type==='cookDish'){
  if(!internal){const r=own(cookingRecipes,a.recipe)?cookingRecipes[a.recipe]:null,count=amount(a.count??1);if(!r||!c.known.includes(r.id))throw Error('습득한 조리법을 선택하세요.');if(cookingLevel(p)<r.level)throw Error('요리 숙련 '+r.level+'이 필요합니다.');batchPlan(world,p,r,count,a.ingredients||{},now);p.handTool='none';p.showcase=null;p.charging=null;const seconds=r.seconds+.25*(count-1);c.job={id:randomUUID(),recipe:r.id,count,ingredients:structuredClone(a.ingredients||{}),startedAt:now,endsAt:now+seconds*1000,x:p.x,y:p.y,region:p.region};p.activity={...c.job,kind:'cookDish'};return r.name+' '+count+'회분을 조리합니다.';}
  const j=c.job;if(!j||now<j.endsAt)throw Error('조리가 아직 끝나지 않았습니다.');c.job=null;if(p.region!==j.region||distance(p,j)>.3)throw Error('조리 장소에서 벗어났습니다.');const r=cookingRecipes[j.recipe],plan=batchPlan(world,p,r,j.count,j.ingredients,now),score=ingredientScore(p,plan.need,now),value=.15+cookingLevel(p)*.035+score.fresh*.18+score.quality*.10+(p.classId==='artisan'?.05:0)+Math.max(0,Math.min(.999,random()))*.25,quality=value>=.8?3:value>=.63?2:value>=.44?1:0;
  const total=(r.yieldCount+(r.id==='bread'?(bonuses(p).cook||0):0))*j.count,cost=Object.entries(plan.need).reduce((n,[id,k])=>n+(items[id]?.price||15)*k,0)+(plan.fuel?items.timber.price*plan.fuel:0);
  for(const [id,n]of Object.entries(plan.need))consume(p,id,n);if(plan.fuel)consume(p,'timber',plan.fuel);p.water-=plan.water;
  p.inv[r.id]=(p.inv[r.id]||0)+total;const l=addLot(p,r.id,total,quality,now,'cooked',now+shelf(r.id),Math.ceil(cost/total));p.lifeXP.cooking+=j.count*3;p.xp=(p.xp||0)+j.count*2;record(p,r,quality,total,now);c.lastResult={recipe:r.id,count:total,quality,at:now,lotId:l.id};return foodQualities[quality]+' '+r.name+' '+total+'개를 만들었습니다.';
 }
 if(a.type==='eatDish'){
  if(!internal)return startEat(p,c.lots.find(l=>l.id===a.lotId),now);
  const l=c.lots.find(l=>l.id===c.eating);c.eating=null;if(!l||l.storage!=='bag'||l.freshUntil<=now)throw Error('음식이 없거나 상했습니다.');const r=cookingRecipes[l.item],raw={apple:{heal:10,hunger:8,thirst:5},cheese:{heal:20,hunger:15,thirst:0},wildberry:{heal:5,hunger:6,thirst:4}},d=r||raw[l.item];if(!d)throw Error('조리해야 하는 재료입니다.');const scale=cookingQualityScale[l.quality]*(freshness(l,now)<.25?.7:1);consumeLot(p,l,1);p.hp=Math.min(p.maxHp,p.hp+Math.round(d.heal*scale));p.hunger=Math.min(100,p.hunger+Math.round(d.hunger*scale));p.thirst=Math.min(100,p.thirst+Math.round(d.thirst*scale));if(r&&Object.keys(r.bonus).length){p.buffs??=[];p.buffs=p.buffs.filter(b=>b.until>now&&b.id!=='food-'+r.group&&b.id!=='meal');p.buffs.push({id:'food-'+r.group,name:r.name,until:now+mealEffectSeconds*1000,bonus:Object.fromEntries(Object.entries(r.bonus).map(([k,n])=>[k,Math.round(n*scale*100)/100]))});}return '따뜻한 한 끼를 먹었습니다.';
 }
 if(a.type==='storeFood'||a.type==='takeFood'){
  if(!['home','inn','lodge','warehouse'].includes(p.region)||!p.inv.coolbox)throw Error('보냉 상자를 챙겨 안전한 실내에서 보관하세요.');const l=c.lots.find(l=>l.id===a.lotId),count=amount(a.count??1),deposit=a.type==='storeFood';if(!l||l.count<count||l.storage!==(deposit?'bag':'cellar'))throw Error('보관할 식품과 수량을 확인하세요.');if(c.lots.length>=192||deposit&&c.lots.filter(l=>l.storage==='cellar').reduce((n,l)=>n+l.count,0)+count>200||!deposit&&(p.inv[l.item]||0)+count>999)throw Error('보관함이나 가방이 가득합니다.');const oldFactor=storageFactor(l),newFactor=deposit?2.5:1,copy={...l,id:randomUUID(),count,storage:deposit?'cellar':'bag',freshUntil:now+(l.freshUntil-now)/oldFactor*newFactor};consumeLot(p,l,count);if(!deposit)p.inv[copy.item]=(p.inv[copy.item]||0)+count;c.lots.push(copy);return deposit?'보냉 상자에 보관했습니다.':'보관 음식을 꺼냈습니다.';
 }
 if(a.type==='sellFood'){at('market');const l=c.lots.find(l=>l.id===a.lotId),count=amount(a.count??1);if(!l||l.storage!=='bag'||l.count<count)throw Error('판매할 식품과 수량을 확인하세요.');const value=foodValue(l,now)*count;consumeLot(p,l,count);p.gold+=value;c.foodRevenue=(c.foodRevenue||0)+value;return value+' 브론즈에 판매했습니다.';}
 if(a.type==='compostSpoilage'){const count=amount(a.count??1);if(c.spoiled<count*3||(p.inv.compost||0)+count>999)throw Error('퇴비 한 개당 상한 식품 3개가 필요합니다.');c.spoiled-=count*3;p.inv.compost=(p.inv.compost||0)+count;return '상한 식품을 퇴비로 돌렸습니다.';}
 if(['acceptCookingOrder','deliverCookingOrder'].includes(a.type)){at('market');orderBoard(world,p);const order=c.orders.find(o=>o.id===a.orderId);if(!order||order.status==='done')throw Error('유효한 주문을 선택하세요.');if(a.type==='acceptCookingOrder'){if(order.status!=='offered')throw Error('이미 받은 주문입니다.');order.status='active';return '오늘의 선택 납품을 받았습니다.';}if(order.status!=='active')throw Error('먼저 주문을 받으세요.');const lots=c.lots.filter(l=>l.item===order.recipe&&l.origin==='cooked'&&l.storage==='bag'&&l.quality>=order.minQuality&&freshness(l,now)>=.25).sort((a,b)=>a.freshUntil-b.freshUntil);if(lots.reduce((n,l)=>n+l.count,0)<order.count)throw Error('직접 조리한 신선한 음식의 수량·품질이 부족합니다.');let left=order.count;for(const l of lots){const n=Math.min(left,l.count);consumeLot(p,l,n);left-=n;if(!left)break;}order.status='done';p.gold+=order.reward;p.xp=(p.xp||0)+8;c.ordersDelivered=(c.ordersDelivered||0)+1;return '납품 완료 · '+order.reward+' 브론즈';}
 return null;
}
export function cookingView(world,p,now=Date.now()){initializeCooking(p,now);orderBoard(world,p);const c=p.cooking;return {...c,level:cookingLevel(p),lots:c.lots.map(l=>({...l,freshness:freshness(l,now),sellPrice:foodValue(l,now)}))};}
