// Disposable accounts only; no real player's progress is mutated.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {GIFT_REGISTRY} from '../lib/gifts.ts';
if(process.env.RUN_ADMIN_API_TEST!=='1')throw Error('Set RUN_ADMIN_API_TEST=1');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),ids=[];
const base=process.env.ADMIN_TEST_URL||'http://127.0.0.1:3000';
try{
 async function account(){const email=`admin-test-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'aA1!';const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!error);ids.push(data.user.id);const client=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});const login=await client.auth.signInWithPassword({email,password});assert(!login.error);return {id:data.user.id,client,headers:{Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json',Origin:base}};}
 const admin=await account(),normal=await account();
 const call=async(a,path,body)=>{const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:a.headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.text().then(t=>t?JSON.parse(t):null)};};
 assert.equal((await call(normal,'/api/admin')).data.isAdmin,false);
 assert.equal((await call(normal,'/api/admin',{band:'night',userId:admin.id})).status,403);
 assert.equal((await call(normal,'/api/progression/dev-reset',{scope:'coins',userId:admin.id})).status,403);
 assert((await normal.client.from('room_admins').insert({user_id:normal.id})).error,'cannot self-promote');
 assert((await normal.client.rpc('room_time_band',{p_user_id:admin.id})).error,'no public admin RPC');
 assert(!(await db.from('room_admins').insert({user_id:admin.id})).error);
 assert.equal((await call(admin,'/api/admin')).data.isAdmin,true);
 assert.equal((await call(admin,'/api/admin',{band:'invalid'})).status,400);
 await call(admin,'/api/progression');await call(normal,'/api/progression');
 assert(!(await db.from('user_progression').update({heart_coin_balance:3000,owned_gift_ids:['mimi_plush','singpa_plush']}).eq('user_id',admin.id)).error);
 const normalBefore=(await call(normal,'/api/progression')).data.progression;
 let expected=3000,letter=0;
 for(const band of ['dawn','day','afternoon','night']){
  assert.equal((await call(admin,'/api/admin',{band})).data.band,band);
  assert.equal((await db.rpc('room_time_band',{p_user_id:admin.id})).data,band);
  assert.equal((await call(admin,'/api/admin')).data.band,band,'persisted override');
  let reward=await call(admin,'/api/progression',{kind:'interaction',action:'pet',eventId:crypto.randomUUID()});assert.equal(reward.data.delta,5);expected+=5;
  assert.equal((await call(admin,'/api/progression',{kind:'interaction',action:'pet',eventId:crypto.randomUUID()})).data.delta,0);
  for(let i=0;i<2;i++){const r=await call(admin,'/api/letters',{action:'regular',eventId:crypto.randomUUID()});assert.equal(r.status,200);assert.equal(r.data.letterId,`letter_${String(++letter).padStart(2,'0')}`);expected+=20;}
  assert.equal((await call(admin,'/api/letters',{action:'regular',eventId:crypto.randomUUID()})).data.reason,'quota');
  const gift=GIFT_REGISTRY.find(g=>g.band===band);const bought=await call(admin,'/api/gifts',{giftId:gift.id,route:'homeshopping',band});assert.equal(bought.data.ok,true);expected-=gift.price;assert.equal(bought.data.newBalance,expected);
 }
 // Account-local date remains actual KST, despite overridden bands.
 const persisted=(await call(admin,'/api/progression')).data.progression;assert.equal(persisted.heart_coin_balance,expected);assert.equal(persisted.progression_date,normalBefore.progression_date);
 assert.deepEqual((await call(normal,'/api/progression')).data.progression,normalBefore);
 for(const band of ['day','night']){
  await call(admin,'/api/admin',{band});
  const photo=await call(admin,'/api/progression/photo',{action:'wardrobe',eventId:crypto.randomUUID()});assert(photo.data.photoId);assert.equal(photo.data.progression.daily_photo_category_counts['outfit:'+band],1);
  assert.equal((await call(admin,'/api/progression/photo',{action:'wardrobe',eventId:crypto.randomUUID()})).data.photoId,null);
 }
 // Reset affects only the authenticated admin even if another ID is supplied.
 for(const scope of ['letters','collection','coins'])assert.equal((await call(admin,'/api/progression/dev-reset',{scope,userId:normal.id})).status,200);
 const reset=(await call(admin,'/api/progression')).data.progression;assert.equal(reset.heart_coin_balance,0);assert.equal(reset.collected_letter_ids.length,0);assert.equal(reset.collected_photo_ids.length,0);
 assert.deepEqual((await call(normal,'/api/progression')).data.progression,normalBefore);
 assert.equal((await call(admin,'/api/admin',{band:null})).data.band,null);
 assert.equal((await db.rpc('room_time_band',{p_user_id:admin.id})).data,(await db.rpc('room_time_band',{p_user_id:normal.id})).data);
 console.log('PASS: admin-only access, RLS, spoofing rejection, four persisted bands, rewards, letter quotas/sequence, photo band caps, shopping, real KST date, own-only resets, automatic restore');
}finally{for(const id of ids){const removed=await db.auth.admin.deleteUser(id);assert(!removed.error,'test cleanup failed');}console.log('Disposable test accounts removed');}
