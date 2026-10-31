import {MEMENTOS} from './mementos.js?v=0551c272401d';
import {canPreserve} from './chapter1-route.js?v=0551c272401d';
import {bodyState,validBody,pickupBlocked} from './body.js?v=0551c272401d';
import {validInvestigation} from './investigation.js?v=0551c272401d';
import { validPuzzles, reconcilePuzzles } from './puzzles.js?v=0551c272401d';
import { MAPS, canMove, worldFor, sight } from "./world.js?v=0551c272401d";
import { STORY, canSurrender,canSeekOriginal } from "./story.js?v=0551c272401d";
export const VERSION = 2;
export const initial = () => ({
  version: VERSION,
  layout: 18,
  map: "lobby",
  x: 11 * 32,
  y: 20 * 32,
  body: {leg:false,arm:false},
  omenVisits: {},
  relayExposure:0,
  stamina: 100,
  exhausted: false,
  flashlight: false,
  facing: -Math.PI / 2,
  hidden: false,
  bag: [],
  notes: [],
  flags: {storyV3:true,storyFlowV1:true,explorationV1:true},
  ending: null,
});
export const ITEMS = {
 boltSketch:'미정의 빗장 위치 스케치',
 spareLight:'방수 포장의 예비 작업등',
 laundryKey:'공동 세탁실 열쇠',rearKey:'후면 현관 열쇠',partsKey:'밀봉 부품실 열쇠',deckCoupler:'원본 데크용 회선 어댑터',courtSlip:'서윤의 세탁 인수표',knotThreadService:'매듭실 · 반환 비품함',
 relayAuditKey:'원본 보관대의 대조실 비품 열쇠',
  knotThreadMemoryFirst:'매듭실 · 모아 둔 기억',knotThreadMemoryComplete:'매듭실 · 되찾은 일상',
  ...Object.fromEntries(Object.entries(MEMENTOS).map(([id,m])=>[id,m.name])),
  editPass:'부분 사본 편집 관리카드',
  restoredRoster:'복원한 야간 근무·인계표 원본',
  serviceKey:'관리인 공용 마스터키',unit104Key:'104호 출입 열쇠',archiveKey:'서윤의 봉투 보관함 열쇠',lighter:'라이터',rosterScrap:'찢어진 근무표 조각',inspectionPhotos:'104호 점검 사진 원본과 촬영 일지',
  knotThread:"매듭실",
  knotThreadSecond:"매듭실 · 남은 한 타래",
  knotThreadPacked:"매듭실 · 이삿짐 속 실타래",
  knotThreadStored:"매듭실 · 보관 상자의 실타래",
  auditMemo: "숨김 전 수신 목록 탄소 사본",
  pumpLog: "사고 당일 펌프 정지 운전표",
  notice: "서윤의 유품 보관 통지서",
  receipt: "방화문 개방 요청 접수증",
  flashlight: "손전등 · F로 켜기/끄기",
  key: "관리실 서랍 열쇠",
  fuse: "예비 퓨즈",
  tape: "녹음테이프",
  evidence: "철거 전 입주 기록",
  relayBadge: "산북중계소 기록동 출입증",
  relayCopy: "접수·취소·잠금 유지 시각 대조 사본",
  relayWheel: "냉각 밸브의 수동 핸들",
  relayExport: "원본 대조 로그와 23:44 통화를 담은 증거 매체",
};
export function take(s, key) {
  if(pickupBlocked(s))return false;if (!s.bag.includes(key))s.bag.push(key);return true;
}
export function note(s, id, text) {
  if (!s.notes.some((n) => n.id === id)) s.notes.push({ id, text });
}
export function restore(raw) {
  let s = JSON.parse(raw);
  // Migrate our earlier numeric omen counters out of the boolean story flags.
  if(s?.flags&&typeof s.flags==='object'&&!Array.isArray(s.flags))for(const key of Object.keys(s.flags))if(key.startsWith('room_omens_')&&Number.isInteger(s.flags[key])&&s.flags[key]>=0){s.omenVisits={...s.omenVisits,[key.slice(11)]:s.flags[key]};delete s.flags[key];}
  if(s?.relayTrapElapsed!==undefined&&(!Number.isFinite(s.relayTrapElapsed)||s.relayTrapElapsed<0||s.relayTrapElapsed>60))throw Error('유효하지 않은 잠금 이벤트');
  if(s?.npcScreamAt!==undefined&&(!Number.isFinite(s.npcScreamAt)||s.npcScreamAt<0||s.npcScreamAt>86400))throw Error('유효하지 않은 비명 기록');
  if(s?.relayExposure!==undefined&&(!Number.isFinite(s.relayExposure)||s.relayExposure<0||s.relayExposure>86400))throw Error('유효하지 않은 체류 시간');
  if(!validBody(s?.body))throw Error('유효하지 않은 신체 상태');
  if(s?.omenVisits!==undefined&&(!s.omenVisits||typeof s.omenVisits!=='object'||Array.isArray(s.omenVisits)||!Object.entries(s.omenVisits).every(([key,value])=>Object.hasOwn(MAPS,key)&&Number.isInteger(value)&&value>=0&&value<=1000000)))throw Error('유효하지 않은 잔상 기록');
  if (!s || ![1, VERSION].includes(s.version))
    throw Error("지원하지 않는 기억");
  if(!validPuzzles(s.puzzles))throw Error("유효하지 않은 퍼즐 기록");
  if(!validInvestigation(s.investigation))throw Error("유효하지 않은 조사 판정 기록");
  reconcilePuzzles(s);
  if(s.flags&&['lighter','phone',null].includes(s.flags.temporaryLight)){s.flags.temporaryLighter=s.flags.temporaryLight==='lighter';s.flags.temporaryPhone=s.flags.temporaryLight==='phone';delete s.flags.temporaryLight;}
  if(s.crowdRemains!==undefined&&(!Array.isArray(s.crowdRemains)||s.crowdRemains.length>32||!s.crowdRemains.every(r=>r&&MAPS[r.map]&&Number.isInteger(r.index)&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.x>=0&&r.y>=0&&r.x<MAPS[r.map].w*32&&r.y<MAPS[r.map].h*32)))throw Error('손상된 목격 기록');
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
    ![null, "witness", "return", "surrender", "signal", "fragment", "silence", "preserve"].includes(s.ending) ||
    !Number.isFinite(s.stamina) ||
    s.stamina < 0 ||
    s.stamina > 100 ||
    !Number.isFinite(s.facing) ||
    typeof s.flashlight !== "boolean"
  )
    throw Error("유효하지 않은 저장 데이터");
  // Retire our obsolete generated104 remote-call note; the new route requires the physical photograph source.
  if(s.notes.some(n=>n.id==='104-ledger'))s.notes=s.notes.filter(n=>n.id!=='104-ledger');
  if(oldLayout<8 && s.flags.listened)s.flags.shutterOpen=true;
  if(!canMove(worldFor(s),s.x,s.y)) {
    if(s.layout===18)throw Error("가구 내부의 저장 위치");
    let best=null;
    const map=worldFor(s);
    for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
      const px=x*32+16,py=y*32+16,d=Math.hypot(px-s.x,py-s.y);
      if(d<=(s.map==='relayStore'?384:160)&&canMove(map,px,py)&&(!best||d<best.d))best={x:px,y:py,d};
    }
    if(!best)throw Error("저장 위치 복원 실패");
    s.x=best.x;s.y=best.y;s.flags.relocated=true;
  }
  return { ...s, layout:18, body:bodyState(s),omenVisits:s.omenVisits||{},flashlight:s.flashlight&&!s.flags.lightStowed&&s.bag.includes("flashlight")&&bodyState(s).arms<2, hidden: false, hideSpot:null, running: false };
}
export function unlock(s, code) {
  if (code !== "0411") return "wrong";
  if (!s.flags.power) return "power";
  s.flags.locker = true;
  take(s, "tape");
  take(s, "evidence");
  take(s, "receipt");
  if(!s.notes.some(n=>n.id==='receipt'))s.notes.push({id:'receipt',text:STORY.receipt});
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
  if(choice==='return'&&!canSeekOriginal(s))return false;
  if(choice==='preserve'&&!canPreserve(s))return false;
  if (!["witness", "return", "surrender","preserve"].includes(choice)) return false;
  s.ending = choice==='witness'?'surrender':choice;
  if(choice==='return')s.flags.denial=true;
  else s.flags.chapter1Submitted=true;
  return true;
}
