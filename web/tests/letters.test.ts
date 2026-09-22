import assert from 'node:assert/strict';
import {advanceLetters,emptyLetterState,normalizeLetterIds,letterClock} from '../lib/letter-rules.ts';
import {letters,allLetters,vipLetters} from '../app/letters.ts';
import {hasAllRegularLetters} from '../lib/gifts.ts';
const ids=letters.map(l=>l.id),base=Date.parse('2026-09-21T01:00:00Z');
let state=emptyLetterState(),owned:string[]=[];
for(let i=0;i<28;i++){
 const now=base+Math.floor(i/8)*86400_000+[0,6*3600_000,9*3600_000,14*3600_000][Math.floor(i%8/2)];
 const result=advanceLetters(state,owned,'regular',now);assert.equal(result.letterId,ids[i]);state=result.state;owned=result.owned;
 const reread=advanceLetters(state,owned,'reread',now,'normal',ids[i]);assert.deepEqual(reread.grants,[]);assert.deepEqual(reread.state.counts,state.counts);
 if(i%2){const capped=advanceLetters(state,owned,'regular',now);if(i<27)assert.equal(capped.reason,'quota');assert.deepEqual(capped.grants,[]);}
}
assert(hasAllRegularLetters(owned));assert(!owned.includes('special_04'));
assert.deepEqual(advanceLetters(state,owned,'regular',base+5*86400_000).grants,[]);
assert.equal(letterClock(Date.parse('2026-09-21T14:59:59Z')).date,'2026-09-21');assert.equal(letterClock(Date.parse('2026-09-21T15:00:00Z')).date,'2026-09-22');
assert.deepEqual(normalizeLetterIds(['dawn_01','day_01','afternoon_01','night_07','letter_01']),['letter_01','letter_08','letter_15','letter_28']);
state=emptyLetterState();
for(let i=0;i<12;i++)state=advanceLetters(state,[],'drawer',base+i*100).state;
assert.equal(state.drawer,undefined);
state=advanceLetters(state,ids.slice(0,21),'drawer',base).state;
state=advanceLetters(state,ids.slice(0,21),'drawer',base+2001).state;assert.equal(state.drawer?.count,1);
state=advanceLetters(state,ids.slice(0,21),'interrupt',base+2100).state;assert.equal(state.drawer,undefined);
for(let i=0;i<9;i++){const r=advanceLetters(state,ids.slice(0,21),'drawer',base+3000+i*100);assert.deepEqual(r.grants,[]);state=r.state;}
let result=advanceLetters(state,ids.slice(0,21),'drawer',base+4000);assert.deepEqual(result.grants,['special_01']);assert.deepEqual(advanceLetters(result.state,result.owned,'drawer',base+4100).grants,[]);
state=emptyLetterState();owned=[];
for(let w=0;w<3;w++)for(let p=0;p<5;p++){result=advanceLetters(state,owned,'pet',base+w*300_000+p*30_000);state=result.state;owned=result.owned;assert(!owned.includes('special_02'));}
result=advanceLetters(state,owned,'awake',base+899999);assert.deepEqual(result.grants,[]);
result=advanceLetters(state,owned,'awake',base+900000);assert.deepEqual(result.grants,['special_02']);assert.deepEqual(advanceLetters(result.state,result.owned,'awake',base+901000).grants,[]);
state=advanceLetters(emptyLetterState(),[],'pet',base).state;result=advanceLetters(state,[],'pet',base+300000);assert.equal(result.state.pet?.start,base+300000);
const dawn=Date.parse('2026-09-21T19:00:00Z');state=emptyLetterState();
for(let t=0;t<300000;t+=15000){result=advanceLetters(state,[],'sleep',dawn+t);assert.deepEqual(result.grants,[]);state=result.state;}
result=advanceLetters(state,[],'sleep',dawn+300000);assert.deepEqual(result.grants,['special_03']);
assert.deepEqual(advanceLetters(state,[],'sleep_end',dawn+300000).grants,['special_03']);
assert.deepEqual(advanceLetters(state,[],'sleep_end',dawn+299999).grants,[]);
assert.equal(advanceLetters(state,[],'awake',dawn+300000).state.sleep,undefined);
assert.equal(advanceLetters(state,[],'interrupt',dawn+300000).state.sleep,undefined);
assert.equal(advanceLetters(state,[],'sleep',dawn+400000).state.sleep?.start,dawn+400000);
assert.equal(advanceLetters(emptyLetterState(),[],'sleep',base).state.sleep,undefined);
for(const missing of [...ids,'special_01','special_02','special_03']){result=advanceLetters(emptyLetterState(),[...ids,'special_01','special_02','special_03'].filter(id=>id!==missing),'load',base);assert(!result.grants.includes('special_04'));}
result=advanceLetters(emptyLetterState(),[...ids,'special_01','special_02','special_03'],'load',base);assert.deepEqual(result.grants,['special_04']);assert.equal(result.owned.length,32);assert.deepEqual(advanceLetters(result.state,result.owned,'load',base).grants,[]);
for(const tier of ['vip_owner','vip_dad','vip_jangmi'] as const){result=advanceLetters(emptyLetterState(),ids.slice(0,27),'regular',base,tier);assert.deepEqual(result.state.vipIds,[tier]);assert.equal(result.owned.length,28);assert(!result.owned.includes(tier));assert.deepEqual(advanceLetters(JSON.parse(JSON.stringify(result.state)),result.owned,'load',base,tier).state.vipIds,[tier]);assert.deepEqual(advanceLetters(emptyLetterState(),ids.slice(0,27),'load',base,tier).state.vipIds,[]);}
assert.deepEqual(advanceLetters(emptyLetterState(),ids,'load',base).state.vipIds,[]);
assert.equal(allLetters.length,32);assert.equal(vipLetters.length,3);assert(!hasAllRegularLetters(vipLetters.map(l=>l.id)));
// Queue/network latency must not change the gaps between physical drawer clicks.
state=emptyLetterState();owned=['letter_21'];
for(let i=0;i<10;i++){result=advanceLetters(state,owned,'drawer',base+50_000+i*5_000,'normal',undefined,undefined,base+i*500);state=result.state;owned=result.owned;}
assert(owned.includes('special_01'));
state=advanceLetters(emptyLetterState(),['letter_21'],'drawer',base+10_000,'normal',undefined,undefined,base).state;
assert.equal(advanceLetters(state,['letter_21'],'drawer',base+20_000,'normal',undefined,undefined,base+2001).state.drawer?.count,1);
assert.equal(advanceLetters(state,['letter_21'],'drawer',base+20_000,'normal',undefined,undefined,base-1).state.drawer?.count,1);
console.log('PASS: sequence, four KST band quotas, reread, migration, drawer (including queued clicks), 15-minute pet streak, uninterrupted dawn sleep, 31→32, mailbox and isolated VIP unlocks');
