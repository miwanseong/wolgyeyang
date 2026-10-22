// Original runtime pixel illustrations. All surfaces share the game's grayscale palette.
const surface=(w,h,name)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.dataset.asset=name;return c;};
export function facilityArt(){return Array.from({length:9},(_,index)=>{
 const canvas=surface(128,128,'facility-'+index),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},line=(x,y,xx,yy,color='#888',width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();},poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const cabinet=(x,y,w,h)=>{box(x+4,y+h,w-8,5,'#111');box(x,y,w,h,'#292b2b');poly([[x,y],[x+8,y-7],[x+w+8,y-7],[x+w,y]],'#777');poly([[x+w,y],[x+w+8,y-7],[x+w+8,y+h-7],[x+w,y+h]],'#181a1a');box(x+3,y+3,w-6,h-6,'#454747');line(x+3,y+3,x+w-3,y+3,'#aaa');};
 const paper=(x,y)=>{box(x,y,18,22,'#a8a59b');for(let j=5;j<20;j+=4)box(x+3,y+j,12,1,'#565650');};
 if(index===0){
  cabinet(10,65,104,48);poly([[10,65],[22,36],[114,36],[114,65]],'#77776f');box(8,60,108,6,'#a09e93');box(15,72,94,4,'#66645c');line(62,77,62,108,'#222');box(26,84,20,2,'#999');paper(36,37);box(70,40,31,15,'#222');for(let j=0;j<3;j++)box(74+j*8,43,5,9,'#999');box(21,42,6,16,'#222');line(23,42,25,30,'#bbb');
 }else if(index===1){
  box(25,32,73,82,'#282828');box(20,18,10,104,'#393734');box(94,18,10,104,'#393734');box(28,16,70,13,'#77746d');box(29,30,66,79,'#a3a098');box(34,34,55,20,'#cfcbc0');box(37,36,49,14,'#bfbcb3');box(29,57,66,51,'#575a59');box(29,57,66,8,'#777d7a');for(let y=72;y<105;y+=12)line(33,y,90,y-2,'#757975');box(24,110,77,9,'#76736a');box(25,119,7,6,'#292929');box(94,119,7,6,'#292929');
 }else if(index===2){
  cabinet(9,66,104,45);poly([[9,66],[22,39],[122,39],[113,66]],'#9a9a94');box(58,44,39,15,'#303638');box(62,46,31,10,'#5e6868');line(86,44,86,29,'#ccc',3);line(86,29,75,29,'#ccc',3);box(25,40,20,16,'#777');box(27,32,16,12,'#888');line(28,32,40,32,'#ccc',2);line(45,43,50,46,'#aaa',3);box(19,80,31,22,'#555');box(57,80,48,22,'#555');box(60,83,8,2,'#bbb');
 }else if(index===3){
  cabinet(15,23,91,92);for(let row=0;row<3;row++){box(20,28+row*27,80,23,'#141717');for(let col=0;col<9;col++){const x=22+col*8,y=31+row*27;box(x,y+(col%3),6,18-(col%3),['#92918b','#5b5c59','#777972'][col%3]);box(x+2,y+4,3,3,'#c0bdb3');}box(18,51+row*27,87,3,'#85877e');}c.strokeStyle='#aaa';c.lineWidth=3;c.beginPath();c.arc(105,87,11,0,Math.PI*2);c.stroke();line(94,87,116,87,'#aaa',2);line(105,76,105,98,'#aaa',2);box(23,118,82,3,'#999');
 }else if(index===4){
  cabinet(35,33,49,74);box(39,38,40,13,'#797e7e');box(42,41,16,6,'#141b1b');box(65,43,5,3,'#bbb');for(let y=60;y<94;y+=5)box(40,y,38,2,'#171b1b');box(40,111,9,8,'#111');box(75,111,9,8,'#111');box(52,98,18,6,'#8b9292');
 }else if(index===5){
  box(12,104,104,12,'#353939');box(16,99,96,7,'#7b8181');box(34,67,59,31,'#505959');for(let x=40;x<90;x+=7)line(x,70,x,95,'#202b2c',3);box(34,62,58,5,'#929b9b');c.fillStyle='#697677';c.beginPath();c.ellipse(32,82,17,20,0,0,7);c.fill();c.strokeStyle='#a7adab';c.lineWidth=3;c.stroke();box(9,72,19,16,'#777f7c');box(10,39,13,35,'#6c7571');box(6,36,23,7,'#a1a8a4');box(88,73,28,14,'#6b7372');box(106,45,12,31,'#6b7372');box(102,42,20,6,'#aaa');line(64,63,64,32,'#bbb',3);c.fillStyle='#b5b8af';c.beginPath();c.arc(64,28,10,0,7);c.fill();line(64,28,68,23,'#222',2);
 }else if(index===6||index===7){
  cabinet(28,15,67,104);box(35,24,52,83,index===6?'#333739':'#555955');line(61,24,61,108,'#111',2);box(54,63,3,12,'#aaa');for(let y=34;y<54;y+=5){box(38,y,18,2,'#111');box(67,y,16,2,'#111');}for(let y=86;y<106;y+=5){box(38,y,18,2,'#111');box(67,y,16,2,'#111');}box(39,62,5,4,'#bbb');if(index===7){box(21,11,83,5,'#a1a29a');line(44,119,44,128,'#777',6);line(75,119,75,128,'#777',6);}
 }else{
  cabinet(9,66,105,18);box(13,82,9,39,'#303434');box(103,82,9,39,'#303434');box(11,102,100,5,'#4c5352');poly([[9,66],[23,45],[122,45],[114,66]],'#8a8b82');box(19,51,22,12,'#474a49');box(21,41,17,10,'#999');box(25,36,7,9,'#777');line(40,56,58,56,'#bbb',3);line(54,50,54,63,'#999',2);paper(70,42);line(99,49,99,27,'#aaa',3);c.fillStyle='#ccc';c.beginPath();c.arc(99,24,11,0,7);c.fill();line(99,24,104,19,'#222',2);
 }
 return canvas;
});}
export function residentArt(){return Array.from({length:24},(_,index)=>{
 const canvas=surface(64,96,'resident-'+index),c=canvas.getContext('2d'),person=Math.floor(index%6/2),frame=index%2,row=Math.floor(index/6),side=row===1||row===2,back=row===3;
 const skin='#bcb9b2',hair=['#272729','#78756f','#242628'][person],coat=['#505157','#66635e','#555a59'][person];
 const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
 const path=(d,color,stroke='#18191a')=>{c.fillStyle=color;c.strokeStyle=stroke;c.lineWidth=1;c.beginPath();d(c);c.closePath();c.fill();c.stroke();};
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 // Shaped cloth, tapered limbs and shaded hair avoid rectangular mannequin silhouettes.
 path(c=>{c.moveTo(22,70);c.lineTo(31,72);c.lineTo(29,88+(frame?1:0));c.lineTo(19,91);c.lineTo(19,86);},'#303135');
 path(c=>{c.moveTo(34,72);c.lineTo(43,70);c.lineTo(45,87-(frame?1:0));c.lineTo(36,91);c.lineTo(34,86);},'#292b2d');
 ellipse(23,91+(frame?1:0),9,3,'#101214');ellipse(41,91-(frame?1:0),8,3,'#111315');
 path(c=>{c.moveTo(24,37);c.quadraticCurveTo(15,39,15,48);c.lineTo(19,65);c.lineTo(15,80);c.quadraticCurveTo(31,86,48,79);c.lineTo(43,62);c.lineTo(47,46);c.quadraticCurveTo(44,39,39,37);},coat);
 path(c=>{c.moveTo(27,39);c.lineTo(36,39);c.lineTo(40,66);c.lineTo(25,66);},person===2?'#767b77':'#a4a29a');
 path(c=>{c.moveTo(23,38);c.lineTo(30,44);c.lineTo(26,49);c.lineTo(32,55);c.lineTo(29,79);c.lineTo(18,77);},coat);
 path(c=>{c.moveTo(38,38);c.lineTo(34,45);c.lineTo(40,50);c.lineTo(35,55);c.lineTo(38,80);c.lineTo(46,77);},coat);
 if(person===0){r(31,43,2,17,'#37383c');r(29,43,6,3,'#35363b');}if(person===1){path(c=>{c.moveTo(21,67);c.lineTo(42,67);c.lineTo(46,86);c.quadraticCurveTo(29,91,18,85);},'#3b3d43');}
 if(person===2){r(20,66,24,4,'#252827');r(39,63,6,13,'#333837');r(40,64,3,3,'#a9aaa4');r(21,48,7,6,'#3b4240');r(34,48,7,6,'#353c3a');}
 for(const [x,dy]of [[16,frame?2:0],[44,frame?0:2]]){
  path(c=>{c.moveTo(x,42+dy);c.quadraticCurveTo(x-4,48,x-3,58+dy);c.lineTo(x-1,73+dy);c.lineTo(x+5,72+dy);c.lineTo(x+5,48+dy);},coat);
  ellipse(x+2,75+dy,3,4,skin);r(x-1,70+dy,6,3,'#323435');
 }
 ellipse(32,23,16,19,hair);ellipse(side?(row===1?29:35):32,25,11,14,skin);
 path(c=>{c.moveTo(17,23);c.quadraticCurveTo(15,3,32,5);c.quadraticCurveTo(50,5,48,28);c.lineTo(43,36);c.lineTo(42,18);c.lineTo(37,25);c.lineTo(36,16);c.lineTo(29,24);c.lineTo(28,17);c.lineTo(21,27);c.lineTo(21,36);c.lineTo(16,31);},hair);
 c.strokeStyle=person===1?'#a19c92':'#444448';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(25+i*3,9);c.quadraticCurveTo(17+i*5,15,20+i*5,25);c.stroke();}
 if(person===1)ellipse(43,9,7,7,'#77736e');
 if(back){ellipse(32,25,14,16,hair);c.strokeStyle='#7772';for(let i=0;i<4;i++){c.beginPath();c.moveTo(24+i*5,13);c.lineTo(23+i*5,36);c.stroke();}}
 else{
  const eyes=side?[row===1?24:39]:[26,38];for(const x of eyes){r(x-2,26,5,1,'#302d2e');r(x,27,2,2,'#18191c');r(x-1,29,3,1,'#8d8982');}
  r(side?(row===1?21:43):32,30,1,2,'#6f6b65');r(side?(row===1?25:38):30,35,5,1,'#716862');
  if(person===0){c.strokeStyle='#22262a';for(const x of eyes){c.beginPath();c.ellipse(x,28,5,3,0,0,7);c.stroke();}r(31,27,3,1,'#333');}
 }
 return canvas;
});}
