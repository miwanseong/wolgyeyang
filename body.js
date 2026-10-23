export function validBody(body){return body===undefined||!!body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).every(k=>['leg','arm'].includes(k))&&typeof body.leg==='boolean'&&typeof body.arm==='boolean';}
export function bodyState(s){return s.body||(s.body={leg:false,arm:false});}
export function loseLimb(s,random=Math.random){const b=bodyState(s),available=['leg','arm'].filter(k=>!b[k]);if(!available.length)return{fatal:true};const part=available[Math.min(available.length-1,Math.floor(random()*available.length))];b[part]=true;s.running=false;if(part==='arm')s.flashlight=false;return{fatal:false,part};}
export function bodyDescription(s){const b=bodyState(s);return[b.leg?'왼쪽 다리 결손 · 달리기 불가':null,b.arm?'왼팔 결손 · 손전등 사용 불가':null].filter(Boolean).join(' / ');}
export function injuryRow(s){const b=bodyState(s);return b.leg&&b.arm?2:b.leg?0:b.arm?1:-1;}
export function injuryDirection(direction){return direction<4?direction:direction===4||direction===5?0:3;}
