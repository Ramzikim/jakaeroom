begin;
alter table public.profiles drop constraint if exists "profiles_relationshipTier_check";
-- Keep legacy 'standard' accepted during rollout; the application only emits 'normal'.
alter table public.profiles add constraint "profiles_relationshipTier_check"
 check ("relationshipTier" in ('standard','normal','vip_dad','vip_owner','vip_jangmi'));
alter table public.profiles alter column "relationshipTier" set default 'normal';
update public.profiles set "relationshipTier"=case
 when btrim(nickname)='쭈인' and gender='female' and "birthYear"=1991 then 'vip_owner'
 when btrim(nickname)='아빠' and gender='male' and "birthYear"=1995 then 'vip_dad'
 when btrim(nickname)='장미' and gender='female' and "birthYear"=1990 then 'vip_jangmi'
 else 'normal' end;
commit;
