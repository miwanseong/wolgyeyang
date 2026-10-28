// These are different manifestations, not five costumes for the dead sister.
export const HAUNT_REASONS={
 jeongwoo:{title:'정우 · 되풀이되는 봉쇄',anchor:'23:47 잠금 유지와 남은 증거의 은폐',text:'정우는 빗장을 유지한 뒤,2024년 그 흔적을 없애다 감전사했다. 남겨진 조작 이력과 자기 목소리에 묶여 봉쇄와 침묵 강요를 되풀이한다. 서윤의 다른 모습이 아니다.'},
 hollow:{title:'확인자 · 비어 있는 목격',anchor:'실제 개방 확인 없이 완료된 확인란',text:'문 열림 접점이 비어 있는데도 완료라고 적힌 칸을 읽자 눈들이 나타났다. 누군가의 영혼이나 서윤의 변신이 아니라,보지 않은 일을 보았다고 남긴 기록에서 생긴 괴이다. 기록을 다시 열수록 감춰진 빈 확인들이 더 드러난다.'},
 redlight:{title:'대기자 · 끝나지 않는 정지 지시',anchor:'움직이지 말고 기다리라는 현장 지시',text:'대기 지시가 끝나지 않은 자리에서 멈춤과 이동만 반복한다. 아파트에 남은 현장 지시의 형체라 층간 계단 밖까지 따라오지 않는다. 누가 새로 죽었다는 뜻도,서윤이 아이 놀이를 한다는 뜻도 아니다.'},
 listener:{title:'청취자 · 닫히지 않은 회선',anchor:'취소 뒤 남겨진 통화와 청취 누락',text:'종료됐다고 적힌 회선에서 원본을 재생하면 들을 것을 찾는 형체가 생긴다. 얼굴 대신 귀가 두드러지고 발소리에 반응한다. 실제 통화가 끝난 것과 처리 완료가 어긋나 남은 괴이다.'},
 usher:{title:'인계자 · 잘못된 통과 지시',anchor:'출입 명령의 수신과 실제 개방의 혼동',text:'유지 회신이나 비상 회선을 다시 열면 열쇠 소리를 내는 형체가 모습을 드러낸다. 문을 여는 사람처럼 보이지만 살아 있는 직원은 아니다. 완료 표시를 따라가게 하는 잔류 지시라 확인용 빛에 반응한다.'}
};
export function hauntEligible(s,kind){
 const f=s.flags,has=id=>s.bag.includes(id);
 if(f.chapter2)return kind==='hollow'?has('flashlight'):kind==='listener'?!!(f.relayCancel||f.relayErasure):kind==='usher'?!!(f.relayOverride||f.relayPower):false;
 return kind==='hollow'?has('flashlight')||!!(f.desk||f.power||has('receipt')):kind==='redlight'?!!f.power:kind==='jeongwoo'?!!f.listened:false;
}
export function noteManifestation(s,kind){const r=HAUNT_REASONS[kind];if(!r)return;if(!s.notes.some(n=>n.id==='manifestation_'+kind))s.notes.push({id:'manifestation_'+kind,text:r.title+'\n남아 있는 흔적: '+r.anchor+'\n'+(s.flags.familyTruthKnown?r.text:'언제 나타날지 알 수 없다. 남은 기록과 관련이 있는지, 끝나지 않은 명령이 있는지 더 확인해야 한다.')});}
export function learnFamilyBinding(s){
 if(!s.flags.relayLastVoice)return false;s.flags.familyTruthKnown=true;for(const [kind,r]of Object.entries(HAUNT_REASONS)){const n=s.notes.find(n=>n.id==='manifestation_'+kind);if(n)n.text=r.title+'\n원본과 목격을 대조한 서하의 정리: '+r.text;}
 if(!s.notes.some(n=>n.id==='seoyun-unanswered'))s.notes.push({id:'seoyun-unanswered',text:'서윤의 마지막 요청은 「문 앞에 와 줘」였다. 문은 열리지 않았지만 수신자인 내가 현장 확인과 처리 완료를 남기고 통화를 끊었다. 죽음 자체가 아니라,받은 사람이 끝났다고 덮은 채 답하지 않은 구조 요청에 서윤의 목소리와 형체가 묶였다. 피난문·통화 원본·내 확인 서명이 그 연결점이다. 그래서 원본을 보관한 중계소와 수신자인 나에게도 나타난다. 서윤은 봉쇄를 반복하는 정우와 다르다. 통화를 끝까지 듣고,누락한 내 응답까지 남기고,그 말이 틀렸다고 내가 직접 인정해야 마지막 요청이 더 이상 혼자 반복되지 않는다.'});return true;
}
export function familyEnding(s,id){if(!s.flags.familyTruthKnown)return null;if(!s.flags.relayRedacted&&['signal','fragment'].includes(id))return['처음 끝난 통화','「문은 열리지 않았어. 네 말을 듣고도 내가 끊었어.」\n진술을 마친 뒤,꺼진 수화기에서 처음으로 통화 종료음이 났다. 반사된 서윤은 문을 두드리지 않았다.\n「응. 이번에는 들었네.」 손잡이를 잡았던 손이 천천히 놓였다.',''];return null;}
