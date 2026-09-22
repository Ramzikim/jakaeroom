'use client';
import {useEffect,useRef} from 'react';
import type {Photo} from '../lib/photos';
export function PhotoCard({photo}:{photo?:Photo}){
 return <span className="photo-polaroid"><span className="photo-image">{photo?<img src={photo.assetPath} alt={photo.title??'작애의 사진'} draggable={false}/>:<span className="photo-lock" aria-label="잠긴 사진">🔒</span>}</span><span className="photo-caption">{photo?.title??' '}</span></span>;
}
export function PhotoPopup({photo,discovery,onClose}:{photo:Photo|null;discovery:boolean;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(photo&&!dialog.current?.open)dialog.current?.showModal();else if(!photo)dialog.current?.close();},[photo,onClose]);
 return <dialog ref={dialog} className="photo-popup" data-collection-ui aria-label={discovery?'새 사진을 발견했어!':'사진 보기'} onClose={onClose} onClick={e=>{if(e.target===dialog.current)dialog.current?.close();}}><button className="collection-close" aria-label="사진 닫기" onClick={()=>dialog.current?.close()}>×</button>{discovery&&<h2>새 사진을 발견했어!</h2>}{photo&&<PhotoCard photo={photo}/>}<button className="photo-confirm" onClick={()=>dialog.current?.close()}>닫기</button></dialog>;
}
