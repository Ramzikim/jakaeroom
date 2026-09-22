-- Additive. Ownership never resets; only this separate KST pity state expires.
alter table public.user_progression add column if not exists homeshopping_date date not null default (now() at time zone 'Asia/Seoul')::date;
alter table public.user_progression add column if not exists homeshopping_daily_state jsonb not null default '{}';

-- Catalog/prices/letter IDs are supplied only by the trusted server registry.
create or replace function public.gift_gameplay(p_user_id uuid,p_action text,p_gift_id text,p_band text,p_event_id uuid,p_source text,p_catalog jsonb,p_regular_letters text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 r public.user_progression; g jsonb; gift_id text:=p_gift_id; price integer;
 today date:=(now() at time zone 'Asia/Seoul')::date; hour numeric; band text;
 s jsonb; states jsonb; view_count integer; complete boolean; owned boolean;
 reason text:='state'; failure text; force_show boolean:=false; spend jsonb;
begin
 if p_user_id is null then return jsonb_build_object('ok',false,'reason','authentication_required','giftId',gift_id); end if;
 if p_action is null or p_action not in ('state','reset','purchase','can_purchase','grant','completion','tv_view','pity','shown') then
  return jsonb_build_object('ok',false,'reason','invalid_request','giftId',gift_id);
 end if;
 perform public.mutate_progression(p_user_id,'ensure');
 select * into r from public.user_progression where user_id=p_user_id for update;
 if r.homeshopping_date<>today then
  update public.user_progression set homeshopping_date=today,homeshopping_daily_state='{}' where user_id=p_user_id;
  r.homeshopping_daily_state:='{}';r.homeshopping_date:=today;
 end if;
 complete:=coalesce(cardinality(p_regular_letters)=28 and (select count(distinct id)=28 from unnest(p_regular_letters) id) and p_regular_letters<@r.collected_letter_ids,false);
 hour:=extract(hour from now() at time zone 'Asia/Seoul')+extract(minute from now() at time zone 'Asia/Seoul')/60;
 band:=case when hour>=6 and hour<16 then 'day' when hour>=16 and hour<18.5 then 'afternoon' when hour>=18.5 and hour<23 then 'night' else 'dawn' end;

 if p_action in ('tv_view','pity','shown') then
  if p_band is null or p_band<>band then failure:='wrong_band';
  else
   select item into g from jsonb_array_elements(p_catalog) item where item->>'acquisitionType'='homeshopping' and item->>'band'=band;
   gift_id:=g->>'id';
   if gift_id is null then failure:='unknown_gift';
   elsif p_action='tv_view' and p_event_id is null then failure:='invalid_request';
   else
    owned:=gift_id=any(r.owned_gift_ids) or gift_id=any(r.purchased_gift_ids);
    s:=coalesce(r.homeshopping_daily_state->band,'{"viewCount":0,"shown":false,"lastSeenGiftId":null,"events":[]}');
    view_count:=coalesce((s->>'viewCount')::integer,0);
    if p_action='tv_view' and not owned then
     if not(coalesce(s->'events','[]') ? p_event_id::text) then
      view_count:=view_count+1;
      s:=s||jsonb_build_object('viewCount',view_count,'events',coalesce(s->'events','[]')||jsonb_build_array(p_event_id::text));
     end if;
     reason:='recorded';
    elsif p_action='shown' and not owned then
     s:=s||jsonb_build_object('shown',true,'lastSeenGiftId',gift_id);reason:='shown';
    end if;
    force_show:=not owned and not coalesce((s->>'shown')::boolean,false) and view_count>=case when p_action='tv_view' then 4 else 3 end;
    update public.user_progression set homeshopping_daily_state=jsonb_set(homeshopping_daily_state,array[band],s) where user_id=p_user_id;
   end if;
  end if;
 elsif p_action in ('grant','completion') then
  if p_action='completion' then select item into g from jsonb_array_elements(p_catalog) item where item->>'acquisitionType'='letter_completion';gift_id:=g->>'id';
  else select item into g from jsonb_array_elements(p_catalog) item where item->>'id'=gift_id;end if;
  if g is null then failure:='unknown_gift';
  elsif g->>'acquisitionType'<>'letter_completion' or (p_action='grant' and p_source is distinct from 'letter_completion') then failure:='wrong_route';
  elsif not complete then failure:='letters_incomplete';
  elsif gift_id=any(r.owned_gift_ids) then reason:='already_granted';
  else perform public.mutate_progression(p_user_id,'own_gift',p_item_id=>gift_id);reason:='granted';end if;
 elsif p_action in ('purchase','can_purchase') then
  select item into g from jsonb_array_elements(p_catalog) item where item->>'id'=gift_id;
  if g is null then failure:='unknown_gift';
  elsif not coalesce((g->>'isPurchasable')::boolean,false) then failure:='not_purchasable';
  elsif p_source is null or p_source not in ('cabinet_order','homeshopping') or g->>'acquisitionType'<>p_source then failure:='wrong_route';
  elsif p_source='homeshopping' and (p_band is null or p_band<>band or g->>'band'<>band) then failure:='wrong_band';
  elsif gift_id=any(r.owned_gift_ids) or gift_id=any(r.purchased_gift_ids) then failure:='already_owned';
  else
   price:=(g->>'price')::integer;
   if price is null or price<=0 or price%10<>0 then failure:='invalid_request';
   elsif r.heart_coin_balance<price then failure:='insufficient_funds';
   elsif p_action='can_purchase' then reason:='eligible';
   else
    spend:=public.mutate_progression(p_user_id,'spend',p_amount=>price,p_event_id=>'gift:'||gift_id);
    if not (spend->>'ok')::boolean then failure:='insufficient_funds';
    else
     perform public.mutate_progression(p_user_id,'purchase_gift',p_item_id=>gift_id);
     perform public.mutate_progression(p_user_id,'own_gift',p_item_id=>gift_id);
     reason:='purchased';
    end if;
   end if;
  end if;
 end if;
 if failure is not null then return jsonb_build_object('ok',false,'reason',failure,'giftId',gift_id);end if;
 select * into r from public.user_progression where user_id=p_user_id;
 select coalesce(jsonb_object_agg(key,value-'events'),'{}') into states from jsonb_each(r.homeshopping_daily_state);
 return jsonb_build_object('ok',true,'reason',reason,'giftId',gift_id,'newBalance',r.heart_coin_balance,
  'ownedGiftIds',r.owned_gift_ids,'purchasedGiftIds',r.purchased_gift_ids,'hasAllRegularLetters',complete,
  'homeshoppingDate',r.homeshopping_date,'homeshopping',states,'shouldForce',force_show);
end $$;
revoke all on function public.gift_gameplay(uuid,text,text,text,uuid,text,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.gift_gameplay(uuid,text,text,text,uuid,text,jsonb,text[]) to service_role;
