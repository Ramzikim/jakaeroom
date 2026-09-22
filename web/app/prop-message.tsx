'use client';
import {useEffect,useRef,useState} from 'react';
type Message={id:number;text:string};
const listeners=new Set<(message:Message|null)=>void>();
let serial=0,current:Message|null=null;
export function isPropMessageCurrent(id:number){return current?.id===id;}
export function showPropMessage(text:string){const id=++serial;current=text?{id,text}:null;listeners.forEach(fn=>fn(current));return id;}
export function updatePropMessage(id:number,text:string){if(isPropMessageCurrent(id)){current=text?{id,text}:null;listeners.forEach(fn=>fn(current));}}
export function PropMessage(){
 const [message,setMessage]=useState<Message|null>(null),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{listeners.add(setMessage);return()=>{listeners.delete(setMessage);};},[]);
 useEffect(()=>{if(message&&!dialog.current?.open)dialog.current?.showModal();else if(!message)dialog.current?.close();},[message]);
 const close=()=>{if(message)updatePropMessage(message.id,'');};
 return <dialog ref={dialog} className="photo-popup prop-message" data-collection-ui aria-label="작애의 이야기" onCancel={e=>{e.preventDefault();close();}} onClose={()=>{if(!dialog.current?.open)close();}} onClick={e=>{if(e.target===dialog.current)close();}}><p>{message?.text}</p><button className="photo-confirm" onClick={close}>닫기</button></dialog>;
}
