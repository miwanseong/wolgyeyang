// Canon factions are sourced from the supplied world document / user corrections.
// Geography, local names and travel connections are proposed game geography.
export const continentRegions={
 desert:{name:'황금 사구 · 대상로',nation:'yodrin',biome:'desert',map:[48,76],description:'침식된 사암 단구 · 오아시스 · 대상의 흔적',color:'#dfbb76',ground:1,width:192,height:144},
 north:{name:'북녘 영혼설원',nation:'iseria',biome:'snow',map:[46,12],description:'이세리아의 북쪽 영역 · 눈 덮인 능선과 얼어붙은 호수',color:'#cfdae3',ground:0,width:192,height:144},
 sanctuary:{name:'세라프 순례 고원',nation:'seraph',biome:'upland',map:[23,34],description:'석회암 능선 · 순례자의 샘 · 신성국으로 향하는 길',color:'#a5ad82',ground:0,width:192,height:144},
 haedong:{name:'해동 안개 산록',nation:'haedong',biome:'woodland',map:[82,42],description:'계곡과 소나무 숲 · 돌계단을 따라 이어지는 산길',color:'#638766',ground:0,width:192,height:144}
};
export const continentLocations={village:[41,45],forest:[53,44],ruins:[56,29],meadow:[65,49],highlands:[71,28],coast:[65,69],marsh:[53,61],island:[83,72],deep:[78,86],...Object.fromEntries(Object.entries(continentRegions).map(([id,r])=>[id,r.map]))};
export function hash2(x,y,seed=0){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function landNoise(x,y,seed=0){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy),a=hash2(ix,iy,seed),b=hash2(ix+1,iy,seed),c=hash2(ix,iy+1,seed),d=hash2(ix+1,iy+1,seed);return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
export function continentSurface(region,x,y){const r=continentRegions[region];if(!r)return null;const n=landNoise(x/19,y/19,73),detail=landNoise(x/5,y/5,19),shore=112+9*Math.sin(x*.045)+6*Math.sin(x*.11),oasis=Math.hypot((x-127)/20,(y-83)/13),waterDistance=region==='desert'?Math.min(shore-y,(oasis-1)*11):region==='haedong'?Math.abs(x-(120+Math.sin(y*.045)*16))-5:region==='north'?Math.hypot((x-129)/24,(y-86)/17)*12-12:Math.hypot((x-132)/15,(y-92)/12)*10-10;
 const shelfEdge=46+7*Math.sin(x*.06)+4*Math.sin(x*.13),ramp=1-smooth(Math.abs(x-75)/9),shelf=smooth((shelfEdge-y)/1.5)*(1-ramp)*3.5,base=.35+n*.55+detail*.08,height=waterDistance<2?-.9+smooth((waterDistance+2)/4)*(base+1.1):base+shelf+(region==='haedong'?n*n*2:0);
 return {height,water:waterDistance<0,shore:waterDistance<3,biome:r.biome,moisture:Math.max(0,1-waterDistance/25),color:r.color};}
export function continentBlocked(region,x,y){const s=continentSurface(region,x,y);if(!s)return false;if(s.water||continentProps(region).some(o=>o.solid&&Math.hypot(o.x-x,o.y-y)<.6))return true;const dx=(continentSurface(region,x+.2,y).height-continentSurface(region,x-.2,y).height)/.4,dy=(continentSurface(region,x,y+.2).height-continentSurface(region,x,y-.2).height)/.4;return Math.hypot(dx,dy)>1.8;}
export const continentRoutes=[];
function connect(a,b,ax,ay,bx,by){continentRoutes.push({region:a,to:b,x:ax,y:ay,tx:bx,ty:by,label:continentRegions[b]?.name||({coast:'은빛 해안',highlands:'돌바람 고개',village:'변경 마을',meadow:'바람결 초원'})[b]},{region:b,to:a,x:bx,y:by,tx:ax,ty:ay,label:continentRegions[a]?.name||({coast:'은빛 해안',highlands:'돌바람 고개',village:'변경 마을',meadow:'바람결 초원'})[a]});}
connect('coast','desert',68,78,12,72);connect('highlands','north',72,12,75,100);connect('village','sanctuary',50,57,75,100);connect('meadow','haedong',156,72,12,72);
export const expeditionSites=[{id:'caravan-cache',region:'desert',x:32,y:72,tool:'shovel',hint:'반쯤 묻힌 대상의 표식',give:{salt:3,rope:2},gold:25},{id:'pilgrim-cache',region:'sanctuary',x:75,y:68,tool:'shovel',hint:'샘으로 향하는 순례자의 돌',give:{herb:3},gold:15},{id:'snow-cache',region:'north',x:75,y:78,tool:'pickaxe',hint:'얼음 사이의 푸른 광맥',give:{ore:4},gold:20},{id:'mountain-cache',region:'haedong',x:30,y:72,tool:'shovel',hint:'낡은 돌계단 아래의 흙',give:{moonherb:2},gold:15}];
const propCache=new Map();
export function continentProps(region){if(region!=='desert')return[];if(propCache.has(region))return propCache.get(region);const props=[{x:32,y:73,index:6,w:3.8,h:3.3,solid:false},{x:13,y:75,index:7,w:1.6,h:2.3,solid:false},{x:48,y:58,index:3,w:5,h:5.2,solid:true}];
 for(let i=0;i<160;i++){const x=5+hash2(i,7,44)*181,y=8+hash2(i,8,44)*124,s=continentSurface(region,x,y);if(s.water||Math.abs(y-72)<3||Math.abs(x-75)<4||Math.hypot(x-32,y-72)<6)continue;const palm=s.moisture>.5&&hash2(i,9,55)>.35,index=palm?i%2:i%7===0?2:4+i%2,h=palm?4+hash2(i,10,55)*2:index===2?2.5: .55+hash2(i,11,55)*.7;props.push({x,y,index,w:palm?h*.72:index===2?2.8:h*1.3,h,solid:palm||index===2});}propCache.set(region,props);return props;}
