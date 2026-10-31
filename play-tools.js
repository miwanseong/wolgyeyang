import {bodyState,isRecoveryItem,pickupBlocked,recoverLimb} from './body.js?v=25209e3f9bf5';
export const threadCount=s=>s.bag.filter(isRecoveryItem).length;
export const itemGroup=id=>isRecoveryItem(id)||['lighter','flashlight','spareLight'].includes(id)?'usable':'quest';
export class ThreadWrap{
 constructor(){this.cancel();}
 cancel(){this.active=null;}
 start(s,item=s.bag.find(isRecoveryItem),part=bodyState(s).leg?'leg':'arm'){
  if(this.active)return '이미 실을 감고 있어.';
  if(!item||!s.bag.includes(item)||!isRecoveryItem(item))return '손에 남은 매듭실이 없어.';
  if(!bodyState(s)[part])return '지금은 실을 감을 빈 자리가 없어.';
  if(pickupBlocked(s)||s.bag.includes('flashlight')&&!s.flags.lightStowed||s.flags.temporaryLighter||s.flags.temporaryPhone)return '실을 감으려면 손을 비워야 해. R로 손전등을 내려놓자.';
  this.active={s,item,part,elapsed:0,duration:2.8};return null;
 }
 update(s,dt,interrupted=false){const a=this.active;if(!a)return null;if(a.s!==s||interrupted||pickupBlocked(s)||s.bag.includes('flashlight')&&!s.flags.lightStowed||s.flags.temporaryLighter||s.flags.temporaryPhone){this.cancel();return{cancelled:true};}a.elapsed=Math.min(a.duration,a.elapsed+dt);if(a.elapsed<a.duration)return null;this.cancel();return recoverLimb(s,a.part,a.item)?{part:a.part}: {cancelled:true};}
}
export function dialogGlyphs(text){
 const out=[];let strong=false;for(let i=0;i<text.length;){if(text.slice(i,i+2)==='[['){strong=true;i+=2;continue;}if(text.slice(i,i+2)===']]'){strong=false;i+=2;continue;}const char=String.fromCodePoint(text.codePointAt(i));out.push({char,strong});i+=char.length;}return out;
}
