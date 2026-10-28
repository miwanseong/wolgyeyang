export function discoverThread(s){if(s.flags.threadDiscovered)return null;s.flags.threadDiscovered=true;return '이건 뭐지…? 평범한 실 같은데, 손끝이 이상하게 저려.\n실 끝이 내 그림자 쪽으로 끌려가고 있어. 버리면 안 될 것 같은 기분이야.';}
export const RECOVERY_ITEMS=['knotThreadService','knotThread','knotThreadSecond','knotThreadPacked','knotThreadStored','knotThreadMemoryFirst','knotThreadMemoryComplete'];
export const isRecoveryItem=id=>RECOVERY_ITEMS.includes(id);
export function collectRecovery(s,o){if(!isRecoveryItem(o?.recoveryItem)||s.flags['recovered_'+o.id])return null;s.flags['recovered_'+o.id]=true;if(!s.bag.includes(o.recoveryItem))s.bag.push(o.recoveryItem);lowerLightForPickup(s);return o.recoveryItem;}
export function validBody(b){
 if(b===undefined)return true;
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['leg','arm','legs','arms','captures'].includes(k))||typeof b.leg!=='boolean'||typeof b.arm!=='boolean')return false;
 for(const k of ['legs','arms','captures'])if(b[k]!==undefined&&(!Number.isInteger(b[k])||b[k]<0||b[k]>2))return false;
 if(b.legs!==undefined&&b.leg!==(b.legs>0)||b.arms!==undefined&&b.arm!==(b.arms>0))return false;
 const total=(b.legs??+b.leg)+(b.arms??+b.arm);return total<=2&&(b.captures===undefined||b.captures>=total);
}
export function bodyState(s){const b=s.body||(s.body={leg:false,arm:false});b.legs??=+b.leg;b.arms??=+b.arm;b.captures??=Math.min(2,b.legs+b.arms);return b;}
export function loseLimb(s,random=Math.random){const b=bodyState(s);if(b.captures>=2)return{fatal:true};const available=['leg','arm'].filter(k=>b[k+'s']<2),part=available[Math.min(available.length-1,Math.floor(random()*available.length))];b[part+'s']++;b[part]=true;b.captures++;s.running=false;if(b.arms>=2)s.flashlight=false;return{fatal:false,part,count:b[part+'s']};}
export function bodyDescription(s){const b=bodyState(s);return[b.legs===2?'양다리가 없다. 두 손으로 바닥을 짚어 몸을 끈다.':b.leg?'왼쪽 다리가 없다. 벽을 짚고 숨을 고른다.':null,b.arms===2?'두 소매가 비었다. 떨어진 빛을 붙잡을 수 없다.':b.arm?'남은 손으로 손전등을 쥔다. 물건을 집을 때는 내려놓아야 한다.':null].filter(Boolean).join(' / ');}
export function injuryRow(s){const b=bodyState(s);return b.leg&&b.arm?2:b.leg?0:b.arm?1:-1;}
export function injuryDirection(d){return d<4?d:d===4||d===5?0:3;}
export function recoverLimb(s,part,item='knotThread'){const b=bodyState(s);if(!isRecoveryItem(item)||!['leg','arm'].includes(part)||!b[part])return false;const index=s.bag.indexOf(item);if(index<0)return false;s.bag.splice(index,1);b[part+'s']--;b[part]=b[part+'s']>0;s.running=false;return true;}
export function canHoldLight(s){return bodyState(s).arms<2;}
export function lowerLightForPickup(s){if(bodyState(s).arms===1&&s.flashlight){s.flashlight=false;return true;}return false;}

export function captureConsequence(s,kind,random=Math.random){return kind==='jeongwoo'?{fatal:true,kind}:{...loseLimb(s,random),kind};}
