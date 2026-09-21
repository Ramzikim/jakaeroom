'use client';
import {setRoomCursor} from './room-cursor';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Html} from '@react-three/drei';
function DomPortal({children}:{children:ReactNode}){return createPortal(children,document.body);}

import music from './music-files.json';
import {nextTrack,type PlayMode} from './playback-mode';
export function LpPlaylist({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState('');
 const [mode,setMode]=useState<PlayMode>('single');
 const audio=useRef<HTMLAudioElement>(null),request=useRef(0),panel=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState<{x:number,y:number}|null>(null);
 const drag=useRef<{id:number,x:number,y:number}|null>(null);
 useEffect(()=>{if(open&&panel.current){const {offsetWidth:width,offsetHeight:height}=panel.current;setPosition(p=>p?{x:Math.max(8,Math.min(p.x,window.innerWidth-width-8)),y:Math.max(8,Math.min(p.y,window.innerHeight-height-8))}:p);}},[open]);
 function move(x:number,y:number){const width=panel.current?.offsetWidth||300,height=panel.current?.offsetHeight||480;setPosition({x:Math.max(8,Math.min(x,window.innerWidth-width-8)),y:Math.max(8,Math.min(y,window.innerHeight-height-8))});}
 useEffect(()=>{const resize=()=>setPosition(p=>p?{x:Math.max(8,Math.min(p.x,window.innerWidth-(panel.current?.offsetWidth||300)-8)),y:Math.max(8,Math.min(p.y,window.innerHeight-(panel.current?.offsetHeight||480)-8))}:p);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]); async function play(index:number){
  const element=audio.current;if(!element)return;const id=++request.current;
  element.pause();setPlaying(false);setSelected(index);setError('');
  const src=music.tracks[index].url;if(element.getAttribute('src')!==src){element.setAttribute('src',src);element.load();}
  try{await element.play();if(id===request.current)setPlaying(true);}catch{if(id===request.current){setPlaying(false);setError('재생하지 못했어요. 다시 눌러 주세요.');}}
 }
 function stop(){request.current++;audio.current?.pause();setPlaying(false);}
 function chooseMode(value:PlayMode){setMode(value);if(!playing)void play(selected);}
 return <group position={[2.15,.855,3.57]}>
  <group onClick={e=>{e.stopPropagation();if(!position)move(e.nativeEvent.clientX+24,e.nativeEvent.clientY-300);setOpen(v=>!v);}} onPointerOver={e=>{e.stopPropagation();setRoomCursor('click');}} onPointerOut={()=>{setRoomCursor('normal');}}>{children}</group>
  {position&&<Html><DomPortal>   <audio ref={audio} preload="none" onEnded={()=>{if(!playing)return;if(audio.current)audio.current.currentTime=0;void play(nextTrack(mode,selected,music.tracks.length));}} onError={()=>{setPlaying(false);setError('음원을 불러오지 못했어요.');}}/>
   <div ref={panel} className="lp-playlist lp-floating" style={{left:position.x,top:position.y}} hidden={!open} role="dialog" aria-label="작애의 플레이리스트" onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
    <header title="드래그해서 이동" onPointerDown={e=>{if(e.button!==0||(e.target as HTMLElement).closest('button'))return;e.preventDefault();drag.current={id:e.pointerId,x:e.clientX-position.x,y:e.clientY-position.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current?.id===e.pointerId)move(e.clientX-drag.current.x,e.clientY-drag.current.y);}} onPointerUp={e=>{if(drag.current?.id===e.pointerId){drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);}}} onPointerCancel={()=>{drag.current=null;}}><img src={music.icons.music} alt=""/><div><strong>작애의 플레이리스트</strong><small>듣고 싶은 곡을 골라줘어.</small></div><button aria-label="플레이리스트 닫기" onClick={()=>setOpen(false)}><img src={music.icons.out} alt=""/></button></header>
    <ul>{music.tracks.map((track,i)=>{const active=playing&&i===selected;const toggle=()=>{if(active)stop();else{setMode('single');void play(i);}};return <li key={track.url} className={active?'is-playing':''} aria-current={active?'true':undefined} role="button" tabIndex={0} aria-label={`${track.title} ${active?'일시정지':'재생'}`} aria-pressed={active} onClick={toggle} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}}}>
     <img src={active?music.icons.play_ing:music.icons.music} alt=""/><span>{track.title}</span>
     {active?<span className="lp-equalizer" role="status" aria-label="재생 중"><i/><i/><i/><i/></span>:<img className="lp-row-play" src={music.icons.play} alt=""/>}
    </li>;})}</ul>
    {error&&<p role="alert">{error}</p>}
    <div className="lp-controls">
     <button aria-pressed={mode==='all'} onClick={()=>chooseMode('all')}>전체재생</button>
     <button aria-pressed={mode==='shuffle'} onClick={()=>chooseMode('shuffle')}>랜덤재생</button>
     <button className="lp-stop" onClick={stop}>음악 끄기</button>
    </div>
   </div>
  </DomPortal></Html>}
 </group>;
}
