import fs from 'node:fs';
import {file,np,FF,FP,run,parse,save,digest} from './native.mjs';
const result=[];
for(const id of ['voice','bgm']){
 const path=file(`videos/missyou-story05-${id}.mp4`);
 await run(FF,['-hide_banner','-v','error','-xerror','-i',np(path),'-f','null','-'],`story05-${id}-decode.json`);
 const probe=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(path)],`story05-${id}-probe.json`)).stdout);
 await run(FF,['-hide_banner','-v','info','-i',np(path),'-vn','-af','ebur128=peak=true','-f','null','-'],`story05-${id}-loudness.json`);
 await run(FF,['-hide_banner','-v','info','-i',np(path),'-vn','-af','silencedetect=n=-45dB:d=0.05','-f','null','-'],`story05-${id}-silence.json`);
 result.push({variant:id,sha256:await digest(path),streams:probe.streams.map(s=>({codec:s.codec_name,width:s.width,height:s.height,frames:s.nb_frames,duration:s.duration,rate:s.avg_frame_rate,sampleRate:s.sample_rate,channels:s.channels})),duration:probe.format.duration,decodeExit:0});
}
const video=np(file('videos/missyou-story05-bgm.mp4'));
await run(FF,['-hide_banner','-v','error','-y','-i',video,'-vf','fps=1,scale=270:480,tile=7x2','-frames:v','1',np(file('qa/story05-final-contact.png'))],'story05-contact.json');
await run(FF,['-hide_banner','-v','error','-y','-i',video,'-vf','trim=start=2.75:end=6.35,setpts=PTS-STARTPTS,fps=10,scale=216:384,tile=9x4','-frames:v','1',np(file('qa/story05-action-contact.png'))],'story05-action-contact.json');
for(const t of [2.9,3.1,4.5,5.7,5.8,6.0,7.3,8.9,12.7,13.4])await run(FF,['-hide_banner','-v','error','-y','-ss',String(t),'-i',video,'-frames:v','1',np(file(`qa/story05-actual-${t}.png`))]);
save('qa/story05-technical-summary.json',{variants:result,wholeSubjectiveListen:false,wholeRealtimeWatch:false,published:false,visualInspection:'Actual MP4 sheets and action frames require visual inspection.'});
console.log('Actual final MP4 decode, format, audio measurements and frame sheets complete.');
