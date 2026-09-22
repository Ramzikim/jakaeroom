// Run with PHOTO_PGLITE_MODULE pointing to an isolated @electric-sql/pglite install.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {PGlite}=await import(process.env.PHOTO_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create table public.profiles("userId" uuid primary key,nickname text,gender text,"birthYear" int);`);
for(const file of ['20260915_progression.sql','20260917_reward_rules.sql','20260922_photo_album.sql','20260921_letter_story.sql','20260923_photo_props.sql','20260924_photo_first_click.sql'])await db.exec(await fs.readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
const u='00000000-0000-4000-8000-000000000b01',v='00000000-0000-4000-8000-000000000b02';
await db.query('insert into auth.users values ($1),($2)',[u,v]);
await db.query('insert into public.profiles values ($1,$2,$3,1991)',[v,'쭈인','female']);
const catalog=JSON.parse(await fs.readFile(new URL('../lib/photo-catalog.json',import.meta.url),'utf8'));
const chances={hug:0,food:0,outfit:0,window:0,happy:0};
const drop=async(user,action,prob={},items=catalog,event=crypto.randomUUID())=>(await db.query('select public.acquire_photo_album($1,$2,$3,$4,$5) as r',[user,action,event,JSON.stringify(items),JSON.stringify({...chances,...prob})])).rows[0].r;
const state=async user=>(await db.query('select * from public.user_progression where user_id=$1',[user])).rows[0];
const unthrottle=async user=>db.query(`update public.user_progression set reward_receipts=reward_receipts-'photo_last_event_at' where user_id=$1`,[user]);
assert.equal((await drop(u,'food',{food:1})).delta,30);
await unthrottle(u);assert.equal((await drop(u,'food',{food:1})).photoId,null);
assert.equal((await state(u)).daily_photo_total,1);
for(const category of ['window','outfit']){
 await unthrottle(u);assert.equal((await drop(u,category==='outfit'?'wardrobe':category,{[category]:1})).delta,30);
 await unthrottle(u);assert.equal((await drop(u,category==='outfit'?'wardrobe':category,{[category]:1})).photoId,null);
 await db.query(`update public.user_progression set daily_photo_category_counts=(select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(daily_photo_category_counts) where key not like $2) where user_id=$1`,[u,category+':%']);
 await unthrottle(u);assert.equal((await drop(u,category==='outfit'?'wardrobe':category,{[category]:1})).delta,30);
 await unthrottle(u);assert.equal((await drop(u,category==='outfit'?'wardrobe':category,{[category]:1})).photoId,null);
}
for(let i=0;i<5;i++){await unthrottle(u);assert.equal((await drop(u,'game',{happy:1})).delta,30);}
assert.equal((await state(u)).daily_photo_total,10);
await unthrottle(u);assert.equal((await drop(u,'game',{happy:1})).photoId,null);
assert.equal((await drop(u,'sleep',{happy:1,hug:1})).photoId,null);
assert.equal((await drop(u,'pet',{hug:1})).photoId,null,'non VIP');
assert.equal((await drop(v,'pet',{hug:1})).photoId,null,'letter prerequisite');
await db.query(`update public.user_progression set collected_letter_ids=array['letter_22'],daily_photo_total=10 where user_id=$1`,[v]);
assert.equal((await drop(v,'pet',{hug:0})).photoId,null);
assert.equal((await state(v)).daily_photo_category_counts.hug,undefined,'miss does not consume success');
const single=catalog.filter(p=>p.id==='hug_01'),event=crypto.randomUUID();
const hug=await drop(v,'pet',{hug:1},single,event);assert.equal(hug.delta,30);assert.equal(hug.newlyCollected,true);
assert.equal((await state(v)).daily_photo_total,10,'hug outside standard cap');
assert.equal((await drop(v,'pet',{hug:1},single,event)).photoId,null,'receipt replay');
assert.equal((await drop(v,'pet',{hug:1},single)).photoId,null,'daily success');
await db.query(`update public.user_progression set progression_date=progression_date-1 where user_id=$1`,[v]);
const duplicate=await drop(v,'pet',{hug:1},single);assert.equal(duplicate.photoId,'hug_01');assert.equal(duplicate.delta,0);assert.equal(duplicate.newlyCollected,false);
assert.equal((await state(v)).heart_coin_balance,30);assert.deepEqual((await state(v)).collected_photo_ids,['hug_01']);
assert.equal((await state(v)).daily_photo_total,0);assert.equal((await state(v)).daily_photo_category_counts.hug,1);
assert.equal((await drop(v,'pet',{hug:1},single)).photoId,null);
// Completed category never rewards, even after KST reset.
await db.query(`update public.user_progression set progression_date=progression_date-1,collected_photo_ids=$2 where user_id=$1`,[u,catalog.filter(p=>p.category==='food').map(p=>p.id)]);
assert.equal((await drop(u,'food',{food:1})).photoId,null);
// Drawer shares the happy cap; wardrobe bypasses throttling and chance.
await db.query("update public.user_progression set progression_date=progression_date-1,collected_photo_ids='{}' where user_id=$1",[u]);
assert.equal((await drop(u,'drawer',{happy:0})).delta,30,'first drawer is guaranteed');
assert.equal((await drop(u,'drawer',{happy:0})).photoId,null,'repeat is not guaranteed');
for(let i=1;i<6;i++){await unthrottle(u);assert.equal((await drop(u,'drawer',{happy:1})).delta,30);}
await unthrottle(u);assert.equal((await drop(u,'game',{happy:1})).photoId,null);
assert.equal((await state(u)).daily_photo_category_counts.happy,6);
assert.equal((await drop(u,'wardrobe',{outfit:0})).delta,30,'guaranteed even directly after another action');
assert.equal((await drop(u,'wardrobe',{happy:1})).photoId,null,'no fallback on used band');
await db.query("select public.reset_progression_dev($1,'collection')",[u]);
assert.deepEqual((await state(u)).collected_photo_ids,[]);assert.equal((await state(u)).daily_photo_total,0);
await db.query("update public.user_progression set collected_letter_ids=array['letter_01'],letter_state=jsonb_build_object('version',10,'date','today','counts',jsonb_build_object('day',2),'vipIds',jsonb_build_array('vip_owner')),owned_gift_ids=array['mimi_plush','starlight_mailbox'],purchased_gift_ids=array['mimi_plush'] where user_id=$1",[u]);
await db.query("select public.reset_progression_dev($1,'letters')",[u]);
assert.deepEqual((await state(u)).collected_letter_ids,[]);assert.deepEqual((await state(u)).letter_state.counts,{});assert.equal((await state(u)).letter_state.version,11);
assert.deepEqual((await state(u)).owned_gift_ids,['mimi_plush']);assert.deepEqual((await state(u)).purchased_gift_ids,['mimi_plush']);
const savedBalance=(await state(u)).heart_coin_balance;assert(savedBalance>0);
await db.query("select public.reset_progression_dev($1,'coins')",[u]);assert.equal((await state(u)).heart_coin_balance,0);
assert.equal((await state(v)).heart_coin_balance,30,'reset isolated to account');
// Concurrent retries serialize through the same receipt and row lock.
await unthrottle(u);const retry=crypto.randomUUID(),before=(await state(u)).heart_coin_balance;
await Promise.all([drop(u,'game',{happy:1},catalog,retry),drop(u,'game',{happy:1},catalog,retry)]);
assert.equal((await state(u)).heart_coin_balance,before+30);
const saved=await db.dumpDataDir();await db.close();
const reloaded=new PGlite({loadDataDir:saved});
const persisted=(await reloaded.query('select collected_photo_ids,heart_coin_balance from public.user_progression where user_id=$1',[v])).rows[0];
assert.deepEqual(persisted.collected_photo_ids,['hug_01']);assert.equal(persisted.heart_coin_balance,30);
await reloaded.close();
console.log('PASS PostgreSQL: caps, bands, unique rewards, VIP/letter gate, miss retry, duplicate hug, KST reset, receipt dedupe, account isolation');
