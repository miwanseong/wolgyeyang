import {createAuth} from './auth.js';
import http from 'node:http';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
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
try { world=JSON.parse(await readFile(path.join(data,'world.json'),'utf8')); } catch(e) { if(e.code!=='ENOENT')throw e; world={version:1,day:1,clock:0,players:{},plots:Array.from({length:12},(_,i)=>({x:6+i%4,y:10+Math.floor(i/4),planted:0})),monsters:[{id:0,x:25,y:8,hp:50},{id:1,x:28,y:12,hp:50},{id:2,x:24,y:15,hp:50}],log:['변경 개척지에 오신 것을 환영합니다.']}; }
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
function newPlayer(key,name){if(Object.keys(world.players).length>=100)throw fail(503,'캐릭터 한도에 도달했습니다.');world.players[key]={id:randomUUID(),name,x:10,y:8,hp:100,maxHp:100,gold:80,xp:0,weapon:0,skill:false,expires:Date.now()+7*86400000,inv:{seed:6,wheat:0,bread:2,ore:0}};}
const auth=await createAuth({data,production,invite,readBody:body,limit,ipRates,playerFor,newPlayer,disconnect:key=>{clients.get(key)?.end();clients.delete(key);},saveWorld:()=>save()});
function requestKey(req){const a=auth.identity(req);if(a)return a.playerKey;if(production||auth.hasCookie(req))return '';return guestKey(req);}
const sites={market:{x:7,y:5},forge:{x:14,y:5},kitchen:{x:17,y:5},teacher:{x:12,y:8},gate:{x:21,y:10}};
const near=(a,b,r=2.5)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
const note=s=>{world.log.push(s);world.log=world.log.slice(-12);};
function snapshot(){return {...world,players:Object.entries(world.players).map(([key,p])=>({id:p.id,name:p.name,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,gold:p.gold,xp:p.xp,weapon:p.weapon,skill:p.skill,inv:p.inv,online:clients.has(key)})),sites};}
function broadcast(){const msg='data: '+JSON.stringify(snapshot())+'\n\n'; for(const r of clients.values()){if(r.writableLength>262144){r.destroy();continue;}r.write(msg);}}

function save(){const body=JSON.stringify(world);saving=saving.then(async()=>{await writeFile(path.join(data,'world.tmp'),body,{mode:0o600});await rename(path.join(data,'world.tmp'),path.join(data,'world.json'));});return saving;}
function action(p,a){
 const inv=p.inv; const need=(k,n)=>{if((inv[k]||0)<n)throw Error('재료가 부족합니다: '+k);};
 const at=k=>{if(!near(p,sites[k]))throw Error('해당 시설 가까이 이동하세요.');};
 if(a.type==='move'){if(typeof a.dx!=='number'||typeof a.dy!=='number')throw fail(400,'잘못된 이동');const now=performance.now();if(now-(moveTimes.get(p.id)??-Infinity)<90)throw fail(429,'이동 속도 초과');let dx=a.dx,dy=a.dy;if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)>1.01)throw Error('잘못된 이동');moveTimes.set(p.id,now); const x=p.x+dx*.65,y=p.y+dy*.65;if(x<1||x>30||y<2||y>19)return;if(x>20&&!(y>9&&y<12)&&p.x<=20)return;if(x<=20&&!(y>9&&y<12)&&p.x>20)return;p.x=x;p.y=y;return;}
 if(a.type==='farm'){const plot=world.plots.filter(t=>near(p,t,1.8)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];if(!plot)throw Error('밭 가까이 이동하세요.');if(!plot.planted){need('seed',1);inv.seed--;plot.planted=Date.now();note(p.name+' 님이 밀을 심었습니다.');}else if(Date.now()-plot.planted>=30000){inv.wheat+=3;plot.planted=0;p.xp+=3;note(p.name+' 님이 밀을 수확했습니다.');}else throw Error('밀이 자라는 중입니다. 30초 후 수확하세요.');}
 else if(a.type==='buy'){at('market');if(p.gold<10)throw Error('10 브론즈가 필요합니다.');p.gold-=10;inv.seed+=3;}
 else if(a.type==='sell'){at('market');need('bread',1);inv.bread--;p.gold+=45;note(p.name+' 님이 빵을 45 브론즈에 판매했습니다.');}
 else if(a.type==='cook'){at('kitchen');need('wheat',2);inv.wheat-=2;inv.bread++;p.xp+=4;}
 else if(a.type==='eat'){need('bread',1);if(p.hp===p.maxHp)throw Error('체력이 가득합니다.');inv.bread--;p.hp=Math.min(p.maxHp,p.hp+40);}
 else if(a.type==='forge'){at('forge');const cost=3+p.weapon*2;need('ore',cost);if(p.gold<30)throw Error('30 브론즈가 필요합니다.');inv.ore-=cost;p.gold-=30;p.weapon++;}
 else if(a.type==='learn'){at('teacher');if(p.skill)throw Error('이미 배운 기술입니다.');if(p.xp<20)throw Error('경험치 20이 필요합니다.');p.xp-=20;p.skill=true;note(p.name+' 님이 기본 화염술을 배웠습니다.');}
 else if(a.type==='attack'||a.type==='spell'){const spell=a.type==='spell';if(spell&&!p.skill)throw Error('기본 화염술을 먼저 배우세요.');const m=world.monsters.find(m=>m.hp>0&&near(p,m,spell?5:2));if(!m)throw Error('사거리 안에 적이 없습니다.');if(Date.now()-(p.lastAttack||0)<(spell?1200:500))throw Error('공격 준비 중');p.lastAttack=Date.now();m.hp-=spell?30:12+p.weapon*7;if(m.hp<=0){m.hp=0;m.respawn=Date.now()+20000;inv.ore+=2;p.gold+=15;p.xp+=10;note(p.name+' 님이 마수를 처치했습니다.');}}
 else if(a.type==='chat'){if(typeof a.text!=='string')throw fail(400,'잘못된 대화');const now=Date.now();if(now-(chatTimes.get(p.id)||0)<1000)throw fail(429,'대화는 초당 한 번 가능합니다.');chatTimes.set(p.id,now);const s=a.text.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,100);if(s)note(p.name+': '+s);}
 else throw Error('알 수 없는 행동');
}
const server=http.createServer({maxHeaderSize:8192,requestTimeout:10000,headersTimeout:10000},async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
 const u=new URL(req.url,'http://local');checkOrigin(req);
 const ip=req.socket.remoteAddress;limit(ipRates,ip,240,1000);
 if(u.pathname.startsWith('/api/'))res.setHeader('Cache-Control','no-store');
 if(await auth.handle(req,res,u))return;
 if(u.pathname==='/api/join'&&req.method==='POST'){
 limit(ipRates,'join:'+ip,10,60000);const input=await body(req);let key=requestKey(req),p=playerFor(key);
 if(p&&!auth.identity(req)&&p.expires<Date.now())throw fail(401,'세션이 만료되었습니다.');
 if(!p){if(production||auth.hasCookie(req))throw fail(401,'로그인이 필요합니다.');if(invite&&(typeof input.invite!=='string'||!safeEqual(input.invite,invite)))throw fail(403,'초대 코드가 필요합니다.');
 if(Object.keys(world.players).length>=100)throw fail(503,'서버의 캐릭터 한도에 도달했습니다.');
 if(input.name!==undefined&&typeof input.name!=='string')throw fail(400,'잘못된 이름');
 const name=(input.name||'여행자').normalize('NFKC').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,16)||'여행자';
 const token=randomUUID();key=hash(token);p={id:randomUUID(),name,x:10,y:8,hp:100,maxHp:100,gold:80,xp:0,weapon:0,skill:false,expires:Date.now()+7*86400000,inv:{seed:6,wheat:0,bread:2,ore:0}};world.players[key]=p;
 res.setHeader('Set-Cookie','fw_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+(production?'; Secure':''));note(p.name+' 님이 개척지에 도착했습니다.');}
 await save();res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:p.id}));broadcast();return;}
 const key=requestKey(req),p=playerFor(key);const authorized=p&&(!!auth.identity(req)||p.expires>Date.now());
 if(u.pathname==='/api/events'&&req.method==='GET'){if(!authorized)throw fail(401,'인증이 필요합니다.');if(clients.size>=32&&!clients.has(key))throw fail(503,'동시 접속 인원이 가득 찼습니다.');res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});clients.get(key)?.end();res.authRequest=req;clients.set(key,res);broadcast();req.on('close',()=>{if(clients.get(key)===res)clients.delete(key);});return;}
 if(u.pathname==='/api/action'&&req.method==='POST'){if(!authorized)throw fail(401,'인증이 필요합니다.');limit(rates,key,20,1000);action(p,await body(req));res.setHeader('Content-Type','application/json');res.end('{"ok":true}');broadcast();return;}
 if(u.pathname.startsWith('/api/'))throw fail(404,'찾을 수 없습니다.');
 if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'허용되지 않은 메서드');
 const names={'/':'index.html','/client.js':'client.js','/style.css':'style.css'};const f=Object.hasOwn(names,u.pathname)?names[u.pathname]:null;if(!f)throw fail(404,'찾을 수 없습니다.');res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(req.method==='HEAD'?undefined:await readFile(path.join(root,'public',f)));
 }catch(e){if(res.headersSent){res.end();return;}const status=e.status||(e.code?500:400);res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error:status>=500?'서버 요청을 처리할 수 없습니다.':e.message}));}});
server.maxConnections=128;server.keepAliveTimeout=5000;
setInterval(()=>{world.clock++;if(world.clock%240===0)world.day++;for(const m of world.monsters){if(m.hp<=0&&Date.now()>m.respawn){m.hp=50;}if(m.hp>0)for(const p of Object.values(world.players)){if(clients.has(Object.keys(world.players).find(k=>world.players[k]===p))&&near(p,m,2)){p.hp-=8;if(p.hp<=0){p.hp=p.maxHp;p.x=10;p.y=8;p.gold=Math.max(0,p.gold-10);note(p.name+' 님이 구조되었습니다. 치료비 10 브론즈.');}}}}for(const [key,res] of clients)if(!playerFor(key)||(res.authRequest&&auth.hasCookie(res.authRequest)?!auth.identity(res.authRequest):playerFor(key).expires<=Date.now())){res.end();clients.delete(key);}broadcast();},1000).unref();
setInterval(()=>save().catch(console.error),5000).unref();
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{await save();await auth.persist();server.close();process.exit(0);});
server.listen(Number(process.env.PORT||3100),host,()=>console.log('Faction War · port '+server.address().port));
