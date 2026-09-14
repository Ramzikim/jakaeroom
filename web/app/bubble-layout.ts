export type Rect={left:number;top:number;right:number;bottom:number};
export function placeBubble(sprite:Rect,width:number,height:number,viewportWidth:number,viewportHeight:number){
 const edge=8,gap=viewportWidth<=600?6:4;
 const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(n,max));
 const x=clamp(sprite.right+gap,edge,viewportWidth-width-edge);
 // Prefer beside the head, slightly higher, with a clear horizontal gap.
 if(sprite.right+gap+width<=viewportWidth-edge){
  const y=clamp(sprite.top-Math.min(16,height*.25),edge,viewportHeight-height-edge);
  return {x:sprite.right+gap,y,visible:true};
 }
 const above=sprite.top-gap-height;
 // Grow upwards, never down across the face. Fall back to a clear side near the top edge.
 if(above>=edge)return {x,y:Math.min(above,viewportHeight-height-edge),visible:true};
 const y=clamp(sprite.top,edge,viewportHeight-height-edge);
 if(sprite.right+gap+width<=viewportWidth-edge)return {x:sprite.right+gap,y,visible:true};
 if(sprite.left-gap-width>=edge)return {x:sprite.left-gap-width,y,visible:true};
 // At extreme zoom the character can fill the viewport: don't draw over its face.
 return {x,y:edge,visible:sprite.top>=height+edge};
}
