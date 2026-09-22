import type {Band} from '../app/behavior.ts';
import {letters} from '../app/letters.ts';

export type GiftSource='cabinet_order'|'homeshopping'|'letter_completion';
export type Gift={id:string;name:string;acquisitionType:GiftSource;price:number|null;band:Band|null;imagePath:string;isPurchasable:boolean};
export const GIFT_REGISTRY:readonly Gift[]=[
 {id:'mimi_plush',imagePath:'/gifts/gift_01.png',name:'미미',acquisitionType:'cabinet_order',price:100,band:null,isPurchasable:true},
 {id:'singpa_plush',imagePath:'/gifts/gift_02.png',name:'싱파',acquisitionType:'cabinet_order',price:180,band:null,isPurchasable:true},
 {id:'somi_goods',imagePath:'/gifts/gift_03.png',name:'솜이',acquisitionType:'homeshopping',price:300,band:'day',isPurchasable:true},
 {id:'lightning_knight_figure',imagePath:'/gifts/gift_04.png',name:'번개기사',acquisitionType:'homeshopping',price:420,band:'afternoon',isPurchasable:true},
 {id:'starlight_sleep_lamp',imagePath:'/gifts/gift_05.png',name:'별빛무드등',acquisitionType:'homeshopping',price:600,band:'night',isPurchasable:true},
 {id:'strawberry_tower',imagePath:'/gifts/gift_06.png',name:'딸기타워',acquisitionType:'homeshopping',price:800,band:'dawn',isPurchasable:true},
 {id:'starlight_mailbox',imagePath:'/gifts/gift_07.png',name:'별빛편지함',acquisitionType:'letter_completion',price:null,band:null,isPurchasable:false},
];
export const getGiftById=(id:string)=>GIFT_REGISTRY.find(g=>g.id===id);
export const getHomeshoppingGiftForBand=(band:Band)=>GIFT_REGISTRY.find(g=>g.acquisitionType==='homeshopping'&&g.band===band);
export const getPurchasableGiftIds=()=>GIFT_REGISTRY.filter(g=>g.isPurchasable).map(g=>g.id);
export const REGULAR_LETTER_IDS=letters.filter(l=>!l.isSpecial).map(l=>l.id);
export const hasAllRegularLetters=(collected:readonly string[])=>REGULAR_LETTER_IDS.length===28&&REGULAR_LETTER_IDS.every(id=>collected.includes(id));
export type HomeshoppingBandState={viewCount:number;shown:boolean;lastSeenGiftId:string|null};
export type GiftState={newBalance:number;ownedGiftIds:string[];purchasedGiftIds:string[];hasAllRegularLetters:boolean;homeshoppingDate:string;homeshopping:Partial<Record<Band,HomeshoppingBandState>>};
export type GiftFailure='authentication_required'|'unavailable'|'unknown_gift'|'not_purchasable'|'wrong_route'|'wrong_band'|'insufficient_funds'|'already_owned'|'letters_incomplete'|'invalid_request'|'shopping_locked';
export type GiftResult=({ok:true;reason:'purchased'|'granted'|'already_granted'|'eligible'|'state'|'recorded'|'shown';giftId:string|null;shouldForce?:boolean}&GiftState)|{ok:false;reason:GiftFailure;giftId:string|null};

export const shoppingUnlocked=(owned:readonly string[])=>GIFT_REGISTRY.filter(g=>g.acquisitionType==='cabinet_order').every(g=>owned.includes(g.id));
export function selectShoppingGift(owned:readonly string[],band:Band,rng=Math.random){
 const gift=getHomeshoppingGiftForBand(band);
 return shoppingUnlocked(owned)&&gift&&!owned.includes(gift.id)&&rng()<.30?gift:null;
}
export const SHOPPING_REACTIONS=['우와아, 저거 갖고 싶다아.','작애 저거 좋아아...','저거 방에 두면 예쁘겠다아.','헤헤... 저거 사주면 안 돼애?','작애 저거 진짜 마음에 들어어.','우와, 저거 작애 거 하면 안 돼애?','작애 저거 갖고 싶어어.','저거 있으면 작애 방 더 좋아질 것 같아아.'];
export const GIFT_COPY:Record<string,{hint:string;description:string;script?:string}>={
 mimi_plush:{hint:'',description:'작애랑 같이 지내는 조그마한 친구.\n심심할 때 옆에 앉혀놓고 같이 놀아요.'},
 singpa_plush:{hint:'',description:'작애가 좋아하는 알록달록한 친구.\n보고 있으면 괜히 같이 신나지는 것 같아요.'},
 somi_goods:{hint:'낮에 TV를 잘 살펴봐요!',description:'작애가 좋아하는 게임 ‘아기동물농장’에 나오는 양 캐릭터.\n작애가 게임할 때마다 꼭 찾아보는 최애 친구예요.',script:'아기동물농장의 인기 스타, 솜이가 찾아왔습니다! 폭신한 귀여움에 마음까지 사르르! 작애의 최애 친구를 만날 기회, 지금 바로 주문하세요!'},
 lightning_knight_figure:{hint:'해가 기울 무렵 TV를 켜보세요.',description:'반짝이는 갑옷을 입은 용감한 햄스터 기사.\n작애는 진짜 엄청 강하다고 믿고 있어요.',script:'작지만 용감하다! 반짝이는 갑옷의 번개기사가 등장했습니다! 장식장을 지켜줄 든든한 햄스터 영웅, 지금 바로 주문하세요!'},
 starlight_sleep_lamp:{hint:'밤에는 특별한 상품이 방송될지도 몰라요.',description:'밤마다 포근한 별빛을 켜주는 작은 무드등.\n작애가 잠들기 전에 가끔 멍하니 바라봐요.',script:'별 하나를 방 안에 담았습니다! 포근한 빛으로 밤을 감싸주는 별빛무드등! 꿈나라까지 반짝이는 특별한 선물, 지금 바로 주문하세요!'},
 strawberry_tower:{hint:'모두 잠든 늦은 시간, TV를 확인해보세요.',description:'딸기가 한가득 쌓인 작애의 꿈 같은 간식.\n작애 기준으로는 거의 보물이에요.',script:'딸기 위에 딸기, 또 딸기! 작애의 꿈이 높이 쌓인 딸기타워입니다! 보기만 해도 행복이 넘치는 달콤한 보물, 지금 바로 주문하세요!'},
 starlight_mailbox:{hint:'작애의 편지를 끝까지 모아보세요.',description:'작애가 보낸 마음을 차곡차곡 담아두는 특별한 편지함.\n오래 기다린 만큼 더 소중해요.'},
};
