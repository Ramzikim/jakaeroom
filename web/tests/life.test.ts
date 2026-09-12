import assert from 'node:assert/strict';
import {anchors,kst,period,route,letters} from '../app/life.ts';
const cases:[number,string][]=[[0,'dawn'],[5,'dawn'],[6,'day'],[15,'day'],[16,'afternoon'],[17,'afternoon'],[18,'night'],[23,'night']];
for(const [hour,expected] of cases)assert.equal(period(hour),expected);
assert.deepEqual(kst(new Date('2026-09-10T21:30:00Z')),{hour:6,minute:30,period:'day'});
assert.equal(kst(new Date('2026-09-11T15:00:00Z')).hour,0);
// Navigation must reach every zone without cutting across furniture footprints.
const obstacles=[[-.87,1.27,-3.94,-1.46],[-.60,.60,-.08,.98],[.45,1.85,1.175,2.125],[2.85,3.65,-2.88,-2.13],[-4.45,-3.51,-3.9,-1.31]];
for(const from of Object.keys(anchors))for(const to of Object.keys(anchors)){
 const points=[anchors[from],...route(from,to)];assert.deepEqual(points.at(-1),anchors[to]);
 for(let i=1;i<points.length;i++)for(let t=0;t<=1;t+=.01){const x=points[i-1][0]*(1-t)+points[i][0]*t,z=points[i-1][1]*(1-t)+points[i][1]*t;
  for(const [left,right,back,front]of obstacles)assert.ok(!(x>left-.28&&x<right+.28&&z>back-.28&&z<front+.28),`${from} -> ${to}: furniture collision at ${x},${z}`);
 }
}
assert.ok(letters.length>=9);assert.equal(new Set(letters).size,letters.length);
console.log('KST boundaries, midnight rollover, all navigation routes and local letter pool passed.');
