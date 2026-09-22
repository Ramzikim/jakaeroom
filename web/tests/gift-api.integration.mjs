// Explicit disposable-account validation; never modifies a real player's state.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {GIFT_REGISTRY,REGULAR_LETTER_IDS} from '../lib/gifts.ts';
if(process.env.RUN_GIFT_API_TEST!=='1')throw Error('Set RUN_GIFT_API_TEST=1');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let userId;
try{
 const email=`gift-test-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'aA1!';
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email,password});assert(!login.error);
 const headers={Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json'};
 const state=async()=>{const r=await fetch('http://127.0.0.1:3000/api/progression',{headers});assert.equal(r.status,200);return (await r.json()).progression;};
 const buy=async(giftId,route='cabinet_order',band)=>{const r=await fetch('http://127.0.0.1:3000/api/gifts',{method:'POST',headers,body:JSON.stringify({giftId,route,band})});assert.equal(r.status,200);return r.json();};
 await state();assert.equal((await buy('mimi_plush')).reason,'insufficient_funds');assert.equal((await state()).heart_coin_balance,0);
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'numeric',minute:'numeric',hourCycle:'h23'}).format(new Date()).split(':')[0]);
 const minute=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',minute:'numeric'}).format(new Date()));const h=hour+minute/60;
 const band=h>=6&&h<16?'day':h>=16&&h<18.5?'afternoon':h>=18.5&&h<23?'night':'dawn';
 const ad=GIFT_REGISTRY.find(g=>g.band===band);
 assert.equal((await buy(ad.id,'homeshopping',band)).reason,'shopping_locked');
 assert(!(await db.from('user_progression').update({heart_coin_balance:3000}).eq('user_id',userId)).error);
 const concurrent=await Promise.all([buy('mimi_plush'),buy('mimi_plush')]);assert.equal(concurrent.filter(r=>r.ok).length,1);assert.equal(concurrent.find(r=>!r.ok).reason,'already_owned');assert.equal((await state()).heart_coin_balance,2900);
 const second=await buy('singpa_plush');assert(second.ok);assert.equal(second.newBalance,2720);assert(second.ownedGiftIds.includes('mimi_plush'));assert(second.purchasedGiftIds.includes('singpa_plush'));
 assert.equal((await buy(ad.id)).reason,'wrong_route');assert.equal((await buy('starlight_mailbox')).reason,'not_purchasable');assert.equal((await buy('unknown')).reason,'unknown_gift');
 const wrong=band==='night'?'day':'night';assert.equal((await buy(ad.id,'homeshopping',wrong)).reason,'wrong_band');
 const bought=await buy(ad.id,'homeshopping',band);assert(bought.ok);assert.equal(bought.newBalance,2720-ad.price);assert.equal((await buy(ad.id,'homeshopping',band)).reason,'already_owned');
 // Validate all four RPC prices on this disposable account; band eligibility is tested above.
 let expected=bought.newBalance;
 for(const gift of GIFT_REGISTRY.filter(g=>g.band&&g.id!==ad.id)){
  const testCatalog=GIFT_REGISTRY.map(g=>g.id===gift.id?{...g,band}:g);
  const result=await db.rpc('gift_gameplay',{p_user_id:userId,p_action:'purchase',p_gift_id:gift.id,p_band:band,p_event_id:null,p_source:'homeshopping',p_catalog:testCatalog,p_regular_letters:REGULAR_LETTER_IDS});
  assert(!result.error,result.error?.message);assert(result.data.ok);expected-=gift.price;assert.equal(result.data.newBalance,expected);assert(result.data.ownedGiftIds.includes(gift.id));
 }
 const reload=await state();assert.equal(reload.heart_coin_balance,expected);assert(reload.owned_gift_ids.includes(ad.id));
 const other=GIFT_REGISTRY.find(g=>g.band&&g.band!==band);assert.equal((await buy(other.id,'homeshopping',band)).reason,'wrong_band');
 assert(!(await db.from('user_progression').update({collected_letter_ids:REGULAR_LETTER_IDS}).eq('user_id',userId)).error);
 const complete=await db.rpc('gift_gameplay',{p_user_id:userId,p_action:'completion',p_gift_id:null,p_band:null,p_event_id:null,p_source:null,p_catalog:GIFT_REGISTRY,p_regular_letters:REGULAR_LETTER_IDS});assert(!complete.error,complete.error?.message);assert(complete.data.ownedGiftIds.includes('starlight_mailbox'));assert(!complete.data.purchasedGiftIds.includes('starlight_mailbox'));
 assert.equal((await fetch('http://127.0.0.1:3000/api/gifts',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 console.log('PASS: real Supabase API insufficient funds, base prices, concurrent dedupe, unlock gate, routes, all four RPC shopping prices, current-band API, wrong band, reload, mailbox reward, guest rejection');
}finally{if(userId){const removed=await db.auth.admin.deleteUser(userId);assert(!removed.error,'cleanup failed');console.log('Disposable test account removed');}}
