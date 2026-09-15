import assert from 'node:assert/strict';
import {nextTrack} from '../app/playback-mode.ts';
for(let i=0;i<10;i++){
 assert.equal(nextTrack('single',i,10),i);
 assert.equal(nextTrack('all',i,10),(i+1)%10);
 const choices=new Set(Array.from({length:9},(_,n)=>nextTrack('shuffle',i,10,()=>n/9)));
 assert.equal(choices.size,9);assert.ok(!choices.has(i));
}
assert.equal(nextTrack('shuffle',0,1),0);
console.log('PASS single repeat, sequential wrap, shuffle all alternatives without repeat, one-track fallback');
