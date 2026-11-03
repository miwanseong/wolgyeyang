import {collectMemento,collectedMementos,MEMENTOS} from './mementos.js?v=faf82fb8c86d';
import {pickupBlocked} from './body.js?v=faf82fb8c86d';
export const GOALS=[
 {id:'homeMemory',chapter:1,title:'사건 전의 하루',description:'아파트에 남은 일상 세 조각을 따로 모았다.',test:s=>['memoryMeal','memoryOrange','memoryStitch'].every(id=>s.bag.includes(id))},
 {id:'backOfWall',chapter:1,title:'벽의 반대편',description:'막힌 출입구를 통과하지 않고 그 반대편의 기록을 찾았다.',secret:true,test:s=>!!s.flags.shadowRoomFinished},
 {id:'unsent',chapter:1,title:'보내지 못한 말',description:'액자 뒤에 남은 편지를 찾았다.',secret:true,test:s=>s.bag.includes('memoryLetter')},
 {id:'crossedOut',chapter:2,title:'지운 줄의 출처',description:'수정 전 수신 행과 그 출처를 확인하고 해린과 다시 이야기했다.',test:s=>!!(s.flags.relayErasure&&s.flags.conversation_haerin_erasure)},
 {id:'measured',chapter:2,title:'찍지 않고 확인한 것',description:'결선도와 고장 기록으로 점검대의 복귀 신호를 직접 확인했다.',test:s=>!!s.flags.contactVerified},
 {id:'quietRoom',chapter:2,title:'목록에 없는 방',description:'반사광 뒤에 가려진 보존실을 찾았다.',secret:true,test:s=>s.bag.includes('memoryRoomTone')},
 {id:'wholeVoice',chapter:2,title:'아무 목소리도 빼지 않고',description:'자신의 응답을 포함한 원본을 봉인하고 마지막 질문에 대답했다.',test:s=>!!(s.flags.relayClosure&&s.flags.storyAcceptedCall)},
];
export function checkGoals(s){const fresh=[];for(const g of GOALS)if(!s.flags['goal_'+g.id]&&g.test(s)){s.flags['goal_'+g.id]=true;fresh.push(g);}return fresh;}
export function secretDiscovery(s,o){
 if(o.id==='bedroom-frame'&&s.bag.includes('memoryMeal')&&!s.bag.includes('memoryLetter')){
  if(s.flashlight)return null;
  if(!s.flags.secretFrameLoose){s.flags.secretFrameLoose=true;return{line:'불을 끄니 유리 반사가 사라졌어. 사진 아래 흰 가장자리가 보여.\n액자를 조금 들어 보니 뒤판이 덜 닫혀 있어. 종이가 끼인 것 같은데…'};}
  if(pickupBlocked(s))return{line:'뒤판을 받치려면 손을 비워야 해. 손전등을 내려놓자. R.'};
  if(collectMemento(s,'memoryLetter'))return{line:'언니에게. 다음 쉬는 날에는…\n쓰다 만 편지야. 식당 이름만 적혀 있고 나머지는 비어 있어. 내가 고른다고 했는데 끝내 고르지 않았지.\n사건 때문에 남은 물건만은 아니었구나. 이것도 따로 가져가고 싶어.',sound:'paper'};
 }
 if(o.id==='relay-shelf-c'&&!s.flags.secretShelfOpen&&!s.flashlight){s.flags.secretShelfOpen=true;return{line:'반사광이 꺼지니 서가 옆 문틀의 선이 보여.\n책장이 문을 막은 게 아니라 벽과 같은 색으로 칠한 점검문이 있었어. 가느다란 손잡이를 밀자 걸쇠가 풀렸어.',sound:'drawer'};}
 return null;
}
export function discoveryEnding(s){
 if(!s.bag.includes('memoryLetter')||!s.bag.includes('memoryRoomTone'))return null;
 return['다음 쉬는 날','증거와 별도로 접어 둔 편지와 일상 녹음은 내게 돌아왔다.\n원고 끝에는 「언니가 가게를 고르면 다시 녹음」이라고 적혀 있었다. 내일의 약속을 끝내 지키지는 못했다.\n조사를 마친 날, 쓰다 만 편지의 식당에 혼자 갔다. 전화기를 탁자 위에 놓고 마지막까지 밥을 먹었다.',''];
}
export function renderDiscoveries(root,s){
 checkGoals(s);root.replaceChildren();const heading=document.createElement('h3');heading.textContent='남겨진 일상 · '+collectedMementos(s).length+'/'+Object.keys(MEMENTOS).length;root.append(heading);
 const intro=document.createElement('p');intro.textContent='사건의 증거와 따로 모아 둔 물건들. 아래 목표는 필수 진행과 무관하다. 숨은 기록의 내용은 찾은 뒤에만 남는다.';root.append(intro);
 for(const chapter of(s.flags.chapter2?[1,2]:[1])){const h=document.createElement('h4');h.textContent=chapter+'챕터 · 발견 기록';root.append(h);for(const g of GOALS.filter(g=>g.chapter===chapter)){const found=!!s.flags['goal_'+g.id],a=document.createElement('article');a.className='discovery-goal';a.dataset.completed=String(found);const title=document.createElement('strong');title.textContent=(found?'✓ ':'◇ ')+(g.secret&&!found?'발견하지 못한 기록':g.title);const p=document.createElement('p');p.textContent=g.secret&&!found?'—':g.description;a.append(title,p);root.append(a);}}
 const rewards=document.createElement('p');rewards.textContent='일상 세 조각과 여섯 조각을 모으면 매듭실을 한 타래씩 얻는다. 찾은 물건은 소지품의 수집품 칸에 보관한다. 모아 둔 일상은 사건 기록과 다른 방식으로 마지막에 남는다.';root.append(rewards);
}
