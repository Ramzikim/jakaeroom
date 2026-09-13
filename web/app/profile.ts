export type Gender='female'|'male';
export type Tier='standard'|'vip_dad'|'vip_owner'|'vip_jangmi';
export type ProfileInput={nickname:string;gender:Gender;birthYear:number};
export type Profile=ProfileInput & {userId:string;vocative:string;relationshipTier:Tier;createdAt:string;updatedAt:string};
export const kstYear=(date=new Date())=>new Date(date.getTime()+9*3600000).getUTCFullYear();
export function parseProfile(value:unknown,year=kstYear()):ProfileInput{
 const p=value as Partial<ProfileInput>|null;
 if(!p||typeof p.nickname!=='string'||!p.nickname.trim()||p.nickname.trim().length>20||/[\u0000-\u001f{}]/.test(p.nickname))throw new Error('이름은 1~20자로 적어줘!');
 if(p.gender!=='female'&&p.gender!=='male')throw new Error('성별을 골라줘!');
 if(!Number.isInteger(p.birthYear)||p.birthYear!<year-120||p.birthYear!>year)throw new Error('태어난 연도를 네 자리로 확인해줘!');
 return {nickname:p.nickname.trim(),gender:p.gender,birthYear:p.birthYear!};
}
export function resolveVocative(p:ProfileInput,tier:Tier='standard',year=kstYear()){
 if(tier==='vip_dad')return '아빠';if(tier==='vip_owner')return '쭈인이';if(tier==='vip_jangmi')return '장미이모오';
 return year-p.birthYear<=30?(p.gender==='female'?'누냐':'형아'):(p.gender==='female'?'이모':'삼쵼');
}
export function classifyVip(userId:string,ids:Partial<Record<Exclude<Tier,'standard'>,string>>):Tier{
 const configured=Object.entries(ids).filter(([,id])=>id);
 if(new Set(configured.map(([,id])=>id)).size!==configured.length)throw new Error('VIP configuration contains duplicate user IDs');
 return (configured.find(([,id])=>id===userId)?.[0] as Tier)||'standard';
}
export function makeProfile(input:ProfileInput,userId:string,tier:Tier='standard',createdAt=new Date().toISOString()):Profile{
 return {...input,userId,relationshipTier:tier,vocative:resolveVocative(input,tier),createdAt,updatedAt:new Date().toISOString()};
}
export function interpolateDialogue(line:string,profile:Profile|null){
 const vocative=profile?resolveVocative(profile,profile.relationshipTier):'친구';
 const long:Record<string,string>={'누냐':'누냐아','형아':'형아아','이모':'이모오','삼쵼':'삼쵼','아빠':'아빠아','쭈인이':'엄마아','장미이모오':'장미이모오','친구':'친구야'};
 const tokens={nickname:profile?.nickname||'친구',vocative,vocativeLong:long[vocative]||vocative};
 return line.replace(/\{(nickname|vocative|vocativeLong)\}/g,(_,key:keyof typeof tokens)=>tokens[key]);
}
