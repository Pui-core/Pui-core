import fs from 'node:fs';
import {file,np,FF,run,save,hash} from './native.mjs';
const E=JSON.parse(fs.readFileSync(file('source/firstcut04-edit.json'))),name=E.name;
const input=file('media/floating-cities-candidate.mp3'),out=file('media/'+name+'-music.wav');
if(hash(input)!=='e7365652410d1fbc8a14d87537855d625c1a5fa8b7de8c626f47c13256ef2ddd')throw Error('Approved candidate provenance mismatch');
if(fs.existsSync(out))throw Error('Retain existing arrangement');
// Finite excerpts, with rests around the first loss and key test results.
// A candidate arrangement is not a subjective approval of the music.
const spans=[
 {at:0,source:8,duration:75,gain:.48},
 {at:77.5,source:32,duration:109,gain:.38},
 {at:190,source:4,duration:138,gain:.44},
 {at:332,source:42,duration:101,gain:.38},
 {at:437.7333333333,source:12,duration:99,gain:.48},
 {at:540,source:38,duration:E.duration-540,gain:.43}
];
const filters=spans.map((s,i)=>'[0:a]atrim=start='+s.source+':duration='+s.duration+',asetpts=PTS-STARTPTS,aresample=48000,volume='+s.gain+',afade=t=in:d=1.2,afade=t=out:st='+(s.duration-1.8)+':d=1.8,adelay='+Math.round(s.at*48000)+'S|'+Math.round(s.at*48000)+'S[m'+i+']');
filters.push(spans.map((_,i)=>'[m'+i+']').join('')+'amix=inputs='+spans.length+':normalize=0,apad,atrim=duration='+E.duration+'[music]');
await run(FF,['-v','error','-i',np(input),'-filter_complex',filters.join(';'),'-map','[music]','-ar','48000','-ac','2','-c:a','pcm_s24le',np(out)],name+'-music-arrangement.json');
await run(FF,['-v','error','-i',np(out),'-i',np(file('media/'+name+'-narration.wav')),'-filter_complex','[0:a][1:a]sidechaincompress=threshold=0.025:ratio=4:attack=18:release=320:makeup=1[duck]','-map','[duck]','-c:a','pcm_s24le',np(file('media/'+name+'-music-ducked.wav'))],name+'-music-duck.json');
await run(FF,['-v','error','-i',np(file('media/'+name+'-narration.wav')),'-i',np(file('media/'+name+'-music-ducked.wav')),'-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0,atrim=duration='+E.duration+'[a]','-map','[a]','-c:a','pcm_s24le',np(file('media/'+name+'-mix-reference.wav'))],name+'-mix-reference.json');
save('qa/'+name+'-music.json',{track:'Floating Cities',artist:'Kevin MacLeod',sourceSha256:hash(input),license:'CC BY4.0',conditions:'qa/free-bgm-candidate.json',spans,ducking:{threshold:.025,ratio:4,attackMs:18,releaseMs:320},arrangedSha256:hash(out),duckedSha256:hash(file('media/'+name+'-music-ducked.wav')),referenceSha256:hash(file('media/'+name+'-mix-reference.wav')),subjectiveListen:false,creativeAdoption:false,recordedGameSound:false,addedGameSfx:false});
console.log(JSON.stringify({seconds:E.duration,excerpts:spans.length,creativeAdoption:false}));
