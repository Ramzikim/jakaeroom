import assert from 'node:assert/strict';
import {shadowSurfaceY} from '../app/shadow.ts';
import {setSfxEnabled,unlockSfx,playSfx} from '../app/sfx.ts';
assert.equal(shadowSurfaceY(0,1,0),.042);
assert.equal(shadowSurfaceY(3,-2,0),.008);
assert.equal(shadowSurfaceY(0,.45,.235),.243);
let starts=0,resumes=0;const gains:number[]=[];
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(v:number){gains.push(v);},exponentialRampToValueAtTime(){}});
class FakeAudio {
 state='suspended';currentTime=1;destination={};sampleRate=100;
 async resume(){resumes++;this.state='running';}
 createGain(){return {gain:param(),connect(){},disconnect(){}};}
 createOscillator(){const o={type:'',frequency:param(),onended:null as null|(()=>void),connect(){},disconnect(){},start(){starts++;},stop(){o.onended?.();}};return o;}
}
Object.assign(globalThis,{window:{AudioContext:FakeAudio}});
assert.equal(await unlockSfx(),true);assert.equal(resumes,1);
playSfx('pop');assert.equal(starts,0);
setSfxEnabled(true);playSfx('pop');assert.equal(starts,1);assert.ok(gains[0]>.1);
playSfx('pop');assert.equal(starts,1);
setSfxEnabled(false);playSfx('step');assert.equal(starts,1);
console.log('Rug/cushion shadow height, audio resume, audible envelope, mute and cooldown regression checks passed.');
