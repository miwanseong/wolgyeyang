import {drawFloorOmen,omenOpacity} from './haunting.js?v=f48a4f17ba23';
import {advanceGait,drawSide,sideGrip,actorStride} from './gait.js?v=f48a4f17ba23';
import {PLAYER_POSES,playerHand} from './player-art.js?v=f48a4f17ba23';
import {LAMPS,lampStrength,PUDDLES} from './facility.js?v=f48a4f17ba23';
import {facilityArt} from './facility-art.js?v=f48a4f17ba23';
import { sight, opaque, closedDoorAt, doorOpen, fixtureVisual, wallAnchor } from "./world.js?v=f48a4f17ba23";
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
// Knuckle anchors measured in all32 adult walking poses, including both diagonal front views.
export function handGrip(direction,frame){return playerHand(direction,frame);}
export const PROP_SIZES = {shoe:66, chair:45, player:38, box:48, panel:63, desk:96, locker:76, bed:112, shelf:100, bench:94, cabinet:82, crates:66, rack:88, radiator:66};
export function ghostFrame(enemy,t){
 const motion=enemy.motion||'search';
 if(motion==='rise')return {row:1,col:Math.min(3,Math.floor((enemy.age||0)/1.2*4))};
 if(motion==='windup')return {row:1,col:2};
 if(motion==='lunge')return {row:2,col:Math.min(3,Math.floor((.65-enemy.rush)/.65*4))};
 return {row:motion==='crawl'?0:3,col:Math.floor(t/(motion==='crawl'?115:270))%4};
}
export const portalAnchor = wallAnchor;
// Wall artwork occupies opaque cells only; floor tiles never become a canvas for a door.
export function wallFace(map,x,y,facing){
 const south=facing==='south',edge=(y+(south?0:1))*32;
 let height=0;
 for(let d=0;d<72;d++){
  const yy=Math.floor((edge+(south?d:-d-1))/32);
  if(map.grid[yy]?.[x]===1)break;
  height++;
 }
 return {y:south?edge:edge-height,h:height};
}
export function mountedGeometry(map,o,width,height){
 const facing=wallFacing(map,o),side=facing==='east'||facing==='west';
 const row=Math.floor(o.y/32),col=Math.floor(o.x/32),face=wallFace(map,col,row,facing);
 const scale=Math.min(1,Math.max(8,face.h-12)/height),w=width*scale,h=height*scale;
 if(side){const sw=Math.min(18,w),edge=(facing==='east'?col+1:col)*32;return {x:edge-(facing==='east'?12:6),y:o.y-Math.min(h,30)/2,w:sw,h:Math.min(h,30)};}
 return {x:o.x-w/2,y:face.y+(face.h-h)/2,w,h};
}
export function fuseInsertionFrame(p){const t=Math.max(0,Math.min(1,(p-.15)/.65)),e=t*t*(3-2*t);return {x:e===1?0:-130*(1-e),y:65*(1-e),seated:t>=1};}
export function torchHitsSurface(map,s,o){
 if(!s.flashlight||!s.bag.includes('flashlight')||s.hidden||!(o.mount||['door','shutter'].includes(o.kind)))return false;
 const dx=o.x-s.x,dy=o.y-s.y,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)-s.facing;
 return d<175&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.68&&sight(map,s,o);
}
export function doorGeometry(map,o){
 const facing=wallFacing(map,o),side=facing==='east'||facing==='west',span=o.aperture||32;
 const a=portalAnchor(map,o),face=wallFace(map,Math.floor(a.x/32),Math.floor(a.y/32),facing);
 if(!side&&!o.internalDoor)return {side:false,facing,span,width:span+8,height:face.h,dx:-(span+8)/2,dy:face.y-a.y};
 return {side,facing,span,width:side?30:span+8,height:side?span+40:72,dx:side?-15:-(span+8)/2,dy:side?-span-8:-56};
}
export function wallFacing(map,o){
 if(o.facing)return o.facing;
 if(!o.mount&&!['door','shutter','exit'].includes(o.kind))return 'north';
 const a=['door','shutter','exit'].includes(o.kind)?portalAnchor(map,o):o,x=Math.floor(a.x/32),y=Math.floor(a.y/32);
 if(map.grid[y+1]?.[x]===1)return 'north';
 if(map.grid[y-1]?.[x]===1)return 'south';
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
    this.reflections=[];this.installation=null;this.dread=null;this.echo=null;
    this.mask = document.createElement("canvas");
    this.mask.width = canvas.width;
    this.mask.height = canvas.height;
    this.facilityTiles=facilityArt();this.npcs=[];
    this.assets = Promise.all(
      [
        "assets/props-support.png?v=f48a4f17ba23",
        "assets/seoha-walk.png?v=f48a4f17ba23",
        "assets/props-painted.png?v=f48a4f17ba23",
        "assets/floors-painted.png?v=f48a4f17ba23",
        "assets/jeongwoo-motions.png?v=f48a4f17ba23",
        "assets/seoha-diagonal.png?v=f48a4f17ba23",
        "assets/shoe-cabinet.png?v=f48a4f17ba23",
        "assets/chair-turn.png?v=f48a4f17ba23",
        "assets/room-modules.png?v=f48a4f17ba23",
        "assets/dining-table.png?v=f48a4f17ba23",
        "assets/regional-props.png?v=f48a4f17ba23",
        "assets/wall-side.png?v=f48a4f17ba23",
        "assets/architecture.png?v=f48a4f17ba23",
        "assets/technical-kit.png?v=f48a4f17ba23",
        "assets/technical-doors.png?v=f48a4f17ba23",
        "assets/kitchen-kit.png?v=f48a4f17ba23",
        "assets/decor-kit.png?v=f48a4f17ba23",
        "assets/supply-kit.png?v=f48a4f17ba23",
        "assets/room-details.png?v=f48a4f17ba23",
        "assets/seoyun-echo.png?v=f48a4f17ba23",
        "assets/relay-floors.png?v=f48a4f17ba23",
        "assets/haunted-portraits.png?v=f48a4f17ba23",
        "assets/reception-parking.png?v=f48a4f17ba23",
        "assets/resident-walk.png?v=f48a4f17ba23",
        "assets/seoha-adult-walk.png?v=f48a4f17ba23",
        "assets/player-side-walk.png?v=f48a4f17ba23",
        "assets/resident-side-walk.png?v=f48a4f17ba23",
        "assets/relay-furniture.png?v=f48a4f17ba23",
        "assets/room-omens.png?v=f48a4f17ba23",
      ].map(load),
    ).then(([props, actor, painted, floors, monster, diagonal, shoeCabinet, chairSheet, roomModules, diningTable, regionalProps, wallSide, architecture, technicalKit, technicalDoors, kitchenKit, decorKit, supplyKit, roomDetails, seoyunEcho, relayFloors, hauntedPortraits, receptionParking, residentWalk, playerWalk, playerSideWalk, residentSideWalk, relayFurniture, omenAtlas]) => {
      this.residentBounds=[];
      const measure=document.createElement('canvas');measure.width=residentWalk.width;measure.height=residentWalk.height;const measureCtx=measure.getContext('2d',{willReadFrequently:true});measureCtx.drawImage(residentWalk,0,0);const pixels=measureCtx.getImageData(0,0,measure.width,measure.height).data,sw=measure.width/6,sh=measure.height/4;
      // This atlas uses measured row gutters; never crop a foot at an assumed 256px edge.
      const rowEdges=[0,280,532,778,1024].map(v=>Math.round(v*measure.height/1024));
      for(let row=0;row<4;row++)for(let col=0;col<6;col++){const sy=rowEdges[row],rh=rowEdges[row+1]-sy;let left=sw,right=0,top=rh,bottom=0;for(let y=0;y<rh;y++)for(let x=0;x<sw;x++)if(pixels[((sy+y)*measure.width+col*sw+x)*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}this.residentBounds.push({x:col*sw+left,y:sy+top,w:right-left+1,h:bottom-top+1});}
      Object.assign(this, {
        props,
        actor,
        painted,
        floors,
        monster,
        hauntedPortraits,
        residentWalk,playerWalk,playerSideWalk,residentSideWalk,relayFurniture,omenAtlas,
        diagonal,
        shoeCabinet,
        chairSheet, roomModules, diningTable,
        ready: true,
      });
      this.receptionParking=receptionParking;
      const rects=[[14,58,390,270],[442,24,300,306],[825,30,220,300],[1105,10,330,325],[25,390,354,300],[425,378,330,322],[780,350,310,350],[1110,332,330,370],[10,736,430,310],[465,704,265,345],[780,714,310,336],[1123,692,305,360]];
      this.regionalTiles=rects.map(([x,y,w,h],index)=>{
        const tile=document.createElement('canvas');tile.dataset.asset='regional-'+index;tile.width=128;tile.height=Math.ceil(128*h/w);
        const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(regionalProps,x,y,w,h,0,0,tile.width,tile.height);return tile;
      });
      const cacheFrames=(im,rects)=>rects.map(([x,y,w,h],index)=>{const tile=document.createElement('canvas');tile.dataset.asset=(im.src||'').split('/').pop().split('?')[0];tile.dataset.frame=String(index);tile.width=128;tile.height=Math.ceil(128*h/w);const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x,y,w,h,0,0,tile.width,tile.height);return tile});
      this.wallTiles=cacheFrames(wallSide,[[100,38,190,390],[545,38,225,390],[982,10,180,425],[1425,8,250,430],[105,465,215,405],[558,530,195,275],[995,460,180,414],[1416,458,205,420]]);
      this.architectureTiles=cacheFrames(architecture,[[45,30,380,392],[493,30,390,392],[970,42,280,390],[1405,16,235,438],[25,450,335,410],[455,550,420,192],[925,505,300,302],[1270,510,490,290]]);
      this.technicalTiles=cacheFrames(technicalKit,[[80,10,250,374],[397,10,250,374],[778,10,258,374],[1123,10,253,374],[45,405,280,307],[367,405,325,310],[710,470,440,220],[1162,398,235,318],[85,710,212,370],[404,732,255,348],[774,710,280,370],[1182,729,200,339]]);
      this.technicalDoorTiles=cacheFrames(technicalDoors,[[244,0,200,508],[666,0,200,508],[1065,0,270,508],[243,510,200,514],[665,510,200,514],[1065,510,270,514]]);
      this.kitchenTiles=cacheFrames(kitchenKit,[[92,75,360,389],[590,75,366,389],[1090,35,370,429],[80,540,380,452],[655,520,237,482],[1090,590,380,333]]);
      this.decorTiles=cacheFrames(decorKit,[[27,25,357,490],[420,25,384,490],[852,80,285,430],[1170,158,340,367],[27,535,403,455],[475,585,310,395],[812,570,347,403],[1215,600,266,290]]);
      this.echoTiles=cacheFrames(seoyunEcho,[[320,30,225,580],[725,30,220,580],[323,632,230,575],[722,630,305,577]]);
      this.supplySheet=supplyKit;
      this.detailTiles=cacheFrames(roomDetails,[[95,5,175,407],[465,100,162,302],[800,5,225,407],[1195,85,170,312],[45,433,280,292],[380,458,330,252],[750,458,320,252],[1150,438,265,285],[105,723,160,350],[395,780,270,280],[720,815,380,222],[1130,815,285,226]]);
      // Cache static tile sampling at its actual game resolution once, rather than
      // scaling large illustrations for every floor cell on every animation frame.
      const floorTiles=document.createElement('canvas');floorTiles.width=256;floorTiles.height=256;
      const fc=floorTiles.getContext('2d');fc.imageSmoothingEnabled=false;fc.drawImage(this.floors,0,0,256,256);this.floors=floorTiles;
      this.relayFloors=document.createElement('canvas');this.relayFloors.width=256;this.relayFloors.height=256;const rc=this.relayFloors.getContext('2d');rc.imageSmoothingEnabled=false;rc.drawImage(relayFloors,0,0,256,256);
      this.moduleTiles=document.createElement('canvas');this.moduleTiles.width=384;this.moduleTiles.height=576;
      const mc=this.moduleTiles.getContext('2d');mc.imageSmoothingEnabled=false;
      const xs=[30,364,727,1058],ys=[[30,390],[412,710],[730,1018],[1040,1410]],heights=[72,60,58,72];
      for(let row=0;row<4;row++)for(let col=0;col<3;col++)mc.drawImage(this.roomModules,xs[col],ys[row][0],xs[col+1]-xs[col],ys[row][1]-ys[row][0],col*128,row*144+144-heights[row]*2,128,heights[row]*2);
    });
  }
  begin(s, map) {
    this.echo=null;this.dread=null;this.omen=null;
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
      this.walk = advanceGait(this.walk,Math.hypot(dx,dy),actorStride(0,running));
    }
  }
  torchGrip(){return (this.moving&&(this.direction===1||this.direction===2))?sideGrip(0,this.walk,this.direction===2,this.moving):handGrip(this.direction,this.moving?Math.floor(this.walk)%4:1);}
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
  startFuse(o,done){if(this.installation)return;this.installation={object:o,elapsed:0,duration:this.reduced ? .3 : 1.9,done};}
  appear(x,y,text){this.echo={x,y,elapsed:0,duration:3.6};this.haunt(text);}
  haunt(text){if(this.reduced||this.dread)return;this.dread={text,elapsed:0,duration:2.6};this.shake=.5;}
  reflection(o,s,t,pane,opacity=1){
    const distance=Math.hypot(s.x-o.x,s.y-o.y),inFront=s.y>o.y+10;
    if(!inFront||distance>175)return;
    const delayed=this.reflections.find(p=>p.t>=t-260)||s,dx=Math.max(-pane.w*.3,Math.min(pane.w*.3,(o.x-delayed.x)*.22));
    const c=this.ctx,p=PLAYER_POSES[0][1],scale=1-Math.min(.28,(distance-40)/500);
    c.save();c.beginPath();c.rect(pane.x,pane.y,pane.w,pane.h);c.clip();c.globalAlpha=opacity*Math.max(.15,1-distance/230);
    const h=Math.min(54,pane.h*1.1)*scale,w=h*p.w/p.h*.92;c.translate(pane.x+pane.w/2+dx,pane.y+pane.h*.7);c.scale(-1,1);
    c.drawImage(this.playerWalk,p.x,p.y,p.w,p.h,-w/2,-h*.72,w,h);c.restore();
  }
  prop(o, s, t, dt) {
    const c = this.ctx,
      changed = propState(o, s);
    const facing=wallFacing(this.map,o);
    if(o.wallClock){
      const g=mountedGeometry(this.map,o,26,26),x=g.x+g.w/2,y=g.y+g.h/2;c.save();c.fillStyle='#181a1a';c.beginPath();c.arc(x,y,13,0,7);c.fill();c.fillStyle='#bbbcb1';c.beginPath();c.arc(x,y,11,0,7);c.fill();c.strokeStyle='#383a36';c.lineWidth=1;
      for(let k=0;k<12;k++){const a=k*Math.PI/6;c.beginPath();c.moveTo(x+Math.sin(a)*8,y-Math.cos(a)*8);c.lineTo(x+Math.sin(a)*10,y-Math.cos(a)*10);c.stroke();}
      for(const [a,len]of [[(2+13/60)*Math.PI/6,5],[13*Math.PI/30,8],[this.reduced?0:Math.sin(t*.003)>.2?0:-Math.PI/30,9]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(a)*len,y-Math.cos(a)*len);c.stroke();}c.restore();return;
    }
    if(o.counter!==undefined){
      const xs=[64,535,1016],ws=[464,480,488];c.drawImage(this.receptionParking,xs[o.counter],0,ws[o.counter],480,o.x-32.5,o.y-51,65,64);return;
    }
    if(o.parkingBench){c.drawImage(this.receptionParking,30,512,480,450,o.x-48,o.y-77,96,90);return;}
    if(o.parkingBarrier){c.drawImage(this.receptionParking,1024,512,512,460,o.x-56,o.y-91,112,101);return;}
    if(o.shadowProfile){
      c.save();c.fillStyle='#0008';c.beginPath();c.moveTo(o.x-9,o.y-36);c.lineTo(o.x+38,o.y-13);c.lineTo(o.x+52,o.y+29);c.lineTo(o.x+4,o.y+16);c.closePath();c.fill();
      c.fillStyle='#17191a';c.fillRect(o.x-13,o.y-78,21,88);c.fillStyle='#3b3e3e';c.beginPath();c.moveTo(o.x-13,o.y-78);c.lineTo(o.x-5,o.y-86);c.lineTo(o.x+13,o.y-78);c.lineTo(o.x+8,o.y-72);c.fill();c.fillStyle='#252828';c.fillRect(o.x+7,o.y-72,6,79);c.fillStyle='#85858055';c.fillRect(o.x+7,o.y-72,1,76);c.restore();return;
    }
    if(o.testContact){c.fillStyle='#363e40';c.fillRect(o.x-12,o.y-25,24,33);c.strokeStyle='#959994';c.strokeRect(o.x-12,o.y-25,24,33);c.fillStyle=s.flags['relayTest'+o.testContact]?'#c7bf9e':'#151a1d';c.fillRect(o.x-5,o.y-19,10,6);c.fillStyle='#babdb8';c.font='9px monospace';c.fillText(o.testContact,o.x-3,o.y+2);return;}
    if(o.hideKind){
      const opening=s.hideSpot?.id===o.id?s.hideSpot.opening:0;
      if(o.hideKind==='desk'){
        c.drawImage(this.receptionParking,535,0,480,480,o.x-47,o.y-53,94,66);
        c.fillStyle='#141719';c.fillRect(o.x-29,o.y-12,58,22);c.save();c.translate(o.x-29,o.y-12);c.transform(1,0,opening*.6,1,0,0);c.fillStyle='#4c4d4b';c.fillRect(0,-1,58*(1-opening*.8),24);c.strokeStyle='#8a8983';c.strokeRect(0,-1,58*(1-opening*.8),24);c.restore();
      }else{c.fillStyle='#181c1e';c.fillRect(o.x-27,o.y-34,54,46);c.strokeStyle='#777';c.strokeRect(o.x-27,o.y-34,54,46);c.save();c.translate(o.x-25,o.y-32);c.rotate(-opening*1.1);c.fillStyle='#444b4e';c.fillRect(0,0,50,42);c.strokeStyle='#a2a6a5';for(let y=6;y<38;y+=6){c.beginPath();c.moveTo(4,y);c.lineTo(46,y);c.stroke();}c.restore();}
      return;
    }
    if(o.facility!==undefined){
      const indices=[7,0,1,2,3,4,5,6,7],i=indices[o.facility],sizes=[[100,91],[70,110],[80,77],[76,104],[44,74],[92,87],[62,104],[62,104],[100,94]],[w,h]=sizes[o.facility],cw=this.relayFurniture.width/3,ch=this.relayFurniture.height/3;
      c.fillStyle='#0006';c.beginPath();c.ellipse(o.x,o.y+9,w*.42,5,0,0,7);c.fill();c.drawImage(this.relayFurniture,i%3*cw,Math.floor(i/3)*ch,cw,ch,o.x-w/2,o.y+13-h,w,h);return;
    }
    if(o.yardVisual==='sign'){
      const cw=this.relayFurniture.width/3,ch=this.relayFurniture.height/3;c.drawImage(this.relayFurniture,2*cw,2*ch,cw,ch,o.x-35,o.y-75,70,88);c.fillStyle='#333';c.font='7px sans-serif';c.textAlign='center';c.fillText(o.id.includes('bus')?'← 산길':'안내·접수동 →',o.x,o.y-38);c.textAlign='start';return;
    }
    if(o.yardVisual==='car'){
      c.save();if(o.variant===1)c.filter='brightness(.75)';else if(o.variant===2)c.filter='brightness(1.13)';
      c.drawImage(this.receptionParking,520,512,504,470,o.x-58,o.y-102,116,110);c.restore();return;
    }
    if(o.chapterVisual){
      this.prop({...o,chapterVisual:null},s,t,dt);
      const type=o.chapterVisual;
      if(type==='wheel-source'||type==='valve'){
        const present=type==='valve'?s.flags.relayCooling:!s.bag.includes('relayWheel')&&!s.flags.relayCooling;
        const target=s.flags.relayCooling?1:0,old=this.objectStates.get(o.id)??0;
        const amount=this.reduced?target:old+(target-old)*(1-Math.exp(-dt*3));this.objectStates.set(o.id,amount);
        c.save();c.translate(o.x+5,o.y-22);c.fillStyle='#888';c.fillRect(-2,-2,4,4);
        if(present){c.rotate(amount*Math.PI*2);c.strokeStyle='#b5b5b5';c.lineWidth=2;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.moveTo(-8,0);c.lineTo(8,0);c.moveTo(0,-8);c.lineTo(0,8);c.stroke();}
        c.restore();
      }else{
        const enabled=type==='isolator'?s.flags.relayIsolated:s.flags.relayPower;
        c.fillStyle='#1b1b1b';c.fillRect(o.x-8,o.y-29,16,18);c.fillStyle=enabled?'#bbb':'#555';c.fillRect(o.x-4,o.y-(enabled?17:25),8,5);
      }
      return;
    }
    if(o.kind==='radiator'){
      const i=EXTRAS.indexOf('radiator')*2,sw=this.props.width/6,sh=this.props.height/4;c.fillStyle='#0005';c.fillRect(o.x-30,o.y+9,60,4);c.drawImage(this.props,i%6*sw,Math.floor(i/6)*sh,sw,sh,o.x-36,o.y-20,72,32);return;
    }
    if(o.details!==undefined){
      const tile=this.detailTiles[o.details],widths=[34,26,42,26,54,64,60,40,28,42,64,42],w=widths[o.details],h=w*tile.height/tile.width,g=o.mount?mountedGeometry(this.map,o,w,h):{x:o.x-w/2,y:o.y+12-h,w,h};
      if(!o.mount){c.save();c.fillStyle='#0005';c.beginPath();c.ellipse(o.x,o.y+9,w*.38,3,0,0,Math.PI*2);c.fill();c.restore();}
      c.drawImage(tile,g.x,g.y,g.w,g.h);return;
    }
    const fixture=fixtureVisual(o,s);
    if(fixture){
      const sw=this.supplySheet.width/3,sh=this.supplySheet.height/2,i=fixture.index;
      // Crops are shared between paired states so the cabinet/workbench never changes size.
      const sizes={0:[66,62],1:[88,72],2:[88,72],3:[96,92],4:[96,92],5:[44,40]},[w,h]=sizes[i];
      const g=o.mount?mountedGeometry(this.map,o,w,h):{x:o.x-w/2,y:o.y-h+14,w,h};
      c.drawImage(this.supplySheet,i%3*sw,Math.floor(i/3)*sh,sw,sh,g.x,g.y,g.w,g.h);
      if(o.fixture==='fuse-socket'){c.fillStyle=s.flags.power?'#eee':'#333';c.fillRect(o.x-18,o.y-44,3,3);}
      return;
    }
    if(o.kitchenTile!==undefined){
      const tile=this.kitchenTiles[o.kitchenTile],w=o.kitchenTile===4?40:64,h=o.kitchenTile===4?82:o.kitchenTile===5?52:68;
      const g=o.mount?mountedGeometry(this.map,o,w,h):{x:o.x-w/2,y:o.y-h+14,w,h};c.drawImage(tile,g.x,g.y,g.w,g.h);return;
    }
    if(o.hauntedPortrait){
      const g=mountedGeometry(this.map,o,58,58),distance=Math.hypot(s.x-o.x,s.y-o.y),gone=s.flags.relaySlide;
      const dx=s.x-o.x,frame=gone?3:Math.abs(dx)<24?0:dx<0?1:2;
      const sw=this.hauntedPortraits.width/2,sh=this.hauntedPortraits.height/2;
      const sway=this.reduced?0:Math.sin(t*.002)*.018;
      c.save();c.translate(g.x+g.w/2,g.y+g.h/2);c.rotate(sway);c.drawImage(this.hauntedPortraits,(frame%2)*sw,Math.floor(frame/2)*sh,sw,sh,-g.w/2,-g.h/2,g.w,g.h);c.restore();
      return;
    }
    if(o.decor!==undefined){
      const decor=o.fixture==='curtain'?((s.flags['curtain_'+o.id]??o.decor===1)?1:0):o.decor,tile=this.decorTiles[decor],sizes={0:[o.id.startsWith('vanity')?32:64,80],1:[o.id.startsWith('vanity')?32:64,80],2:[48,72],3:[68,60],4:[54,58],5:[36,44],6:[46,54],7:[38,42]},[w,h]=sizes[o.decor],y=o.mount?o.y-h-4:o.y+12-h;
      const g=o.mount?mountedGeometry(this.map,o,w,h):{x:o.x-w/2,y,w,h};c.drawImage(tile,g.x,g.y,g.w,g.h);
      if(o.fixture==='mirror')this.reflection(o,s,t,{x:g.x+g.w*.15,y:g.y+g.h*.18,w:g.w*.7,h:g.h*.68},.95);
      if(o.reflective)this.reflection(o,s,t,{x:g.x+g.w*.18,y:g.y+g.h*.2,w:g.w*.64,h:g.h*.6},.25);
      return;
    }
    if(o.technical!==undefined){
      const index=o.technical===4&&s.flags.locker?5:o.technical,tile=this.technicalTiles[index];
      if(o.technical===6){
        // A mixing desk has a real worktop, feet and cable route; the cassette is on it.
        c.fillStyle='#151515';c.fillRect(o.x-54,o.y-23,108,35);c.fillStyle='#555';c.fillRect(o.x-55,o.y-24,110,5);
        c.fillStyle='#333';c.fillRect(o.x-48,o.y+8,7,12);c.fillRect(o.x+41,o.y+8,7,12);
        c.drawImage(tile,o.x-54,o.y-60,108,54);c.strokeStyle='#111';c.lineWidth=2;c.beginPath();c.moveTo(o.x+39,o.y+15);c.lineTo(o.x+58,o.y+24);c.lineTo(o.x+58,9*32);c.stroke();
      }else{
        const sizes={4:[64,70],5:[76,72],7:[44,60],8:[34,60],9:[40,52],10:[54,68],11:[24,40]},[width,height]=sizes[index]||[48,60];
        const g=o.mount?mountedGeometry(this.map,o,width,height):{x:o.x-(index===5?32:width/2),y:o.y+12-height,w:width,h:height};c.drawImage(tile,g.x,g.y,g.w,g.h);
        if(o.technical===4){c.fillStyle=s.flags.power?'#bdbdbd':'#252525';c.fillRect(o.x+4,o.y-34,8,4);}
      }
      return;
    }
    if(o.kind==='shutter'){
      const anchor=portalAnchor(this.map,o),target=s.flags.shutterOpen?1:0;
      let amount=this.objectStates.get(o.id)??target;amount+=(target-amount)*(this.reduced?1:1-Math.exp(-dt*2.5));this.objectStates.set(o.id,amount);
      const facing=wallFacing(this.map,o),face=wallFace(this.map,Math.floor(anchor.x/32),Math.floor(anchor.y/32),facing),dy=face.y-anchor.y,height=face.h;
      const tile=this.architectureTiles[amount>.1&&amount<.85?1:0];
      c.save();c.translate(anchor.x,anchor.y);c.fillStyle='#060606';c.fillRect(-40,dy,80,height);
      c.save();c.beginPath();c.rect(-44,dy,88,Math.max(0,height*(1-amount)));c.clip();c.drawImage(tile,-44,dy,88,height);c.restore();
      c.strokeStyle='#666';c.lineWidth=3;c.beginPath();c.moveTo(-40,dy);c.lineTo(-40,dy+height);c.moveTo(40,dy);c.lineTo(40,dy+height);c.stroke();c.restore();return;
    }

    if(o.architecture!==undefined&&!o.sealed){
      const tile=this.architectureTiles[o.architecture],size={4:[60,74],5:[48,22],6:[48,48],7:[96,48]}[o.architecture]||[64,64];
      const g=o.mount?mountedGeometry(this.map,o,...size):{x:o.x-size[0]/2,y:o.y+12-size[1],w:size[0],h:size[1]},y=g.y;
      c.save();if(o.kind==='studio-glass')c.globalAlpha=.45;c.drawImage(tile,g.x,g.y,g.w,g.h);c.restore();
      if(o.kind==='studio-glass'){c.strokeStyle='#777';c.lineWidth=1;c.strokeRect(g.x+1,g.y+1,g.w-2,g.h-2)}
      if(o.kind==='onair'){c.fillStyle=s.flags.power?'#eee':'#555';c.fillRect(o.x-17,y+6,34,10);c.fillStyle='#222';c.font='6px monospace';c.textAlign='center';c.fillText('ON AIR',o.x,y+13)}return;
    }
    if((facing==='east'||facing==='west')&&!['door','shutter','exit'].includes(o.kind)&&['shoe','cabinet','window','photo','notice','calendar'].includes(o.kind)){
      const index=o.kind==='shoe'?changed?1:0:o.kind==='cabinet'?2:o.kind==='window'?4:5,tile=this.wallTiles[index],height=o.kind==='shoe'?72:o.kind==='cabinet'?88:o.kind==='window'?64:38,width=height*tile.width/tile.height;
      c.save();c.translate(o.x,o.y);if(facing==='west')c.scale(-1,1);if(o.mount){const g=mountedGeometry(this.map,o,width,height);c.drawImage(tile,(facing==='west'?-(g.x-o.x)-g.w:g.x-o.x),g.y-o.y,g.w,g.h);}else c.drawImage(tile,-32,12-height,width,height);c.restore();return;
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
      if(o.kind!=="stairs"){const g=doorGeometry(this.map,o);c.fillStyle="#101010";c.fillRect(g.dx+3,g.dy+3,g.width-6,g.height-6);}
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
        const frame=o.internalDoor?+doorOpen(this.map,o):o.sealed?0:+!!s.flags['seen_'+o.id],g=doorGeometry(this.map,o);
        if(facing==='west')c.scale(-1,1);
        if(g.cutaway){
          c.fillStyle='#161616';c.fillRect(g.dx,g.dy,g.width,g.height);c.strokeStyle='#888';c.lineWidth=2;c.strokeRect(g.dx,g.dy,g.width,g.height);
          c.fillStyle='#555';if(frame){c.fillRect(g.dx+3,g.dy+2,5,g.height-4);}else{c.fillRect(g.dx+3,-3,g.width-6,7);c.fillStyle='#aaa';c.fillRect(g.dx+g.width-10,-4,3,2);}
          if(o.sealed){c.strokeStyle='#bbb';c.lineWidth=2;c.beginPath();c.moveTo(g.dx+5,g.dy+3);c.lineTo(g.dx+g.width-5,g.dy+g.height-3);c.moveTo(g.dx+g.width-5,g.dy+3);c.lineTo(g.dx+5,g.dy+g.height-3);c.stroke();}
        }else if(o.sealed){
          const tile=this.architectureTiles[g.side?3:2];c.drawImage(tile,g.dx,g.dy,g.width,g.height);
        }else if(o.doorType==='fire'||o.doorType==='acoustic'||o.doorType==='service'){
          if(g.side){
            const tile=this.technicalDoorTiles[(o.doorType==='acoustic'?3:0)+frame];c.drawImage(tile,g.dx,g.dy,g.width,g.height);
          }else{
            const tile=o.doorType==='service'?null:this.technicalTiles[(o.doorType==='acoustic'?2:0)+frame];
            if(tile)c.drawImage(tile,g.dx,g.dy,g.width,g.height);
            else{const tile=this.technicalDoorTiles[frame?5:2];c.drawImage(tile,g.dx,g.dy,g.width,g.height);}
          }
        }else if(g.side){const tile=this.wallTiles[6+frame];c.drawImage(tile,g.dx,g.dy,g.width,g.height);}
        else{const i=22+frame,sw=this.props.width/6,sh=this.props.height/4;c.drawImage(this.props,i%6*sw,Math.floor(i/6)*sh,sw,sh,g.dx,g.dy,g.width,g.height);}
        c.strokeStyle='#777';c.lineWidth=2;if(!g.side){c.beginPath();c.moveTo(-g.span/2,g.facing==='south'?g.dy:g.dy+g.height);c.lineTo(g.span/2,g.facing==='south'?g.dy:g.dy+g.height);c.stroke();}
        c.fillStyle='#aaa';c.font='6px monospace';c.textAlign='center';
        c.fillText(o.barrier?'FIRE DOOR':o.id==='apartment-door'?'101':'',0,g.dy+20);

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
        o.mount ? 40 : PROP_SIZES[o.kind] || 72,
      dy = o.mount ? mountedGeometry(this.map,o,size,size).y : ["player","monitor"].includes(o.kind) ? o.y-68 : o.y - size * 0.76;
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
    m.fillStyle = this.map.chapter===2 ? `rgba(0,0,0,${this.map.id==='relayEntry'?.53:this.map.id==='relayPlant'?.91:.79})` : "rgba(0,0,0,.88)";
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
    for(const [x,y,r,kind]of LAMPS[this.map.id]||[]){
      const xx=(x*32-camX)*z,yy=(y*32-camY)*z,g=m.createRadialGradient(xx,yy,2,xx,yy,r*z),strength=lampStrength(kind,t,this.reduced);g.addColorStop(0,`rgba(255,255,255,${strength*.9})`);g.addColorStop(.45,`rgba(255,255,255,${strength*.55})`);g.addColorStop(1,'#fff0');m.save();m.beginPath();for(let a=0;a<=Math.PI*2+.13;a+=.13){let d=8;for(;d<r;d+=8)if(opaque(this.map,Math.floor((x*32+Math.cos(a)*d)/32),Math.floor((y*32+Math.sin(a)*d)/32))||closedDoorAt(this.map,x*32+Math.cos(a)*d,y*32+Math.sin(a)*d))break;const ax=xx+Math.cos(a)*Math.min(d,r)*z,ay=yy+Math.sin(a)*Math.min(d,r)*z;if(a===0)m.moveTo(ax,ay);else m.lineTo(ax,ay);}m.closePath();m.clip();m.fillStyle=g;m.fillRect(xx-r*z,yy-r*z,r*z*2,r*z*2);m.restore();
    }
    if (s.flashlight && s.bag.includes("flashlight") && !s.hidden) {
      const grip=this.torchGrip(),beamX=px+grip.x*z,beamY=py+grip.y*z;
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
          (s.x + grip.x + Math.cos(a) * d - camX) * z,
          (s.y + grip.y + Math.sin(a) * d - camY) * z,
        ]);
      }
      m.beginPath();
      m.moveTo(beamX, beamY);
      pts.forEach((p) => m.lineTo(...p));
      m.closePath();
      const g = m.createRadialGradient(beamX, beamY, 8, beamX, beamY, range * z);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.55, "#fffffff0");
      g.addColorStop(0.9, "#ffffff77");
      g.addColorStop(1, "#fff0");
      m.fillStyle = g;
      m.fill();
    }
    m.filter = "none";
    // Illuminate the visible wall face without letting light pass through it.
    for(const o of this.map.objects){
      if(!torchHitsSurface(this.map,s,o))continue;
      let rw=46,rh=52,top=o.y-45;
      if(o.fixture==='mirror'){rw=48;rh=72;top=o.y-rh-4;}
      else if(o.fixture==='curtain'){rw=o.id.startsWith('vanity')?32:64;rh=80;top=o.y-rh-4;}
      else if(o.fixture==='fuse-socket'){rw=96;rh=92;top=o.y-rh+12;}
      else if(['door','shutter'].includes(o.kind)){const g=doorGeometry(this.map,o.kind==='shutter'?{...o,aperture:80}:o);rw=g.width;rh=g.height;top=o.y+g.dy;}
      if(o.mount){const g=mountedGeometry(this.map,o,rw,rh);rw=g.w;rh=g.h;top=g.y;}
      const x=(o.x-rw/2-camX)*z,y=(top-camY)*z,cx=x+rw*z/2,cy=y+rh*z/2;
      const wash=m.createRadialGradient(cx,cy,2,cx,cy,Math.max(rw,rh)*z*.8);
      wash.addColorStop(0,'#fffffff5');wash.addColorStop(.65,'#ffffffc0');wash.addColorStop(1,'#fff0');
      m.fillStyle=wash;m.fillRect(x,y,rw*z,rh*z);
    }
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
    this.reflections.push({x:s.x,y:s.y,t});this.reflections=this.reflections.filter(p=>p.t>t-700);
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
        if (map.outdoor) {
          if(v===1){c.drawImage(this.relayFloors,((x*7+y*11)%4)*64,128,64,64,x*32,y*32,32,32);}
          else if(v===2){c.fillStyle='#121917';c.fillRect(x*32,y*32,32,32);c.fillStyle='#606f6355';for(let k=0;k<5;k++)c.fillRect(x*32+k*7,y*32,1,32);c.fillStyle='#8c97885a';c.fillRect(x*32,y*32+8,32,2);if(x===36&&y>=7&&y<=22){c.fillStyle='#333635';c.fillRect(x*32,y*32,32,32);c.fillStyle='#7c807b';c.fillRect(x*32,y*32,3,32);}}
          continue;
        }
        if (v === 1) {
          const i = (x * 7 + y * 11) % 4;
          c.drawImage(
            map.chapter===2?this.relayFloors:this.floors,
            i * sw,
            (map.id === "upper" && x >= 26 && y < 17
              ? 3
              : map.id === "apartment" && ((x >= 18 && y < 12)||(x>=4&&x<=10&&y>=20))
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
          const face=wallFace(map,x,y,floorBelow?'north':'south');
          const top=(floorBelow||floorAbove)?face.y:y*32,height=(floorBelow||floorAbove)?face.h:32;
          c.drawImage(this.floors,((x+y)%4)*sw,2*sh,sw,sh,x*32,top,32,height);
          c.fillStyle='#0009';c.fillRect(x*32,top,32,height);
          if(map.chapter===2){
            c.save();c.beginPath();c.rect(x*32,top,32,height);c.clip();
            c.fillStyle=map.id==='relayEntry'?'#c8c4b025':map.id==='relayArchive'?'#0c0b0b90':map.id==='relayPlant'?'#14191d88':'#101014aa';c.fillRect(x*32,top,32,height);
            c.strokeStyle=map.id==='relayEntry'?'#c0c0b050':'#aaaaaa35';c.lineWidth=1;
            if(map.id==='relayEntry'){c.fillStyle='#797a7150';c.fillRect(x*32,top+height*.6,32,height*.4);c.fillStyle='#c9c7bc70';c.fillRect(x*32,top+height*.6,32,2);}
            if(map.id==='relayArchive'){for(let xx=0;xx<32;xx+=8){c.beginPath();c.moveTo(x*32+xx,top);c.lineTo(x*32+xx,top+height);c.stroke();}}
            if(map.id==='relayPlant'){c.fillStyle='#666';c.fillRect(x*32,top+height*.3,32,4);c.fillStyle='#aaa';c.fillRect(x*32,top+height*.3,32,1);c.fillStyle='#333';c.fillRect(x*32+12,top+height*.3-2,3,8);}
            if(map.id==='relaySignal'){for(let yy=4;yy<height;yy+=6)for(let xx=3;xx<32;xx+=6){c.fillStyle='#96969635';c.fillRect(x*32+xx,top+yy,1,1);}}
            c.restore();
          }
          if(floorBelow||floorAbove){
            const home=map.id==='apartment',studio=map.id==='upper'&&x>=26;
            c.save();c.beginPath();c.rect(x*32,top,32,height);c.clip();
            if(home&&x>=18&&y<13){c.strokeStyle='#aaaaaa28';c.lineWidth=1;for(let yy=8;yy<height;yy+=16){c.strokeRect(x*32,top+yy,16,16);c.strokeRect(x*32+16,top+yy,16,16)}}
            else if(studio){c.fillStyle='#88888822';for(let xx=4;xx<32;xx+=8)c.fillRect(x*32+xx,top+8,1,height-16)}
            else if(home){c.strokeStyle='#aaaaaa20';c.lineWidth=1;c.beginPath();c.moveTo(x*32+8,top+8);c.lineTo(x*32+8,top+height-8);c.moveTo(x*32+24,top+8);c.lineTo(x*32+24,top+height-8);c.stroke()}
            c.restore();
            c.fillStyle='#626262';c.fillRect(x*32,top,32,3);
            c.fillStyle='#888';c.fillRect(x*32,top,32,1);
            c.fillStyle='#252525';c.fillRect(x*32,top+height-5,32,5);
          }
          if(map.grid[y]?.[x+1]===1){c.fillStyle='#4c4c4c';c.fillRect(x*32+25,y*32,7,32);c.fillStyle='#747474';c.fillRect(x*32+30,y*32,2,32)}
          if(map.grid[y]?.[x-1]===1){c.fillStyle='#4c4c4c';c.fillRect(x*32,y*32,7,32);c.fillStyle='#747474';c.fillRect(x*32,y*32,2,32)}
        }
      }
    const wear={apartment:[[12,4]],management:[[7,3],[25,3]],lobby:[[21,11]],basement:[[9,4],[30,4]],upper:[[17,4]]}[map.id]||[];
    c.save();c.globalAlpha=.38;for(const [xx,yy]of wear){if(map.grid[yy]?.[xx]!==2)continue;c.drawImage(this.detailTiles[10],xx*32-16,yy*32-5,64,37);}c.restore();
    if (s.map === "basement") {
      c.fillStyle = "#ffffff10";
      for (let k = 0; k < 7; k++) {
        c.beginPath();
        c.ellipse((7 + k * 5) * 32, 20 * 32, 24 + (k % 2) * 12, 7, 0, 0, 7);
        c.fill();
      }
    }
    c.save();c.beginPath();for(let yy=0;yy<map.h;yy++)for(let xx=0;xx<map.w;xx++)if(map.grid[yy][xx]===1)c.rect(xx*32,yy*32,32,32);c.clip();
    if(map.chapter===2){
      if(map.id==='relayEntry'){
        c.fillStyle='#15151533';for(let x=5;x<46;x++)if(x%2===0)c.fillRect(x*32,24*32,32,3*32);
        c.strokeStyle='#dddddd45';c.strokeRect(5*32,24*32,40*32,3*32);
      }else if(map.id==='relayArchive'){
        c.fillStyle='#beb8ad25';c.fillRect(5*32,25*32,47*32,2);c.fillRect(5*32,28*32,47*32,2);
      }else if(map.id==='relayPlant'){
        c.fillStyle='#05090b88';c.fillRect(8*32,31*32,12*32,18);c.fillRect(6*32,26*32,45*32,7);
        c.strokeStyle='#b4bdc435';for(let i=0;i<18;i++){c.beginPath();c.moveTo((8+i*.65)*32,31*32);c.lineTo((8+i*.65)*32,31*32+18);c.stroke();}
        c.fillStyle='#bbbbbb13';for(let i=0;i<12;i++){c.beginPath();c.ellipse((8+i*3.5)*32,27*32,23,5+Math.sin(t*.002+i)*2,0,0,7);c.fill();}
      }else{
        c.strokeStyle='#a3a3a33a';c.lineWidth=2;c.strokeRect(28*32,12*32,18*32,11*32);
        c.fillStyle='#111b';c.fillRect(28*32,23*32,18*32,6);c.fillRect(46*32,12*32,6,11*32);
      }
    }
    if(map.outdoor){
      c.strokeStyle='#a5afa16a';c.lineWidth=2;
      c.fillStyle='#bcbcb655';for(let x=6;x<33;x+=3)c.fillRect(x*32,13*32,32,3);c.fillRect(23*32,6*32,4,7*32);for(let y=17;y<27;y+=2)c.fillRect(31*32,y*32,2*32,10);
      c.fillStyle='#d2d2c94a';for(let i=0;i<3;i++){c.fillRect((8+i*5)*32,6.5*32,2*32,6);}

      for(let i=0;i<3;i++)c.strokeRect((7+i*5)*32,6*32,4*32,5*32);
      for(const [x,y,rx,ry]of PUDDLES){
        c.save();c.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,rag=1+.11*Math.sin(i*2.7+x);const xx=x*32+Math.cos(a)*rx*rag,yy=y*32+Math.sin(a)*ry*rag;if(!i)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.closePath();c.clip();
        c.fillStyle='#10213055';c.fillRect(x*32-rx*1.2,y*32-ry*1.2,rx*2.4,ry*2.4);
        const reflection=c.createRadialGradient(x*32-10,y*32-ry,0,x*32,y*32,rx);reflection.addColorStop(0,'#afbcc146');reflection.addColorStop(.6,'#829ba21a');reflection.addColorStop(1,'#3f515500');c.fillStyle=reflection;c.fillRect(x*32-rx*1.2,y*32-ry*1.2,rx*2.4,ry*2.4);
        c.fillStyle='#d0d3ce45';for(let k=0;k<9;k++){const xx=x*32+Math.sin(k*2.3+x)*rx*.8,yy=y*32+Math.cos(k*1.7)*ry*.8;c.fillRect(xx,yy,3+(k%3)*2,.5);}
        for(let k=0;k<3;k++){const q=this.reduced?.5:((t/1100+k*.34+x*.17)%1);c.strokeStyle=`rgba(195,211,219,${(1-q)*.4})`;c.lineWidth=.6;c.beginPath();c.ellipse(x*32+(k-1)*rx*.4,y*32+(k%2)*3,q*9,q*2.3,0,0,7);c.stroke();}c.restore();
      }
      // A grated drainage trench collects runoff at the low edge, away from the entry.
      c.fillStyle='#141819';c.fillRect(5*32,27*32,29*32,7);c.strokeStyle='#6d7578';for(let x=5*32;x<34*32;x+=7){c.beginPath();c.moveTo(x,27*32);c.lineTo(x-2,27*32+7);c.stroke();}
      c.fillStyle='#79857777';c.font='12px sans-serif';c.fillText('안내 · 접수동 →',26*32,18*32);c.fillText('← 산길 / 정류장',6*32,26*32);
      c.fillStyle='#a4ada14a';for(let i=0;i<14;i++)c.fillRect((31+(i%3)*.3)*32,(17+i*.6)*32,3,5);
    }
    if(map.chapter===2&&!map.outdoor){
      const labels={relayEntry:['← 안내·접수','당직 휴게 · 지하계단 →'],relayArchive:['← 원본 보존·열람','대조·청취 →'],relayPlant:['← 펌프·순환','절체·정비 →'],relaySignal:['← 원본 청취','송출 제어 →']}[map.id];
      c.fillStyle='#c0c2b657';c.font='10px sans-serif';c.fillText(labels[0],9*32,(map.id==='relaySignal'?28:26)*32);c.fillText(labels[1],30*32,(map.id==='relaySignal'?28:26)*32);
    }
    // Architectural room treatments, each aligned to the same tile grid as the furniture.
    const rugs={management:[[7,8,6,5]],apartment:[[11,6,6,5],[25,21,4,4]],upper:[[29,11,5,4]]}[map.id]||[];
    for(const [rx,ry,rw,rh] of rugs){
      for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++)if(map.grid[ry+yy]?.[rx+xx]===1)c.drawImage(this.floors,sw,3*sh,sw,sh,(rx+xx)*32,(ry+yy)*32,32,32);
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
    drawFloorOmen(c,this.omen,this.reduced,this.omenAtlas);
    c.restore();
    for (const o of map.objects.filter(o=>o.kind==="stairs")) this.prop(o,s,t,dt);
    const drawables = map.objects.filter(o=>o.kind!=="stairs").map((o) => ({
      y: o.y,
      draw: () => this.prop(o, s, t, dt),
    }));
    if(this.omen?.kind==='shadow'){
      const e=this.omen,p=e.points[0];drawables.push({y:p.y,draw:()=>{const pose=PLAYER_POSES[0][1];c.save();c.globalAlpha=omenOpacity(e)*.8;c.filter='brightness(0)';c.drawImage(this.playerWalk,pose.x,pose.y,pose.w,pose.h,p.x-pose.width/2,p.y-56,pose.width,61);c.restore();}});
    }
    for(const n of this.npcs){drawables.push({y:n.y,draw:()=>{
      c.save();c.fillStyle='#0007';c.beginPath();c.ellipse(n.x,n.y+3,12,4,0,0,7);c.fill();
      if(n.moving&&(n.direction===1||n.direction===2)){c.globalAlpha=n.ambient?(s.flags.relayPower?.65:.8):n.phase===2?.83:1;c.filter=n.ambient?'grayscale(1) brightness(.12)':'grayscale(1)';drawSide(c,this.residentSideWalk,n.column+1,n.walk,n.x,n.y,n.direction===2,n.moving);c.restore();return;}
      const frame=n.moving?Math.floor(n.walk)%2:0;
      const b=this.residentBounds[n.direction*6+n.column*2+frame],height=61,width=b.w/b.h*height*.92;
      if(n.ambient){c.globalAlpha=s.flags.relayPower?.65:.8;c.filter='brightness(0)';c.drawImage(this.residentWalk,b.x,b.y,b.w,b.h,n.x-width/2,n.y-height+5,width,height);c.restore();return;}
      c.translate(n.x,n.y);if(n.phase===2&&!this.reduced)c.transform(1,0,Math.sin(t*.002+n.column)*.04,1,0,0);
      c.globalAlpha=n.phase===2?.83:1;c.filter='grayscale(1)';c.drawImage(this.residentWalk,b.x,b.y,b.w,b.h,-width/2,5-height,width,height);c.restore();
    }});}
    if (!s.hidden)
      drawables.push({
        y: s.y,
        draw: () => {
          c.fillStyle = "#0008";
          c.beginPath();
          c.ellipse(s.x, s.y + 5, 11, 4, 0, 0, 7);
          c.fill();
          const f=this.moving?Math.floor(this.walk)%4:1,p=PLAYER_POSES[this.direction][f];
          if(this.moving&&(this.direction===1||this.direction===2))drawSide(c,this.playerSideWalk,0,this.walk,s.x,s.y,this.direction===2,this.moving);else c.drawImage(this.playerWalk,p.x,p.y,p.w,p.h,s.x-p.width/2,s.y-56,p.width,61);
          if (s.bag.includes("flashlight")) {
            const grip=this.torchGrip();
            c.save();c.translate(s.x+grip.x,s.y+grip.y);c.rotate(s.facing);
            c.fillStyle='#303030';c.beginPath();c.roundRect(0,-1.5,9,3,1.5);c.fill();
            c.fillStyle=s.flashlight?'#999':'#454545';c.beginPath();c.ellipse(9,0,1,2,0,0,Math.PI*2);c.fill();
            // Fingers overlap the rear of the handle at the measured grip point.
            c.fillStyle='#b7b3b0';c.fillRect(-1,-1.3,2.4,2.6);c.restore();
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
      const marker=["door","exit","shutter"].includes(nearest.kind)?portalAnchor(map,nearest):nearest;
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
    if(this.installation){
      const a=this.installation;a.elapsed+=dt;const p=Math.min(1,a.elapsed/a.duration),f=fuseInsertionFrame(this.reduced?1:p),cx=w/2,cy=h/2;
      c.save();c.fillStyle='#050505e8';c.fillRect(0,0,w,h);c.fillStyle='#151515';c.fillRect(cx-235,cy-145,470,290);
      c.drawImage(this.supplySheet,250,700,160,80,cx-200,cy-90,400,200);
      c.save();c.translate(cx+18+f.x,cy+3+f.y);c.fillStyle='#303030';c.fillRect(-86,-13,172,26);const metal=c.createLinearGradient(0,-14,0,14);metal.addColorStop(0,'#ddd');metal.addColorStop(.35,'#888');metal.addColorStop(.7,'#bcbcbc');metal.addColorStop(1,'#555');c.fillStyle=metal;c.beginPath();c.roundRect(-86,-13,172,26,7);c.fill();c.fillStyle='#3a3a3a';c.beginPath();c.roundRect(-63,-10,126,20,3);c.fill();c.fillStyle='#8b8b8b';c.fillRect(-61,-8,122,3);c.strokeStyle='#aaa';c.lineWidth=1;c.beginPath();c.moveTo(-60,2);c.lineTo(60,0);c.stroke();c.fillStyle=metal;c.fillRect(-86,-12,23,24);c.fillRect(63,-12,23,24);c.strokeStyle='#444';c.strokeRect(-86,-12,23,24);c.strokeRect(63,-12,23,24);c.restore();
      c.fillStyle='#ddd';c.font='15px sans-serif';c.textAlign='center';c.fillText(f.seated?'홀더의 두 클립에 퓨즈가 고정됐다.':'유리관 퓨즈를 빈 홀더에 맞춘다.',cx,cy-112);
      c.fillStyle='#888';c.fillRect(cx-150,cy+125,300*p,2);c.restore();
      if(p===1){this.installation=null;queueMicrotask(a.done);}
    }
    if(this.echo){
      const e=this.echo;e.elapsed+=dt;const p=e.elapsed/e.duration;
      if(e.idle&&!this.reduced){const d=Math.hypot(s.x-e.x,s.y-e.y);if(d>38){e.x+=(s.x-e.x)/d*dt*12;e.y+=(s.y-e.y)/d*dt*12;}}
      if(p>=1)this.echo=null;else{const index=this.reduced?2:p<.22?0:p<.42?1:p<.76?2:3,tile=this.echoTiles[index],hh=78*z,ww=hh*tile.width/tile.height,xx=(e.x-cx)*z,yy=(e.y-cy)*z;
      c.save();c.globalAlpha=Math.min(.75,p*5,(1-p)*4);c.drawImage(tile,xx-ww/2+(this.reduced?0:Math.sin(t*.04)*1.5),yy-hh,ww,hh);c.restore();}
    }
    if(this.dread){
      const d=this.dread;d.elapsed+=dt;const p=d.elapsed/d.duration;
      if(p>=1)this.dread=null;else{c.save();c.translate(w/2,h/2);c.rotate(-.28);c.globalAlpha=Math.sin(p*Math.PI)*.72;c.fillStyle='#a52b32';c.font='600 34px serif';c.textAlign='center';for(let i=-1;i<=1;i++)c.fillText(d.text,Math.sin(t*.025+i)*9-(p-.5)*130,i*92+Math.cos(t*.019+i)*4);c.restore();}
    }
    this.fade = Math.max(0, this.fade - dt * 1.4);
    if (this.fade) {
      c.fillStyle = `rgba(5,5,5,${this.fade})`;
      c.fillRect(0, 0, w, h);
    }
  }
}
