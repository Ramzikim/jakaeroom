'use client';
import {useSyncExternalStore} from 'react';
import {authClient} from './auth-client';
import {subscribeCoins} from './coin-events';
import {requestJson,withTimeout} from './request-json';
import type {Progression,ProgressionResult} from '../lib/progression';

type Snapshot={userId:string|null;progression:Progression|null};
const empty:Snapshot={userId:null,progression:null};
let snapshot=empty,revision=0,lastRead=0,inflight:Promise<void>|null=null,stop:(()=>void)|null=null;
const listeners=new Set<()=>void>();
function publish(next:Snapshot){snapshot=next;listeners.forEach(fn=>fn());}
function identity(userId:string|null){if(userId!==snapshot.userId){revision++;lastRead=0;inflight=null;publish({userId,progression:null});}}

// One read/poll shared by the HUD and cabinet; mutations invalidate older reads.
export function refreshProgression(force=false):Promise<void>{
 if(inflight)return inflight;
 if(!force&&Date.now()-lastRead<5_000)return Promise.resolve();
 const task=(async()=>{
  try{
   const session=(await withTimeout(authClient()?.auth.getSession()))?.data.session;
   if(!session||session.user.id!==snapshot.userId)return;
   const version=revision;
   const result=await requestJson<ProgressionResult>('/api/progression',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
   if(version===revision&&snapshot.userId===session.user.id){lastRead=Date.now();publish({userId:session.user.id,progression:result.progression});}
  }catch{/* Retain the last server-confirmed snapshot; the next focus/poll retries. */}
 })();
 inflight=task;void task.finally(()=>{if(inflight===task)inflight=null;});return task;
}
function start(){
 let live=true;const client=authClient();
 const off=subscribeCoins(event=>{if(event.userId===snapshot.userId){revision++;lastRead=Date.now();publish({userId:event.userId,progression:event.result.progression});}});
 const auth=client?.auth.onAuthStateChange((_event,session)=>{if(!live)return;identity(session?.user.id??null);setTimeout(()=>{if(live)void refreshProgression();},0);});
 const initialRevision=revision;
 void withTimeout(client?.auth.getSession()).then(result=>{if(live&&initialRevision===revision){identity(result?.data.session?.user.id??null);void refreshProgression();}}).catch(()=>{});
 const focus=()=>{if(document.visibilityState==='visible')void refreshProgression();};
 const timer=setInterval(focus,30_000);window.addEventListener('focus',focus);
 stop=()=>{live=false;off();auth?.data.subscription.unsubscribe();clearInterval(timer);window.removeEventListener('focus',focus);revision++;inflight=null;stop=null;};
}
function subscribe(listener:()=>void){listeners.add(listener);if(!stop)start();return()=>{listeners.delete(listener);if(!listeners.size)stop?.();};}
export function useProgression(){return useSyncExternalStore(subscribe,()=>snapshot,()=>empty);}
