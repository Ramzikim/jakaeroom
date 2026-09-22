import assert from 'node:assert/strict';
import {GIFT_REGISTRY,selectShoppingGift,shoppingUnlocked,GIFT_COPY,SHOPPING_REACTIONS} from '../lib/gifts.ts';
import {createLife,commandLife,tickLife,tvReactionTime,type Sequence} from '../app/behavior.ts';
const base=GIFT_REGISTRY.filter(g=>g.acquisitionType==='cabinet_order').map(g=>g.id);
assert.equal(shoppingUnlocked([]),false);assert.equal(shoppingUnlocked(base.slice(0,1)),false);assert.equal(shoppingUnlocked(base),true);
for(const band of ['day','afternoon','night','dawn'] as const){
 let rolls=0;assert.equal(selectShoppingGift([],band,()=>{rolls++;return 0;}),null);assert.equal(rolls,0);
 const gift=selectShoppingGift(base,band,()=>.299999)!;assert.equal(gift.band,band);
 assert.equal(selectShoppingGift(base,band,()=>.30),null);
 assert.equal(selectShoppingGift([...base,gift.id],band,()=>{throw Error('owned gift must not roll');}),null);
 assert.ok(GIFT_COPY[gift.id].script!.endsWith('지금 바로 주문하세요!'));
 assert.equal(Array.from({length:100},(_,i)=>selectShoppingGift(base,band,()=>i/100)).filter(Boolean).length,30);
}
assert.equal(new Set(SHOPPING_REACTIONS).size,8);
const lengths={} as Record<Sequence,number>;
function duration(extra:number){const s=createLife();commandLife(s,'tv',()=>0);s.mediaExtra=extra;s.mediaGiftId=extra?'test':null;const expected=Math.max(10,tvReactionTime(s.mediaNews)+7)+extra;while(s.media&&s.now<30)tickLife(s,.01,'day',lengths,()=>0);assert.ok(Math.abs(s.now-expected)<.03);return s.now;}
assert.ok(Math.abs(duration(2)-duration(0)-2)<.03);
console.log('PASS: unlock gate, exactly 30% boundary, four bands, owned exclusion, reaction pool, +2s timing');
