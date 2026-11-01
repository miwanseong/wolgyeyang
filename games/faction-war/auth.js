import {isIP} from 'node:net';
import {randomBytes,randomUUID,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
const scrypt=promisify(derive),digest=s=>createHash('sha256').update(s).digest('hex');
const error=(status,message)=>Object.assign(new Error(message),{status});
export async function createAuth({data,production,invite,readBody,limit,ipRates,playerFor,newPlayer,disconnect,saveWorld}){
 const file=path.join(data,'accounts.json');let db;
 try{db=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;db={version:1,accounts:[],sessions:{},audit:[]};}
 db.ipBans??=[];
 const proxyHops=Number(process.env.TRUST_PROXY_HOPS||0);if(!Number.isInteger(proxyHops)||proxyHops<0||proxyHops>3)throw Error('TRUST_PROXY_HOPS must be 0..3');
 const normalizeIp=value=>{if(typeof value!=='string')return '';const ip=value.trim().toLowerCase().replace(/^::ffff:/,'');if(ip.includes('%'))return '';return isIP(ip)===6?new URL('http://['+ip+']/').hostname.slice(1,-1):isIP(ip)===4?ip:'';};
 const clientIp=req=>{const chain=String(req.headers['x-forwarded-for']||'').split(',').map(normalizeIp);return proxyHops&&chain.length>=proxyHops&&chain[chain.length-proxyHops]||normalizeIp(req.socket.remoteAddress);};
 const ipBlocked=req=>db.ipBans.some(b=>b.ip===clientIp(req)&&(!b.until||b.until>Date.now()));
 let queue=Promise.resolve(),busy=0;
 const persist=()=>{const json=JSON.stringify(db);queue=queue.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',json,{mode:0o600});await rename(file+'.tmp',file);});return queue;};
 async function passwordHash(password,salt){if(busy>=4)throw error(503,'인증 서버가 혼잡합니다.');busy++;try{return Buffer.from(await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024})).toString('hex');}finally{busy--;}}
 const validatePassword=p=>{if(typeof p!=='string'||p.length<12||p.length>128)throw error(400,'비밀번호는 12~128자로 입력하세요.');};
 const username=s=>typeof s==='string'&&/^[a-zA-Z0-9_]{3,24}$/.test(s)?s.toLowerCase():null;
 async function makeAccount(name,password,role,playerKey){const salt=randomBytes(16).toString('hex');const passwordDigest=await passwordHash(password,salt);if(db.accounts.some(a=>a.username===name))throw error(409,'사용할 수 없는 계정명입니다.');const a={id:randomUUID(),username:name,salt,passwordDigest,role,playerKey,banned:false};db.accounts.push(a);return a;}
 const adminName=process.env.ADMIN_USERNAME,adminPassword=process.env.ADMIN_PASSWORD;
 if(db.accounts.every(a=>a.role!=='admin')){if(adminName&&adminPassword){const name=username(adminName);if(!name)throw Error('Invalid ADMIN_USERNAME');validatePassword(adminPassword);const key=digest(randomUUID());await makeAccount(name,adminPassword,'admin',key);newPlayer(key,'관리자');await saveWorld();await persist();}else if(production)throw Error('Initial production setup requires ADMIN_USERNAME and ADMIN_PASSWORD');}
 const cookieToken=req=>String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('fw_account='))?.slice(11);
 function identity(req){if(ipBlocked(req))return null;const token=cookieToken(req);if(!token||!/^[0-9a-f]{64}$/.test(token))return null;const session=db.sessions[digest(token)];if(!session||session.expires<Date.now())return null;const account=db.accounts.find(a=>a.id===session.accountId);return account&&!account.banned?account:null;}
 const publicAccount=a=>({id:a.id,username:a.username,role:a.role,banned:a.banned});
 function audit(actor,target,action,detail=''){db.audit.push({at:new Date().toISOString(),actor:actor.id,target:target.id,action,detail:String(detail).slice(0,240)});db.audit=db.audit.slice(-500);}
 function revoke(a){for(const [key,s]of Object.entries(db.sessions))if(s.accountId===a.id)delete db.sessions[key];disconnect(a.playerKey);}
 const send=(res,obj)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));};
 const setCookie=(res,value,age)=>res.setHeader('Set-Cookie','fw_account='+value+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+age+(production?'; Secure':''));
 async function handle(req,res,url){if(!url.pathname.startsWith('/api/auth/')&&!url.pathname.startsWith('/api/admin/'))return false;
 const ip=clientIp(req);if(ipBlocked(req))throw error(403,'차단된 접속 주소입니다.');
 if(url.pathname==='/api/auth/me'&&req.method==='GET'){const a=identity(req);send(res,{account:a?publicAccount(a):null});return true;}
 if(['/api/auth/register','/api/auth/login'].includes(url.pathname)&&req.method==='POST'){
 limit(ipRates,'auth:'+ip,10,60000);const input=await readBody(req),name=username(input.username);validatePassword(input.password);if(!name)throw error(400,'계정명은 영문·숫자·밑줄 3~24자입니다.');let a;
 if(url.pathname.endsWith('/register')){if(invite&&(typeof input.invite!=='string'||!timingSafeEqual(Buffer.from(digest(invite)),Buffer.from(digest(input.invite)))))throw error(403,'초대 코드가 필요합니다.');if(db.accounts.length>=100)throw error(503,'계정 한도에 도달했습니다.');if(db.accounts.some(x=>x.username===name))throw error(409,'사용할 수 없는 계정명입니다.');const key=digest(randomUUID());a=await makeAccount(name,input.password,'player',key);newPlayer(key,name);await saveWorld();audit(a,a,'register');}
 else {a=db.accounts.find(x=>x.username===name);const candidate=await passwordHash(input.password,a?.salt||'invalid-user-salt');if(!a||!timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(a.passwordDigest,'hex'))||a.banned)throw error(401,'계정 또는 비밀번호를 확인하세요.');}
 // A fresh login revokes old sessions and active streams.
 revoke(a);const token=randomBytes(32).toString('hex');a.lastIP=ip;db.sessions[digest(token)]={accountId:a.id,ip,expires:Date.now()+7*86400000};audit(a,a,'login');await persist();setCookie(res,token,604800);send(res,{account:publicAccount(a)});return true;
 }
 const a=identity(req);if(!a)throw error(401,'로그인이 필요합니다.');
 if(url.pathname==='/api/auth/logout'&&req.method==='POST'){revoke(a);audit(a,a,'logout');await persist();setCookie(res,'',0);send(res,{ok:true});return true;}
 if(url.pathname.startsWith('/api/admin/')){if(a.role!=='admin')throw error(403,'운영자 권한이 필요합니다.');
 if(url.pathname==='/api/admin/accounts'&&req.method==='GET'){send(res,{accounts:db.accounts.map(a=>({...publicAccount(a),lastIP:a.lastIP||'',playerId:playerFor(a.playerKey)?.id})),ipBans:db.ipBans.filter(b=>!b.until||b.until>Date.now()),proxyHops,audit:db.audit.slice(-100)});return true;}
 if(url.pathname==='/api/admin/kick'&&req.method==='POST'){const input=await readBody(req),target=db.accounts.find(x=>x.id===input.id);if(!target||target.role==='admin')throw error(400,'일반 계정을 선택하세요.');revoke(target);audit(a,target,'kick',input.reason||'');await persist();send(res,{ok:true});return true;}
 if(url.pathname==='/api/admin/ip-ban'&&req.method==='POST'){const input=await readBody(req),address=normalizeIp(input.ip);if(!address||typeof input.banned!=='boolean'||!Number.isInteger(input.hours)||input.hours<0||input.hours>720)throw error(400,'IP·차단 상태·기간을 확인하세요.');if(input.banned&&(address===ip||db.accounts.some(x=>x.role==='admin'&&x.lastIP===address)))throw error(400,'현재 접속 또는 운영자 접속 주소는 차단할 수 없습니다.');db.ipBans=db.ipBans.filter(b=>b.ip!==address);if(input.banned){db.ipBans.push({ip:address,until:input.hours?Date.now()+input.hours*3600000:0,reason:String(input.reason||'').slice(0,120)});for(const target of db.accounts)if(target.lastIP===address)revoke(target);for(const [key,session]of Object.entries(db.sessions))if(session.ip===address)delete db.sessions[key];}audit(a,a,input.banned?'ip-ban':'ip-unban',address+' '+String(input.reason||''));await persist();send(res,{ok:true});return true;}
 if(url.pathname==='/api/admin/ban'&&req.method==='POST'){const input=await readBody(req);const target=db.accounts.find(x=>x.id===input.id);if(!target)throw error(404,'계정을 찾을 수 없습니다.');if(target.role==='admin')throw error(403,'운영자는 차단할 수 없습니다.');if(typeof input.banned!=='boolean')throw error(400,'잘못된 차단 상태');target.banned=input.banned;revoke(target);audit(a,target,input.banned?'ban':'unban');await persist();send(res,{ok:true});return true;}}
 throw error(404,'찾을 수 없습니다.');
 }
 return {handle,identity,clientIp,ipBlocked,accounts:()=>db.accounts,record:async(actor,target,action,detail)=>{audit(actor,target||actor,action,detail);await persist();},hasCookie:req=>!!cookieToken(req),persist};
}
