'use client';
import {useMemo,useRef,useState,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html,useTexture} from '@react-three/drei';
import * as T from 'three';
import {useGifts,GiftPrice} from './gift-ui';
import {getGiftById} from '../lib/gifts';
import {kst} from './life';
import {TV_CHAR_SECONDS,type Life} from './behavior';

export function MediaDisplay({life,bubble,character,carrier}:{life:RefObject<Life>,bubble:RefObject<HTMLDivElement|null>,character:RefObject<T.Sprite|null>,carrier:RefObject<T.Group|null>}){
 const gifts=useGifts(),[shoppingId,setShoppingId]=useState<string|null>(null);
 const shopping=shoppingId?getGiftById(shoppingId):undefined;
 const textures=useTexture(['/jakae_sprite/monitor_01.png','/jakae_sprite/monitor_02.png','/jakae_sprite/monitor_03.png']);
 const maps=useMemo(()=>textures.map(original=>{
  const t=original.clone();t.colorSpace=T.SRGBColorSpace;
  const image=t.image as {width:number;height:number},aspect=image.width/image.height,target=.91/.51;
  t.repeat.set(Math.min(1,target/aspect),Math.min(1,aspect/target));t.offset.set((1-t.repeat.x)/2,(1-t.repeat.y)/2);t.needsUpdate=true;return t;
 }),[textures]);
 const [news,setNews]=useState(''),[monitor,setMonitor]=useState<number|null>(null),element=useRef<HTMLDivElement>(null);
 const tvGlow=useRef<T.Group>(null);
 const tvLight=useRef<T.PointLight>(null);
 // Keep the light count stable: toggling visibility recompiles lit room materials.
 useFrame(()=>{const on=life.current.media==='tv';if(tvGlow.current)tvGlow.current.visible=on;if(tvLight.current)tvLight.current.intensity=on?1.2:0;});
 useFrame(()=>{const s=life.current;const id=s.media==='tv'?s.mediaGiftId:null;if(id!==shoppingId)setShoppingId(id);const next=s.media==='tv'?s.mediaNews.slice(0,Math.max(1,Math.floor((s.now-s.mediaStarted)/TV_CHAR_SECONDS))):'';if(next!==news)setNews(next);const screen=s.media==='game'?s.monitor:null;if(screen!==monitor)setMonitor(screen);});
 return <>
  <pointLight ref={tvLight} position={[-.6,1.12,3.22]} color="#92c9ff" intensity={0} distance={2.4} decay={2}/>
  <group ref={tvGlow} visible={false}>
   <mesh position={[-.6,.044,1.9]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}>
    <planeGeometry args={[1.65,1.7]}/>
    <shaderMaterial transparent depthWrite={false} toneMapped={false}
     vertexShader={`varying vec2 glowUv;void main(){glowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
     fragmentShader={`varying vec2 glowUv;void main(){float r=length((glowUv-.5)*2.0);float a=(1.0-smoothstep(.05,1.0,r))*.24;gl_FragColor=vec4(.48,.73,1.0,a);}`}/>
   </mesh>
  </group>
  {monitor!==null&&<mesh position={[3.28,1.36,-3.654]} raycast={()=>{}}><planeGeometry args={[.91,.51]}/><meshBasicMaterial map={maps[monitor]} toneMapped={false}/></mesh>}
  {news&&<Html position={[-.6,1.6,3.55]} zIndexRange={[40,30]} style={{pointerEvents:'none'}} calculatePosition={(object,camera,size)=>{
   const el=element.current;if(!el)return [0,-1000];
   const p=object.getWorldPosition(new T.Vector3()).project(camera),w=el.offsetWidth,h=el.offsetHeight;
   const clamp=(v:number,max:number)=>Math.max(8,Math.min(v,max-8));
   const x=clamp((p.x+1)*size.width/2-w/2,size.width-w),y=clamp((1-p.y)*size.height/2-h-8,size.height-h);
   const blockers:{left:number;right:number;top:number;bottom:number}[]=[];
   const sprite=character.current,group=carrier.current;
   if(sprite&&group){const q=group.position.clone().project(camera),z=(camera as T.OrthographicCamera).zoom,cx=(q.x+1)*size.width/2,cy=(1-q.y)*size.height/2;blockers.push({left:cx-sprite.center.x*sprite.scale.x*z,right:cx+(1-sprite.center.x)*sprite.scale.x*z,top:cy-(1-sprite.center.y)*sprite.scale.y*z,bottom:cy+sprite.center.y*sprite.scale.y*z});}
   const speech=bubble.current,canvas=el.closest('section')?.querySelector('canvas');
   if(speech&&canvas){const r=speech.getBoundingClientRect(),c=canvas.getBoundingClientRect();blockers.push({left:r.left-c.left,right:r.right-c.left,top:r.top-c.top,bottom:r.bottom-c.top});}
   const candidates=[[x,y],[8,y],[size.width-w-8,y],[x,8],[x,size.height-h-8],...blockers.flatMap(b=>[[b.left-w-8,y],[b.right+8,y],[x,b.top-h-8],[x,b.bottom+8]])];
   const found=candidates.map(([a,b])=>[clamp(a,size.width-w),clamp(b,size.height-h)]).find(([a,b])=>blockers.every(r=>a+w+5<=r.left||a>=r.right+5||b+h+5<=r.top||b>=r.bottom+5));
   el.style.visibility=found?'visible':'hidden';return found||[x,y];
  }}><div ref={element} className="tv-news"><strong>{life.current.mediaTitle}</strong><div>{news}</div>{shopping&&!gifts.owned.includes(shopping.id)&&<button className="tv-shop-buy" onClick={e=>{e.stopPropagation();gifts.offer(shopping,shopping.band??kst().period);}}><GiftPrice price={shopping.price}/>구매하기</button>}</div></Html>}
 </>;
}
