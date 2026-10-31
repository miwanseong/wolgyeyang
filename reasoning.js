export const EVIDENCE={callback:{name:'숨김 전23:44 수신 행',text:'취소 이후23:44 재통화가 있고, 응답자는 서하다.',available:s=>s.bag.includes('auditMemo')||s.flags.relayErasure||s.flags.relayLastVoice},pump:{name:'펌프 정지 운전표',text:'2023.11.04 / 월계아파트 B1 배수펌프. 소음 발생 시각23:40–23:50 정지.',available:s=>s.bag.includes('pumpLog')},key:{name:'미정의 당직 수첩',text:'열쇠는 돌았지만 문은 움직이지 않았다. 미정이 직접 적은 관찰이다.',available:s=>s.flags.relayDuty||s.bag.includes('boltSketch')},ack:{name:'R-17 수신 메타데이터',text:'명령 수신 확인은 있으나 문 열림 접점은 수신되지 않았다.',available:s=>s.flags.relayCancel},lock:{name:'23:47 잠금 유지 회신',text:'정우가 수동으로 잠금 유지를 다시 명령했다.',available:s=>s.flags.relayOverride}};
export const CASES={
 haerin:{source:s=>!!s.flags.relayRegistered,title:'해린의 처리 보고',lines:['23:43 시설 출동은 취소 처리했다.','취소 뒤 다시 걸려 온 전화는 없었다.','표시 화면의 출력본을 인계했다.'],target:1,evidence:'callback',conclusion:'23:44 수신 행이 남아 있으므로 「재통화가 없었다」는 보고는 사실과 다르다. 통화 내용과 표시 숨김의 책임은 별도로 확인한다.'},
 dohyun:{source:s=>!!s.flags.relayPressure,title:'도현의 수정 설비 보고',lines:['당시 복도에서 소리가 들렸다.','확인하러 문 앞으로 내려가지는 않았다.','펌프 운전 중의 규칙적인 진동이었다.'],target:2,evidence:'pump',conclusion:'운전표는 같은 시각 펌프 정지를 기록한다. 소리를 운전 중 진동으로 단정한 수정 보고는 성립하지 않는다. 이것만으로 소리의 주체를 단정하지는 않는다.'},
 mijeong:{source:s=>!!s.flags.relayDuty,title:'정우가 쓴 열쇠 인수 요약',lines:['열쇠가 돌아갔으므로 현장 문도 열렸다.','미정이 예비 열쇠를 가져왔다.','열쇠 인계 항목을 완료로 처리했다.'],target:0,evidence:'key',conclusion:'미정의 직접 관찰은 「열쇠만 돌고 문은 안 움직였다」다. 정우의 요약은 열쇠 인계를 실제 개방으로 바꿔 적었다. 미정은 삭제 이력이나 제어기 내부를 아는 증인이 아니다.'}
};
export function knownCases(s){return Object.keys(CASES).filter(id=>s.flags['talked_'+id]);}
export function availableEvidence(s){return Object.keys(EVIDENCE).filter(k=>EVIDENCE[k].available(s));}
export function confront(s,id,line,evidence){const c=CASES[id];if(!c||!knownCases(s).includes(id)||!c.source(s)||!availableEvidence(s).includes(evidence))return{ok:false,reason:'먼저 실제 증거를 수집해야 한다.'};if(s.flags['deduced_'+id])return{ok:true,already:true,text:c.conclusion};if(line!==c.target||evidence!==c.evidence)return{ok:false,reason:'그 문장과 증거 사이에는 직접적인 모순이 없다.'};s.flags['deduced_'+id]=true;if(!s.notes.some(n=>n.id==='deduction_'+id))s.notes.push({id:'deduction_'+id,text:c.title+' · '+c.conclusion});return{ok:true,text:c.conclusion};}
export const COMPARISON_GUIDES={
 haerin:{source:'접수동 해린의 인계대를 조사하면 처리 보고를 읽을 수 있다.',missing:'해린에게 수정 전 목록을 요청하거나 기록동의 수정 이력 서랍을 조사한다.',summary:'취소 뒤에 전화가 또 왔어. 「재통화가 없었다」는 목록과 실제 기록이 달라.'},
 mijeong:{source:'접수동 당직실에서 미정의 수첩을 읽는다.',missing:'미정의 당직 수첩에서 문 앞에서 직접 본 내용을 확인한다.',summary:'열쇠가 돌아간 것과 문이 열린 건 다른 일이야. 미정은 문이 안 움직였다고 적었어.'},
 dohyun:{source:'지하 설비동의 도현 설비 관찰지에서 수정 보고를 읽는다.',missing:'기록동의 사고 당시 펌프 운전 원장을 찾아 정지 시각을 확인한다.',summary:'그 시각 펌프는 멈춰 있었어. 들은 소리를 펌프 진동이라고 단정할 수 없어.'}
};
export function comparisonView(s,id){const c=CASES[id],guide=COMPARISON_GUIDES[id];if(!c||!knownCases(s).includes(id))return{sourceReady:false,evidenceReady:false,claim:null,evidence:null,summary:null,source:'아직 직접 대화한 사람의 진술이 없다.',missing:null};return {claim:c.lines[c.target],sourceReady:c.source(s),evidenceReady:EVIDENCE[c.evidence].available(s),evidence:EVIDENCE[c.evidence],...guide};}
export class ReasoningPanel{
 constructor(root,options){Object.assign(this,{root},options);}
 open(s,id=null){this.state=s;this.id=knownCases(s).includes(id)?id:knownCases(s)[0]||null;this.root.hidden=false;this.render();}
 render(){const root=this.root,s=this.state,c=CASES[this.id],v=comparisonView(s,this.id);root.replaceChildren();const body=document.createElement('div');body.className='reasoning-body';root.append(body);const title=document.createElement('h2');title.id='reasoning-title';title.textContent='말과 기록 비교';body.append(title);
 const intro=document.createElement('p');intro.textContent='서하의 수첩 · 두 내용을 읽고 무엇이 달랐는지 확인한다.';body.append(intro);
 const tabs=document.createElement('nav');tabs.setAttribute('aria-label','확인할 기록');for(const [id,entry]of Object.entries(CASES).filter(([id])=>knownCases(s).includes(id))){const b=document.createElement('button');b.textContent=(s.flags['deduced_'+id]?'✓ ':'')+entry.title;b.setAttribute('aria-pressed',String(id===this.id));b.onclick=()=>{this.id=id;this.render();};tabs.append(b);}body.append(tabs);
 const card=(heading,text)=>{const section=document.createElement('section');section.className='comparison-card';const h=document.createElement('h3');h.textContent=heading;const p=document.createElement('p');p.textContent=text;section.append(h,p);body.append(section);};
 if(c){card('1 · 기록에 적힌 말',v.sourceReady?'「'+v.claim+'」':v.source);
 card('2 · 직접 확인한 증거',v.evidenceReady?v.evidence.name+'\n'+v.evidence.text:'아직 확인하지 못했다.\n'+v.missing);
 if(v.sourceReady&&v.evidenceReady){card('3 · 서하가 알아낸 차이',v.summary);const b=document.createElement('button');b.className='comparison-confirm';b.textContent=s.flags['deduced_'+this.id]?'✓ 수첩에 기록해 두었다':'이 차이를 수첩에 기록한다';b.disabled=!!s.flags['deduced_'+this.id];b.onclick=()=>{const r=confront(s,this.id,c.target,c.evidence);if(r.ok){this.sound('paper');this.render();}};body.append(b);}
 }else card('수첩','직접 대화해 진술을 들은 뒤 기록과 대조할 수 있다.');
 const back=document.createElement('button');back.textContent='현장으로 돌아간다 · Esc';back.onclick=this.close;body.append(back);requestAnimationFrame(()=>body.querySelector('button:not(:disabled)')?.focus());}
 key(e){if(e.key==='Escape'){e.preventDefault();this.close();}if(e.key==='Tab'){e.preventDefault();const bs=[...this.root.querySelectorAll('button:not(:disabled)')],i=bs.indexOf(document.activeElement);bs[(i+(e.shiftKey?-1:1)+bs.length)%bs.length]?.focus();}}
}
