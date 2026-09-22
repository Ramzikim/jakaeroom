-- Trusted server catalog only. Existing progression row lock serializes all drops.
create or replace function public.acquire_photo(p_user_id uuid,p_action text,p_event_id uuid,p_catalog jsonb,p_chances jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 r public.user_progression; category text; categories text[]; selected text;
 band text; hour numeric; cap integer; vip boolean; result jsonb;
 receipt text := 'photo_event:'||p_event_id; empty_result jsonb := '{"photoId":null,"delta":0}';
begin
 if p_event_id is null or p_action is null or p_action not in ('pet','hug','food','wardrobe','window','tv','game','cushion','walk','idle','bath','sleep') then raise exception 'Invalid photo event'; end if;
 perform public.mutate_progression(p_user_id,'ensure');
 select * into r from public.user_progression where user_id=p_user_id for update;
 if r.reward_receipts ? receipt then return empty_result; end if;
 -- Prevent rapid request spam, including failed rolls. Retries never reroll.
 if coalesce((r.reward_receipts->>'photo_last_event_at')::timestamptz,'epoch') > clock_timestamp()-interval '3 seconds' then return empty_result; end if;
 update public.user_progression set reward_receipts=reward_receipts||jsonb_build_object(receipt,true,'photo_last_event_at',clock_timestamp()) where user_id=p_user_id;
 if p_action='sleep' or r.daily_photo_total>=10 then return empty_result; end if;
 select exists(select 1 from public.profiles p where p."userId"=p_user_id and
 ((p.nickname='쭈인' and p.gender='female' and p."birthYear"=1991) or
 (p.nickname='아빠' and p.gender='male' and p."birthYear"=1995) or
 (p.nickname='장미' and p.gender='female' and p."birthYear"=1990))) into vip;
 hour:=extract(hour from now() at time zone 'Asia/Seoul')+extract(minute from now() at time zone 'Asia/Seoul')/60;
 band:=case when hour>=6 and hour<16 then 'day' when hour>=16 and hour<18.5 then 'afternoon' when hour>=18.5 and hour<23 then 'night' else 'dawn' end;
 categories:=case p_action when 'pet' then array['hug','happy'] when 'hug' then array['hug','happy'] when 'food' then array['food','happy'] when 'wardrobe' then array['outfit','happy'] when 'window' then array['window','happy'] else array['happy'] end;
 foreach category in array categories loop
  cap:=case category when 'hug' then 1 when 'happy' then 5 else 2 end;
  if category='hug' and not vip then continue; end if;
  if coalesce((r.daily_photo_category_counts->>category)::integer,0)>=cap then continue; end if;
  if category='outfit' and coalesce((r.daily_photo_category_counts->>('outfit:'||band))::integer,0)>=1 then continue; end if;
  select item->>'id' into selected from jsonb_array_elements(p_catalog) item where item->>'category'=category and not(item->>'id'=any(r.collected_photo_ids)) order by random() limit 1;
  if selected is null or random()>=coalesce((p_chances->>category)::numeric,0) then continue; end if;
  result:=public.mutate_progression(p_user_id,'photo',p_item_id=>selected,p_category=>category);
  if category='outfit' then update public.user_progression set daily_photo_category_counts=daily_photo_category_counts||jsonb_build_object('outfit:'||band,1) where user_id=p_user_id; end if;
  return jsonb_build_object('photoId',selected,'category',category,'delta',result->'delta');
 end loop;
 return empty_result;
end $$;
revoke all on function public.acquire_photo(uuid,text,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.acquire_photo(uuid,text,uuid,jsonb,jsonb) to service_role;
