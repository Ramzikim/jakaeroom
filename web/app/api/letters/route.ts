import {createClient} from '@supabase/supabase-js';
import {letterEvent} from '../../../lib/server/letters';
import type {LetterAction} from '../../../lib/letter-rules';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return json({error:'authentication_required'},401);
 let input:{action:LetterAction;eventId:string;letterId?:string;clickedAt?:number};
 try{const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);
  if(!['load','regular','reread','drawer','interrupt','pet','sleep','sleep_end','awake'].includes(input.action)||typeof input.eventId!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.eventId))throw Error();
  if(input.clickedAt!==undefined&&(!Number.isFinite(input.clickedAt)||input.clickedAt<Date.now()-120_000||input.clickedAt>Date.now()+2_000))throw Error();
  if(input.letterId!==undefined&&typeof input.letterId!=='string')throw Error();
 }catch{return json({error:'invalid_request'},400);}
 try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return json({error:'authentication_required'},401);
  return json(await letterEvent(user.id,input.action,['load','awake','sleep'].includes(input.action)?'':input.eventId,input.letterId,input.action==='drawer'?input.clickedAt:undefined));
 }catch{return json({error:'letters_unavailable'},503);}
}
