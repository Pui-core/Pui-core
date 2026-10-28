import fs from 'node:fs';
import {file,hash,save} from './native.mjs';
const source=file('source/firstcut04k-act1-reconstruct07-edit.json');
const project=file('projects/firstcut04k-act1-reconstruct07.ecproj');
const voice=file('media/firstcut04k-act1-reconstruct07-voice.wav');
const target=file('source/firstcut04k-act1-chunk-plan.json');
if(fs.existsSync(target))throw Error('Preserve existing chunk plan');
if(!fs.existsSync(project)||!fs.existsSync(voice))throw Error('Native project/voice missing');
const e=JSON.parse(fs.readFileSync(source));
if(e.frames!==4924||e.cues.length!==30||Math.abs(e.seconds*30-e.frames)>1e-6)throw Error('Unexpected source timeline');
const chunks=[];for(let i=0;i<e.cues.length;i+=6){const group=e.cues.slice(i,i+6),startFrame=Math.round(group[0].at*30),endFrame=Math.round(group.at(-1).end*30);if(chunks.length&&startFrame!==chunks.at(-1).endFrame)throw Error('Gap or overlap');chunks.push({index:chunks.length+1,startFrame,endFrame,frames:endFrame-startFrame,seconds:(endFrame-startFrame)/30,cueIds:group.map(c=>c.id)});}
if(chunks[0].startFrame!==0||chunks.at(-1).endFrame!==e.frames)throw Error('Timeline coverage mismatch');
save('source/firstcut04k-act1-chunk-plan.json',{fps:30,frames:e.frames,seconds:e.seconds,sourceEdit:'source/firstcut04k-act1-reconstruct07-edit.json',sourceEditSha256:hash(source),sourceProject:'projects/firstcut04k-act1-reconstruct07.ecproj',sourceProjectSha256:hash(project),sourceVoice:'media/firstcut04k-act1-reconstruct07-voice.wav',sourceVoiceSha256:hash(voice),chunks,review:{fullVideo:false,subjectiveAudio:false,published:false},note:'Five cue-bound frame ranges; sequential rendering only, 30 cues covered once; no new art or creative acceptance.'});
console.log(JSON.stringify(chunks));
