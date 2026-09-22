import {allLetters} from './letters.ts';
const regularAssets=['01-04','05-08','09-12','13-16','17-20','21-24','25-28'];
export const collectionLetters=allLetters.map((letter,index)=>({letter,number:index+1,asset:`/library/letter/${index<28?regularAssets[Math.floor(index/4)]:String(index+1)}.png`}));
export const lockedLetterAsset='/library/letter/00_locked.png';
export const storyLetterCount=(ids:readonly string[])=>collectionLetters.filter(({letter})=>ids.includes(letter.id)).length;
