import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
test('two clients share authoritative world, farming economy and persistence',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fw-test-'));let child;const streams=[];
 const start=async()=>{child=spawn(process.execPath,['server.js'],{env:{...process.env,DATA_DIR:dir,PORT:'3199'},stdio:['ignore','pipe','inherit']});await once(child.stdout,'data');};
 const stop=async()=>{child.kill('SIGTERM');await once(child,'exit');};
 const post=async(url,body,token)=>{const r=await fetch('http://127.0.0.1:3199'+url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(token||body?.token)},body:JSON.stringify(body)});const result=await r.json();const cookie=r.headers.get('set-cookie');if(cookie)result.token=cookie.match(/fw_session=([^;]+)/)[1];return {status:r.status,body:result};};
 const watch=async token=>{const c=new AbortController();streams.push(c);const r=await fetch('http://127.0.0.1:3199/api/events?token='+token,{signal:c.signal,headers:{Authorization:'Bearer '+token}});const reader=r.body.getReader();let buffer='';return async()=>{while(true){const pos=buffer.indexOf('\n\n');if(pos>=0){const line=buffer.slice(0,pos);buffer=buffer.slice(pos+2);return JSON.parse(line.slice(6));}const {value,done}=await reader.read();if(done)throw Error('stream closed');buffer+=new TextDecoder().decode(value);}};};
 try{await start();const a=(await post('/api/join',{name:'농부'})).body,b=(await post('/api/join',{name:'기사'})).body;const sa=await watch(a.token),sb=await watch(b.token);let state=await sa();assert.equal(state.players.length,2);assert(!JSON.stringify(state).includes(a.token));assert.equal((await post('/api/action',{type:'move',dx:999,dy:0},a.token)).status,400);assert.equal((await post('/api/action',{type:'forge'},a.token)).status,400);
 const move=async(dx,dy,n)=>{for(let i=0;i<n;i++){const r=await post('/api/action',{type:'move',dx,dy},a.token);assert.equal(r.status,200);await new Promise(r=>setTimeout(r,100));}};
 assert.equal((await post('/api/action',{type:'equipHand',tool:'hoe'},a.token)).status,200);await move(-1,0,2);await move(0,1,4);assert.equal((await post('/api/action',{type:'farm'},a.token)).status,200);
 do{state=await sb();}while(!state.plots.some(p=>p.planted));assert.equal(state.players.find(p=>p.id===a.id).inv,undefined);let ownState;do{ownState=await sa();}while(!ownState.plots.some(p=>p.planted));assert.equal(ownState.players.find(p=>p.id===a.id).inv.seed,5);
 await new Promise(r=>setTimeout(r,30100));assert.equal((await post('/api/action',{type:'farm'},a.token)).status,200);
 await move(0,-1,8);await move(1,0,12);assert.equal((await post('/api/action',{type:'cook'},a.token)).status,200);await move(-1,0,14);assert.equal((await post('/api/action',{type:'sell'},a.token)).status,200);
 for(const c of streams)c.abort();await stop();const saved=JSON.parse(await readFile(path.join(dir,'world.json'),'utf8'));const key=createHash('sha256').update(a.token).digest('hex');assert.equal(saved.players[key].inv.wheat,1);assert.equal(saved.players[key].gold,125);
 await start();const restored=(await post('/api/join',{token:a.token})).body;assert.equal(restored.id,a.id);await stop();
 }finally{for(const c of streams)c.abort();if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
});

test('combat awards server-owned loot and rejects unlearned magic',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fw-combat-'));
 const fixtureToken='00000000-0000-4000-8000-000000000002';const fixtureKey=createHash('sha256').update(fixtureToken).digest('hex');await writeFile(path.join(dir,'world.json'),JSON.stringify({version:1,layoutVersion:2,expandedVersion:1,regionsVersion:1,day:1,clock:0,players:{[fixtureKey]:{id:'combat',name:'검사',region:'forest',x:4,y:24,hp:100,maxHp:100,gold:80,xp:0,weapon:0,skill:false,expires:Date.now()+60000,inv:{seed:6,wheat:0,bread:2,ore:0}}},plots:[],monsters:[{id:0,region:'forest',kind:'wolf',x:5.4,y:24,hp:50}],log:[]}));
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,DATA_DIR:dir,PORT:'3198'},stdio:['ignore','pipe','inherit']});
 try{await once(child.stdout,'data');
 const post=async(url,body,token)=>{const r=await fetch('http://127.0.0.1:3198'+url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(token||body?.token)},body:JSON.stringify(body)});const result=await r.json();const cookie=r.headers.get('set-cookie');if(cookie)result.token=cookie.match(/fw_session=([^;]+)/)[1];return {status:r.status,body:result};};
 const p={...(await post('/api/join',{token:fixtureToken})).body,token:fixtureToken};
 const act=body=>post('/api/action',body,p.token);
 assert.equal((await act({type:'spell'})).status,400);

 for(let i=0;i<5;i++){assert.equal((await act({type:'attack'})).status,200);await new Promise(r=>setTimeout(r,520));}
 child.kill('SIGTERM');await once(child,'exit');const w=JSON.parse(await readFile(path.join(dir,'world.json'),'utf8'));assert.equal(w.players[createHash('sha256').update(p.token).digest('hex')].inv.ore,2);assert.equal(w.players[createHash('sha256').update(p.token).digest('hex')].xp,10);assert.equal(w.monsters[0].hp,0);
 }finally{if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}await rm(dir,{recursive:true,force:true});}
});
