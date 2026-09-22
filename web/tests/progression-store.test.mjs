import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let subscribe,getSnapshot,onAuth,onCoin,finishRead,reads=0;
let session={user:{id:'a'},access_token:'test'};
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../app/progression-store.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 exports,setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{},window:{addEventListener:()=>{},removeEventListener:()=>{}},document:{visibilityState:'visible'},
 require:name=>({react:{useSyncExternalStore:(s,g)=>{subscribe=s;getSnapshot=g;return g();}},
 './auth-client':{authClient:()=>({auth:{getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{onAuth=fn;return {data:{subscription:{unsubscribe:()=>{}}}};}}})},
 './coin-events':{subscribeCoins:fn=>{onCoin=fn;return()=>{};}},
 './request-json':{withTimeout:value=>Promise.resolve(value),requestJson:()=>{reads++;return new Promise(resolve=>{finishRead=resolve;});}},
 }[name]??{}),
});
exports.useProgression();const offHud=subscribe(()=>{}),offCabinet=subscribe(()=>{});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));await tick();
assert.equal(reads,1,'HUD and cabinet share one initial read');
const concurrent=exports.refreshProgression();assert.equal(reads,1,'in-flight reads are shared');
onCoin({userId:'a',result:{progression:{heart_coin_balance:105}}});
finishRead({progression:{heart_coin_balance:100}});await concurrent;
assert.equal(getSnapshot().progression.heart_coin_balance,105,'old read cannot undo a reward');
const pending=exports.refreshProgression(true);await tick();assert.equal(reads,2);
session=null;onAuth('SIGNED_OUT',null);assert.equal(getSnapshot().userId,null);assert.equal(getSnapshot().progression,null);
finishRead({progression:{heart_coin_balance:999}});await pending;assert.equal(getSnapshot().progression,null,'logout discards old account responses');
session={user:{id:'b'},access_token:'test-b'};onAuth('SIGNED_IN',session);await tick();await tick();
onCoin({userId:'a',result:{progression:{heart_coin_balance:777}}});assert.equal(getSnapshot().progression,null,'old account events ignored');
finishRead({progression:{heart_coin_balance:20}});await tick();assert.equal(getSnapshot().progression.heart_coin_balance,20);
offHud();offCabinet();
console.log('PASS: shared reads, mutation/read race, logout and cross-account isolation');
