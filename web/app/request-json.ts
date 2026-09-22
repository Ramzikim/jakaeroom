// Session refresh is read-only; a hung refresh must not occupy the mutation queue.
export async function withTimeout<T>(value:PromiseLike<T>|T,timeoutMs=8_000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([Promise.resolve(value),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Session timed out')),timeoutMs);})]);}
 finally{clearTimeout(timer);}
}
// Bound both the request and body read; abort before releasing the mutation queue.
export async function requestJson<T = any>(url:string,init:RequestInit={},timeoutMs=12_000):Promise<T>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(url,{...init,signal:controller.signal});
  if(!response.ok)throw new Error(`Request failed (${response.status})`);
  return await response.json() as T;
 }finally{clearTimeout(timer);}
}
