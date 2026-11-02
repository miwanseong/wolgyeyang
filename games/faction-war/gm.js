import {cancelFarming} from './farming.js';
import {fishingParts,initializeFishingGear} from './fishing-gear.js';
import {toolMax} from './life.js';
import {randomUUID} from 'node:crypto';
import {items} from './content.js';
import {regions,initializePlayer} from './game.js';
import {terrainBlocked} from './layout.js';
import {makeGear,gearBases,rarities,initializeGear} from './equipment.js';
import {abilities,initializeSkills} from './skills.js';
import {cookingRecipes} from './cooking-data.js';
import {initializeCooking,syncPantry} from './cooking.js';
import {bossDefinitions} from './encounters.js';
import {cancelAttack} from './attacks.js';
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function gmAction(world,p,a,emit=()=>{}){if(!p)throw Error('대상 캐릭터가 없습니다.');initializePlayer(p);initializeGear(p);initializeSkills(p);initializeCooking(p);let message;
 switch(a.command){
 case 'grantItem':if(!Object.hasOwn(items,a.item)||!integer(a.count,1,999))throw Error('아이템과 수량 1~999를 확인하세요.');p.inv[a.item]=Math.min(999,(p.inv[a.item]||0)+a.count);syncPantry(p);message=items[a.item].name+' 지급';break;
 case 'grantTackle':initializeFishingGear(p);if(!Object.hasOwn(fishingParts,a.part))throw Error('알 수 없는 낚시 장비입니다.');if(!p.fishingTackle.owned.includes(a.part))p.fishingTackle.owned.push(a.part);p.fishingTackle.condition[a.part]=100;message=fishingParts[a.part].name+' 지급';break;
 case 'grantGear':if(!Object.hasOwn(gearBases,a.base)||!Object.hasOwn(rarities,a.rarity)||p.gear.length>=60)throw Error('장비·등급 또는 보관 한도를 확인하세요.');p.gear.push(makeGear(randomUUID(),a.base,a.rarity,p.classId));message='장비 생성';break;
 case 'heal':cancelFarming(world,p);p.hp=p.maxHp;p.stamina=p.mana=p.hunger=p.thirst=p.oxygen=100;p.wounds=0;p.bleedingUntil=p.downUntil=0;p.activity=null;message='체력·자원·부상 회복';break;
 case 'invincible':if(typeof a.enabled!=='boolean')throw Error('무적 상태를 확인하세요.');p.gmInvincible=a.enabled;if(a.enabled){p.hp=p.maxHp;p.downUntil=0;}message='무적 '+(a.enabled?'켜짐':'꺼짐');break;
 case 'teleport':{const r=Object.hasOwn(regions,a.region)?regions[a.region]:null;if(!r||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<1||a.y<2||a.x>=r.width-1||a.y>=r.height-1||terrainBlocked(a.region,a.x,a.y))throw Error('통행 가능한 좌표를 지정하세요.');cancelAttack(p);cancelFarming(world,p);p.region=a.region;p.x=a.x;p.y=a.y;p.activity=null;p.charging=null;p.fishing=null;p.cooking.job=p.cooking.eating=null;p.movingUntil=0;message='캐릭터 이동';break;}
 case 'level':if(!integer(a.level,1,50)||a.level<p.level)throw Error('현재 레벨 이상 1~50으로 설정하세요.');p.level=a.level;p.totalXp=p.xp=30*(a.level-1)**2;emit({kind:'levelup',actorId:p.id,region:p.region,x:p.x,y:p.y,targetX:p.x,targetY:p.y,level:p.level});message='레벨 설정';break;
 case 'learnSkills':if(!p.classId)throw Error('직업을 먼저 선택하세요.');for(const [id,s]of Object.entries(abilities))if(s.classId===p.classId)p.learnedSkills[id]=3;p.skill=true;message='직업 기술 최대 등급 해금';break;
 case 'unlockRecipes':for(const id of Object.keys(cookingRecipes)){if(!p.cooking.known.includes(id))p.cooking.known.push(id);if(!p.cooking.seen.includes(id))p.cooking.seen.push(id);}message='요리법 해금';break;
 case 'repair':for(const g of p.gear)g.durability=g.maxDurability;p.toolCondition={...toolMax};message='장비·도구 수리';break;
 case 'spawn':{if(world.monsters.length>=300)throw Error('몬스터 한도입니다.');if(!['wolf','skeleton','rootboar','bellwarden'].includes(a.kind))throw Error('알 수 없는 몬스터');const x=p.x+3,y=p.y;if(terrainBlocked(p.region,x,y))throw Error('주변에 생성할 공간이 없습니다.');const boss=bossDefinitions.find(b=>b.kind===a.kind),m={...(boss||{}),id:'gm-'+randomUUID(),kind:a.kind,region:p.region,x,y,homeX:x,homeY:y,boss:!!boss,maxHp:boss?.maxHp||50,hp:boss?.maxHp||50,damage:boss?.damage||8,level:boss?.level||1,phase:1,nextAttackAt:Date.now()+2000};world.monsters.push(m);message='시험용 몬스터 생성';break;}
 case 'clearNearby':world.monsters=world.monsters.filter(m=>!(m.id.startsWith?.('gm-')&&m.region===p.region&&Math.hypot(m.x-p.x,m.y-p.y)<20));message='근처 시험용 몬스터 제거';break;
 case 'time':if(!integer(a.hour,0,23)||!integer(a.season,0,3))throw Error('시간·계절을 확인하세요.');world.clock=(a.season*8)*1200+((a.hour/24-1/3+1)%1)*1200;world.clock=Math.round(world.clock);world.day=1+Math.floor(world.clock/1200);message='시간·계절 설정';break;
 default:throw Error('지원하지 않는 운영 명령');
 }return message;
}
