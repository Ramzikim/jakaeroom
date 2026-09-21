export const vipIdleLines=[
 '{vipVocative} 뭐해애? 안아죠!!',
 '{vipVocative} 왔으니까 작애 이제 안 심심해에!',
 '작애 계속 {vipVocative}만 기다리구 있었어어..',
 '{vipVocative} 옆에 있으면 그냥 좋아아. 히히..',
 '작애 여기 있었어어. {vipVocative} 올 줄 알았지이.',
];
export const vipPettingLines=[
 '{vipVocative}한테 귀여움 받기 최고야아!',
 '더 해죠.',
 '헤헤... 작애 털 예쁘게 해줘어!',
 '{vipVocative} 손인 거 알아아. 그래서 가만히 있는 거야아.',
 '작애 기분 엄청 좋아졌어어!',
 '{vipVocative} 손은 이제 바로 알아아.',
 '{vipVocative}가 해주면 더 좋은 것 같아아.',
 '작애 {vipVocative}한테 쓰담 받는 거 익숙해졌어어.',
 '{vipVocative} 오늘도 작애 예뻐해주는 거야아?',
 '헤헤... {vipVocative}니까 특별히 오래 해도 돼애.',
 '{vipVocative} 손 오면 작애 안 피할 거야아.',
 '작애는 {vipVocative}가 만져주는 거 좋아아. 비밀이야아.',
 '{vipVocative} 옆에 있으면 작애 마음이 편해애.',
];
export const pettingLines=['히히, 나 귀엽지이?','헤헤에... 이거 기분 좋아!','가시는 살살 만져야대.','더 쓰다듬어줘어!','작애 폭신하지이?','움~! 특별히 한번 더 하게 해줄까아.','히히... 손 따뜻해애.','작애 여기 더 쓰다듬어줘어.','작애 털 지금 엄청 폭신하지이?','조금 간지러운데 기분은 좋아아.','헤헤, 작애 오늘 귀여움 많이 받네에.','거기 좋아아. 딱 거기이.','작애 가만히 있을 테니까 계속 해도 돼애.','이러다가 작애 납작해지겠어어. 히히.','쓰담쓰담 받으면 괜히 졸려어.','손 떼면 작애 서운할지도 몰라아.','작애 예뻐해주는 거 맞지이?','너 작애 너무 좋아하는 거 아니야아?','한 번만 더어. ...아니 두 번!','작애 털 방향 맞춰서 해줘야대애.','히히, 서비스로 귀여운 표정 해줄게에.'];
export const vipSpecificPettingLines={vip_owner:'쭈인이 손이다아. 작애 이 손 제일 잘 알아아.',vip_dad:'아빠 또 귀찮은 척하면서 쓰담해주네에.',vip_jangmi:'장미이모 손이다아! 작애 이거 좋아아.'} as const;
export const pettingPool=(tier:'normal'|keyof typeof vipSpecificPettingLines)=>tier==='normal'?pettingLines:[...pettingLines,...vipPettingLines,vipSpecificPettingLines[tier]];
export const postBathLines=['개운하다아!','보송보송해졌어어.','첨벙첨벙 재밌었어어!','목욕하고 나오니까 기분 좋아아.','작애 완전 깨끗해졌지이?'];
export const bathStartLines=['첨벙첨벙!','물놀이 재밌어어-','물 찹찹해서 죠아!','{nickname}, 작애 깨끗해지고 있어어!','{nickname}, 물 튀어도 뭐라 하면 안돼애!'];
