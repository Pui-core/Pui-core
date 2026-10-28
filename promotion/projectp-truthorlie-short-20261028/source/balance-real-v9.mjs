import fs from 'node:fs';
import {file,np,FF,run,save,parse,hash} from './native.mjs';
const a=parse(fs.readFileSync(file('qa/real-v9-final-check.json'),'utf8'));
async function mono(name){const p=file('qa/pcm-real-v9/'+name+'.f32');await run(FF,['-v','error','-y','-i',np(file('media/'+name+'.wav')),'-ac','1','-ar','48000','-f','f32le',np(p)]);const b=fs.readFileSync(p);return new Float32Array(b.buffer,b.byteOffset,b.length/4);}
const voice=await mono('narration-real-v9'),music=await mono('musicbed-real-v9'),sfx=await mono('sfx-real-v9');
function rms(x,lo,hi){let s=0;for(let k=lo;k<hi;k++)s+=x[k]*x[k];return Math.sqrt(s/(hi-lo));}
const cues=a.cues.map(c=>{const lo=Math.floor(c.firstVoiced*48000),hi=Math.ceil(c.lastVoiced*48000),v=rms(voice,lo,hi),m=rms(music,lo,hi),s=rms(sfx,lo,hi);return{id:c.id,voiceDbfs:20*Math.log10(v),musicDbfs:20*Math.log10(m),sfxDbfs:s?20*Math.log10(s):null,voiceAboveMusicDb:20*Math.log10(v/m)};});
if(cues.some(c=>c.voiceAboveMusicDb<10))throw Error('Music balance requires review');
save('qa/real-v9-source-balance.json',{status:'VOICE_OVER_MUSIC_10DB_PLUS_EACH_PHRASE',cues,sourceVoiceSha256:hash(file('media/narration-real-v9.wav')),sourceMusicSha256:hash(file('media/musicbed-real-v9.wav')),actualFinalAacBinding:'real-v9-final-check.json',numericalMeasurementOnly:true,subjectiveListen:false});
console.log(JSON.stringify(cues));
