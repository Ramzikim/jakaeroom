-- Execute after the migration. Disposable fixture data is always rolled back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000c01'),('00000000-0000-4000-8000-000000000c02');
do $$
declare
 u uuid:='00000000-0000-4000-8000-000000000c01'; v uuid:='00000000-0000-4000-8000-000000000c02';
 catalog jsonb:='[
 {"id":"mimi_plush","acquisitionType":"cabinet_order","price":100,"band":null,"isPurchasable":true},
 {"id":"singpa_plush","acquisitionType":"cabinet_order","price":180,"band":null,"isPurchasable":true},
 {"id":"somi_goods","acquisitionType":"homeshopping","price":260,"band":"day","isPurchasable":true},
 {"id":"lightning_knight_figure","acquisitionType":"homeshopping","price":350,"band":"afternoon","isPurchasable":true},
 {"id":"starlight_sleep_lamp","acquisitionType":"homeshopping","price":450,"band":"night","isPurchasable":true},
 {"id":"strawberry_tower","acquisitionType":"homeshopping","price":600,"band":"dawn","isPurchasable":true},
 {"id":"starlight_mailbox","acquisitionType":"letter_completion","price":null,"band":null,"isPurchasable":false}]';
 ids text[]; band text; wrong_band text; hour numeric; g jsonb; result jsonb; before_balance integer;
 event_id uuid; i integer; gift_id text; adjusted jsonb;
begin
 select array_agg(b||'_'||lpad(i::text,2,'0')) into ids from unnest(array['dawn','day','afternoon','night']) b cross join generate_series(1,7) i;
 hour:=extract(hour from now() at time zone 'Asia/Seoul')+extract(minute from now() at time zone 'Asia/Seoul')/60;
 band:=case when hour>=6 and hour<16 then 'day' when hour>=16 and hour<18.5 then 'afternoon' when hour>=18.5 and hour<23 then 'night' else 'dawn' end;
 wrong_band:=case when band='day' then 'night' else 'day' end;
 perform public.mutate_progression(u,'ensure');perform public.mutate_progression(v,'ensure');
 result:=public.gift_gameplay(null,'purchase','mimi_plush',null,null,'cabinet_order',catalog,ids);
 assert result->>'reason'='authentication_required','guest';
 result:=public.gift_gameplay(u,'purchase','missing',null,null,'cabinet_order',catalog,ids);
 assert result->>'reason'='unknown_gift','unknown';
 result:=public.gift_gameplay(u,'purchase','starlight_mailbox',null,null,'cabinet_order',catalog,ids);
 assert result->>'reason'='not_purchasable','completion cannot be bought';
 result:=public.gift_gameplay(u,'purchase','mimi_plush',band,null,'homeshopping',catalog,ids);
 assert result->>'reason'='wrong_route','wrong route';
 result:=public.gift_gameplay(u,'purchase','mimi_plush',null,null,'cabinet_order',catalog,ids);
 assert result->>'reason'='insufficient_funds','insufficient';
 assert (select heart_coin_balance=0 and cardinality(owned_gift_ids)=0 and cardinality(purchased_gift_ids)=0 from public.user_progression where user_id=u),'no mutation on failure';
 update public.user_progression set heart_coin_balance=3000 where user_id=u;

 select item->>'id' into gift_id from jsonb_array_elements(catalog) item where item->>'band'=band;
 result:=public.gift_gameplay(u,'purchase',gift_id,wrong_band,null,'homeshopping',catalog,ids);
 assert result->>'reason'='wrong_band','cannot spoof band';
 for i in 1..4 loop
  event_id:=gen_random_uuid();
  result:=public.gift_gameplay(u,'tv_view',null,band,event_id,null,catalog,ids);
  assert (result->>'shouldForce')::boolean=(i=4),'fourth view forces';
  result:=public.gift_gameplay(u,'tv_view',null,band,event_id,null,catalog,ids);
  assert (result->'homeshopping'->band->>'viewCount')::integer=i,'view retry idempotent';
  if i=3 then
   result:=public.gift_gameplay(u,'pity',null,band,null,null,catalog,ids);
   assert (result->>'shouldForce')::boolean,'three misses force next';
  end if;
 end loop;
 result:=public.gift_gameplay(u,'shown',null,band,null,null,catalog,ids);
 assert not (result->>'shouldForce')::boolean,'shown ends pity';
 assert result->'homeshopping'->band->>'lastSeenGiftId'=gift_id,'shown gift recorded';

 for g in select item from jsonb_array_elements(catalog) item where (item->>'isPurchasable')::boolean loop
  select heart_coin_balance into before_balance from public.user_progression where user_id=u;
  -- Trusted fixture changes only availability, so all four prices can be tested in one time band.
  -- Actual catalog mapping and wrong-current-band rejection are checked separately.
  adjusted:=jsonb_build_array(case when g->>'acquisitionType'='homeshopping' then g||jsonb_build_object('band',band) else g end);
  result:=public.gift_gameplay(u,'purchase',g->>'id',band,null,g->>'acquisitionType',adjusted,ids);
  assert (result->>'ok')::boolean and (result->>'newBalance')::integer=before_balance-(g->>'price')::integer,'exact price';
  assert result->'ownedGiftIds' ? (g->>'id') and result->'purchasedGiftIds' ? (g->>'id'),'purchased also owned';
  result:=public.gift_gameplay(u,'purchase',g->>'id',band,null,g->>'acquisitionType',adjusted,ids);
  assert result->>'reason'='already_owned','duplicate blocked';
  assert (select heart_coin_balance=before_balance-(g->>'price')::integer from public.user_progression where user_id=u),'no second deduction';
 end loop;
 result:=public.gift_gameplay(u,'pity',null,band,null,null,catalog,ids);
 assert not (result->>'shouldForce')::boolean,'owned gift has no pity';
 result:=public.gift_gameplay(u,'completion',null,null,null,null,catalog,ids);
 assert result->>'reason'='letters_incomplete','incomplete';
 update public.user_progression set collected_letter_ids=ids[1:27]||array['special_01','special_02','special_03','special_04'] where user_id=u;
 result:=public.gift_gameplay(u,'completion',null,null,null,null,catalog,ids);
 assert result->>'reason'='letters_incomplete','specials cannot replace regular';
 update public.user_progression set collected_letter_ids=ids where user_id=u;
 result:=public.gift_gameplay(u,'completion',null,null,null,null,catalog,ids);
 assert result->>'reason'='granted' and result->'ownedGiftIds' ? 'starlight_mailbox' and not(result->'purchasedGiftIds' ? 'starlight_mailbox'),'free mailbox';
 result:=public.gift_gameplay(u,'completion',null,null,null,null,catalog,ids);
 assert result->>'reason'='already_granted','grant idempotent';
 update public.user_progression set homeshopping_date=homeshopping_date-1,progression_date=progression_date-1 where user_id=u;
 result:=public.gift_gameplay(u,'state',null,null,null,null,catalog,ids);
 assert (result->>'newBalance')::integer=1060 and jsonb_array_length(result->'ownedGiftIds')=7 and jsonb_array_length(result->'purchasedGiftIds')=6,'reload preserves purchase/grant';
 assert result->'homeshopping'='{}'::jsonb,'KST resets pity only';
 result:=public.gift_gameplay(v,'state',null,null,null,null,catalog,ids);
 assert (result->>'newBalance')::integer=0 and result->'ownedGiftIds'='[]'::jsonb,'account isolation';
 assert not has_function_privilege('authenticated','public.gift_gameplay(uuid,text,text,text,uuid,text,jsonb,text[])','execute'),'server only';
end $$;
rollback;
