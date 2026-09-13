import assert from 'node:assert/strict';
import {placeBubble} from '../app/bubble-layout.ts';
for(const viewportWidth of [390,430,1280])for(const width of [66,114])for(const height of [34,90])for(const scale of [1,1.3,2]){
 const sprite={left:viewportWidth*.52-20*scale,right:viewportWidth*.52+20*scale,top:340-65*scale,bottom:340};
 const p=placeBubble(sprite,width,height,viewportWidth,700);
 assert(p.visible);assert(p.x>=8&&p.x+width<=viewportWidth-8);assert(p.y>=8&&p.y+height<=700-8);
 assert(p.y+height<=sprite.top||p.x>=sprite.right||p.x+width<=sprite.left);
}
const edge=placeBubble({left:310,right:370,top:35,bottom:150},110,85,390,700);
assert(edge.visible&&edge.x+110<310);
console.log('Bubble viewport containment and character separation passed.');
