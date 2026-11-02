// Initial test roster; regional variants share a species silhouette, not a new species count.
export const mobTypes={
 wolf:{name:'숲 늑대',speed:2.6,range:1.8,windup:650,cooldown:1200,behavior:'pack',level:1,hp:50,damage:8},
 skeleton:{name:'녹슨 보초',speed:1.2,range:2,windup:850,cooldown:1700,behavior:'guard',level:3,hp:75,damage:11},
 boar:{name:'뿔뿌리 멧돼지',speed:1.6,range:5,windup:1000,cooldown:2400,behavior:'charge',level:3,hp:95,damage:13},
 slime:{name:'이끼 슬라임',speed:.9,range:1.5,windup:850,cooldown:1700,behavior:'melee',level:1,hp:38,damage:6},
 wisp:{name:'잔불 도깨비불',speed:1.5,range:7,windup:1100,cooldown:2200,behavior:'ranged',level:4,hp:55,damage:12},
 spider:{name:'자색 독거미',speed:1.8,range:5,windup:900,cooldown:2000,behavior:'ranged',level:3,hp:55,damage:9},
 goblin:{name:'누더기 고블린',speed:2.2,range:1.6,windup:550,cooldown:1050,behavior:'skirmish',level:2,hp:52,damage:9},
 bandit:{name:'길목 약탈 궁수',speed:2,range:8,windup:1200,cooldown:2000,behavior:'ranged',level:4,hp:70,damage:14},
 crab:{name:'산호등 집게',speed:1.2,range:1.8,windup:800,cooldown:1500,behavior:'guard',level:3,hp:90,damage:12}
};
export const enemyVisual=kind=>{const row=({slime:0,wisp:1,spider:2,goblin:3,bandit:4,crab:5})[kind];return row===undefined?{atlas:'base',row:({wolf:0,skeleton:1,boar:2,rootboar:2,bellwarden:3})[kind]??0}:{atlas:'variety',row};};
export const enemyVarietyRows=[0,178,351,495,683,873,1086];
