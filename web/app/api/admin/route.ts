import {authenticatedAdmin,sameOrigin} from '../../../lib/server/admin';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 try{const auth=await authenticatedAdmin(request);if(auth.status!==200)return json({isAdmin:false},auth.status===403||auth.status===401?200:auth.status);
 return json({isAdmin:true,band:auth.admin.time_band_override});
 }catch{return json({isAdmin:false},503);}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'forbidden'},403);
 try{const auth=await authenticatedAdmin(request);if(auth.status!==200)return json({error:'forbidden'},auth.status);
 const raw=await request.text();if(raw.length>128)return json({error:'invalid_request'},400);
 let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid_request'},400);}
 if(!input||!(input.band===null||['dawn','day','afternoon','night'].includes(input.band)))return json({error:'invalid_request'},400);
 const {error}=await auth.db.from('room_admins').update({time_band_override:input.band,updated_at:new Date().toISOString()}).eq('user_id',auth.user.id);if(error)throw error;
 return json({isAdmin:true,band:input.band});
 }catch{return json({error:'admin_unavailable'},503);}
}
