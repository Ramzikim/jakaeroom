'use client';
import {requestJson,withTimeout} from './request-json';
import {authClient} from './auth-client';
import type {ProgressionResult} from '../lib/progression';
export type CoinOrigin={x:number;y:number};
export type CoinRewardKind='interaction'|'passive'|'daily_login'|'letter'|'photo'|'special_letter';
export type CoinUpdate={userId:string;result:ProgressionResult;kind:CoinRewardKind;origin?:CoinOrigin};
const listeners=new Set<(event:CoinUpdate)=>void>();
export function subscribeCoins(listener:(event:CoinUpdate)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function publishCoins(event:CoinUpdate){listeners.forEach(listener=>listener(event));}
const operations:{run:()=>Promise<void>;done:()=>void}[]=[];
let running=false;
async function drainOperations(){
 if(running)return;running=true;
 try{while(operations.length){const task=operations.shift()!;try{await task.run();}catch{if(process.env.NODE_ENV==='development')console.warn('Heart coin reward could not be confirmed');}finally{task.done();}}}finally{running=false;}
}
export function queueCoinOperation(operation:()=>Promise<void>,priority=false){
 return new Promise<void>(resolve=>{const task={run:operation,done:resolve};if(priority)operations.unshift(task);else operations.push(task);void drainOperations();});
}
// Serialize writes and balance reads so older responses cannot roll the HUD back.
export function requestCoins(input:{kind:Exclude<CoinRewardKind,'photo'|'special_letter'>;action?:string;letterId?:string;eventId?:string},origin?:CoinOrigin){
 const client=authClient();
 const identity=client?.auth.getSession();
 const eventId=input.eventId??crypto.randomUUID();
 return queueCoinOperation(async()=>{
  const session=(await withTimeout(identity))?.data.session;if(!session)return;
  const current=(await withTimeout(client!.auth.getSession())).data.session;if(current?.user.id!==session.user.id)return;
  const result=await requestJson<ProgressionResult>('/api/progression',{method:'POST',headers:{Authorization:`Bearer ${current.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({...input,eventId})});
  publishCoins({userId:session.user.id,result,kind:input.kind,origin});
 });
}
