export type LetterNotice={userId:string;letterId:string};
const listeners=new Set<(notice:LetterNotice)=>void>();
const seen=new Set<string>();
export function subscribeLetterNotices(listener:(notice:LetterNotice)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function publishLetterAcquisitions(userId:string,eventId:string,ids:readonly string[]){
 for(const letterId of ids){if(letterId!=='letter_28'&&!/^special_0[1-4]$/.test(letterId))continue;
 const key=userId+':'+eventId+':'+letterId;if(seen.has(key))continue;seen.add(key);
 listeners.forEach(listener=>listener({userId,letterId}));}
}
