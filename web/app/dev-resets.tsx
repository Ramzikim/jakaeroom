'use client';
import {useState} from 'react';
import {authClient} from './auth-client';
import {queueCoinOperation} from './coin-events';
export function DevResets({authorized=false}:{authorized?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function reset(scope:'letters'|'collection'|'coins'){
  if(busy||!confirm('현재 계정의 선택한 진행상황을 초기화할까요? 되돌릴 수 없어요.'))return;
  setBusy(true);setError('');
  await queueCoinOperation(async()=>{
   try{
    const session=(await authClient()?.auth.getSession())?.data.session;
    if(session){const response=await fetch('/api/progression/dev-reset',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({scope})});if(!response.ok)throw Error();}
    if(scope!=='coins'){localStorage.removeItem('jakae-guest-letters');localStorage.removeItem('jakae-letter-counts');}
    location.reload();
   }catch{setError('초기화 실패. 다시 시도해 주세요.');setBusy(false);}
  });
 }
 if(!authorized)return null;
 return <span data-collection-ui>{([['letters','편지 리셋'],['collection','도감 리셋'],['coins','코인 리셋']] as const).map(([scope,label])=><button key={scope} disabled={busy} onClick={()=>void reset(scope)}>{label}</button>)}{error&&<span role="alert">{error}</span>}</span>;
}
