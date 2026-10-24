// Measured transparent full-body crops. Every frame shares a foot baseline and height.
export const WATCHER_POSES=[[66,6,224,504],[449,4,210,503],[861,5,229,505],[1244,5,212,505],[28,512,315,491],[435,512,298,498],[828,512,285,498],[1198,512,304,493]];
export function watcherPose(enemy,t=0,reduced=false){
 const phase=(enemy.phaseTime||0)%9;
 if(enemy.punish)return reduced?6:(Math.floor(t/220)%2?6:2);
 if(enemy.signal==='watch')return 2;
 if(enemy.signal==='turn')return phase<5.25?0:phase<5.75?1:2;
 if((enemy.phaseTime||0)>9&&phase<.5)return 3;
 return reduced?0:(Math.floor(t/480)%2?4:0);
}
