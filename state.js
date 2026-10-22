import { MAPS, canMove } from "./world.js?v=7b5bc40c7b84";
export const VERSION = 2;
export const initial = () => ({
  version: VERSION,
  map: "lobby",
  x: 11 * 32,
  y: 20 * 32,
  stamina: 100,
  exhausted: false,
  flashlight: true,
  facing: -Math.PI / 2,
  hidden: false,
  bag: ["flashlight"],
  notes: [],
  flags: {},
  ending: null,
});
export const ITEMS = {
  flashlight: "손전등 · F로 켜기/끄기",
  key: "관리실 열쇠",
  fuse: "예비 퓨즈",
  tape: "녹음테이프",
  evidence: "철거 전 입주 기록",
};
export function take(s, key) {
  if (!s.bag.includes(key)) s.bag.push(key);
}
export function note(s, id, text) {
  if (!s.notes.some((n) => n.id === id)) s.notes.push({ id, text });
}
export function restore(raw) {
  let s = JSON.parse(raw);
  if (!s || ![1, VERSION].includes(s.version))
    throw Error("지원하지 않는 기억");
  if (s.version === 1) {
    s = {
      ...initial(),
      bag: s.bag,
      notes: s.notes,
      flags: { ...s.flags, migrated: true },
      ending: s.ending,
    };
    take(s, "flashlight");
  }
  if (
    !MAPS[s.map] ||
    !Number.isFinite(s.x) ||
    !Number.isFinite(s.y) ||
    !canMove(MAPS[s.map], s.x, s.y) ||
    !Array.isArray(s.bag) ||
    !s.bag.every((k) => Object.hasOwn(ITEMS, k)) ||
    !Array.isArray(s.notes) ||
    !s.notes.every(
      (n) => n && typeof n.id === "string" && typeof n.text === "string",
    ) ||
    !s.flags ||
    typeof s.flags !== "object" ||
    Array.isArray(s.flags) ||
    !Object.values(s.flags).every((v) => typeof v === "boolean") ||
    ![null, "witness", "return"].includes(s.ending) ||
    !Number.isFinite(s.stamina) ||
    s.stamina < 0 ||
    s.stamina > 100 ||
    !Number.isFinite(s.facing) ||
    typeof s.flashlight !== "boolean"
  )
    throw Error("유효하지 않은 저장 데이터");
  return { ...s, hidden: false, running: false };
}
export function unlock(s, code) {
  if (code !== "0411") return "wrong";
  if (!s.flags.power) return "power";
  s.flags.locker = true;
  take(s, "tape");
  take(s, "evidence");
  return "ok";
}
export function repair(s) {
  if (!s.bag.includes("fuse")) return false;
  s.flags.power = true;
  s.bag = s.bag.filter((k) => k !== "fuse");
  return true;
}
export function finish(s, choice) {
  if (!s.flags.listened || !s.bag.includes("evidence")) return false;
  if (!["witness", "return"].includes(choice)) return false;
  s.ending = choice;
  return true;
}
