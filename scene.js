import { sight, opaque, closedDoorAt } from "./world.js?v=b6f6d3de2e33";
export const PROP_TYPES = [
  "desk",
  "locker",
  "panel",
  "box",
  "shoe",
  "player",
  "shelf",
  "bench",
  "notice",
  "calendar",
  "photo",
  "window",
  "chair",
  "bed",
  "cabinet",
  "crates",
  "rack",
  "radiator",
  "monitor",
];
const EXTRAS=["bench","chair","cabinet","crates","rack","radiator","notice","calendar","photo","window","monitor","door"];
const PAINTED = [
  "desk",
  "locker",
  "panel",
  "box",
  "shoe",
  "player",
  "bed",
  "shelf",
];
export function propState(o, s) {
  if (o.id === "shoe") return +s.bag.includes("key");
  if (o.id === "box") return +(s.bag.includes("fuse") || s.flags.power);
  if (o.id === "locker") return +!!s.flags.locker;
  if (o.id === "power") return +!!s.flags.power;
  if (o.id === "desk") return +!!s.flags.desk;
  if (o.id === "flashlight") return +s.bag.includes("flashlight");
  if (o.id === "player") return +!!s.flags.listened;
  return +!!s.flags["seen_" + o.id];
}
// Cardinal atlas rows: south, west, east, north. Diagonal atlas rows: SE, SW, NW, NE.
export function facingDirection(dx, dy) {
  if (Math.abs(dx) > .35 && Math.abs(dy) > .35) return dy > 0 ? (dx > 0 ? 4 : 5) : (dx < 0 ? 6 : 7);
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
}
export const PROP_SIZES = {shoe:66, chair:45, player:38, box:48, panel:63, desk:96, locker:76, bed:112, shelf:100, bench:94, cabinet:82, crates:66, rack:88, radiator:66};
export function ghostFrame(enemy,t){
 const motion=enemy.motion||'search';
 if(motion==='rise')return {row:1,col:Math.min(3,Math.floor((enemy.age||0)/1.2*4))};
 if(motion==='windup')return {row:1,col:2};
 if(motion==='lunge')return {row:2,col:Math.min(3,Math.floor((.65-enemy.rush)/.65*4))};
 return {row:motion==='crawl'?0:3,col:Math.floor(t/(motion==='crawl'?115:270))%4};
}
export function portalAnchor(map,o) {
  if(o.kind==='stairs'||o.barrier||o.internalDoor)return {x:o.x,y:o.y};
  let best=null;
  const ox=Math.floor(o.x/32),oy=Math.floor(o.y/32);
  for(let y=oy-3;y<=oy+3;y++)for(let x=ox-3;x<=ox+3;x++){
    if(map.grid[y]?.[x]!==2)continue;
    const d=Math.hypot(x+.5-o.x/32,y+.5-o.y/32);
    if(!best||d<best.d)best={x,y,d};
  }
  return best?{x:Math.abs(best.x+.5-o.x/32)<1?o.x:best.x*32+16,y:best.y*32}:{x:o.x,y:o.y};
}
export function wallFacing(map,o){
 if(o.facing)return o.facing;
 if(!o.mount&&!['door','shutter','exit'].includes(o.kind))return 'north';
 const a=['door','shutter','exit'].includes(o.kind)?portalAnchor(map,o):o,x=Math.floor(a.x/32),y=Math.floor(a.y/32);
 if(map.grid[y+1]?.[x]===1||map.grid[y-1]?.[x]===1)return 'north';
 if(map.grid[y]?.[x+1]===1)return 'east';
 if(map.grid[y]?.[x-1]===1)return 'west';
 return 'north';
}
export class Camera {
  constructor() {
    this.x = 352;
    this.y = 640;
    this.zoom = 2.15;
  }
  reset(s) {
    this.x = s.x;
    this.y = s.y;
  }
  update(s, dt, focus, reduced) {
    const f = focus ? 0.2 : 0,
      tx = s.x * (1 - f) + (focus?.x || s.x) * f,
      ty = s.y * (1 - f) + (focus?.y || s.y) * f,
      k = reduced ? 1 : 1 - Math.exp(-dt * 6);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.zoom +=
      ((focus ? 2.4 : 2.15) - this.zoom) *
      (reduced ? 1 : 1 - Math.exp(-dt * 3));
  }
}
function load(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(Error("에셋 로딩 실패: " + src));
    im.src = src;
  });
}
export class Scene {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.map = map;
    this.camera = new Camera();
    this.objectStates = new Map();
    this.chairTurns = new Map();
    this.walk = 0;
    this.moving = false;
    this.running = false;
    this.direction = 0;
    this.lastStep = 0;
    this.focus = null;
    this.shake = 0;
    this.shock = 0;
    this.fade = 1;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.ready = false;
    this.particles = [];
    this.mask = document.createElement("canvas");
    this.mask.width = canvas.width;
    this.mask.height = canvas.height;
    this.assets = Promise.all(
      [
        "assets/props-support.png?v=b6f6d3de2e33",
        "assets/seoha-walk.png?v=b6f6d3de2e33",
        "assets/props-painted.png?v=b6f6d3de2e33",
        "assets/floors-painted.png?v=b6f6d3de2e33",
        "assets/jeongwoo-motions.png?v=b6f6d3de2e33",
        "assets/seoha-diagonal.png?v=b6f6d3de2e33",
        "assets/shoe-cabinet.png?v=b6f6d3de2e33",
        "assets/chair-turn.png?v=b6f6d3de2e33",
        "assets/room-modules.png?v=b6f6d3de2e33",
        "assets/dining-table.png?v=b6f6d3de2e33",
        "assets/regional-props.png?v=b6f6d3de2e33",
        "assets/wall-side.png?v=b6f6d3de2e33",
        "assets/architecture.png?v=b6f6d3de2e33",
      ].map(load),
    ).then(([props, actor, painted, floors, monster, diagonal, shoeCabinet, chairSheet, roomModules, diningTable, regionalProps, wallSide, architecture]) => {
      Object.assign(this, {
        props,
        actor,
        painted,
        floors,
        monster,
        diagonal,
        shoeCabinet,
        chairSheet, roomModules, diningTable,
        ready: true,
      });
      const rects=[[14,58,390,270],[442,24,300,306],[825,30,220,300],[1105,10,330,325],[25,390,354,300],[425,378,330,322],[780,350,310,350],[1110,332,330,370],[10,736,430,310],[465,704,265,345],[780,714,310,336],[1123,692,305,360]];
      this.regionalTiles=rects.map(([x,y,w,h],index)=>{
        const tile=document.createElement('canvas');tile.dataset.asset='regional-'+index;tile.width=128;tile.height=Math.ceil(128*h/w);
        const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(regionalProps,x,y,w,h,0,0,tile.width,tile.height);return tile;
      });
      const cacheFrames=(im,rects)=>rects.map(([x,y,w,h])=>{const tile=document.createElement('canvas');tile.width=128;tile.height=Math.ceil(128*h/w);const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x,y,w,h,0,0,tile.width,tile.height);return tile});
      this.wallTiles=cacheFrames(wallSide,[[100,38,190,390],[545,38,225,390],[982,10,180,425],[1425,8,250,430],[105,465,215,405],[558,530,195,275],[995,460,180,414],[1416,458,205,420]]);
      this.architectureTiles=cacheFrames(architecture,[[45,30,380,392],[493,30,390,392],[970,42,280,390],[1405,16,235,438],[25,450,335,410],[455,550,420,192],[925,505,300,302],[1270,510,490,290]]);
      // Cache static tile sampling at its actual game resolution once, rather than
      // scaling large illustrations for every floor cell on every animation frame.
      const floorTiles=document.createElement('canvas');floorTiles.width=256;floorTiles.height=256;
      const fc=floorTiles.getContext('2d');fc.imageSmoothingEnabled=false;fc.drawImage(this.floors,0,0,256,256);this.floors=floorTiles;
      this.moduleTiles=document.createElement('canvas');this.moduleTiles.width=384;this.moduleTiles.height=576;
      const mc=this.moduleTiles.getContext('2d');mc.imageSmoothingEnabled=false;
      const xs=[30,364,727,1058],ys=[[30,390],[412,710],[730,1018],[1040,1410]],heights=[72,60,58,72];
      for(let row=0;row<4;row++)for(let col=0;col<3;col++)mc.drawImage(this.roomModules,xs[col],ys[row][0],xs[col+1]-xs[col],ys[row][1]-ys[row][0],col*128,row*144+144-heights[row]*2,128,heights[row]*2);
    });
  }
  begin(s, map) {
    this.map = map;
    this.camera.reset(s);
    this.fade = this.reduced ? 0 : 1;
    this.focus = null;
    this.direction = facingDirection(Math.cos(s.facing), Math.sin(s.facing));
    this.objectStates.clear();
    this.particles=[];
  }
  moved(dx, dy, dt, running) {
    this.moving = Math.hypot(dx, dy) > 0.01;
    this.running = running;
    if (this.moving) {
      this.direction =
        facingDirection(dx / Math.hypot(dx,dy), dy / Math.hypot(dx,dy));
      this.walk += dt * (running ? 11 : 6.7);
    } else this.walk = 1;
  }
  inspect(o) {
    this.focus = o;
    if (o.swivel) this.chairTurns.set(o.id, performance.now());
  }
  burst(x,y,kind='dust') {
    for(let i=0;i<(kind==='spark'?22:14);i++)this.particles.push({x,y:y-18,vx:(Math.random()-.5)*(kind==='spark'?110:65),vy:-15-Math.random()*70,life:.45+Math.random()*.55,kind});
  }
  apparition() {
    this.shock=this.reduced?0:1.3;
    this.shake=this.reduced?0:.65;
  }
  impact() {
    this.shake = this.reduced ? 0 : 0.4;
  }
  prop(o, s, t, dt) {
    const c = this.ctx,
      changed = propState(o, s);
    const facing=wallFacing(this.map,o);
    if(o.kind==='shutter'){
      const anchor=portalAnchor(this.map,o),target=s.flags.shutterOpen?1:0;
      let amount=this.objectStates.get(o.id)??target;amount+=(target-amount)*(this.reduced?1:1-Math.exp(-dt*2.5));this.objectStates.set(o.id,amount);
      const tile=this.architectureTiles[amount>.1&&amount<.85?1:0];
      c.save();c.translate(anchor.x,anchor.y);c.fillStyle='#060606';c.fillRect(-39,-27,78,70);
      c.save();c.beginPath();c.rect(-48,-32,96,Math.max(11,80*(1-amount)));c.clip();c.drawImage(tile,-48,-32,96,80);c.restore();
      c.strokeStyle='#666';c.lineWidth=3;c.beginPath();c.moveTo(-43,-28);c.lineTo(-43,43);c.moveTo(43,-28);c.lineTo(43,43);c.stroke();c.restore();return;
    }
    if(o.architecture!==undefined&&!o.sealed){
      const tile=this.architectureTiles[o.architecture],size={4:[60,74],5:[48,22],6:[48,48],7:[96,48]}[o.architecture]||[64,64];
      const y=o.kind==='studio-glass'?o.y-18:o.mount?o.y-size[1]-8:o.y+12-size[1];
      c.save();if(o.kind==='studio-glass')c.globalAlpha=.45;c.drawImage(tile,o.x-size[0]/2,y,...size);c.restore();
      if(o.kind==='studio-glass'){c.strokeStyle='#777';c.lineWidth=1;c.strokeRect(o.x-47,y+1,94,46)}
      if(o.kind==='onair'){c.fillStyle=s.flags.power?'#eee':'#555';c.fillRect(o.x-17,y+6,34,10);c.fillStyle='#222';c.font='6px monospace';c.textAlign='center';c.fillText('ON AIR',o.x,y+13)}return;
    }
    if((facing==='east'||facing==='west')&&!['door','shutter','exit'].includes(o.kind)&&['shoe','cabinet','window','photo','notice','calendar'].includes(o.kind)){
      const index=o.kind==='shoe'?changed?1:0:o.kind==='cabinet'?2:o.kind==='window'?4:5,tile=this.wallTiles[index],height=o.kind==='shoe'?72:o.kind==='cabinet'?88:o.kind==='window'?64:38,width=height*tile.width/tile.height;
      c.save();c.translate(o.x,o.y);if(facing==='west')c.scale(-1,1);c.drawImage(tile,o.mount?8:-32,12-height,width,height);c.restore();return;
    }
    if(o.regional!==undefined){
      const tile=this.regionalTiles[o.regional],width=o.regionalWidth||(o.module?64:[96,60,40,40,56,64,56,64,96,54,60,56][o.regional]),height=width*tile.height/tile.width;
      c.drawImage(tile,o.x-width/2,o.y+12-height,width,height);
      if(o.contents==='fuse'&&!s.bag.includes('fuse')&&!s.flags.power){c.fillStyle='#555';c.fillRect(o.x-7,o.y-27,14,5);c.fillStyle='#aaa';c.fillRect(o.x-7,o.y-27,3,5);c.fillRect(o.x+4,o.y-27,3,5);}
      if(o.id==='player'){
        const sw=this.painted.width/4,sh=this.painted.height/4;
        c.drawImage(this.painted,(2+(s.flags.listened?1:0))*sw,2*sh,sw,sh,o.x-14,o.y-40,28,28);
      }
      if(changed&&[8,9,11].includes(o.regional)){c.fillStyle='#aaa';c.beginPath();c.arc(o.x+width*.2,o.y-12,1,0,Math.PI*2);c.fill()}
      return;
    }
    if (o.module) {
      c.drawImage(this.moduleTiles,o.module.col*128,o.module.row*144,128,144,o.x-32,o.y-56,64,72);
      if(o.id==='flashlight'&&!s.bag.includes('flashlight')){c.save();c.translate(o.x,o.y-25);c.rotate(-.2);c.fillStyle='#333';c.fillRect(-10,-3,18,6);c.fillStyle='#999';c.beginPath();c.ellipse(8,0,2,4,0,0,Math.PI*2);c.fill();c.restore();}
      // Contents lie on a worktop and disappear only when physically collected.
      const content=o.contents==='letter'&&!s.bag.includes('notice')?'letter':o.contents==='fuse'&&!s.bag.includes('fuse')&&!s.flags.power?'fuse':null;
      if(content){
        c.save();c.translate(o.x,o.y-25);c.rotate(-.12);
        c.fillStyle=content==='letter'?'#aaa':'#555';c.fillRect(-7,-3,14,6);
        c.strokeStyle='#333';c.lineWidth=.7;c.strokeRect(-7,-3,14,6);
        if(content==='letter'){c.beginPath();c.moveTo(-6,-2);c.lineTo(0,1);c.lineTo(6,-2);c.stroke()}
        else{c.fillStyle='#aaa';c.fillRect(-7,-3,3,6);c.fillRect(4,-3,3,6)}c.restore();
      }
      if(o.id==='player'){
        const sw=this.painted.width/4,sh=this.painted.height/4;
        c.drawImage(this.painted,2*sw,2*sh,sw,sh,o.x-16,o.y-47,32,32);
      }
      if(changed){c.fillStyle='#0004';c.fillRect(o.x-27,o.y-7,54,3)}
      return;
    }
    if(o.kind==='table'){
      const sw=this.diningTable.width/2,frame=s.bag.includes('receipt')?1:0;
      c.drawImage(this.diningTable,frame*sw,0,sw,this.diningTable.height,o.x-52,o.y-53,104,80);return;
    }
    if(o.swivel){
      const elapsed=t-(this.chairTurns.get(o.id)??-10000),
        frame=elapsed<1800?Math.floor(Math.max(0,elapsed)/150)%8:s.flags['seen_'+o.id]?4:0,
        sw=this.chairSheet.width/4,sh=this.chairSheet.height/2;
      c.drawImage(this.chairSheet,(frame%4)*sw,Math.floor(frame/4)*sh,sw,sh,o.x-25,o.y-41,50,50);return;
    }
    if (["door", "stairs", "exit"].includes(o.kind)) {
      c.save();
      const anchor=portalAnchor(this.map,o);
      c.translate(anchor.x, anchor.y);
      if (o.kind === "stairs") {
        c.fillStyle = "#131313";
        c.fillRect(-43, -68, 86, 96);
        for (let i = 0; i < 9; i++) {
          c.fillStyle = i % 2 ? "#626262" : "#484848";
          c.fillRect(-38, -64 + i * 10, 76, 7);
          c.fillStyle = "#909090";
          c.fillRect(-38, -64 + i * 10, 76, 1);
        }
        c.strokeStyle = "#b0b0b0";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-43, -70);
        c.lineTo(-43, 26);
        c.moveTo(43, -70);
        c.lineTo(43, 26);
        c.stroke();
        c.font = "7px monospace";
        c.fillStyle = "#ddd";
        c.textAlign = "center";
        c.fillText(o.label || "STAIRS", 0, -73);
      } else {
        const frame=o.internalDoor?+!!s.flags['open_'+o.id]:o.sealed?0:+!!s.flags['seen_'+o.id];
        if(o.sealed){
          const side=facing==='east'||facing==='west',tile=this.architectureTiles[side?3:2];
          if(facing==='west')c.scale(-1,1);c.drawImage(tile,side?-14:-28,-24,side?30:56,64);
        }else if(facing==='east'||facing==='west'){
          if(facing==='west')c.scale(-1,1);const tile=this.wallTiles[6+frame];c.drawImage(tile,-14,o.internalDoor?-32:-20,30,64);
        }else{
          const i=22+frame,sw=this.props.width/6,sh=this.props.height/4;
          c.drawImage(this.props,i%6*sw,Math.floor(i/6)*sh,sw,sh,-28,-18,56,50);
        }
        c.fillStyle='#aaa';c.font='6px monospace';c.textAlign='center';
        c.fillText(o.barrier?'FIRE DOOR':o.id==='apartment-door'?'101':'',0,-25);

      }
      c.restore();
      return;
    }
    if (["player", "monitor"].includes(o.kind)) {
      // Small electronics sit on a desk instead of floating at floor level.
      const sw=this.painted.width/4,sh=this.painted.height/4;
      c.drawImage(this.painted,0,0,sw,sh,o.x-48,o.y-73,96,96);
    }
    const p = PAINTED.indexOf(o.kind);
    let blend = this.objectStates.get(o.id) ?? changed;
    blend += (changed - blend) * (this.reduced ? 1 : 1 - Math.exp(-dt * 12));
    this.objectStates.set(o.id, blend);
    const size =
        o.mount ? 46 : PROP_SIZES[o.kind] || 72,
      dy = o.mount ? o.y - 37 : ["player","monitor"].includes(o.kind) ? o.y-68 : o.y - size * 0.76;
    for (const [frame, alpha] of [
      [0, 1 - blend],
      [1, blend],
    ]) {
      if (alpha < 0.001) continue;
      c.globalAlpha = alpha;
      if (o.kind === "shoe") {
        const sw=this.shoeCabinet.width/2;
        c.drawImage(this.shoeCabinet,frame*sw,0,sw,this.shoeCabinet.height,o.x-size/2,dy,size,size);
      } else if (p >= 0) {
        const i = p * 2 + frame,
          sw = this.painted.width / 4,
          sh = this.painted.height / 4;
        c.drawImage(
          this.painted,
          (i % 4) * sw,
          Math.floor(i / 4) * sh,
          sw,
          sh,
          o.x - size / 2,
          dy,
          size,
          size,
        );
      } else {
        const n = Math.max(0, EXTRAS.indexOf(o.kind)) * 2 + frame;
        c.drawImage(
          this.props,
          (n % 6) * (this.props.width/6),
          Math.floor(n / 6) * (this.props.height/4),
          this.props.width/6,
          this.props.height/4,
          o.x - size / 2,
          dy,
          size,
          size,
        );
      }
    }
    c.globalAlpha = 1;
    if (o.id === "power" && s.flags.power) {
      c.fillStyle = "#e1e1e1";
      c.shadowColor = "#fff";
      c.shadowBlur = 8;
      c.fillRect(o.x + 8, o.y - 16, 3, 2);
      c.shadowBlur = 0;
    }
    if (o.id === "player" && s.flags.listened) {
      for (const x of [-12, 1]) {
        c.save();
        c.translate(o.x + x, o.y - 19);
        c.rotate(t / 340);
        c.strokeStyle = "#ccc";
        c.beginPath();
        c.moveTo(-3, 0);
        c.lineTo(3, 0);
        c.stroke();
        c.restore();
      }
    }
  }
  light(s, camX, camY, z, enemy, t) {
    const m = this.mask.getContext("2d"),
      w = this.mask.width,
      h = this.mask.height,
      px = (s.x - camX) * z,
      py = (s.y - camY) * z;
    m.clearRect(0, 0, w, h);
    m.globalCompositeOperation = "source-over";
    m.fillStyle = "rgba(0,0,0,.88)";
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = "destination-out";
    const ambient = m.createRadialGradient(
      px,
      py,
      9,
      px,
      py,
      (s.hidden ? 16 : s.flashlight ? 86 : 42) * z,
    );
    ambient.addColorStop(0, "#ffffffdd");
    ambient.addColorStop(0.55, "#ffffffbb");
    ambient.addColorStop(1, "#fff0");
    m.fillStyle = ambient;
    m.fillRect(0, 0, w, h);
    if (s.flashlight && s.bag.includes("flashlight") && !s.hidden) {
      m.filter = "blur(7px)";
      const range = 170,
        pts = [];
      for (let a = s.facing - 0.58; a <= s.facing + 0.6; a += 0.035) {
        let d = 8;
        for (; d < range; d += 5) {
          const x = s.x + Math.cos(a) * d,
            y = s.y + Math.sin(a) * d;
          if (opaque(this.map,Math.floor(x/32),Math.floor(y/32))||closedDoorAt(this.map,x,y)) {
            d += 18;
            break;
          }
        }
        pts.push([
          (s.x + Math.cos(a) * d - camX) * z,
          (s.y + Math.sin(a) * d - camY) * z,
        ]);
      }
      m.beginPath();
      m.moveTo(px, py);
      pts.forEach((p) => m.lineTo(...p));
      m.closePath();
      const g = m.createRadialGradient(px, py, 8, px, py, range * z);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.55, "#fffffff0");
      g.addColorStop(0.9, "#ffffff77");
      g.addColorStop(1, "#fff0");
      m.fillStyle = g;
      m.fill();
    }
    m.filter = "none";
    m.globalCompositeOperation = "source-over";
    this.ctx.drawImage(this.mask, 0, 0);
    if (enemy?.active) {
      const d = Math.hypot(enemy.x - s.x, enemy.y - s.y);
      if (d < 190) {
        const g = this.ctx.createRadialGradient(
          w / 2,
          h / 2,
          h * 0.25,
          w / 2,
          h / 2,
          h * 0.85,
        );
        g.addColorStop(0, "#fff0");
        g.addColorStop(
          1,
          `rgba(120,120,120,${(0.08 + Math.sin(t / 100) * 0.02) * (1 - d / 240)})`,
        );
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, w, h);
      }
    }
  }
  draw(s, t, dt, nearest, dialog, enemy) {
    if (!this.ready) return;
    const c = this.ctx,
      w = this.canvas.width,
      h = this.canvas.height,
      map = this.map;
    this.camera.update(s, dt, dialog ? this.focus : null, this.reduced);
    const z = this.camera.zoom,
      vw = w / z,
      vh = h / z;
    let cx = Math.max(0, Math.min(map.w * 32 - vw, this.camera.x - vw / 2)),
      cy = Math.max(0, Math.min(map.h * 32 - vh, this.camera.y - vh / 2));
    this.shake = Math.max(0, this.shake - dt);
    if (this.shake) {
      cx += Math.sin(t * 0.07) * this.shake * 4;
      cy += Math.cos(t * 0.08) * this.shake * 3;
    }
    this.view = { cx, cy, z };
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#060606";
    c.fillRect(0, 0, w, h);
    c.save();
    c.scale(z, z);
    c.translate(-cx, -cy);
    const row = { stone: 0, wood: 1, concrete: 2, carpet: 3 }[map.floor] || 0,
      sw = this.floors.width / 4,
      sh = this.floors.height / 4;
    for (
      let y = Math.max(0, Math.floor(cy / 32) - 2);
      y < Math.min(map.h, Math.ceil((cy + vh) / 32) + 2);
      y++
    )
      for (
        let x = Math.max(0, Math.floor(cx / 32) - 1);
        x < Math.min(map.w, Math.ceil((cx + vw) / 32) + 1);
        x++
      ) {
        const v = map.grid[y][x];
        if (v === 1) {
          const i = (x * 7 + y * 11) % 4;
          c.drawImage(
            this.floors,
            i * sw,
            (map.id === "upper" && x >= 26 && y < 17
              ? 3
              : map.id === "apartment" && x >= 18 && y < 18
                ? 0
                : row) * sh,
            sw,
            sh,
            x * 32,
            y * 32,
            32,
            32,
          );
        } else if (v === 2 && map.glassCells?.has(x+","+y)) {
          c.fillStyle="#121212";c.fillRect(x*32,y*32,32,32);
        } else if (v === 2) {
          const floorBelow=map.grid[y+1]?.[x]===1,floorAbove=map.grid[y-1]?.[x]===1;
          if(floorBelow){
            c.drawImage(this.floors,((x+y)%4)*sw,2*sh,sw,sh,x*32,y*32-18,32,50);
            c.fillStyle='#0006';c.fillRect(x*32,y*32-18,32,50);
            c.fillStyle='#777';c.fillRect(x*32,y*32-18,32,4);
            c.fillStyle='#999';c.fillRect(x*32,y*32-18,32,1);
            c.fillStyle='#252525';c.fillRect(x*32,y*32+24,32,8);
            c.fillStyle='#0007';c.fillRect(x*32,y*32+30,32,11);
          }else{
            c.drawImage(this.floors,((x+y)%4)*sw,2*sh,sw,sh,x*32,y*32,32,32);
            c.fillStyle='#0009';c.fillRect(x*32,y*32,32,32);
            // Side walls have continuous vertical edges, not a stair-like cap per tile.
            if(map.grid[y]?.[x+1]===1){c.fillStyle='#4c4c4c';c.fillRect(x*32+25,y*32,7,32);c.fillStyle='#747474';c.fillRect(x*32+30,y*32,2,32)}
            if(map.grid[y]?.[x-1]===1){c.fillStyle='#4c4c4c';c.fillRect(x*32,y*32,7,32);c.fillStyle='#747474';c.fillRect(x*32,y*32,2,32)}
            if(floorAbove){c.fillStyle='#626262';c.fillRect(x*32,y*32,32,5);c.fillStyle='#888';c.fillRect(x*32,y*32,32,1)}
          }
        }
      }
    if (s.map === "basement") {
      c.fillStyle = "#ffffff10";
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        c.ellipse((7 + k * 5) * 32, 20 * 32, 24 + (k % 2) * 12, 7, 0, 0, 7);
        c.fill();
      }
    }
    // Architectural room treatments, each aligned to the same tile grid as the furniture.
    const rugs={management:[[7,8,6,5]],apartment:[[11,6,6,5],[21,9,6,4]],upper:[[30,9,6,5]]}[map.id]||[];
    for(const [rx,ry,rw,rh] of rugs){
      for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++)c.drawImage(this.floors,sw,3*sh,sw,sh,(rx+xx)*32,(ry+yy)*32,32,32);
      c.strokeStyle='#9996';c.lineWidth=1;c.strokeRect(rx*32+4,ry*32+4,rw*32-8,rh*32-8);
    }
    // Low-contrast floor treatments tie furniture groups to the architecture.
    for (const o of map.objects) {
      if (o.module || !["bed","desk","bench","shelf","rack","locker"].includes(o.kind)) continue;
      const width=(PROP_SIZES[o.kind] || 72)*.9;
      if (["management","apartment"].includes(map.id) && ["desk","bed","bench"].includes(o.kind)) {
        const rw=o.kind==="bed"?112:128,rh=o.kind==="bed"?144:104;
        c.save();c.globalAlpha=.62;
        c.drawImage(this.floors,sw,3*sh,sw,sh,o.x-rw/2,o.y-42,rw,rh);
        c.strokeStyle="#a0a0a055";c.lineWidth=2;c.strokeRect(o.x-rw/2+4,o.y-38,rw-8,rh-8);c.restore();
      }
      c.fillStyle=map.id==="basement"?"#00000025":"#10101055";
      c.fillRect(Math.round(o.x-width/2),Math.round(o.y-10),width,22);
      if (["bed","desk"].includes(o.kind)) {
        c.fillStyle="#88888822";c.fillRect(o.x-width/2+3,o.y+13,width-6,2);
        c.fillStyle="#09090955";c.fillRect(o.x-width/2,o.y+18,width,2);
      }
    }
    for (const o of map.objects.filter(o=>o.kind==="stairs")) this.prop(o,s,t,dt);
    const drawables = map.objects.filter(o=>o.kind!=="stairs").map((o) => ({
      y: o.y,
      draw: () => this.prop(o, s, t, dt),
    }));
    if (!s.hidden)
      drawables.push({
        y: s.y,
        draw: () => {
          c.fillStyle = "#0008";
          c.beginPath();
          c.ellipse(s.x, s.y + 5, 11, 4, 0, 0, 7);
          c.fill();
          const f = this.moving ? Math.floor(this.walk) % 4 : 1,
            atlas = this.direction >= 4 ? this.diagonal : this.actor,
            sw = atlas.width / 4,
            sh = atlas.height / 4;
          c.drawImage(
            atlas,
            f * sw,
            (this.direction % 4) * sh,
            sw,
            sh,
            s.x - 35,
            s.y - 62,
            70,
            70,
          );
          if (s.flashlight && s.bag.includes("flashlight")) {
            // A small shaded cylindrical torch attached to the hand, not a white marker.
            c.save();c.translate(s.x+(Math.cos(s.facing)<-.2?-11:11),s.y-22);c.rotate(s.facing);
            c.fillStyle='#303030';c.beginPath();c.roundRect(-4,-1.5,10,3,1.5);c.fill();
            c.fillStyle='#777';c.beginPath();c.ellipse(6,0,1,2,0,0,Math.PI*2);c.fill();c.restore();
          }
        },
      });
    if (enemy?.active)
      drawables.push({
        y: enemy.y,
        draw: () => {
          const frame=ghostFrame(enemy,t),sw=this.monster.width/4,
            bounds=[0,.226,.498,.708,1],grounds=[.222,.49,.704,.977],
            sy=bounds[frame.row]*this.monster.height,sh=(bounds[frame.row+1]-bounds[frame.row])*this.monster.height,
            scale=112/sw,ground=(grounds[frame.row]*this.monster.height-sy)*scale;
          c.save();c.translate(enemy.x,enemy.y);
          if(enemy.target?.x<enemy.x)c.scale(-1,1);
          c.globalAlpha=Math.min(.98,.15+(enemy.age||0)*.7);
          c.drawImage(this.monster,frame.col*sw,sy,sw,sh,-56,-ground,112,sh*scale);
          c.restore();
          c.globalAlpha = 1;
        },
      });
    drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());
    if (nearest && !dialog) {
      c.strokeStyle = "#ddd";
      c.lineWidth = 0.7;
      const marker=nearest.kind==="door"||nearest.kind==="exit"?portalAnchor(map,nearest):nearest;
      const y = marker.y - (["door","exit","shutter"].includes(nearest.kind)?24:nearest.mount ? 45 : 66) - Math.sin(t / 400) * 2;
      c.beginPath();
      c.moveTo(marker.x - 4, y);
      c.lineTo(marker.x, y + 3);
      c.lineTo(marker.x + 4, y);
      c.stroke();
    }
    this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;c.globalAlpha=Math.max(0,Math.min(1,p.life*1.7));c.fillStyle=p.kind==='spark'?'#eee':'#aaa';c.fillRect(p.x,p.y,p.kind==='glass'?3:1,p.kind==='glass'?1:2)}c.globalAlpha=1;
    c.restore();
    this.light(s, cx, cy, z, enemy, t);
    this.shock=Math.max(0,this.shock-dt);
    if(this.shock){
      const intensity=this.shock/1.3;
      c.fillStyle=`rgba(0,0,0,${intensity*.45})`;c.fillRect(0,0,w,h);
      c.strokeStyle=`rgba(190,190,190,${intensity*.13})`;c.lineWidth=1;
      for(let i=0;i<5;i++){c.beginPath();c.moveTo(w*(i+.3)/5,0);c.lineTo(w*(i+.4)/5,h*.13*intensity);c.stroke()}
    }
    this.fade = Math.max(0, this.fade - dt * 1.4);
    if (this.fade) {
      c.fillStyle = `rgba(5,5,5,${this.fade})`;
      c.fillRect(0, 0, w, h);
    }
  }
}
