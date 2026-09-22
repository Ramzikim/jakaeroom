import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {GIFT_REGISTRY,getGiftById,getPurchasableGiftIds,getHomeshoppingGiftForBand,REGULAR_LETTER_IDS,hasAllRegularLetters} from '../lib/gifts.ts';
assert.equal(GIFT_REGISTRY.length,7);
assert.equal(new Set(GIFT_REGISTRY.map(g=>g.id)).size,7);
assert.deepEqual(GIFT_REGISTRY.map(g=>g.price),[100,180,300,420,600,800,null]);
assert.equal(getGiftById('unknown'),undefined);
assert.equal(getPurchasableGiftIds().length,6);
for(const [band,id] of Object.entries({day:'somi_goods',afternoon:'lightning_knight_figure',night:'starlight_sleep_lamp',dawn:'strawberry_tower'})){
 assert.equal(getHomeshoppingGiftForBand(band as 'day')?.id,id);
 assert.equal(GIFT_REGISTRY.filter(g=>g.band===band).length,1);
}
GIFT_REGISTRY.forEach((g,index)=>{
 assert.equal(g.imagePath,`/gifts/gift_0${index+1}.png`);
 assert.ok(existsSync(new URL(`../public${g.imagePath}`,import.meta.url)));
});
assert.equal(REGULAR_LETTER_IDS.length,28);
assert.equal(hasAllRegularLetters(REGULAR_LETTER_IDS),true);
assert.equal(hasAllRegularLetters([...REGULAR_LETTER_IDS.slice(1),'special_01','special_02','special_03','special_04']),false);
assert.equal(hasAllRegularLetters(Array(28).fill(REGULAR_LETTER_IDS[0])),false);
assert.equal(getGiftById('starlight_mailbox')?.isPurchasable,false);
console.log('Gift registry, prices, bands and exact regular-letter completion passed');
