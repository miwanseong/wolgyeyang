import {randomBytes,randomUUID,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
const scrypt=promisify(derive),digest=s=>createHash('sha256').update(s).digest('hex');
const error=(status,message)=>Object.assign(new Error(message),{status});
export async function createAuth({data,production,invite,readBody,limit,ipRates,playerFor,newPlayer,disconnect,saveWorld}){
 const file=path.join(data,'accounts.json');let db;
 try{db=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;db={version:1,accounts:[],sessions:{},audit:[]};}
 let queue=Promise.resolve(),busy=0;
 const persist=()=>{const json=JSON.stringify(db);queue=queue.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',json,{mode:0o600});await rename(file+'.tmp',file);});return queue;};
 async function passwordHash(password,salt){if(busy>=4)throw error(503,'인증 서버가 혼잡합니다.');busy++;try{return Buffer.from(await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024})).toString('hex');}finally{busy--;}}
 const validatePassword=p=>{if(typeof p!=='string'||p.length<12||p.length>128)throw error(400,'비밀번호는 12~128자로 입력하세요.');};
 const username=s=>typeof s==='string'&&/^[a-zA-Z0-9_]{3,24}$/.test(s)?s.toLowerCase():null;
 async function makeAccount(name,password,role,playerKey){const salt=randomBytes(16).toString('hex');const passwordDigest=await passwordHash(password,salt);if(db.accounts.some(a=>a.username===name))throw error(409,'사용할 수 없는 계정명입니다.');const a={id:randomUUID(),username:name,salt,passwordDigest,role,playerKey,banned:false};db.accounts.push(a);return a;}
 const adminName=process.env.ADMIN_USERNAME,adminPassword=process.env.ADMIN_PASSWORD;
 if(db.accounts.every(a=>a.role!=='admin')){if(adminName&&adminPassword){const name=username(adminName);if(!name)throw Error('Invalid ADMIN_USERNAME');validatePassword(adminPassword);const key=digest(randomUUID());await makeAccount(name,adminPassword,'admin',key);newPlayer(key,'관리자');await saveWorld();await persist();}else if(production)throw Error('Initial production setup requires ADMIN_USERNAME and ADMIN_PASSWORD');}
 const cookieToken=req=>String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('fw_account='))?.slice(11);
 function identity(req){const token=cookieToken(req);if(!token||!/^[0-9a-f]{64}$/.test(token))return null;const session=db.sessions[digest(token)];if(!session||session.expires<Date.now())return null;const account=db.accounts.find(a=>a.id===session.accountId);return account&&!account.banned?account:null;}
 const publicAccount=a=>({id:a.id,username:a.username,role:a.role,banned:a.banned});
 function audit(actor,target,action){db.audit.push({at:new Date().toISOString(),actor:actor.id,target:target.id,action});db.audit=db.audit.slice(-500);}
 function revoke(a){for(const [key,s]of Object.entries(db.sessions))if(s.accountId===a.id)delete db.sessions[key];disconnect(a.playerKey);}
 const send=(res,obj)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));};
 const setCookie=(res,value,age)=>res.setHeader('Set-Cookie','fw_account='+value+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+age+(production?'; Secure':''));
 async function handle(req,res,url){if(!url.pathname.startsWith('/api/auth/')&&!url.pathname.startsWith('/api/admin/'))return false;
 const ip=req.socket.remoteAddress;
 if(url.pathname==='/api/auth/me'&&req.method==='GET'){const a=identity(req);send(res,{account:a?publicAccount(a):null});return true;}
 if(['/api/auth/register','/api/auth/login'].includes(url.pathname)&&req.method==='POST'){
 limit(ipRates,'auth:'+ip,10,60000);const input=await readBody(req),name=username(input.username);validatePassword(input.password);if(!name)throw error(400,'계정명은 영문·숫자·밑줄 3~24자입니다.');let a;
 if(url.pathname.endsWith('/register')){if(invite&&(typeof input.invite!=='string'||!timingSafeEqual(Buffer.from(digest(invite)),Buffer.from(digest(input.invite)))))throw error(403,'초대 코드가 필요합니다.');if(db.accounts.length>=100)throw error(503,'계정 한도에 도달했습니다.');if(db.accounts.some(x=>x.username===name))throw error(409,'사용할 수 없는 계정명입니다.');const key=digest(randomUUID());a=await makeAccount(name,input.password,'player',key);newPlayer(key,name);await saveWorld();audit(a,a,'register');}
 else {a=db.accounts.find(x=>x.username===name);const candidate=await passwordHash(input.password,a?.salt||'invalid-user-salt');if(!a||!timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(a.passwordDigest,'hex'))||a.banned)throw error(401,'계정 또는 비밀번호를 확인하세요.');}
 // A fresh login revokes old sessions and active streams.
 revoke(a);const token=randomBytes(32).toString('hex');db.sessions[digest(token)]={accountId:a.id,expires:Date.now()+7*86400000};audit(a,a,'login');await persist();setCookie(res,token,604800);send(res,{account:publicAccount(a)});return true;
 }
 const a=identity(req);if(!a)throw error(401,'로그인이 필요합니다.');
 if(url.pathname==='/api/auth/logout'&&req.method==='POST'){revoke(a);audit(a,a,'logout');await persist();setCookie(res,'',0);send(res,{ok:true});return true;}
 if(url.pathname.startsWith('/api/admin/')){if(a.role!=='admin')throw error(403,'운영자 권한이 필요합니다.');
 if(url.pathname==='/api/admin/accounts'&&req.method==='GET'){send(res,{accounts:db.accounts.map(publicAccount),audit:db.audit.slice(-50)});return true;}
 if(url.pathname==='/api/admin/ban'&&req.method==='POST'){const input=await readBody(req);const target=db.accounts.find(x=>x.id===input.id);if(!target)throw error(404,'계정을 찾을 수 없습니다.');if(target.role==='admin')throw error(403,'운영자는 차단할 수 없습니다.');if(typeof input.banned!=='boolean')throw error(400,'잘못된 차단 상태');target.banned=input.banned;revoke(target);audit(a,target,input.banned?'ban':'unban');await persist();send(res,{ok:true});return true;}}
 throw error(404,'찾을 수 없습니다.');
 }
 return {handle,identity,hasCookie:req=>!!cookieToken(req),persist};
}
