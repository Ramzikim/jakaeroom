import assert from 'node:assert/strict';
import {animationFps,createLife,commandLife,tickLife,positions,readCounts,kstDate,walkSequence} from '../app/behavior.ts';
import type {Sequence,Band} from '../app/behavior.ts';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('app/sprite-frames.json','utf8'));
const lengths=Object.fromEntries(Object.entries(manifest).map(([k,v])=>[k,(v as unknown[]).length])) as Record<Sequence,number>;
const advance=(s:ReturnType<typeof createLife>,seconds:number,band:Band='day',r=()=>.8)=>{for(let t=0;t<seconds;t+=.05)tickLife(s,.05,band,lengths,r);};
for(const n of [.1,.9]){const s=createLife();commandLife(s,'pet',()=>n);assert.equal(s.sequence,n<.5?'hop':'shy');assert(!commandLife(s,'berry'));advance(s,2);assert.equal(s.sequence,'idle');}
const spam=createLife();for(let i=0;i<3;i++){commandLife(spam,'pet',()=>.1);advance(spam,1.1);}commandLife(spam,'pet',()=>.1);assert.equal(spam.sequence,'idle');assert.match(spam.speech,/쓰다듬|털|쉬었다/);
const sleep=createLife();sleep.node='bed';sleep.point=[...positions.bedRight];commandLife(sleep,'bed');assert.equal(sleep.sequence,'sit_snooze');advance(sleep,1);assert.equal(sleep.sequence,'sit_sleeploop');advance(sleep,298);assert.equal(sleep.sequence,'sit_sleeploop');advance(sleep,2);assert.equal(sleep.sequence,'idle');assert.deepEqual(sleep.point,positions.bedRight);
const wake=createLife();wake.node='bed';commandLife(wake,'bed');advance(wake,1);commandLife(wake,'pet',()=>.9);assert.equal(wake.sequence,'shy');assert.deepEqual(wake.point,positions.bedRight);
for(const [action,duration,sequence] of [['bath',6,'bath'],['berry',5,'strawberry']] as const){const s=createLife();commandLife(s,action);assert(!commandLife(s,'pet'));advance(s,duration-.15);assert.equal(s.sequence,sequence);advance(s,.2);if(action==='bath'){assert(s.sequence.includes('walk'));assert(s.wetUntil>s.now);assert.match(s.speech,/젖은 솜|몸이 무겁|어서 말랐/);}else assert.equal(s.sequence,'idle');}
for(const r of [.1,.9]){const s=createLife();s.node=r<.5?'bed':'cushion';s.point=[...positions[r<.5?'bedRight':'rug']];s.wait=0;let calls=0;tickLife(s,.1,'night',lengths,()=>calls++===0?.2:r);assert.equal(s.sequence,'sit_idle');assert.deepEqual(s.point,positions[r<.5?'bed':'rug']);}
const dawn=createLife();let slept=0;for(let t=0;t<1800;t+=.1){tickLife(dawn,.1,'dawn',lengths,()=>.5);if(dawn.sequence==='sit_sleeploop')slept+=.1;}assert(slept/1800>.7&&slept/1800<.85,String(slept/1800));
assert.equal(kstDate(new Date('2026-09-12T15:00:00Z')),'2026-09-13');const count=readCounts(null,'2026-09-12');count.night=2;assert.equal(readCounts(JSON.stringify(count),'2026-09-12').night,2);assert.equal(readCounts(JSON.stringify(count),'2026-09-13').night,0);
assert.equal(walkSequence(1,0),'walk_right');assert.equal(walkSequence(-1,0),'backwalk_left');assert.equal(walkSequence(0,1),'walk_left');assert.equal(walkSequence(0,-1),'backwalk_right');
console.log('Locks, one-shots/refusal, sleep/wake/timeout, bath/berry durations, both seats, dawn occupancy, KST persistence, directions passed.');

const wet=createLife();commandLife(wet,'bath');advance(wet,6.01);const wetLine=wet.speech;assert.equal(animationFps(wet),5.2);const start=[...wet.point];advance(wet,1);assert(Math.hypot(wet.point[0]-start[0],wet.point[2]-start[2])<.4);advance(wet,4.1);assert.equal(animationFps(wet),8);assert.equal(wet.speech,wetLine);wet.sequence='sit_idle';assert.equal(animationFps(wet),6);wet.sequence='sit_sleeploop';assert.equal(animationFps(wet),6);

