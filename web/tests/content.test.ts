import assert from 'node:assert/strict';
import {withJosa,renderTemplate,type Particle} from '../app/josa.ts';
import {makeProfile,interpolateDialogue} from '../app/profile.ts';
import {letters,specialLetters,allLetters,selectLetter} from '../app/letters.ts';
import {vipIdleLines,pettingPool,postBathLines} from '../app/dialogue.ts';
import {waitingLines} from '../app/life.ts';
import {createLife,commandLife,tickLife,sitLines,dawnLines,dreamLines,refusalLines,type Sequence} from '../app/behavior.ts';
for(const noun of ['누냐','형아','이모','삼촌','쭈인이','엄마아','아빠아','장미이모','유진 삼촌','유진 누냐']){
 const endings=noun.endsWith('삼촌')?['이','은','이랑','을','과']:['가','는','랑','를','와'];
 (['subject','topic','with','object','and'] as Particle[]).forEach((kind,i)=>{assert.equal(withJosa(noun,kind),noun+endings[i]);assert.equal(renderTemplate(`{value|${kind}}`,{value:noun}),noun+endings[i]);});
}
assert.equal(letters.length,28);assert.equal(specialLetters.length,4);assert.equal(new Set(allLetters.map(l=>l.id)).size,32);
for(let i=0;i<28;i++){assert.equal(letters[i].id,`letter_${String(i+1).padStart(2,'0')}`);assert.equal(selectLetter(letters.slice(0,i).map(l=>l.id))?.id,letters[i].id);assert.equal(letters[i].timeBand,'any');}
assert.equal(selectLetter(letters.map(l=>l.id)),null);
assert.deepEqual(specialLetters.map(l=>l.unlockKey),['drawer_streak','petting_streak','quiet_dawn_companion','complete_memories']);
assert.deepEqual([sitLines.length,dawnLines.length,dreamLines.length,refusalLines.length,postBathLines.length],[8,7,10,12,5]);
const lengths=Object.fromEntries(['idle','walk_left','walk_right','backwalk_left','backwalk_right','hop','shy','sit_idle','sit_snooze','sit_sleeploop','bath','strawberry'].map(k=>[k,8])) as Record<Sequence,number>;
const profiles=[makeProfile({nickname:'유진',gender:'female',birthYear:2000},'guest'),makeProfile({nickname:'쭈인',gender:'female',birthYear:1991},'guest'),makeProfile({nickname:'아빠',gender:'male',birthYear:1995},'guest'),makeProfile({nickname:'장미',gender:'female',birthYear:1990},'guest')];
for(const profile of profiles){const vip=profile.relationshipTier!=='normal',idle=vip?vipIdleLines:waitingLines,pet=pettingPool(profile.relationshipTier);
 for(let i=0;i<idle.length;i++){const s=createLife();s.relationshipTier=profile.relationshipTier;s.sequence='walk_left';const r=[0,.1,(i+.1)/idle.length];tickLife(s,.1,'day',lengths,()=>r.shift()!);assert.equal(s.speech,idle[i]);}
 for(let i=0;i<pet.length;i++){const s=createLife();s.relationshipTier=profile.relationshipTier;const r=[.1,(i+.1)/pet.length];assert.ok(commandLife(s,'pet',()=>r.shift()!));assert.equal(s.speech,pet[i]);}
 for(const line of [...idle,...pet,...allLetters.map(l=>l.body),...sitLines,...dawnLines,...dreamLines,...refusalLines,...postBathLines])assert.doesNotMatch(interpolateDialogue(line,profile),/[{}]|\(이\)가|\(은\)는|쭈인이모/);
 if(vip)for(const line of vipIdleLines)assert.ok(profile.vipVocativePool.some(v=>interpolateDialogue(line,profile).includes(v)));
}
const bath=createLife();commandLife(bath,'bath');tickLife(bath,6.1,'day',lengths,()=>0);const wet=bath.speech;tickLife(bath,5,'day',lengths,()=>0);assert.equal(bath.speech,wet);tickLife(bath,2.1,'day',lengths,()=>0);assert.ok(postBathLines.includes(bath.speech));assert.equal(bath.postBathPending,false);
console.log('PASS: 32 letters, bands, revised bodies, 50 josa cases, every normal/VIP idle/pet branch, status pools and post-bath timing.');
