import fs from 'node:fs';
import path from 'node:path';
import {file,np,FF,run,save,hash} from './native.mjs';
const old='/mnt/f/Videos/ProjectP-Missyou15-Preview-2026-10-28/revision-05-final';
for(const name of ['room-clean.png','natural.png','room-entry.mp4','sealed-story05.mp4','select-story05.mp4','seal-detail-story05.mp4','opened-story05.mp4','page-detail-story05.mp4','PerituneMaterial_Daybreak.mp3',...Array.from({length:4},(_,i)=>`voice-story05-kurono-${i+1}.wav`)]){
 const from=path.join(old,'media',name),to=file('media/'+name);fs.copyFileSync(from,to);if(hash(from)!==hash(to))throw Error('Copy mismatch');
}
// A source crop around the actual selected "thanks" stamp, never a new UI action.
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/select-story05.mp4')),'-vf','crop=280:340:280:430','-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',np(file('media/thanks-detail-speed06.mp4'))],'speed06-thanks-detail.json');
const duration=346/30,positions=[.12,2.08,5.02,7.92];
const voiceArgs=['-hide_banner','-v','error','-y'];for(let i=1;i<=4;i++)voiceArgs.push('-i',np(file(`media/voice-story05-kurono-${i}.wav`)));
const vf=positions.map((s,i)=>`[${i}:a]adelay=${Math.round(s*1000)}|${Math.round(s*1000)}[v${i}]`);vf.push('[v0][v1][v2][v3]amix=inputs=4:normalize=0:duration=longest,apad,atrim=duration='+duration+'[out]');
await run(FF,[...voiceArgs,'-filter_complex',vf.join(';'),'-map','[out]','-ar','48000','-c:a','pcm_s24le',np(file('media/narration-speed06.wav'))],'speed06-voice.json');
// Original, quiet editorial ticks, air and page chime. No sampled commercial SE.
await run(FF,['-hide_banner','-v','error','-y','-f','lavfi','-i','anoisesrc=color=pink:duration=0.12:sample_rate=48000:seed=13606','-af','highpass=f=1800,lowpass=f=6500,afade=t=in:d=0.02,afade=t=out:st=0.025:d=0.095,volume=0.032','-ac','2','-c:a','pcm_s24le',np(file('media/air-speed06.wav'))],'speed06-air.json');
await run(FF,['-hide_banner','-v','error','-y','-f','lavfi','-i','sine=frequency=1450:duration=0.06:sample_rate=48000','-af','afade=t=out:st=0:d=0.06,volume=0.36','-ac','2','-c:a','pcm_s24le',np(file('media/tick-speed06.wav'))],'speed06-tick.json');
await run(FF,['-hide_banner','-v','error','-y','-f','lavfi','-i','sine=frequency=1046.5:duration=0.26:sample_rate=48000','-f','lavfi','-i','sine=frequency=1567.98:duration=0.23:sample_rate=48000','-filter_complex','[0:a]afade=t=out:st=0:d=0.26,volume=0.32[a];[1:a]afade=t=out:st=0:d=0.23,volume=0.22,adelay=30[b];[a][b]amix=inputs=2:normalize=0[out]','-map','[out]','-ac','2','-c:a','pcm_s24le',np(file('media/chime-speed06.wav'))],'speed06-chime.json');
const events=[{at:.48,source:0},{at:1.92,source:1},{at:2.88,source:0},{at:3.84,source:1},{at:4.8,source:2},{at:5.76,source:0},{at:7.68,source:0},{at:9.6,source:1}];
const sf=[],outputs=[];for(let i=0;i<3;i++){const indexes=events.map((e,j)=>e.source===i?j:null).filter(x=>x!==null);sf.push(`[${i}:a]asplit=${indexes.length}`+indexes.map(j=>`[e${j}]`).join(''));}
events.forEach((e,j)=>{sf.push(`[e${j}]adelay=${Math.round(e.at*1000)}|${Math.round(e.at*1000)}[s${j}]`);outputs.push(`[s${j}]`);});sf.push(outputs.join('')+`amix=inputs=${events.length}:normalize=0:duration=longest,apad,atrim=duration=${duration}[out]`);
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/air-speed06.wav')),'-i',np(file('media/tick-speed06.wav')),'-i',np(file('media/chime-speed06.wav')),'-filter_complex',sf.join(';'),'-map','[out]','-ar','48000','-c:a','pcm_s24le',np(file('media/sfx-speed06.wav'))],'speed06-sfx.json');
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/PerituneMaterial_Daybreak.mp3')),'-i',np(file('media/narration-speed06.wav')),'-filter_complex',`[0:a]atrim=start=0.510:duration=${duration},asetpts=PTS-STARTPTS,volume=0.20,afade=t=in:st=0:d=0.04,afade=t=out:st=${duration-.32}:d=0.32[m];[m][1:a]sidechaincompress=threshold=0.025:ratio=3:attack=15:release=200,apad,atrim=duration=${duration}[out]`,'-map','[out]','-ar','48000','-c:a','pcm_s24le',np(file('media/musicbed-speed06.wav'))],'speed06-musicbed.json');
save('qa/speed06-audio-manifest.json',{duration,speaker:'VOICEVOX:玄野武宏',speakerId:11,positions,sourceWavsUnmodified:true,cues:positions.map((at,i)=>({at,file:`voice-story05-kurono-${i+1}.wav`,sha256:hash(file(`media/voice-story05-kurono-${i+1}.wav`))})),effects:events,fxSource:'Original FFmpeg oscillators and seeded noise; editorial, not recorded app audio.',bpm:125,musicStart:.510,wholeSubjectiveListen:false});
console.log('v06 copied safe assets, repositioned intact words, and produced separate sound tracks.');
