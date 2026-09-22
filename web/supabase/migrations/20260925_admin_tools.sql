-- Account-local admin testing. No progression data is reset by this migration.
begin;
create table if not exists public.room_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 time_band_override text check (time_band_override in ('dawn','day','afternoon','night')),
 updated_at timestamptz not null default now()
);
alter table public.room_admins enable row level security;
revoke all on public.room_admins from public,anon,authenticated;
grant select,insert,update,delete on public.room_admins to service_role;
-- Pin the verified existing account, never a client-supplied email/profile flag.
insert into public.room_admins(user_id)
select u.id from auth.users u where u.id='1087bbb4-4f75-4f9c-9e1a-edfe20de2dd4'
and lower(u.email)='bitkubitku33@gmail.com' and u.email_confirmed_at is not null
and exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='google')
on conflict(user_id) do nothing;

create or replace function public.room_time_band(p_user_id uuid)
returns text language sql stable security definer set search_path='' as $$
 select coalesce((select time_band_override from public.room_admins where user_id=p_user_id),
 case when (now() at time zone 'Asia/Seoul')::time < time '06:00' then 'dawn'
 when (now() at time zone 'Asia/Seoul')::time < time '16:00' then 'day'
 when (now() at time zone 'Asia/Seoul')::time < time '18:30' then 'afternoon'
 when (now() at time zone 'Asia/Seoul')::time < time '23:00' then 'night' else 'dawn' end);
$$;
revoke all on function public.room_time_band(uuid) from public,anon,authenticated;
grant execute on function public.room_time_band(uuid) to service_role;

-- Preserve deployed function bodies, signatures, atomic mutations and grants.
-- Replace only their existing band calculation; date/timers remain real KST.
do $patch$
declare f record; definition text; revised text; patched integer:=0;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('mutate_progression','gift_gameplay','acquire_photo_album','acquire_photo') loop
  definition:=pg_get_functiondef(f.oid);
  if position('band:=public.room_time_band(p_user_id);' in definition)>0 then patched:=patched+1;continue;end if;
  revised:=regexp_replace(definition,'band:=case.*?end;','band:=public.room_time_band(p_user_id);','s');
  if revised=definition then
   if f.proname in ('mutate_progression','gift_gameplay','acquire_photo_album') then raise exception 'Missing expected band calculation in %',f.proname;end if;
  else execute revised;patched:=patched+1;end if;
 end loop;
 if patched<3 then raise exception 'Required gameplay functions missing';end if;
end $patch$;
notify pgrst,'reload schema';
commit;
-- Operational rollback: UPDATE public.room_admins SET time_band_override=NULL;
-- Old app versions remain compatible. Remove the admin row to revoke access.
-- Keep room_time_band until callers are restored; do not drop dependencies.
