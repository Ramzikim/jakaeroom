import {finishProps} from './finish-props.mjs';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, join, weld, meshopt, mergeDocuments, unpartition } from '@gltf-transform/functions';
import {MeshoptEncoder} from 'meshoptimizer';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc = await io.read('public/models/room.glb');
// Replace only the approved wardrobe assembly and add its adjacent display cabinet.
const cabinet = await io.read('public/models/display-cabinet-v001.glb');
const replacementNames = new Set(cabinet.getRoot().listNodes().map(n => n.getName()));
for (const node of doc.getRoot().listNodes()) if (replacementNames.has(node.getName())) node.dispose();
const roomScene = doc.getRoot().getDefaultScene();
const merged = mergeDocuments(doc, cabinet);
for (const sourceScene of cabinet.getRoot().listScenes()) {
 const importedScene = merged.get(sourceScene);
 for (const node of [...importedScene.listChildren()]) roomScene.addChild(node);
 importedScene.dispose();
}
const removed = new Set(['LOUNGE_SoftCushion','DEN_LoungePinkThrow','DEN_BedSmallDotCushion','DEN_SnackSidePot','DEN_SnackSideSoil','DEN_SnackSideFoliage']);
// Clear the two trailing plants and the low picture overlapped by the display cabinet.
const removedPlantPrefixes=['DEN_LeftWallCascade','DEN_WardrobeTrailing','DEN_WardrobeCorner'];
for (const node of doc.getRoot().listNodes()) if(removedPlantPrefixes.some(prefix=>node.getName().startsWith(prefix))) removed.add(node.getName());
removed.add('DEN_WardrobeSidePlantLedge');
removed.add('DECOR_NeutralArt_0');
for (const node of doc.getRoot().listNodes()) {
 if (removed.has(node.getName())) node.dispose();
 if (['PH3_Lounge_FloorSeat','PH3_Lounge_SeatCushion'].includes(node.getName())) {
  const p=node.getTranslation(),scale=node.getScale();
  node.setTranslation([p[0],.01+(p[1]-.01)*.45,p[2]]).setScale([scale[0],scale[1]*.45,scale[2]]);
 }
 // Rounded wall bottoms previously only touched the floor's rounded top edge.
 // Extend the lower bevel into the slab, keeping the wall tops and decor fixed.
 if (['PH1_Wall_Left','PH1_Wall_Back'].includes(node.getName())) {
  for (const primitive of node.getMesh().listPrimitives()) {
   const positions=primitive.getAttribute('POSITION');
   const bottom=positions.getMin([])[1], point=[];
   for(let i=0;i<positions.getCount();i++) {
    positions.getElement(i,point);
    if(point[1]<bottom+.25){point[1]-=.18;positions.setElement(i,point);}
   }
  }
 }
 if (['PH3_TV_Screen','PH3_TV_Body'].includes(node.getName())) {
  const black=doc.createMaterial('TV_WarmGray').setBaseColorFactor([.12,.11,.10,1]).setRoughnessFactor(.85).setMetallicFactor(0);
  for(const primitive of node.getMesh().listPrimitives()) primitive.setMaterial(black);
 }
}

finishProps(doc);
if(doc.getRoot().listNodes().some(n=>removedPlantPrefixes.some(prefix=>n.getName().startsWith(prefix))||n.getName()==='DEN_WardrobeSidePlantLedge')) throw new Error('Removed plant component survived');

// Blender scene bookkeeping is authoring metadata, not runtime content.
for (const scene of doc.getRoot().listScenes()) scene.setExtras({});
const bounds = Object.fromEntries(doc.getRoot().listNodes().filter(n => /^PH1_|^PH3_/.test(n.getName())).map(n => [n.getName(), getBounds(n)]));
await fs.writeFile('room-bounds.json', JSON.stringify(bounds, null, 2));
await doc.transform(dedup(), weld());
for (const tex of doc.getRoot().listTextures()) {
  const result = spawnSync(process.env.JAKAE_PYTHON || 'C:/Users/bitku/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe', ['-c', 'from PIL import Image; import sys,io; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.thumbnail((1024,1024)); im.save(sys.stdout.buffer,format="WEBP",quality=88)'], {input:tex.getImage(),maxBuffer:20*1024*1024});
  if(result.status!==0) throw new Error(result.stderr.toString());
  tex.setImage(result.stdout).setMimeType('image/webp');
}
doc.createExtension(EXTTextureWebP).setRequired(true);
await MeshoptEncoder.ready;
await doc.transform(join(), prune(), unpartition(), meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write('public/models/room-web.glb', doc);
console.log('Runtime room:', (await fs.stat('public/models/room-web.glb')).size, 'bytes;', doc.getRoot().listMeshes().length, 'meshes');




