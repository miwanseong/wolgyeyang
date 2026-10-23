import {investigationState} from './investigation.js?v=eaf575030a38';
export function sanity(s){const r=investigationState(s);if(r.sanity===undefined)r.sanity=Math.max(0,100-r.stress*8);return r.sanity;}
export function strain(s,amount){if(!s.flags.chapter2)return 100;const r=investigationState(s);r.sanity=Math.max(0,sanity(s)-amount);return r.sanity;}
export class Hallucinations{
 constructor(){this.elapsed=0;this.map=null;}
 update(s,dt,allowed){if(this.map!==s.map){this.map=s.map;this.elapsed=0;}if(!allowed||!s.flags.chapter2)return null;const n=sanity(s);if(n>40){this.elapsed=0;return null;}this.elapsed+=dt;const interval=n<=20?15:28;if(this.elapsed<interval)return null;this.elapsed=0;return n<=20?'severe':'whisper';}
}
