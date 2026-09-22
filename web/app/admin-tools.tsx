'use client';
import {useEffect,useState} from 'react';
import {authClient} from './auth-client';
import {DevResets} from './dev-resets';
import type {Band} from './behavior';
export function useAdminTools(){
 const [state,setState]=useState<{isAdmin:boolean;band:Band|null}>({isAdmin:false,band:null}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let active=true,generation=0;const client=authClient();
  const refresh=async()=>{const version=++generation;try{const session=(await client?.auth.getSession())?.data.session;if(!session){if(active)setState({isAdmin:false,band:null});return;}
   const response=await fetch('/api/admin',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});if(!response.ok)throw Error();const next=await response.json();if(active&&version===generation)setState({isAdmin:next.isAdmin===true,band:next.band??null});
  }catch{if(active&&version===generation)setState({isAdmin:false,band:null});}};
  void refresh();const sub=client?.auth.onAuthStateChange(()=>{setState({isAdmin:false,band:null});setTimeout(()=>void refresh(),0);});
  window.addEventListener('focus',refresh);const timer=setInterval(()=>void refresh(),15000);
  return()=>{active=false;sub?.data.subscription.unsubscribe();window.removeEventListener('focus',refresh);clearInterval(timer);};
 },[]);
 async function changeBand(band:Band|null){
  if(busy)return;setBusy(true);setError('');
  try{const session=(await authClient()?.auth.getSession())?.data.session;if(!session)throw Error();
   const response=await fetch('/api/admin',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({band})});if(!response.ok)throw Error();
   setState(await response.json());
  }catch{setError('시간대 변경에 실패했어요.');}finally{setBusy(false);}
 }
 return {...state,busy,error,changeBand};
}
export function AdminPanel({admin}:{admin:ReturnType<typeof useAdminTools>}){
 if(!admin.isAdmin)return null;
 return <details className="admin-tools" data-collection-ui><summary>관리자 테스트</summary><p>현재 계정에만 적용 · 보상·사진·편지·구매 판정 포함</p>
 <div className="admin-bands">{([[null,'KST 자동'],['dawn','새벽'],['day','낮'],['afternoon','오후'],['night','밤']] as const).map(([band,label])=><button key={label} disabled={admin.busy} aria-pressed={admin.band===band} onClick={()=>void admin.changeBand(band)}>{label}</button>)}</div>
 {admin.band&&<p role="status">테스트 시간대 적용 중 · 실제 날짜와 경과 시간은 유지됩니다.</p>}
 <DevResets authorized/>{admin.error&&<p role="alert">{admin.error}</p>}</details>;
}
