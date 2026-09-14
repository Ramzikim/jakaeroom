'use client';
import {useRef,useState,type ReactNode} from 'react';
import {Html} from '@react-three/drei';
import * as T from 'three';
import music from './music-files.json';
export function LpPlaylist({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState('');
 const audio=useRef<HTMLAudioElement>(null),request=useRef(0),panel=useRef<HTMLDivElement>(null);
 async function play(index:number){
  const element=audio.current;if(!element)return;const id=++request.current;
  element.pause();setPlaying(false);setSelected(index);setError('');
  const src=music.tracks[index].url;if(element.getAttribute('src')!==src){element.setAttribute('src',src);element.load();}
  try{await element.play();if(id===request.current)setPlaying(true);}catch{if(id===request.current){setPlaying(false);setError('재생하지 못했어요. 다시 눌러 주세요.');}}
 }
 function toggle(){if(playing){request.current++;audio.current?.pause();setPlaying(false);}else void play(selected);}
 return <group position={[2.15,.855,3.57]}>
  <group onClick={e=>{e.stopPropagation();setOpen(v=>!v);}} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>{children}</group>
  <Html zIndexRange={[40,30]} calculatePosition={(object,camera,size)=>{
   const p=new T.Vector3().setFromMatrixPosition(object.matrixWorld).project(camera),width=panel.current?.offsetWidth||300,height=panel.current?.offsetHeight||480;
   const x=(p.x+1)*size.width/2,y=(1-p.y)*size.height/2;
   return [Math.max(8,Math.min(x+36,size.width-width-8)),Math.max(8,Math.min(y-height*.75,size.height-height-8))];
  }}>
   <audio ref={audio} loop preload="none" onError={()=>{setPlaying(false);setError('음원을 불러오지 못했어요.');}}/>
   <div ref={panel} className="lp-playlist" hidden={!open} role="dialog" aria-label="작애의 플레이리스트" onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
    <header><img src={music.icons.music} alt=""/><div><strong>작애의 플레이리스트</strong><small>듣고 싶은 곡을 골라줘어.</small></div><button aria-label="플레이리스트 닫기" onClick={()=>setOpen(false)}><img src={music.icons.out} alt=""/></button></header>
    <ul>{music.tracks.map((track,i)=>{const active=playing&&i===selected;return <li key={track.url} className={active?'is-playing':''} aria-current={active?'true':undefined}>
     <img src={active?music.icons.play_ing:music.icons.music} alt=""/><span>{track.title}</span>
     {active?<span className="lp-equalizer" role="status" aria-label="재생 중"><i/><i/><i/><i/></span>:<button aria-label={`${track.title} 재생`} onClick={()=>void play(i)}><img src={music.icons.play} alt=""/></button>}
    </li>;})}</ul>
    {error&&<p role="alert">{error}</p>}
    <button className="lp-power" onClick={toggle}>{playing?'음악 끄기':'음악 켜기'}</button>
   </div>
  </Html>
 </group>;
}
