import fs from 'node:fs';
import path from 'node:path';
const dest=path.resolve('public/music');
const source=fs.existsSync(path.resolve('../asset/Music'))?path.resolve('../asset/Music'):dest;
fs.mkdirSync(dest,{recursive:true});
const files=fs.readdirSync(source);
const additions=[
 '사랑과 상속의 조건 OST.mp3',
 '구름소년단 - 말랑해지네 (be Cottener).mp3',
 '코튼시티바람 - Vanilla Dream.mp3',
 '솜앤오프 - 폭신해지게 될거야.mp3',
 '오마이솜 - 딸기숲의 비밀.mp3',
];
const found=files.filter(f=>/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(f));
const audio=[...found.filter(f=>!additions.includes(f)).sort((a,b)=>a.localeCompare(b,'ko')),...additions];
if(audio.length!==15||additions.some(file=>!found.includes(file)))throw new Error(`Expected 15 tracks including finalized additions, found ${found.length}`);
const icons=Object.fromEntries(['music','out','play','play_ing'].map(name=>{const file=files.find(f=>path.parse(f).name===name);if(!file)throw new Error(`Missing ${name}`);return [name,file];}));
for(const file of [...audio,...Object.values(icons)])if(source!==dest)fs.copyFileSync(path.join(source,file),path.join(dest,file));
fs.writeFileSync('app/music-files.json',JSON.stringify({tracks:audio.map(file=>({title:path.parse(file).name,url:'/music/'+file})),icons:Object.fromEntries(Object.entries(icons).map(([k,v])=>[k,'/music/'+v]))},null,2));
console.log(`Prepared ${audio.length} tracks`);
