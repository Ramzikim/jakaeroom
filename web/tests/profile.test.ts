import assert from 'node:assert/strict';
import {parseProfile,kstYear,resolveVocative,classifyVip,makeProfile,interpolateDialogue} from '../app/profile.ts';
const female={nickname:'유진',gender:'female' as const,birthYear:1996},male={...female,gender:'male' as const};
assert.equal(kstYear(new Date('2026-12-31T14:59:59Z')),2026);
assert.equal(kstYear(new Date('2026-12-31T15:00:00Z')),2027);
for(const [p,young,older] of [[female,'누냐','이모'],[male,'형아','삼쵼']] as const){assert.equal(resolveVocative(p,'standard',2026),young);assert.equal(resolveVocative(p,'standard',2027),older);}
for(const birthYear of [0,1800,2027,1996.5,NaN])assert.throws(()=>parseProfile({...female,birthYear},2026));
assert.throws(()=>parseProfile({...female,nickname:'   '}));assert.throws(()=>parseProfile({...female,gender:'vip_dad'}));
assert.deepEqual(parseProfile({...female,nickname:' 유진 ',relationshipTier:'vip_dad',userId:'other'},2026),female);
const ids={vip_dad:'user-1',vip_owner:'user-2',vip_jangmi:'user-3'};
for(const [id,tier,title] of [['user-1','vip_dad','아빠'],['user-2','vip_owner','쭈인이'],['user-3','vip_jangmi','장미이모오']] as const){assert.equal(classifyVip(id,ids),tier);assert.equal(resolveVocative(female,tier),title);assert.equal(resolveVocative({...male,birthYear:1940},tier),title);}
assert.equal(classifyVip('other',ids),'standard');assert.equal(classifyVip('other',{}),'standard');assert.throws(()=>classifyVip('user-1',{vip_dad:'user-1',vip_owner:'user-1'}));
const p=makeProfile(female,'guest');assert.equal(interpolateDialogue('{nickname} {vocativeLong}, 뭐해애?',p),'유진 누냐아, 뭐해애?');assert.equal(interpolateDialogue('그냥 쉬어어.',p),'그냥 쉬어어.');assert.equal(interpolateDialogue('{vocativeLong}!',null),'친구야!');
assert.equal(interpolateDialogue('{vocativeLong}',makeProfile(female,'user-2','vip_owner')),'엄마아');
console.log('KST year boundary, age-30 boundary, input validation, server tier selection, VIP overrides and dialogue tokens passed.');
