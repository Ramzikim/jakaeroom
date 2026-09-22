import {createClient} from '@supabase/supabase-js';
import {PHOTO_ACTIONS,type PhotoAction} from '../../../../lib/photos';
import {attemptPhotoDrop} from '../../../../lib/server/photos';
import {loadProgression} from '../../../../lib/server/progression';
export async function POST(request:Request){
 const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return json({error:'authentication_required'},401);
 if(Number(request.headers.get('content-length')||0)>1024)return json({error:'invalid_request'},400);
 let input:{action?:PhotoAction;eventId?:string};
 try{const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);
 if(!input||!PHOTO_ACTIONS.includes(input.action!)||typeof input.eventId!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.eventId))throw Error();
 }catch{return json({error:'invalid_request'},400);}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return json({error:'progression_unavailable'},503);
 try{const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)return json({error:'authentication_required'},401);
 const drop=await attemptPhotoDrop(user.id,input.action!,input.eventId!);
 const state=await loadProgression(user.id);
 return json({...drop,progression:state.progression});
 }catch{return json({error:'progression_unavailable'},503);}
}
