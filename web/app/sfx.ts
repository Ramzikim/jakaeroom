export type Sfx='step'|'pop'|'land'|'sit'|'eat'|'water'|'sleep'|'paper'|'ui';
let context:AudioContext|undefined,master:GainNode|undefined,enabled=false,volume=.55,active=0;
let rustle:AudioBuffer|undefined;
const last=new Map<Sfx,number>();
export function setSfxEnabled(value:boolean){enabled=value;if(master&&context)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.02);}
export function setSfxVolume(value:number){volume=Math.max(0,Math.min(1,value));setSfxEnabled(enabled);}
export async function unlockSfx(){
 if(typeof window==='undefined')return false;
 try{context??=new AudioContext();if(!master){master=context.createGain();master.gain.value=enabled?volume:0;master.connect(context.destination);}if(context.state==='suspended')await context.resume();return context.state==='running';}catch{return false;}
}
const settings:Record<Sfx,[number,number,number,number]>={step:[310,.065,.045,.24],pop:[430,.12,.08,.25],land:[170,.10,.05,.3],sit:[130,.17,.055,.4],eat:[540,.075,.035,.3],water:[650,.14,.045,.75],sleep:[240,.4,.035,1],paper:[950,.13,.025,.3],ui:[420,.035,.02,.09]};
export function playSfx(kind:Sfx,alternate=0){
 if(!enabled||!context||!master||context.state!=='running'||active>=3)return;
 const now=context.currentTime,[pitch,duration,gain,cooldown]=settings[kind];if(now-(last.get(kind)??-Infinity)<cooldown)return;last.set(kind,now);
 const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type='sine';
 oscillator.frequency.setValueAtTime(pitch*(alternate%2?1.06:.96),now);oscillator.frequency.exponentialRampToValueAtTime(pitch*.55,now+duration);
 envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(gain,now+.008);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
 oscillator.connect(envelope);envelope.connect(master);
 let noise:AudioBufferSourceNode|undefined,filter:BiquadFilterNode|undefined;
 if(['sit','paper','water','eat'].includes(kind)){
  if(!rustle){rustle=context.createBuffer(1,Math.ceil(context.sampleRate*.5),context.sampleRate);const samples=rustle.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.35;}
  noise=context.createBufferSource();noise.buffer=rustle;filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='paper'?1700:800;noise.connect(filter);filter.connect(envelope);noise.start(now);noise.stop(now+duration);
 }
 active++;oscillator.onended=()=>{active--;oscillator.disconnect();envelope.disconnect();noise?.disconnect();filter?.disconnect();};oscillator.start(now);oscillator.stop(now+duration+.02);
}
// Zero-based contact/action frames. Called only when the displayed frame changes.
export function frameSfx(sequence:string,frame:number,cycle:number):Sfx|null{
 if(sequence.includes('walk'))return (sequence.startsWith('back')?[0,2]:[1,4]).includes(frame)?'step':null;
 if(sequence==='hop'&&cycle===0)return frame===3?'pop':frame===6?'land':null;
 if(sequence==='shy'&&cycle===0&&frame===0)return 'pop';
 if(sequence==='sit_idle'&&cycle===0&&frame===0)return 'sit';
 if(sequence==='sit_snooze'&&cycle===0&&frame===0)return 'sleep';
 if(sequence==='strawberry'&&[3,5].includes(frame))return 'eat';
 if(sequence==='bath'&&cycle===0&&[1,4,7].includes(frame))return 'water';
 return null;
}

