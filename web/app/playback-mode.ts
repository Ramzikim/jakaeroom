export type PlayMode='single'|'all'|'shuffle';
export function nextTrack(mode:PlayMode,current:number,count:number,rng=Math.random){
 if(count<=1||mode==='single')return current;
 if(mode==='all')return (current+1)%count;
 return (current+1+Math.floor(rng()*(count-1)))%count;
}
