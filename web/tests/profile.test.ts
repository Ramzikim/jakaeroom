import assert from 'node:assert/strict';
import {parseProfile,kstYear,resolveVocative,classifyVip,makeProfile,interpolateDialogue,vipVocativePool} from '../app/profile.ts';
const female={nickname:'유진',gender:'female' as const,birthYear:1996},male={...female,gender:'male' as const};
assert.equal(kstYear(new Date('2026-12-31T14:59:59Z')),2026);
assert.equal(kstYear(new Date('2026-12-31T15:00:00Z')),2027);
for(const [p,young,older] of [[female,'누냐','이모'],[male,'형아','삼쵼']] as const){assert.equal(resolveVocative(p,2026),young);assert.equal(resolveVocative(p,2027),older);}
for(const birthYear of [0,1800,2027,1996.5,NaN])assert.throws(()=>parseProfile({...female,birthYear},2026));
assert.throws(()=>parseProfile({...female,nickname:'   '}));assert.throws(()=>parseProfile({...female,gender:'vip_dad'}));
assert.deepEqual(parseProfile({...female,nickname:' 유진 ',relationshipTier:'vip_dad',userId:'other'},2026),female);
const cases=[
 [{nickname:'쭈인',gender:'female',birthYear:1991},'vip_owner',['쭈인이','엄마아']],
 [{nickname:'아빠',gender:'male',birthYear:1995},'vip_dad',['아빠','아빠아']],
 [{nickname:'장미',gender:'female',birthYear:1990},'vip_jangmi',['장미이모']],
] as const;
for(const [input,tier,pool] of cases){
 assert.equal(classifyVip(input),tier);assert.deepEqual(vipVocativePool(input),pool);
 assert.equal(classifyVip({...input,nickname:` \t${input.nickname}\n`}),tier);
 for(const changed of [{...input,nickname:input.nickname+'이'},{...input,nickname:input.nickname.split('').join(' ')},{...input,gender:input.gender==='female'?'male' as const:'female' as const},{...input,birthYear:input.birthYear+1}]){
  assert.equal(classifyVip(changed),'normal');assert.deepEqual(vipVocativePool(changed),[]);
  const edited=makeProfile(changed,'same-account');assert.equal(edited.relationshipTier,'normal');
  assert.equal(makeProfile(input,edited.userId).relationshipTier,tier);
 }
 for(const id of ['guest','account-a','account-b'])assert.equal(makeProfile(input,id).relationshipTier,tier);
 const profile=makeProfile(input,'same-account');
 assert.equal(interpolateDialogue('{nickname} {vocative}',profile),pool[0]);
 assert.equal(interpolateDialogue('{vocativeLong}',profile),pool[pool.length-1]);
 assert.ok(!interpolateDialogue('{nickname}{vocative} {nickname} {vocativeLong}',profile).includes('쭈인이모'));
}
assert.equal(classifyVip(female),'normal');
const p=makeProfile(female,'guest');assert.equal(interpolateDialogue('그냥 쉬어어.',p),'그냥 쉬어어.');assert.equal(interpolateDialogue('{vocativeLong}!',null),'친구야!');
assert.equal(interpolateDialogue('{vocative}',{...p,relationshipTier:'vip_owner',vocative:'엄마아',vipVocativePool:['엄마아']}),resolveVocative(female));
console.log('Exact VIP profiles, trim-only matching, all single-field mismatches, edits, auth independence, token pools and normal age rules passed.');
