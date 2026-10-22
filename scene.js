import { sight } from "./world.js?v=fc53a15ca23c";
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
        "assets/props-support.png?v=fc53a15ca23c",
        "assets/seoha-walk.png?v=fc53a15ca23c",
        "assets/props-painted.png?v=fc53a15ca23c",
        "assets/floors-painted.png?v=fc53a15ca23c",
        "assets/jeongwoo.png?v=fc53a15ca23c",
      ].map(load),
    ).then(([props, actor, painted, floors, monster]) => {
      Object.assign(this, {
        props,
        actor,
        painted,
        floors,
        monster,
        ready: true,
      });
    });
  }
  begin(s, map) {
    this.map = map;
    this.camera.reset(s);
    this.fade = this.reduced ? 0 : 1;
    this.focus = null;
    this.direction =
      Math.abs(Math.cos(s.facing)) > Math.abs(Math.sin(s.facing))
        ? Math.cos(s.facing) < 0
          ? 1
          : 2
        : Math.sin(s.facing) < 0
          ? 3
          : 0;
    this.objectStates.clear();
    this.particles=[];
  }
  moved(dx, dy, dt, running) {
    this.moving = Math.hypot(dx, dy) > 0.01;
    this.running = running;
    if (this.moving) {
      this.direction =
        Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
      this.walk += dt * (running ? 11 : 6.7);
    } else this.walk = 1;
  }
  inspect(o) {
    this.focus = o;
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
    if (["door", "stairs", "exit"].includes(o.kind)) {
      c.save();
      c.translate(o.x, o.y);
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
        const frame=o.kind==='exit'&&s.flags.listened||s.flags['seen_'+o.id]?1:0;
        const i=22+frame,sw=this.props.width/6,sh=this.props.height/4;
        c.drawImage(this.props,i%6*sw,Math.floor(i/6)*sh,sw,sh,-42,-81,84,100);
        c.fillStyle='#aaa';c.font='6px monospace';c.textAlign='center';
        c.fillText(o.kind==='exit'?'EXIT':o.barrier?'FIRE DOOR':o.id==='apartment-door'?'101':'',0,-84);
      }
      c.restore();
      return;
    }
    const p = PAINTED.indexOf(o.kind);
    let blend = this.objectStates.get(o.id) ?? changed;
    blend += (changed - blend) * (this.reduced ? 1 : 1 - Math.exp(-dt * 12));
    this.objectStates.set(o.id, blend);
    const size =
        o.kind === "bed" ? 114 : o.kind === "bench" ? 93 : o.mount ? 54 : 88,
      dy = o.mount ? o.y - 37 : o.y - size * 0.76;
    for (const [frame, alpha] of [
      [0, 1 - blend],
      [1, blend],
    ]) {
      if (alpha < 0.001) continue;
      c.globalAlpha = alpha;
      if (p >= 0) {
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
    m.fillStyle = "#000";
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = "destination-out";
    const ambient = m.createRadialGradient(
      px,
      py,
      9,
      px,
      py,
      (s.hidden ? 16 : 54) * z,
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
          c.drawImage(this.floors,((x+y)%4)*sw,2*sh,sw,sh,x*32,y*32-18,32,50);
          c.fillStyle='#0006';c.fillRect(x*32,y*32-18,32,50);
          c.fillStyle='#777';c.fillRect(x*32,y*32-18,32,4);
          c.fillStyle='#999';c.fillRect(x*32,y*32-18,32,1);
          c.fillStyle='#252525';c.fillRect(x*32,y*32+24,32,8);
          if (map.grid[y + 1]?.[x] === 1) {
            c.fillStyle = "#0007";
            c.fillRect(x * 32, y * 32 + 30, 32, 11);
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
    const drawables = map.objects.map((o) => ({
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
            sw = this.actor.width / 4,
            sh = this.actor.height / 4;
          c.drawImage(
            this.actor,
            f * sw,
            this.direction * sh,
            sw,
            sh,
            s.x - 35,
            s.y - 62,
            70,
            70,
          );
          if (s.flashlight) {
            c.fillStyle = "#ddd";
            c.fillRect(
              s.x + Math.cos(s.facing) * 12 - 2,
              s.y - 15 + Math.sin(s.facing) * 8,
              4,
              6,
            );
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
      const y = nearest.y - (nearest.mount ? 45 : 66) - Math.sin(t / 400) * 2;
      c.beginPath();
      c.moveTo(nearest.x - 4, y);
      c.lineTo(nearest.x, y + 3);
      c.lineTo(nearest.x + 4, y);
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
