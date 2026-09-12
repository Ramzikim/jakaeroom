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
  {/* Warm opal lamp centered on the cleared strawberry cabinet. */}
  <group position={[3.69,1.12,3.57]}>
   <mesh position={[0,.045,0]}><cylinderGeometry args={[.15,.17,.09,24]}/>{wood}</mesh>
   <mesh position={[0,.14,0]}><cylinderGeometry args={[.045,.065,.14,16]}/>{wood}</mesh>
   <mesh position={[0,.29,0]} scale={[1,.9,1]}><sphereGeometry args={[.19,24,16]}/>{bulb}</mesh>
   <pointLight position={[0,.32,0]} color="#ffdb9e" intensity={power*.3} distance={2.8}/>
  </group>
  {/* Wall-mounted opal globe with a brass arm and warm pool of light. */}
  <group position={[-4.4,2.2,1]}>
   <RoundedBox args={[.06,.28,.18]} radius={.025}><meshStandardMaterial color="#c5a16a" roughness={.6}/></RoundedBox>
   <mesh position={[.16,.09,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.018,.018,.3,12]}/>{wood}</mesh>
   <mesh position={[.3,-.06,0]}><sphereGeometry args={[.14,24,16]}/>{bulb}</mesh>
   <mesh position={[.3,.075,0]}><cylinderGeometry args={[.065,.085,.05,16]}/>{wood}</mesh>
   <pointLight position={[.43,-.06,0]} color="#ffdfaf" intensity={power*.65} distance={4}/>
  </group>
  {/* Petite candle lantern on the coffee table, kept clear of existing snacks. */}
  <group position={[.7,.44,1.88]}>
   <mesh position={[0,.07,0]}><cylinderGeometry args={[.065,.075,.14,20]}/><meshStandardMaterial color="#f0bc9c" roughness={.85}/></mesh>
   <mesh position={[0,.17,0]} scale={[.025,.05,.025]}><sphereGeometry args={[1,12,8]}/>{bulb}</mesh>
   <pointLight position={[0,.21,0]} color="#ffbd72" intensity={power*.04} distance={1.2}/>
  </group>
 </group>;
}
