// Only employees scheduled that night belong on this sheet. Resident access is recorded separately.
export const ROSTER=[['11/04 22:00–06:00','서하','관리실 · 야간 전화 접수 보조'],['11/04 20:00–08:00','미정','경비 · 출입 확인 및 순찰'],['11/04 20:00–08:00','강태수','시설 당직 · 누수 및 전기 이상 접수']];
export const ROSTER_FOOT='인계: 시설 당직 강태수는 22:50 누수 신고로 별동 이동. 경비 미정은 23:00부터 동문 순찰. 관리소장 정우는 비번·비상연락 대상. 공용실 열쇠 인수대장은 103호 비품함에 보관. 인계 서명: 강태수 / 미정.';
export function routeGate(s,action){
 if(action==='unit104')return s.bag.includes('unit104Key');
 if(action==='wax')return s.bag.includes('lighter');
 if(action==='cabinet')return s.bag.includes('archiveKey')&&!!s.flags.hiddenWaxOpen;
 if(action==='keybox')return s.bag.includes('serviceKey');
 return false;
}
export function canPreserve(s){return !!(s.flags.shutterOpen&&s.flags.listened&&s.flags.hidden104Open&&s.flags.rosterRestored&&s.flags.hiddenWaxOpen&&s.flags.hiddenBoxOpen&&['receipt','evidence','tape','inspectionPhotos','restoredRoster'].every(k=>s.bag.includes(k)));}
export class ArrivalScene{
 constructor(){this.active=false;}
 start(enemy){enemy.intro=true;this.active=true;this.time=0;this.origin={x:enemy.x,y:enemy.y};this.travel=0;}
 update(enemy,map,s,dt){
  if(!this.active)return false;this.time+=dt;enemy.age+=dt;enemy.grace=Math.max(enemy.grace,4);
  enemy.motion='crawl';enemy.mode='search';enemy.rush=0;enemy.windup=0;
  if(this.time>1.3&&this.time<4.6&&Math.hypot(enemy.x-s.x,enemy.y-s.y)>150){const before={x:enemy.x,y:enemy.y};enemy.navigate(enemy.kind==='redlight'&&enemy.arena?.grid?{...map,grid:enemy.arena.grid}:map,s,dt,28);this.travel+=Math.hypot(enemy.x-before.x,enemy.y-before.y);}
  if(this.time>=6){this.active=false;enemy.intro=false;enemy.grace=4;return false;}return true;
 }
 focus(enemy,s){if(this.time<1.2)return enemy;if(this.time>4.7){const f=Math.min(1,(this.time-4.7)/1.3);return{x:enemy.x+(s.x-enemy.x)*f,y:enemy.y+(s.y-enemy.y)*f};}return enemy;}
}

export function firstListening(s){if(s.flags.listened)return false;s.flags.listened=true;return true;}
