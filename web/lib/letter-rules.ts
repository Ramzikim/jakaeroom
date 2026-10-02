import {letters,selectLetter,FINAL_LETTER_PREREQUISITES,legacyLetterIds} from '../app/letters.ts';
import type {Band} from '../app/behavior.ts';
import type {Tier} from '../app/profile.ts';
import {kst} from '../app/life.ts';
import {kstDate} from '../app/behavior.ts';

export type LetterAction='load'|'regular'|'reread'|'drawer'|'interrupt'|'pet'|'sleep'|'sleep_end'|'awake';
export type LetterState={version:number;date:string;counts:Partial<Record<Band,number>>;drawer?:{count:number;at:number};pet?:{start:number;counts:number[]};validPetCount?:number;sleep?:{start:number;at:number};hugRevealed?:boolean;vipIds:string[]};
export const emptyLetterState=():LetterState=>({version:0,date:'',counts:{},vipIds:[]});
export function normalizeLetterIds(ids:readonly string[]){return [...new Set(ids.map(id=>{const i=legacyLetterIds.indexOf(id);return i<0?id:letters[i].id;}))];}
export function letterClock(now:number){const date=new Date(now);return {date:kstDate(date),band:kst(date).period};}
// Server time and a server-loaded profile are the only inputs for eligibility.
export function advanceLetters(previous:LetterState,collected:readonly string[],action:LetterAction,now:number,tier:Tier='normal',rereadId?:string,bandOverride?:Band,drawerClickedAt=now){
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
  else{const old=state.drawer;state.drawer={count:old&&drawerClickedAt>=old.at&&drawerClickedAt-old.at<=2000?old.count+1:1,at:drawerClickedAt};if(state.drawer.count>=10){grant('special_01');delete state.drawer;}}
 }
 // Legacy window progress is not a lifetime count and must never unlock a letter.
 delete state.pet;
 if(action==='pet')state.validPetCount=(state.validPetCount??0)+1;
 if((state.validPetCount??0)>=50)grant('special_02');
 if(action==='sleep'&&clock.band==='dawn'&&!owned.includes('special_03')){
  if(!state.sleep||now-state.sleep.at>45_000)state.sleep={start:now,at:now};
  state.sleep.at=now;if(now-state.sleep.start>=300_000){grant('special_03');delete state.sleep;}
 }else if(action==='sleep')delete state.sleep;
 if(FINAL_LETTER_PREREQUISITES.every(id=>owned.includes(id)))grant('special_04');
 if(owned.includes('letter_28')&&tier!=='normal'&&state.vipIds.length===0)state.vipIds.push(tier);
 if(letters.every(l=>owned.includes(l.id))||(tier!=='normal'&&owned.includes('letter_22')))state.hugRevealed=true;
 return {state,owned,grants,letterId,reason};
}
