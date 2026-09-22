'use client';
import {useEffect,useRef,useState} from 'react';
const listeners=new Set<(message:string)=>void>();
export function showPropMessage(message:string){listeners.forEach(fn=>fn(message));}
export function PropMessage(){
 const [message,setMessage]=useState(''),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{listeners.add(setMessage);return()=>{listeners.delete(setMessage);};},[]);
 useEffect(()=>{if(message&&!dialog.current?.open)dialog.current?.showModal();},[message]);
 return <dialog ref={dialog} className="photo-popup prop-message" data-collection-ui aria-label="작애의 이야기" onClose={()=>setMessage('')} onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><p>{message}</p><button className="photo-confirm" onClick={()=>dialog.current?.close()}>닫기</button></dialog>;
}
