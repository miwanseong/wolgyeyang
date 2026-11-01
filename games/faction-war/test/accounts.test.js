import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('accounts: login rotation, admin authorization, ban, unban, logout and restart',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fw-auth-'));let child;let stream;
 const env={...process.env,PORT:'3196',DATA_DIR:dir,INVITE_CODE:'account-test-invite',ADMIN_USERNAME:'operator',ADMIN_PASSWORD:'test-admin-password-123'};
 const start=async()=>{child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','inherit']});await once(child.stdout,'data');};
 const stop=async()=>{child.kill('SIGTERM');await once(child,'exit');};
 async function call(route,body,cookie){const r=await fetch('http://127.0.0.1:3196'+route,{...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})}});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const creds={username:'farmer',password:'test-player-password-123',invite:'account-test-invite'};
 try{await start();assert.equal((await call('/api/auth/register',{...creds,invite:'wrong'})).status,403);
 const reg=await call('/api/auth/register',creds);assert.equal(reg.status,200);assert(reg.cookie);const first=reg.cookie;
 assert.equal((await call('/api/admin/accounts',undefined,first)).status,403);
 const j=await call('/api/join',{},first);assert.equal(j.status,200);const id=j.body.id;
 assert.equal((await call('/api/auth/login',{...creds,password:'incorrect-password'})).status,401);
 const login=await call('/api/auth/login',creds);assert.equal(login.status,200);const second=login.cookie;assert.notEqual(first,second);assert.equal((await call('/api/action',{type:'eat'},first)).status,401);
 assert.equal((await call('/api/join',{},second)).body.id,id);
 const admin=await call('/api/auth/login',{username:'operator',password:env.ADMIN_PASSWORD});assert.equal(admin.status,200);
 const list=await call('/api/admin/accounts',undefined,admin.cookie);assert.equal(list.status,200);assert(!JSON.stringify(list.body).includes('passwordDigest'));
 stream=new AbortController();const event=await fetch('http://127.0.0.1:3196/api/events',{headers:{Cookie:second},signal:stream.signal});const reader=event.body.getReader();await reader.read();
 assert.equal((await call('/api/admin/ban',{id:reg.body.account.id,banned:true},second)).status,403);
 assert.equal((await call('/api/admin/ban',{id:reg.body.account.id,banned:true},admin.cookie)).status,200);
 let closed=false;for(let i=0;i<10;i++){if((await reader.read()).done){closed=true;break;}}assert(closed);
 assert.equal((await call('/api/action',{type:'eat'},second)).status,401);
 assert.equal((await call('/api/auth/login',creds)).status,401);
 await stop();await start();assert.equal((await call('/api/auth/login',creds)).status,401);
 const admin2=await call('/api/auth/login',{username:'operator',password:env.ADMIN_PASSWORD});
 assert.equal((await call('/api/admin/ban',{id:admin2.body.account.id,banned:true},admin2.cookie)).status,403);
 assert.equal((await call('/api/admin/ban',{id:reg.body.account.id,banned:false},admin2.cookie)).status,200);
 const back=await call('/api/auth/login',creds);assert.equal(back.status,200);assert.equal((await call('/api/join',{},back.cookie)).body.id,id);
 assert.equal((await call('/api/auth/logout',{},back.cookie)).status,200);assert.equal((await call('/api/action',{type:'eat'},back.cookie)).status,401);
 await stop();const disk=await readFile(path.join(dir,'accounts.json'),'utf8');assert(!disk.includes(creds.password));assert(!disk.includes(back.cookie.split('=')[1]));
 }finally{stream?.abort();if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
});
test('production requires accounts, emits Secure cookies and ignores role escalation',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fw-prod-'));const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3195',DATA_DIR:dir,NODE_ENV:'production',APP_ORIGIN:'https://game.example.com',INVITE_CODE:'production-test-invite',ADMIN_USERNAME:'operator',ADMIN_PASSWORD:'test-admin-password-123'},stdio:['ignore','pipe','inherit']});
 try{await once(child.stdout,'data');const post=(route,b,cookie)=>fetch('http://127.0.0.1:3195'+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://game.example.com',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(b)});
 assert.equal((await post('/api/join',{invite:'production-test-invite'})).status,401);
 const reg=await post('/api/auth/register',{username:'member',password:'test-member-password-123',invite:'production-test-invite',role:'admin'});assert.equal(reg.status,200);assert.match(reg.headers.get('set-cookie'),/; Secure/);assert.equal((await reg.json()).account.role,'player');const cookie=reg.headers.get('set-cookie').split(';')[0];
 assert.equal((await post('/api/join',{},cookie)).status,200);
 const list=await fetch('http://127.0.0.1:3195/api/admin/accounts',{headers:{Cookie:cookie}});assert.equal(list.status,403);
 }finally{child.kill('SIGTERM');await once(child,'exit');await rm(dir,{recursive:true,force:true});}
});
