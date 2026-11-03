// An isolated maintenance trainer, never the live transfer switch.
export const CONTACTS=[['A','보호 접점'],['B','시험 입력'],['C','복귀 감시']];
export function contactRequirements(s){
 if(s.flags.relayTesterUnlocked)return null;
 if(!s.bag.includes('relayCopy'))return'지금 빌리려는 시험기는 원본 데크 회선 확인용이야. 먼저 기록동에서 잘린 파일 번호를 찾아야 해.';
 if(!s.flags.contactBriefed)return'도현 씨가 관리하는 시험대야. 무엇을 확인할지 먼저 물어보자.';
 if(!s.flags.contactDiagramSeen)return'접점이 어디에 이어지는지 아직 몰라. 시험대 뒤 결선도를 먼저 확인하자.';
 if(!s.flags.contactFaultSeen)return'결선도만으로 지금 고장 난 상태를 알 수 없어. 공구 트레이 옆 최근 점검지를 봐야 해.';
 return null;
}
export function contactFaults(s){return[
 ...(!s.flags.contactA?['보호 접점이 열려 있어 감시 기준이 잡히지 않는다.']:[]),
 ...(s.flags.contactB?['시험 입력이 연결된 채다. 점검지에 남은 역류가 재현됐다.']:[]),
 ...(!s.flags.contactC?['복귀 감시 회로가 끊겨 확인 신호가 돌아오지 않는다.']:[]),
 ];}
export function verifyContacts(s){
 const blocked=contactRequirements(s);if(blocked)return{blocked};
 const faults=contactFaults(s);if(faults.length){s.flags.contactFaultSeen=false;return{success:false,line:faults[0]+'\n시험 전원이 차단됐다. 점검지에 남은 고장 표시를 다시 보고 연결을 고쳐야 해.'};}
 s.flags.relayTesterUnlocked=true;s.flags.contactVerified=true;return{success:true,line:'시험 입력을 분리한 채 보호 기준과 복귀 감시가 이어졌다. 확인등이 켜지고 공구 트레이 걸쇠가 풀렸다.'};
}
export class ContactPanel{
 constructor(root,{sound,close,complete}){Object.assign(this,{root,sound,close,complete});this.token=0;}
 open(s){this.state=s;this.busy=false;this.token++;this.root.hidden=false;this.render();}
 stop(){this.token++;this.busy=false;}
 render(){
  const s=this.state,root=this.root;root.replaceChildren();const body=document.createElement('div');body.className='puzzle-body contact-body';root.append(body);
  const heading=document.createElement('h2');heading.id='puzzle-title';heading.textContent='분리형 점검대 · 복귀 신호 시험';body.append(heading);
  const context=document.createElement('p');context.textContent='원본 데크 회선 확인에 쓸 시험기를 꺼낸다. 본 회선과 분리된 저전압 점검대다. 연결 상태를 맞춘 뒤 시험 신호가 되돌아오는지 확인한다.';body.append(context);
  const diagram=document.createElement('div');diagram.className='contact-diagram';diagram.innerHTML='<svg viewBox="0 0 640 165" role="img" aria-label="보호 기준과 복귀 감시, 역류가 남은 시험 입력을 구분한 결선도"><path d="M45 110H180V45H440V110H595M320 150V45" fill="none" stroke="#857c6c" stroke-width="5"/><circle cx="180" cy="45" r="13"/><circle cx="320" cy="45" r="13"/><circle cx="440" cy="45" r="13"/><text x="180" y="24">A · 보호 기준</text><text x="320" y="140">B · 시험 입력</text><text x="440" y="24">C · 복귀 감시</text><text x="60" y="97">감시원</text><text x="565" y="97">확인등</text></svg>';body.append(diagram);
  const clues=document.createElement('p');clues.className='contact-clues';clues.textContent='찍어 둔 결선도: A는 보호 기준, C는 복귀 감시.\n최근 점검지: B의 입력 역류. 시험 입력을 떼어 낸 상태에서 두 감시선이 이어져야 잠금이 풀린다.';body.append(clues);
  const board=document.createElement('div');board.className='contact-switches';body.append(board);
  for(const [key,label]of CONTACTS){const b=document.createElement('button');b.setAttribute('aria-pressed',String(!!s.flags['contact'+key]));b.dataset.contact=key;b.textContent=label+' · '+(s.flags['contact'+key]?'연결':'분리');b.onclick=()=>{if(this.busy)return;s.flags['contact'+key]=!s.flags['contact'+key];this.sound('puzzleTurn');this.render();root.querySelector('[data-contact='+key+']').focus();};board.append(b);}
  const status=document.createElement('p');status.className='puzzle-status';status.setAttribute('role','status');status.textContent='확인등 꺼짐 · 시험 신호 대기';body.append(status);
  const test=document.createElement('button');test.textContent='시험 신호를 보내 복귀를 확인한다';test.onclick=()=>{if(this.busy)return;this.busy=true;for(const b of body.querySelectorAll('button'))b.disabled=true;const token=++this.token;body.dataset.testing='true';status.textContent='입력 분리 확인 → 보호 기준 대조 → 복귀 신호 대기…';this.sound('puzzleTurn');setTimeout(()=>{if(token!==this.token)return;const r=verifyContacts(s);this.busy=false;body.dataset.testing='false';if(r.blocked){this.close();this.complete(r);return;}this.sound(r.success?'checkSuccess':'checkFailure');this.close();this.complete(r);},1600);};body.append(test);
  const back=document.createElement('button');back.textContent='연결 상태를 남겨 두고 물러난다';back.onclick=()=>{this.stop();this.close();};body.append(back);test.focus();
 }
}
