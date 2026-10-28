import {distortionStage} from './distortion.js?v=35d4de009dfc';
// Original generated full-body injury states and nonhuman hunter. Measured source bounds.
export const INJURY_POSES=[[{"x":43,"y":7,"w":179,"h":276,"width":36.3967,"grip":[0.9615262991462001,0.44834108103181114],"pivot":0.52834},{"x":222,"y":7,"w":203,"h":272,"width":41.8837,"grip":[0.7867777213661374,0.5409737014582993],"pivot":0.61074},{"x":506,"y":7,"w":133,"h":272,"width":27.441,"grip":[0.9014261632729511,0.46044850324471426],"pivot":0.39414},{"x":710,"y":7,"w":139,"h":276,"width":28.2633,"grip":[0.9089220426937139,0.4794784984556902],"pivot":0.44448},{"x":916,"y":7,"w":141,"h":271,"width":29.199,"grip":[0.7209057193050946,0.5520566031348387],"pivot":0.54619},{"x":1130,"y":7,"w":134,"h":275,"width":27.3457,"grip":[0.7186898488529867,0.5489294637709013],"pivot":0.55297},{"x":1354,"y":7,"w":184,"h":276,"width":37.4133,"grip":[0.94824016563147,0.43850438726215124],"pivot":0.49769},{"x":1562,"y":7,"w":172,"h":276,"width":34.9733,"grip":[0.8575581395348837,0.5039389708815317],"pivot":0.49862}],[{"x":51,"y":299,"w":153,"h":275,"width":31.2231,"grip":[0.5885114609223971,0.5951685872812633],"pivot":0.52096},{"x":262,"y":299,"w":148,"h":283,"width":29.349,"grip":[0.597972972972973,0.605050058892815],"pivot":0.51882},{"x":503,"y":300,"w":134,"h":279,"width":26.9537,"grip":[0.7,0.55],"pivot":0.40608},{"x":719,"y":299,"w":129,"h":284,"width":25.4911,"grip":[0.7,0.55],"pivot":0.43834},{"x":922,"y":299,"w":123,"h":284,"width":24.3055,"grip":[0.6254917387883556,0.5905459639557777],"pivot":0.5739},{"x":1137,"y":299,"w":125,"h":284,"width":24.7007,"grip":[0.7390877192982456,0.5763640856302087],"pivot":0.58612},{"x":1370,"y":300,"w":145,"h":283,"width":28.7541,"grip":[0.6337931034482759,0.6183745583038869],"pivot":0.50037},{"x":1578,"y":300,"w":148,"h":283,"width":29.349,"grip":[0.9045975323149236,0.49679290213550464],"pivot":0.45585}],[{"x":39,"y":596,"w":172,"h":275,"width":35.1005,"grip":[0.5434883720930233,0.5972363636363637],"pivot":0.54267},{"x":262,"y":596,"w":166,"h":268,"width":34.7609,"grip":[0.7,0.55],"pivot":0.54152},{"x":510,"y":597,"w":133,"h":273,"width":27.3405,"grip":[0.5413533834586466,0.5860805860805861],"pivot":0.40949},{"x":718,"y":596,"w":132,"h":275,"width":26.9376,"grip":[0.5476190476190477,0.5896103896103896],"pivot":0.41027},{"x":915,"y":598,"w":147,"h":267,"width":30.8975,"grip":[0.8062528846346798,0.5184669605471037],"pivot":0.50048},{"x":1135,"y":598,"w":140,"h":272,"width":28.8853,"grip":[0.7125256937307297,0.548197471434617],"pivot":0.58948},{"x":1354,"y":599,"w":170,"h":272,"width":35.075,"grip":[0.5609243697478992,0.6080182072829131],"pivot":0.53798},{"x":1567,"y":596,"w":164,"h":275,"width":33.4679,"grip":[0.8910414737058764,0.48925201380897587],"pivot":0.47074}]];
export const HOLLOW_POSES=[{"x":33,"y":23,"w":383,"h":407},{"x":467,"y":17,"w":395,"h":418},{"x":912,"y":11,"w":381,"h":414},{"x":1354,"y":21,"w":399,"h":413},{"x":23,"y":466,"w":391,"h":401},{"x":452,"y":452,"w":420,"h":419},{"x":921,"y":456,"w":377,"h":409},{"x":1360,"y":457,"w":387,"h":398}];

export function hollowStage(s){
 if(!s?.flags?.chapter2)return 0;
 return Math.max(distortionStage(s),s.flags.relayLastVoice?3:s.flags.relayPower?2:s.flags.relayCompared||s.bag?.includes('relayCopy')?1:0);
}
export const CHAPTER_TWO_HUNTERS=['hollow','listener','usher'];
export function chooseRelayHunter(roll,last){
 const pool=CHAPTER_TWO_HUNTERS.filter(k=>k!==last);
 return pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
}
export function eyeLayout(stage,t=0,reduced=false,morph=1){
 stage=Math.max(0,Math.min(3,stage||0));morph=Math.max(0,Math.min(1,morph));
 const points=[[0,-46,30],[-18,-65,16],[17,-29,16],[-28,-36,19],[29,-62,21],[-9,-88,16],[30,-14,18],[-30,-12,15],[4,-12,24]];
 return points.slice(0,[3,4,6,9][stage]).map(([x,y,h],i)=>({
  x:x+(reduced?0:Math.sin(t*.0013+i*2.5)*(4+stage*morph)),
  y:y+(reduced?0:Math.sin(t*.0019+i*1.7)*(5+stage*morph)),
  h:h*(1+(i===0?stage*.13:stage*.04)*morph),
  stretch:1+stage*.13*morph*(i%2?1:-.4),
  rotation:stage&&i>2?(i%2?-1:1)*stage*.14*morph:0,
  alpha:i>2?morph:i?.8:1
 }));
}
export function drawEyeCluster(c,img,enemy,t,reduced=false,alpha=1){
 const stage=enemy.hollowStage||0,morph=reduced?1:Math.max(0,Math.min(1,((enemy.age||0)-1.5)/3)),eyes=eyeLayout(stage,t,reduced,morph);
 c.save();c.translate(enemy.x,enemy.y);c.globalAlpha*=alpha;
 if(stage>=2&&morph>0){c.save();c.globalAlpha*=morph*.65;c.strokeStyle='#6b343a';c.lineWidth=.7;for(const p of eyes.slice(1)){c.beginPath();c.moveTo(eyes[0].x,eyes[0].y);c.bezierCurveTo(p.x+14,p.y-20,p.x-12,p.y+15,p.x,p.y);c.stroke();}c.restore();}
 for(const [i,e] of eyes.entries()){
  const gaze=enemy.target?.x<enemy.x-12?0:enemy.target?.x>enemy.x+12?2:1;
  const blink=!reduced&&(t+i*793)%5400>5200;
  const frame=enemy.motion==='lunge'?(reduced?5:4+Math.floor(t/150)%4):blink?3:stage>=2&&i>2?(i%3):gaze,p=HOLLOW_POSES[frame],w=e.h*p.w/p.h;
  c.save();c.translate(e.x,e.y);c.rotate(e.rotation);c.scale(1,e.stretch);c.globalAlpha*=e.alpha;c.drawImage(img,p.x,p.y,p.w,p.h,-w/2,-e.h/2,w,e.h);c.restore();
 }
 c.restore();
}
