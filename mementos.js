import {lowerLightForPickup} from './body.js?v=58afa086feda';
export const MEMENTOS={
 memoryMeal:{name:'접힌 식사 약속',map:'apartment',object:'home-books-a',text:'책갈피 대신 접힌 종이. 서윤의 글씨: 「다음 쉬는 날은 언니가 고르기. 지난번엔 내가 고른 집이 너무 매웠으니까.」 뒷면에는 내가 적은 가게 이름 세 개가 지워졌다 다시 쓰여 있다.'},
 memoryOrange:{name:'102호 장보기 메모',map:'unit102',object:'102-tea-table',text:'미정의 장보기 목록 아래 「101호에 귤 봉지 돌려주기」. 봉지에 붙였던 서윤의 작은 웃는 얼굴 스티커가 종이 끝에 남아 있다.'},
 memoryStitch:{name:'삐뚤게 꿰맨 이름표',map:'basement',object:'basement-rack',text:'겨울옷 보관 봉투 안의 천 이름표. 「서윤」의 마지막 글자만 두 번 꿰맸다. 어릴 때부터 마지막 매듭이 자꾸 풀린다며 내 손에 바늘을 넘기곤 했다.'},
 memoryClock:{name:'시계 보관 쪽지',map:'relayEntry',object:'relay-reception-cabinet',text:'점검용 시계의 천 주머니 안에 접힌 보관 쪽지. 서윤의 서무 확인란 옆에 「유리 금 갔음. 수리 전엔 물 닿지 않게」. 남이 쓸 작은 물건도 그냥 넘겨두지 않았다.',requiresWatch:true},
 memoryThanks:{name:'주민의 감사 카드',map:'relayArchive',object:'relay-shelf-a',text:'민원 서류 사이의 작은 카드. 「서윤 씨, 신청서 글씨 대신 써줘서 고마워요. 덕분에 이번엔 반려되지 않았어요.」 접수 번호 옆에 서윤이 그린 작은 체크가 있다.'},
 memoryScript:{name:'지워진 방송 연습 원고',map:'relaySignal',object:'relay-booth-chair',text:'낡은 일상 안내 원고. 「분리수거는…」 다음에 「너무 딱딱해」라고 쓰고 지웠다. 서윤은 사람들 앞에서 읽을 짧은 문장도 여러 번 고쳤다. 종이 모서리에 손톱 자국이 남아 있다.'}
};
export function collectMemento(s,id){const entry=MEMENTOS[id];if(!entry||s.bag.includes(id)||entry.requiresWatch&&!s.investigation?.gear?.includes('watch'))return false;lowerLightForPickup(s);s.bag.push(id);if(!s.notes.some(n=>n.id===id))s.notes.push({id,text:entry.text});return true;}
export function collectedMementos(s){return Object.entries(MEMENTOS).filter(([id])=>s.bag.includes(id));}
