import assert from 'node:assert/strict';
import {createLife,commandLife,positions} from '../app/behavior.ts';
for(const sequence of ['idle','walk_left','sit_idle','window'] as const){
 const s=createLife();s.sequence=sequence;s.path=[[2,1]];s.cushionRequested=sequence==='sit_idle';
 assert(commandLife(s,'bed',()=>.5));assert.deepEqual(s.point,positions.bed);
 assert.equal(s.sequence,'sit_snooze');assert.equal(s.path.length,0);assert.equal(s.pending,null);
 assert.equal(commandLife(s,'bed'),false);
}
console.log('Immediate bed placement and repeated-command protection passed');
