import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {classifyVip,parseProfile} from '../../app/profile';
import {advanceLetters,emptyLetterState,type LetterAction} from '../letter-rules';
import {hasAllRegularLetters} from '../gifts';
import {progressionFor} from './progression';
import {giftsFor} from './gifts';
import type {ProgressionResult} from '../progression';
export type LetterResult=ProgressionResult & {letterId:string|null;reason?:string|null;duplicate?:boolean};
// userId must come from auth.getUser, never from request JSON.
export async function letterEvent(userId:string,action:LetterAction,eventId:string,rereadId?:string,clickedAt?:number):Promise<LetterResult>{
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const [profileResult,bandResult,initial]=await Promise.all([
  db.from('profiles').select('nickname,gender,birthYear').eq('userId',userId).maybeSingle(),
  db.rpc('room_time_band',{p_user_id:userId}),progressionFor(userId).loadProgression(),
 ]);
 if(profileResult.error)throw profileResult.error;if(bandResult.error)throw bandResult.error;
 const profile=profileResult.data,band=bandResult.data;
 const tier=profile?classifyVip(parseProfile(profile)):'normal';
 for(let attempt=0;attempt<12;attempt++){
  const loaded=attempt===0?initial:await progressionFor(userId).loadProgression();
  const state=loaded.progression.letter_state??emptyLetterState();
  const next=advanceLetters(state,loaded.progression.collected_letter_ids,action,Date.now(),tier,rereadId,band,clickedAt);
  const needsMailbox=hasAllRegularLetters(next.owned)&&!loaded.progression.owned_gift_ids.includes('starlight_mailbox');
  if(!next.grants.length&&!needsMailbox&&JSON.stringify(next.state)===JSON.stringify(state)&&JSON.stringify(next.owned)===JSON.stringify(loaded.progression.collected_letter_ids))return {...loaded,letterId:next.letterId,reason:next.reason};
  const {data,error}=await db.rpc('commit_letter_event',{p_user_id:userId,p_version:state.version,p_state:next.state,p_grants:next.grants,p_event_id:eventId,p_letter_id:next.letterId});
  if(error)throw error;if(data.conflict)continue;
  const result=data as LetterResult;
  // Reevaluate on reload/retry too, using the existing 28/28 gift helper.
  if(hasAllRegularLetters(result.progression.collected_letter_ids)&&!result.progression.owned_gift_ids.includes('starlight_mailbox')){
   const gift=await giftsFor(userId).evaluateLetterCompletionGift();if(!gift.ok)throw Error('Letter completion gift unavailable');result.progression.owned_gift_ids=gift.ownedGiftIds;
  }
  return {...result,reason:result.duplicate?null:next.reason};
 }
 throw Error('Concurrent letter update; retry with the same event ID');
}
