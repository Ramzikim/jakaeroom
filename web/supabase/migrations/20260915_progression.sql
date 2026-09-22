-- Additive migration: no changes to profiles or existing room state.
create table public.user_progression (
 user_id uuid primary key references auth.users(id) on delete cascade,
 heart_coin_balance integer not null default 0 check (heart_coin_balance >= 0),
 last_passive_reward_at timestamptz not null default now(),
 daily_passive_earned integer not null default 0 check (daily_passive_earned between 0 and 120),
 collected_photo_ids text[] not null default '{}',
 collected_letter_ids text[] not null default '{}',
 owned_gift_ids text[] not null default '{}',
 purchased_gift_ids text[] not null default '{}',
 daily_photo_total integer not null default 0 check (daily_photo_total >= 0),
 daily_photo_category_counts jsonb not null default '{}',
 daily_interaction_reward_counts jsonb not null default '{}',
 progression_date date not null default (now() at time zone 'Asia/Seoul')::date,
 reward_receipts jsonb not null default '{}'
);
alter table public.user_progression enable row level security;
revoke all on public.user_progression from anon, authenticated;
grant select on public.user_progression to authenticated;
create policy progression_read_own on public.user_progression for select to authenticated using (auth.uid()=user_id);
grant all on public.user_progression to service_role;

-- Only trusted server code may mutate. The server validates the bearer identity,
-- verifies reward eligibility, prices and catalog IDs before calling this function.
-- One row lock serializes rewards, collections, daily reset and concurrent spends.
create function public.mutate_progression(p_user_id uuid, p_action text, p_amount integer default 0,
 p_reason text default '', p_event_id text default '', p_item_id text default '',
 p_category text default 'general', p_special boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 r public.user_progression; today date := (now() at time zone 'Asia/Seoul')::date;
 receipt text; payload jsonb; delta integer := 0; fresh boolean := false;
begin
 if p_user_id is null then raise exception 'Authentication required'; end if;
 if p_action not in ('ensure','reset','add','spend','photo','letter','own_gift','purchase_gift') then raise exception 'Invalid action'; end if;
 if p_amount is null or p_amount < 0 or p_amount % 10 <> 0 then raise exception 'Invalid reward unit'; end if;
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
  elsif p_reason='interaction' and p_amount=10 then
   if p_event_id is null or length(p_event_id) not between 1 and 200 then raise exception 'Stable event ID required'; end if;
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
  if fresh then r.collected_letter_ids:=array_append(r.collected_letter_ids,p_item_id);delta:=case when p_special then 80 else 40 end; end if;
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
   delta:=case when p_action='spend' then -p_amount else p_amount end;
   r.reward_receipts:=r.reward_receipts||jsonb_build_object(receipt,payload);
   if p_reason='interaction' then r.daily_interaction_reward_counts:=jsonb_set(r.daily_interaction_reward_counts,array[p_category],to_jsonb(coalesce((r.daily_interaction_reward_counts->>p_category)::integer,0)+1));end if;
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
