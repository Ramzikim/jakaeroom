'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {setSfxEnabled,unlockSfx,playSfx} from './sfx';
import {getLpOwnsMusic,subscribeMusicSource} from './music-source';
import {MusicIcon} from './music-icon';
import type {Band} from './behavior';
export function Bgm({phase}:{phase:Band}){
 const [enabled,setEnabled]=useState(false),[failed,setFailed]=useState(false);
 const lpOwned=useSyncExternalStore(subscribeMusicSource,getLpOwnsMusic,()=>false);
 const audio=useRef<HTMLAudioElement>(null),request=useRef(0);
 async function play(){
  if(getLpOwnsMusic())return;
  const id=++request.current;
  try{await audio.current!.play();if(id===request.current){setFailed(false);setEnabled(true);}}
  catch{if(id===request.current){setFailed(true);setEnabled(false);}}
 }

 function toggle(){if(getLpOwnsMusic())return;if(enabled){request.current++;audio.current?.pause();setEnabled(false);}else void play();}
 useEffect(()=>subscribeMusicSource(()=>{request.current++;audio.current?.pause();}),[]);
 useEffect(()=>{
  request.current++;audio.current!.load();if(enabled&&!getLpOwnsMusic())void play();
  return()=>{request.current++;audio.current?.pause();};
 },[phase]);
 return <><audio ref={audio} data-music-source="bgm" src={`/bgm/${phase}.mp3`} loop preload="none" onError={()=>{setFailed(true);setEnabled(false);}}/><button className="help-toggle music-toggle" disabled={lpOwned} aria-label={enabled&&!lpOwned?'배경음악 끄기':'배경음악 켜기'} aria-pressed={enabled&&!lpOwned} onClick={toggle} title={lpOwned?'음악은 LP 플레이어에서 조절해 주세요':failed?'다시 눌러 음악을 켜 주세요':undefined}><MusicIcon name={enabled&&!lpOwned?'speaker':'muted'}/></button></>;
}

function SfxToggle(){
 const [enabled,setEnabled]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{try{const on=localStorage.getItem('jakae-sfx-enabled')==='true';setEnabled(on);setSfxEnabled(on);}catch{}return()=>setSfxEnabled(false);},[]);
 async function toggle(){
  const next=!enabled;if(next&&!await unlockSfx()){setFailed(true);return;}
  setFailed(false);setEnabled(next);setSfxEnabled(next);try{localStorage.setItem('jakae-sfx-enabled',String(next));}catch{}
  if(next)playSfx('pop');
 }
 return <button className="bgm-toggle sfx-toggle" aria-label={enabled?'효과음 끄기':'효과음 켜기'} aria-pressed={enabled} onClick={toggle} title={failed?'소리를 켜지 못했어요. 다시 눌러 주세요.':'BGM과 별도로 조절합니다'}>효과음 {enabled?'ON':'OFF'}</button>;
}
