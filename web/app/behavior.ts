import {vipIdleLines,vipPettingLines,pettingLines,postBathLines} from './dialogue.ts';
import type {Tier} from './profile.ts';
import {anchors,route,waitingLines,type Point} from './life.ts';
export type Band='dawn'|'day'|'afternoon'|'night';
export type Action='pet'|'bed'|'bath'|'berry';
export type Sequence='idle'|'walk_left'|'walk_right'|'backwalk_left'|'backwalk_right'|'hop'|'shy'|'sit_idle'|'sit_snooze'|'sit_sleeploop'|'bath'|'strawberry';
export const RULES={fps:8,sleepSeconds:300,bathSeconds:6,berrySeconds:5,petWindow:10,petThreshold:3,refusalChance:.5,nightSit:.28,nightSleep:.12,daySit:.025,dawnSleep:.75};
export const positions={bed:[.2,.78,-2.65],bedRight:[1.85,0,-2.65],rug:[-.95,.025,1.6],bath:[-3.5,.57,2.65],bathExit:[-2.5,.06,1.05]} satisfies Record<string,number[]>;
export const sitLines=['여기 앉아 있으니까 편하다아.','뭐하고 놀까아?','조금 심심해애.','딸기 생각나아...','가만히 있는 것도 좋아아.','누가 놀러 안 오나아.','잠깐 쉬는 중이야아.','작애 지금 멍때리고 있어어.'];
export const dawnLines=['졸린데 잠이 안와아...','조금만 더 놀다가 잘래애.','눈은 감기는데에... 아직 안 잘래애.','새벽은 조용해서 좋은데에, 조금 심심해애.','잠깐만 돌아다니다가 다시 잘 거야아.','자야 하는데에... 괜히 놀고 싶어어.','꿈꾸기 전에 조금만 더 있을래애.'];
export const dreamLines=['딸기 케이크 먹는 꿈 꾸는 중이야아...','엄청 신나는 꿈 꾸고 있어어!','미미랑 놀러 가는 꿈이야아.','딸기가 산만큼 나왔어어...','재밌는 꿈 꾸는 중이야아.','으음... 조금 슬픈 꿈이야아...','구름 위에서 뛰어노는 꿈이야아.','과자 잔뜩 먹는 꿈 꾸고 있어어.','쭈욱 자고 싶다아...','새근새근...'];
export const refusalLines=['나중에 쓰다듬어어!','털 다 망가지겠어!','작애 털 눌리잖아아.','잠깐만 쉬었다가아!'];
const wetLines=['젖은 솜이 됐어어...','몸이 무겁다아!','어서 말랐으면 좋겠어어.'];
export function walkSequence(dx:number,dz:number):Sequence{const right=16*dx-12*dz,toward=12*dx+16*dz;return `${toward<0?'backwalk':'walk'}_${right<0?'left':'right'}`;}
export function createLife(){return {relationshipTier:'normal' as Tier,postBathPending:false,sequence:'idle' as Sequence,started:0,now:0,wait:5,node:'center',destination:'center',path:[] as Point[],point:[1.65,0,-.55],pending:null as null|'sit'|'sleep',seat:'bed' as 'bed'|'rug',speech:'왔어어? 내 방에서 같이 놀자!',speechUntil:7,nextSpeech:0,pets:[] as number[],awakeUntil:0,wetUntil:0};}
export function animationFps(s:ReturnType<typeof createLife>){return s.sequence==='sit_idle'||s.sequence==='sit_sleeploop'?6:s.sequence.includes('walk')&&s.now<s.wetUntil?RULES.fps*.65:RULES.fps;}
export type Life=ReturnType<typeof createLife>;
export const locked=(s:Life)=>['hop','shy','bath','strawberry','sit_snooze','sit_sleeploop'].includes(s.sequence)||s.pending==='sleep';
const pick=(a:string[],rng:()=>number)=>a[Math.floor(rng()*a.length)];
function change(s:Life,sequence:Sequence){s.sequence=sequence;s.started=s.now;}
function say(s:Life,line:string){s.speech=line;s.speechUntil=s.now+7;}
function place(s:Life,key:keyof typeof positions,node:string){s.point=[...positions[key]];s.node=node;s.path=[];s.pending=null;}
function ground(s:Life){if(s.point[1]>.1){place(s,'bedRight','bed');}else s.point[1]=0;}
function idle(s:Life,rng:()=>number){change(s,'idle');s.wait=5+rng()*7;}
function go(s:Life,to:string){s.path=s.path.length?[...s.path,...route(s.destination,to)]:route(s.node,to);s.destination=to;if(s.path.length)change(s,walkSequence(s.path[0][0]-s.point[0],s.path[0][1]-s.point[2]));}
function sitOrSleep(s:Life,sleep:boolean,rng:()=>number){ground(s);s.pending=sleep?'sleep':'sit';s.seat=sleep||rng()<.5?'bed':'rug';go(s,s.seat);if(!s.path.length)arrive(s,rng);}
function arrive(s:Life,rng:()=>number){s.node=s.destination;if(s.pending){const sleep=s.pending==='sleep';place(s,s.seat,s.seat);change(s,sleep?'sit_snooze':'sit_idle');s.wait=12+rng()*23;s.nextSpeech=s.now+15+rng()*12;s.speech='';if(!sleep&&rng()<.5)say(s,pick(sitLines,rng));}else{idle(s,rng);if(rng()<.65)say(s,pick(s.relationshipTier==='normal'?waitingLines:vipIdleLines,rng));}}
export function commandLife(s:Life,action:Action,rng=Math.random):boolean{
 if(s.sequence==='sit_sleeploop'&&action==='pet'){place(s,'bedRight','bed');s.awakeUntil=s.now+75+rng()*35;change(s,rng()<.5?'hop':'shy');say(s,'으으음… 잘 잤다아!');return true;}
 if(locked(s))return false;
 if(action==='bed'){sitOrSleep(s,true,rng);return true;}
 if(action==='bath'){place(s,'bath','bathExit');change(s,'bath');s.speech='';return true;}
 ground(s);s.pending=null;
 if(action==='berry'){change(s,'strawberry');say(s,'딸기다아! 잘 먹을게애.');return true;}
 s.pets=s.pets.filter(t=>s.now-t<RULES.petWindow);
 if(s.pets.length>=RULES.petThreshold&&rng()<RULES.refusalChance){idle(s,rng);say(s,pick(refusalLines,rng));return true;}
 s.pets.push(s.now);change(s,rng()<.5?'hop':'shy');say(s,pick(s.relationshipTier==='normal'?pettingLines:vipPettingLines,rng));return true;
}
export function tickLife(s:Life,dt:number,band:Band,lengths:Record<Sequence,number>,rng=Math.random){
 s.now+=dt;const elapsed=s.now-s.started;
 if(s.postBathPending&&s.now>=s.speechUntil&&s.now>=s.wetUntil&&!locked(s)){say(s,pick(postBathLines,rng));s.postBathPending=false;}
 if(s.sequence==='hop'||s.sequence==='shy'){if(elapsed>=lengths[s.sequence]/RULES.fps)idle(s,rng);}
 else if(s.sequence==='strawberry'){if(elapsed>=RULES.berrySeconds)idle(s,rng);}
 else if(s.sequence==='bath'){if(elapsed>=RULES.bathSeconds){place(s,'bathExit','bathExit');s.wetUntil=s.now+5;s.postBathPending=true;go(s,'center');say(s,pick(wetLines,rng));}}
 else if(s.sequence==='sit_snooze'){if(elapsed>=lengths.sit_snooze/RULES.fps){change(s,'sit_sleeploop');s.nextSpeech=s.now+20+rng()*15;}}
 else if(s.sequence==='sit_sleeploop'){
  if(elapsed>=RULES.sleepSeconds){place(s,'bedRight','bed');idle(s,rng);s.awakeUntil=s.now+75+rng()*35;say(s,band==='dawn'?pick(dawnLines,rng):'잘 잤다아.');}
  else if(s.now>=s.nextSpeech){say(s,pick(dreamLines,rng));s.nextSpeech=s.now+25+rng()*20;}
 }else if(s.sequence==='sit_idle'){
  if(elapsed>=s.wait){ground(s);idle(s,rng);}
  else if(s.now>=s.nextSpeech){if(rng()<.5)say(s,pick(sitLines,rng));s.nextSpeech=s.now+15+rng()*10;}
 }else if(s.sequence==='idle'){
  if(elapsed>s.wait){
   if(s.path.length){change(s,walkSequence(s.path[0][0]-s.point[0],s.path[0][1]-s.point[2]));return;}
   const choice=rng();
   if(band==='dawn'&&s.now>=s.awakeUntil&&choice<RULES.dawnSleep)sitOrSleep(s,true,rng);
   else if(band==='night'&&choice<RULES.nightSleep)sitOrSleep(s,true,rng);
   else if((band==='night'&&choice<RULES.nightSleep+RULES.nightSit)||((band==='day'||band==='afternoon')&&choice<RULES.daySit))sitOrSleep(s,false,rng);
   else{if(band==='dawn'&&rng()<.5)say(s,pick(dawnLines,rng));const nodes=Object.keys(anchors).filter(n=>n!==s.node&&n!=='bathExit'&&n!=='bathDoor');go(s,nodes[Math.floor(rng()*nodes.length)]);}
  }
 }else{
  const next=s.path[0];if(!next){arrive(s,rng);return;}
  const dx=next[0]-s.point[0],dz=next[1]-s.point[2],distance=Math.hypot(dx,dz),step=Math.min(dt,.1)*.55*(s.now<s.wetUntil?.65:1);
  const direction=walkSequence(dx,dz);if(direction!==s.sequence)change(s,direction);
  if(distance<=step){s.point=[next[0],0,next[1]];s.path.shift();}else{s.point[0]+=dx/distance*step;s.point[2]+=dz/distance*step;}
 }
}
export function kstDate(date=new Date()){return new Date(date.getTime()+9*3600000).toISOString().slice(0,10);}
export type LetterCounts={date:string;dawn:number;day:number;afternoon:number;night:number};
export function readCounts(raw:string|null,date=kstDate()):LetterCounts{try{const v=JSON.parse(raw||'null');if(v?.date===date&&(['dawn','day','afternoon','night'] as const).every(k=>Number.isInteger(v[k])&&v[k]>=0&&v[k]<=2))return v;}catch{}return {date,dawn:0,day:0,afternoon:0,night:0};}

