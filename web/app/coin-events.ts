'use client';
import {authClient} from './auth-client';
import type {ProgressionResult} from '../lib/progression';
export type CoinOrigin={x:number;y:number};
export type CoinRewardKind='interaction'|'passive'|'daily_login'|'letter'|'photo'|'special_letter';
export type CoinUpdate={userId:string;result:ProgressionResult;kind:CoinRewardKind;origin?:CoinOrigin};
const listeners=new Set<(event:CoinUpdate)=>void>();
export function subscribeCoins(listener:(event:CoinUpdate)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function publishCoins(event:CoinUpdate){listeners.forEach(listener=>listener(event));}
let pending=Promise.resolve();
export function queueCoinOperation(operation:()=>Promise<void>){
 pending=pending.then(operation).catch(()=>{if(process.env.NODE_ENV==='development')console.warn('Heart coin reward could not be confirmed');});
 return pending;
}
// Serialize writes and balance reads so older responses cannot roll the HUD back.
export function requestCoins(input:{kind:Exclude<CoinRewardKind,'photo'|'special_letter'>;action?:string;letterId?:string;eventId?:string},origin?:CoinOrigin){
 const client=authClient();
 const identity=client?.auth.getSession();
 const eventId=input.eventId??crypto.randomUUID();
 return queueCoinOperation(async()=>{
  const session=(await identity)?.data.session;if(!session)return;
  const current=(await client!.auth.getSession()).data.session;if(current?.user.id!==session.user.id)return;
  const response=await fetch('/api/progression',{method:'POST',headers:{Authorization:`Bearer ${current.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({...input,eventId})});
  if(!response.ok)throw Error('Reward unavailable');
  publishCoins({userId:session.user.id,result:await response.json(),kind:input.kind,origin});
 });
}
