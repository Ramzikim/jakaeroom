export type Point = [number, number];
export type Mood = 'idle'|'walk'|'pet'|'berry'|'rest'|'sleep'|'wake'|'sit'|'bath'|'window';
export const anchors: Record<string, Point> = {
  cushion:[0,.45], bathExit:[-2.5,1.05], bathDoor:[-1.5,1.05], center:[1.65,-.55], bed:[1.85,-2.65], window:[1.85,-3.1], desk:[3.15,-1.4],
  east:[2.65,.55], snack:[2.75,2.6], rug:[-.95,1.6], west:[-1.3,-.85], wardrobe:[-2.75,-2],
};
const edges: [string,string][] = [['rug','cushion'],['bathExit','bathDoor'],['bathDoor','west'],['center','bed'],['bed','window'],['center','desk'],['center','east'],['east','snack'],['center','west'],['west','wardrobe'],['west','rug']];
export function route(from: string,to:string): Point[] {
  const queue=[[from]], seen=new Set([from]);
  while(queue.length){ const path=queue.shift()!; const last=path.at(-1)!;
    if(last===to) return path.slice(1).map(n=>[...anchors[n]] as Point);
    for(const [a,b] of edges){const n=a===last?b:b===last?a:null;if(n&&!seen.has(n)){seen.add(n);queue.push([...path,n]);}}
  } return [];
}
export function period(hour:number):'dawn'|'day'|'afternoon'|'night'{return hour<6||hour>=23?'dawn':hour<16?'day':hour<18.5?'afternoon':'night';}
export function kst(date=new Date()){const hour=(date.getUTCHours()+9)%24; return {hour,minute:date.getUTCMinutes(),period:period(hour+date.getUTCMinutes()/60)};}
export const atmospheres = {
 dawn:{name:'새벽',bg:'#17233d',sun:'#799ce5',sky:'#17274b',ambient:.28,key:.45,fill:'#718cc7',hemi:.22,lamp:8},
 day:{name:'낮',bg:'#f2eade',sun:'#fff0d5',sky:'#93cfe9',ambient:1.15,key:3.8,fill:'#fff3e3',hemi:.65,lamp:.25},
 afternoon:{name:'오후',bg:'#ecd0bf',sun:'#ffa16a',sky:'#ef9c87',ambient:.8,key:2.4,fill:'#f4bca1',hemi:.45,lamp:1.8},
 night:{name:'밤',bg:'#304667',sun:'#a9b9e0',sky:'#283653',ambient:.55,key:.8,fill:'#aab9d9',hemi:.3,lamp:6},
};
export const waitingLines=['쭈인이는 뭐 하구 있을까아?','{vocativeLong}, 나한테 딸기 좀 주면 좋겠다아!','{nickname} {vocative}, 뭐 하고 있어어?','우우웅...','재미있는 생각이 났는데 잊어버렸다아.','나는 솜이야아.','누가 나한테 딸기 좀 주면 좋겠다아!','재미있는 걸 하고싶어어.','{vocativeLong} 뭐하고 있어어? 작애 조금 심심해애.','{nickname} {vocativeLong}, 같이 뭐 할까아?','작애 혼자 돌아다니는 중이야아.','{vocativeLong} 딸기 같은 거 안 가져왔어어?','여기 구경만 하지 말고 작애랑도 놀아줘어.'];
export const idleLines:Record<string,string[]>={
  center:['왔어어? 내 방에서 같이 놀자!','나 오늘도 귀엽지? 히히.'],
  bed:['이불이 폭신폭신해애.','조금만 누워 볼까아…'], window:['구름도 딸기 모양이면 좋겠다아.','밖에 구경하는 중이야아.'],
  desk:['한 판만 더! 진짜 한 판만!','형아랑 게임하면 내가 이길걸? 히히.'],
  snack:['딸기는 여기 두면 돼애!','간식 구경만 하는 거야아… 진짜루.'],
  rug:['여기가 내 뒹굴뒹굴 자리야.','같이 쉬자아.'], wardrobe:['초록 꽃옷, 나랑 잘 어울리지?'],east:['딸기 냄새가 나는 것 같은데에?'],west:['내 방 구경해애. 맘에 들지?'],
};
export {letters} from './letters.ts';



