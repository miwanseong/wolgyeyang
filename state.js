import { validPuzzles } from './puzzles.js?v=abbeb66692c5';
import { MAPS, canMove, worldFor, sight } from "./world.js?v=abbeb66692c5";
import { canSurrender } from "./story.js?v=abbeb66692c5";
export const VERSION = 2;
export const initial = () => ({
  version: VERSION,
  layout: 9,
  map: "lobby",
  x: 11 * 32,
  y: 20 * 32,
  stamina: 100,
  exhausted: false,
  flashlight: false,
  facing: -Math.PI / 2,
  hidden: false,
  bag: [],
  notes: [],
  flags: {storyV3:true},
  ending: null,
});
export const ITEMS = {
  notice: "서윤의 유품 보관 통지서",
  receipt: "방화문 개방 요청 접수증",
  flashlight: "손전등 · F로 켜기/끄기",
  key: "관리실 서랍 열쇠",
  fuse: "예비 퓨즈",
  tape: "녹음테이프",
  evidence: "철거 전 입주 기록",
  relayBadge: "산북중계소 기록동 출입증",
  relayCopy: "시각과 삭제 이력을 대조한 회신 사본",
  relayWheel: "냉각 밸브의 수동 핸들",
  relayExport: "원본 대조 로그와 23:44 통화를 담은 증거 매체",
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
  if(!validPuzzles(s.puzzles))throw Error("유효하지 않은 퍼즐 기록");
  const oldLayout=s.layout;
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
    s.x < 0 || s.y < 0 || s.x >= MAPS[s.map].w*32 || s.y >= MAPS[s.map].h*32 ||
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
    ![null, "witness", "return", "surrender", "signal", "fragment", "silence"].includes(s.ending) ||
    !Number.isFinite(s.stamina) ||
    s.stamina < 0 ||
    s.stamina > 100 ||
    !Number.isFinite(s.facing) ||
    typeof s.flashlight !== "boolean"
  )
    throw Error("유효하지 않은 저장 데이터");
  if(oldLayout<8 && s.flags.listened)s.flags.shutterOpen=true;
  if(!canMove(worldFor(s),s.x,s.y)) {
    if(s.layout===9)throw Error("가구 내부의 저장 위치");
    let best=null;
    const map=worldFor(s);
    for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
      const px=x*32+16,py=y*32+16,d=Math.hypot(px-s.x,py-s.y);
      if(d<=160&&canMove(map,px,py)&&(!best||d<best.d))best={x:px,y:py,d};
    }
    if(!best)throw Error("저장 위치 복원 실패");
    s.x=best.x;s.y=best.y;s.flags.relocated=true;
  }
  return { ...s, layout:9, flashlight:s.flashlight&&s.bag.includes("flashlight"), hidden: false, running: false };
}
export function unlock(s, code) {
  if (code !== "0411") return "wrong";
  if (!s.flags.power) return "power";
  s.flags.locker = true;
  take(s, "tape");
  take(s, "evidence");
  return "ok";
}
function fixtureInReach(s,o,role){
  return !!o && MAPS[s.map]?.objects.includes(o) && o.fixture===role && Math.hypot(s.x-o.x,s.y-o.y)<70 && sight(worldFor(s),s,o);
}
export function collectFuse(s,o){
  if(!fixtureInReach(s,o,'fuse-source')||o.artRole!=='toolbox'||s.flags.power||s.flags.fuseTaken||s.bag.includes('fuse'))return false;
  take(s,'fuse');s.flags.fuseTaken=true;return true;
}
export function canRepair(s,o){return fixtureInReach(s,o,'fuse-socket')&&o.artRole==='fuse-panel'&&!s.flags.power&&s.bag.includes('fuse');}
export function repair(s,o) {
  if (!canRepair(s,o)) return false;
  s.flags.power = true;
  s.flags.fuseInstalled = true;
  s.bag = s.bag.filter((k) => k !== "fuse");
  return true;
}
export function finish(s, choice) {
  if (!s.flags.shutterOpen) return false;
  if(['witness','surrender'].includes(choice)&&!canSurrender(s))return false;
  if(choice==='return'&&(!s.flags.listened||!s.bag.includes('tape')))return false;
  if (!["witness", "return", "surrender"].includes(choice)) return false;
  s.ending = choice==='witness'?'surrender':choice;
  if(choice==='return')s.flags.denial=true;
  else s.flags.chapter1Submitted=true;
  return true;
}
