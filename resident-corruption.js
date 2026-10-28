export const CORRUPT_HEADS=[[186,10,304,332],[598,10,324,332],[1047,10,307,335],[196,355,266,335],[627,355,276,335],[1080,355,262,340],[201,697,251,314],[634,696,261,315],[1087,695,247,316]];
import {distortionStage} from './distortion.js?v=58afa086feda';
export function npcCorruption(s){
 if(!s.flags.chapter2||!s.flags.npcScreamHeard)return 0;
 const elapsed=(s.relayExposure||0)-(s.npcScreamAt||0);
 return elapsed<2?0:Math.min(distortionStage(s),1+Math.floor(elapsed/180));
}
export function startNpcScream(s,map,people,enemy,allowed=true){
 if(!allowed||s.hidden||!s.flags.chapter2||s.flags.npcScreamHeard||distortionStage(s)<1||enemy?.active)return false;
 if(!people.some(n=>n.npc&&!n.ambient&&Math.hypot(n.x-s.x,n.y-s.y)<360))return false;
 s.flags.npcScreamHeard=true;s.npcScreamAt=s.relayExposure||0;return true;
}
export const FEAR_LINES={haerin:'방금 비명… 저 말고도 들었죠?',mijeong:'거기서 떨어져! 이쪽으로 오지 마.',dohyun:'멈추세요. 저쪽에 뭔가 있습니다.'};
export function corruptionReply(s,n){
 const stage=npcCorruption(s);
 const lines={haerin:['','유리에는 제 얼굴이… 조금 늦게 따라와요. 방금 비명도 들으셨죠?','안경은 그대로인데 눈이 자꾸 옆으로… 제 얼굴 좀 보지 마세요.','말은 할 수 있어요. 아직… 입이 제 말을 따라오지 않아요. 기록은 제 얼굴보다 정확해요.'],mijeong:['','여자 비명이 났어. 사람들은 못 들은 척하고… 너도 들었지?','내 입가가 왜 이래… 웃는 게 아니야. 웃으려는 게 아니라고.','서하야. 내 목소리가 이상해져도… 수첩의 글씨는 고치지 마. 내가 적은 걸 가져가.'],dohyun:['','비명 직전에 전등이 꺼졌습니다. 차단기 상태는 그대로인데… 설명이 안 됩니다.','입술이 말보다 늦게 움직입니다. 접점도 몸도… 눈앞의 표시를 믿을 수 없어요.','제 얼굴 말고… 운전 기록을 보세요. 손가락은 아직 그 줄을 가리킬 수 있습니다.']};
 return lines[n.id]?.[stage]||'';
}
// Pixel head overlays replace only the head. Feet and navigation remain unchanged.
export function drawCorruptHead(c,image,n,stage,t,reduced=false){
 if(!stage||n.ambient||!image?.naturalWidth||n.direction===3&&stage<3)return;
 const pose=CORRUPT_HEADS[n.column*3+stage-1],height=stage===3?28:stage===2?23:20,width=height*pose[2]/pose[3];
 c.save();c.translate(n.x,n.y-43);if(n.direction===1)c.scale(-1,1);
 if(!reduced&&stage>=2)c.rotate(Math.sin(t*.0011+n.column)*.05*stage);
 c.drawImage(image,...pose,-width/2,-height*.72,width,height);
 c.restore();
}
export function drawNpcReaction(c,n){
 if(!n.panic||!n.reactionLine||n.ambient)return;
 c.save();c.font='10px sans-serif';const w=c.measureText(n.reactionLine).width+12;c.fillStyle='#101015df';c.fillRect(n.x-w/2,n.y-86,w,18);c.fillStyle='#ddd2d2';c.fillText(n.reactionLine,n.x-w/2+6,n.y-73);c.restore();
}

const SEO_NOTICE={
 haerin:['','해린 씨도 들었어요? 그런데… 눈이, 제 쪽을 보는 게 조금 늦었어.','해린 씨, 움직이지 마세요. 안경 밑으로 얼굴이… 번지고 있어요.','목소리는 해린 씨인데… 저 얼굴은 뭐야. 가까이 가면 안 될 것 같아.'],
 mijeong:['','미정 씨도 놀랐어. 나만 들은 소리가 아니야. 그런데 저 표정이…','미정 씨… 웃고 계신 게 아니죠? 입가가 자꾸 다른 쪽으로 밀려요.','미정 씨 목소리가 저 안에서 나와. 알아보겠는데… 얼굴을 볼 수가 없어.'],
 dohyun:['','도현 씨 손도 떨리고 있어. 저 사람도 저 소리를 들었구나.','도현 씨, 얼굴이… 말할 때마다 입이 다른 곳으로 움직여요. 괜찮으세요?','저건 도현 씨야. 분명 도현 씨인데… 몸이 굳어 버렸어. 뒤로 물러나야 하는데.']
};
export function noticeNpc(s,n){
 const stage=npcCorruption(s),key='seo_notice_'+n.id+'_'+stage;
 if(!stage||s.flags[key]||!SEO_NOTICE[n.id])return null;
 s.flags[key]=true;return SEO_NOTICE[n.id][stage];
}
export function protagonistReaction(s,people,allowed=true){
 if(!allowed||!s.flags.chapter2||s.ending||s.hidden)return null;
 const nearby=people.filter(n=>n.npc&&!n.ambient&&Math.hypot(n.x-s.x,n.y-s.y)<360);
 if(!nearby.length)return null;
 if(s.flags.npcScreamHeard&&!s.flags.seoScreamReaction){
  s.flags.seoScreamReaction=true;
  if((s.relayExposure||0)-(s.npcScreamAt||0)<5)return{kind:'scream',target:nearby[0],line:'비명…? 방금 사람 비명이었어. 다들 같은 쪽을 보고 있어.\n내가 잘못 들은 게 아니야. 숨부터… 천천히.'};
 }
 const stage=npcCorruption(s);
 if(!stage||s.flags['seoNpcStage'+stage])return null;
 const target=nearby.find(n=>Math.hypot(n.x-s.x,n.y-s.y)<230&&!s.flags['seo_notice_'+n.id+'_'+stage]&&Math.cos(Math.atan2(n.y-s.y,n.x-s.x)-(s.facing||0))>0);
 if(!target)return null;
 for(let i=1;i<=stage;i++)s.flags['seoNpcStage'+i]=true;
 return{kind:'mutation',target,line:noticeNpc(s,target)||SEO_NOTICE[target.id]?.[stage]};
}
