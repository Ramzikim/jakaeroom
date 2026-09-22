import 'server-only';
import {createClient} from '@supabase/supabase-js';
import type {Band} from '../../app/behavior';
import {GIFT_REGISTRY,REGULAR_LETTER_IDS,getHomeshoppingGiftForBand,getPurchasableGiftIds,shoppingUnlocked,type GiftSource,type GiftResult} from '../gifts';

// Server-only. userId must come from auth.getUser, never from a request body.
// Prices and ownership mutations remain in the existing atomic RPC.
export function giftsFor(userId:string|null){
 const run=async(action:string,giftId:string|null=null,band:Band|null=null,eventId:string|null=null,source:GiftSource|null=null):Promise<GiftResult>=>{
  if(!userId)return {ok:false,reason:'authentication_required',giftId};
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))return {ok:false,reason:'authentication_required',giftId};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return {ok:false,reason:'unavailable',giftId};
  try{
   const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   if(source==='homeshopping'&&(action==='purchase'||action==='can_purchase')){const state=await run('state');if(!state.ok)return state;if(!shoppingUnlocked(state.ownedGiftIds))return {ok:false,reason:'shopping_locked',giftId};}
   const {data,error}=await db.rpc('gift_gameplay',{p_user_id:userId,p_action:action,p_gift_id:giftId,p_band:band,p_event_id:eventId,p_source:source,p_catalog:GIFT_REGISTRY,p_regular_letters:REGULAR_LETTER_IDS});
   if(error){if(process.env.NODE_ENV==='development')console.warn('Gift persistence failed',error.code,error.message);return {ok:false,reason:'unavailable',giftId};}
   return data as GiftResult;
  }catch{return {ok:false,reason:'unavailable',giftId};}
 };
 const load=()=>run('state');
 return {
  load,
  ownsGift:async(id:string)=>{const s=await load();return s.ok&&s.ownedGiftIds.includes(id);},
  isGiftPurchased:async(id:string)=>{const s=await load();return s.ok&&s.purchasedGiftIds.includes(id);},
  getOwnedGiftIds:async()=>{const s=await load();return s.ok?s.ownedGiftIds:[];},
  getPurchasableGiftIds,
  getUnownedPurchasableGiftIds:async()=>{const s=await load();return s.ok?getPurchasableGiftIds().filter(id=>!s.ownedGiftIds.includes(id)&&!s.purchasedGiftIds.includes(id)):[];},
  grantGift:(id:string,source:GiftSource)=>run('grant',id,null,null,source),
  purchaseGift:(id:string)=>run('purchase',id,null,null,'cabinet_order'),
  getHomeshoppingGiftForBand,
  canPurchaseHomeshoppingGift:(id:string,band:Band)=>run('can_purchase',id,band,null,'homeshopping'),
  purchaseHomeshoppingGift:(id:string,band:Band)=>run('purchase',id,band,null,'homeshopping'),
  // Reuse eventId when retrying the same TV view. Call before markHomeshoppingShown.
  recordEligibleTvView:(band:Band,eventId:string)=>run('tv_view',null,band,eventId),
  // Query BEFORE recording the upcoming view: three previous misses => force fourth.
  shouldForceHomeshopping:async(band:Band)=>{const s=await run('pity',null,band);return s.ok&&s.shouldForce===true;},
  markHomeshoppingShown:(band:Band)=>run('shown',null,band),
  resetHomeshoppingDailyStateIfNeeded:()=>run('reset'),
  hasAllRegularLetters:async()=>{const s=await load();return s.ok&&s.hasAllRegularLetters;},
  evaluateLetterCompletionGift:()=>run('completion'),
 };
}
