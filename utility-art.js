export const CABINET_RECTS=[[54,58,382,452],[524,58,176,452],[836,58,178,452],[1105,148,386,366],[50,552,388,414],[524,554,176,412],[836,554,178,412],[1098,616,405,310]];
// Orthogonal RPG elevations. All wall surfaces use the same unrotated world-aligned texture.
export function cabinetFrame(kind,facing='north'){
 if(kind==='keys')return 7;
 const side=facing==='west'?1:facing==='east'?2:0;
 return kind==='cleaning'?side:kind==='parts'?4+side:side?4+side:3;
}
export function cabinetGeometry(o){
 const side=o.facing==='east'||o.facing==='west',frame=CABINET_RECTS[cabinetFrame(o.roomCabinet,o.facing)],h=o.roomCabinet==='keys'?28:o.roomCabinet==='storage'&&!side?34:o.roomCabinet==='cleaning'?52:50,w=Math.round(h*frame[2]/frame[3]);
 const x=side?(o.facing==='west'?Math.ceil(o.x/32)*32-w:Math.floor(o.x/32)*32):o.x-w/2;
 return{x,y:o.y+8-h,w,h};
}
export function utilityWallRects(map,x,y){
 if(map.grid[y]?.[x]!==2)return[];
 const rects=[{kind:'cap',x:x*32,y:y*32,w:32,h:32}];
 const below=map.grid[y+1]?.[x]===1,above=map.grid[y-1]?.[x]===1;
 if(below||above){const edge=(y+(below?1:0))*32;let h=0;for(;h<72;h++){const yy=Math.floor((edge+(below?-h-1:h))/32);if(map.grid[yy]?.[x]!==2)break;}if(h)rects.push({kind:'front',x:x*32,y:below?edge-h:edge,w:32,h});}
 if(map.grid[y]?.[x+1]===1)rects.push({kind:'side',x:x*32+24,y:y*32,w:8,h:32});
 if(map.grid[y]?.[x-1]===1)rects.push({kind:'side',x:x*32,y:y*32,w:8,h:32});
 return rects;
}
