import assert from 'node:assert/strict';
import {createLife,commandLife} from '../app/behavior.ts';
import {actionRewardStarted,REWARD_ACTIONS} from '../lib/reward-actions.ts';
const run=(s:ReturnType<typeof createLife>,action:Parameters<typeof commandLife>[1])=>{const before={sequence:s.sequence,started:s.started};const accepted=commandLife(s,action,()=>.5);return actionRewardStarted(action,accepted,before,s);};
for(const action of REWARD_ACTIONS){const s=createLife();s.now=1;assert(run(s,action),action);assert(!run(s,action),`repeat ${action}`);}
const pet=createLife();pet.now=1;pet.pets=[0,.1,.2,.3];assert(!run(pet,'pet'),'pet refusal');
const game=createLife();game.now=1;game.gameDate=new Date(Date.now()+9*3600000).toISOString().slice(0,10);game.gamePlayCount.day=3;assert(!run(game,'game'),'game refusal');
const bath=createLife();bath.now=1;run(bath,'bath');assert(!run(bath,'berry'),'blocked action');
assert(!run(createLife(),'move'),'invalid movement');
assert(!actionRewardStarted('pet',false,{sequence:'idle',started:0},{sequence:'hop',started:1,media:null}));
console.log('All reward actions, repeats, refusals, blocked/cancelled actions passed');
