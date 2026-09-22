import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

// Render the real component's light hierarchy, then drive its frame callbacks.
const frames=[],scene=new THREE.Scene(),exports={};
const jsx=(type,props)=>({type,props});
const dependencies={
 'react':{useRef:current=>({current}),useMemo:fn=>fn(),useState:value=>[value,()=>{}]},
 'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},
 '@react-three/fiber':{useFrame:fn=>frames.push(fn)},
 '@react-three/drei':{useTexture:()=>[]},
 'three':THREE,
 './gift-ui':{useGifts:()=>({owned:[]})},
 './behavior':{TV_CHAR_SECONDS:.04},
};
const source=fs.readFileSync(new URL('../app/media-display.tsx',import.meta.url),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>dependencies[name]??{}});
const life={current:{media:null,mediaNews:'',now:0,mediaStarted:0,monitor:0}};
function mount(node,parent){
 if(!node)return;
 if(Array.isArray(node)){node.forEach(child=>mount(child,parent));return;}
 const {type,props}=node;
 if(!props)return;
 const object=type==='pointLight'?new THREE.PointLight():new THREE.Group();
 if(props.visible!==undefined)object.visible=props.visible;
 if(props.intensity!==undefined)object.intensity=props.intensity;
 if(props.ref)props.ref.current=object;
 parent.add(object);mount(props.children,object);
}
mount(exports.MediaDisplay({life,bubble:{current:null},character:{current:null},carrier:{current:null}}),scene);
const visibleLights=()=>{const lights=[];scene.traverseVisible(o=>{if(o.isPointLight)lights.push(o);});return lights;};
for(const media of [null,'tv',null,'tv','game']){
 life.current.media=media;frames.forEach(fn=>fn());
 const lights=visibleLights();assert.equal(lights.length,1,'TV transitions must not change shader light count');
 assert.equal(lights[0].intensity,media==='tv'?1.2:0,'TV lighting stays visually on/off');
}
console.log('PASS: TV on/off/re-entry/game preserve shader light count and original brightness');
