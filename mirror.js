export function mirrorGeometry(w,h){const height=h*.99,width=height*564/1024;return{x:(w-width)/2,y:(h-height)/2,w:width,h:height};}
export class MirrorView{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.image=new Image();this.image.src='assets/mirror-pair.png?v=0626962de89e';this.ready=this.image.decode();this.time=0;this.active=false;}
 open(flash){this.time=0;this.flash=flash;this.played=false;this.active=true;}
 prepareOverlay(w,h,g){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
  c.drawImage(this.image,866,0,562,1024,g.x,g.y,g.w,g.h);c.globalCompositeOperation='destination-in';
  const horizontal=c.createLinearGradient(g.x,0,g.x+g.w,0);for(const[p,a]of [[0,0],[.67,0],[.77,1],[.92,1],[.96,0],[1,0]])horizontal.addColorStop(p,`rgba(255,255,255,${a})`);c.fillStyle=horizontal;c.fillRect(0,0,w,h);
  const vertical=c.createLinearGradient(0,g.y,0,g.y+g.h);for(const[p,a]of [[0,0],[.05,0],[.1,1],[.86,1],[.94,0],[1,0]])vertical.addColorStop(p,`rgba(255,255,255,${a})`);c.fillStyle=vertical;c.fillRect(0,0,w,h);this.ghostOverlay=canvas;
 }
 draw(dt,reduced=false){
  this.time+=dt;const visible=this.flash&&this.time>=1.1&&this.time<1.3,c=this.ctx,w=this.canvas.width,h=this.canvas.height,g=mirrorGeometry(w,h);
  c.fillStyle='#030304';c.fillRect(0,0,w,h);
  if(this.image.naturalWidth){
   // The protagonist and frame always come from the same pixels. Only the right background changes.
   c.drawImage(this.image,106,0,564,1024,g.x,g.y,g.w,g.h);
   if(visible){if(!this.ghostOverlay)this.prepareOverlay(w,h,g);c.drawImage(this.ghostOverlay,0,0,w,h);}
  }
  const laugh=visible&&!this.played;if(laugh)this.played=true;
  return{laugh,visible,closable:this.time>=1.5,geometry:g};
 }
}
