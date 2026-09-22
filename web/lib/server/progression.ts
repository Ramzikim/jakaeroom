import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {HEART_COIN,type ProgressionResult,type RewardReason} from '../progression';
import {giftsFor} from './gifts';

function database(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Progression database is not configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
// Call only with an identity verified by auth.getUser, never a request-body userId.
export function progressionFor(userId:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))throw new Error('Authenticated user ID required');
 const db=database();
 const mutate=async(action:string,args:Record<string,string|number|boolean>={}):Promise<ProgressionResult>=>{
  const {data,error}=await db.rpc('mutate_progression',{p_user_id:userId,p_action:action,...args});
  if(error)throw error;return data as ProgressionResult;
 };
 return {
  ensureProgression:()=>mutate('ensure'),
  loadProgression:()=>mutate('ensure'),
  resetDailyCountersIfNeeded:()=>mutate('reset'),
  addHeartCoins:(amount:number,reason:RewardReason)=>{
   const expected=reason.kind==='daily_login'?HEART_COIN.dailyLogin:reason.kind==='passive'?HEART_COIN.passiveReward:HEART_COIN.interaction;
   if(amount!==expected)throw new Error('Invalid reward amount');
   return mutate('add',{p_amount:amount,p_reason:reason.kind,...(reason.kind==='interaction'?{p_event_id:reason.eventId,p_category:reason.category||'general'}:{})});
  },
  // Stable event IDs are mandatory: retrying a successful spend never debits twice.
  spendHeartCoins:(amount:number,eventId:string)=>mutate('spend',{p_amount:amount,p_event_id:eventId}),
  collectPhoto:(photoId:string,category='general')=>mutate('photo',{p_item_id:photoId,p_category:category}),
  collectLetter:async(letterId:string,isSpecial:boolean)=>{
   const result=await mutate('letter',{p_item_id:letterId,p_special:isSpecial});
   // Reevaluate even on retries: collection can succeed before a transient grant failure.
   if(result.ok){const gift=await giftsFor(userId).evaluateLetterCompletionGift();if(gift.ok)result.progression.owned_gift_ids=gift.ownedGiftIds;}
   return result;
  },
  ownGift:(giftId:string)=>mutate('own_gift',{p_item_id:giftId}),
  markGiftPurchased:(giftId:string)=>mutate('purchase_gift',{p_item_id:giftId}),
 };
}
export const loadProgression=(userId:string)=>progressionFor(userId).loadProgression();
export const ensureProgression=(userId:string)=>progressionFor(userId).ensureProgression();
