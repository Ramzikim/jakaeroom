'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {authClient} from './auth-client';
import {interpolateDialogue,kstYear,makeProfile,parseProfile,type Profile} from './profile';
const Context=createContext<Profile|null>(null),guestKey='jakae-guest-profile-v1';
export const useJakaeProfile=()=>useContext(Context);
export const useProfileDialogue=()=>{const profile=useContext(Context);return (line:string)=>interpolateDialogue(line,profile);};
function readGuest():Profile|null{try{const stored=JSON.parse(localStorage.getItem(guestKey)||'null');return stored?makeProfile(parseProfile(stored),'guest',stored.createdAt):null;}catch{return null;}}

export function ProfileProvider({children}:{children:React.ReactNode}){
 const [profile,setProfile]=useState<Profile|null>(null),[session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[loaded,setLoaded]=useState(false);
 const [error,setError]=useState(''),[saving,setSaving]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),form=useRef<HTMLFormElement>(null),edit=useRef<HTMLButtonElement>(null);
 const client=authClient();
 useEffect(()=>{
  setProfile(readGuest());
  if(new URLSearchParams(location.search).has('error'))setError('Google 로그인이 완료되지 않았어요. 다시 시도해 주세요.');
  if(!client){setReady(true);return;}
  let active=true;
  client.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setReady(true);if(error)setError('로그인을 다시 시도해 주세요.');}}).catch(()=>{if(active){setReady(true);setError('로그인을 확인하지 못했어요.');}});
  const {data}=client.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setReady(true);}});
  return()=>{active=false;data.subscription.unsubscribe();};
 },[client]);
 useEffect(()=>{
  if(!ready)return;
  const abort=new AbortController();setLoaded(false);setError('');
  async function restore(){
   if(!session){setProfile(readGuest());setLoaded(true);return;}
   setProfile(null);
   try{
    const headers={Authorization:`Bearer ${session.access_token}`};
    let response=await fetch('/api/profile',{headers,signal:abort.signal,cache:'no-store'}),body=await response.json();
    if(!response.ok)throw new Error(body.error);
    const guest=readGuest();
    if(!body.profile&&guest){response=await fetch('/api/profile',{method:'PUT',headers:{...headers,'Content-Type':'application/json','X-Guest-Migration':'1'},body:JSON.stringify(parseProfile(guest)),signal:abort.signal});body=await response.json();if(!response.ok)throw new Error(body.error);}
    if(!abort.signal.aborted){if(body.profile&&guest){try{localStorage.removeItem(guestKey);}catch{}}setProfile(body.profile);setLoaded(true);}
   }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'계정 프로필을 불러오지 못했어요.');}
  }
  void restore();return()=>abort.abort();
 },[ready,session?.access_token]);
 useEffect(()=>{let later=false;try{later=!!sessionStorage.getItem('jakae-profile-later');}catch{}if(loaded&&!profile&&!later)dialog.current?.showModal();},[loaded,profile]);
 function open(){setError('');form.current?.reset();dialog.current?.showModal();}
 function close(){try{sessionStorage.setItem('jakae-profile-later','1');}catch{}dialog.current?.close();}
 async function login(){
  if(!client){setError('Google 로그인은 준비 중이에요. 지금은 게스트로 이름을 저장할 수 있어요.');return;}
  const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/'}});
  if(error)setError('Google 로그인을 시작하지 못했어요. 다시 시도해 주세요.');
 }
 async function logout(){
  const result=await client?.auth.signOut({scope:'local'});
  if(result?.error){setError('로그아웃하지 못했어요. 다시 시도해 주세요.');return;}
  setSession(null);setProfile(readGuest());
 }
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSaving(true);
  const data=new FormData(event.currentTarget);
  try{
   const input=parseProfile({nickname:data.get('nickname'),gender:data.get('gender'),birthYear:Number(data.get('birthYear'))});
   let next:Profile;
   if(session){
    const current=await client!.auth.getSession(),token=current.data.session?.access_token;if(!token)throw new Error('다시 로그인해 주세요.');
    const response=await fetch('/api/profile',{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(input)}),body=await response.json();
    if(!response.ok)throw new Error(body.error);next=body.profile;
   }else{next=makeProfile(input,'guest',profile?.createdAt);localStorage.setItem(guestKey,JSON.stringify(next));}
   setProfile(next);close();
  }catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요. 다시 시도해 주세요.');}finally{setSaving(false);}
 }
 return <Context.Provider value={profile}>{children}<aside className="profile-control" aria-label="내 프로필">
  <button ref={edit} onClick={open}>{profile?`${profile.nickname} · ${profile.vocative}`:'이름 정하기'}</button>
  {session?<button onClick={logout}>로그아웃</button>:<button onClick={login}>로그인하고 저장하기</button>}

  {!dialog.current?.open&&error&&<span className="profile-error" role="alert">{error}</span>}
 </aside>
 <dialog ref={dialog} className="profile-dialog" onCancel={close} onClose={()=>edit.current?.focus()}>
  <form key={profile?.updatedAt||'new'} ref={form} onSubmit={save}>
   <h2>작애가 뭐라고 부를지 정해줘!</h2><p>로그인 없이도 놀 수 있어. 로그인하면 이름을 계정에 저장해!</p>
   <label>이름 / 별명<input name="nickname" autoComplete="nickname" placeholder="작애에게 불리고 싶은 이름을 적어줘" maxLength={20} required defaultValue={profile?.nickname||''}/></label>
   <fieldset><legend>성별 <small>작애가 부를 호칭에만 사용해요.</small></legend><label><input type="radio" name="gender" value="female" required defaultChecked={profile?.gender==='female'}/>여성</label><label><input type="radio" name="gender" value="male" required defaultChecked={profile?.gender==='male'}/>남성</label></fieldset>
   <label>태어난 연도<input name="birthYear" inputMode="numeric" type="number" min={kstYear()-120} max={kstYear()} step={1} required defaultValue={profile?.birthYear??2000}/></label>
   {error&&<p role="alert" className="profile-error">{error}</p>}
   <div className="profile-actions"><button type="button" onClick={close}>나중에 할게</button><button type="submit" disabled={saving}>{saving?'저장 중…':'이렇게 불러줘'}</button></div>
  </form>
 </dialog></Context.Provider>;
}

