'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {authClient} from './auth-client';
import {publishCoins,queueCoinOperation,subscribeCoins} from './coin-events';
import {GIFT_REGISTRY,GIFT_COPY,shoppingUnlocked,type Gift} from '../lib/gifts';
import type {Progression} from '../lib/progression';
import type {Band} from './behavior';
import {playSfx} from './sfx';
import './gift-ui.css';
const Context=createContext<{owned:readonly string[];confirmId:string|null;openCabinet:()=>void;offer:(gift:Gift,band?:Band)=>void}>({owned:[],confirmId:null,openCabinet:()=>{},offer:()=>{}});
export const useGifts=()=>useContext(Context);
export function GiftPrice({price}:{price:number|null}){return <span className="gift-price">{price===null?'편지 수집 보상':<><img src="/heart_coin.png?v=heart-coin-1" alt="하트코인"/>{price.toLocaleString('ko-KR')}</>}</span>;}
function GiftDialog({title,onClose,children,small=false,blocked=false}:{title:string;onClose:()=>void;children:ReactNode;small?:boolean;blocked?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.showModal();return()=>previous?.focus();},[]);
 return createPortal(<dialog ref={ref} className={`gift-modal ${small?'gift-confirm':''}`} aria-label={title} onCancel={e=>{if(blocked)e.preventDefault();}} onClose={onClose} onClick={e=>{if(!blocked&&e.target===ref.current)onClose();}}>
 <div className="gift-heading"><h2>{title}</h2><button disabled={blocked} aria-label="선물 팝업 닫기" onClick={onClose}>×</button></div>{children}</dialog>,document.body);
}
export function GiftProvider({children}:{children:ReactNode}){
 const [progression,setProgression]=useState<Progression|null>(null),[cabinet,setCabinet]=useState(false),[confirmation,setConfirmation]=useState<{gift:Gift;band?:Band}|null>(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(false);
 const user=useRef<string|null>(null),revision=useRef(0),busy=useRef(false);
 useEffect(()=>{
  let live=true;const client=authClient();
  const refresh=async()=>{const session=(await client?.auth.getSession())?.data.session;if(!live)return;if(user.current!==(session?.user.id??null)){user.current=session?.user.id??null;revision.current++;setProgression(null);setConfirmation(null);setNotice(false);}
   if(!session)return;const version=revision.current;
   try{const response=await fetch('/api/progression',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});if(response.ok){const data=await response.json();if(live&&version===revision.current&&user.current===session.user.id)setProgression(data.progression);}}catch{}
  };
  const off=subscribeCoins(event=>{if(event.userId===user.current){revision.current++;setProgression(event.result.progression);}});
  void refresh();const auth=client?.auth.onAuthStateChange(()=>{setTimeout(()=>void refresh(),0);});
  const timer=setInterval(()=>void refresh(),15000);window.addEventListener('focus',refresh);
  return()=>{live=false;off();auth?.data.subscription.unsubscribe();clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[]);
 useEffect(()=>{if(notice){const timer=setTimeout(()=>setNotice(false),4500);return()=>clearTimeout(timer);}},[notice]);
 const owned=progression?.owned_gift_ids??[];
 const offer=(gift:Gift,band?:Band)=>{if(!gift.isPurchasable||owned.includes(gift.id))return;setError('');setConfirmation({gift,band});playSfx('ui');};
 async function purchase(){
  if(!confirmation||busy.current)return;busy.current=true;setPending(true);setError('');
  const selected=confirmation;
  await queueCoinOperation(async()=>{
   try{
    const session=(await authClient()?.auth.getSession())?.data.session;if(!session){setError('로그인 후 선물할 수 있어요.');return;}
    const response=await fetch('/api/gifts',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({giftId:selected.gift.id,route:selected.gift.acquisitionType,band:selected.band})});
    const result=await response.json();if(user.current!==session.user.id)return;
    if(result.progression)publishCoins({userId:session.user.id,kind:'interaction',result:{ok:true,newlyCollected:false,delta:0,progression:result.progression}});
    if(!result.ok){setError(result.reason==='insufficient_funds'?'하트코인이 부족해요.':result.reason==='already_owned'?'이미 보유한 선물이에요.':result.reason==='wrong_band'?'방송 시간대가 바뀌었어요.':result.reason==='shopping_locked'?'미미와 싱파를 먼저 선물해 주세요.':'구매하지 못했어요. 다시 시도해 주세요.');return;}
    if(selected.gift.acquisitionType==='cabinet_order'&&shoppingUnlocked(result.ownedGiftIds))setNotice(true);
    setConfirmation(null);playSfx('ui');
   }catch{setError('구매하지 못했어요. 다시 시도해 주세요.');}
  });busy.current=false;setPending(false);
 }
 return <Context.Provider value={{owned,confirmId:confirmation?.gift.id??null,openCabinet:()=>{playSfx('ui');setCabinet(true);},offer}}>{children}
 {cabinet&&<GiftDialog title="작애의 선물 장식장" onClose={()=>setCabinet(false)}><div className="gift-grid">{GIFT_REGISTRY.map(gift=>{const has=owned.includes(gift.id),copy=GIFT_COPY[gift.id];return <article className="gift-card" key={gift.id}>
 <div className="gift-thumbnail">{has?<img src={gift.imagePath+(gift.id==='starlight_mailbox'?'?v=2':'')} alt={gift.name}/>:<span role="img" aria-label="미보유 선물">🔒</span>}</div><h3>{gift.name}</h3><GiftPrice price={gift.price}/><p>{has?copy.description:copy.hint}</p>
 {has?<strong className="gift-owned">보유 중</strong>:gift.acquisitionType==='cabinet_order'?<button onClick={()=>offer(gift)}>구매하기</button>:null}</article>;})}</div><button className="gift-done" onClick={()=>setCabinet(false)}>닫기</button></GiftDialog>}
 {confirmation&&<GiftDialog title={`${confirmation.gift.name}를 작애에게 선물할까요?`} small blocked={pending} onClose={()=>{if(!busy.current)setConfirmation(null);}}><div className="gift-confirm-body"><GiftPrice price={confirmation.gift.price}/>{error&&<p role="alert">{error}</p>}<div className="gift-confirm-actions"><button disabled={pending} onClick={()=>setConfirmation(null)}>아니요</button><button disabled={pending} onClick={()=>void purchase()}>{pending?'선물하는 중…':'선물할게요!'}</button></div></div></GiftDialog>}
 {notice&&createPortal(<div className="gift-unlock" role="status">이제 TV에서도 작애 선물을 살 수 있어요!</div>,document.querySelector('dialog[open]')??document.body)}
 </Context.Provider>;
}
