import assert from 'node:assert/strict';
import fs from 'node:fs';
const frames=JSON.parse(fs.readFileSync('app/sprite-frames.json','utf8'));
for(const sequence of Object.values(frames))for(let i=0;i<sequence.length;i++){
 const frame=sequence[i];assert.ok(!i||frame.number>sequence[i-1].number);
 assert.deepEqual(fs.readFileSync('public'+frame.url),fs.readFileSync('../jakae_sprite/png/'+frame.url.split('/').at(-1)));
}
console.log('Four room-space directions, numeric frame ordering and unchanged PNG copies passed.');
