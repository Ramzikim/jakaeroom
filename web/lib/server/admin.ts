import 'server-only';
import {createClient} from '@supabase/supabase-js';
export async function authenticatedAdmin(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return {status:401 as const};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {status:503 as const};
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)return {status:401 as const};
 const {data:admin,error:lookupError}=await db.from('room_admins').select('time_band_override').eq('user_id',user.id).maybeSingle();
 if(lookupError)return {status:503 as const};
 if(!admin)return {status:403 as const};
 return {status:200 as const,db,user,admin};
}
export function sameOrigin(request:Request){
 try{const origin=new URL(request.headers.get('origin')??'');return ['http:','https:'].includes(origin.protocol)&&origin.host===request.headers.get('host');}catch{return false;}
}
