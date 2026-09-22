import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {PHOTO_RULES,availablePhotoCatalog,type PhotoAction,type PhotoCategory} from '../photos';
export type PhotoDropResult={photoId:string|null;category?:PhotoCategory;delta:number;newlyCollected?:boolean;reason?:string};
export async function attemptPhotoDrop(userId:string,action:PhotoAction,eventId:string):Promise<PhotoDropResult>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Progression database is not configured');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.rpc('acquire_photo_album',{p_user_id:userId,p_action:action,p_event_id:eventId,p_catalog:availablePhotoCatalog(),p_chances:PHOTO_RULES.chance});
 if(error)throw error;return data as PhotoDropResult;
}
