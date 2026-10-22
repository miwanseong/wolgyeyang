const T=32;
export const PROP_TYPES=['desk','locker','panel','box','shoe','player','shelf','bench','notice','calendar','photo','window','chair','bed','cabinet','crates','rack','radiator','monitor'];
export function propState(o,s){
 if(o.id==='shoe')return s.bag.includes('key')?1:0;
 if(o.id==='box')return s.bag.includes('fuse')||s.flags.power?1:0;
 if(o.id==='locker')return s.flags.locker?1:0;
 if(o.id==='power')return s.flags.power?1:0;
 if(o.id==='desk')return s.flags.desk?1:0;
 if(o.id==='mirror')return s.flags.power&&s.flags.seen_mirror?1:0;
 if(o.id==='player')return s.flags.listened?1:0;
 return s.flags['seen_'+o.id]?1:0;
}
export class Camera{
 constructor(){this.x=1040;this.y=576;this.zoom=1.35;this.ready=false}
 reset(s){this.x=s.x;this.y=s.y;this.ready=true}
 update(s,dt,focus,reduced){const f=focus?0.28:0,tx=s.x*(1-f)+(focus?.x||s.x)*f,ty=s.y*(1-f)+(focus?.y||s.y)*f;const ease=reduced?1:1-Math.exp(-dt*5.5);this.x+=(tx-this.x)*ease;this.y+=(ty-this.y)*ease;this.zoom+=((focus?1.58:1.35)-this.zoom)*(reduced?1:1-Math.exp(-dt*3));}
}
function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('에셋을 불러올 수 없습니다: '+src));im.src=src})}
export class Scene{
 constructor(canvas,grid,rooms,objects){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.grid=grid;this.rooms=rooms;this.objects=objects;this.camera=new Camera();this.objectStates=new Map();this.dt=.016;this.direction=0;this.walk=0;this.moving=false;this.lastStep=0;this.focus=null;this.shake=0;this.fade=1;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.ready=false;this.assets=Promise.all(['assets/tileset.svg','assets/props.svg','assets/seoha-walk.png'].map(load)).then(([tiles,props,actor])=>{Object.assign(this,{tiles,props,actor,ready:true})});}
 begin(s){this.camera.reset(s);this.fade=this.reduced?0:1;this.focus=null}
 moved(dx,dy,dt){this.moving=Math.hypot(dx,dy)>.01;if(this.moving){this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);this.walk+=dt*7.6}else this.walk=1}
 inspect(o){this.focus=o}
 impact(){this.shake=this.reduced?0:.4}
 tile(index,x,y){const c=this.ctx;c.drawImage(this.tiles,index%8*64,Math.floor(index/8)*64,64,64,x,y,32,32)}
 prop(o,s,t){const c=this.ctx;let kind=o.kind;let n=PROP_TYPES.indexOf(kind);const changed=propState(o,s);if(o.kind==='exit'){
 c.fillStyle='#222';c.fillRect(o.x-48,o.y-10,96,22);c.strokeStyle='#929292';c.strokeRect(o.x-48,o.y-10,96,22);for(let i=0;i<7;i++){if(s.flags.listened&&i>0&&i<6)continue;c.strokeStyle='#4d4d4d';c.beginPath();c.moveTo(o.x-42+i*13,o.y-7);c.lineTo(o.x-42+i*13,o.y+9);c.stroke()}c.fillStyle='#bdbdbd';c.font='7px monospace';c.textAlign='center';c.fillText(s.flags.listened?'EXIT — UNLOCKED':'EXIT — SEALED',o.x,o.y+25);return}
 if(n<0)n=7;let blend=this.objectStates.get(o.id)??changed;blend+=(changed-blend)*(this.reduced?1:1-Math.exp(-this.dt*12));this.objectStates.set(o.id,blend);for(const [frame,alpha] of [[0,1-blend],[1,blend]]){if(alpha<.001)continue;const idx=n*2+frame;c.globalAlpha=alpha;c.drawImage(this.props,(idx%6)*128,Math.floor(idx/6)*128,128,128,o.x-43,o.y-61,86,86)}c.globalAlpha=1;
 if(o.id==='player'&&s.flags.listened){for(const x of [-15,1]){c.save();c.translate(o.x+x,o.y-20);c.rotate(t/440);c.strokeStyle='#ccc';c.beginPath();c.moveTo(-3,0);c.lineTo(3,0);c.moveTo(0,-3);c.lineTo(0,3);c.stroke();c.restore()}}
 if(o.id==='power'&&s.flags.power){c.shadowColor='#fff';c.shadowBlur=12;c.fillStyle='#eee';c.fillRect(o.x+10,o.y-4,5,2);c.shadowBlur=0}
 if(s.flags['seen_'+o.id]){c.fillStyle='#acacac';c.fillRect(o.x-2,o.y+29,4,1)}
 }
 draw(s,t,dt,nearest,dialog){if(!this.ready)return;this.dt=dt;const c=this.ctx,cw=this.canvas.width,ch=this.canvas.height;
 this.camera.update(s,dt,dialog?this.focus:null,this.reduced);const z=this.camera.zoom,vw=cw/z,vh=ch/z;
 let camX=Math.max(0,Math.min(2080-vw,this.camera.x-vw/2)),camY=Math.max(0,Math.min(1152-vh,this.camera.y-vh/2));
 this.shake=Math.max(0,this.shake-dt);if(this.shake){camX+=Math.sin(t*.07)*this.shake*5;camY+=Math.cos(t*.09)*this.shake*3}
 c.imageSmoothingEnabled=false;c.fillStyle='#0b0b0b';c.fillRect(0,0,cw,ch);c.save();c.scale(z,z);c.translate(-camX,-camY);
 for(let y=Math.max(0,Math.floor(camY/T)-1);y<Math.min(36,Math.ceil((camY+vh)/T)+1);y++)for(let x=Math.max(0,Math.floor(camX/T)-1);x<Math.min(65,Math.ceil((camX+vw)/T)+1);x++){
  const v=this.grid[y][x];if(!v)continue;const r=this.rooms.find(r=>x>r.x&&x<r.x+r.w-1&&y>r.y&&y<r.y+r.h-1),ri=this.rooms.indexOf(r),variation=(x*7+y*13)%4;
  this.tile(v===2?24+(x+y)%4:(r?[8,8,16,8,16,20][ri]:0)+variation,x*T,y*T);
  if(v===2&&this.grid[y+1]?.[x]===1){c.fillStyle='#0005';c.fillRect(x*T,(y+1)*T,T,10)}
 }
 // Ground dressing and light fixtures use the same small set throughout the building.
 for(const [i,r] of this.rooms.entries()){
  const x=(r.x+9)*T,y=(r.y===2?14:21)*T;c.fillStyle='#292929';c.fillRect(x-9,y-4,50,6);c.fillStyle=s.flags.power?'#ccc':'#6c6c6c';c.fillRect(x-4,y-3,40,2);
  if(i===3){c.fillStyle='#353535';c.fillRect((r.x+3)*T,(r.y+3)*T,180,82);c.strokeStyle='#717171';c.strokeRect((r.x+3)*T+4,(r.y+3)*T+4,172,74);for(let k=0;k<3;k++){c.strokeStyle='#4f4f4f';c.strokeRect((r.x+3)*T+8+k*4,(r.y+3)*T+8+k*4,164-k*8,66-k*8)}}
  c.fillStyle='#b5b5b5';c.font='9px serif';c.textAlign='left';c.fillText(r.name,r.x*T+45,r.y*T+52);c.fillStyle='#777';c.font='5px monospace';c.fillText(r.sub,r.x*T+45,r.y*T+63);
  for(let k=0;k<3;k++){c.save();c.translate((r.x+4+k*4)*T,(r.y+4+(i+k)%2)*T);c.rotate((i+k)*.4);c.fillStyle='#aaa7';c.fillRect(0,0,8,11);c.fillStyle='#3b3b3b';c.fillRect(2,3,4,1);c.fillRect(2,6,4,1);c.restore()}
 }
 const drawables=this.objects.map(o=>({y:o.y,draw:()=>this.prop(o,s,t)}));drawables.push({y:s.y,draw:()=>{
 c.fillStyle='#0007';c.beginPath();c.ellipse(s.x,s.y+6,13,5,0,0,Math.PI*2);c.fill();const f=this.moving?Math.floor(this.walk)%4:1,sw=this.actor.naturalWidth/4,sh=this.actor.naturalHeight/4;
 c.drawImage(this.actor,f*sw,this.direction*sh,sw,sh,s.x-40,s.y-69,80,80);
 }});drawables.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 if(nearest&&!dialog){const y=nearest.y-47-Math.sin(t/380)*2;c.strokeStyle='#dadada';c.lineWidth=.7;c.beginPath();c.moveTo(nearest.x-5,y);c.lineTo(nearest.x,y+3);c.lineTo(nearest.x+5,y);c.stroke();}
 c.restore();
 // Composited light pools keep props readable, without rapid flicker.
 const px=(s.x-camX)*z,py=(s.y-camY)*z,g=c.createRadialGradient(px,py,50,px,py,s.flags.power?650:480);g.addColorStop(0,'#0000');g.addColorStop(.6,'#0003');g.addColorStop(1,'#000b');c.fillStyle=g;c.fillRect(0,0,cw,ch);
 if(!this.reduced)for(let i=0;i<24;i++){const x=(i*151+Math.sin(t/5000+i)*28)%cw,y=(i*71+t*.007)%ch;c.fillStyle='#ffffff14';c.fillRect(x,y,1,1)}
 const bars=dialog?22:0;c.fillStyle='#101010';c.fillRect(0,0,cw,bars);c.fillRect(0,ch-bars,cw,bars);
 this.fade=Math.max(0,this.fade-dt*.7);if(this.fade){c.fillStyle=`rgba(10,10,10,${this.fade})`;c.fillRect(0,0,cw,ch)}
 }
}
