import {letters,selectLetter,FINAL_LETTER_PREREQUISITES,legacyLetterIds} from '../app/letters.ts';
import type {Band} from '../app/behavior.ts';
import type {Tier} from '../app/profile.ts';
import {kst} from '../app/life.ts';
import {kstDate} from '../app/behavior.ts';

export type LetterAction='load'|'regular'|'reread'|'drawer'|'interrupt'|'pet'|'sleep'|'sleep_end'|'awake';
export type LetterState={version:number;date:string;counts:Partial<Record<Band,number>>;drawer?:{count:number;at:number};pet?:{start:number;counts:number[]};sleep?:{start:number;at:number};vipIds:string[]};
export const emptyLetterState=():LetterState=>({version:0,date:'',counts:{},vipIds:[]});
export function normalizeLetterIds(ids:readonly string[]){return [...new Set(ids.map(id=>{const i=legacyLetterIds.indexOf(id);return i<0?id:letters[i].id;}))];}
export function letterClock(now:number){const date=new Date(now);return {date:kstDate(date),band:kst(date).period};}
// Server time and a server-loaded profile are the only inputs for eligibility.
export function advanceLetters(previous:LetterState,collected:readonly string[],action:LetterAction,now:number,tier:Tier='normal',rereadId?:string,bandOverride?:Band){
 const state=structuredClone(previous),clock=letterClock(now),owned=normalizeLetterIds(collected),grants:string[]=[];
 if(bandOverride)clock.band=bandOverride;
 let letterId:string|null=null,reason:string|null=null;
 if(state.date!==clock.date){state.date=clock.date;state.counts={};}
 const grant=(id:string)=>{if(!owned.includes(id)){owned.push(id);grants.push(id);}};
 if(action==='sleep_end'&&clock.band==='dawn'&&state.sleep&&now-state.sleep.at<=45_000&&now-state.sleep.start>=300_000)grant('special_03');
 if(!['load','sleep','sleep_end','awake','drawer'].includes(action))delete state.drawer;
 if(!['load','sleep'].includes(action))delete state.sleep;
 if(action==='regular'){
  const next=selectLetter(owned);
  if(!next)reason='complete';
  else if((state.counts[clock.band]??0)>=2)reason='quota';
  else{letterId=next.id;grant(next.id);state.counts[clock.band]=(state.counts[clock.band]??0)+1;}
 }
 if(action==='reread'){if(rereadId&&(owned.includes(rereadId)||state.vipIds.includes(rereadId)))letterId=rereadId;else reason='not_collected';}
 if(action==='drawer'){
  if(!owned.includes('letter_21')||owned.includes('special_01'))delete state.drawer;
  else{const old=state.drawer;state.drawer={count:old&&now-old.at<=2000?old.count+1:1,at:now};if(state.drawer.count>=10){grant('special_01');delete state.drawer;}}
 }
 if(!owned.includes('special_02')){
  const pet=state.pet;
  if(pet){const window=Math.floor((now-pet.start)/300_000),completed=Math.min(window,3);
   if(pet.counts.slice(0,completed).some(n=>n<5)||pet.counts.length<completed)delete state.pet;
   else if(window>=3){grant('special_02');delete state.pet;}
  }
  if(action==='pet'&&!owned.includes('special_02')){state.pet??={start:now,counts:[0,0,0]};const i=Math.floor((now-state.pet.start)/300_000);state.pet.counts[i]=(state.pet.counts[i]??0)+1;}
 }
 if(action==='sleep'&&clock.band==='dawn'&&!owned.includes('special_03')){
  if(!state.sleep||now-state.sleep.at>45_000)state.sleep={start:now,at:now};
  state.sleep.at=now;if(now-state.sleep.start>=300_000){grant('special_03');delete state.sleep;}
 }else if(action==='sleep')delete state.sleep;
 if(FINAL_LETTER_PREREQUISITES.every(id=>owned.includes(id)))grant('special_04');
 if(owned.includes('letter_28')&&tier!=='normal'&&state.vipIds.length===0)state.vipIds.push(tier);
 return {state,owned,grants,letterId,reason};
}
