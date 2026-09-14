import {renderTemplate} from './josa.ts';
export type Gender='female'|'male';
export type Tier='normal'|'vip_dad'|'vip_owner'|'vip_jangmi';
export type ProfileInput={nickname:string;gender:Gender;birthYear:number};
export type Profile=ProfileInput & {userId:string;vocative:string;relationshipTier:Tier;vipVocativePool:readonly string[];createdAt:string;updatedAt:string};
const vipProfiles=[
 {nickname:'쭈인',gender:'female',birthYear:1991,tier:'vip_owner',pool:['쭈인이','엄마아']},
 {nickname:'아빠',gender:'male',birthYear:1995,tier:'vip_dad',pool:['아빠','아빠아']},
 {nickname:'장미',gender:'female',birthYear:1990,tier:'vip_jangmi',pool:['장미이모']},
] as const;
// Cosmetic only. These values never participate in authentication or authorization.
const vipMatch=(p:ProfileInput)=>vipProfiles.find(v=>p.nickname.trim()===v.nickname&&p.gender===v.gender&&p.birthYear===v.birthYear);
export const classifyVip=(p:ProfileInput):Tier=>vipMatch(p)?.tier??'normal';
export const vipVocativePool=(p:ProfileInput):readonly string[]=>vipMatch(p)?.pool??[];
export const kstYear=(date=new Date())=>new Date(date.getTime()+9*3600000).getUTCFullYear();
export function parseProfile(value:unknown,year=kstYear()):ProfileInput{
 const p=value as Partial<ProfileInput>|null;
 if(!p||typeof p.nickname!=='string'||!p.nickname.trim()||p.nickname.trim().length>20||/[\u0000-\u001f{}]/.test(p.nickname))throw new Error('이름은 1~20자로 적어줘!');
 if(p.gender!=='female'&&p.gender!=='male')throw new Error('성별을 골라줘!');
 if(!Number.isInteger(p.birthYear)||p.birthYear!<year-120||p.birthYear!>year)throw new Error('태어난 연도를 네 자리로 확인해줘!');
 return {nickname:p.nickname.trim(),gender:p.gender,birthYear:p.birthYear!};
}
export function resolveVocative(p:ProfileInput,year=kstYear()){
 const vip=vipVocativePool(p);if(vip.length)return vip[0];
 return year-p.birthYear<=30?(p.gender==='female'?'누냐':'형아'):(p.gender==='female'?'이모':'삼쵼');
}
export function makeProfile(input:ProfileInput,userId:string,createdAt=new Date().toISOString()):Profile{
 return {...input,nickname:input.nickname.trim(),userId,relationshipTier:classifyVip(input),vipVocativePool:vipVocativePool(input),vocative:resolveVocative(input),createdAt,updatedAt:new Date().toISOString()};
}
export function interpolateDialogue(line:string,profile:Profile|null){
 const pool=profile?vipVocativePool(profile):[];
 const vocative=profile?resolveVocative(profile):'친구';
 const long:Record<string,string>={'누냐':'누냐아','형아':'형아아','이모':'이모오','삼쵼':'삼쵼','아빠':'아빠아','쭈인이':'엄마아','장미이모오':'장미이모오','친구':'친구야'};
 const vipVocative=pool.length?pool[Array.from(line).reduce((sum,c)=>sum+c.charCodeAt(0),0)%pool.length]:vocative;
 const tokens={vipVocative,nickname:profile?.nickname.trim()||'친구',vocative,vocativeLong:pool.length?pool[pool.length-1]:long[vocative]||vocative};
 if(pool.length)line=line.replace(/\{nickname\}\s*(?=\{vocative(?:Long)?(?:\|(?:subject|topic|with|object|and))?\})/g,'');
 return renderTemplate(line,tokens);
}

