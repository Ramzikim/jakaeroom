'use client';
let lpOwnsMusic=false;
const listeners=new Set<()=>void>();
export const getLpOwnsMusic=()=>lpOwnsMusic;
export function subscribeMusicSource(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
// Synchronous notification pauses BGM before the LP calls audio.play().
export function claimLpMusic(){if(!lpOwnsMusic){lpOwnsMusic=true;listeners.forEach(listener=>listener());}}
