// Explicit opt-in: creates one disposable auth account and deletes it in finally.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
if(process.env.RUN_COIN_API_TEST!=='1')throw Error('Set RUN_COIN_API_TEST=1 for the disposable-account test');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const email=`coin-test-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'aA1!';
let userId;
try{
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error,`test user creation: ${created.error?.message}`);userId=created.data.user.id;
 const account=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await account.auth.signInWithPassword({email,password});assert(!login.error,'test sign in');
 const headers={Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json'};
 const call=async(input)=>{const response=await fetch('http://127.0.0.1:3000/api/progression',{method:'POST',headers,body:JSON.stringify({eventId:crypto.randomUUID(),...input})});assert.equal(response.status,200);return response.json();};
 const initial=await fetch('http://127.0.0.1:3000/api/progression',{headers}).then(r=>r.json());assert.equal(initial.progression.heart_coin_balance,0);
 assert.equal((await call({kind:'daily_login'})).delta,30);assert.equal((await call({kind:'daily_login'})).delta,0);
 const eventId=crypto.randomUUID();const simultaneous=await Promise.all([call({kind:'interaction',action:'pet',eventId}),call({kind:'interaction',action:'pet',eventId})]);assert.equal(simultaneous.reduce((s,r)=>s+r.delta,0),5);
 assert.equal((await call({kind:'interaction',action:'pet'})).delta,0,'new event cannot bypass band cap');
 for(const action of ['bath','berry','tv','game','cushion','bed','window']){assert.equal((await call({kind:'interaction',action})).delta,5);assert.equal((await call({kind:'interaction',action})).delta,0);}
 assert.equal((await call({kind:'interaction',action:'basketBerry'})).delta,0,'basket shares food allowance');
 assert.equal((await call({kind:'letter',letterId:'letter_01'})).delta,20);assert.equal((await call({kind:'letter',letterId:'letter_01'})).delta,0);
 assert.equal((await call({kind:'passive'})).delta,0);
 const update=await db.from('user_progression').update({last_passive_reward_at:new Date(Date.now()-301000).toISOString()}).eq('user_id',userId);assert(!update.error);
 assert.equal((await call({kind:'passive'})).delta,10);
 const fresh=await fetch('http://127.0.0.1:3000/api/progression',{headers}).then(r=>r.json());assert.equal(fresh.progression.heart_coin_balance,100);
 const special=await db.rpc('mutate_progression',{p_user_id:userId,p_action:'letter',p_item_id:'special_test',p_special:true});assert(!special.error);assert.equal(special.data.delta,20);
 const photo=await db.rpc('mutate_progression',{p_user_id:userId,p_action:'photo',p_item_id:'photo_test'});assert(!photo.error);assert.equal(photo.data.delta,30);
 const photoRetry=await db.rpc('mutate_progression',{p_user_id:userId,p_action:'photo',p_item_id:'photo_test'});assert.equal(photoRetry.data.delta,0);
 const yesterday=new Date(Date.now()+9*3600000-86400000).toISOString().slice(0,10);
 assert(!(await db.from('user_progression').update({progression_date:yesterday}).eq('user_id',userId)).error);
 assert.equal((await call({kind:'interaction',action:'pet'})).delta,5,'KST daily reset');
 assert.equal((await fetch('http://127.0.0.1:3000/api/progression',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 console.log('PASS: initial state, login dedupe, concurrent event dedupe, 8 interactions, letter dedupe, passive eligibility, persisted balance, guest rejection');
}finally{if(userId){const removed=await db.auth.admin.deleteUser(userId);assert(!removed.error,'test user cleanup');console.log('Disposable account removed');}}
