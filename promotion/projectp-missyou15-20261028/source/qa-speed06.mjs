import fs from 'node:fs';
import {file,np,FF,FP,run,parse,save,digest} from './native.mjs';
const result=[];
for(const id of ['voice','bgm']){
 const path=file(`videos/missyou-speed06-${id}.mp4`);
 await run(FF,['-hide_banner','-v','error','-xerror','-i',np(path),'-f','null','-'],`speed06-${id}-decode.json`);
 const probe=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(path)],`speed06-${id}-probe.json`)).stdout);
 await run(FF,['-hide_banner','-v','info','-i',np(path),'-vn','-af','ebur128=peak=true','-f','null','-'],`speed06-${id}-loudness.json`);
 await run(FF,['-hide_banner','-v','info','-i',np(path),'-vn','-af','silencedetect=n=-45dB:d=0.05','-f','null','-'],`speed06-${id}-silence.json`);
 result.push({variant:id,sha256:await digest(path),streams:probe.streams.map(s=>({codec:s.codec_name,width:s.width,height:s.height,frames:s.nb_frames,duration:s.duration,rate:s.avg_frame_rate,sampleRate:s.sample_rate,channels:s.channels})),duration:probe.format.duration,decodeExit:0});
}
const video=np(file('videos/missyou-speed06-bgm.mp4'));
await run(FF,['-hide_banner','-v','error','-y','-i',video,'-vf','fps=1,scale=270:480,tile=6x2','-frames:v','1',np(file('qa/speed06-final-contact.png'))],'speed06-contact.json');
await run(FF,['-hide_banner','-v','error','-y','-i',video,'-vf','trim=start=1.8:end=5.8,setpts=PTS-STARTPTS,fps=10,scale=216:384,tile=10x4','-frames:v','1',np(file('qa/speed06-action-contact.png'))],'speed06-action-contact.json');
for(const t of [0.48,1.93,2.9,3.1,3.9,4.83,5.9,6.9,7.9,8.9,9.3,10.8,11.4])await run(FF,['-hide_banner','-v','error','-y','-ss',String(t),'-i',video,'-frames:v','1',np(file(`qa/speed06-actual-${t}.png`))]);
save('qa/speed06-technical-summary.json',{variants:result,wholeSubjectiveListen:false,wholeRealtimeWatch:false,published:false,visualInspection:'Actual MP4 sheets and action frames require visual inspection.'});
console.log('Actual final MP4 decode, format, audio measurements and frame sheets complete.');
