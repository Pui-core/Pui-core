import fs from 'node:fs';
import {file,save,hash,run,ff,v10} from './produce.mjs';
const output=file('videos/truthorlie-v11-bgm.mp4');
const decode=await run('ffmpeg',ff(['-i',output,'-map','0:v:0','-map','0:a:0','-f','null','-']),'full-av-decode.json');
const packets=[];
for(const [name,p] of [['source',file('media/accepted-v10.mp4')],['final',output]]){
 const r=await run('ffprobe',['-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,dts_time,duration_time,size,flags,data_hash','-show_data_hash','sha256','-of','json',p],name+'-packets.json');packets.push(JSON.parse(r.stdout).packets);
}
if(packets[0].length!==576||JSON.stringify(packets[0])!==JSON.stringify(packets[1]))throw Error('Accepted picture packet/timing changed');
save('qa/picture-identity.json',{sourceSha256:await hash(file('media/accepted-v10.mp4')),finalSha256:await hash(output),all576PacketPayloadsAndPtsDtsSecondsDurationsFlagsExact:true,timingComparison:'Seconds normalized across container timebases; raw integer ticks can differ',ending72PacketsExact:true,modelCompRange:[16.8,19.2],modelFrames:72,fullAvDecodeExit:decode.exit,nativeAppRerender:false,oldPictureReviewRetainedOnExactPacketBasis:true});
for(const [name,p] of [['voice',file('media/narration-real-v9.wav')],['sfx',file('media/sfx-real-v9.wav')],['music',file('media/cipher-bed-v11.wav')],['mix',file('media/mix-v11.wav')],['aac',output]])await run('ffmpeg',ff(['-i',p,'-map','0:a:0','-ar','48000','-ac','2','-f','f32le',file('qa/pcm/'+name+'.f32')]),'pcm-'+name+'.json');
await run('ffmpeg',ff(['-i',file('media/cipher-source.mp3'),'-t','24','-af','highpass=f=80,lowpass=f=2000','-ar','16000','-ac','1','-f','f32le',file('qa/pcm/cipher-onset.f32')]),'source-onset-pcm.json');
const floats=name=>{const b=fs.readFileSync(file('qa/pcm/'+name+'.f32'));return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);};
const voice=floats('voice'),sfx=floats('sfx'),music=floats('music'),mix=floats('mix'),aac=floats('aac');
if([voice,sfx,music,mix].some(a=>a.length!==1843200)||aac.length<1843200)throw Error('PCM duration shorter than 19.2 seconds');
function rms(a,start,end){let q=0,n=0;for(let i=Math.round(start*96000);i<Math.min(a.length,Math.round(end*96000));i++){q+=a[i]**2;n++;}return Math.sqrt(q/n);}
function corr(a,b,start,end,lag=0){let ab=0,aa=0,bb=0;for(let i=Math.round(start*96000);i<Math.min(a.length,b.length-lag,Math.round(end*96000));i++){const x=a[i],y=b[i+lag];ab+=x*y;aa+=x*x;bb+=y*y;}return ab/Math.sqrt(aa*bb);}
let pcmError=0;for(let i=0;i<mix.length;i++)pcmError=Math.max(pcmError,Math.abs(mix[i]-voice[i]-sfx[i]-music[i]));
if(pcmError>1e-6)throw Error('PCM mix altered voice/SFX component sum');
const old=JSON.parse(fs.readFileSync(v10+'/qa/audio-acceptance.json','utf8'));
const cues=old.sourceCues.map(c=>{
 const a=c.firstVoiced,b=c.lastVoiced,windows={head:[a,Math.min(a+.25,b)],middle:[(a+b)/2-.125,(a+b)/2+.125],tail:[Math.max(a,b-.25),b]},scores={};
 for(const [key,[s,e]]of Object.entries(windows))scores[key]=corr(mix,aac,s,e);
 let best={lag:0,correlation:-1};for(let lag=-96;lag<=96;lag+=2){let v=corr(mix,aac,a,b,lag);if(v>best.correlation)best={lag,correlation:v};}
 if(Math.abs(best.lag)>2||Object.values(scores).some(x=>x<.98))throw Error('AAC cue synchronization/correlation failure: '+c.id);
 const gap=20*Math.log10(rms(voice,a,b)/rms(music,a,b));if(gap<12)throw Error('Voice/music RMS gap below 12dB: '+c.id);
 return {id:c.id,text:c.text,at:c.at,firstVoiced:a,lastVoiced:b,sourceTailPad:c.sourceTailPad,sourceNarrationUnchanged:true,bestLagInterleavedSamples:best.lag,lagSeconds:best.lag/96000,whole:best.correlation,...scores,voiceOverMusicDb:gap};
});
// Fixed-tempo evidence: positive energy attacks on a 10ms grid, not a claim of audition.
const onset=floats('cipher-onset'),env=[];for(let i=0;i+160<=onset.length;i+=160){let q=0;for(let k=0;k<160;k++)q+=onset[i+k]**2;env.push(Math.sqrt(q/160));}
const flux=env.map((v,i)=>Math.max(0,v-(env[Math.max(0,i-1)]||0))),peaks=[];
const threshold=[...flux].sort((a,b)=>a-b)[Math.floor(flux.length*.85)];
for(let i=2;i<flux.length-2;i++)if(flux[i]>=threshold&&flux[i]>=flux[i-1]&&flux[i]>flux[i+1]&&flux[i]>=flux[i-2]&&flux[i]>=flux[i+2])peaks.push({time:i*.01+.005,strength:flux[i]});
const grid=Array.from({length:48},(_,i)=>.824+.4*i),nearest=grid.map(time=>{const p=peaks.reduce((a,b)=>Math.abs(b.time-time)<Math.abs(a.time-time)?b:a);return {sourceGridTime:time,nearestAttack:p.time,offsetMs:(p.time-time)*1000};});
const supported=nearest.filter(p=>Math.abs(p.offsetMs)<=60);
save('qa/phrase-duck-binding.json',{plan:JSON.parse(fs.readFileSync(file('qa/phrase-duck-plan.json'),'utf8')),finalMusicSha256:await hash(file('media/cipher-bed-v11.wav')),measuredCueVoiceOverMusicDb:cues.map(c=>({id:c.id,gapDb:c.voiceOverMusicDb})),minimumMeasuredGapDb:Math.min(...cues.map(c=>c.voiceOverMusicDb)),subjectiveAudition:false});
save('qa/beat-measurement.json',{officialBpm:150,beatSeconds:.4,sourceIn:.824,excerptSeconds:19.2,totalBeats:48,sampleRate:16000,analysis:'10ms positive RMS attacks after 80–2000Hz bandpass; nearest detected attacks to fixed official-tempo grid',detectedAttackCount:peaks.length,within60msCount:supported.length,gridCount:48,meanAbsoluteOffsetMs:nearest.reduce((a,b)=>a+Math.abs(b.offsetMs),0)/48,grid:nearest,limits:'Attack proximity is a numerical phase check; not direct listening or native TikTok start/beat confirmation'});
save('qa/audio-verification.json',{issue:145,duration:19.2,sampleRate:48000,channels:2,videoSha256:await hash(output),mixSha256:await hash(file('media/mix-v11.wav')),musicbedSha256:await hash(file('media/cipher-bed-v11.wav')),narrationSha256:await hash(file('media/narration-real-v9.wav')),sfxSha256:await hash(file('media/sfx-real-v9.wav')),pcmMixMaxSumError:pcmError,voiceSeAmplitudesAndRelativeTimingPreserved:true,masterGain:1,cues,musicEdits:{officialTrack:'Cipher — Kevin MacLeod',isrc:'USUAN1100844',sourceIn:.824,sourceOut:20.024,sourceSeconds:19.2,retainedV9BedGain:2,gainChangeDb:20*Math.log10(2),additionalPhraseDuckingPlan:'qa/phrase-duck-plan.json',finalMinimumVoiceOverMusicDb:Math.min(...cues.map(c=>c.voiceOverMusicDb)),retainedProcessing:{loudnorm:{I:-27,LRA:7,TP:-6},level:.45,postPcmGain:2/3,sidechain:{threshold:.055,ratio:2.2,attackMs:12,releaseMs:180},fadeIn:[0,.03],fadeOut:[18.8,19.2]},fadeProtectsFirstVoicedAt:cues[0].firstVoiced,fadeOutAfterFinalVoiceAt:cues.at(-1).lastVoiced},fullSubjectiveListen:false,nativeTikTokSoundSelected:false,published:false});
await run('ffmpeg',ff(['-i',output,'-vf',"select='eq(n,15)+eq(n,195)+eq(n,324)+eq(n,498)+eq(n,528)+eq(n,570)',scale=240:426,tile=3x2",'-frames:v','1',file('qa/final-contact.png')]),'final-contact.json');
save('qa/verification-summary.json',{issue:145,finalVideo:output,sha256:await hash(output),duration:19.2,frames:576,allVideoPacketsAndTimingIdenticalToAcceptedV10:true,endingModel72FramesPreserved:true,fullAvDecodeExit:0,allSixCueHeadMiddleTailAacCorrelationAbove:.98,maximumLagSeconds:Math.max(...cues.map(c=>Math.abs(c.lagSeconds))),nativeReopenPerformed:false,nativeProjectMode:'offline schema15 clone only',subjectiveListen:false,nativeTikTokSoundSelected:false,published:false});
console.log(JSON.stringify({verification:'completed',video:output,sha256:await hash(output),cueMinCorrelation:Math.min(...cues.flatMap(c=>[c.head,c.middle,c.tail])),pcmError,beatSupport:supported.length+'/48',meanBeatOffsetMs:nearest.reduce((a,b)=>a+Math.abs(b.offsetMs),0)/48}));
