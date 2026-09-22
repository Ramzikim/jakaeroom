import {createClient} from '@supabase/supabase-js';
import {giftsFor} from '../../../lib/server/gifts';
import {loadProgression} from '../../../lib/server/progression';
import {getGiftById} from '../../../lib/gifts';
export async function POST(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return json({error:'authentication_required'},401);
 let input:{giftId:string;route:'cabinet_order'|'homeshopping';band?:'day'|'afternoon'|'night'|'dawn'};
 try{const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);if(!input||typeof input.giftId!=='string'||!['cabinet_order','homeshopping'].includes(input.route))throw Error();}catch{return json({error:'invalid_request'},400);}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:'unavailable'},503);
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return json({error:'authentication_required'},401);
  const gift=getGiftById(input.giftId);
  if(!gift)return json({ok:false,reason:'unknown_gift',giftId:input.giftId});
  if(!gift.isPurchasable)return json({ok:false,reason:'not_purchasable',giftId:gift.id});
  if(gift.acquisitionType!==input.route)return json({ok:false,reason:'wrong_route',giftId:gift.id});
  if(input.route==='homeshopping'&&!['day','afternoon','night','dawn'].includes(input.band??''))return json({error:'invalid_request'},400);
  const service=giftsFor(user.id);
  const result=input.route==='cabinet_order'?await service.purchaseGift(gift.id):await service.purchaseHomeshoppingGift(gift.id,input.band!);
  const state=await loadProgression(user.id);
  return json({...result,progression:state.progression});
 }catch{return json({error:'unavailable'},503);}
}
