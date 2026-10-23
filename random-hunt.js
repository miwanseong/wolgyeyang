export class RandomHunt{
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(s=null){this.state=s;this.delay=90+this.random()*70;this.rest=0;this.wasBusy=false;}
 spare(seconds=100){this.rest=Math.max(this.rest,seconds);this.delay=180+this.random()*120;}
 update(map,s,dt,enemy,allowed=true){
  if(this.state!==s)this.reset(s);
  if(s.ending||s.bag.includes('relayExport'))return false;
  if(!allowed||s.hidden)return false;
  if(enemy.active){this.wasBusy=true;return false;}
  if(this.wasBusy){this.wasBusy=false;this.rest=Math.max(this.rest,75);}
  if(this.rest>0){this.rest=Math.max(0,this.rest-dt);return false;}
  if(!s.flags.chapter2&&!s.bag.includes('flashlight'))return false;
  this.delay-=dt;if(this.delay>0)return false;
  this.delay=180+this.random()*120;
  if(!enemy.spawn(map,s)){this.delay=5;return false;}
  enemy.kind=this.random()<.35?'hollow':'redlight';enemy.hollowTime=30+this.random()*16;enemy.grace=2.2;return true;
 }
}
