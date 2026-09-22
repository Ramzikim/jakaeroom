'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Session} from '@supabase/supabase-js';
import {HEART_COIN} from '../lib/progression';
import {kstDate} from './behavior';
import {requestCoins,subscribeCoins,type CoinUpdate} from './coin-events';
const coinIcon='/heart_coin.png?v=heart-coin-1';

export function HeartCoinHud({session,ready}:{session:Session|null;ready:boolean}){
 const [balance,setBalance]=useState<number|null>(null),[display,setDisplay]=useState(0),[queue,setQueue]=useState<(CoinUpdate&{id:number})[]>([]);
 const hud=useRef<HTMLSpanElement>(null),shown=useRef(0),serial=useRef(0),revision=useRef(0);
 const active=queue[0];
 useEffect(()=>{
  let live=true;setBalance(session?null:0);setDisplay(0);shown.current=0;setQueue([]);
  if(!ready||!session)return;
  const userId=session.user.id;
  const unsubscribe=subscribeCoins(event=>{if(!live||event.userId!==userId)return;revision.current++;setBalance(event.result.progression.heart_coin_balance);
   if(event.result.ok&&event.result.delta>0)setQueue(q=>[...q,{...event,id:++serial.current}]);
  });
  const refresh=async()=>{const version=revision.current;try{const response=await fetch('/api/progression',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});if(!response.ok)return;const data=await response.json();if(live&&version===revision.current)setBalance(data.progression.heart_coin_balance);}catch{/* Keep last confirmed balance. */}};
  void refresh().then(()=>{if(live)void requestCoins({kind:'daily_login'});});
  const passive=setInterval(()=>void requestCoins({kind:'passive'}),HEART_COIN.passiveIntervalMs);
  let date=kstDate();
  const poll=setInterval(()=>{void refresh();if(date!==kstDate()){date=kstDate();void requestCoins({kind:'daily_login'});}},15000);
  window.addEventListener('focus',refresh);
  return()=>{live=false;unsubscribe();clearInterval(passive);clearInterval(poll);window.removeEventListener('focus',refresh);};
 },[session?.user.id,session?.access_token,ready]);
 useEffect(()=>{
  if(balance===null)return;
  const from=shown.current,start=performance.now();let frame=0;
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/400);shown.current=Math.round(from+(balance-from)*t);setDisplay(shown.current);if(t<1)frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[balance]);
 useEffect(()=>{if(!active)return;const timer=setTimeout(()=>setQueue(q=>q.slice(1)),1600);return()=>clearTimeout(timer);},[active?.id]);
 const target=hud.current?.getBoundingClientRect();
 const isLetter=active?.kind==='letter'||active?.kind==='special_letter';
 const letterDialog=typeof document==='undefined'?null:document.querySelector('dialog.letter[open]');
 return <div className="heart-coin-area">
  <span ref={hud} className="heart-coin-hud" aria-label={`하트코인 ${balance===null?'불러오는 중':balance.toLocaleString('ko-KR')}`}><span key={active?.id??'rest'} className={active?'coin-pulse':''}><img src={coinIcon} alt=""/><b>{balance===null?'—':display.toLocaleString('ko-KR')}</b></span></span>
  {active&&createPortal(<span key={active.id} className={isLetter?'coin-toast coin-letter-toast':'coin-toast coin-amount-toast'} role="status" style={isLetter&&letterDialog?{position:'absolute',top:8,left:'50%',translate:'-50% 0'}:{position:'fixed',top:target?.top??160,left:Math.min((target?.right??120)+7,window.innerWidth-65)}}>
   {isLetter&&<><img src={coinIcon} alt=""/>{active.kind==='special_letter'?'특별한 편지 획득!':'새 편지 획득!'} </>}+{active.result.delta}
  </span>,document.querySelector('dialog[open]')??document.body)}
 </div>;
}
