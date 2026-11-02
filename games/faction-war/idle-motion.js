export const playerIdleRows=[0,340,646,943,1234];
export const npcIdleRows=[0,221,444,665,889,1111,1334,1555,1774];
const seed=value=>[...String(value||'')].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0)%5000;
export function isIdle(p,now=Date.now()){return !(p.movingUntil>now||p.dodgeUntil>now||p.hurtUntil>now||p.attackMotion?.endsAt>now||p.downUntil>now||p.showcase?.until>now||p.poseUntil>now||p.activity||p.charging||p.fishingVisual);}
export function playerIdleFrame(p,now=Date.now()){const t=(now+seed(p.id))%5400;return t<2000?0:t<2600?1:t<3200?2:t<4600?0:t<4720?3:0;}
export function npcIdleFrame(index,identity='',now=Date.now(),talking=false){if(talking)return 0;const period=[6500,3000,4200,7500,6200,5200,5800,6400][index]||6000,t=(now+seed(identity))/period%1;return t<.38?0:t<.54?1:t<.74?2:t<.9?3:0;}
export function idleBreath(p,now=Date.now()){return 1+Math.sin((now+seed(p.id))*.0018)*.008;}
