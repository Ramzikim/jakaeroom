import {authenticatedAdmin,sameOrigin} from '../../../../lib/server/admin';
export async function POST(request:Request){
 if(!sameOrigin(request))return new Response(null,{status:403});
 try{
  const auth=await authenticatedAdmin(request);if(auth.status!==200)return new Response(null,{status:auth.status});
  const raw=await request.text();if(raw.length>128)return new Response(null,{status:400});
  let input;try{input=JSON.parse(raw);}catch{return new Response(null,{status:400});}
  if(!input||!['letters','collection','coins'].includes(input.scope))return new Response(null,{status:400});
  const result=await auth.db.rpc('reset_progression_dev',{p_user_id:auth.user.id,p_scope:input.scope});
  if(result.error)throw result.error;
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'reset_unavailable'},{status:503});}
}
