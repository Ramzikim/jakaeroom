'use client';
export type PhotoDiscovery={photoId:string;userId:string};
const listeners=new Set<(event:PhotoDiscovery)=>void>();
export function subscribePhotos(listener:(event:PhotoDiscovery)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function publishPhoto(event:PhotoDiscovery){listeners.forEach(listener=>listener(event));}
const hugListeners=new Set<()=>void>();
export function subscribeHugClose(listener:()=>void){hugListeners.add(listener);return()=>{hugListeners.delete(listener);};}
export function finishHugPhoto(){hugListeners.forEach(listener=>listener());}
