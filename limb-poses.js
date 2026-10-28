export function survivingGrip(direction){const dir=direction<4?direction:direction===4||direction===5?0:3;return dir===0?{x:-13,y:-25}:dir===3?{x:13,y:-27}:dir===1?{x:-17,y:-26}:{x:17,y:-26};}
