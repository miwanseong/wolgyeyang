export const ROSTER=[['11/03 18:00','서윤','104호 · 점검 사진 정리'],['11/04 22:30','미정','102호 · 예비 열쇠 인계'],['11/04 23:00','서하','관리실 · 야간 접수'],['11/04 23:00','정우','103호 대기 · 지하 순찰']];
export const ROSTER_FOOT='104호 임시 자료실: 서윤이 점검 사진과 촬영 일지를 정리함. 출입 열쇠는 103호 관리인 숙소 열쇠함에 반납. 봉투 보관함 열쇠는 서윤의 밀랍 봉투 안.';
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
  if(this.time>1.3&&this.time<4.6&&Math.hypot(enemy.x-s.x,enemy.y-s.y)>150){const before={x:enemy.x,y:enemy.y};enemy.navigate(map,s,dt,28);this.travel+=Math.hypot(enemy.x-before.x,enemy.y-before.y);}
  if(this.time>=6){this.active=false;enemy.intro=false;enemy.grace=4;return false;}return true;
 }
 focus(enemy,s){if(this.time<1.2)return enemy;if(this.time>4.7){const f=Math.min(1,(this.time-4.7)/1.3);return{x:enemy.x+(s.x-enemy.x)*f,y:enemy.y+(s.y-enemy.y)*f};}return enemy;}
}
