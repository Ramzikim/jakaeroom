'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {playSfx} from './sfx';
import './help-modal.css';

export function HelpModal(){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  dialog.current?.showModal();
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=overflow;trigger.current?.focus();};
 },[open]);
 return <><button ref={trigger} className="help-toggle" aria-label="작애의 방 안내 열기" aria-haspopup="dialog" onClick={()=>{playSfx('ui');setOpen(true);}}>?</button>{open&&createPortal(
  <dialog ref={dialog} className="help-modal" aria-labelledby="help-title" onClose={()=>setOpen(false)} onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}>
   <div className="help-heading"><h2 id="help-title">작애의 방 안내</h2><button className="help-close" aria-label="안내 닫기" autoFocus onClick={()=>dialog.current?.close()}>×</button></div>
   <div className="help-content" tabIndex={0} aria-label="안내 내용">
    <section><h3>작애는 누구야?</h3>
     <p>작애는 파란 털과 폭신한 가시를 가진 작은 인형이에요.</p>
     <p>딸기, TV, 게임, 창밖 구경과 쓰담쓰담을 좋아하고,<br/>조금 아방하면서 은근히 외로움을 타요.<br/>한번 친해진 사람은 오래 기억해요.</p>
     <p className="help-disclaimer">※ 소닉의 외형을 가지고 있지만, 실제 소닉의 성격과는 다른<br/>‘소닉 모양 솜인형’ 캐릭터예요.<br/>3차 창작 정도로 편하게 봐주세요!</p>
    </section>
    <section><h3>작애의 방은 어떤 곳이야?</h3>
     <p>작애가 지금 머물고 있는 작은 방이에요.</p>
     <p>작애가 좋아하는 물건도 있지만,<br/>가끔은 누군가 남기고 간 듯한 흔적도 보여요.</p>
     <p>편지를 모으고 방을 둘러보다 보면<br/>이곳의 이야기를 조금씩 알게 될지도 몰라요.</p>
    </section>
    <section><h3>작애랑 어떻게 놀아?</h3>
     <p>방 안의 물건을 직접 누르거나<br/>하단의 ‘작애랑 놀기’ 메뉴를 이용해보세요.</p>
     <p>목욕 · 딸기 · TV · 게임 · 앉기 · 잠자기 · 창문보기</p>
     <p>작애를 쓰다듬거나 여러 가구와 상호작용할 수도 있어요.</p>
     <p>시간대에 따라 작애의 행동과<br/>TV 프로그램도 달라져요.</p>
    </section>
    <section><h3>편지와 사진</h3>
     <p>작애와 시간을 보내면<br/>편지와 사진을 하나씩 발견할 수 있어요.</p>
     <p>편지에는 작애와 이 방의 이야기가,<br/>사진에는 함께 보낸 순간들이 담겨요.</p>
     <p>모은 기록은 도감에서 다시 볼 수 있어요.</p>
    </section>
    <section><h3>하트코인과 선물</h3>
     <p>작애와 놀거나 새로운 편지·사진을 발견하면<br/>하트코인을 얻을 수 있어요.</p>
     <p>모은 하트코인으로 작애에게 선물을 줄 수 있고,<br/>선물은 방 안의 장식장에서 확인할 수 있어요.</p>
    </section>
    <blockquote>천천히 놀다 가아.<br/>작애는 여기 있을게에.</blockquote>
   </div>
  </dialog>,document.body)}</>;
}
