'use client';
import {useEffect,useRef,useState} from 'react';
import type {Action} from './behavior';

const items:readonly {label:string;action:Action}[]=[
 {label:'창문보기',action:'window'},{label:'앉아있기',action:'cushion'},
 {label:'목욕하기',action:'bath'},{label:'딸기먹기',action:'berry'},
 {label:'게임하기',action:'game'},{label:'TV보기',action:'tv'},
 {label:'쿨쿨자기',action:'bed'},
];
export function PlayMenu({disabled,onAction}:{disabled:boolean;onAction:(action:Action)=>void}){
 const [open,setOpen]=useState(false),root=useRef<HTMLSpanElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <span ref={root} className="play-menu-anchor">
  <button ref={trigger} aria-label="작애랑 놀기" aria-expanded={open} aria-controls="play-submenu" onClick={()=>setOpen(v=>!v)}><img src="/btn_03.png?v=menu-v2" alt=""/></button>
  {open&&<div id="play-submenu" className="play-submenu" role="group" aria-label="작애랑 놀기 메뉴" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
   {items.map((item,i)=>{const number=String(i+1).padStart(2,'0');return <button key={item.action} aria-label={item.label} disabled={disabled} onClick={()=>{setOpen(false);onAction(item.action);trigger.current?.focus();}}>
    <picture><source media="(max-width:600px)" srcSet={`/subbtn_MO_${number}.png`}/><img src={`/subbtn_${number}.png`} alt=""/></picture>
   </button>;})}
  </div>}
 </span>;
}
