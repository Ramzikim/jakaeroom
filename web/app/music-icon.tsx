export function MusicIcon({name}:{name:'shuffle'|'previous'|'play'|'pause'|'next'|'repeat'|'speaker'|'muted'}){
 const paths={shuffle:'M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.5 0 3-2 4-4m4-4c1-2 2.5-4 4-4h3m-4-4 4 4-4 4',previous:'M5 5v14M19 5 8 12l11 7Z',play:'m8 4 13 8-13 8Z',pause:'M8 5v14M16 5v14',next:'M19 5v14M5 5l11 7-11 7Z',repeat:'m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3',speaker:'M3 9h4l5-5v16l-5-5H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',muted:'M3 9h4l5-5v16l-5-5H3Zm13 0 6 6m0-6-6 6'};
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={name==='pause'?3:1.8} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
