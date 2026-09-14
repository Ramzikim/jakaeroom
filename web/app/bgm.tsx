'use client';
import {useEffect,useRef,useState} from 'react';
import {setSfxEnabled,unlockSfx} from './sfx';
import type {Band} from './behavior';
export function Bgm({phase}:{phase:Band}){
 const [enabled,setEnabled]=useState(false),[failed,setFailed]=useState(false);
 const audio=useRef<HTMLAudioElement>(null),request=useRef(0);
 async function play(){
  const id=++request.current;
  try{await audio.current!.play();if(id===request.current){setFailed(false);setEnabled(true);}}
  catch{if(id===request.current){setFailed(true);setEnabled(false);}}
 }
 useEffect(()=>{setSfxEnabled(enabled);return()=>setSfxEnabled(false);},[enabled]);
 function toggle(){unlockSfx();if(enabled){request.current++;audio.current?.pause();setEnabled(false);}else void play();}
 useEffect(()=>{
  request.current++;audio.current!.load();if(enabled)void play();
  return()=>{request.current++;audio.current?.pause();};
 },[phase]);
 return <><audio ref={audio} src={`/bgm/${phase}.mp3`} loop preload="none" onError={()=>{setFailed(true);setEnabled(false);}}/><button className="bgm-toggle" aria-label={enabled?'BGM 끄기':'BGM 켜기'} aria-pressed={enabled} onClick={toggle} title={failed?'다시 눌러 음악을 켜 주세요':`${phase} BGM`}><span aria-hidden="true">{enabled?'♫':'♪'}</span> BGM {enabled?'ON':'OFF'}</button></>;
}

