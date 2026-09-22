-- Additive letter state. Keep existing rewards, ownership, and RLS unchanged.
begin;
alter table public.user_progression add column if not exists letter_state jsonb not null default '{"version":0,"date":"","counts":{},"vipIds":[]}';
-- Preserve every old collection position without issuing a second reward.
update public.user_progression p set collected_letter_ids=(select coalesce(array_agg(distinct mapped),'{}') from (
 select case when id ~ '^(dawn|day|afternoon|night)_0[1-7]$' then
 'letter_'||lpad(((case split_part(id,'_',1) when 'dawn' then 0 when 'day' then 7 when 'afternoon' then 14 else 21 end)+split_part(id,'_',2)::integer)::text,2,'0') else id end mapped
 from unnest(p.collected_letter_ids) id) m);

-- The server computes eligibility; this service-role-only CAS commits state and
-- all letter awards in one transaction through the existing reward function.
create or replace function public.commit_letter_event(p_user_id uuid,p_version integer,p_state jsonb,p_grants text[],p_event_id text,p_letter_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.user_progression; item text; result jsonb; total integer:=0; fresh boolean:=false; receipt text:='letter-event:'||p_event_id;
begin
 select * into r from public.user_progression where user_id=p_user_id for update;
 if not found then raise exception 'Progression missing'; end if;
 if p_event_id<>'' and r.reward_receipts ? receipt then
  result:=public.mutate_progression(p_user_id,'ensure');
  return result||jsonb_build_object('letterId',r.reward_receipts->receipt->'letterId','duplicate',true);
 end if;
 if (r.letter_state->>'version')::integer<>p_version then return jsonb_build_object('conflict',true); end if;
 update public.user_progression set letter_state=jsonb_set(p_state,'{version}',to_jsonb(p_version+1)) where user_id=p_user_id;
 foreach item in array p_grants loop
  if item !~ '^(letter_(0[1-9]|1[0-9]|2[0-8])|special_0[1-4])$' then raise exception 'Invalid story letter'; end if;
  result:=public.mutate_progression(p_user_id,'letter',p_item_id=>item,p_special=>item like 'special_%');
  total:=total+(result->>'delta')::integer;fresh:=fresh or (result->>'newlyCollected')::boolean;
 end loop;
 if p_event_id<>'' then update public.user_progression set reward_receipts=reward_receipts||jsonb_build_object(receipt,jsonb_build_object('letterId',p_letter_id)) where user_id=p_user_id;end if;
 result:=public.mutate_progression(p_user_id,'ensure');
 return result||jsonb_build_object('delta',total,'newlyCollected',fresh,'letterId',p_letter_id);
end $$;
revoke all on function public.commit_letter_event(uuid,integer,jsonb,text[],text,text) from public,anon,authenticated;
grant execute on function public.commit_letter_event(uuid,integer,jsonb,text[],text,text) to service_role;
commit;
-- Rollback: restore old application first, drop commit_letter_event and letter_state.
-- ID remapping is intentionally retained to preserve collected story positions.
