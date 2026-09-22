import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
const output=new URL('../public/cursors/',import.meta.url);
await mkdir(output,{recursive:true});
for(const [name,source,size] of [
 ['normal','일반',41],['click','클릭',41],['pet','쓰다듬기',43],['gift','선물주기',43],['bath','목욕',43],
]){
 const art=await sharp(fileURLToPath(new URL(`../../asset/point/point-${source}.png`,import.meta.url))).trim()
  .resize(size,size,{fit:'contain',background:'#00000000'}).extend({top:3,bottom:3,left:3,right:3,background:'#00000000'}).png().toBuffer();
 const width=size+6;
 const alpha=await sharp(art).extractChannel(3).blur(1).raw().toBuffer();
 const shadow=Buffer.alloc(width*width*4);
 for(let y=1;y<width;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  shadow[i]=86;shadow[i+1]=59;shadow[i+2]=43;shadow[i+3]=Math.round(alpha[(y-1)*width+x]*.38);
 }
 await sharp(shadow,{raw:{width,height:width,channels:4}}).composite([{input:art}]).png().toFile(fileURLToPath(new URL(`${name}.png`,output)));
}
