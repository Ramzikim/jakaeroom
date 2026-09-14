'use client';
import {shadowStyle} from './shadow';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html,useTexture} from '@react-three/drei';
import * as T from 'three';
import {useJakaeProfile,useProfileDialogue} from './profile-ui';
import {placeBubble} from './bubble-layout';
import frames from './sprite-frames.json';
import {animationFps,createLife,commandLife,tickLife,locked,RULES,type Action,type Band,type Sequence} from './behavior';
import type {Mood} from './life';
export {walkSequence} from './behavior';
const all=Object.values(frames).flat(),urls=all.map(f=>f.url);
const lengths=Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,v.length])) as Record<Sequence,number>;
const configureTextures=(textures:T.Texture[])=>{textures.forEach(t=>{if(t.colorSpace!==T.SRGBColorSpace){t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;}});};
const moodFor=(sequence:Sequence):Mood=>sequence.includes('walk')?'walk':sequence==='sit_idle'?'sit':sequence==='sit_snooze'?'rest':sequence==='sit_sleeploop'?'sleep':sequence==='strawberry'?'berry':sequence==='hop'||sequence==='shy'?'pet':sequence==='bath'?'bath':'idle';
export function SpriteResident({command,onMood,onReady,onPet,positionRef,phase}:{command:{action:Action,id:number}|null,onMood:(m:Mood)=>void,onReady:()=>void,onPet:()=>void,positionRef:React.MutableRefObject<T.Vector3>,phase:Band}){
 const dialogue=useProfileDialogue(),profile=useJakaeProfile();
 const textures=useTexture(urls,configureTextures),carrier=useRef<T.Group>(null),sprite=useRef<T.Sprite>(null);
 const {gl}=useThree();
 const shadow=useRef<T.Mesh>(null);
 const shadowUniforms=useMemo(()=>({alpha:{value:.22},softness:{value:1}}),[]);
 const frameClock=useRef({sequence:'idle' as Sequence,value:0});
 const life=useRef(createLife()),seenCommand=useRef<number|null>(null),lastMood=useRef<Mood>('idle');
 life.current.relationshipTier=profile?.relationshipTier||'normal';
 const [speech,setSpeech]=useState(life.current.speech);
 const bubble=useRef<HTMLDivElement>(null);
 const [testSpeech,setTestSpeech]=useState<string|null>(null);
 useEffect(()=>{if(process.env.NODE_ENV==='development')setTestSpeech(new URLSearchParams(location.search).get('speech'));},[]);
 useEffect(()=>{onReady();},[textures,onReady]);
 useEffect(()=>{if(command&&command.id!==seenCommand.current){seenCommand.current=command.id;commandLife(life.current,command.action);}},[command]);
 useFrame((_,delta)=>{
  const s=life.current;tickLife(s,delta,phase,lengths);
  if(process.env.NODE_ENV==='development'){gl.domElement.dataset.sequence=s.sequence;gl.domElement.dataset.seat=s.node;gl.domElement.dataset.elapsed=String(Math.floor(s.now-s.started));}
  const mood=moodFor(s.sequence);if(lastMood.current!==mood){lastMood.current=mood;onMood(mood);}
  const line=s.now<s.speechUntil?s.speech:'';if(line!==speech)setSpeech(line);
  if(frameClock.current.sequence!==s.sequence){frameClock.current={sequence:s.sequence,value:0};}else frameClock.current.value+=delta*animationFps(s);
  const sequence=frames[s.sequence],index=Math.floor(frameClock.current.value);
  const oneShot=['hop','shy','sit_snooze'].includes(s.sequence),frame=sequence[oneShot?Math.min(index,sequence.length-1):index%sequence.length];
  const material=sprite.current!.material as T.SpriteMaterial;material.map=textures[all.indexOf(frame)];
  // Canvas registration is fixed per sequence, so drawn jumps and breathing survive.
  let pixels=543,anchorX=.5,anchorY=0;
  if(s.sequence==='idle')pixels=467;
  if(s.sequence==='hop'){pixels=467;anchorX=236/426;anchorY=20/716;}
  if(s.sequence==='sit_idle'){pixels=550;anchorY=20/522;}
  if(s.sequence==='sit_snooze'||s.sequence==='sit_sleeploop'){pixels=550;anchorY=16/494;}
  if(s.sequence==='bath'){pixels=510;anchorY=55/428;}
  if(s.sequence==='strawberry'){pixels=439/.95;anchorY=3/458;}
  sprite.current!.scale.set(frame.width*1.4/pixels,frame.height*1.4/pixels,1);sprite.current!.center.set(anchorX,anchorY);
  const shade=shadowStyle(s.sequence,frameClock.current.value),sw=sprite.current!.scale.x;
  shadow.current!.visible=shade.visible;shadow.current!.scale.set(sw*shade.width,sw*shade.height/.522,1);
  shadowUniforms.alpha.value=shade.opacity;
  shadowUniforms.softness.value=Math.min(1,Math.max(.5,shade.blur/(sw*shade.width*(_.camera as T.OrthographicCamera).zoom*.5)));
  carrier.current!.position.set(s.point[0],s.point[1],s.point[2]);positionRef.current.copy(carrier.current!.position);positionRef.current.y+=.7;
 });
 return <group ref={carrier} position={[1.65,0,-.55]}>
  <mesh ref={shadow} position={[0,.008,0]} rotation={[-Math.PI/2,0,Math.atan2(12,16)]} renderOrder={-1} raycast={()=>{}}>
   <planeGeometry args={[1,1]}/>
   <shaderMaterial transparent depthWrite={false} depthTest toneMapped={false} uniforms={shadowUniforms}
    vertexShader={`varying vec2 shadowUv; void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
    fragmentShader={`varying vec2 shadowUv; uniform float alpha; uniform float softness; void main(){float r=length((shadowUv-.5)*2.0);float fade=1.0-smoothstep(1.0-softness,1.0,r);gl_FragColor=vec4(.16,.12,.10,alpha*fade);}`}/>
  </mesh>
  <sprite ref={sprite} onClick={e=>{e.stopPropagation();if(!locked(life.current)||life.current.sequence==='sit_sleeploop')onPet();}} onPointerOver={()=>{document.body.style.cursor=!locked(life.current)||life.current.sequence==='sit_sleeploop'?'pointer':'auto';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
   <spriteMaterial map={textures[0]} transparent alphaTest={.05} depthTest depthWrite toneMapped={false} onBeforeCompile={shader=>{
    // Preserve artwork projection; depth follows an upright plane rooted at the feet.
    // Fixed camera elevation: 12.25 vertical / 20 horizontal.
    shader.vertexShader=shader.vertexShader.replace('mvPosition.xy += rotatedPosition;', 'mvPosition.xy += rotatedPosition; mvPosition.z += rotatedPosition.y * 0.6125;');
   }}/>
  </sprite>
  {(testSpeech||speech)&&<Html zIndexRange={[20,0]} style={{pointerEvents:'none'}} calculatePosition={(_,camera,size)=>{
   const character=sprite.current,element=bubble.current;if(!character||!carrier.current||!element)return [0,-1000];
   const point=carrier.current.position.clone().project(camera),zoom=(camera as T.OrthographicCamera).zoom;
   const x=(point.x+1)*size.width/2,y=(1-point.y)*size.height/2;
   const bounds={left:x-character.center.x*character.scale.x*zoom,right:x+(1-character.center.x)*character.scale.x*zoom,top:y-(1-character.center.y)*character.scale.y*zoom,bottom:y+character.center.y*character.scale.y*zoom};
   const position=placeBubble(bounds,element.offsetWidth,element.offsetHeight,size.width,size.height);
   element.style.visibility=position.visible?'visible':'hidden';
   if(process.env.NODE_ENV==='development')element.dataset.spriteBounds=JSON.stringify(bounds);
   return [position.x,position.y];
  }}><div ref={bubble} className="bubble">{dialogue(testSpeech||speech)}</div></Html>}
 </group>;
}




