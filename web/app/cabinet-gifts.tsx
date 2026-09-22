'use client';
import {useTexture} from '@react-three/drei';
import {SRGBColorSpace} from 'three';
import {GIFT_REGISTRY} from '../lib/gifts';

// Relative sizes use Mimi = 50. Tune the common height and shelf depth here.
const BASE_HEIGHT = .40;
const SHELF_X = -3.75;
const placements = [
 {id:'starlight_sleep_lamp',y:1.7459,z:-.21,size:60,glow:true},
 {id:'strawberry_tower',y:1.7459,z:-1.25,size:75,glow:false},
 {id:'starlight_mailbox',y:1.7459,z:-.66,size:60,glow:true},
 {id:'mimi_plush',y:1.1835,z:-.33,size:50,glow:false},
 {id:'singpa_plush',y:1.1835,z:-1.13,size:40,glow:false},
 {id:'somi_goods',y:.6525,z:-.33,size:45,glow:false},
 {id:'lightning_knight_figure',y:.6525,z:-1.13,size:30,glow:false},
] as const;

export function CabinetGifts({ownedGiftIds=[],previewAll=process.env.NODE_ENV==='development'}:{ownedGiftIds?:readonly string[];previewAll?:boolean}){
 const textures=useTexture(GIFT_REGISTRY.map(g=>g.imagePath+(g.id==='starlight_mailbox'?'?v=2':'')),loaded=>{
  for(const texture of loaded){texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;}
 });
 return <group name="CabinetGifts">{placements.filter(p=>previewAll||ownedGiftIds.includes(p.id)).map(p=>{
  const texture=textures[GIFT_REGISTRY.findIndex(g=>g.id===p.id)];
  const aspect=texture.image.width/texture.image.height;
  const height=BASE_HEIGHT*p.size/50;
  // Move the top objects left/down in the fixed view while keeping feet on the shelf.
  const top=p.y>1.7;
  const mailbox=p.id==='starlight_mailbox';
  return <group key={p.id} position={[SHELF_X-(top?.029:0),p.y+.008,p.z+(top?.082:0)]}>
   <mesh position={[mailbox?-.015:0,-.003,mailbox?-.09:0]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}>
    <planeGeometry args={[height*(mailbox?.48:.7),height*(mailbox?1.15:.8)]}/>
    <shaderMaterial transparent depthWrite={false} toneMapped={false}
     vertexShader={`varying vec2 shadowUv; void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
     fragmentShader={`varying vec2 shadowUv; void main(){float r=length((shadowUv-.5)*2.0);float fade=1.0-smoothstep(0.0,1.0,r);gl_FragColor=vec4(.16,.12,.10,${top?'.40':'.30'}*fade);}`}/>
   </mesh>
   <sprite name={p.id} center={[.5,0]} scale={[height*aspect,height,1]} raycast={()=>{}}>
    <spriteMaterial map={texture} transparent alphaTest={.02} depthWrite={false} toneMapped={false}/>
   </sprite>
   {p.glow&&<pointLight position={[.04,.12,0]} color="#ffe4a1" intensity={.13} distance={.65} decay={2}/>}
  </group>;
 })}</group>;
}
