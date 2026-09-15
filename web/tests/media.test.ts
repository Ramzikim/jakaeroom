import assert from 'node:assert/strict';
import {createLife,commandLife,tickLife,tvReactionTime,type Sequence} from '../app/behavior.ts';
import {TV_CONTENT,GAME_DIALOGUE,GAME_LIMIT_DIALOGUE} from '../app/media-dialogue.ts';
import fs from 'node:fs';
const frames=JSON.parse(fs.readFileSync('app/sprite-frames.json','utf8'));
const lengths=Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,(v as unknown[]).length])) as Record<Sequence,number>;
const advance=(s:ReturnType<typeof createLife>,seconds:number)=>{for(let t=0;t<seconds;t+=.05)tickLife(s,.05,'day',lengths,()=>.5);};
for(const band of ['day','afternoon','night','dawn'] as const){
 const s=createLife();assert(commandLife(s,'tv',()=>.5,undefined,band));assert.equal(s.node,'cushion');assert.equal(s.sequence,'sit_idle');assert(TV_CONTENT[band].some(v=>v.script===s.mediaNews));assert.equal(s.speech,'');
 advance(s,tvReactionTime(s.mediaNews)-.1);assert.equal(s.speech,'');advance(s,.2);assert(TV_CONTENT[band].some(v=>v.script===s.mediaNews&&v.reaction===s.speech));assert(!commandLife(s,'tv'));advance(s,7.1);assert.equal(s.media,null);assert(s.sequence.includes('walk'));
}
const s=createLife();
for(let i=0;i<3;i++){assert(commandLife(s,'game',()=>.5));assert.equal(s.sequence,'game');assert.equal(s.node,'chair');assert.equal(s.gamePlayCount.day,i+1);assert(!commandLife(s,'game'));advance(s,8.1);assert.equal(s.media,null);assert.equal(s.node,'desk');assert.equal(s.point[1],0);}
const screen=s.monitor;commandLife(s,'game',()=>.5);assert.equal(s.sequence,'idle');assert(GAME_LIMIT_DIALOGUE.includes(s.speech));assert.equal(s.monitor,screen);assert.equal(s.gamePlayCount.day,3);
commandLife(s,'game',()=>.5,undefined,'night');assert.equal(s.media,'game');assert.equal(s.gamePlayCount.night,1);
commandLife(s,'tv',()=>.5);assert.equal(s.media,'tv');commandLife(s,'bath',()=>.5);assert.equal(s.media,null);assert.equal(s.sequence,'bath');
console.log('TV bands, script completion + 0.5s reaction, full reaction duration, game 8s exit, 3-per-band limit, duplicate clicks and interruptions passed.');
for(const band of ['day','afternoon','night','dawn'] as const)for(let i=0;i<TV_CONTENT[band].length;i++){
 const state=createLife();commandLife(state,'tv',()=>i/TV_CONTENT[band].length,undefined,band);
 assert.equal(state.mediaTitle,TV_CONTENT[band][i].title);assert.equal(state.mediaNews,TV_CONTENT[band][i].script);advance(state,tvReactionTime(state.mediaNews)+.1);assert.equal(state.speech,TV_CONTENT[band][i].reaction);
}
for(let i=0;i<3;i++)for(const lineIndex of [0,1]){
 const state=createLife();let calls=0;commandLife(state,'game',()=>calls++===0?i/3:lineIndex/2);
 const key=`monitor_0${i+1}` as keyof typeof GAME_DIALOGUE;
 assert.equal(state.monitor,i);assert.equal(state.speech,GAME_DIALOGUE[key][lineIndex]);
}
console.log('All 29 program/reaction pairs and all 3 monitor dialogue mappings passed.');
const longTv=createLife();commandLife(longTv,'tv',()=>.5);longTv.mediaNews='가'.repeat(500);
tickLife(longTv,20,'day',lengths);assert.equal(longTv.speech,'');assert.equal(longTv.media,'tv');
tickLife(longTv,.49,'day',lengths);assert.equal(longTv.speech,'');
tickLife(longTv,.02,'day',lengths);assert.equal(longTv.speech,longTv.mediaReaction);
tickLife(longTv,6.9,'day',lengths);assert.equal(longTv.media,'tv');
tickLife(longTv,.11,'day',lengths);assert.equal(longTv.media,null);
console.log('Long script completes before 0.5s delay; reaction remains visible for 7s.');
