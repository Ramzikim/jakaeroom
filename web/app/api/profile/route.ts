import {createClient} from '@supabase/supabase-js';
import {makeProfile,parseProfile} from '../../profile';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function handle(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:'계정 저장 설정을 준비 중이에요. 게스트로 이용할 수 있어요.'},503);
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return json({error:'로그인이 필요해요.'},401);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user){console.warn('Profile authentication failed',{status:authError?.status,code:authError?.code,message:authError?.message});return json({error:'다시 로그인해 주세요.'},401);}
 try{
  // Verified auth identity owns the data. Relationship tiers are cosmetic profile metadata only.
  const {data:existing,error}=await db.from('profiles').select('*').eq('userId',user.id).maybeSingle();
  if(error)throw error;
  if(request.method==='GET'&&!existing)return json({profile:null});
  let input;
  if(request.method==='PUT'){
   if(Number(request.headers.get('content-length')||0)>4096)return json({error:'입력이 너무 길어요.'},413);
   try{input=parseProfile(await request.json());}catch(e){return json({error:e instanceof Error?e.message:'입력을 확인해 주세요.'},400);}
  }else input=parseProfile(existing);
  // Guest migration never overwrites an existing account profile, including a race in another tab.
  const migration=request.headers.get('x-guest-migration')==='1';
  if(migration&&existing)input=parseProfile(existing);
  const profile=makeProfile(input,user.id,existing?.createdAt);
  const {vipVocativePool,...storedProfile}=profile;
  const {error:saveError}=await db.from('profiles').upsert(storedProfile,{onConflict:'userId',ignoreDuplicates:migration});
  if(saveError)throw saveError;
  if(migration){const {data,error}=await db.from('profiles').select('*').eq('userId',user.id).single();if(error)throw error;return json({profile:makeProfile(parseProfile(data),user.id,data.createdAt)});}
  return json({profile});
 }catch{return json({error:'프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'},503);}
}
export const GET=handle;
export const PUT=handle;
