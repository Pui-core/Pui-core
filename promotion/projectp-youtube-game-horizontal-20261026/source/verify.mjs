import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {file,np,FF,FP,run,parse,save,digest} from './native.mjs';
const output=file('videos/emberwake-first-forgetting.mp4');
const probe=parse((await run(FP,['-v','error','-count_frames','-show_streams','-show_format','-of','json',np(output)],'final-probe.json')).stdout);
const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
if(v?.width!==1920||v?.height!==1080||v?.avg_frame_rate!=='30/1'||+v.nb_read_frames!==2460||a?.sample_rate!=='48000'||a?.channels!==2||Math.abs(+probe.format.duration-82)>.04)throw Error('Unexpected final AV format/count/duration');
await run(FF,['-hide_banner','-v','error','-xerror','-i',np(output),'-f','null','-'],'final-full-decode.json');
const loud=await run(FF,['-hide_banner','-i',np(output),'-filter_complex','ebur128=peak=true','-f','null','-'],'final-loudness.json');
const summary=loud.stderr.slice(loud.stderr.lastIndexOf('Summary:'));
const integrated=+(summary.match(/I:\s*(-?[\d.]+) LUFS/)||[])[1],peak=+(summary.match(/Peak:\s*(-?[\d.]+) dBFS/)||[])[1];
if(!Number.isFinite(integrated)||!Number.isFinite(peak)||peak>-.5||integrated< -23||integrated> -13)throw Error('Final loudness/peak needs correction');
// Check the full claimed continuous play, excluding only the bottom editorial caption rail.
const similarity=await run(FF,['-hide_banner','-ss','19.6','-i',np(output),'-framerate','30','-start_number','200','-i',np(file('media/game/frame-%06d.png')),'-filter_complex','[0:v]trim=end_frame=912,setpts=PTS-STARTPTS,crop=1920:990:0:0,format=yuv444p[o];[1:v]trim=end_frame=912,setpts=PTS-STARTPTS,crop=1920:990:0:0,format=yuv444p[s];[o][s]ssim=shortest=1','-an','-frames:v','912','-f','null','-'],'actual-play-ssim.json');
const ssim=+(similarity.stderr.match(/All:([\d.]+)/)||[])[1];
if(!Number.isFinite(ssim)||ssim<.985)throw Error('The full continuous-play pixel comparison needs investigation: '+ssim);
function pcm(p){const r=spawnSync(FF,['-v','error','-i',np(p),'-vn','-ac','1','-ar','48000','-f','f32le','-'],{encoding:null,maxBuffer:20000000,timeout:30000});if(r.status!==0)throw Error('Audio decode failed');return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset,r.stdout.byteOffset+r.stdout.byteLength));}
const reference=pcm(file('media/reference-mix.wav')),actual=pcm(output),voice=JSON.parse(fs.readFileSync(file('qa/narration.json'),'utf8'));
const windows=[];
for(const c of voice.cues){const start=Math.round((c.at+.12)*48000),length=Math.min(48000,Math.round((c.predictedDuration-.24)*48000));let best={lag:0,correlation:-1};for(let lag=-64;lag<=64;lag++){let xy=0,xx=0,yy=0;for(let n=0;n<length;n+=4){const x=reference[start+n]||0,y=actual[start+n+lag]||0;xy+=x*y;xx+=x*x;yy+=y*y;}const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};}windows.push({cue:c.file,at:c.at,...best,lagMilliseconds:best.lag/48});}
if(windows.some(w=>Math.abs(w.lag)>2||w.correlation<.985))throw Error('Narration/mix alignment differs from actual FilmCraft AAC');
const times=[0,.2,3.9666666667,4,7.5666666667,7.6,11.5666666667,11.6,15.5666666667,15.6,16.5666666667,16.6,19.5666666667,19.6,27.7,30.3,39.8,49.9666666667,50,59.9666666667,60,62.9666666667,63,68.9666666667,69,71.9666666667,72,74.9666666667,75,76,81.9666666667];
for(let i=0;i<times.length;i++)await run(FF,['-hide_banner','-v','error','-y','-ss',String(times[i]),'-i',np(output),'-frames:v','1',np(file('qa/final-'+String(i).padStart(2,'0')+'.png'))],'final-frame-'+String(i).padStart(2,'0')+'.json');
save('qa/final-technical.json',{status:'PASS_TECHNICAL_PENDING_FINAL_IMAGES_AND_NATIVE_F_REOPEN',videoSha256:await digest(output),coverSha256:await digest(file('covers/first-forgetting.png')),frames:+v.nb_read_frames,duration:+probe.format.duration,size:[1920,1080],fps:30,audio:{sampleRate:48000,channels:2,integratedLufs:integrated,truePeakDbtp:peak,cueWindows:windows,scope:'Numerical AAC/reference alignment, not semantic or subjective listening'},fullAvDecode:true,actualPlay:{sourceFrames:[200,1112],outputFrames:[588,1500],framesCompared:912,rate:1,roi:[0,0,1920,990],fullRunSsim:ssim,captionExcluded:true},finalExtractedFrames:times.map((t,i)=>({file:'qa/final-'+String(i).padStart(2,'0')+'.png',time:t})),wholeDirectVideoWatch:false,wholeDirectSubjectiveListen:false,ownerCreativeAcceptance:false,published:false});
console.log(JSON.stringify({status:'PASS_TECHNICAL',frames:2460,duration:+probe.format.duration,integratedLufs:integrated,truePeak:peak,playSsim:ssim,voiceMaxLag:Math.max(...windows.map(w=>Math.abs(w.lag))),videoSha256:await digest(output)}));
