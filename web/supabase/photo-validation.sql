-- Run after migration. All fixture changes roll back; no existing account is used.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000b01'),('00000000-0000-4000-8000-000000000b02');
insert into public.profiles("userId",nickname,gender,"birthYear",vocative)
 values('00000000-0000-4000-8000-000000000b02','쭈인','female',1991,'쭈인이');
do $$
declare
 u uuid:='00000000-0000-4000-8000-000000000b01';
 catalog jsonb; result jsonb; first_result jsonb; cat text; i integer;
 vip_id uuid:='00000000-0000-4000-8000-000000000b02'; event_id uuid:=gen_random_uuid();
 chances jsonb:='{"hug":1,"food":1,"outfit":1,"window":1,"happy":0}';
begin
 select jsonb_agg(jsonb_build_object('id',c||i,'category',c)) into catalog from unnest(array['hug','food','outfit','window','happy']) c cross join generate_series(1,8) i;
 first_result:=public.acquire_photo(vip_id,'pet',event_id,catalog,chances);
 assert first_result->>'category'='hug' and (first_result->>'delta')::int=30,'VIP hug reward';
 result:=public.acquire_photo(vip_id,'pet',event_id,catalog,chances);
 assert (result->>'delta')::int=0,'event replay';
 update public.user_progression set reward_receipts='{}' where user_id=vip_id;
 result:=public.acquire_photo(vip_id,'pet',gen_random_uuid(),catalog,chances);
 assert result->>'photoId' is null,'hug daily cap';
 result:=public.mutate_progression(vip_id,'photo',p_item_id=>first_result->>'photoId',p_category=>'hug');
 assert (result->>'delta')::int=0,'duplicate photo never rewards';
 assert (select heart_coin_balance=30 and daily_photo_total=1 from public.user_progression where user_id=vip_id),'single atomic reward';
 perform public.mutate_progression(u,'ensure');
 result:=public.acquire_photo(u,'pet',gen_random_uuid(),catalog,chances);
 assert result->>'photoId' is null,'non-VIP hug';
 update public.user_progression set reward_receipts='{}' where user_id=u;
 result:=public.acquire_photo(u,'sleep',gen_random_uuid(),catalog,'{"happy":1}');
 assert result->>'photoId' is null,'sleep exclusion';
 foreach cat in array array['food','window','outfit'] loop
  for i in 1..3 loop
   update public.user_progression set reward_receipts='{}' where user_id=u;
   result:=public.acquire_photo(u,case when cat='outfit' then 'wardrobe' else cat end,gen_random_uuid(),catalog,chances);
  end loop;
 end loop;
 assert (select daily_photo_category_counts->>'food'='2' and daily_photo_category_counts->>'window'='2' and daily_photo_category_counts->>'outfit'='1' from public.user_progression where user_id=u),'category and outfit band caps';
 for i in 1..6 loop
  update public.user_progression set reward_receipts='{}' where user_id=u;
  perform public.acquire_photo(u,'tv',gen_random_uuid(),catalog,'{"happy":1}');
 end loop;
 assert (select daily_photo_total=10 and heart_coin_balance=300 and cardinality(collected_photo_ids)=10 from public.user_progression where user_id=u),'global cap and exactly 30 per photo';
 assert (select count(distinct id)=10 from public.user_progression,unnest(collected_photo_ids) id where user_id=u),'no duplicates';
 assert (public.mutate_progression(u,'ensure')->'progression'->>'heart_coin_balance')::int=300,'reload state';
 update public.user_progression set progression_date=progression_date-1,reward_receipts='{}' where user_id=u;
 perform public.acquire_photo(u,'tv',gen_random_uuid(),'[]','{"happy":1}');
 assert (select daily_photo_total=0 and heart_coin_balance=300 from public.user_progression where user_id=u),'KST reset retains collection';
 update public.user_progression set reward_receipts='{}' where user_id=u;
 select jsonb_agg(jsonb_build_object('id',id,'category','happy')) into catalog from public.user_progression,unnest(collected_photo_ids) id where user_id=u;
 result:=public.acquire_photo(u,'tv',gen_random_uuid(),catalog,'{"happy":1}');
 assert result->>'photoId' is null,'completed category';
 -- Outfit has a separate daily cap even after a different time band becomes available.
 update public.user_progression set daily_photo_category_counts='{"outfit":2}',reward_receipts='{}' where user_id=u;
 result:=public.acquire_photo(u,'wardrobe',gen_random_uuid(),'[{"id":"new-outfit","category":"outfit"}]',chances);
 assert result->>'photoId' is null,'outfit daily cap';
 -- Failed rolls are also idempotent, even if the server chance later changes.
 update public.user_progression set reward_receipts='{}' where user_id=u;
 event_id:=gen_random_uuid();
 perform public.acquire_photo(u,'tv',event_id,'[{"id":"new-happy","category":"happy"}]','{"happy":0}');
 result:=public.acquire_photo(u,'tv',event_id,'[{"id":"new-happy","category":"happy"}]','{"happy":1}');
 assert result->>'photoId' is null,'failed event cannot reroll';
 assert not has_function_privilege('authenticated','public.acquire_photo(uuid,text,uuid,jsonb,jsonb)','EXECUTE'),'server only';
end $$;
rollback;
