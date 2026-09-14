export type Particle='subject'|'topic'|'with'|'object'|'and';
const particles:Record<Particle,readonly [string,string]>={subject:['이','가'],topic:['은','는'],with:['이랑','랑'],object:['을','를'],and:['과','와']};
export function withJosa(value:string,particle:Particle){
 const noun=value.trimEnd(),code=noun.charCodeAt(noun.length-1)-0xac00;
 const batchim=code>=0&&code<=0xd7a3-0xac00&&code%28!==0;
 return noun+particles[particle][batchim?0:1];
}
export function renderTemplate(template:string,values:Record<string,string>){
 return template.replace(/\{([^{}|]+)(?:\|(subject|topic|with|object|and))?\}/g,(original,key:string,particle:Particle|undefined)=>{
  const value=values[key];return value===undefined?original:particle?withJosa(value,particle):value;
 });
}
