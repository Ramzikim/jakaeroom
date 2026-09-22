'use client';
import {useEffect,useRef} from 'react';
import {useTexture} from '@react-three/drei';
import * as T from 'three';
import {setRoomCursor} from './room-cursor';
import {playSfx} from './sfx';
import './artwork.css';

export const DRAWINGS=[
 {description:'밝은 낮과 딸기를 사랑하는 작애의 그림',width:636,height:850,x:-2.88,y:2.63,scale:1},
 {description:'놀러 온 친구가 작애 옆에서 쿨쿨 자고 갔으면 좋겠다는 소망이 담긴 그림',width:860,height:860,x:-2.20,y:2.67,scale:.98},
 {description:'별빛 무드등이 갖고 싶어 그려 본 그림',width:640,height:854,x:-2.83,y:2.02,scale:1.02},
 {description:'딸기 케이크를 와앙 먹고싶어서 그려 본 그림',width:856,height:854,x:-2.19,y:2.05,scale:1},
 {description:'작애의 방까지 오는 길을 표현한 그림',width:1142,height:855,x:-2.85,y:1.43,scale:1.03},
 {description:'미미와 싱파랑 소풍가고 싶어서 그린 그림',width:957,height:850,x:-2.20,y:1.43,scale:.99},
] as const;
export const drawingPath=(index:number,thumb=false)=>`/artwork/drawing-${index+1}${thumb?'-thumb':''}.webp`;

export function ArtworkFrames({onOpen}:{onOpen:(index:number)=>void}){
 const textures=useTexture(DRAWINGS.map((_,i)=>drawingPath(i,true)));
 useEffect(()=>{DRAWINGS.forEach((_,i)=>{const image=new Image();image.src=drawingPath(i);void image.decode().catch(()=>{});});},[]);
 return <group name="JakaeDrawingGallery">{DRAWINGS.map((drawing,i)=>{
  // The old strawberry frame's long side was 0.48; preserve that visual size ±5%.
  const long=.48*drawing.scale,ratio=drawing.width/drawing.height;
  const width=long*Math.min(ratio,1),height=long/Math.max(ratio,1),rim=.016;
  textures[i].colorSpace=T.SRGBColorSpace;
  return <group key={i} name={`DrawingFrame${i+1}`} position={[drawing.x,drawing.y,-3.88]}
   onClick={e=>{e.stopPropagation();if(e.button===0&&!document.querySelector('dialog[open]')){playSfx('ui');setRoomCursor('normal');onOpen(i);}}}
   onPointerOver={e=>{e.stopPropagation();setRoomCursor('click');}} onPointerOut={()=>setRoomCursor('normal')}>
   <mesh castShadow receiveShadow><boxGeometry args={[width,height,.045]}/><meshStandardMaterial color="#c9a77b" roughness={.85}/></mesh>
   <mesh position={[0,0,.024]}><planeGeometry args={[width-rim*2,height-rim*2]}/><meshStandardMaterial color="#fff1d9" roughness={1}/></mesh>
   <mesh position={[0,0,.025]}><planeGeometry args={[(width-rim*2)*.96,(width-rim*2)*.96/ratio]}/><meshStandardMaterial map={textures[i]} roughness={1}/></mesh>
  </group>;
 })}</group>;
}

export function ArtworkPopup({index,onClose}:{index:number|null;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(index!==null&&!dialog.current?.open){previousFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}else if(index===null)dialog.current?.close();},[index]);
 const drawing=index===null?null:DRAWINGS[index];
 return <dialog ref={dialog} className="artwork-popup" data-collection-ui aria-label="작애의 그림" onClose={()=>{onClose();previousFocus.current?.focus();}} onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}>
  <button className="collection-close" aria-label="그림 닫기" onClick={()=>dialog.current?.close()}>×</button>
  {drawing&&index!==null&&<><img className="artwork-large" src={drawingPath(index)} alt={drawing.description}/><p>{drawing.description}</p></>}
  <button className="photo-confirm" onClick={()=>dialog.current?.close()}>닫기</button>
 </dialog>;
}
