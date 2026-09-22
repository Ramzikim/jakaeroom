-- Preserve every receipt while removing growing event history from the hot account row.
-- Existing RPC signatures/clients continue to work. Apply as one transaction.
begin;
create table if not exists public.progression_receipts (
 user_id uuid not null references auth.users(id) on delete cascade,
 receipt_key text not null,
 payload jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,receipt_key)
);
alter table public.progression_receipts enable row level security;
revoke all on public.progression_receipts from public,anon,authenticated;
grant select,insert,update,delete on public.progression_receipts to service_role;

create or replace function public.progression_receipt(p_user_id uuid,p_key text)
returns jsonb language sql volatile security definer set search_path='' as $$
 select payload from public.progression_receipts where user_id=p_user_id and receipt_key=p_key;
$$;
revoke all on function public.progression_receipt(uuid,text) from public,anon,authenticated;
grant execute on function public.progression_receipt(uuid,text) to service_role;

-- Writers still append receipts through their existing atomic account transaction.
create or replace function public.archive_progression_receipts()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.progression_receipts(user_id,receipt_key,payload)
 select new.user_id,key,value from jsonb_each(new.reward_receipts) where key<>'photo_last_event_at'
 on conflict(user_id,receipt_key) do nothing;
 new.reward_receipts:=case when new.reward_receipts ? 'photo_last_event_at'
  then jsonb_build_object('photo_last_event_at',new.reward_receipts->'photo_last_event_at') else '{}'::jsonb end;
 return new;
end $$;
revoke all on function public.archive_progression_receipts() from public,anon,authenticated;

-- Lock writers while moving history and updating dedupe readers together.
lock table public.user_progression in share row exclusive mode;
insert into public.progression_receipts(user_id,receipt_key,payload)
select p.user_id,e.key,e.value from public.user_progression p cross join lateral jsonb_each(p.reward_receipts) e
where e.key<>'photo_last_event_at' on conflict(user_id,receipt_key) do nothing;
drop trigger if exists archive_progression_receipts on public.user_progression;
create trigger archive_progression_receipts before insert or update of reward_receipts on public.user_progression
for each row execute function public.archive_progression_receipts();
update public.user_progression set reward_receipts=reward_receipts
where reward_receipts-'photo_last_event_at'<>'{}'::jsonb;

do $patch$
declare f record; definition text; revised text; patched integer:=0;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('mutate_progression','commit_letter_event','acquire_photo_album','acquire_photo') loop
  definition:=pg_get_functiondef(f.oid);
  revised:=replace(definition,'r.reward_receipts ? receipt','(public.progression_receipt(p_user_id,receipt) is not null)');
  revised:=replace(revised,'r.reward_receipts->receipt','public.progression_receipt(p_user_id,receipt)');
  if revised=definition and position('public.progression_receipt(p_user_id,receipt)' in definition)=0 then
   raise exception 'Expected receipt reader missing in %',f.proname;
  end if;
  if revised<>definition then execute revised;end if;
  patched:=patched+1;
 end loop;
 if patched<3 then raise exception 'Required receipt readers missing';end if;
 select pg_get_functiondef(p.oid) into definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='gift_gameplay';
 if definition is null then raise exception 'gift_gameplay missing';end if;
 -- Return the already-committed snapshot without an extra HTTP/database round trip.
 revised:=replace(definition,'''shouldForce'',force_show);','''shouldForce'',force_show,''progression'',to_jsonb(r)-''reward_receipts'');');
 if revised=definition and position('''progression'',to_jsonb(r)' in definition)=0 then raise exception 'Expected gift response missing';end if;
 if revised<>definition then execute revised;end if;
end $patch$;
notify pgrst,'reload schema';
commit;
