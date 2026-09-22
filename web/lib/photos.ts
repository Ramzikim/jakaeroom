import catalog from './photo-catalog.json' with {type:'json'};
export type PhotoCategory='hug'|'food'|'outfit'|'window'|'happy';
export type Photo={id:string;category:PhotoCategory;assetPath:string;title?:string;available:boolean};
export const PHOTO_CATEGORIES:readonly PhotoCategory[]=['hug','food','outfit','window','happy'];
export const PHOTO_RULES={globalDailyCap:10,caps:{hug:1,food:1,outfit:2,window:2,happy:6},chance:{hug:.35,food:.35,outfit:1,window:.35,happy:.35}} as const;
export const PHOTO_REGISTRY:readonly Photo[]=catalog as Photo[];
export const STANDARD_PHOTOS=PHOTO_REGISTRY.filter(p=>p.category!=='hug');
export const standardPhotoCount=(ids:readonly string[])=>STANDARD_PHOTOS.filter(p=>ids.includes(p.id)).length;
export const visiblePhotos=(ids:readonly string[],vip:boolean)=>[...STANDARD_PHOTOS,...(vip?ids.map(id=>PHOTO_REGISTRY.find(p=>p.id===id&&p.category==='hug')).filter((p):p is Photo=>!!p).filter((p,i,a)=>a.findIndex(v=>v.id===p.id)===i):[])];
export const HUG_REACTIONS=['안아줘서 기분 좋다아!','(포옥...)','나 말랑하지이.'] as const;
export type PhotoAction='pet'|'hug'|'food'|'wardrobe'|'drawer'|'window'|'tv'|'game'|'cushion'|'walk'|'idle'|'bath'|'sleep';
export const PHOTO_ACTIONS:readonly PhotoAction[]=['pet','hug','food','wardrobe','drawer','window','tv','game','cushion','walk','idle','bath','sleep'];
export function photoCategoriesFor(action:PhotoAction):PhotoCategory[]{
 if(action==='sleep')return [];
 const primary:Partial<Record<PhotoAction,PhotoCategory>>={pet:'hug',hug:'hug',food:'food',wardrobe:'outfit',window:'window'};
 return action==='wardrobe'?['outfit']:primary[action]?[primary[action]!,'happy']:['happy'];
}
export const PROP_MESSAGES={wardrobe:['어떤 옷이 어울리는지 찾고 있어어.','새로운 옷도 입어보고 싶다아!'],drawer:['함께 한 추억을 찾아보고 있어!','(작애가 좋아하는 딸기쿠키 포장지가 있다.)','(지난 번 야시장에서 사 온 구름장난감이 놓여 있다.)','(광장의 공연 팸플릿이 놓여 있다.)','(낡고 작은 컵이 놓여 있다.)']} as const;
export function photoPropMessage(action:'wardrobe'|'drawer',ids:readonly string[]){
 const category=action==='wardrobe'?'outfit':'happy',complete=PHOTO_REGISTRY.filter(p=>p.category===category).every(p=>ids.includes(p.id));
 if(action==='wardrobe'&&complete)return '작애 옷 입은 사진 어땠어? 새로운 사진도 기대해줘!';
 const pool:string[]=[...PROP_MESSAGES[action]];
 if(action==='drawer'&&complete)pool.push('작애와 더 많은 추억을 쌓아줄래? 그럼 새로운 사진도 생길거야!');
 return pool[Math.floor(Math.random()*pool.length)];
}
export function availablePhotoCatalog(){return PHOTO_REGISTRY.filter(p=>p.available).map(p=>({id:p.id,category:p.category}));}
// Only genuine animation transitions qualify; refusals remain idle and never roll.
export function photoActionForSequence(sequence:string,previous:string,pending:string|null,context:{cushionRequested?:boolean;media?:string|null}={}):PhotoAction|null{
 if(pending==='sleep'||sequence.startsWith('sit_sleep')||sequence==='sit_snooze'||previous==='sit_snooze'||previous==='sit_sleeploop')return null;
 // Walking rewards originate only from an accepted floor command, never autonomous transitions.
 if(sequence.includes('walk'))return null;
 if(sequence==='sit_idle')return context.media==='tv'?'tv':context.cushionRequested?'cushion':null;
 const actions:Record<string,PhotoAction>={hop:'pet',shy:'pet',strawberry:'food',window:'window',game:'game',sit_idle:'cushion',bath:'bath'};
 return actions[sequence]??null;
}
