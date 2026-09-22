import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
function load(path,deps={},globals={}){
 const exports={};vm.runInNewContext(ts.transpileModule(source(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>deps[name]??{},process:{env:{NODE_ENV:'test'}},setTimeout,clearTimeout,AbortController,...globals});return exports;
}
const messages=load('../app/prop-message.tsx');
const first=messages.showPropMessage('drawer'),second=messages.showPropMessage('wardrobe');
messages.updatePropMessage(first,'old error');assert(messages.isPropMessageCurrent(second));
messages.updatePropMessage(second,'');assert(!messages.isPropMessageCurrent(second));
messages.updatePropMessage(second,'late error');assert(!messages.isPropMessageCurrent(second));
// Exercise the actual room click handler with a delayed photo result.
const handler=source('../app/room.tsx').match(/ async function clickPhotoProp[\s\S]*?\n }/)[0];
let letterClicks=0,resolvePhoto,photoCalls=0;
const context={document:{querySelector:()=>null},playSfx:()=>{},...messages,gifts:{collectedPhotoIds:[]},photoPropMessage:a=>a,photoPending:{current:{drawer:false,wardrobe:false}},sleeping:false,
 requestLetterEvent:async()=>{letterClicks++;},recordPhotoAction:async()=>{photoCalls++;return new Promise(resolve=>{resolvePhoto=resolve;});}};
vm.runInNewContext(ts.transpileModule(handler+'\nexports.click=clickPhotoProp;', {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{...context,exports:context});
const drawer=context.click('drawer',{x:0,y:0});await Promise.resolve();
for(let i=0;i<9;i++)await context.click('drawer',{x:0,y:0});
assert.equal(letterClicks,10);assert.equal(photoCalls,1);
const newer=messages.showPropMessage('new wardrobe');resolvePhoto({error:true});await drawer;assert(messages.isPropMessageCurrent(newer));
// Bound a stalled response body, not just the response headers.
const requests=load('../app/request-json.ts',{}, {fetch:async(_url,{signal})=>({ok:true,json:()=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))))})});
const queue=load('../app/coin-events.ts').queueCoinOperation,order=[];
const stalled=queue(async()=>{await requests.requestJson('/test',{},15);order.push('unexpected');});
const following=queue(async()=>order.push('recovered'));await Promise.all([stalled,following]);assert.deepEqual(order,['recovered']);
await assert.rejects(requests.withTimeout(new Promise(()=>{}),15),/timed out/);
// A committed purchase must not be changed to a failure by a subsequent read.
const committed={ok:true,ownedGiftIds:['mimi_plush'],newBalance:900};
let followupReads=0;
const route=load('../app/api/gifts/route.ts',{
 '@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test'}},error:null})}})},
 '../../../lib/server/gifts':{giftsFor:()=>({purchaseGift:async()=>committed})},
 '../../../lib/server/progression':{loadProgression:async()=>{followupReads++;throw Error('read down');}},
 '../../../lib/gifts':{getGiftById:()=>({id:'mimi_plush',isPurchasable:true,acquisitionType:'cabinet_order'})},
},{Response,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test-only'}}});
const request=()=>new Request('http://local/api/gifts',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({giftId:'mimi_plush',route:'cabinet_order'})});
assert.equal((await route.POST(request())).status,200);assert.equal((await (await route.POST(request())).json()).ok,true);
committed.progression={heart_coin_balance:900};const before=followupReads;
assert.deepEqual((await (await route.POST(request())).json()).progression,committed.progression);assert.equal(followupReads,before,'transaction snapshot skips the extra read');
console.log('PASS: all drawer clicks recorded, stale/closed popup guard, bounded body/session requests, queue recovery, committed purchase stays successful');
