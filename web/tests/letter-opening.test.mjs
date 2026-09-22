import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../app/room.tsx',import.meta.url),'utf8');
const handler=source.slice(source.indexOf(' const openLetter=async('),source.indexOf(' // Feature-detected agent access'));
let resolve,shown=null,requests=0,error='',counts=null;
const titles=[{id:'letter_01',title:'first',body:'first body'},{id:'letter_02',title:'second',body:'second body'}];
const state={userId:'a',progression:{collected_letter_ids:[],letter_state:{date:'today',counts:{night:0}}}};
const dialog={current:{open:false,showModal(){this.open=true;},close(){this.open=false;}}};
const ref=value=>({current:value}),view=ref(0),retry=ref(null);
const context={exports:{},getProgressionSnapshot:()=>state,getLetter:id=>titles.find(l=>l.id===id),selectLetter:owned=>titles.find(l=>!owned.includes(l.id)),
 document:{querySelector:()=>null,activeElement:null},HTMLElement:class{},dialog,letterPending:ref(false),letterReturnFocus:ref(null),letterCache:ref(null),letterView:view,retryLetterEvent:retry,
 letterButton:ref(null),kstDate:()=> 'today',phase:'night',setLetter:l=>{shown=l;},setLetterError:e=>{error=e;},playSfx:()=>{},storeCounts:c=>{counts=c;},readCounts:()=>({}),crypto,
 requestLetterEvent:()=>{requests++;return new Promise(r=>{resolve=r;});},
};
vm.runInNewContext(ts.transpileModule(handler+'\nexports.open=openLetter;', {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,context);
const first=context.exports.open();assert.equal(dialog.current.open,true);assert.equal(shown.title,'first','full text shown before server completes');assert.equal(requests,1);
assert.equal(await context.exports.open(),false,'duplicate click blocked');
const receipt=retry.current;resolve(null);await first;assert.equal(retry.current,receipt);assert(error.includes('저장'));
dialog.current.close();const second=context.exports.open();const finishAcquisition=resolve;assert.equal(retry.current,receipt,'ambiguous request retries same receipt');
dialog.current.close();view.current++;
const reread=context.exports.open('letter_02');assert.equal(await reread,true);assert.equal(shown.title,'second','reread opens without network wait');
finishAcquisition({userId:'a',letterId:'letter_01',collected:['letter_01'],state:{date:'today',counts:{night:1}}});await second;assert.equal(shown.title,'second','late result cannot overwrite reread');assert.equal(counts.night,1);assert.equal(retry.current,null);
dialog.current.close();view.current++;state.progression.letter_state.counts.night=2;
assert.equal(await context.exports.open(),false,'confirmed quota blocks preview');
assert(!source.includes('편지를 가져오고 있어요'));assert(!source.includes('letterLoading'));
console.log('PASS: immediate bundled text, reread without waiting, pending click guard, stable retry ID, cached quota gate, no loading placeholder');
