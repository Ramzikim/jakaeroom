import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {collectionLetters,lockedLetterAsset,storyLetterCount} from '../app/collection-letters.ts';
import {advanceLetters,emptyLetterState} from '../lib/letter-rules.ts';
assert.equal(collectionLetters.length,32);
const ranges=['01-04','05-08','09-12','13-16','17-20','21-24','25-28'];
collectionLetters.forEach(({letter,number,asset},i)=>{
 assert.equal(number,i+1);assert.equal(letter.id,i<28?`letter_${String(i+1).padStart(2,'0')}`:`special_0${i-27}`);
 assert.equal(asset,`/library/letter/${i<28?ranges[Math.floor(i/4)]:i+1}.png`);
 assert(existsSync(new URL(`../public${asset}`,import.meta.url)));
});
assert(existsSync(new URL(`../public${lockedLetterAsset}`,import.meta.url)));
assert.equal(storyLetterCount(['letter_01','letter_01','special_03','vip_owner','vip_dad','vip_jangmi']),2);
assert.equal(storyLetterCount(collectionLetters.map(({letter})=>letter.id)),32);
for(const {letter} of collectionLetters){const state=emptyLetterState();state.counts={day:2};const reread=advanceLetters(state,[letter.id],'reread',Date.parse('2026-09-21T01:00:00Z'),'normal',letter.id);assert.equal(reread.letterId,letter.id);assert.deepEqual(reread.grants,[]);}
console.log('PASS: 32 ordered slots, all envelope paths/ranges, special mappings, VIP-excluded counts, no new grant on reread');
