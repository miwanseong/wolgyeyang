import {validIntent,stepMotion,facing} from './motion.js';
import {regions} from './game.js';
const states=new WeakMap();
export function movementState(p){const s=states.get(p);return s?{seq:s.seq,dx:s.dx,dy:s.dy,run:s.run,acceptedAt:s.acceptedAt,simAt:s.simAt,active:s.until>Date.now()}:null;}
function advance(p,s,now){const dt=Math.max(0,Math.min(.15,(Math.min(now,s.until)-s.simAt)/1000));s.simAt=now;if(!dt||!s.dx&&!s.dy)return;if(p.region!==s.region||p.hp<=0||p.recoveryUntil>now)return;const next=stepMotion(p,s,dt,regions[p.region]);p.x=next.x;p.y=next.y;p.running=next.running;if(next.running)p.stamina=Math.max(0,p.stamina-dt*18);p.faceDirection=facing(s.dx,s.dy,p.faceDirection);if(s.dx)p.facing=s.dx<0?-1:1;p.movingUntil=now+170;}
export function acceptMovement(p,a,now=Date.now()){const input=validIntent(a),old=states.get(p);if(old&&input.seq<=old.seq)throw Error('오래된 이동 입력입니다.');if(old)advance(p,old,now);const s={...input,acceptedAt:now,simAt:now,until:now+320,region:p.region};states.set(p,s);return !!(input.dx||input.dy);}
export function tickMovement(world,active,now=Date.now()){for(const p of Object.values(world.players)){const s=states.get(p);if(!s)continue;if(!active.has(p.id)||p.region!==s.region){states.delete(p);p.movingUntil=0;continue;}advance(p,s,now);}}
export function legacyMovementAllowed(p,now=Date.now()){const s=states.get(p);return !s||(!s.dx&&!s.dy||now>s.until+150);}
