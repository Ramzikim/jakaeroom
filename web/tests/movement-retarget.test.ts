import assert from 'node:assert/strict';
import {createLife,commandLife,tickLife,type Sequence} from '../app/behavior.ts';
const lengths={} as Record<Sequence,number>;
for(const action of ['cushion','tv'] as const){
 const s=createLife();
 assert(commandLife(s,action,()=>.5));
 assert(commandLife(s,'move',()=>.5,[1.65,-.55]));
 for(let i=0;i<8;i++)tickLife(s,.1,'day',lengths,()=>.5);
 const point=[...s.point],started=s.started,path=s.path;
 assert.equal(commandLife(s,'move',()=>.5,[1.65,-.55]),false);
 assert.deepEqual(s.point,point);assert.equal(s.path,path);assert.equal(s.started,started);
 assert(commandLife(s,'move',()=>.5,[1.7,-.5]));
 assert.deepEqual(s.point,point,'retarget must not teleport back to cushion');
 assert.equal(s.started,started,'same walking direction keeps animation clock');
 tickLife(s,.1,'day',lengths,()=>.5);
 assert(Math.hypot(s.point[0]-point[0],s.point[2]-point[2])<=.055001,'one frame moves only one step');
 for(let i=0;i<200;i++){
  if(s.sequence==='idle')break;
  tickLife(s,.1,'day',lengths,()=>.5);
 }
 assert(Math.hypot(s.point[0]-1.7,s.point[2]+.5)<.001,'reaches new destination');
}
console.log('PASS: TV/cushion exit, repeated destination, continuous retarget and arrival');
