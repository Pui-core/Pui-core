import fs from 'node:fs';import {file,np,FF,run,hash,save,copy} from './native.mjs';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'))),voice=JSON.parse(fs.readFileSync(file('qa/narration.json')));
if(hash(edit.bgm.source)!==edit.bgm.sha256)throw Error('Accepted original108 BGM changed');copy(edit.bgm.source,file('media/connecting-lights-original.wav'));
const voiceArgs=['-v','error'];for(const c of voice.cues)voiceArgs.push('-i',np(file('media/'+c.file)));
const parts=voice.cues.map((c,i)=>`[${i}:a]adelay=${Math.round(c.at*48000)}S|${Math.round(c.at*48000)}S[v${i}]`);
parts.push(voice.cues.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${voice.cues.length}:normalize=0:duration=longest,volume=1.4,apad,atrim=duration=${edit.duration}[voice]`);
await run(FF,[...voiceArgs,'-filter_complex',parts.join(';'),'-map','[voice]','-c:a','pcm_s24le','-ar','48000',np(file('media/narration-unscaled.wav'))],'audio-voice-assembly.json');
// 80sec = 128beats at96BPM. A whole-bar2.5sec overlap keeps musical phase stable.
const music=80,crossfade=2.5,repeats=Math.max(1,Math.ceil((edit.duration-music)/(music-crossfade))+1),bedArgs=['-v','error'];for(let i=0;i<repeats;i++)bedArgs.push('-i',np(file('media/connecting-lights-original.wav')));
const bedParts=[];for(let i=0;i<repeats;i++)bedParts.push(`[${i}:a]atrim=duration=${music},asetpts=PTS-STARTPTS[b${i}]`);
let last='b0';for(let i=1;i<repeats;i++){const out='x'+i;bedParts.push(`[${last}][b${i}]acrossfade=d=${crossfade}:c1=tri:c2=tri[${out}]`);last=out;}
bedParts.push(`[${last}]atrim=duration=${edit.duration},afade=t=out:st=${Math.max(0,edit.duration-2.5)}:d=2.5[bed]`);
await run(FF,[...bedArgs,'-filter_complex',bedParts.join(';'),'-map','[bed]','-c:a','pcm_s24le','-ar','48000',np(file('media/music-loop-unscaled.wav'))],'audio-music-background-loop.json');
await run(FF,['-v','error','-i',np(file('media/music-loop-unscaled.wav')),'-i',np(file('media/narration-unscaled.wav')),'-filter_complex','[0:a]volume=.75[bg];[bg][1:a]sidechaincompress=threshold=.025:ratio=4:attack=18:release=320:makeup=1:mix=1[duck]','-map','[duck]','-c:a','pcm_s24le','-ar','48000',np(file('media/background-unscaled.wav'))],'audio-background-duck.json');
async function mix(voiceFile,bgFile,out,receipt){await run(FF,['-v','error','-i',np(file(voiceFile)),'-i',np(file(bgFile)),'-filter_complex',`[0:a][1:a]amix=inputs=2:normalize=0:duration=longest,atrim=duration=${edit.duration}[mix]`,'-map','[mix]','-c:a','pcm_s24le','-ar','48000',np(file(out))],receipt);}
await mix('media/narration-unscaled.wav','media/background-unscaled.wav','media/reference-unscaled.wav','audio-reference-unscaled.json');
const loud=await run(FF,['-hide_banner','-i',np(file('media/reference-unscaled.wav')),'-filter_complex','ebur128=peak=true','-f','null','-'],'audio-loudness-unscaled.json');
const summary=loud.stderr.slice(loud.stderr.lastIndexOf('Summary:')),I=Number(summary.match(/I:\s*([-0-9.]+) LUFS/)?.[1]),TP=Number(summary.match(/Peak:\s*([-0-9.]+) dBFS/)?.[1]);if(!Number.isFinite(I)||!Number.isFinite(TP))throw Error('Cannot read actual loudness');
const masterDb=Math.min(-18.5-I,-1.8-TP),masterGain=10**(masterDb/20);
for(const [a,b] of [['narration-unscaled.wav','narration-stem.wav'],['background-unscaled.wav','background-stem.wav']])await run(FF,['-v','error','-i',np(file('media/'+a)),'-af','volume='+masterGain,'-c:a','pcm_s24le','-ar','48000',np(file('media/'+b))],'audio-scale-'+b+'.json');
await mix('media/narration-stem.wav','media/background-stem.wav','media/reference-mix.wav','audio-reference-final.json');
await run(FF,['-hide_banner','-i',np(file('media/reference-mix.wav')),'-filter_complex','ebur128=peak=true','-f','null','-'],'audio-reference-loudness.json');
save('qa/audio-binding.json',{duration:edit.duration,sampleRate:48000,channels:2,bits:24,voiceSha256:hash(file('media/narration-stem.wav')),backgroundSha256:hash(file('media/background-stem.wav')),referenceMixSha256:hash(file('media/reference-mix.wav')),originalBgmSha256:hash(file('media/connecting-lights-original.wav')),voiceGain:1.4*masterGain,masterDb,unscaledIntegratedLufs:I,unscaledTruePeakDbtp:TP,backgroundArrangement:{sourceSeconds:82,musicalSeconds:music,repeats,wholeBarCrossfadeSeconds:crossfade,bpm:96,purpose:'Background-only arrangement; no repeated video padding'},ducking:{threshold:.025,ratio:4,attackMs:18,releaseMs:320},nativeFilmCraftTracks:['A1 narration-stem.wav','A2 background-stem.wav'],gameAudioRecorded:false,sfxAdded:false,credit:'VOICEVOX:青山龍星',wholeDirectSubjectiveListen:false});
console.log(JSON.stringify({duration:edit.duration,voicePhrases:voice.cues.length,backgroundRepeats:repeats,masterDb,voiceGain:1.4*masterGain}));
