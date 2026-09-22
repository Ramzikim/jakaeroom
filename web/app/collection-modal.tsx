'use client';
import {useEffect,useRef,useState} from 'react';
import {authClient} from './auth-client';
import {subscribeCoins} from './coin-events';
import {collectionLetters,lockedLetterAsset,storyLetterCount} from './collection-letters';
import {playSfx} from './sfx';
import {useJakaeProfile} from './profile-ui';
import {PHOTO_REGISTRY,standardPhotoCount,visiblePhotos,type Photo} from '../lib/photos';
import {PhotoCard,PhotoPopup} from './photo-popup';
import {subscribePhotos,finishHugPhoto} from './photo-events';
import './collection.css';

export function CollectionModal({open,onClose,onRead}:{open:boolean;onClose:()=>void;onRead:(id:string)=>Promise<boolean>}){
 const dialog=useRef<HTMLDialogElement>(null),[collected,setCollected]=useState<string[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[reading,setReading]=useState(false);
 const profile=useJakaeProfile(),[tab,setTab]=useState<'letter'|'photo'>('letter'),[photos,setPhotos]=useState<string[]>([]);
 const [discoveries,setDiscoveries]=useState<{photo:Photo;userId:string}[]>([]),[reread,setReread]=useState<Photo|null>(null);
 const photoUser=useRef<string|null>(null),pendingHug=useRef(false);
 const visible=visiblePhotos(photos,!!profile&&profile.relationshipTier!=='normal');
 useEffect(()=>subscribePhotos(event=>{const photo=PHOTO_REGISTRY.find(p=>p.id===event.photoId);if(photo)setDiscoveries(q=>[...q,{photo,userId:event.userId}]);}),[]);
 useEffect(()=>{const auth=authClient()?.auth.onAuthStateChange((_event,session)=>{const id=session?.user.id??null;if(photoUser.current!==id){photoUser.current=id;pendingHug.current=false;setDiscoveries([]);setReread(null);setPhotos([]);}});return()=>auth?.data.subscription.unsubscribe();},[]);
 const closePhoto=()=>{if(reread){setReread(null);return;}const next=discoveries[0];setDiscoveries(q=>q.slice(1));if(next?.photo.category==='hug')pendingHug.current=true;if(discoveries.length===1&&pendingHug.current){pendingHug.current=false;finishHugPhoto();}};
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open)dialog.current?.close();},[open]);
 useEffect(()=>{
  if(!open)return;let active=true,revision=0,userId:string|null=null;
  const client=authClient();
  const load=async()=>{
   const version=++revision;setCollected([]);setPhotos([]);setLoading(true);setError('');
   try{
    const session=(await client?.auth.getSession())?.data.session;userId=session?.user.id??null;
    let ids:string[],photoIds:string[]=[];
    if(session){const result=await client!.from('user_progression').select('collected_letter_ids,collected_photo_ids').eq('user_id',session.user.id).maybeSingle();if(result.error)throw result.error;ids=result.data?.collected_letter_ids??[];photoIds=result.data?.collected_photo_ids??[];}
    else{const saved=JSON.parse(localStorage.getItem('jakae-guest-letters')||'null');ids=Array.isArray(saved?.collected)?saved.collected:[];}
    if(active&&version===revision){setCollected(ids);setPhotos(photoIds);}
   }catch{if(active&&version===revision)setError('편지를 불러오지 못했어요. 다시 열어 주세요.');}
   finally{if(active&&version===revision)setLoading(false);}
  };
  void load();
  const auth=client?.auth.onAuthStateChange(()=>{setTimeout(()=>{if(active)void load();},0);});
  const unsubscribe=subscribeCoins(event=>{if(active&&event.userId===userId){revision++;setCollected(event.result.progression.collected_letter_ids);setPhotos(event.result.progression.collected_photo_ids);setLoading(false);setError('');}});
  return()=>{active=false;auth?.data.subscription.unsubscribe();unsubscribe();};
 },[open]);
 const read=async(id:string)=>{if(reading||!collected.includes(id))return;setReading(true);try{if(!await onRead(id))setError('편지를 열지 못했어요. 다시 시도해 주세요.');}finally{setReading(false);}};
 return <><dialog ref={dialog} className="collection-modal" data-collection-ui aria-labelledby="collection-title" onClose={onClose} onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}>
  <div className="collection-top">
   <img className="collection-title-art" src="/library/library_popup_titleimg.png" alt=""/>
   <div><h2 id="collection-title">작애의 도감</h2><p>차곡차곡 모은 작애의 이야기</p></div>
   <button className="collection-close" aria-label="도감 닫기" onClick={()=>{playSfx('ui');dialog.current?.close();}}>×</button>
  </div>
  <div className="collection-tabs" role="tablist" aria-label="도감 종류"><button id="letter-tab" role="tab" aria-selected={tab==='letter'} aria-controls="letter-collection" onClick={()=>setTab('letter')}>편지</button><button id="photo-tab" role="tab" aria-selected={tab==='photo'} aria-controls="letter-collection" onClick={()=>setTab('photo')}>사진</button><span className="collection-progress">{loading?'—':tab==='letter'?storyLetterCount(collected):standardPhotoCount(photos)} / {tab==='letter'?32:38}</span></div>
  <div id="letter-collection" className="collection-content" role="tabpanel" aria-labelledby={tab==='letter'?'letter-tab':'photo-tab'} aria-busy={loading}>
   {loading&&<p role="status">편지를 불러오고 있어요…</p>}{error&&<p role="alert">{error}</p>}
   {tab==='letter'?<div className="collection-grid">{collectionLetters.map(({letter,number,asset})=>{const unlocked=!loading&&collected.includes(letter.id);return <button key={letter.id} className="collection-slot" disabled={!unlocked||reading} aria-label={`${String(number).padStart(2,'0')} ${unlocked?letter.title:'잠김'}`} onClick={()=>void read(letter.id)}><img src={unlocked?asset:lockedLetterAsset} alt="" draggable={false}/><span className="collection-number">{String(number).padStart(2,'0')}</span>{unlocked&&<span className="collection-letter-title">{letter.title}</span>}</button>;})}</div>:<div className="collection-grid photo-grid">{visible.map((photo,index)=>{const owned=!loading&&photos.includes(photo.id);return <button className="photo-slot" key={photo.id} disabled={!owned} aria-label={`사진 ${index+1}${owned?'':' 잠김'}`} onClick={()=>setReread(photo)}><PhotoCard photo={owned?photo:undefined}/><span className="collection-number">{String(index+1).padStart(2,'0')}</span></button>;})}</div>}
  </div>
 <button className="photo-confirm" onClick={()=>dialog.current?.close()}>닫기</button></dialog><PhotoPopup photo={reread??discoveries[0]?.photo??null} discovery={!reread} onClose={closePhoto}/></>;
}
