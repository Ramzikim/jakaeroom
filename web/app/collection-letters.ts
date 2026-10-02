import {allLetters} from './letters.ts';
const regularAssets=['01-04','05-08','09-12','13-16','17-20','21-24','25-28'];
export const collectionLetters=allLetters.map((letter,index)=>({letter,number:index+1,asset:`/library/letter/${index<28?regularAssets[Math.floor(index/4)]:String(index+1)}.png`}));
export const lockedLetterAsset='/library/letter/00_locked.png';
export const storyLetterCount=(ids:readonly string[])=>collectionLetters.filter(({letter})=>ids.includes(letter.id)).length;

export const SPECIAL_HINTS:Record<string,string>={
 special_01:'레코드판 아래 서랍에 뭔가 남아 있는 것 같아요.\n자꾸자꾸 살펴보다 보면 발견할지도...?',
 special_02:'작애는 오래도록 이어진 다정한 손길을 기억하는 것 같아요.\n많이 쓰다듬어 주다 보면 마음이 조금 달라질지도...?',
 special_03:'모두 잠든 새벽,\n작애가 푹 잘 수 있도록 한동안 조용히 지켜봐 주세요.',
 special_04:'작애의 숨겨진 이야기들을 모두 만나고 나면,\n마지막 편지가 찾아올지도 몰라요.'
};
