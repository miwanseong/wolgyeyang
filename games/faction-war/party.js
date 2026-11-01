import {randomUUID} from 'node:crypto';
const actions=new Set(['partyCreate','partyInvite','partyAccept','partyDecline','partyLeave','partyKick','partyLead','partyChat']);
export function partyOf(world,id){return Object.values(world.parties||{}).find(p=>p.members.includes(id));}
export function partyAction(world,p,a,now=Date.now()){
 if(!actions.has(a.type))return null;
 world.parties??={};world.partyInvites=(world.partyInvites||[]).filter(i=>i.expires>now&&world.parties[i.partyId]);
 const group=partyOf(world,p.id),people=Object.values(world.players),target=people.find(q=>q.id===a.targetId);
 const leader=()=>{if(!group||group.leaderId!==p.id)throw Error('파티장만 사용할 수 있습니다.');};
 if(a.type==='partyCreate'){if(group)throw Error('이미 파티에 속해 있습니다.');const id=randomUUID();world.parties[id]={id,leaderId:p.id,members:[p.id],chat:[]};return '4인 모험 파티를 만들었습니다.';}
 if(a.type==='partyInvite'){leader();if(!target||target.id===p.id)throw Error('초대할 모험가를 선택하세요.');if(group.members.length>=4||partyOf(world,target.id))throw Error('파티가 가득 찼거나 상대가 이미 파티에 있습니다.');if(p.region!==target.region||Math.hypot(p.x-target.x,p.y-target.y)>12)throw Error('가까이에 있는 모험가만 초대할 수 있습니다.');if(world.partyInvites.some(i=>i.partyId===group.id&&i.targetId===target.id))throw Error('이미 초대를 보냈습니다.');if(world.partyInvites.filter(i=>i.targetId===target.id).length>=4)throw Error('상대의 초대함이 가득 찼습니다.');world.partyInvites.push({id:randomUUID(),partyId:group.id,targetId:target.id,expires:now+60000});return '60초 동안 유효한 초대를 보냈습니다.';}
 if(['partyAccept','partyDecline'].includes(a.type)){const i=world.partyInvites.find(i=>i.id===a.inviteId&&i.targetId===p.id);if(!i)throw Error('초대가 만료되었거나 본인의 초대가 아닙니다.');const g=world.parties[i.partyId];if(a.type==='partyAccept'){if(group||g.members.length>=4)throw Error('이미 파티에 속했거나 파티가 가득 찼습니다.');g.members.push(p.id);world.partyInvites=world.partyInvites.filter(i=>i.targetId!==p.id);}else world.partyInvites=world.partyInvites.filter(j=>j.id!==i.id);return a.type==='partyAccept'?'파티에 합류했습니다.':'초대를 거절했습니다.';}
 if(a.type==='partyChat'){if(!group)throw Error('파티에 먼저 합류하세요.');const text=typeof a.text==='string'?a.text.trim():'';if(!text||text.length>100)throw Error('파티 대화는 1~100자입니다.');if(now-(p.lastPartyChat||0)<1000)throw Error('대화를 잠시 기다려 주세요.');p.lastPartyChat=now;group.chat.push({id:randomUUID(),name:p.name,text,at:now});group.chat=group.chat.slice(-40);return '파티에 메시지를 보냈습니다.';}
 if(a.type==='partyLead'){leader();if(!group.members.includes(a.targetId)||a.targetId===p.id)throw Error('다른 파티원을 선택하세요.');group.leaderId=a.targetId;world.partyInvites=world.partyInvites.filter(i=>i.partyId!==group.id);return '파티장을 위임했습니다.';}
 if(a.type==='partyKick'){leader();if(!group.members.includes(a.targetId)||a.targetId===p.id)throw Error('다른 파티원을 선택하세요.');group.members=group.members.filter(id=>id!==a.targetId);return '파티원과 헤어졌습니다.';}
 if(a.type==='partyLeave'){if(!group)throw Error('참여 중인 파티가 없습니다.');group.members=group.members.filter(id=>id!==p.id);if(!group.members.length){delete world.parties[group.id];world.partyInvites=world.partyInvites.filter(i=>i.partyId!==group.id);}else if(group.leaderId===p.id){group.leaderId=group.members[0];world.partyInvites=world.partyInvites.filter(i=>i.partyId!==group.id);}return '파티를 떠났습니다.';}
}
export function partyView(state,viewer,now=Date.now()){
 const group=partyOf(state,viewer.id),find=id=>state.players.find(p=>p.id===id);
 return {group:group?{id:group.id,leaderId:group.leaderId,members:group.members.map(id=>{const p=find(id);return p?{id:p.id,name:p.name,classId:p.classId,level:p.level,hp:p.hp,maxHp:p.maxHp,region:p.region,online:!!p.online}:null;}).filter(Boolean),chat:group.chat||[]}:null,invites:(state.partyInvites||[]).filter(i=>i.targetId===viewer.id&&i.expires>now&&state.parties?.[i.partyId]).map(i=>({id:i.id,leaderName:find(state.parties[i.partyId].leaderId)?.name||'모험가',expires:i.expires}))};
}
