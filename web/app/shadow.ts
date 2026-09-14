// Foot lift measured from the existing hop PNG alpha bounds; artwork remains unchanged.
const hopLift=[0,0,0,1,.574,.148,0,0];
export function shadowSurfaceY(x:number,z:number,footY:number){
 // The rug rises 0.034 above the floor. Cover its bounds, including the soft edge.
 const rug=x>=-1.425&&x<=2.325&&z>=-.475&&z<=2.575;
 return Math.max(footY,rug?.034:0)+.008;
}
export function shadowStyle(sequence:string,frame:number){
 const i=Math.max(0,Math.min(7,frame)),a=Math.floor(i),t=i-a;
 const lift=sequence==='hop'?hopLift[a]*(1-t)+hopLift[Math.min(7,a+1)]*t:0;
 const seated=sequence.startsWith('sit_');
 return {width:.7*(seated?.85:1-.425*lift),height:.16*(seated?.8:1-.425*lift),opacity:seated?.20:.22-.085*lift,blur:20+8*lift,visible:sequence!=='bath'};
}
