import fs from 'node:fs/promises';
const categories=['food','outfit','window','happy','hug'];
const catalog=[];
for(const category of categories){
 const source=`../asset/library/photo_framed/${category}`,target=`public/library/photo_framed/${category}`;
 const files=(await fs.readdir(source)).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort();
 await fs.mkdir(target,{recursive:true});
 for(const [index,file] of files.entries()){
  await fs.copyFile(`${source}/${file}`,`${target}/${file}`);
  catalog.push({id:`${category}_${String(index+1).padStart(2,'0')}`,category,assetPath:`/library/photo_framed/${category}/${file}`,available:true});
 }
}
await fs.writeFile('lib/photo-catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log(`Photo assets: ${catalog.length}`);
