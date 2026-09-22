'use client';
import {authClient} from './auth-client';
import {publishPhoto} from './photo-events';
import {publishCoins,queueCoinOperation,type CoinOrigin} from './coin-events';
import {availablePhotoCatalog,type PhotoAction} from '../lib/photos';
// Called only for an accepted action/animation transition, not clicks or frames.
// No guest records or client balance mutations.
export type PhotoActionResult={photoId:string|null;progression?:{collected_photo_ids:string[]};error?:boolean};
export async function recordPhotoAction(action:PhotoAction,origin?:CoinOrigin){
 if(action==='sleep'||!availablePhotoCatalog().length)return;
 const client=authClient();if(!client)return;
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 let output:PhotoActionResult={photoId:null,error:true};
 await queueCoinOperation(async()=>{
  const current=(await client.auth.getSession()).data.session;if(current?.user.id!==session.user.id)return;
  const eventId=crypto.randomUUID();
  const response=await fetch('/api/progression/photo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${current.access_token}`},body:JSON.stringify({action,eventId})});
  if(!response.ok){if(process.env.NODE_ENV==='development')console.warn('Photo acquisition unavailable',response.status);return;}
  const result=await response.json();
  if(process.env.NODE_ENV==='development')console.debug('Photo acquisition',action,result.photoId??'no drop');
  if((await client.auth.getSession()).data.session?.user.id!==session.user.id)return;
  output=result;
  if(result.progression)publishCoins({userId:session.user.id,kind:'photo',origin,result:{ok:true,newlyCollected:!!result.newlyCollected,delta:result.delta,progression:result.progression}});
  if(result.photoId)publishPhoto({photoId:result.photoId,userId:session.user.id});
 });
 return output;
}
