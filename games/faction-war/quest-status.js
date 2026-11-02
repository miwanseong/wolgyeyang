// Per-viewer quest state; completed quests never retain an available marker.
export function questStatus(n,p){
 if(n.id==='trainer'){if(p.profession)return null;if(!p.quest)return {mark:'!',state:'available',label:'전직 의뢰 수락 가능'};return p.kills-p.quest.startKills>=3&&(p.inv?.ore||0)>=4&&p.xp>=30?{mark:'!',state:'ready',label:'전직 의뢰 완료 가능'}:{mark:'?',state:'active',label:'전직 의뢰 진행 중'};}
 if(n.id==='archivist'){if(p.storyQuest==='done')return null;if(!p.storyQuest)return {mark:'!',state:'available',label:'변경의 첫 장 수락 가능'};return Object.keys(p.fishRecords||{}).length>=3&&Object.keys(p.insectRecords||{}).length>=2&&(p.storyHarvests||0)>=1?{mark:'!',state:'ready',label:'변경의 첫 장 완료 가능'}:{mark:'?',state:'active',label:'변경의 첫 장 진행 중'};}
 if(!n.need||p.requests?.[n.id]==='done')return null;if(!p.requests?.[n.id])return {mark:'!',state:'available',label:'의뢰 수락 가능'};return Object.entries(n.need).every(([k,v])=>(p.inv?.[k]||0)>=v)?{mark:'!',state:'ready',label:'의뢰 완료 가능'}:{mark:'?',state:'active',label:'의뢰 진행 중'};
}
