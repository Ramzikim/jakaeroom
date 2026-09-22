// Disposable account only; never change an existing player's collection.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
if(process.env.RUN_LETTER_API_TEST!=='1')throw Error('Set RUN_LETTER_API_TEST=1');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const account=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ids=Array.from({length:28},(_,i)=>`letter_${String(i+1).padStart(2,'0')}`),empty=()=>({version:0,date:'',counts:{},vipIds:[]});
let userId;
try{
 const email=`letter-test-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'aA1!';
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 const login=await account.auth.signInWithPassword({email,password});assert(!login.error);const headers={Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json'};
 const call=async(action,eventId=crypto.randomUUID(),letterId)=>{const r=await fetch('http://127.0.0.1:3000/api/letters',{method:'POST',headers,body:JSON.stringify({action,eventId,letterId})});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const seed=async(fields)=>{const r=await db.from('user_progression').update(fields).eq('user_id',userId);assert(!r.error,r.error?.message);};
 let result=await call('load');assert.equal(result.progression.heart_coin_balance,0);
 const eventId=crypto.randomUUID(),race=await Promise.all([call('regular',eventId),call('regular',eventId)]);assert.equal(race.reduce((sum,r)=>sum+r.delta,0),20);assert(race.every(r=>r.letterId==='letter_01'));
 const quotaRace=await Promise.all([call('regular'),call('regular'),call('regular')]);assert.equal(quotaRace.reduce((sum,r)=>sum+r.delta,0),20);result=await call('load');assert.deepEqual(result.progression.collected_letter_ids,ids.slice(0,2));
 assert.equal((await call('regular')).reason,'quota');const before=JSON.stringify(result.progression.letter_state.counts);assert.equal((await call('reread',undefined,'letter_01')).delta,0);assert.equal(JSON.stringify((await call('load')).progression.letter_state.counts),before);
 for(let i=0;i<10;i++)await call('drawer');assert.equal((await call('load')).progression.letter_state.drawer,undefined);
 await seed({collected_letter_ids:ids.slice(0,21),letter_state:empty()});
 await call('drawer');await call('interrupt');assert.equal((await call('load')).progression.letter_state.drawer,undefined);
 await seed({letter_state:{...empty(),drawer:{count:9,at:Date.now()-2100}}});result=await call('drawer');assert.equal(result.progression.letter_state.drawer.count,1);assert.equal(result.delta,0);
 for(let i=0;i<9;i++)result=await call('drawer');assert.equal(result.delta,20);assert(result.progression.collected_letter_ids.includes('special_01'));assert.equal((await call('drawer')).delta,0);
 await seed({letter_state:{...empty(),pet:{start:Date.now()-901000,counts:[5,5,5]}}});result=await call('load');assert.equal(result.delta,20);assert(result.progression.collected_letter_ids.includes('special_02'));assert.equal((await call('load')).delta,0);
 await seed({collected_letter_ids:ids.slice(0,27),letter_state:empty(),owned_gift_ids:[],purchased_gift_ids:[]});result=await call('regular');assert.equal(result.letterId,'letter_28');assert.equal(result.delta,20);assert(result.progression.owned_gift_ids.includes('starlight_mailbox'));assert(!result.progression.purchased_gift_ids.includes('starlight_mailbox'));assert(!result.progression.collected_letter_ids.includes('special_04'));assert.deepEqual(result.progression.letter_state.vipIds,[]);
 for(const [tier,nickname,gender,birthYear] of [['vip_owner','쭈인','female',1991],['vip_dad','아빠','male',1995],['vip_jangmi','장미','female',1990]]){
  const p=await fetch('http://127.0.0.1:3000/api/profile',{method:'PUT',headers,body:JSON.stringify({nickname,gender,birthYear})});assert.equal(p.status,200,await p.clone().text());
  await seed({collected_letter_ids:[...ids.slice(0,27),'special_01','special_02','special_03'],letter_state:empty()});
  result=await call('regular');assert.equal(result.delta,40);assert.equal(result.progression.collected_letter_ids.length,32);assert.deepEqual(result.progression.letter_state.vipIds,[tier]);assert(result.progression.collected_letter_ids.includes('special_04'));
  const reload=await call('load');assert.equal(reload.delta,0);assert.deepEqual(reload.progression.letter_state.vipIds,[tier]);assert.equal(reload.progression.collected_letter_ids.length,32);
 }
 await account.auth.signOut();const relogin=await account.auth.signInWithPassword({email,password});assert(!relogin.error);headers.Authorization=`Bearer ${relogin.data.session.access_token}`;
 assert.deepEqual((await call('load')).progression.letter_state.vipIds,['vip_jangmi']);assert.equal((await call('reread',undefined,'vip_jangmi')).delta,0);
 const own=await account.from('user_progression').select('collected_letter_ids,letter_state').eq('user_id',userId).single();assert(!own.error);assert.equal(own.data.collected_letter_ids.length,32);
 const denied=await account.rpc('commit_letter_event',{p_user_id:userId,p_version:0,p_state:empty(),p_grants:['letter_01'],p_event_id:'forged',p_letter_id:'letter_01'});assert(denied.error,'authenticated cannot call service RPC');
 assert.equal((await fetch('http://127.0.0.1:3000/api/letters',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 console.log('PASS live Supabase: concurrent sequence/quota/dedupe, reread, drawer gate/reset/10 clicks, pet completion, 28 mailbox, 31→32, all 3 VIP identities, reload, rewards, RPC access, guest rejection');
}finally{if(userId){const r=await db.auth.admin.deleteUser(userId);assert(!r.error,'test cleanup');console.log('Disposable account removed');}}
