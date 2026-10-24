export const PUZZLE_FLAGS={slide:'relaySlide',logic:'relayLogic',pipes:'relayPipes',sync:'relaySync'};
export function reconcilePuzzles(s){if(s.puzzles?.slide&&slideSolved(s.puzzles.slide))s.flags.relaySlide=true;if(s.puzzles?.pipes&&pipesSolved(s.puzzles.pipes))s.flags.relayPipes=true;if(s.puzzles?.sync&&syncSolved(s.puzzles.sync))s.flags.relaySync=true;}
export function syncSolved(p){return p?.offset===3&&p?.inverted===true;}
export function syncWave(index){return [6,12,19,26].reduce((a,v,i)=>a+(i%2?-.7:1)*Math.exp(-Math.pow((index-v)/.85,2)),0);}
export const SLIDE_START=[1,3,6,5,0,2,4,7,8];
export const PIPE_GOAL=[12,6,12,3,9,5,6,10,9];
export const PIPE_START=[9,12,6,6,3,10,12,5,3];
export function slideSolved(a){return a.every((v,i)=>v===(i+1)%9);}
export function slideMove(a,index){const blank=a.indexOf(0);if(Math.abs(blank%3-index%3)+Math.abs(Math.floor(blank/3)-Math.floor(index/3))!==1)return false;[a[blank],a[index]]=[a[index],a[blank]];return true;}
export function rotatePipe(mask){return ((mask<<1)&15)|(mask>>3);}
export function pipesSolved(a){
 if(!(a[0]&8)||!(a[6]&4))return false;
 const visited=new Set([0]),queue=[0],dirs=[[-3,1,4],[1,2,8],[3,4,1],[-1,8,2]];
 while(queue.length){const i=queue.shift();for(const [offset,bit,opposite]of dirs){
  if(!(a[i]&bit))continue;
  if(i===0&&bit===8||i===6&&bit===4)continue;
  const j=i+offset;
  if(j<0||j>8||(bit===2&&i%3===2)||(bit===8&&i%3===0)||!(a[j]&opposite))return false;
  if(!visited.has(j)){visited.add(j);queue.push(j);}
 }}return visited.size===9;
}
// Exactly one label is true; these are equipment-test labels, not character testimony.
export function trueLabels(box){return [box==='B',box!=='B',box!=='A'].filter(Boolean).length;}
export function validPuzzles(p){
 if(p===undefined)return true;
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['slide','pipes','sync'].includes(k)))return false;
 if(Object.hasOwn(p,'sync')&&(!p.sync||typeof p.sync!=='object'||!Number.isInteger(p.sync.offset)||p.sync.offset< -6||p.sync.offset>6||typeof p.sync.inverted!=='boolean'))return false;
 if(Object.hasOwn(p,'slide')){const a=p.slide;if(!Array.isArray(a)||a.length!==9||new Set(a).size!==9||!a.every(n=>Number.isInteger(n)&&n>=0&&n<=8))return false;const b=a.filter(Boolean);let inv=0;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++)if(b[i]>b[j])inv++;if(inv%2)return false;}
 if(Object.hasOwn(p,'pipes')&&(!Array.isArray(p.pipes)||p.pipes.length!==9||!p.pipes.every((n,i)=>[3,6,12,9].includes(PIPE_GOAL[i])?[3,6,12,9].includes(n):[5,10].includes(n))))return false;
 return true;
}
export class PuzzlePanel{
 constructor(root,{sound,wrong,close}){Object.assign(this,{root,sound,wrong,close});}
 open(state,kind,onSolved){
  reconcilePuzzles(state);if(state.flags[PUZZLE_FLAGS[kind]]){this.close();onSolved();return false;}
  this.state=state;this.kind=kind;this.onSolved=onSolved;this.done=false;
  state.puzzles??={};if(kind==='slide')state.puzzles.slide??=[...SLIDE_START];if(kind==='pipes')state.puzzles.pipes??=[...PIPE_START];if(kind==='sync')state.puzzles.sync??={offset:0,inverted:false};
  this.root.hidden=false;this.render();
 }
 render(){
  if(this.kind==='sync'){this.renderSync();return;}
  const root=this.root;root.replaceChildren();const body=document.createElement('div');body.className='puzzle-body';root.append(body);
  const heading=document.createElement('h2');heading.id='puzzle-title';heading.textContent={slide:'손상된 원본 색인 · 배열 복원',logic:'정비대 잠금함 · 참인 표지는 하나',pipes:'냉각 순환판 · 배관 연결'}[this.kind];body.append(heading);
  const instruction=document.createElement('p');instruction.textContent={slide:'빈칸 옆 조각을 눌러 이동한다. 색인 매체 가장자리의 인쇄 번호 1–8을 왼쪽 위부터 맞추고, 오른쪽 아래를 비운다. 방향키로 빈칸을 움직일 수도 있다.',logic:'정비 지침: 세 표지 중 정확히 하나만 참이다. 나머지 둘은 거짓이다. 핸들이 들어 있는 함 하나를 고른다. 실제 인물의 진술이 아닌 보관함 검증 문제다.',pipes:'각 관을 눌러 시계 방향으로 회전한다. 왼쪽 위의 유입구(←)부터 왼쪽 아래 배출구(↓)까지 아홉 관을 모두 연결한다. 열린 끝이나 누수가 있으면 작동하지 않는다.'}[this.kind];body.append(instruction);
  const board=document.createElement('div');board.className='puzzle-board '+this.kind;body.append(board);
  if(this.kind==='logic'){
   for(const [box,text]of [['A','핸들은 B함에 있다.'],['B','핸들은 B함에 없다.'],['C','핸들은 A함에 없다.']]){const b=document.createElement('button');b.textContent=`${box}함 · ${text}`;b.onclick=()=>{if(trueLabels(box)===1)this.solve();else{this.sound('thud');this.wrong();status.textContent='검증 실패. 그 위치라면 참인 표지가 두 개다. 조건을 다시 대조하자.';}};board.append(b);}
  }else{
   const a=this.state.puzzles[this.kind];a.forEach((v,i)=>{const b=document.createElement('button');b.dataset.index=i;b.disabled=this.kind==='slide'&&v===0;b.className=v===0?'blank':'';
    b.textContent=this.kind==='slide'?(v||''):{3:'└',5:'│',6:'┌',9:'┘',10:'─',12:'┐'}[v];
    if(this.kind==='pipes'){
      b.textContent='';const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
      const ends=[[1,50,0],[2,100,50],[4,50,100],[8,0,50]].filter(([bit])=>v&bit);
      const d=`M${ends[0][1]} ${ends[0][2]} L50 50 L${ends[1][1]} ${ends[1][2]}`;
      for(const [color,width]of [['#080909',20],['#747b7d',13],['#b0b5b6',3]]){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width',width);path.setAttribute('stroke-linejoin','round');svg.append(path);}b.append(svg);
    }
    if(this.kind==='slide'&&v){const label=document.createElement('small');label.textContent=['','접수','응답','취소','재통화','잠금','수정','원본','대조'][v];b.append(label);}
    b.setAttribute('aria-label',this.kind==='slide'?`${v||'빈칸'} 조각`:`${Math.floor(i/3)+1}행 ${i%3+1}열 관 회전`);
    b.onclick=()=>{if(this.kind==='slide'){if(!slideMove(a,i))return;}else a[i]=rotatePipe(v);this.sound(this.kind==='slide'?'puzzleSlide':'puzzleTurn');const done=this.kind==='slide'?slideSolved(a):pipesSolved(a);if(done)this.solve();else{this.render();this.root.querySelector(`[data-index="${i}"]`)?.focus();}};board.append(b);
   });
  }
  const status=document.createElement('p');status.className='puzzle-status';status.setAttribute('role','status');status.textContent=this.kind==='pipes'?'← 유입 · 좌상단 / ↓ 배출 · 좌하단':this.kind==='slide'?'복원 순서: 1 2 3 / 4 5 6 / 7 8 □':'표지 문장과 함의 위치를 분리해서 생각하자.';body.append(status);
  if(this.kind==='pipes'){const test=document.createElement('button');test.textContent='누수 검사';test.onclick=()=>{if(pipesSolved(this.state.puzzles.pipes))this.solve();else{this.wrong();status.textContent='누수 검출 · 정신력 −12. 열린 관 끝과 연결되지 않은 관을 확인하자.';}};body.append(test);}
  const back=document.createElement('button');back.className='puzzle-back';back.textContent='조사를 멈춘다 · Esc';back.onclick=()=>this.close();body.append(back);
  requestAnimationFrame(()=>board.querySelector('button:not(:disabled)')?.focus());
 }
 renderSync(){
  const root=this.root,p=this.state.puzzles.sync;root.replaceChildren();const body=document.createElement('div');body.className='puzzle-body sync';root.append(body);
  const title=document.createElement('h2');title.id='puzzle-title';title.textContent='이중 녹음 대조기 · 기준 펄스 정렬';body.append(title);
  const text=document.createElement('p');text.textContent='밝은 기준 펄스와 흐린 복제 신호를 맞춘다. 시간 이동과 극성 전환으로 같은 모양을 포갠 뒤 대조 재생한다. 원본은 수정하지 않으며 재생 위치만 보정한다.';body.append(text);
  const graph=document.createElement('canvas');graph.width=640;graph.height=240;graph.setAttribute('aria-label','기준 신호와 지연·역상 신호의 파형');body.append(graph);
  const c=graph.getContext('2d');c.fillStyle='#10171a';c.fillRect(0,0,640,240);c.strokeStyle='#384246';c.lineWidth=1;
  for(let x=0;x<=640;x+=20){c.beginPath();c.moveTo(x,0);c.lineTo(x,240);c.stroke();}for(let y=0;y<=240;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}
  for(const [row,color]of [[0,'#e3d9bd'],[1,'#9daebc']]){c.strokeStyle=color;c.lineWidth=2;c.beginPath();for(let x=0;x<640;x++){const value=syncWave(x/20+(row?p.offset-3:0))*(row&&!p.inverted?-1:1),y=120-value*65;if(!x)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}c.fillStyle='#ddd';c.font='13px monospace';c.fillText('기준 / 복제 신호 · 겹치면 일치',12,22);
  const label=document.createElement('label');label.textContent='재생 위치 이동: '+p.offset+' 눈금';const range=document.createElement('input');range.type='range';range.min='-6';range.max='6';range.step='1';range.value=p.offset;range.setAttribute('aria-label','재생 위치 이동');range.onchange=()=>{p.offset=Number(range.value);this.renderSync();this.root.querySelector('input')?.focus();};label.append(range);body.append(label);
  const phase=document.createElement('button');phase.textContent=p.inverted?'극성: 반전':'극성: 원래대로';phase.onclick=()=>{p.inverted=!p.inverted;this.sound('puzzleTurn');this.renderSync();this.root.querySelector('button')?.focus();};body.append(phase);
  const status=document.createElement('p');status.className='puzzle-status';status.setAttribute('role','status');body.append(status);
  const check=document.createElement('button');check.textContent='대조 재생';check.onclick=()=>{if(syncSolved(p))this.solve();else{this.wrong();status.textContent='불일치 · 정신력 −12. 두 파형의 봉우리와 방향을 함께 확인하자.';}};body.append(check);
  const back=document.createElement('button');back.textContent='조사를 멈춘다 · Esc';back.onclick=()=>this.close();body.append(back);requestAnimationFrame(()=>range.focus());
 }
 solve(){
  if(this.done)return;this.done=true;this.state.flags[{slide:'relaySlide',logic:'relayLogic',pipes:'relayPipes',sync:'relaySync'}[this.kind]]=true;
  this.sound('item');const body=this.root.firstElementChild;body.replaceChildren();const p=document.createElement('p');p.id='puzzle-title';p.textContent={slide:'색인 매체가 맞물렸다. 단말이 원본 파일 번호를 읽을 수 있다.',logic:'A함의 잠금이 풀렸다. 핸들을 꺼낼 수 있다.',pipes:'아홉 관이 연결됐다. 이제 사각 축에 핸들을 연결하고 밸브를 열 수 있다.',sync:'기준 펄스가 겹쳤다. 두 녹음의 재생 위치를 대조했고, 23:44 통화 구간이 분리됐다.'}[this.kind];body.append(p);const b=document.createElement('button');b.textContent='계속 조사한다';b.onclick=()=>{this.close();this.onSolved();};body.append(b);b.focus();
 }
 key(e){
  if(this.kind==='sync'&&!this.done&&e.target.matches('input[type=range]')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const p=this.state.puzzles.sync;p.offset=Math.max(-6,Math.min(6,p.offset+(e.key==='ArrowRight'?1:-1)));this.renderSync();return;}
  if(e.key==='Tab'){e.preventDefault();const bs=[...this.root.querySelectorAll('button:not(:disabled),input')],i=bs.indexOf(document.activeElement);bs[(i+(e.shiftKey?-1:1)+bs.length)%bs.length]?.focus();return;}
  if(e.key==='Escape'){e.preventDefault();this.close();return;}
  if(this.kind==='slide'&&!this.done&&e.key.startsWith('Arrow')){e.preventDefault();const a=this.state.puzzles.slide,b=a.indexOf(0),next={ArrowUp:b-3,ArrowDown:b+3,ArrowLeft:b-1,ArrowRight:b+1}[e.key];if(next>=0&&next<9&&slideMove(a,next)){this.sound(this.kind==='slide'?'puzzleSlide':'puzzleTurn');if(slideSolved(a))this.solve();else this.render();}}
 }
}
