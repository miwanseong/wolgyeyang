export const VERSION=1;
export const initial=()=>({version:VERSION,x:1040,y:576,bag:[],notes:[],flags:{},ending:null});
export const ITEMS={key:'관리실 열쇠',fuse:'예비 퓨즈',tape:'녹음테이프',evidence:'철거 전 입주 기록'};
export function take(s,key){if(!s.bag.includes(key))s.bag.push(key)}
export function note(s,id,text){if(!s.notes.some(n=>n.id===id))s.notes.push({id,text})}
export function restore(raw){const s=JSON.parse(raw);if(s.version!==VERSION||!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<0||s.x>2080||s.y<0||s.y>1152||!Array.isArray(s.bag)||!s.bag.every(k=>Object.hasOwn(ITEMS,k))||!Array.isArray(s.notes)||!s.notes.every(n=>typeof n.id==='string'&&typeof n.text==='string')||!s.flags||typeof s.flags!=='object'||Array.isArray(s.flags)||!Object.values(s.flags).every(v=>typeof v==='boolean')||![null,'witness','return'].includes(s.ending))throw Error('유효하지 않은 저장 데이터');return s}
export function unlock(s,code){if(code!=='0411')return 'wrong';if(!s.flags.power)return 'power';s.flags.locker=true;take(s,'tape');take(s,'evidence');return 'ok'}
export function repair(s){if(!s.bag.includes('fuse'))return false;s.flags.power=true;s.bag=s.bag.filter(k=>k!=='fuse');return true}
export function finish(s,choice){if(!s.flags.listened||!s.bag.includes('evidence'))return false;if(!['witness','return'].includes(choice))return false;s.ending=choice;return true}
