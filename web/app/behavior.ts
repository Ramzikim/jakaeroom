import {vipIdleLines,pettingPool,postBathLines,bathStartLines} from './dialogue.ts';
import type {Tier} from './profile.ts';
import {TV_CONTENT,GAME_DIALOGUE,GAME_LIMIT_DIALOGUE} from './media-dialogue.ts';
import {anchors,route,floorPath,waitingLines,type Point} from './life.ts';
export type Band='dawn'|'day'|'afternoon'|'night';
export const TV_CHAR_SECONDS=.04;
export const tvReactionTime=(script:string)=>script.length*TV_CHAR_SECONDS+.5;
export type Action='pet'|'bed'|'bath'|'berry'|'cushion'|'window'|'basketBerry'|'move'|'tv'|'game';
export type Sequence='idle'|'walk_left'|'walk_right'|'backwalk_left'|'backwalk_right'|'hop'|'shy'|'sit_idle'|'sit_snooze'|'sit_sleeploop'|'bath'|'strawberry'|'window'|'game';
export const RULES={fps:8,sleepSeconds:300,bathSeconds:6,berrySeconds:5,petWindow:180,petThreshold:5,nightSit:.45,nightSleep:.03,daySit:.025,dawnSleep:.75};
export const positions={bed:[.2,.78,-2.65],bedRight:[1.85,0,-2.65],rug:[0,.235,.45],bath:[-3.5,.57,2.65],bathExit:[-2.5,.06,1.05]} satisfies Record<string,number[]>;
export const sitLines=['여기 앉아 있으니까 편하다아.','뭐하고 놀까아?','조금 심심해애.','딸기 생각나아...','가만히 있는 것도 좋아아.','누가 놀러 안 오나아.','잠깐 쉬는 중이야아.','작애 지금 멍때리고 있어어.'];
export const dawnLines=['졸린데 잠이 안와아...','조금만 더 놀다가 잘래애.','눈은 감기는데에... 아직 안 잘래애.','새벽은 조용해서 좋은데에, 조금 심심해애.','잠깐만 돌아다니다가 다시 잘 거야아.','자야 하는데에... 괜히 놀고 싶어어.','꿈꾸기 전에 조금만 더 있을래애.'];
export const dreamLines=['딸기 케이크 먹는 꿈 꾸는 중이야아...','엄청 신나는 꿈 꾸고 있어어!','미미랑 놀러 가는 꿈이야아.','딸기가 산만큼 나왔어어...','재밌는 꿈 꾸는 중이야아.','으음... 조금 슬픈 꿈이야아...','구름 위에서 뛰어노는 꿈이야아.','과자 잔뜩 먹는 꿈 꾸고 있어어.','쭈욱 자고 싶다아...','새근새근...'];
export const refusalLines=['잠깐만 쉬었다가 해애.','작애 털 다 눌리겠어어.','그만그마안~ 작애 납작해져어.','조금 있다가 또 해죠오.','작애 지금 너무 많이 쓰담받았어어.','헤헤, 이제 작애 차례 끝이야아.','손 잠깐 쉬자아. 작애도 쉬고 싶어어.','더 하면 작애 털 모양 이상해질 거야아.','작애 좋아하는 거 알겠으니까 잠깐만 쉬자아.','으으, 간지러워어. 이제 잠깐 스토옵!','또오? 작애 인기 너무 많은데에.','작애도 숨 좀 돌리자아.'];
const wetLines=['젖은 솜이 됐어어...','몸이 무겁다아!','어서 말랐으면 좋겠어어.'];
export function walkSequence(dx:number,dz:number):Sequence{const right=16*dx-12*dz,toward=12*dx+16*dz;return `${toward<0?'backwalk':'walk'}_${right<0?'left':'right'}`;}
export function createLife(){return {media:null as null|'tv'|'game',mediaStarted:0,mediaGiftId:null as string|null,mediaExtra:0,mediaTitle:'',mediaNews:'',mediaReaction:'',mediaReacted:false,monitor:0,gameDate:'',gamePlayCount:{day:0,afternoon:0,night:0,dawn:0},relationshipTier:'normal' as Tier,postBathPending:false,basketBerry:false,cushionRequested:false,sequence:'idle' as Sequence,started:0,now:0,wait:5,node:'center',destination:'center',path:[] as Point[],point:[1.65,0,-.55],pending:null as null|'sit'|'sleep',seat:'bed' as 'bed'|'rug',speech:'왔어어? 내 방에서 같이 놀자!',speechUntil:7,nextSpeech:0,pets:[] as number[],awakeUntil:0,wetUntil:0};}
export function animationFps(s:ReturnType<typeof createLife>){return s.sequence==='sit_idle'||s.sequence==='sit_sleeploop'?6:s.sequence.includes('walk')&&s.now<s.wetUntil?RULES.fps*.65:RULES.fps;}
export type Life=ReturnType<typeof createLife>;
export const locked=(s:Life)=>['hop','shy','bath','strawberry','sit_snooze','sit_sleeploop'].includes(s.sequence)||s.pending==='sleep';
const pick=(a:string[],rng:()=>number)=>a[Math.floor(rng()*a.length)];
function change(s:Life,sequence:Sequence){s.sequence=sequence;s.started=s.now;}
function say(s:Life,line:string){s.speech=line;s.speechUntil=s.now+7;}
function place(s:Life,key:keyof typeof positions,node:string){s.point=[...positions[key]];s.node=node;s.path=[];s.pending=null;}
function ground(s:Life){if(s.node==='cushion'){s.point=[...positions.rug];s.point[1]=0;return;}if(s.point[1]>.1){place(s,'bedRight','bed');}else s.point[1]=0;}
function idle(s:Life,rng:()=>number){change(s,'idle');s.wait=5+rng()*7;}
function endMedia(s:Life,rng:()=>number){
 const tv=s.media==='tv';s.media=null;s.mediaGiftId=null;s.mediaExtra=0;s.mediaNews='';s.speech='';s.path=[];s.pending=null;s.cushionRequested=false;
 if(tv){s.point=[...positions.rug];s.point[1]=0;s.node='cushion';idle(s,rng);go(s,'rug');}
 else{s.point=[anchors.desk[0],0,anchors.desk[1]];s.node='desk';s.destination='desk';idle(s,rng);}
}
function go(s:Life,to:string){if(s.node==='floor'){s.path=floorPath([s.point[0],s.point[2]],anchors[to]);s.destination=to;if(s.path.length)change(s,walkSequence(s.path[0][0]-s.point[0],s.path[0][1]-s.point[2]));return;}s.path=s.path.length?[...s.path,...route(s.destination,to)]:route(s.node,to);s.destination=to;if(s.path.length)change(s,walkSequence(s.path[0][0]-s.point[0],s.path[0][1]-s.point[2]));}
function sitOrSleep(s:Life,sleep:boolean,rng:()=>number){ground(s);s.pending=sleep?'sleep':'sit';s.seat=sleep||rng()<.5?'bed':'rug';go(s,s.seat==='rug'?'cushion':s.seat);if(!s.path.length)arrive(s,rng);}
function arrive(s:Life,rng:()=>number){s.node=s.destination;if(s.pending){const sleep=s.pending==='sleep';place(s,s.seat,s.seat==='rug'?'cushion':s.seat);change(s,sleep?'sit_snooze':'sit_idle');s.wait=s.cushionRequested?8+rng()*6:12+rng()*23;s.nextSpeech=s.cushionRequested?Infinity:s.now+15+rng()*12;s.speech='';if(!sleep&&(s.cushionRequested||rng()<.5))say(s,pick(sitLines,rng));}else{idle(s,rng);if(rng()<.65)say(s,pick(s.relationshipTier==='normal'?waitingLines:vipIdleLines,rng));}}
export function commandLife(s:Life,action:Action,rng=Math.random,target?:Point,band:Band='day'):boolean{
 if(s.media){
  if(action===s.media)return false;
  endMedia(s,rng);
 }
 if(action==='tv'||action==='game'){
  if(locked(s))return false;
  if(action==='game'){
   const date=kstDate();if(s.gameDate!==date){s.gameDate=date;s.gamePlayCount={day:0,afternoon:0,night:0,dawn:0};}
   if(s.gamePlayCount[band]>=3){ground(s);s.path=[];s.pending=null;idle(s,rng);say(s,pick(GAME_LIMIT_DIALOGUE,rng));return true;}
   s.gamePlayCount[band]++;s.monitor=Math.floor(rng()*3);
  }
  s.path=[];s.pending=null;s.cushionRequested=false;s.basketBerry=false;s.media=action;s.mediaGiftId=null;s.mediaExtra=0;s.mediaStarted=s.now;s.mediaReacted=false;
  if(action==='tv'){
   place(s,'rug','cushion');change(s,'sit_idle');s.speech='';const report=TV_CONTENT[band][Math.floor(rng()*TV_CONTENT[band].length)];s.mediaTitle=report.title;s.mediaNews=report.script;s.mediaReaction=report.reaction;
  }else{
   s.point=[3.25,.95,-2.52];s.node='chair';change(s,'game');say(s,pick(GAME_DIALOGUE[(`monitor_0${s.monitor+1}`) as keyof typeof GAME_DIALOGUE],rng));
  }
  return true;
 }
 if(action==='cushion'&&s.sequence==='sit_idle')return false;
 if(s.sequence==='sit_idle'){s.cushionRequested=false;s.path=[];s.pending=null;}
 if(action==='move'){
  if(locked(s)||!target)return false;
  const walking=s.sequence.includes('walk'),last=s.path.at(-1);
  if(walking&&s.destination==='floor'&&last&&Math.hypot(last[0]-target[0],last[1]-target[1])<.04)return false;
  const start:Point=s.point[1]>.3?[positions.bedRight[0],positions.bedRight[2]]:[s.point[0],s.point[2]];
  const path=floorPath(start,target);if(!path.length)return false;
  if(!walking)ground(s);
  s.node='floor';s.pending=null;s.path=path;s.destination='floor';s.speech='';
  const direction=walkSequence(path[0][0]-s.point[0],path[0][1]-s.point[2]);
  if(s.sequence!==direction)change(s,direction);return true;
 }
 if(s.pets.length&&s.now-s.pets[0]>=RULES.petWindow)s.pets=[];
 if(action==='pet'){
  if((locked(s)&&s.sequence!=='sit_sleeploop')||s.cushionRequested)return false;
  if(s.pets.length>=RULES.petThreshold-1){say(s,pick(refusalLines,rng));return true;}
  s.pets.push(s.now);
 }
 if(action==='window'){
  if(s.sequence==='window'||['hop','shy','bath','strawberry'].includes(s.sequence)||s.cushionRequested)return false;
  s.path=[];s.pending=null;s.point=[.68,1.02,-3.34];s.node='bed';s.destination='bed';change(s,'window');
  say(s,pick(windowLines[band],rng));return true;
 }
 if(s.sequence==='window'){place(s,'bedRight','bed');idle(s,rng);}
 if(s.sequence==='sit_sleeploop'&&action==='pet'){place(s,'bedRight','bed');s.awakeUntil=s.now+75+rng()*35;change(s,rng()<.5?'hop':'shy');say(s,'으으음… 잘 잤다아!');return true;}
 if(action==='basketBerry'){
  if(locked(s))return false;
  s.cushionRequested=false;s.basketBerry=true;place(s,'rug','cushion');s.destination='cushion';change(s,'strawberry');say(s,'딸기다아! 잘 먹을게애.');return true;
 }
 if(locked(s)||s.cushionRequested)return false;
 if(action==='cushion'){if(s.sequence==='sit_idle')return false;s.cushionRequested=true;s.pending='sit';s.seat='rug';s.path=[];s.destination='cushion';arrive(s,rng);return true;}
 if(action==='bed'){s.cushionRequested=false;s.basketBerry=false;s.pending='sleep';s.seat='bed';s.path=[];s.destination='bed';arrive(s,rng);return true;}
 if(action==='bath'){place(s,'bath','bathExit');change(s,'bath');say(s,pick(bathStartLines,rng));return true;}
 ground(s);s.pending=null;
 if(action==='berry'){change(s,'strawberry');say(s,'딸기다아! 잘 먹을게애.');return true;}
 change(s,rng()<.5?'hop':'shy');say(s,pick(pettingPool(s.relationshipTier),rng));return true;
}
export function tickLife(s:Life,dt:number,band:Band,lengths:Record<Sequence,number>,rng=Math.random){
 s.now+=dt;if(s.pets.length&&s.now-s.pets[0]>=RULES.petWindow)s.pets=[];const elapsed=s.now-s.started;
 if(s.media){
  const elapsed=s.now-s.mediaStarted;
  if(s.media==='tv'&&elapsed>=tvReactionTime(s.mediaNews)&&!s.mediaReacted){s.mediaReacted=true;say(s,s.mediaReaction);}
  // Keep the existing reaction display duration, including for long broadcasts.
  if(s.media==='tv'?elapsed>=10+s.mediaExtra&&s.mediaReacted&&s.now>=s.speechUntil+s.mediaExtra:elapsed>=8)endMedia(s,rng);
  return;
 }
 if(s.postBathPending&&s.now>=s.speechUntil&&s.now>=s.wetUntil&&!locked(s)){say(s,pick(postBathLines,rng));s.postBathPending=false;}
 if(s.sequence==='window'){if(elapsed>=10){place(s,'bedRight','bed');idle(s,rng);}}
 else if(s.sequence==='hop'||s.sequence==='shy'){if(elapsed>=lengths[s.sequence]/RULES.fps)idle(s,rng);}
 else if(s.sequence==='strawberry'){if(elapsed>=RULES.berrySeconds){if(s.basketBerry){s.basketBerry=false;ground(s);idle(s,rng);go(s,'rug');}else idle(s,rng);}}
 else if(s.sequence==='bath'){if(elapsed>=RULES.bathSeconds){place(s,'bathExit','bathExit');s.wetUntil=s.now+5;s.postBathPending=true;go(s,'center');say(s,pick(wetLines,rng));}}
 else if(s.sequence==='sit_snooze'){if(elapsed>=lengths.sit_snooze/RULES.fps){change(s,'sit_sleeploop');s.nextSpeech=s.now+20+rng()*15;}}
 else if(s.sequence==='sit_sleeploop'){
  if(elapsed>=RULES.sleepSeconds){place(s,'bedRight','bed');idle(s,rng);s.awakeUntil=s.now+75+rng()*35;say(s,band==='dawn'?pick(dawnLines,rng):'잘 잤다아.');}
  else if(s.now>=s.nextSpeech){say(s,pick(dreamLines,rng));s.nextSpeech=s.now+25+rng()*20;}
 }else if(s.sequence==='sit_idle'){
  if(elapsed>=s.wait){ground(s);s.cushionRequested=false;idle(s,rng);if(s.node==='cushion')go(s,'rug');}
  else if(s.now>=s.nextSpeech){if(rng()<.5)say(s,pick(sitLines,rng));s.nextSpeech=s.now+15+rng()*10;}
 }else if(s.sequence==='idle'){
  if(elapsed>s.wait){
   if(s.path.length){change(s,walkSequence(s.path[0][0]-s.point[0],s.path[0][1]-s.point[2]));return;}
   const choice=rng();
   if(band==='dawn'&&s.now>=s.awakeUntil&&choice<RULES.dawnSleep)sitOrSleep(s,true,rng);
   else if(band==='night'&&choice<RULES.nightSleep)sitOrSleep(s,true,rng);
   else if((band==='night'&&choice<RULES.nightSleep+RULES.nightSit)||((band==='day'||band==='afternoon')&&choice<RULES.daySit))sitOrSleep(s,false,rng);
   else{if(band==='dawn'&&rng()<.5)say(s,pick(dawnLines,rng));const nodes=Object.keys(anchors).filter(n=>n!==s.node&&n!=='bathExit'&&n!=='bathDoor'&&n!=='cushion');go(s,nodes[Math.floor(rng()*nodes.length)]);}
  }
 }else{
  const next=s.path[0];if(!next){arrive(s,rng);return;}
  const dx=next[0]-s.point[0],dz=next[1]-s.point[2],distance=Math.hypot(dx,dz),step=Math.min(dt,.1)*.55*(s.now<s.wetUntil?.65:1);
  const direction=walkSequence(dx,dz);if(direction!==s.sequence)change(s,direction);
  if(distance<=step){s.point=[next[0],0,next[1]];s.path.shift();const reached=Object.entries(anchors).find(([,p])=>p[0]===next[0]&&p[1]===next[1]);if(reached)s.node=reached[0];}else{s.point[0]+=dx/distance*step;s.point[2]+=dz/distance*step;}
 }
}
export function kstDate(date=new Date()){return new Date(date.getTime()+9*3600000).toISOString().slice(0,10);}
export type LetterCounts={date:string;dawn:number;day:number;afternoon:number;night:number};
export function readCounts(raw:string|null,date=kstDate()):LetterCounts{try{const v=JSON.parse(raw||'null');if(v?.date===date&&(['dawn','day','afternoon','night'] as const).every(k=>Number.isInteger(v[k])&&v[k]>=0&&v[k]<=2))return v;}catch{}return {date,dawn:0,day:0,afternoon:0,night:0};}




export const windowLines:Record<Band,string[]>={
 dawn:['밖이 엄청 조용하다아. 다 자나봐아.','별이 아직 남아있어어. 조금만 더 보고 잘래애.','이 시간엔 창밖도 졸려 보인다아.'],
 day:['밖에 사람들 많이 다닌다아!','오늘은 누가 작애 보러 올까아?','햇빛 때문에 밖이 반짝반짝해애.'],
 afternoon:['해가 조금씩 내려가고 있어어.','창밖 보고 있으면 시간 금방 가아.','밖에 나가진 않아도 구경하는 건 재밌어어.'],
 night:['밖에 불빛들 켜졌다아. 예쁘다아.','밤 되니까 창문이 거울처럼 보여어.','{vocativeLong}도 이거 같이 보면 좋겠다아.'],
};
