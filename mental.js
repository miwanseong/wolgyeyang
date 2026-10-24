import {investigationState} from './investigation.js?v=908ea1317401';
export function sanity(s){const r=investigationState(s);if(r.sanity===undefined)r.sanity=Math.max(0,100-r.stress*8);return r.sanity;}
export function strain(s,amount){if(!s.flags.chapter2)return 100;const r=investigationState(s),before=sanity(s);r.sanity=Math.max(0,before-amount);if(before>r.sanity&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('sanity-loss',{detail:{before,after:r.sanity,amount:before-r.sanity}}));return r.sanity;}
export class Hallucinations{
 constructor(){this.elapsed=0;this.map=null;}
 update(s,dt,allowed){if(this.map!==s.map){this.map=s.map;this.elapsed=0;}if(!allowed||!s.flags.chapter2)return null;const n=sanity(s);if(n>40){this.elapsed=0;return null;}this.elapsed+=dt;const interval=n<=20?15:28;if(this.elapsed<interval)return null;this.elapsed=0;return n<=20?'severe':'whisper';}
}
