'use client';
import {requestJson,withTimeout} from './request-json';
import {authClient} from './auth-client';
import {publishCoins,queueCoinOperation,type CoinOrigin} from './coin-events';
import {advanceLetters,emptyLetterState,type LetterAction,type LetterState} from '../lib/letter-rules';
import type {LetterResult} from '../lib/server/letters';
import {readCounts} from './behavior';
export type LetterEventResult={letterId:string|null;reason?:string|null;state:LetterState;collected:string[]};
export async function requestLetterEvent(action:LetterAction,letterId?:string,origin?:CoinOrigin):Promise<LetterEventResult|null>{
 const client=authClient(),identity=client?.auth.getSession(),eventId=crypto.randomUUID(),clickedAt=Date.now();let output:LetterEventResult|null=null;
 await queueCoinOperation(async()=>{
  const session=(await withTimeout(identity))?.data.session;
  if(!session){
   let saved:{state:LetterState;collected:string[]}|null=null;
   try{saved=JSON.parse(localStorage.getItem('jakae-guest-letters')||'null');}catch{}
   const state=saved?.state??emptyLetterState();
   if(!saved){const counts=readCounts(localStorage.getItem('jakae-letter-counts'));state.date=counts.date;state.counts=counts;}
   const next=advanceLetters(state,saved?.collected??[],action,Date.now(),'normal',letterId,undefined,clickedAt);
   localStorage.setItem('jakae-guest-letters',JSON.stringify({state:next.state,collected:next.owned}));
   output={letterId:next.letterId,reason:next.reason,state:next.state,collected:next.owned};return;
  }
  const current=(await withTimeout(client!.auth.getSession())).data.session;if(current?.user.id!==session.user.id)return;
  const result=await requestJson<LetterResult>('/api/letters',{method:'POST',headers:{Authorization:`Bearer ${current.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({action,eventId,letterId,...(action==='drawer'?{clickedAt}:{})})});
  if((await withTimeout(client!.auth.getSession())).data.session?.user.id!==session.user.id)return;
  publishCoins({userId:session.user.id,result,kind:action==='regular'?'letter':'special_letter',origin});
  output={letterId:result.letterId,reason:result.reason,state:result.progression.letter_state!,collected:result.progression.collected_letter_ids};
 });
 return output;
}
