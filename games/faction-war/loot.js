import {fishingParts} from './fishing-gear.js';
import {randomUUID} from 'node:crypto';
import {items} from './content.js';
import {gearBases,rarities} from './equipment.js';
import {fishName} from './fish-catalog.js';
const previous=new WeakMap();
const state=p=>({inv:{...p.inv},gear:new Set((p.gear||[]).map(g=>g.id)),fish:new Set((p.fishBag||[]).map(f=>f.id)),tackle:new Set(p.fishingTackle?.owned||[]),gold:p.gold||0});
export function captureLoot(p){if(p&&!previous.has(p))previous.set(p,state(p));return previous.get(p);}
export function recordLoot(p,before,reason='획득'){if(!p)return;const old=previous.get(p)||before;if(!old){captureLoot(p);return;}const lines=[];for(const [id,n]of Object.entries(p.inv||{})){const count=n-(old.inv[id]||0);if(count>0&&items[id])lines.push(items[id].name+' ×'+count);}for(const g of p.gear||[])if(!old.gear.has(g.id))lines.push((rarities[g.rarity]?.name||'')+' '+(gearBases[g.base]?.name||'장비'));for(const f of p.fishBag||[])if(!old.fish.has(f.id))lines.push(fishName(f)+' '+f.lengthCM+'cm');for(const id of p.fishingTackle?.owned||[])if(!old.tackle?.has(id))lines.push(fishingParts[id]?.name||'낚시 장비');if(p.gold>old.gold)lines.push((p.gold-old.gold)+' 브론즈');if(lines.length){p.lootLog??=[];p.lootLog.push({id:randomUUID(),at:Date.now(),name:reason,text:lines.join(' · ')});p.lootLog=p.lootLog.slice(-80);}previous.set(p,state(p));}
