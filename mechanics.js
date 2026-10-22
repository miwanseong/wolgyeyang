import { canMove, sight, findPath } from "./world.js?v=7b5bc40c7b84";
export function locomotion(s, dx, dy, sprint, dt, map) {
  const n = Math.hypot(dx, dy),
    wantsRun = !!(n && sprint && s.stamina > 0 && !s.exhausted && !s.hidden),
    oldX = s.x,
    oldY = s.y;
  if (n && !s.hidden) {
    dx /= n;
    dy /= n;
    s.facing = Math.atan2(dy, dx);
    const speed = wantsRun ? 190 : 102;
    if (canMove(map, s.x + dx * speed * dt, s.y)) s.x += dx * speed * dt;
    if (canMove(map, s.x, s.y + dy * speed * dt)) s.y += dy * speed * dt;
  }
  s.running = wantsRun && Math.hypot(s.x - oldX, s.y - oldY) > 0.001;
  if (s.running) {
    s.stamina = Math.max(0, s.stamina - dt * 26);
    if (!s.stamina) s.exhausted = true;
  } else {
    s.stamina = Math.min(100, s.stamina + dt * 17);
    if (s.stamina >= 32) s.exhausted = false;
  }
  return [s.x - oldX, s.y - oldY];
}
export class Pursuer {
  constructor() {
    this.reset();
  }
  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.path = [];
    this.repath = 0;
    this.lost = 0;
    this.alert = 0;
    this.stunned = 0;
    this.grace = 3;
    this.mode = "idle";
  }
  spawn(map, s) {
    this.reset();
    const possible = [];
    for (let y = 2; y < map.h - 2; y++)
      for (let x = 2; x < map.w - 2; x++) {
        const p = { x: x * 32 + 16, y: y * 32 + 16 },
          d = Math.hypot(p.x - s.x, p.y - s.y);
        if (
          d > 260 &&
          d < 550 &&
          canMove(map, p.x, p.y) &&
          findPath(map, p, s).length
        )
          possible.push(p);
      }
    if (!possible.length) return false;
    const p =
      possible.find((p) => !sight(map, p, s)) || possible[possible.length - 1];
    Object.assign(this, p, { active: true, mode: "search" });
    return true;
  }
  update(map, s, dt) {
    if (!this.active) return null;
    this.grace = Math.max(0, this.grace - dt);
    this.stunned = Math.max(0, this.stunned - dt);
    if (this.stunned) return null;
    const d = Math.hypot(s.x - this.x, s.y - this.y),
      visible =
        !s.hidden && d < (s.flashlight ? 300 : 180) && sight(map, this, s),
      heard = !s.hidden && s.running && d < 430;
    if (visible || heard) {
      this.alert = 1;
      this.lost = 0;
      this.mode = "chase";
      this.target = { x: s.x, y: s.y };
    } else {
      this.lost += dt;
      if (this.lost > 2) this.mode = "search";
      if ((s.hidden && this.lost > 4) || this.lost > 12) {
        this.active = false;
        this.mode = "gone";
        return "escaped";
      }
    }
    this.repath -= dt;
    if (this.target && this.repath <= 0) {
      this.path = findPath(map, this, this.target);
      this.repath = 0.45;
    }
    const next = this.path[0];
    if (next) {
      const dx = next.x - this.x,
        dy = next.y - this.y,
        dist = Math.hypot(dx, dy),
        speed = this.mode === "chase" ? 125 : 65;
      if (dist < 5) this.path.shift();
      else {
        const step = Math.min(dist, speed * dt);
        if (canMove(map, this.x + (dx / dist) * step, this.y))
          this.x += (dx / dist) * step;
        if (canMove(map, this.x, this.y + (dy / dist) * step))
          this.y += (dy / dist) * step;
      }
    }
    if (!this.grace && !s.hidden && Math.hypot(s.x - this.x, s.y - this.y) < 20)
      return "caught";
    return null;
  }
}
