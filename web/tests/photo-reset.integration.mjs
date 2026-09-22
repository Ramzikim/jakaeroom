// Disposable account only; never reset a real user's progression.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
if(process.env.RUN_PHOTO_RESET_TEST!=='1')throw Error('Explicit test opt-in required');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const email=`photo-reset-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'aA1!';let userId;
try{
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 const account=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await account.auth.signInWithPassword({email,password});assert(!login.error);
 const headers={Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json',Origin:'http://127.0.0.1:3000'};
 const post=async(path,body)=>{const r=await fetch(`http://127.0.0.1:3000${path}`,{method:'POST',headers,body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const photo=action=>post('/api/progression/photo',{action,eventId:crypto.randomUUID()});
 const reset=scope=>post('/api/progression/dev-reset',{scope});
 const state=async()=>{const r=await account.from('user_progression').select('*').eq('user_id',userId).single();assert(!r.error);return r.data;};
 const outfit=await photo('wardrobe');assert.equal(outfit.category,'outfit');assert.equal(outfit.delta,30);
 assert.equal((await photo('wardrobe')).photoId,null);
 const drawer=await photo('drawer');assert.equal(drawer.category,'happy');assert.equal(drawer.delta,30,'first drawer bypasses throttle');
 const letter=await post('/api/letters',{action:'regular',eventId:crypto.randomUUID()});assert.equal(letter.letterId,'letter_01');
 await reset('letters');assert.deepEqual((await state()).collected_letter_ids,[]);assert.deepEqual((await state()).letter_state.counts,{});assert.equal((await state()).collected_photo_ids.length,2);
 await reset('collection');assert.deepEqual((await state()).collected_photo_ids,[]);assert.equal((await state()).daily_photo_total,0);assert.deepEqual((await state()).daily_photo_category_counts,{});
 await reset('coins');assert.equal((await state()).heart_coin_balance,0);
 assert.equal((await photo('wardrobe')).delta,30);assert.equal((await photo('drawer')).delta,30);
 const forbidden=await fetch('http://127.0.0.1:3000/api/progression/dev-reset',{method:'POST',headers:{...headers,Origin:'http://untrusted.test'},body:'{"scope":"coins"}'});assert.equal(forbidden.status,403);assert.equal((await state()).heart_coin_balance,60);
 console.log('PASS live API: wardrobe/drawer first photo, wardrobe repeat blocked, all 3 reset scopes, re-acquisition after reset, balance +30, wrong origin denied');
}finally{if(userId){const cleanup=await db.auth.admin.deleteUser(userId);assert(!cleanup.error);console.log('Disposable account removed');}}
