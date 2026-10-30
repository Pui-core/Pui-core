import fs from 'node:fs';
import {file,np,FF,FP,run,parse,save,digest} from './native.mjs';
const video=file('videos/truthorlie-vertical-v3-voice-only.mp4');if(!fs.existsSync(video))throw Error('Final video missing');
const metadata=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(video)],'ffprobe-v3.json')).stdout);
const v=metadata.streams.find(s=>s.codec_type==='video'),a=metadata.streams.find(s=>s.codec_type==='audio');if(v?.width!==1080||v?.height!==1920||v?.codec_name!=='h264'||v?.avg_frame_rate!=='30/1'||a?.codec_name!=='aac'||Math.abs(Number(metadata.format.duration)-14.5)>.1)throw Error('Unexpected final media format');
await run(FF,['-nostdin','-v','error','-i',np(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],'ffmpeg-decode-v3.json');
const loud=await run(FF,['-nostdin','-hide_banner','-i',np(video),'-filter_complex','ebur128=peak=true','-f','null','-'],'ffmpeg-loudness-v3.json');
const contact=file('qa/final-contact-v3.png');if(fs.existsSync(contact))throw Error('Existing contact sheet preserved');
await run(FF,['-nostdin','-v','error','-i',np(video),'-vf','fps=1,scale=270:480,tile=5x3','-frames:v','1',np(contact)],'ffmpeg-contact-v3.json');
for(const [name,at] of [['vote',5.15],['lie',7.85],['cta',10.85]]){const target=file(`qa/transition-${name}-v3.png`);if(fs.existsSync(target))throw Error('Existing transition sheet preserved');await run(FF,['-nostdin','-v','error','-ss',String(at),'-i',np(video),'-t','0.6','-vf','fps=10,scale=270:480,tile=3x2','-frames:v','1',np(target)],`ffmpeg-transition-${name}-v3.json`);}
save('qa/final-check-v3.json',{sha256:await digest(video),format:{width:v.width,height:v.height,frames:v.nb_frames,fps:v.avg_frame_rate,duration:metadata.format.duration,video:v.codec_name,audio:a.codec_name},fullDecode:'exit 0',loudnessRaw:'qa/ffmpeg-loudness-v3.json',contact:'qa/final-contact-v3.png',transitions:['vote','lie','cta'].map(n=>`qa/transition-${n}-v3.png`),wholeRealTimeWatch:false,wholeSubjectiveListen:false,nativeMusicSelected:false,published:false});console.log('Final decoding and representative-frame extraction complete.');
