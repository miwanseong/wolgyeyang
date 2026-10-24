import {rememberedHides} from './haunting.js?v=354910042dff';
// Photograph-derived floor plan and procedural weather. No story objectives leak here.
export class Atmosphere{
 constructor(sound){this.sound=sound;this.lastStorm=0;this.flash=0;this.rain=null;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
 noise(duration,volume,thunder=false){const a=this.sound(),ctx=a.ctx;if(!ctx||ctx.state!=='running'||!a.enabled)return null;const b=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),data=b.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){low=low*.97+(Math.random()*2-1)*.03;data[i]=(thunder?low*7:Math.random()*2-1)*(thunder?Math.exp(-i/data.length*5):1);}const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=b;filter.type=thunder?'lowpass':'highpass';filter.frequency.value=thunder?350:1300;gain.gain.value=volume;source.connect(filter).connect(gain).connect(a.fxBus);source.loop=!thunder;source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();return{source,gain};}
 update(s,map,enemy,t,dt,active){
 const weather=document.getElementById('weather'),mini=document.getElementById('photo-map'),out=s.flags.chapter2&&map.outdoor;
 weather.hidden=!out;weather.classList.toggle('reduced',this.reduced);
 if(out&&active&&t-this.lastStorm>14000){this.lastStorm=t+Math.random()*12000;this.flash=this.reduced?.08:.3;this.noise(4,.45,true);}
 this.flash=Math.max(0,this.flash-dt*.6);weather.style.backgroundColor=`rgba(205,215,225,${this.flash})`;
 if(out&&active&&!this.rain)this.rain=this.noise(3,.025);
 if((!out||!active||!this.sound().enabled)&&this.rain){this.rain.source.stop();this.rain=null;}
 const known=rememberedHides(map,s);mini.hidden=!s.flags.chapter2||!(s.flags.relayMap||s.flags['photo_'+s.map]);if(mini.hidden)return;
 const c=mini.getContext('2d'),w=mini.width,h=mini.height;c.fillStyle='#15191c';c.fillRect(0,0,w,h);
 const jam=enemy.active||enemy.mode==='chase';mini.setAttribute('aria-label',jam?'도면 사진 · 신호 간섭':'구역 도면 · 청록 마름모: 기억한 은신처 '+known.map(o=>o.name).join(', '));
 const z=Math.min((w-16)/map.w,(h-32)/map.h),ox=(w-map.w*z)/2,oy=(h-18-map.h*z)/2;
 for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){c.fillStyle=map.grid[y][x]===1?'#b9b9ae':'#303638';c.fillRect(ox+x*z,oy+y*z,z+.2,z+.2);}
 if(!jam){for(const o of known){const x=ox+o.x/32*z,y=oy+o.y/32*z;c.fillStyle='#091715';c.fillRect(x-4,y-4,8,8);c.strokeStyle='#77e0c6';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x+4,y);c.lineTo(x,y+4);c.lineTo(x-4,y);c.closePath();c.stroke();}c.fillStyle='#15191c';c.fillRect(0,h-16,w,16);c.fillStyle='#8ee2cf';c.font='10px sans-serif';c.fillText('◇ 기억한 은신처',7,h-5);for(const o of map.objects.filter(o=>o.to||o.internalDoor)){c.fillStyle='#d5bb7b';c.fillRect(ox+o.x/32*z-1,oy+o.y/32*z-1,2,2);}c.fillStyle='#c94949';c.beginPath();c.arc(ox+s.x/32*z,oy+s.y/32*z,3,0,7);c.fill();}else{for(let y=0;y<h;y+=12)for(let x=0;x<w;x+=12){const v=(Math.floor(t/110)+x*17+y*11)%101;c.fillStyle=`rgba(${v},${v},${v},.94)`;c.fillRect(x,y,12,12);}c.fillStyle='#e6bcbc';c.font='12px sans-serif';c.fillText('신호 간섭',10,h-12);}
 }
}
