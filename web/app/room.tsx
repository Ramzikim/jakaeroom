'use client';
import {Component, Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Html, OrbitControls, SoftShadows, useGLTF} from '@react-three/drei';
import * as T from 'three';
import type {OrbitControls as OrbitControlsType} from 'three-stdlib';
import {kstDate,readCounts,type Action,type LetterCounts} from './behavior';
import {useProfileDialogue} from './profile-ui';
import {selectLetter} from './letters';
import {Bgm} from './bgm';
import {AccentLamps} from './accent-lamps';
import {WindowSky} from './window-sky';
import {SpriteResident} from './sprite-resident';
import {anchors, atmospheres, idleLines, kst, letters, route, type Mood, type Point} from './life';


type Command={action:Action,id:number};
const pick=<T,>(items:T[])=>items[Math.floor(Math.random()*items.length)];
const names:Record<Mood,string>={idle:'느긋하게 쉬는 중',walk:'방 안을 산책하는 중',pet:'쓰담쓰담 받는 중',berry:'딸기가 제일 좋아!',rest:'이불 속으로 쏙',sleep:'새근새근 꿈꾸는 중',wake:'기지개 켜는 중',sit:'편하게 앉아 쉬는 중',bath:'보송보송 목욕하는 중'};

class SceneError extends Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="loading"><p>방을 불러오지 못했어요.</p><button onClick={()=>location.reload()}>다시 열기</button></div>:this.props.children;}
}
function Loading(){return <Html center><div className="load-card"><span>✿</span><p>작애가 방을 치우고 있어요..</p><progress/></div></Html>;}

function Environment({phase,onBath,disabled}:{phase:keyof typeof atmospheres,onBath:()=>void,disabled:boolean}){
 const {scene}=useGLTF('/models/room-web.glb');
 const room=useMemo(()=>{const clone=scene.clone(true);clone.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});return clone;},[scene]);
 const a=atmospheres[phase];
 return <group>
  <primitive object={room}/>
  {!disabled&&<mesh position={[-3.5,.7,2.8]} onClick={e=>{e.stopPropagation();onBath();}} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}><boxGeometry args={[1.65,.1,1.9]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
  <WindowSky phase={phase}/>
  <AccentLamps power={a.lamp}/>
  <pointLight position={[-1.48,1.22,-3.47]} color="#ffc487" intensity={a.lamp} distance={4} decay={2}/>
  <pointLight position={[2.28,1.45,-3.48]} color="#ffe0b1" intensity={a.lamp*.8} distance={4}/>
 </group>;
}

function Camera({zoomEvent}:{zoomEvent:{id:number,direction:number}}){
 const controls=useRef<OrbitControlsType>(null),{camera,size}=useThree(),last=useRef(0);
 useEffect(()=>{const c=camera as T.OrthographicCamera;c.position.set(12,13,16);c.zoom=Math.min(size.width/12.8,size.height/10.4);c.updateProjectionMatrix();controls.current?.target.set(0,.75,0);controls.current?.update();},[camera,size.width,size.height]);
 useFrame(()=>{const c=camera as T.OrthographicCamera,base=Math.min(size.width/12.8,size.height/10.4);if(last.current!==zoomEvent.id){last.current=zoomEvent.id;c.zoom=T.MathUtils.clamp(c.zoom*(zoomEvent.direction>0?1.3:1/1.3),base*.85,base*3.3);c.updateProjectionMatrix();}if(controls.current){controls.current.minZoom=base*.85;controls.current.maxZoom=base*3.3;}});
 return <OrbitControls ref={controls} target={[0,.75,0]} enablePan={false} enableRotate={false} enableDamping zoomSpeed={.6}/>;
}

export default function Room(){
 const [now,setNow]=useState(kst()),[override,setOverride]=useState<keyof typeof atmospheres|null>(null),[command,setCommand]=useState<Command|null>(null),[mood,setMood]=useState<Mood>('idle'),[ready,setReady]=useState(false),[zoomEvent,setZoomEvent]=useState({id:0,direction:0}),[letter,setLetter]=useState(letters[0]);
 const dialogue=useProfileDialogue();
 const dialog=useRef<HTMLDialogElement>(null),letterButton=useRef<HTMLButtonElement>(null),positionRef=useRef(new T.Vector3(1.65,.7,-.55));
 const phase=override||now.period,a=atmospheres[phase];
 const [counts,setCounts]=useState<LetterCounts>(()=>readCounts(null));
 const countRef=useRef(counts);
 const busy=['pet','berry','bath','rest','sleep'].includes(mood);
 const limited=counts.date===kstDate()&&counts[now.period]>=2;
 const storeCounts=(next:LetterCounts)=>{countRef.current=next;setCounts(next);try{localStorage.setItem('jakae-letter-counts',JSON.stringify(next));}catch{}};
 useEffect(()=>{try{const next=readCounts(localStorage.getItem('jakae-letter-counts'));countRef.current=next;setCounts(next);}catch{}},[]);
 useEffect(()=>{if(countRef.current.date!==kstDate())storeCounts(readCounts(null));},[now]);
 useEffect(()=>{const timer=setInterval(()=>setNow(kst()),15000);return()=>clearInterval(timer);},[]);
 const act=(action:Action)=>setCommand({action,id:Date.now()+Math.random()});
 const openLetter=()=>{
  if(dialog.current?.open)return false;
  const date=kstDate(),band=kst().period;let current=readCounts(JSON.stringify(countRef.current),date);
  try{current=readCounts(localStorage.getItem('jakae-letter-counts'),date);}catch{}
  if(current[band]>=2){storeCounts(current);return false;}
  storeCounts({...current,[band]:current[band]+1});setLetter(previous=>selectLetter(band,previous.id));dialog.current?.showModal();return true;
 };
 // Feature-detected agent access uses the same visible controls and local data.
 useEffect(()=>{
  const doc=document as Document & {modelContext?:{registerTool:(tool:unknown,options:unknown)=>void}};
  if(!doc.modelContext?.registerTool||!ready)return;const abort=new AbortController();
  try{doc.modelContext.registerTool({name:'play_with_jakae',description:'Pet or wake Jakae, sleep, eat a strawberry, or receive a limited letter.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['pet','bed','berry','letter']}},required:['action'],additionalProperties:false},execute:(input:unknown)=>{const value=input as {action?:string};if(!value||!['pet','bed','berry','letter'].includes(value.action||''))throw new Error('Invalid action');if(value.action==='letter')return {accepted:openLetter()};act(value.action as Action);return {accepted:true};}}, {signal:abort.signal});}catch{/* Optional browser API. */}
  return()=>abort.abort();
 },[ready]);
 return <main style={{'--sky':a.bg} as React.CSSProperties}>
  <header><div className="wordmark"><h1 className="image-title"><img src="/title.png" alt="작애의 방 · JAKAE’S ROOM" width="2078" height="757"/></h1></div><div className="clock"><span className="live-dot"/>{a.name}<time>{String(now.hour).padStart(2,'0')}:{String(now.minute).padStart(2,'0')} <small>KST</small></time></div></header>
  <section className="stage" aria-label="작애가 살고 있는 3D 방">
   <SceneError><Canvas orthographic shadows dpr={[1,1.5]} camera={{position:[12,13,16],zoom:60,near:.1,far:80}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;}}>
    <SoftShadows size={18} samples={12} focus={.4}/>
    <ambientLight intensity={a.ambient} color={a.fill}/><hemisphereLight args={[a.fill,'#aa8269',a.hemi]}/>
    <directionalLight castShadow position={[-3,9,5]} intensity={a.key} color={a.sun} shadow-mapSize={[2048,2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-.0004} shadow-normalBias={.025}/>
    <Suspense fallback={<Loading/>}><Environment phase={phase} onBath={()=>act('bath')} disabled={busy}/><SpriteResident command={command} onMood={setMood} onReady={()=>setReady(true)} onPet={()=>act('pet')} positionRef={positionRef} phase={phase}/></Suspense>
    <Camera zoomEvent={zoomEvent}/>
   </Canvas></SceneError>
   <div className="view-controls image-controls"><button aria-label="축소" onClick={()=>setZoomEvent(v=>({id:v.id+1,direction:-1}))}><img src="/btn_05.png?v=f9c7efecdd" alt=""/></button><button aria-label="확대" onClick={()=>setZoomEvent(v=>({id:v.id+1,direction:1}))}><img src="/btn_06.png" alt=""/></button><Bgm phase={phase}/></div>
   <div className="status" role="status"><span className="live-dot"/>{ready?names[mood]:'작애가 방을 치우고 있어요..'}</div>
  </section>
  <footer><nav className="dock image-dock" aria-label="작애와 놀기">
   <button aria-label="쓰담쓰담" disabled={!ready||(busy&&mood!=='sleep')} onClick={()=>act('pet')}><img src="/btn_01.png" alt=""/></button>
   <button aria-label="딸기 주기" disabled={!ready||busy} onClick={()=>act('berry')}><img src="/btn_02.png" alt=""/></button>
   <button aria-label="침대로 가기" disabled={!ready||busy} onClick={()=>act('bed')}><img src="/btn_03.png" alt=""/></button>
   <button aria-label="작애의 편지 받기" ref={letterButton} disabled={limited} title={limited?'이번 시간대 편지 2개를 모두 받았어요.':undefined} onClick={openLetter}><img src="/btn_04.png" alt=""/></button>
  </nav><div className="action-extras">{limited&&<span role="status">이번 시간대 편지 2개를 모두 받았어요.</span>}{process.env.NODE_ENV==='development'&&<button onClick={()=>storeCounts(readCounts(null))}>편지 리셋</button>}</div>{process.env.NODE_ENV==='development'&&<div className="lighting-test" aria-label="라이팅 테스트"><span>라이팅 테스트</span><button aria-pressed={!override} onClick={()=>setOverride(null)}>KST 자동</button>{Object.entries(atmospheres).map(([key,value])=><button key={key} aria-pressed={override===key} onClick={()=>setOverride(key as keyof typeof atmospheres)}>{value.name}</button>)}</div>}</footer>
  <dialog ref={dialog} className="letter" onClose={()=>letterButton.current?.focus()} onClick={e=>{if(e.target===dialog.current)dialog.current?.close();}}><button className="close" aria-label="편지 닫기" onClick={()=>dialog.current?.close()}>×</button><span className="letter-stamp">🍓</span><p className="eyebrow">A LITTLE LETTER FOR YOU</p><h2>{letter.title}</h2><p className="letter-body">{dialogue(letter.body)}</p><p className="signature">네 친구, 작애가 ♡</p><button className="letter-done" onClick={()=>dialog.current?.close()}>마음에 담아 둘게</button></dialog>
 </main>;
}




