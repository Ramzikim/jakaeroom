export type PlayMode='single'|'all'|'shuffle';
export function nextTrack(mode:PlayMode,current:number,count:number,rng=Math.random){
 if(count<=1||mode==='single')return current;
 if(mode==='all')return (current+1)%count;
 return (current+1+Math.floor(rng()*(count-1)))%count;
}
export function endedTrack(mode:PlayMode,current:number,count:number,repeat:boolean,finished:number){
 if(count===0)return null;
 if(!repeat&&(mode==='shuffle'?finished>=count:mode==='all'&&current===count-1))return null;
 return nextTrack(mode,current,count);
}
