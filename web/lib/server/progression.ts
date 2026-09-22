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
  loadProgression:async():Promise<ProgressionResult>=>{
   // Read-only on the common path: no row lock, JSON receipt transfer, or UPDATE.
   const {data,error}=await db.from('user_progression').select('user_id,heart_coin_balance,last_passive_reward_at,daily_passive_earned,collected_photo_ids,collected_letter_ids,owned_gift_ids,purchased_gift_ids,daily_photo_total,daily_photo_category_counts,daily_interaction_reward_counts,progression_date,letter_state').eq('user_id',userId).maybeSingle();
   if(error)throw error;
   const today=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10);
   if(!data||data.progression_date!==today)return mutate('ensure');
   return {ok:true,newlyCollected:false,delta:0,progression:data};
  },
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
