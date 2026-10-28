import fs from 'node:fs';
import { file, hash, save } from './native.mjs';
const plan=JSON.parse(fs.readFileSync(file('source/firstcut04k-paper-edit.json')));
const generated=JSON.parse(fs.readFileSync(file('source/firstcut04k-extra-voice.json')));
function wavDuration(p){
  const b=fs.readFileSync(p);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE')throw Error('Not RIFF WAVE');
  let rate=0,data=0;for(let p=12;p+8<=b.length;){const id=b.toString('ascii',p,p+4),len=b.readUInt32LE(p+4);if(id==='fmt ')rate=b.readUInt32LE(p+16);if(id==='data')data+=len;p+=8+len+(len%2);}
  if(!rate||!data)throw Error('Incomplete WAV');return data/rate;
}
for(const b of plan.blocks){
 let actual=0;
 for(const id of b.newVoiceIds||[]){const cue=generated.cues.find(c=>c.id===id);if(!cue||hash(file(cue.file))!==cue.sha256)throw Error('Missing/mismatched generated voice '+id);cue.duration=wavDuration(file(cue.file));actual+=cue.duration;}
 b.newVoiceActualSeconds=Number(actual.toFixed(3));
 b.allVoiceSeconds=Number((b.existingVoiceSeconds+actual).toFixed(3));
 b.nonVoiceTargetSeconds=Number((b.seconds-b.allVoiceSeconds).toFixed(3));
 if(b.nonVoiceTargetSeconds<b.minimumVoiceGapSeconds)throw Error('Voices do not fit '+b.id);
}
save('qa/firstcut04k-voice-measurement.json',{plannedSeconds:plan.plannedSeconds,blocks:plan.blocks.map(({id,start,end,seconds,existingVoiceSeconds,newVoiceActualSeconds,allVoiceSeconds,nonVoiceTargetSeconds,minimumVoiceGapSeconds})=>({id,start,end,seconds,existingVoiceSeconds,newVoiceActualSeconds,allVoiceSeconds,nonVoiceTargetSeconds,minimumVoiceGapSeconds})),generatedCues:generated.cues,renderedSeconds:null,screenLayoutMeasured:false,wholeDirectWatch:false,subjectiveListen:false,published:false});
console.log(JSON.stringify({plannedSeconds:plan.plannedSeconds,totalActualVoice:plan.blocks.reduce((n,b)=>n+b.allVoiceSeconds,0),unrenderedNonVoice:plan.blocks.reduce((n,b)=>n+b.nonVoiceTargetSeconds,0),screenLayoutMeasured:false}));
