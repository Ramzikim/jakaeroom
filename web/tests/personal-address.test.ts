import assert from 'node:assert/strict';
import {makeProfile,interpolateDialogue,resolveVocative} from '../app/profile.ts';
import {letters,specialLetters,vipLetters} from '../app/letters.ts';
import {pettingLines} from '../app/dialogue.ts';
const pet=pettingLines.find(l=>l.startsWith('너 작애'))!,letter=letters[27].body;
const cases=[
 [{nickname:'테스트',gender:'female',birthYear:1980},'이모','이모가'],
 [{nickname:'테스트',gender:'male',birthYear:1980},'삼촌','삼촌이'],
 [{nickname:'쭈인',gender:'female',birthYear:1991},'쭈인','쭈인이'],
 [{nickname:'아빠',gender:'male',birthYear:1995},'아빠','아빠가'],
 [{nickname:'장미',gender:'female',birthYear:1990},'장미이모','장미이모가'],
] as const;
for(const [input,address,subject] of cases){
 const profile=makeProfile(input,'test');const rendered=interpolateDialogue(letter,profile);
 assert.equal(interpolateDialogue(pet,profile),address+' 작애 너무 좋아하는 거 아니야아?');
 assert(rendered.includes('그리고 '+subject+' 올 때마다'));
 assert(rendered.includes(address+'일 수도 있나아?'));assert(rendered.includes(address+' 집으로 데려가 줄래?'));
 assert(!rendered.includes('undefined'));assert(!rendered.includes('null'));assert(!rendered.includes('테스트'));
 assert.equal(rendered.split('\n').length,letter.split('\n').length);
 for(const l of [...specialLetters,...vipLetters])assert.equal(interpolateDialogue(l.body,profile),l.body,'quoted doll address and VIP prose unchanged');
}
for(const l of [pet,...letters.map(l=>l.body),...specialLetters.map(l=>l.body),...vipLetters.map(l=>l.body)])assert.equal(interpolateDialogue(l,null),l,'natural original fallback');
assert.equal(interpolateDialogue('작애 예뻐해주는 거 맞지이?',makeProfile(cases[0][0],'test')),'작애 예뻐해주는 거 맞지이?');
const first=makeProfile(cases[0][0],'same'),updated=makeProfile(cases[1][0],'same');assert.notEqual(interpolateDialogue(letter,first),interpolateDialogue(letter,updated),'reread uses current profile');
console.log('PASS: reviewed pet/letter references, josa, all VIP overrides, guest fallback, current-profile reread and unchanged quoted prose');
