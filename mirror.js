export class MirrorView{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.image=new Image();this.image.src='assets/chapter1-fixtures.png?v=6f29bf83c5cb';this.ready=this.image.decode();this.time=0;this.active=false;}
 open(flash){this.time=0;this.flash=flash;this.played=false;this.active=true;}
 draw(dt,reduced=false){
  this.time+=dt;const visible=this.flash&&this.time>=1.1&&this.time<1.3,c=this.ctx,w=this.canvas.width,h=this.canvas.height;
  c.fillStyle='#030304';c.fillRect(0,0,w,h);
  if(this.image.naturalWidth){const crop=visible?[618,0,298,512]:[134,0,266,512];
   const zoom=reduced?1:.94+Math.min(1,this.time/.6)*.06,height=h*.96*zoom,width=height*.59;
   c.drawImage(this.image,...crop,(w-width)/2,(h-height)/2,width,height);
  }
  const laugh=visible&&!this.played;if(laugh)this.played=true;
  return{laugh,visible,closable:this.time>=1.5};
 }
}
