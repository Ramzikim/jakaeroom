import {createClient} from '@supabase/supabase-js';
import {loadProgression,progressionFor} from '../../../lib/server/progression';
import {HEART_COIN} from '../../../lib/progression';
import {REWARD_ACTIONS} from '../../../lib/reward-actions';
import {letters} from '../../letters';
import {letterEvent} from '../../../lib/server/letters';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return json({error:'authentication_required'},401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:'progression_unavailable'},503);
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)return json({error:'authentication_required'},401);
  return json(await loadProgression(user.id));
 }catch{return json({error:'progression_unavailable'},503);}
}
export async function POST(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return json({error:'authentication_required'},401);
 let input:{kind:string;eventId:string;action?:string;letterId?:string};
 try{const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);
  if(!input||!['daily_login','passive','interaction','letter'].includes(input.kind)||typeof input.eventId!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.eventId))throw Error();
  if(input.kind==='interaction'&&!REWARD_ACTIONS.some(action=>action===input.action))throw Error();
  if(input.kind==='letter'&&!letters.some(letter=>letter.id===input.letterId))throw Error();
 }catch{return json({error:'invalid_request'},400);}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:'progression_unavailable'},503);
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return json({error:'authentication_required'},401);
  const progression=progressionFor(user.id);
  if(input.kind==='letter'){
   const stored=await progression.loadProgression();
   return json(await letterEvent(user.id,stored.progression.collected_letter_ids.includes(input.letterId!)?'reread':'regular',input.eventId,input.letterId));
  }
  if(input.kind==='interaction')return json(await progression.addHeartCoins(HEART_COIN.interaction,{kind:'interaction',eventId:input.eventId,category:input.action}));
  const kind=input.kind as 'daily_login'|'passive';
  return json(await progression.addHeartCoins(kind==='daily_login'?HEART_COIN.dailyLogin:HEART_COIN.passiveReward,{kind}));
 }catch{return json({error:'progression_unavailable'},503);}
}
