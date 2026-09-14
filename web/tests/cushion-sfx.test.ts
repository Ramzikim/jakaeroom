import assert from 'node:assert/strict';
import {createLife,commandLife,tickLife,positions,sitLines,type Sequence} from '../app/behavior.ts';
import {bathStartLines} from '../app/dialogue.ts';
import {frameSfx} from '../app/sfx.ts';
const lengths=Object.fromEntries(['idle','walk_left','walk_right','backwalk_left','backwalk_right','hop','shy','sit_idle','sit_snooze','sit_sleeploop','bath','strawberry'].map(n=>[n,8])) as Record<Sequence,number>;
const s=createLife();s.sequence='walk_right';s.point=[1.8,0,-.55];s.path=[[2.65,.55],[2.75,2.6]];s.destination='snack';
assert(commandLife(s,'cushion',()=>.5));assert.equal(s.sequence,'sit_idle');assert.equal(s.path.length,0);assert(!commandLife(s,'cushion'));assert(!commandLife(s,'berry'));assert.equal(s.destination,'cushion');
for(let i=0;i<3000&&(s.sequence as Sequence)!=='sit_idle';i++)tickLife(s,.05,'day',lengths,()=>.5);
assert.equal(s.sequence,'sit_idle');assert.deepEqual(s.point,positions.rug);assert.ok(sitLines.includes(s.speech));const line=s.speech;assert(!commandLife(s,'cushion'));assert.equal(s.wait,11);
for(let i=0;i<160;i++)tickLife(s,.05,'day',lengths,()=>.5);assert.equal(s.speech,line);
for(let i=0;i<100;i++)tickLife(s,.05,'day',lengths,()=>.5);assert.equal(s.cushionRequested,false);assert.notEqual(s.sequence,'sit_idle');assert.notEqual(s.node,'bed');
for(let i=0;i<5;i++){const b=createLife();assert(commandLife(b,'bath',()=>(i+.1)/5));assert.equal(b.speech,bathStartLines[i]);assert(!commandLife(b,'bath'));tickLife(b,1,'day',lengths);assert.equal(b.speech,bathStartLines[i]);}
let splashes=0;for(let i=0;i<48;i++)if(frameSfx('bath',i%10,Math.floor(i/10)))splashes++;assert.equal(splashes,3);
assert.equal(frameSfx('hop',3,0),'pop');assert.equal(frameSfx('hop',6,0),'land');assert.equal(frameSfx('sit_idle',0,0),'sit');assert.equal(frameSfx('sit_idle',0,1),null);assert.equal(frameSfx('strawberry',3,0),'eat');
for(const seq of ['walk_left','walk_right','backwalk_left','backwalk_right'])assert.equal(Array.from({length:seq.startsWith('back')?4:5},(_,i)=>frameSfx(seq,i,0)).filter(Boolean).length,2);
console.log('Cushion retarget, repeat/action locks, seat position, one dialogue, timed exit, bath pool and bounded SFX events passed.');


