export class MirrorView{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.image=new Image();this.image.src='assets/mirror-watcher.png?v=79bfc232d1ce';this.ready=this.image.decode();this.time=0;this.active=false;}
 open(flash){this.time=0;this.flash=flash;this.played=false;this.active=true;}
 draw(dt,reduced=false){
  this.time+=dt;const visible=this.flash&&this.time>=1.1&&this.time<1.3,c=this.ctx,w=this.canvas.width,h=this.canvas.height;
  c.fillStyle='#030304';c.fillRect(0,0,w,h);
  if(this.image.naturalWidth){const sw=this.image.width/3,sh=440,col=visible?1:0;
   c.save();c.beginPath();c.ellipse(w/2,h/2,w*.31,h*.47,0,0,7);c.clip();
   c.drawImage(this.image,col*sw,0,sw,sh,w*.19,0,w*.62,h);c.fillStyle='#9ea6ac0a';for(let x=0;x<w;x+=47)c.fillRect(x,0,1,h);c.restore();
   c.strokeStyle='#5e5b55';c.lineWidth=12;c.beginPath();c.ellipse(w/2,h/2,w*.32,h*.48,0,0,7);c.stroke();c.strokeStyle='#aaa69b';c.lineWidth=1;c.stroke();
  }
  const laugh=visible&&!this.played;if(laugh)this.played=true;
  return{laugh,visible,closable:this.time>=1.5};
 }
}
