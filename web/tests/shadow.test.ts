import assert from 'node:assert/strict';
import {shadowStyle} from '../app/shadow.ts';
for(const s of ['idle','walk_left','walk_right','backwalk_left','backwalk_right','shy','strawberry'])assert.deepEqual(shadowStyle(s,3),{width:.7,height:.16,opacity:.22,blur:20,visible:true});
const base=shadowStyle('hop',0),apex=shadowStyle('hop',3);
assert.ok(apex.width/base.width>=.55&&apex.width/base.width<=.6);assert.ok(apex.opacity>=.12&&apex.opacity<=.15);assert.equal(apex.blur,28);assert.deepEqual(shadowStyle('hop',7),base);
for(let f=0;f<7;f+=.01)assert.ok(Math.abs(shadowStyle('hop',f+.01).width-shadowStyle('hop',f).width)<.004);
for(const s of ['sit_idle','sit_snooze','sit_sleeploop']){const v=shadowStyle(s,0);assert.equal(v.width,.7*.85);assert.ok(v.height<base.height);assert.equal(v.opacity,.2);}
assert.equal(shadowStyle('bath',0).visible,false);
console.log('Shadow state ratios, hop interpolation/landing and seated shape passed.');
