import assert from 'node:assert/strict';
import {pettingLines,vipPettingLines,vipSpecificPettingLines,pettingPool} from '../app/dialogue.ts';
import {createLife,commandLife,RULES,refusalLines} from '../app/behavior.ts';
assert.equal(pettingLines.length,21);assert.equal(vipPettingLines.length,13);assert.equal(refusalLines.length,12);
for(const tier of ['normal','vip_owner','vip_dad','vip_jangmi'] as const){
 const pool=pettingPool(tier);assert.equal(pool.length,tier==='normal'?21:35);
 assert.deepEqual(pool.slice(0,21),pettingLines);
 if(tier!=='normal'){assert.deepEqual(pool.slice(21,34),vipPettingLines);assert.equal(pool[34],vipSpecificPettingLines[tier]);}
 for(let i=0;i<pool.length;i++){
  const s=createLife();s.relationshipTier=tier;const rng=[.1,(i+.1)/pool.length];
  assert(commandLife(s,'pet',()=>rng.shift()!));assert.equal(s.speech,pool[i]);assert.equal(s.sequence,'hop');assert.equal(s.pets.length,1);
 }
 for(let i=0;i<refusalLines.length;i++){
  const s=createLife();s.relationshipTier=tier;s.pets=Array(RULES.petThreshold-1).fill(0);
  assert(commandLife(s,'pet',()=>(i+.1)/refusalLines.length));assert.equal(s.speech,refusalLines[i]);assert.equal(s.sequence,'idle');assert.equal(s.pets.length,RULES.petThreshold-1);
  s.now=RULES.petWindow+1;assert(commandLife(s,'pet',()=>0));assert.equal(s.speech,pettingLines[0]);assert.equal(s.pets.length,1);
 }
}
for(const removed of ['나중에 쓰다듬어어!','털 다 망가지겠어!','작애 털 눌리잖아아.','잠깐만 쉬었다가아!','그만그마안!','작애 좋아하는 거 알겠어~','나 찌그러져어.'])assert(!refusalLines.includes(removed));
console.log('PASS: all 21 normal / 35 per-VIP selections, all 12 refusals, unchanged threshold/window/animation');
