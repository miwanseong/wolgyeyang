const KEY='janryu-achievements-v1';
const ICONS={
 homeMemory:'<path d="M13 29h38M17 30c1 13 8 19 15 19s14-6 15-19M22 18c-5 4 5 4 0 9M32 13c-5 4 5 5 0 10M42 18c-5 4 5 4 0 9M22 52h20"/>',
 backOfWall:'<path d="M10 51V14h44v37M13 25h10M41 25h10M13 37h10M41 37h10M25 51V20h14v31M32 35h2M20 55h24"/>',
 unsent:'<path d="M12 20h40v31H12zM13 22l19 15 19-15M13 49l13-13M51 49L38 36M21 13h22"/>',
 crossedOut:'<path d="M13 12h26v39H13zM25 20h26v34H25M18 23h14M18 30h14M18 37h5M32 30h12M32 37h12M32 44h12M27 52l6 5 14-14"/>',
 measured:'<path d="M13 33h12v-18h20v18h8M25 43h20M32 20v23M21 51h22"/><circle cx="13" cy="33" r="4"/><circle cx="53" cy="33" r="4"/><circle cx="32" cy="15" r="4"/>',
 quietRoom:'<path d="M11 14h30v39H11zM16 20h20M16 26h20M16 32h20M41 17l12-5v38l-12 3M47 34h2M16 40h8"/>',
 wholeVoice:'<path d="M11 28v9M17 20v25M23 13v39M29 23v19M35 17v28M41 25v12M45 48l5 5 10-14"/>',
};
export function achievementBadge(goal,unlocked=false){
 const icon=document.createElement('span');icon.className='achievement-badge';icon.dataset.unlocked=String(unlocked);icon.setAttribute('aria-hidden','true');
 const locked=goal.secret&&!unlocked,paths=locked?'<rect x="18" y="29" width="28" height="24" rx="3"/><path d="M23 29v-9a9 9 0 0 1 18 0v9M32 38v7"/>':ICONS[goal.id]||ICONS.unsent;
 icon.innerHTML='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';return icon;
}
export class AchievementLedger{
 constructor(storage=null){this.storage=storage;this.unlocked={};try{const raw=JSON.parse(storage?.getItem(KEY)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const [id,at]of Object.entries(raw))if(/^[a-zA-Z]{1,32}$/.test(id)&&Number.isFinite(at)&&at>=0)this.unlocked[id]=at;}catch{}}
 has(id){return Object.hasOwn(this.unlocked,id);}
 record(id,at=Date.now()){if(this.has(id))return false;this.unlocked[id]=at;try{this.storage?.setItem(KEY,JSON.stringify(this.unlocked));}catch{}return true;}
 importState(s,goals){for(const g of goals)if(s.flags['goal_'+g.id])this.record(g.id,0);}
}
export function browserAchievementLedger(){let storage=null;try{storage=globalThis.localStorage;}catch{}return new AchievementLedger(storage);}
export class AchievementNotifications{
 constructor(root,ledger=browserAchievementLedger()){this.root=root;this.ledger=ledger;this.queue=[];this.showing=false;root.id='achievement-notification';root.hidden=true;root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','true');}
 notify(goal){if(!this.ledger.record(goal.id))return false;this.queue.push(goal);if(!this.showing)this.next();return true;}
 next(){const goal=this.queue.shift();if(!goal){this.showing=false;this.root.hidden=true;return;}this.showing=true;const root=this.root;root.replaceChildren();root.dataset.achievement=goal.id;root.append(achievementBadge(goal,true));
  const text=document.createElement('div');text.className='achievement-notification-copy';const label=document.createElement('small');label.textContent='도전과제 달성';const title=document.createElement('strong');title.textContent=goal.title;const detail=document.createElement('span');detail.textContent=goal.chapter+'챕터 · 발견 기록';text.append(label,title,detail);root.append(text);const check=document.createElement('span');check.className='achievement-check';check.textContent='✓';check.setAttribute('aria-hidden','true');root.append(check);
  root.hidden=false;root.classList.remove('achievement-enter');void root.offsetWidth;root.classList.add('achievement-enter');setTimeout(()=>{root.classList.remove('achievement-enter');root.classList.add('achievement-leave');setTimeout(()=>{root.classList.remove('achievement-leave');this.next();},260);},5200);
 }
}
