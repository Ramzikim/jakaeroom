'use client';
import {setRoomCursor} from './room-cursor';
import {LpPlaylist} from './lp-playlist';
import {RoundedBox} from '@react-three/drei';
import * as T from 'three';
import {playSfx} from './sfx';
const berryGeometry=new T.SphereGeometry(1,24,16);
const berryVertices=berryGeometry.attributes.position;
for(let i=0;i<berryVertices.count;i++){const taper=.78+.22*(berryVertices.getY(i)+1)/2;berryVertices.setX(i,berryVertices.getX(i)*taper);berryVertices.setZ(i,berryVertices.getZ(i)*taper);}
berryGeometry.computeVertexNormals();// A gently folded, pointed leaf shared by every strawberry calyx.
const leaf=new T.BufferGeometry();
leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0, -.022,.002,.025, -.017,-.003,.055, 0,-.012,.079, .017,-.003,.055, .022,.002,.025, 0,.012,.035],3));
leaf.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leaf.computeVertexNormals();
const fruitPile=[
 [-.10,.20,.065,.9,.3,-.7,.83],[.075,.205,.085,-.6,.8,.8,.87],
 [-.105,.21,-.07,.6,-.8,1.1,.82],[.065,.215,-.08,-1.0,.3,-.45,.88],
 [-.02,.255,.005,.8,.9,.55,.9],[.12,.255,.015,-.5,-.7,-.8,.73],
 [-.07,.285,-.03,-.8,.4,.3,.77],
];
const cream='#f3dfb8',pink='#dc9da9',wood='#c49a66';
function Box({size,position,color}:{size:[number,number,number],position:[number,number,number],color:string}){return <RoundedBox args={size} position={position} radius={Math.min(...size)*.22} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.85}/></RoundedBox>;}
function Berry({position,scale=1}:{position:[number,number,number],scale?:number}){return <group position={position} scale={scale}>
 <mesh scale={[.072,.093,.066]} castShadow geometry={berryGeometry}><meshStandardMaterial color="#dd6972" roughness={.8}/></mesh>
 {[0,1,2,3,4,5].map(i=><mesh key={i} geometry={leaf} position={[0,.073,0]} rotation={[.12+(i%2)*.16,i*Math.PI/3,.08]} scale={.75+(i%3)*.09} castShadow receiveShadow><meshStandardMaterial color={i%2?'#78974d':'#8da858'} roughness={.9} side={T.DoubleSide}/></mesh>)}
 <mesh position={[.004,.09,0]} rotation={[.18,0,-.2]} castShadow><cylinderGeometry args={[.008,.011,.04,6]}/><meshStandardMaterial color="#6b8541" roughness={1}/></mesh>
 {[0,1,2,3,4,5].map(i=><mesh key={i} position={[Math.sin(i*2.4)*.056,(i%3-1)*.037,Math.cos(i*2.4)*.057]} scale={[.007,.012,.006]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={cream}/></mesh>)}
 </group>;}
function Basket(){return <group>
 <mesh castShadow receiveShadow><latheGeometry args={[[[0,0],[.18,0],[.22,.15],[.202,.15],[.164,.026],[0,.026]].map(([r,y])=>new T.Vector2(r,y)),24]}/><meshStandardMaterial color={wood} roughness={1}/></mesh>
 {[.025,.065,.105,.14].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.18+y*.26,.014,4,16]}/><meshStandardMaterial color={cream} roughness={1}/></mesh>)}
 {Array.from({length:12},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/6)*.2,.085,Math.sin(i*Math.PI/6)*.2]} rotation={[0,-i*Math.PI/6,0]} castShadow><boxGeometry args={[.017,.12,.018]}/><meshStandardMaterial color="#dfbd8c" roughness={1}/></mesh>)}
 {fruitPile.map(([x,y,z,rx,ry,rz,s],i)=><group key={i} position={[x,y-.105,z]} rotation={[rx,ry,rz]}><Berry position={[0,0,0]} scale={s}/></group>)}
 <mesh position={[0,.16,0]} castShadow><torusGeometry args={[.21,.023,6,16,Math.PI]}/><meshStandardMaterial color={cream} roughness={1}/></mesh>

 </group>;}
function Plant(){return <group>
 <mesh castShadow receiveShadow><latheGeometry args={[[[0,0],[.095,0],[.125,.22],[.105,.22],[.09,.055],[0,.055]].map(([r,y])=>new T.Vector2(r,y)),24]}/><meshStandardMaterial color="#f1e6d4" roughness={.85}/></mesh>
 <mesh position={[0,.18,0]}><cylinderGeometry args={[.105,.105,.015,20]}/><meshStandardMaterial color="#59402c" roughness={1}/></mesh>
 <mesh position={[0,.30,0]}><cylinderGeometry args={[.009,.013,.25,8]}/><meshStandardMaterial color="#6a8151"/></mesh>
 {[0,1,2,3,4,5,6,7].map(i=><group key={i} position={[0,.23+i*.023,0]} rotation={[0,i*2.4,.6]}><mesh position={[0,.045,.048]} rotation={[-.6,0,0]} scale={[.046,.025,.10]} castShadow><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color={i%2?'#739653':'#8ba76a'} roughness={.9}/></mesh></group>)}
 </group>;}function Album(){return <group rotation={[0,-.12,0]}>
 <Box size={[.36,.025,.30]} position={[0,.013,0]} color={pink}/>
 <Box size={[.33,.035,.275]} position={[.005,.041,0]} color="#fff3d9"/>
 <Box size={[.36,.022,.30]} position={[0,.069,0]} color={pink}/>
 <Box size={[.30,.008,.25]} position={[.012,.084,0]} color={cream}/>
 <Box size={[.045,.075,.30]} position={[-.167,.042,0]} color={pink}/>
 <group position={[0,.095,0]} rotation={[-Math.PI/2,0,0]} scale={[.65,.65,.15]}><Berry position={[0,0,0]}/></group>
 <Box size={[.08,.018,.05]} position={[.145,.091,0]} color={pink}/>
 </group>;}
function RecordPlayer(){return <group>
 <Box size={[.53,.105,.38]} position={[0,.06,0]} color={pink}/>
 <Box size={[.49,.024,.345]} position={[0,.124,0]} color={cream}/>
 <group position={[0,.12,-.17]} rotation={[-.18,0,0]}>
  <Box size={[.53,.32,.045]} position={[0,.16,0]} color={cream}/>
  <Box size={[.46,.25,.012]} position={[0,.16,.027]} color={pink}/>
 </group>
 <mesh position={[-.055,.143,0]} castShadow><cylinderGeometry args={[.15,.15,.015,32]}/><meshStandardMaterial color="#464044" roughness={.6}/></mesh>
 {[.09,.12,.14].map(r=><mesh key={r} position={[-.055,.152,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[r,.0015,3,32]}/><meshStandardMaterial color="#70676a"/></mesh>)}
 <mesh position={[-.055,.154,0]}><cylinderGeometry args={[.054,.054,.006,20]}/><meshStandardMaterial color={pink}/></mesh>
 <mesh position={[-.055,.166,0]}><cylinderGeometry args={[.009,.009,.024,8]}/><meshStandardMaterial color={cream}/></mesh>
 <group position={[.185,.16,-.1]} rotation={[0,-.35,0]}><Box size={[.026,.025,.21]} position={[0,.02,.09]} color={cream}/><Box size={[.06,.03,.06]} position={[0,.007,.19]} color={pink}/></group>
 <mesh position={[.19,.153,.125]}><cylinderGeometry args={[.03,.035,.028,12]}/><meshStandardMaterial color={wood}/></mesh>
 {[0,1,2].map(i=><Box key={i} size={[.22,.008,.005]} position={[0,.04+i*.018,.192]} color="#ac6c7c"/>)}
 </group>;}
export function TableProps({onBasket,disabled}:{onBasket:()=>void,disabled:boolean}){return <group>
 <group position={[.83,.445,1.78]} onClick={e=>{e.stopPropagation();if(!disabled){playSfx("ui");onBasket();}}} onPointerOver={e=>{e.stopPropagation();setRoomCursor(disabled?'normal':'click');}} onPointerOut={()=>{setRoomCursor('normal');}}><Basket/></group>
 <group position={[1.4,.445,1.5]}><Album/></group>
 <LpPlaylist><RecordPlayer/></LpPlaylist>
 <group position={[3.69,1.125,3.57]} scale={1.15}><Plant/></group>
 </group>;}
