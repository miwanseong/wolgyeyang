import { sight } from "./world.js?v=e60559d105cc";
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
  if (o.id === "flashlight") return 1;
  if (o.id === "player") return +!!s.flags.listened;
  return +!!s.flags["seen_" + o.id];
}
// Cardinal atlas rows: south, west, east, north. Diagonal atlas rows: SE, SW, NW, NE.
export function facingDirection(dx, dy) {
  if (Math.abs(dx) > .35 && Math.abs(dy) > .35) return dy > 0 ? (dx > 0 ? 4 : 5) : (dx < 0 ? 6 : 7);
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
}
export const PROP_SIZES = {shoe:66, chair:45, player:38, box:48, panel:63, desk:96, locker:76, bed:112, shelf:100, bench:94, cabinet:82, crates:66, rack:88, radiator:66};
export function portalAnchor(map,o) {
  if(o.kind==='stairs'||o.barrier)return {x:o.x,y:o.y};
  let best=null;
  const ox=Math.floor(o.x/32),oy=Math.floor(o.y/32);
  for(let y=oy-3;y<=oy+3;y++)for(let x=ox-3;x<=ox+3;x++){
    if(map.grid[y]?.[x]!==2)continue;
    const d=Math.hypot(x+.5-o.x/32,y+.5-o.y/32);
    if(!best||d<best.d)best={x,y,d};
  }
  return best?{x:Math.abs(best.x+.5-o.x/32)<1?o.x:best.x*32+16,y:best.y*32}:{x:o.x,y:o.y};
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
    this.fade = 1;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.ready = false;
    this.particles = [];
    this.mask = document.createElement("canvas");
    this.mask.width = canvas.width;
    this.mask.height = canvas.height;
    this.assets = Promise.all(
      [
        "assets/props-support.png?v=e60559d105cc",
        "assets/seoha-walk.png?v=e60559d105cc",
        "assets/props-painted.png?v=e60559d105cc",
        "assets/floors-painted.png?v=e60559d105cc",
        "assets/jeongwoo.png?v=e60559d105cc",
        "assets/seoha-diagonal.png?v=e60559d105cc",
        "assets/shoe-cabinet.png?v=e60559d105cc",
        "assets/chair-turn.png?v=e60559d105cc",
        "assets/room-modules.png?v=e60559d105cc",
        "assets/dining-table.png?v=e60559d105cc",
      ].map(load),
    ).then(([props, actor, painted, floors, monster, diagonal, shoeCabinet, chairSheet, roomModules, diningTable]) => {
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
  impact() {
    this.shake = this.reduced ? 0 : 0.4;
  }
  prop(o, s, t, dt) {
    const c = this.ctx,
      changed = propState(o, s);
    if (o.module) {
      c.drawImage(this.moduleTiles,o.module.col*128,o.module.row*144,128,144,o.x-32,o.y-56,64,72);
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
        const frame=o.sealed?0:o.kind==='exit'&&s.flags.listened||s.flags['seen_'+o.id]?1:0;
        const i=22+frame,sw=this.props.width/6,sh=this.props.height/4;
        c.drawImage(this.props,i%6*sw,Math.floor(i/6)*sh,sw,sh,-28,-18,56,50);
        c.fillStyle='#aaa';c.font='6px monospace';c.textAlign='center';
        c.fillText(o.kind==='exit'?'EXIT':o.barrier?'FIRE DOOR':o.id==='apartment-door'?'101':'',0,-21);
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
    if (s.flashlight && !s.hidden) {
      m.filter = "blur(7px)";
      const range = 170,
        pts = [];
      for (let a = s.facing - 0.58; a <= s.facing + 0.6; a += 0.035) {
        let d = 8;
        for (; d < range; d += 5) {
          const x = s.x + Math.cos(a) * d,
            y = s.y + Math.sin(a) * d;
          if (this.map.grid[Math.floor(y / 32)]?.[Math.floor(x / 32)] !== 1) {
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
          if (s.flashlight) {
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
          const sw = this.monster.width / 4,
            sh = this.monster.height;
          c.globalAlpha = 0.94;
          c.drawImage(
            this.monster,
            (Math.floor(t / 190) % 4) * sw,
            0,
            sw,
            sh,
            enemy.x - 34,
            enemy.y - 124,
            68,
            136,
          );
          c.globalAlpha = 1;
        },
      });
    drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());
    if (nearest && !dialog) {
      c.strokeStyle = "#ddd";
      c.lineWidth = 0.7;
      const marker=nearest.kind==="door"||nearest.kind==="exit"?portalAnchor(map,nearest):nearest;
      const y = marker.y - (["door","exit"].includes(nearest.kind)?24:nearest.mount ? 45 : 66) - Math.sin(t / 400) * 2;
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
    this.fade = Math.max(0, this.fade - dt * 1.4);
    if (this.fade) {
      c.fillStyle = `rgba(5,5,5,${this.fade})`;
      c.fillRect(0, 0, w, h);
    }
  }
}
