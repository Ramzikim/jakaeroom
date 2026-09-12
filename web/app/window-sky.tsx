'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {atmospheres} from './life';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`
varying vec2 vUv;uniform float time;uniform float mode;
float disc(vec2 p,vec2 c,float r){return 1.-smoothstep(r-.008,r+.008,length((p-c)*vec2(2.67,1.)));}
void main(){vec2 p=vUv;vec3 color;
if(mode<1.5){color=mix(vec3(.91,.95,.97),vec3(.29,.65,.87),p.y);vec2 sun=vec2(.75,.72);
if(mode>.5){color=mix(vec3(1.,.69,.36),vec3(.65,.31,.54),p.y);sun=vec2(.68,.2);}
float glow=disc(p,sun,.19);color=mix(color,vec3(1.,.86,.5),glow);
for(int i=0;i<2;i++){float x=fract(float(i)*.55+time*.012);float y=.55+float(i)*.24;float cloud=max(disc(p,vec2(x,y),.065),max(disc(p,vec2(x-.035,y-.015),.05),disc(p,vec2(x+.035,y-.015),.05)));color=mix(color,vec3(1.,.95,.88),cloud*.75);}
}else{color=mix(vec3(.12,.19,.32),vec3(.025,.055,.15),p.y);if(mode>2.5)color*=.7;
for(int i=0;i<24;i++){float f=float(i);vec2 star=vec2(fract(sin(f*32.7+2.)*437.2),.13+.8*fract(sin(f*13.3+7.)*138.7));float twinkle=.5+.5*sin(time*1.4+f*2.);float a=disc(p,star,.006+twinkle*.004);color+=vec3(.9,.9,.7)*a*(.4+.6*twinkle);}
float moon=disc(p,vec2(.74,.73),.14)*(1.-disc(p,vec2(.77,.77),.13));color=mix(color,vec3(1.,.9,.67),moon*(.94+.06*sin(time*.8)));}
gl_FragColor=vec4(color,1.);
#include <colorspace_fragment>
}`;
export function WindowSky({phase}:{phase:keyof typeof atmospheres}){
 const material=useRef<T.ShaderMaterial>(null);
 useFrame(({clock})=>{if(material.current){material.current.uniforms.time.value=clock.elapsedTime;material.current.uniforms.mode.value={day:0,afternoon:1,night:2,dawn:3}[phase];}});
 return <mesh position={[.1,2.16,-3.97]}><planeGeometry args={[3.48,1.30]}/><shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={{time:{value:0},mode:{value:0}}} toneMapped={false}/></mesh>;
}
