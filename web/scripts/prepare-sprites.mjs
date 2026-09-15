import fs from 'node:fs';
import path from 'node:path';
const destination=path.resolve('public/jakae_sprite');
const source=fs.existsSync(path.resolve('../jakae_sprite/png'))?path.resolve('../jakae_sprite/png'):destination;
fs.mkdirSync(destination,{recursive:true});
const sequences={};
for(const file of fs.readdirSync(source)){
 const match=/^jakae_(idle|walk_left|walk_right|backwalk_left|backwalk_right|hop|shy|sit_idle|sit_snooze|sit_sleeploop|bath|strawberry|window|game)_(\d+)\.png$/.exec(file);
 if(!match)continue;
 const bytes=fs.readFileSync(path.join(source,file));
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')continue;
 (sequences[match[1]]??=[]).push({url:'/jakae_sprite/'+file,number:Number(match[2]),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)});
 if(source!==destination)fs.copyFileSync(path.join(source,file),path.join(destination,file));
}
for(const name of ['idle','walk_left','walk_right','backwalk_left','backwalk_right','hop','shy','sit_idle','sit_snooze','sit_sleeploop','bath','strawberry','window','game']){
 if(!sequences[name]?.length)throw new Error('Missing sprite sequence: '+name);
 sequences[name].sort((a,b)=>a.number-b.number);
}
fs.writeFileSync('app/sprite-frames.json',JSON.stringify(sequences,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(sequences).map(([k,v])=>[k,v.length])));


for(const name of ['monitor_01.png','monitor_02.png','monitor_03.png']){const file=path.resolve('../jakae_sprite',name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(destination,name));}
