// Death retries remember the run independently of the rolled-back save slot.
const fallback=new Map();
export function ensureRun(s,fresh=false){if(fresh)s.runId=globalThis.crypto?.randomUUID?.()||'run-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);else if(typeof s.runId!=='string'||!/^[-\w]{1,80}$/.test(s.runId))s.runId='legacy';return s.runId;}
export function returnStage(count){return count<=1?1:count<=3?2:count<=5?3:4;}
const LINES=[
 ['…숨이 쉬어져. 분명, 방금 전에는… 숨이 끊겼는데…\n꿈이었나. 손이 아직 떨려.'],
 ['이 바닥, 아까도 여기서 눈을 떴어. 몸이 식어가던 감각까지 똑같아.\n아니야… 너무 무서워서 헷갈리는 거야.','또 이 소리야. 문이 울리기 전에, 이미 알고 있었어.\n처음 듣는 소리일 텐데… 왜 입에서 같은 말이 나오지?'],
 ['꿈이 아니야. 나는 아까 죽었어. 그런데 또 여기야.\n돌아온 거야… 나만 그걸 기억하는 거야.','벽의 흠집도, 내 손의 떨림도 같아. 몇 번을 확인해야 해?\n돌아온 게 맞아. 다음에는… 다음이라는 말을 왜 하고 있지.'],
 ['눈을 뜨기 전부터 이 천장이 보였어. 내 비명도 먼저 들렸고.\n그만… 나는 아직 여기 있는데. 나까지 녹음처럼 반복하지 마.','무서워해야 하는데, 내가 놀랄 순간까지 기억나.\n어느 쪽이 지금의 나야? 나를 두고 또 돌아가지 마…']
];
export function returnReaction(count){const stage=returnStage(count),lines=LINES[stage-1];return{count,stage,text:lines[(Math.max(1,count)-[0,1,2,4,6][stage])%lines.length],sanityLoss:Math.min(18,Math.max(0,count-1)*3),duration:stage===1?1400:stage===2?2000:stage===3?2700:3400,echo:stage<3?'':stage===3?'여기서 죽었어':'내 목소리까지 반복돼'};}
export function recordDeathReturn(s,storage=null){
 const key='janryu-return-memory:'+ensureRun(s);let old=fallback.get(key)||0;
 try{const value=Number(storage?.getItem(key));if(Number.isInteger(value)&&value>=0&&value<=999)old=Math.max(old,value);}catch{}
 const count=Math.min(999,old+1);fallback.set(key,count);try{storage?.setItem(key,String(count));}catch{}
 return returnReaction(count);
}
