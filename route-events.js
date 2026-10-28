import {residentOutcome} from './npc-threat.js?v=35d4de009dfc';
import {familyEnding} from './haunt-causality.js?v=35d4de009dfc';
import {stormEndingBeat} from './story-flow.js?v=35d4de009dfc';
import {lowerLightForPickup} from './body.js?v=35d4de009dfc';
export const TRAP_DOORS=['relay-quiet-inner-door','relay-booth-door'];
export function chooseRecordRoute(s,route){
 if(!s.bag.includes('relayCopy')||s.bag.includes('relayExport'))return false;
 if(route==='A'){s.flags.routeA=true;s.flags.routeB=false;s.bag=s.bag.filter(k=>k!=='editPass');return true;}
 if(route==='B'&&!s.flags.routeA){s.flags.routeB=true;if(!s.bag.includes('editPass')){lowerLightForPickup(s);s.bag.push('editPass');}return true;}return false;
}
export function beginLockEvent(s){
 if(s.flags.relayTrapSeen||s.map!=='relaySignal'||s.y>19*32)return false;
 s.flags.relayTrapSeen=true;s.flags.relayTrapActive=true;s.relayTrapElapsed=0;for(const id of TRAP_DOORS)s.flags['open_'+id]=false;return true;
}
export function tickLockEvent(s,dt,allowed){
 if(!s.flags.relayTrapActive||!allowed)return null;
 if(s.map!=='relaySignal'){releaseLock(s,true);return null;}
 const before=s.relayTrapElapsed||0;s.relayTrapElapsed=Math.min(60,before+dt);
 for(const mark of [1,3,5])if(before<mark&&s.relayTrapElapsed>=mark)return 'knock';return null;
}
export function releaseLock(s,force=false){if(!s.flags.relayTrapActive||!force&&(s.relayTrapElapsed||0)<6)return false;s.flags.relayTrapActive=false;for(const id of TRAP_DOORS)s.flags['open_'+id]=true;return true;}
function baseRouteFilm(s,id,film){
 if(s.flags.routeB&&s.flags.relayRedacted&&id==='silence')return{...film,label:'B루트 · 비어 있는 통화',beats:[['선택한 부분만','정우가 잠금을 유지한 기록만 복사했다. 빠진 통화는 원본 데크에 남겨 두었다.',''],['돌아보지 않은 문','나는 내가 직접 잠그지 않았다는 줄만 펼쳐 보였다. 그 뒤에 온 전화를 확인했느냐는 질문에는 대답하지 못했다.',''],['비어 있는 통화','버스 창에 내 입이 움직였다. 「제가 확인했습니다.」 사본에는 없던 목소리였다.','']]};
 if(s.flags.routeA&&['signal','fragment'].includes(id))return{...film,label:id==='signal'?'A루트 · 끝까지 들은 사람':'A루트 · 복원본의 증언',beats:[...film.beats.slice(0,-1),['봉인을 넘기며','원본을 봉인한 뒤에는 내 목소리만 골라 뺄 수 없었다. 끊었던41초도, 확인하지 않았던 문도 함께 인계했다.','']]};
 return film;
}

export function routeFilm(s,id,film){let result=baseRouteFilm(s,id,film);const beat=stormEndingBeat(s);if(beat&&['signal','fragment','silence'].includes(id))result={...result,beats:[...result.beats.slice(0,-1),beat,...result.beats.slice(-1)]};const rescued=residentOutcome(s);if(rescued&&['signal','fragment','silence'].includes(id))result={...result,beats:[...result.beats,rescued]};const family=familyEnding(s,id);return family?{...result,beats:[...result.beats,family]}:result;}
