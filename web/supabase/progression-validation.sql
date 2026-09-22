-- Run against a development Supabase database after the migration. All fixtures roll back.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000a01'),('00000000-0000-4000-8000-000000000a02');
do $$
declare
 u uuid:='00000000-0000-4000-8000-000000000a01'; v uuid:='00000000-0000-4000-8000-000000000a02'; r jsonb;
begin
 r:=public.mutate_progression(u,'ensure');
 assert (r->'progression'->>'heart_coin_balance')::integer=0;
 assert r->'progression'->'collected_photo_ids'='[]'::jsonb;
 perform public.mutate_progression(v,'ensure');
 r:=public.mutate_progression(u,'add',30,'daily_login');assert (r->>'delta')::integer=30;
 r:=public.mutate_progression(u,'add',30,'daily_login');assert (r->>'delta')::integer=0;
 r:=public.mutate_progression(u,'ensure');assert (r->'progression'->>'heart_coin_balance')::integer=30;
 r:=public.mutate_progression(v,'ensure');assert (r->'progression'->>'heart_coin_balance')::integer=0;
 r:=public.mutate_progression(u,'spend',20,'','order-1');assert (r->>'delta')::integer=-20;
 r:=public.mutate_progression(u,'spend',20,'','order-1');assert (r->>'delta')::integer=0;
 r:=public.mutate_progression(u,'spend',20,'','order-2');assert r->>'error'='insufficient_funds';
 r:=public.mutate_progression(u,'photo',0,'','','photo-1','room');assert (r->>'newlyCollected')::boolean;assert (r->>'delta')::integer=30;
 r:=public.mutate_progression(u,'photo',0,'','','photo-1','room');assert not (r->>'newlyCollected')::boolean;assert (r->>'delta')::integer=0;
 r:=public.mutate_progression(u,'letter',0,'','','letter-1');assert (r->>'delta')::integer=40;
 r:=public.mutate_progression(u,'letter',0,'','','letter-1','general',true);assert (r->>'delta')::integer=0;
 r:=public.mutate_progression(u,'letter',0,'','','special-1','general',true);assert (r->>'delta')::integer=80;
 r:=public.mutate_progression(u,'add',10,'interaction','pet-1','pet');assert (r->>'delta')::integer=10;
 r:=public.mutate_progression(u,'add',10,'interaction','pet-1','pet');assert (r->>'delta')::integer=0;
 r:=public.mutate_progression(u,'own_gift',0,'','','gift-1');assert (r->>'newlyCollected')::boolean;
 r:=public.mutate_progression(u,'purchase_gift',0,'','','gift-1');assert (r->>'newlyCollected')::boolean;
 r:=public.mutate_progression(u,'add',10,'passive');assert (r->>'delta')::integer=0;
 for i in 1..13 loop
  update public.user_progression set last_passive_reward_at=now()-interval '5 minutes' where user_id=u;
  r:=public.mutate_progression(u,'add',10,'passive');assert (r->>'delta')::integer=case when i<=12 then 10 else 0 end;
 end loop;
 update public.user_progression set progression_date=(now() at time zone 'Asia/Seoul')::date-1 where user_id=u;
 r:=public.mutate_progression(u,'reset');
 assert (r->'progression'->>'daily_passive_earned')::integer=0;
 assert (r->'progression'->>'daily_photo_total')::integer=0;
 assert r->'progression'->'daily_photo_category_counts'='{}'::jsonb;
 assert r->'progression'->'daily_interaction_reward_counts'='{}'::jsonb;
 assert r->'progression'->'collected_photo_ids'='["photo-1"]'::jsonb;
 assert (r->'progression'->>'heart_coin_balance')::integer=290;
 assert not has_table_privilege('authenticated','public.user_progression','UPDATE');
 assert not has_table_privilege('anon','public.user_progression','SELECT');
 assert not has_function_privilege('authenticated','public.mutate_progression(uuid,text,integer,text,text,text,text,boolean)','EXECUTE');
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000a01',true);
do $$ begin
 assert (select count(*) from public.user_progression)=1;
 assert (select user_id from public.user_progression)='00000000-0000-4000-8000-000000000a01'::uuid;
end $$;
reset role;
rollback;
