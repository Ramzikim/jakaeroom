'use client';
import {useEffect} from 'react';
import {PHOTO_REGISTRY} from '../lib/photos';
import {GIFT_REGISTRY} from '../lib/gifts';

// Match the displayed URLs exactly, including the mailbox asset revision.
const urls=[...new Set([
 ...GIFT_REGISTRY.map(g=>g.imagePath+(g.id==='starlight_mailbox'?'?v=2':'')),
 ...PHOTO_REGISTRY.filter(p=>p.available).map(p=>p.assetPath),
])];
const requests=new Map<string,Promise<void>>();
function preload(url:string){
 const existing=requests.get(url);if(existing)return existing;
 const request=new Promise<void>(resolve=>{
  const image=new Image();image.decoding='async';image.fetchPriority='low';
  const finish=(ok:boolean)=>{clearTimeout(timer);image.onload=null;image.onerror=null;if(!ok)requests.delete(url);resolve();};
  const timer=setTimeout(()=>{image.src='';finish(false);},30_000);
  image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=url;
 });
 requests.set(url,request);return request;
}
export function usePreloadCollectionImages(ready:boolean){
 useEffect(()=>{
  if(!ready)return;
  let cancelled=false,index=0;
  const worker=async()=>{while(!cancelled&&index<urls.length)await preload(urls[index++]);};
  // Do not block the room or retain all decoded full-resolution images in memory.
  const timer=setTimeout(()=>{void Promise.all([worker(),worker(),worker()]);},500);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[ready]);
}
