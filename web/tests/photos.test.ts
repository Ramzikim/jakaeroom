import assert from 'node:assert/strict';
import {photoPropMessage,PROP_MESSAGES,PHOTO_REGISTRY,PHOTO_RULES,STANDARD_PHOTOS,visiblePhotos,standardPhotoCount,availablePhotoCatalog,photoCategoriesFor,photoActionForSequence} from '../lib/photos.ts';
import {existsSync} from 'node:fs';
import {createLife,commandLife} from '../app/behavior.ts';
assert.equal(new Set(PHOTO_REGISTRY.map(p=>p.id)).size,PHOTO_REGISTRY.length);
assert.equal(availablePhotoCatalog().length,43);
assert.deepEqual(PHOTO_RULES.caps,{hug:1,food:1,outfit:2,window:2,happy:6});
assert.equal(PHOTO_RULES.chance.hug,.35);
assert.equal(STANDARD_PHOTOS.length,38);
assert.deepEqual(Object.fromEntries(['food','happy','outfit','window','hug'].map(c=>[c,PHOTO_REGISTRY.filter(p=>p.category===c).length])),{food:4,happy:21,outfit:7,window:6,hug:5});
for(const p of PHOTO_REGISTRY)assert(existsSync(new URL(`../public${p.assetPath}`,import.meta.url)));
assert.equal(visiblePhotos(['hug_01'],false).length,38);
assert.equal(visiblePhotos([],true).length,38);
assert.deepEqual(visiblePhotos(['hug_03','hug_01','hug_03'],true).slice(38).map(p=>p.id),['hug_03','hug_01']);
assert.equal(standardPhotoCount(['food_01','food_01','hug_01']),1);
assert.equal(PHOTO_RULES.globalDailyCap,10);
assert.deepEqual(photoCategoriesFor('wardrobe'),['outfit']);
assert.deepEqual(photoCategoriesFor('sleep'),[]);
for(const sequence of ['sit_snooze','sit_sleeploop'])assert.equal(photoActionForSequence(sequence,'idle',null),null);
assert.equal(photoActionForSequence('hop','sit_sleeploop',null),null);
assert.equal(photoActionForSequence('walk_right','idle','sleep'),null);
assert.equal(photoActionForSequence('walk_right','walk_left',null),null);
for(const [action,expected] of [['berry','food'],['window','window'],['cushion','cushion'],['tv','cushion'],['game','game'],['pet','pet']] as const){
 const life=createLife();commandLife(life,action,()=>.5,undefined,'day');
 assert.equal(photoActionForSequence(life.sequence,'idle',life.pending),expected,action);
}
const refused=createLife();refused.now=20;refused.pets=[1,2,3,4,5];commandLife(refused,'pet',()=>.5);
assert.equal(photoActionForSequence(refused.sequence,'idle',refused.pending),null);
const gameRefused=createLife();gameRefused.gameDate=new Date(Date.now()+9*3600000).toISOString().slice(0,10);gameRefused.gamePlayCount.day=3;
commandLife(gameRefused,'game',()=>.5,undefined,'day');
assert.equal(photoActionForSequence(gameRefused.sequence,'idle',gameRefused.pending),null,'refused game cannot drop');
console.log('Photo registry, interaction transitions, sleep exclusions and refused pet checks passed');

assert.equal(PHOTO_RULES.chance.outfit,1);assert.equal(PHOTO_RULES.chance.happy,.35);assert.deepEqual(photoCategoriesFor('drawer'),['happy']);


assert.equal(photoPropMessage('wardrobe',PHOTO_REGISTRY.map(p=>p.id)),'작애 옷 입은 사진 어땠어? 새로운 사진도 기대해줘!');
assert(PROP_MESSAGES.wardrobe.includes(photoPropMessage('wardrobe',[]) as typeof PROP_MESSAGES.wardrobe[number]));
assert(PROP_MESSAGES.drawer.includes(photoPropMessage('drawer',[]) as typeof PROP_MESSAGES.drawer[number]));
