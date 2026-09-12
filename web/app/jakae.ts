import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A new articulated plush, authored against the approved model sheet. No prototype geometry.
export function makeJakae(){
 const root=new T.Group(), body=new T.Group(), head=new T.Group(),eyes=new T.Group(),lids=new T.Group(); root.add(body); body.add(head);head.add(eyes,lids);lids.visible=false; head.position.y=1.045;
 const noise=new Uint8Array(64*64*4);let seed=42;for(let i=0;i<noise.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=180+(seed%76);noise.set([n,n,n,255],i);}
 const bump=new T.DataTexture(noise,64,64);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(5,5);bump.needsUpdate=true;
 const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:1,bumpMap:bump,bumpScale:.0016});
 const blue=mat('#1857b8'),beige=mat('#f2d6ab'),white=mat('#faf4e8'),green=mat('#418945'),black=mat('#171c24'),red=mat('#ce334b'),grey=mat('#aaa9a5'),gold=mat('#f6ca55');
 const sphere=new T.SphereGeometry(1,28,20);
 function ball(parent:T.Group,m:T.Material,p:number[],s:number[],rot=0){const o=new T.Mesh(sphere,m);o.position.set(p[0],p[1],p[2]);o.scale.set(s[0],s[1],s[2]);o.rotation.z=rot;parent.add(o);return o;}
 function stitch(parent:T.Group,points:T.Vector3[],radius=.003){const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,5,false);const o=new T.Mesh(geo,black);parent.add(o);}
 ball(head,blue,[0,0,0],[.285,.282,.242]);
 // Rounded, downward swept plush quills, including the central back layers.
 for(const [x,y,z,sx,sy,sz,tilt] of [[-.235,-.10,-.08,.11,.235,.16,-.38],[.235,-.10,-.08,.11,.235,.16,.38],[-.16,.1,-.16,.16,.115,.20,-.4],[.16,.1,-.16,.16,.115,.20,.4],[0,.18,-.14,.14,.12,.20,0],[0,-.12,-.225,.14,.235,.12,0],[-.15,-.20,-.17,.115,.19,.13,-.4],[.15,-.20,-.17,.115,.19,.13,.4]]) ball(head,blue,[x,y,z],[sx,sy,sz],tilt);
 for(const side of [-1,1]){
  const ear=new T.Shape();ear.moveTo(-.065,0);ear.quadraticCurveTo(-.08,.13,0,.16);ear.quadraticCurveTo(.055,.135,.075,0);ear.quadraticCurveTo(0,-.03,-.065,0);
  const eg=new T.ExtrudeGeometry(ear,{depth:.035,bevelEnabled:true,bevelThickness:.018,bevelSize:.012,bevelSegments:3,steps:1,curveSegments:12});
  const e=new T.Mesh(eg,blue);e.position.set(side*.20,.17,.015);e.rotation.z=-side*.35;head.add(e);
  const inner=new T.Mesh(new T.ShapeGeometry(ear,12),beige);inner.scale.set(.7,.73,1);inner.position.set(0,.012,.058);e.updateMatrix();inner.applyMatrix4(e.matrix);head.add(inner);
 }
 // Low muzzle, tall embroidered eye patches and restrained stitched smile.
 for(const side of [-1,1]){
  ball(head,white,[side*.105,.035,.208],[.091,.15,.045],-side*.12);
  ball(eyes,green,[side*.09,-.002,.252],[.031,.069,.011],-side*.10);
  ball(eyes,black,[side*.084,-.009,.262],[.016,.047,.007]);
  ball(eyes,white,[side*.087-.009,.02,.267],[.009,.012,.004]);
  stitch(lids,[new T.Vector3(side*.105-.031,-.008,.256),new T.Vector3(side*.105,.008,.259),new T.Vector3(side*.105+.031,-.008,.256)],.004);
 }
 ball(head,beige,[0,-.143,.20],[.221,.095,.09]);
 ball(head,black,[0,-.087,.292],[.023,.031,.024],.05);
 stitch(head,[new T.Vector3(.055,-.173,.286),new T.Vector3(.087,-.175,.282),new T.Vector3(.119,-.155,.274),new T.Vector3(.129,-.137,.266)],.0025);
 ball(body,blue,[0,.72,0],[.136,.21,.11]);
 ball(body,green,[0,.745,.004],[.157,.175,.135]);
 ball(body,beige,[0,.592,.10],[.07,.04,.023]);
 // Daisies distributed over the little green sweater, following its curved front.
 for(const [x,y] of [[-.075,.83],[.065,.81],[-.09,.72],[.04,.67],[.105,.74],[0,.9]]){
  const z=.004+.135*Math.sqrt(Math.max(.05,1-(x/.16)**2-((y-.745)/.18)**2));
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(body,white,[x+Math.cos(a)*.016,y+Math.sin(a)*.016,z+.003],[.012,.011,.004]);}
  ball(body,gold,[x,y,z+.01],[.008,.008,.004]);
 }
 const arms:T.Group[]=[],legs:T.Group[]=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.14,.85,0);arm.rotation.z=side*.12;body.add(arm);arms.push(arm);
  ball(arm,green,[side*.025,-.052,0],[.073,.091,.073],-side*.25);
  ball(arm,beige,[side*.055,-.20,0],[.034,.14,.034],-side*.18);
  ball(arm,white,[side*.08,-.319,0],[.055,.034,.049]);
  ball(arm,white,[side*.085,-.375,.006],[.05,.073,.042]);
  ball(arm,white,[side*.045,-.368,.033],[.025,.043,.024],side*.45);
  for(let f=0;f<3;f++)stitch(arm,[new T.Vector3(side*.085+(f-1)*.018,-.397,.044),new T.Vector3(side*.085+(f-1)*.018,-.416,.033)],.001);
  const leg=new T.Group();leg.position.set(side*.075,.62,0);body.add(leg);legs.push(leg);
  ball(leg,blue,[side*.013,-.20,0],[.04,.22,.042],side*.035);
  ball(leg,white,[side*.018,-.415,.005],[.067,.043,.062]);
  ball(leg,grey,[side*.032,-.558,.073],[.098,.038,.164]);
  ball(leg,red,[side*.032,-.505,.065],[.10,.080,.16]);
  ball(leg,grey,[side*.032,-.515,.165],[.087,.064,.071]);
  ball(leg,white,[side*.032,-.466,.071],[.104,.015,.04],.04);
  ball(leg,gold,[side*.126,-.482,.031],[.012,.035,.034]);
  ball(leg,red,[side*.137,-.482,.033],[.005,.019,.019]);
 }
 // Consolidate each independently animated part by material to reduce draw calls.
 for(const group of [eyes,lids,head,...arms,...legs,body]){
  const buckets=new Map<T.Material,T.BufferGeometry[]>();
  for(const obj of [...group.children]){if(!(obj instanceof T.Mesh))continue;obj.updateMatrix();const g=(obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone()).applyMatrix4(obj.matrix);const m=obj.material as T.Material;const list=buckets.get(m)||[];list.push(g);buckets.set(m,list);group.remove(obj);}
  for(const [m,geos] of buckets){const g=mergeGeometries(geos,false);if(g){const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}geos.forEach(g=>g.dispose());}
 }
 return {root,body,head,arms,legs,eyes,lids};
}
