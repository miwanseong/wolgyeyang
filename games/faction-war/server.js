import {initializeCombat,combatAction,combatTick} from './combat.js';
import {adventureAction,tradeAction,economyTick,secrets,initializeExchange} from './adventure.js';
import {initializeSurvival,survivalAction,survivalTick} from './survival.js';
import {economy} from './economy.js';
import {items,crops,recipes,gatherNodes,villagers,canonCharacters,feats,bonuses,weatherFor} from './content.js';
import {buildings,rooms,obstacles,landscapeTrees,villageOrigin,villageSites} from './layout.js';
import {classes,regions,portals,trees,blocked,initializePlayer,progress} from './game.js';
import {createAuth} from './auth.js';
import http from 'node:http';
import { randomUUID, randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=process.env.DATA_DIR||path.join(root,'data');
const production=process.env.NODE_ENV==='production';
const host=process.env.HOST||'127.0.0.1';
const origin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL;
const invite=process.env.INVITE_CODE;
if(production&&(!origin||!origin.startsWith('https://')||!invite||invite.length<16))throw Error('Production requires HTTPS APP_ORIGIN and INVITE_CODE of at least 16 characters');
if(host!=='127.0.0.1'&&!invite)throw Error('Non-loopback listening requires INVITE_CODE');
const hash=s=>createHash('sha256').update(s).digest('hex');
const safeEqual=(a,b)=>timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
const fail=(status,message)=>Object.assign(new Error(message),{status});
await mkdir(data,{recursive:true,mode:0o700});
let world;
try { world=JSON.parse(await readFile(path.join(data,'world.json'),'utf8')); } catch(e) { if(e.code!=='ENOENT')throw e; world={version:1,layoutVersion:2,day:1,clock:0,players:{},plots:Array.from({length:12},(_,i)=>({x:70+i%4,y:58+Math.floor(i/4),planted:0})),monsters:[{id:0,x:35,y:32,hp:50},{id:1,x:38,y:36,hp:50},{id:2,x:34,y:39,hp:50}],log:['변경 개척지에 오신 것을 환영합니다.']}; }
// Preserve existing character and farm state while relocating the formerly edge-bound town.
if(world.layoutVersion!==2){for(const p of Object.values(world.players))if(!p.region||p.region==='village'){p.x+=64;p.y+=48;if(p.x>189||p.y>141||terrainInvalid(p.x,p.y)){p.x=74;p.y=56;}}for(const plot of world.plots){plot.x+=64;plot.y+=48;}for(const m of world.monsters)if(!m.region||m.region==='village'){m.x+=64;m.y+=48;if(m.x>189||m.y>141){m.x=35+(Number(m.id)||0)%30;m.y=38;}}world.layoutVersion=2;}
function terrainInvalid(x,y){return obstacles('village').some(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h);}
// Migrate old plaintext bearer credentials out of the persistent world.
for(const [key,p] of Object.entries(world.players)){if(p.token){delete world.players[key];delete p.token;p.expires=Date.now()+7*86400000;world.players[hash(key)]=p;}}
const clients=new Map(), rates=new Map(),ipRates=new Map(),moveTimes=new Map(),chatTimes=new Map();
const playerFor=key=>Object.hasOwn(world.players,key)?world.players[key]:null;
function guestKey(req){const header=req.headers.authorization;const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('fw_session='))?.slice(11);const token=header?.startsWith('Bearer ')?header.slice(7):cookie;return typeof token==='string'&&/^[0-9a-f-]{36}$/.test(token)?hash(token):'';}
function limit(map,key,max,window){const now=Date.now();let r=map.get(key);if(!r||now-r.t>=window){if(map.size>=10000&&!r)throw fail(503,'서버가 혼잡합니다.');r={t:now,n:0};map.set(key,r);}if(++r.n>max)throw fail(429,'요청이 너무 많습니다. 잠시 후 다시 시도하세요.');}
async function body(req){if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'JSON 요청만 허용합니다.');let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>2048)throw fail(413,'요청 크기 초과');chunks.push(chunk);}let b;try{b=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'잘못된 JSON');}if(!b||Array.isArray(b)||typeof b!=='object')throw fail(400,'잘못된 요청');return b;}
function checkOrigin(req){const expected=origin||'http://'+req.headers.host;if(req.headers.origin&&req.headers.origin!==expected)throw fail(403,'다른 사이트의 요청은 허용하지 않습니다.');if(req.headers['sec-fetch-site']==='cross-site')throw fail(403,'다른 사이트의 요청은 허용하지 않습니다.');}
setInterval(()=>{const t=Date.now();for(const map of [rates,ipRates])for(const [k,v]of map)if(t-v.t>60000)map.delete(k);},60000).unref();
let saving=Promise.resolve();
function newPlayer(key,name){if(Object.keys(world.players).length>=100)throw fail(503,'캐릭터 한도에 도달했습니다.');world.players[key]={id:randomUUID(),name,x:74,y:56,hp:100,maxHp:100,gold:80,xp:0,weapon:0,skill:false,expires:Date.now()+7*86400000,inv:{seed:6,wheat:0,bread:2,ore:0}};}
const auth=await createAuth({data,production,invite,readBody:body,limit,ipRates,playerFor,newPlayer,disconnect:key=>{clients.get(key)?.end();clients.delete(key);},saveWorld:()=>save()});
function requestKey(req){const a=auth.identity(req);if(a)return a.playerKey;if(production||auth.hasCookie(req))return '';return guestKey(req);}
for(const p of Object.values(world.players)){initializePlayer(p);initializeSurvival(p);initializeCombat(p);}
for(const m of world.monsters){m.region??='village';m.kind??='wolf';}
if(!world.regionsVersion){for(const [region,kind]of [['forest','wolf'],['ruins','skeleton']])for(let i=0;i<10;i++)world.monsters.push({id:region+i,region,kind,x:12+(i*7)%40,y:10+(i*9)%30,hp:50});world.regionsVersion=1;}
if(!world.expandedVersion){for(const region of ['village','forest','ruins'])for(let i=0;i<24;i++)world.monsters.push({id:'frontier-'+region+i,region,kind:region==='ruins'?'skeleton':'wolf',x:region==='village'?18+(i%6)*7:70+(i*13)%108,y:region==='village'?20+Math.floor(i/6)*8:18+(i*19)%112,hp:50});world.expandedVersion=1;}
if(!world.fieldContentVersion){for(const [region,level]of [['meadow',2],['highlands',4],['coast',3],['marsh',4],['island',5],['deep',6]])for(let i=0;i<4;i++)world.monsters.push({id:region+'-field-'+i,region,kind:['highlands','island','deep'].includes(region)?'skeleton':'wolf',name:region==='deep'?'침몰한 경비병':region==='highlands'?'고개의 망령':'들판의 마수',x:24+i*30,y:38+(i%2)*48,hp:40+level*10,maxHp:40+level*10,damage:4+level*2,level});world.fieldContentVersion=1;}
const sites={...villageSites,clinic:{x:100,y:86}};
const near=(a,b,r=2.5)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
const note=s=>{world.log.push(s);world.log=world.log.slice(-12);};
function snapshot(){initializeExchange(world);world.combatFX=(world.combatFX||[]).filter(f=>Date.now()-f.at<2000).slice(-24);for(const p of Object.values(world.players)){initializePlayer(p);initializeSurvival(p);initializeCombat(p);}return {...world,players:Object.entries(world.players).map(([key,p])=>({id:p.id,name:p.name,region:p.region,classId:p.classId,profession:p.profession,kills:p.kills,quest:p.quest,hidden:p.hidden,requests:p.requests,feats:p.feats,totalXp:p.totalXp,oxygen:p.oxygen,stamina:p.stamina,mana:p.mana,charging:p.charging,dodgeUntil:p.dodgeUntil,dodgeFrom:p.dodgeFrom,hurtUntil:p.hurtUntil,perfectUntil:p.perfectUntil,equippedSuit:p.equippedSuit,visited:p.visited,discoveries:p.discoveries,business:p.business,holdings:p.holdings,level:p.level,hunger:p.hunger,thirst:p.thirst,water:p.water,activity:p.activity,nextSpell:p.nextSpell,torch:p.torch!==false,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,gold:p.gold,xp:p.xp,weapon:p.weapon,skill:p.skill,inv:p.inv,online:clients.has(key)})),sites,regions,portals,classes,buildings,rooms,villagers,gatherNodes,crops,recipes,feats,secrets,weather:weatherFor(world)};}
function broadcast(){const msg='data: '+JSON.stringify(snapshot())+'\n\n'; for(const r of clients.values()){if(r.writableLength>262144){r.destroy();continue;}r.write(msg);}}

function save(){const body=JSON.stringify(world);saving=saving.then(async()=>{await writeFile(path.join(data,'world.tmp'),body,{mode:0o600});await rename(path.join(data,'world.tmp'),path.join(data,'world.json'));});return saving;}
const random=()=>randomInt(0,1000000)/1000000;
function emitFX(f){world.combatFX??=[];world.combatFX.push({id:randomUUID(),at:Date.now(),...f});world.combatFX=world.combatFX.slice(-24);}
function action(p,a,internal=false){const before=p.xp||0;const result=applyAction(p,a,internal);if(p.xp>before)p.totalXp=(p.totalXp??before)+(p.xp-before);p.level=Math.max(p.level||1,1+Math.floor(Math.sqrt((p.totalXp||0)/30)));return result;}
function applyAction(p,a,internal=false){if(a.complete&&!internal)throw fail(400,'잘못된 요청');if(p.activity&&!internal){if(a.type==='move')p.activity=null;else throw Error('진행 중인 동작이 있습니다.');}
 initializePlayer(p);initializeSurvival(p);initializeCombat(p);const combat=combatAction(world,p,a,emitFX);if(combat)return combat;const survival=survivalAction(world,p,a,near,internal);if(survival)return survival;if(a.type==='torch'){if(!p.inv.torch)throw Error('횃불이 필요합니다.');p.torch=p.torch===false;return p.torch?'횃불을 켰습니다.':'횃불을 껐습니다.';}const result=progress(p,a,near);if(result){note(p.name+': '+result);return result;}
 const inv=p.inv; const need=(k,n)=>{if((inv[k]||0)<n)throw Error('재료가 부족합니다: '+k);};
 const at=k=>{if(!((p.region==='shop'&&k==='market')||(p.region==='smith'&&k==='forge')||(p.region==='inn'&&k==='kitchen')||(p.region==='clinic'&&k==='clinic'))&&(p.region!=='village'||!near(p,sites[k])))throw Error('해당 시설 가까이 이동하세요.');};
 const travelAction=adventureAction(world,p,a,near,random);if(travelAction)return travelAction;const commerce=tradeAction(world,p,a,at);if(commerce)return commerce;const economic=economy(world,p,a,near,at);if(economic)return economic;
 if(a.type==='move'){if(typeof a.dx!=='number'||typeof a.dy!=='number')throw fail(400,'잘못된 이동');const now=performance.now();if(now-(moveTimes.get(p.id)??-Infinity)<90)throw fail(429,'이동 속도 초과');let dx=a.dx,dy=a.dy;if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)>1.01)throw Error('잘못된 이동');moveTimes.set(p.id,now); if(Date.now()<(p.recoveryUntil||0))return;const speed=p.charging?.55:1;const x=p.x+dx*.65*speed,y=p.y+dy*.65*speed;const bounds=regions[p.region];if(x<1||x>bounds.width-2||y<2||y>bounds.height-2||blocked(p.region,x,y))return;p.x=x;p.y=y;return;}
 if(a.type==='farm'){if(p.region!=='village')throw Error('마을 경작지에서 농사할 수 있습니다.');const plot=world.plots.filter(t=>near(p,t,1.8)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];if(!plot)throw Error('밭 가까이 이동하세요.');if(plot.withered){plot.planted=0;plot.withered=false;return '시든 작물을 정리했습니다.';}if(!plot.planted){const id=a.crop||'wheat';if(!Object.hasOwn(crops,id))throw Error('알 수 없는 작물');const crop=crops[id];need(crop.seed,1);inv[crop.seed]--;plot.crop=id;plot.withered=false;plot.wateredAt=Date.now();plot.planted=Date.now();note(p.name+' 님이 '+crop.name+'을 심었습니다.');}else{const crop=crops[plot.crop||'wheat'];if(Date.now()-plot.planted<crop.seconds*1000)throw Error('작물이 자라는 중입니다.');inv[crop.harvest]=(inv[crop.harvest]||0)+(p.classId==='artisan'?4:3)+(bonuses(p).farm||0);plot.planted=0;p.xp+=3;note(p.name+' 님이 '+crop.name+'을 수확했습니다.');}}

 else if(a.type==='buy'){at('market');if(p.gold<10)throw Error('10 브론즈가 필요합니다.');p.gold-=10;inv.seed+=3;}
 else if(a.type==='sell'){at('market');need('bread',1);inv.bread--;p.gold+=p.classId==='artisan'?60:45;note(p.name+' 님이 빵을 45 브론즈에 판매했습니다.');}
 else if(a.type==='cook'){at('kitchen');need('wheat',2);inv.wheat-=2;inv.bread+=1+(bonuses(p).cook||0);p.xp+=4;}
 else if(a.type==='eat'){const id=a.item||'bread',heal={bread:40,potion:65,stew:70,cheese:20,apple:10,bandage:25,ration:15};if(id==='mana'){need(id,1);if(p.nextSpell)throw Error('이미 주문 강화 효과가 있습니다.');inv[id]--;p.nextSpell=10;}else{if(!Object.hasOwn(heal,id))throw Error('사용할 수 없는 아이템');need(id,1);if(p.hp===p.maxHp&&(!['bread','stew','cheese','apple','ration'].includes(id)||p.hunger>=100))throw Error('체력과 허기가 가득합니다.');inv[id]--;p.hp=Math.min(p.maxHp,p.hp+heal[id]+(bonuses(p).healing||0));p.hunger=Math.min(100,p.hunger+({bread:20,stew:45,cheese:15,apple:8,ration:50}[id]||0));}}

 else if(a.type==='forge'){at('forge');const cost=Math.max(1,3+p.weapon*2-(bonuses(p).oreDiscount||0));need('ore',cost);if(p.weapon>=2){need('ingot',1);need('ember',1);}if(p.gold<30)throw Error('30 브론즈가 필요합니다.');if(!internal){p.activity={kind:'forge',startedAt:Date.now(),endsAt:Date.now()+1500,x:p.x,y:p.y,region:p.region};return '모루 앞에서 장비를 단련합니다.';}inv.ore-=cost;p.gold-=30;if(p.weapon>=2){inv.ingot--;inv.ember--;}p.weapon++;}

 else if(a.type==='learn'){at('teacher');if(p.skill)throw Error('이미 배운 기술입니다.');if(p.xp<20)throw Error('경험치 20이 필요합니다.');p.xp-=20;p.skill=true;note(p.name+' 님이 기본 화염술을 배웠습니다.');}
 else if(a.type==='attack'||a.type==='spell'){const spell=a.type==='spell';if(spell&&!p.skill)throw Error('기본 화염술을 먼저 배우세요.');const m=world.monsters.find(m=>m.region===p.region&&m.hp>0&&near(p,m,spell?5:p.classId==='ranger'?4+(bonuses(p).range||0):2));if(!m){if(spell)p.charging=null;throw Error('사거리 안에 적이 없습니다.');}if(Date.now()-(p.lastAttack||0)<(spell?1200:500))throw Error('공격 준비 중');const charge=spell&&p.charging?Math.min(1,(Date.now()-p.charging.at)/1800):0;const resource=spell?'mana':'stamina',cost=spell?10+Math.round(charge*10):5;if(p[resource]<cost)throw Error(spell?'마나가 부족합니다.':'기력이 부족합니다.');p[resource]-=cost;p.lastAttack=Date.now();p.recoveryUntil=Date.now()+(charge>.7?240:120);const damage=Math.round(((spell?30+(p.classId==='mage'?8:0)+(p.nextSpell||0)+(bonuses(p).spell||0):12+p.weapon*7+(classes[p.classId]?.damage||0)+(bonuses(p).attack||0))+(p.profession?8:0))*(1+charge*.65));m.hp-=damage;m.hurtUntil=Date.now()+220;m.stunUntil=Date.now()+160;emitFX({actorId:p.id,targetId:m.id,region:p.region,x:p.x,y:p.y,targetX:m.x,targetY:m.y,kind:a.type,classId:p.classId,damage,charge});const distance=Math.hypot(m.x-p.x,m.y-p.y)||1,force=spell?.25+charge*.4:.08,nx=m.x+(m.x-p.x)/distance*force,ny=m.y+(m.y-p.y)/distance*force;if(!blocked(m.region,nx,ny)){m.x=nx;m.y=ny;}if(spell){p.nextSpell=0;p.charging=null;}if(m.hp<=0){m.hp=0;m.respawn=Date.now()+20000;p.kills++;inv.ore+=2;inv.meat=(inv.meat||0)+(m.kind==='wolf'?1:0);p.gold+=15;if(m.region==='ruins'&&random()<.2)p.inv.ember=(p.inv.ember||0)+1;p.xp+=10;note(p.name+' 님이 마수를 처치했습니다.');}}
 else if(a.type==='chat'){if(typeof a.text!=='string')throw fail(400,'잘못된 대화');const now=Date.now();if(now-(chatTimes.get(p.id)||0)<1000)throw fail(429,'대화는 초당 한 번 가능합니다.');chatTimes.set(p.id,now);const s=a.text.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,100);if(s)note(p.name+': '+s);}
 else throw Error('알 수 없는 행동');
}
const server=http.createServer({maxHeaderSize:8192,requestTimeout:10000,headersTimeout:10000},async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
 const u=new URL(req.url,'http://local');
 // Public document navigation may originate from another site; authenticated APIs may not.
 if(u.pathname.startsWith('/api/')||!['GET','HEAD'].includes(req.method))checkOrigin(req);
 const ip=req.socket.remoteAddress;limit(ipRates,ip,240,1000);
 if(u.pathname.startsWith('/api/'))res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/api/admin/weather'&&req.method==='POST'){if(auth.identity(req)?.role!=='admin')throw fail(403,'운영자 권한이 필요합니다.');const input=await body(req);if(!['auto','clear','rain','wind','warm'].includes(input.kind))throw fail(400,'알 수 없는 날씨');world.weatherOverride=input.kind==='auto'?null:input.kind;await save();res.setHeader('Content-Type','application/json');res.end('{"ok":true}');broadcast();return;}if(await auth.handle(req,res,u))return;
 if(u.pathname==='/api/join'&&req.method==='POST'){
 limit(ipRates,'join:'+ip,10,60000);const input=await body(req);let key=requestKey(req),p=playerFor(key);
 if(p&&!auth.identity(req)&&p.expires<Date.now())throw fail(401,'세션이 만료되었습니다.');
 if(!p){if(production||auth.hasCookie(req))throw fail(401,'로그인이 필요합니다.');if(invite&&(typeof input.invite!=='string'||!safeEqual(input.invite,invite)))throw fail(403,'초대 코드가 필요합니다.');
 if(Object.keys(world.players).length>=100)throw fail(503,'서버의 캐릭터 한도에 도달했습니다.');
 if(input.name!==undefined&&typeof input.name!=='string')throw fail(400,'잘못된 이름');
 const name=(input.name||'여행자').normalize('NFKC').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,16)||'여행자';
 const token=randomUUID();key=hash(token);p={id:randomUUID(),name,x:74,y:56,hp:100,maxHp:100,gold:80,xp:0,weapon:0,skill:false,expires:Date.now()+7*86400000,inv:{seed:6,wheat:0,bread:2,ore:0}};world.players[key]=p;
 res.setHeader('Set-Cookie','fw_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+(production?'; Secure':''));note(p.name+' 님이 개척지에 도착했습니다.');}
 await save();res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:p.id}));broadcast();return;}
 const key=requestKey(req),p=playerFor(key);const authorized=p&&(!!auth.identity(req)||p.expires>Date.now());
 if(u.pathname==='/api/events'&&req.method==='GET'){if(!authorized)throw fail(401,'인증이 필요합니다.');if(clients.size>=32&&!clients.has(key))throw fail(503,'동시 접속 인원이 가득 찼습니다.');res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});clients.get(key)?.end();res.authRequest=req;clients.set(key,res);broadcast();req.on('close',()=>{if(clients.get(key)===res)clients.delete(key);});return;}
 if(u.pathname==='/api/action'&&req.method==='POST'){if(!authorized)throw fail(401,'인증이 필요합니다.');limit(rates,key,20,1000);const message=action(p,await body(req));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,message}));broadcast();return;}
 if(u.pathname.startsWith('/api/'))throw fail(404,'찾을 수 없습니다.');
 if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'허용되지 않은 메서드');
 const names={'/':'index.html','/client.js':'client.js','/world.js':'world.js','/lighting.js':'lighting.js','/items.js':'items.js','/weather.js':'weather.js','/audio.js':'audio.js','/cinema.js':'cinema.js','/scene3d.js':'scene3d.js','/vendor/three.module.js':'vendor/three.module.js','/vendor/three.core.js':'vendor/three.core.js','/vendor/Reflector.js':'vendor/Reflector.js','/vendor/THREE-LICENSE.txt':'vendor/THREE-LICENSE.txt','/vendor/NOTICE.txt':'vendor/NOTICE.txt','/layout.js':'../layout.js','/content.js':'../content.js','/adventure.js':'../adventure.js','/style.css':'style.css','/assets/borderland-pixel.png':'assets/borderland-pixel.png','/assets/panel-pixel.png':'assets/panel-pixel.png','/assets/world-sprites.png':'assets/world-sprites.png','/assets/terrain-tiles.png':'assets/terrain-tiles.png','/assets/interior-sprites.png':'assets/interior-sprites.png','/assets/item-icons.png':'assets/item-icons.png','/assets/supplies-icons.png':'assets/supplies-icons.png','/assets/survival-icons.png':'assets/survival-icons.png','/assets/crop-stages.png':'assets/crop-stages.png','/assets/sd-adventurers.png':'assets/sd-adventurers.png','/assets/exploration-icons.png':'assets/exploration-icons.png','/assets/settlement-props.png':'assets/settlement-props.png'};for(const name of ['swing','impact','cast','dodge','step','collect','forge','water','levelup','perfect','charge_loop','ambience_loop','rain_loop'])names['/assets/audio/'+name+'.wav']='assets/audio/'+name+'.wav';const f=Object.hasOwn(names,u.pathname)?names[u.pathname]:null;if(!f)throw fail(404,'찾을 수 없습니다.');res.setHeader('Content-Type',f.endsWith('.wav')?'audio/wav':f.endsWith('.txt')?'text/plain; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(req.method==='HEAD'?undefined:await readFile(path.join(root,'public',f)));
 }catch(e){if(res.headersSent){res.end();return;}const status=e.status||(e.code?500:400);res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error:status>=500?'서버 요청을 처리할 수 없습니다.':e.message}));}});
server.maxConnections=128;server.keepAliveTimeout=5000;
let subTick=0;
setInterval(()=>{const active=new Set([...clients.keys()].map(k=>world.players[k]?.id));combatTick(world,active,emitFX);if(++subTick%10===0){world.clock++;economyTick(world,random);survivalTick(world,active);if(world.clock%240===0)world.day++;}for(const p of Object.values(world.players))if(p.activity&&Date.now()>=p.activity.endsAt){const a=p.activity;p.activity=null;if(p.region===a.region&&Math.hypot(p.x-a.x,p.y-a.y)<.3){try{const result=action(p,{type:a.kind},true);note(p.name+': '+(result||'장비 강화 완료'));}catch{note(p.name+' 님의 동작이 취소되었습니다.');}}}for(const [key,res]of clients)if(!playerFor(key)||(res.authRequest&&auth.hasCookie(res.authRequest)?!auth.identity(res.authRequest):playerFor(key).expires<=Date.now())){res.end();clients.delete(key);}broadcast();},100).unref();
setInterval(()=>save().catch(console.error),5000).unref();
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{await save();await auth.persist();server.close();process.exit(0);});
server.listen(Number(process.env.PORT||3100),host,()=>console.log('Faction War · port '+server.address().port));
