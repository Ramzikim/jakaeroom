'use client';
import {useId} from 'react';
export function RoomIcon({kind}:{kind:'heart'|'berry'|'bed'|'letter'|'home'|'focus'}){
 const id=useId().replace(/:/g,'');
 return <svg className={'clay-icon icon-'+kind} viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id={id} x2=".3" y2="1"><stop stopColor={kind==='focus'?'#d4e4bd':'#ffbfc4'}/><stop offset="1" stopColor={kind==='focus'?'#88aa7a':'#dc7886'}/></linearGradient></defs><g strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" stroke="#a8786533">
 {kind==='heart'&&<path fill={`url(#${id})`} d="M32 54C22 48 6 37 6 22C6 7 25 4 32 17C39 4 58 7 58 22C58 37 42 49 32 54Z"/>}
 {kind==='berry'&&<><path fill={`url(#${id})`} d="M12 27Q10 13 32 17Q54 13 52 29Q48 55 32 58Q16 55 12 27"/><path fill="#86aa72" d="M31 20Q12 19 20 11Q28 9 31 15Q31 1 39 6Q43 10 36 16Q51 10 49 19Q43 26 31 20"/>{[[23,30],[40,28],[31,39],[22,43],[39,44]].map(([x,y])=><ellipse key={x+','+y} cx={x} cy={y} rx="2" ry="3" fill="#ffdbb9" stroke="none"/>)}</>}
 {kind==='bed'&&<><path d="M10 12V54M54 32V54M11 44H54" stroke="#936553" strokeWidth="9"/><rect x="14" y="24" width="39" height="18" rx="6" fill={`url(#${id})`}/><rect x="14" y="22" width="15" height="13" rx="5" fill="#ffe7d1"/></>}
 {kind==='letter'&&<><rect x="7" y="14" width="50" height="38" rx="8" fill="#fff0db"/><path d="M10 18L32 36L54 18" fill="#f19ca6"/><path d="M10 48L25 34M54 48L39 34" fill="none"/></>}
 {kind==='home'&&<><rect x="17" y="26" width="32" height="29" rx="6" fill="#f2d7bb"/><path d="M9 29L32 8L56 29" fill="none" stroke="#e9959b" strokeWidth="11"/><path d="M27 55V41Q32 32 38 41V55" fill="#be9280"/></>}
 {kind==='focus'&&<><rect x="6" y="6" width="52" height="52" rx="19" fill={`url(#${id})`}/><path d="M25 18H18V25M39 18H46V25M18 39V46H25M46 39V46H39" stroke="#fff7e9" strokeWidth="5" fill="none"/></>}
 </g></svg>;
}

