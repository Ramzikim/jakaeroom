begin;
do $patch$
declare definition text; old_condition text := 'p_action=''pet'' and vip and ''letter_22''=any(r.collected_letter_ids)';
 new_condition text := 'p_action=''pet'' and ((vip and ''letter_22''=any(r.collected_letter_ids)) or r.collected_letter_ids @> array(select ''letter_''||lpad(i::text,2,''0'') from generate_series(1,28) i) or coalesce((r.letter_state->>''hugRevealed'')::boolean,false))';
begin
 select pg_get_functiondef('public.acquire_photo_album(uuid,text,uuid,jsonb,jsonb)'::regprocedure) into definition;
 if position(old_condition in definition)>0 then execute replace(definition,old_condition,new_condition);
 elsif position(new_condition in definition)=0 then raise exception 'Unexpected hug eligibility: migration stopped'; end if;
end $patch$;
-- Remember visibility for existing eligible accounts, including previous unique hug owners.
update public.user_progression r set letter_state=jsonb_set(coalesce(letter_state,'{}'::jsonb),'{hugRevealed}','true')
where r.collected_letter_ids @> array(select 'letter_'||lpad(i::text,2,'0') from generate_series(1,28) i)
 or exists(select 1 from unnest(r.collected_photo_ids) id where id like 'hug_%')
 or ('letter_22'=any(r.collected_letter_ids) and exists(select 1 from public.profiles p where p."userId"=r.user_id and ((p.nickname='쭈인' and p.gender='female' and p."birthYear"=1991) or (p.nickname='아빠' and p.gender='male' and p."birthYear"=1995) or (p.nickname='장미' and p.gender='female' and p."birthYear"=1990))));
commit;
