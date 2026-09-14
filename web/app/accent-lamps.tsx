'use client';
import {RoundedBox} from '@react-three/drei';

// Small fixtures use shared silhouettes and no shadow maps or post-processing.
export function AccentLamps({power}:{power:number}){
 const glow=Math.min(1.7,power*.2);
 const bulb=<meshStandardMaterial color="#ffe4ac" emissive="#ffca72" emissiveIntensity={glow} roughness={.65}/>;
 const wood=<meshStandardMaterial color="#b48358" roughness={.8}/>;
 return <group>
  {/* Ceiling illumination above the rug; no visible floor fixture. */}
 <pointLight position={[-.3,2.7,1.55]} color="#ffd6a0" intensity={power*1.05} distance={4.5}/>
  {/* Slim standing lamp, slightly taller than Jakae, lighting the lower room. */}
  <group position={[4.12,0,2.76]}>
   <mesh position={[0,.045,0]}><cylinderGeometry args={[.23,.26,.09,32]}/>{wood}</mesh>
   <mesh position={[0,.73,0]}><cylinderGeometry args={[.027,.035,1.4,16]}/>{wood}</mesh>
   <mesh position={[0,1.43,0]}><cylinderGeometry args={[.19,.34,.36,32,1,true]}/><meshStandardMaterial color="#fff0d6" side={2} roughness={.85} emissive="#ffe3b3" emissiveIntensity={glow*.25}/></mesh>
   <mesh position={[0,1.35,0]}><sphereGeometry args={[.09,16,12]}/>{bulb}</mesh>
   <pointLight position={[-.12,1.22,0]} color="#ffdfad" intensity={power*.65+.3} distance={6} decay={2}/>
  </group>  {/* Wall-mounted opal globe with a brass arm and warm pool of light. */}
  <group position={[-4.4,2.2,1]}>
   <RoundedBox args={[.06,.28,.18]} radius={.025}><meshStandardMaterial color="#c5a16a" roughness={.6}/></RoundedBox>
   <mesh position={[.16,.09,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.018,.018,.3,12]}/>{wood}</mesh>
   <mesh position={[.3,-.06,0]}><sphereGeometry args={[.14,24,16]}/>{bulb}</mesh>
   <mesh position={[.3,.075,0]}><cylinderGeometry args={[.065,.085,.05,16]}/>{wood}</mesh>
   <pointLight position={[.43,-.06,0]} color="#ffdfaf" intensity={power*.65} distance={4}/>
  </group>
 </group>;
}
