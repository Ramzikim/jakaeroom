import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base='https://jakaeroom.vercel.app';let id;
try{
 const password=crypto.randomUUID()+'Aa1!',email=`admin-deploy-${crypto.randomUUID()}@example.com`;
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error);id=created.data.user.id;
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email,password});assert(!login.error);
 const headers={Authorization:`Bearer ${login.data.session.access_token}`,Origin:base,'Content-Type':'application/json'};
 async function call(path,body){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>null)};}
 assert.equal((await call('/api/admin')).data.isAdmin,false);
 assert.equal((await call('/api/admin',{band:'night'})).status,403);
 assert.equal((await call('/api/progression/dev-reset',{scope:'coins'})).status,403);
 assert(!(await db.from('room_admins').insert({user_id:id})).error);
 assert.equal((await call('/api/admin')).data.isAdmin,true);
 assert.equal((await call('/api/admin',{band:'night'})).data.band,'night');
 assert.equal((await db.rpc('room_time_band',{p_user_id:id})).data,'night');
 assert.equal((await call('/api/admin',{band:null})).data.band,null);
 assert.equal((await call('/api/progression/dev-reset',{scope:'coins'})).status,200);
 console.log('PASS: live admin authentication, non-admin denial, persisted band override, automatic restore, own reset API');
}finally{if(id){const cleanup=await db.auth.admin.deleteUser(id);assert(!cleanup.error);console.log('Disposable account removed');}}
