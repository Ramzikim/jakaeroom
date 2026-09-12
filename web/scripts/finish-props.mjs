import {getBounds} from '@gltf-transform/core';
import {LatheGeometry, CylinderGeometry, Vector2, Matrix4} from 'three';

export function finishProps(doc) {
 const scene=doc.getRoot().listScenes()[0], buffer=doc.getRoot().listBuffers()[0];
 const soil=doc.createMaterial('Recessed brown soil').setBaseColorFactor([.12,.065,.03,1]).setRoughnessFactor(1);
 const stem=doc.createMaterial('Plant stems').setBaseColorFactor([.18,.29,.07,1]).setRoughnessFactor(1);
 function mesh(name,g,material){
  const p=doc.createPrimitive().setMaterial(material);
  for(const [key,semantic] of [['position','POSITION'],['normal','NORMAL']])p.setAttribute(semantic,doc.createAccessor().setType('VEC3').setArray(g.attributes[key].array).setBuffer(buffer));
  p.setIndices(doc.createAccessor().setType('SCALAR').setArray(g.index.array).setBuffer(buffer));
  return doc.createMesh(name).addPrimitive(p);
 }
 const nodes=[...doc.getRoot().listNodes()];
 for(const n of nodes){
  const name=n.getName();
  if(name==='INT_GameController'||name==='DECOR_Plant_Snack'||name.startsWith('DEN_StorageFull')||name.startsWith('DEN_TVPhoto')){n.dispose();continue;}
  if(!/^DEN_.*Pot$/.test(name)||name==='DEN_SnackSidePot')continue;
  const {min,max}=getBounds(n),r=(max[0]-min[0])/2,h=max[1]-min[1],x=(min[0]+max[0])/2,z=(min[2]+max[2])/2;
  const material=n.getMesh().listPrimitives()[0].getMaterial();
  const profile=[[0,0],[r*.78,0],[r,h*.9],[r,h],[r*.79,h],[r*.77,h*.6],[0,h*.6]].map(([a,b])=>new Vector2(a,b));
  n.setMesh(mesh(name,new LatheGeometry(profile,32),material)).setTranslation([x,min[1],z]).setRotation([0,0,0,1]).setScale([1,1,1]);
  for(const old of nodes)if(old.getName()===name.replace(/Pot$/,'Soil'))old.dispose();
  const s=doc.createNode(name+' recessed soil').setMesh(mesh('soil',new CylinderGeometry(r*.77,r*.77,.012,32),soil)).setTranslation([x,max[1]-h*.2,z]);scene.addChild(s);
  scene.addChild(doc.createNode(name+' rooted stem').setMesh(mesh('stem',new CylinderGeometry(r*.09,r*.12,h*.65,8),stem)).setTranslation([x,max[1]+h*.08,z]));
 }
 // Lay the existing headset flat, above the top book, using one rigid transform.
 const headphones=doc.createNode('Headset resting on books');
 const transform=new Matrix4().makeTranslation(4,1.135,-3.24).multiply(new Matrix4().makeRotationX(-Math.PI/2)).multiply(new Matrix4().makeTranslation(-4.24,-1.05,3.47));
 headphones.setMatrix(transform.toArray());scene.addChild(headphones);
 for(const n of nodes)if(n.getName().startsWith('DEN_GamingHeadset'))headphones.addChild(n);
 // Reuse the original simple cake on the now-clear snack counter.
 for(const n of nodes)if(['SNACK_DessertPlate','INT_Snack_Cake','SNACK_CakeCream','INT_Strawberry'].includes(n.getName())){const p=n.getTranslation();n.setTranslation([p[0]-.9,p[1]-.28,p[2]+.07]);}
}

