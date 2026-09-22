-- Preserve balances/collections; only future awards change. No table changes.
-- Rollback: reapply mutate_progression from 20260915_progression.sql (function only).
create or replace function public.mutate_progression(p_user_id uuid, p_action text, p_amount integer default 0,
 p_reason text default '', p_event_id text default '', p_item_id text default '',
 p_category text default 'general', p_special boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 r public.user_progression; today date := (now() at time zone 'Asia/Seoul')::date;
 band text; category_key text; receipt text; payload jsonb; delta integer := 0; fresh boolean := false;
begin
 if p_user_id is null then raise exception 'Authentication required'; end if;
 if p_action not in ('ensure','reset','add','spend','photo','letter','own_gift','purchase_gift') then raise exception 'Invalid action'; end if;
 if p_amount is null or p_amount < 0 or p_amount % 5 <> 0 then raise exception 'Invalid reward unit'; end if;
 if p_action in ('photo','letter','own_gift','purchase_gift') and (p_item_id is null or length(p_item_id) not between 1 and 200) then raise exception 'Invalid item'; end if;
 if p_category is null or length(p_category) not between 1 and 80 then raise exception 'Invalid category'; end if;
 insert into public.user_progression(user_id) values(p_user_id) on conflict do nothing;
 select * into r from public.user_progression where user_id=p_user_id for update;
 if r.progression_date<>today then
  r.progression_date:=today; r.daily_passive_earned:=0; r.daily_photo_total:=0;
  r.daily_photo_category_counts:='{}'; r.daily_interaction_reward_counts:='{}';
  -- A new KST day starts a fresh five-minute passive interval; no offline catch-up.
  r.last_passive_reward_at:=now();
 end if;
 if p_action='add' then
  if p_reason='daily_login' and p_amount=30 then receipt:='login:'||today;
  elsif p_reason='passive' and p_amount=10 then
   if now()-r.last_passive_reward_at>=interval '5 minutes' and r.daily_passive_earned<120 then
    delta:=10; r.daily_passive_earned:=r.daily_passive_earned+10; r.last_passive_reward_at:=now();
   end if;
  elsif p_reason='interaction' and p_amount in (5,10) then
   if p_event_id is null or length(p_event_id) not between 1 and 200 then raise exception 'Stable event ID required'; end if;
   -- Accept old callers during rollout, but always award the new server amount.
   p_amount:=5;
   if p_category='basketBerry' then p_category:='berry'; end if;
   if p_category not in ('pet','bath','berry','tv','game','cushion','bed','window') then raise exception 'Invalid interaction'; end if;
   band:=case when (now() at time zone 'Asia/Seoul')::time < time '06:00' then 'dawn'
     when (now() at time zone 'Asia/Seoul')::time < time '16:00' then 'day'
     when (now() at time zone 'Asia/Seoul')::time < time '18:30' then 'afternoon'
     when (now() at time zone 'Asia/Seoul')::time < time '23:00' then 'night' else 'dawn' end;
   category_key:=band||':'||p_category;
   receipt:='interaction:'||p_event_id;
  else raise exception 'Invalid reward reason or amount'; end if;
 elsif p_action='spend' then
  if p_amount=0 or p_event_id is null or length(p_event_id) not between 1 and 200 then raise exception 'Positive amount and stable event ID required'; end if;
  receipt:='spend:'||p_event_id;
 elsif p_action='photo' then
  fresh:=not(p_item_id=any(r.collected_photo_ids));
  if fresh then
   r.collected_photo_ids:=array_append(r.collected_photo_ids,p_item_id);delta:=30;r.daily_photo_total:=r.daily_photo_total+1;
   r.daily_photo_category_counts:=jsonb_set(r.daily_photo_category_counts,array[p_category],to_jsonb(coalesce((r.daily_photo_category_counts->>p_category)::integer,0)+1));
  end if;
 elsif p_action='letter' then
  fresh:=not(p_item_id=any(r.collected_letter_ids));
  if fresh then r.collected_letter_ids:=array_append(r.collected_letter_ids,p_item_id);delta:=20; end if;
 elsif p_action='own_gift' then
  fresh:=not(p_item_id=any(r.owned_gift_ids));if fresh then r.owned_gift_ids:=array_append(r.owned_gift_ids,p_item_id);end if;
 elsif p_action='purchase_gift' then
  fresh:=not(p_item_id=any(r.purchased_gift_ids));if fresh then r.purchased_gift_ids:=array_append(r.purchased_gift_ids,p_item_id);end if;
 end if;
 if receipt is not null then
  payload:=jsonb_build_object('amount',p_amount,'category',p_category);
  if r.reward_receipts ? receipt then
   if r.reward_receipts->receipt<>payload then raise exception 'Event ID reused with different payload'; end if;
  elsif p_action='spend' and r.heart_coin_balance<p_amount then
   -- Persist the daily reset even for a declined spend, without recording a receipt.
   update public.user_progression set progression_date=r.progression_date,daily_passive_earned=r.daily_passive_earned,
    daily_photo_total=r.daily_photo_total,daily_photo_category_counts=r.daily_photo_category_counts,
    daily_interaction_reward_counts=r.daily_interaction_reward_counts,last_passive_reward_at=r.last_passive_reward_at where user_id=p_user_id;
   return jsonb_build_object('ok',false,'error','insufficient_funds','newlyCollected',false,'delta',0,'progression',to_jsonb(r)-'reward_receipts');
  else
   delta:=case when p_action='spend' then -p_amount
     when p_reason='interaction' and coalesce((r.daily_interaction_reward_counts->>category_key)::integer,0)>=1 then 0
     else p_amount end;
   r.reward_receipts:=r.reward_receipts||jsonb_build_object(receipt,payload);
   if p_reason='interaction' and delta>0 then r.daily_interaction_reward_counts:=jsonb_set(r.daily_interaction_reward_counts,array[category_key],to_jsonb(1));end if;
  end if;
 end if;
 r.heart_coin_balance:=r.heart_coin_balance+delta;
 update public.user_progression set heart_coin_balance=r.heart_coin_balance,last_passive_reward_at=r.last_passive_reward_at,
 daily_passive_earned=r.daily_passive_earned,collected_photo_ids=r.collected_photo_ids,collected_letter_ids=r.collected_letter_ids,
 owned_gift_ids=r.owned_gift_ids,purchased_gift_ids=r.purchased_gift_ids,daily_photo_total=r.daily_photo_total,
 daily_photo_category_counts=r.daily_photo_category_counts,daily_interaction_reward_counts=r.daily_interaction_reward_counts,
 progression_date=r.progression_date,reward_receipts=r.reward_receipts where user_id=p_user_id;
 return jsonb_build_object('ok',true,'newlyCollected',fresh,'delta',delta,'progression',to_jsonb(r)-'reward_receipts');
end $$;
revoke all on function public.mutate_progression(uuid,text,integer,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.mutate_progression(uuid,text,integer,text,text,text,text,boolean) to service_role;
