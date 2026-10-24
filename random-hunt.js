import {chooseRelayHunter,hollowStage} from './hollow-art.js?v=908ea1317401';
import {bindWatcher} from './encounters.js?v=908ea1317401';
import {canMove,findPath} from './world.js?v=908ea1317401';
export class RandomHunt{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(s=null){this.state=s;this.delay=45+this.random()*45;this.rest=0;this.wasBusy=false;this.lastKind=null;}
 spare(seconds=100){this.rest=Math.max(this.rest,seconds);this.delay=110+this.random()*80;}
 update(map,s,dt,enemy,allowed=true){
  if(this.state!==s)this.reset(s);
  if(s.ending||s.bag.includes('relayExport'))return false;
  if(!allowed||s.hidden)return false;
  if(enemy.active){this.wasBusy=true;return false;}
  if(this.wasBusy){this.wasBusy=false;this.rest=Math.max(this.rest,45);}
  if(this.rest>0){this.rest=Math.max(0,this.rest-dt);return false;}
  if(!s.flags.chapter2&&!s.bag.includes('flashlight'))return false;
  this.delay-=dt;if(this.delay>0)return false;
  this.delay=110+this.random()*80;
  if(!enemy.spawn(map,s)){this.delay=5;return false;}
  const roll=this.random();enemy.kind=roll<(s.flags.power?.4:.5)?'hollow':roll<.8||!s.flags.power?'redlight':'jeongwoo';if(s.flags.chapter2)enemy.kind=chooseRelayHunter(roll,this.lastKind);if(!s.flags.chapter2&&enemy.kind===this.lastKind)enemy.kind=enemy.kind==='hollow'?'redlight':'hollow';if(enemy.kind==='redlight'&&!bindWatcher(map,s,enemy,canMove,findPath))enemy.kind='hollow';enemy.hollowStage=hollowStage(s);this.lastKind=enemy.kind;enemy.hollowTime=30+this.random()*16;enemy.grace=2.2;return true;
 }
}
