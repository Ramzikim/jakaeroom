import type {Action} from '../app/behavior';
export const REWARD_ACTIONS=['pet','bath','berry','basketBerry','tv','game','cushion','bed','window'] as const;
export type RewardAction=typeof REWARD_ACTIONS[number];
// commandLife also returns true for refusal dialogue. Require the actual animation.
export function actionRewardStarted(action:Action,accepted:boolean,before:{sequence:string;started:number},after:{sequence:string;started:number;media:string|null}){
 if(!accepted||!REWARD_ACTIONS.includes(action as RewardAction))return false;
 if(before.sequence===after.sequence&&before.started===after.started)return false;
 const expected:Record<RewardAction,readonly string[]>={pet:['hop','shy'],bath:['bath'],berry:['strawberry'],basketBerry:['strawberry'],tv:['sit_idle'],game:['game'],cushion:['sit_idle'],bed:['sit_snooze'],window:['window']};
 return expected[action as RewardAction].includes(after.sequence)&&(!(action==='tv'||action==='game')||after.media===action);
}
