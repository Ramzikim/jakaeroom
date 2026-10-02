'use client';
import {useEffect,useRef,useState} from 'react';
import {authClient} from './auth-client';
import {useGifts} from './gift-ui';
import {subscribeLetterNotices,type LetterNotice} from './letter-notices';
export function LetterNoticePopup({onRead}:{onRead:(id:string)=>Promise<boolean>}){
 const dialog=useRef<HTMLDialogElement>(null),[queue,setQueue]=useState<LetterNotice[]>([]),gifts=useGifts();
 const notice=queue[0],mailbox=notice?.letterId==='letter_28';
 const action=useRef<(()=>void)|null>(null),identity=useRef<string|null|undefined>(undefined);
 useEffect(()=>subscribeLetterNotices(n=>setQueue(q=>[...q,n])),[]);
 useEffect(()=>{const sub=authClient()?.auth.onAuthStateChange((_event,session)=>{
 const id=session?.user.id??null;if(identity.current!==undefined&&identity.current!==id){action.current=null;setQueue([]);dialog.current?.close();}identity.current=id;
 });return()=>sub?.data.subscription.unsubscribe();},[]);
 useEffect(()=>{
 const el=dialog.current;if(!el)return;if(!notice){el.close();return;}
 // Wait for the reader (especially letter 28) and other native dialogs to close.
 const show=()=>{if(!el.open&&!document.querySelector('dialog[open]'))el.showModal();};
 const observer=new MutationObserver(records=>{if(records.some(r=>r.target!==el))show();});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});show();return()=>observer.disconnect();
 },[notice]);
 const close=()=>{setQueue(q=>q.slice(1));const next=action.current;action.current=null;next?.();};
 return <dialog ref={dialog} className="letter-notice" data-collection-ui aria-labelledby="letter-notice-title" onClose={close} onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}>
 <h2 id="letter-notice-title">{mailbox?'별빛편지함이 도착했어요 ✦':'특별 편지를 받았어!'}</h2>
 <p>{mailbox?'작애가 보내온 스물여덟 번의 마음이\n어느새 차곡차곡 모였어요.\n\n그 편지들이 오래 머물 수 있도록,\n별빛편지함이 작애의 방에 도착했어요.':'어디선가 특별한 편지가 도착했어요.\n도감에서 확인해 보세요.'}</p>
 {mailbox&&<p className="notice-secondary">별빛편지함을 선물로 받았어요.</p>}
 <div className="notice-actions"><button onClick={()=>{if(!notice)return;action.current=mailbox?()=>gifts.openCabinet():()=>{void onRead(notice.letterId);};dialog.current?.close();}}>{mailbox?'장식장 보러가기':'편지 확인하기'}</button><button onClick={()=>dialog.current?.close()}>{mailbox?'닫기':'나중에 볼게요'}</button></div>
 </dialog>;
}
