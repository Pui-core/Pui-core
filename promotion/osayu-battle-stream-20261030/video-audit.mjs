/** Actual native-rendered neutral video, decoded as a bounded stream; no person footage accepted. */
import fs from 'node:fs';import path from 'node:path';
import {root,run,ffRoot,save,hash} from './runtime.mjs';
import {readAudit} from './audit.mjs';
import {duration,fps,variantArg} from './plan.mjs';
const variant=variantArg(),stem=variant+'-neutral-probe';
const project=path.join(root,'projects',stem+'.ecproj'),layout=path.join(root,'qa',stem+'-layout.json');
const audit=readAudit(project,layout);if(!audit.passed)throw Error('Saved native project failed');
const receipt=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-render-summary.json')));
if(receipt.mode!=='neutral'||receipt.variant!==variant||receipt.characterImported||receipt.backgroundConfirmed||receipt.projectHash!==hash(project))throw Error('Neutral render binding changed');
const video=path.join(root,'videos',stem+'.mp4');if(hash(video)!==receipt.sha256)throw Error('Rendered neutral video changed');
const probed=await run(path.join(ffRoot,'bin/ffprobe'),['-v','error','-count_frames','-show_streams','-show_format','-of','json',video],stem+'-video-probe',{env:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')}});
const probe=JSON.parse(probed.stdout),v=probe.streams.filter(x=>x.codec_type==='video'),a=probe.streams.filter(x=>x.codec_type==='audio');
if(v.length!==1||a.length||v[0].width!==1080||v[0].height!==1920||v[0].avg_frame_rate!=='30/1'||Number(v[0].nb_read_frames)!==duration*fps||Math.abs(Number(probe.format.duration)-duration)>.01)throw Error('Neutral video stream mismatch');
const w=270,h=480,bytes=w*h*3;let pending=Buffer.alloc(0),frame=0;const measurements=[];
await run(path.join(ffRoot,'bin/ffmpeg'),['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',video,'-map','0:v:0','-an','-vf',`scale=${w}:${h}:flags=neighbor,format=rgb24`,'-f','rawvideo','pipe:1'],stem+'-rendered-tracking',{env:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')},consumeStdout(chunk){
 pending=Buffer.concat([pending,chunk]);
 while(pending.length>=bytes){const f=pending.subarray(0,bytes);pending=pending.subarray(bytes);let count=0,sx=0,sy=0,blueCount=0,bx=0,by=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*3;if(f[k]<80&&f[k+1]>170&&f[k+2]<100){count++;sx+=x+.5;sy+=y+.5;}if(f[k]<80&&f[k+1]<145&&f[k+2]>170){blueCount++;bx+=x+.5;by+=y+.5;}}
  if(!count||!blueCount||frame>=audit.samples.length)throw Error('Tracking/spatial marker missing or unexpected frame');
  const expected=audit.samples[frame],screen=[sx/count*4,sy/count*4],error=Math.hypot(screen[0]-expected.screen[0],screen[1]-expected.screen[1]);
  const spatialScreen=[bx/blueCount*4,by/blueCount*4],spatialError=Math.hypot(spatialScreen[0]-expected.spatialScreen[0],spatialScreen[1]-expected.spatialScreen[1]);
  measurements.push({frame,time:frame/fps,id:expected.id,count,screen,expected:expected.screen,errorPixels:error,spatialScreen,spatialExpected:expected.spatialScreen,spatialErrorPixels:spatialError});frame++;
 }
}});
if(pending.length||frame!==duration*fps)throw Error('Incomplete decoded frame stream');
const maxError=Math.max(...measurements.map(x=>x.errorPixels)),maxSpatialError=Math.max(...measurements.map(x=>x.spatialErrorPixels)),tracked=measurements.filter(x=>audit.samples[x.frame].tracking);
const spatialTravel=Math.max(...measurements.map(x=>x.spatialScreen[0]))-Math.min(...measurements.map(x=>x.spatialScreen[0]));
const windowTravel=[...new Set(tracked.map(x=>x.id))].map(id=>{const a=tracked.filter(x=>x.id===id);return {id,frames:a.length,screenTravelPixels:Math.max(...a.map(x=>x.spatialScreen[0]))-Math.min(...a.map(x=>x.spatialScreen[0]))};});
const report={passed:maxError<6&&maxSpatialError<6&&spatialTravel>200&&windowTravel.every(x=>x.screenTravelPixels>20),variant,method:'Actual EffectCraft H264 render; all frames at quarter resolution; moving green target and fixed-world blue spatial reference vs saved native matrices',decodedFrames:frame,width:v[0].width,height:v[0].height,fps:v[0].avg_frame_rate,audioStreams:a.length,duration:Number(probe.format.duration),maxErrorPixels:maxError,maxSpatialErrorPixels:maxSpatialError,spatialScreenTravelPixels:spatialTravel,windowTravel,maxTrackedErrorPixels:Math.max(...tracked.map(x=>x.errorPixels)),trackedFrames:tracked.length,toleranceSourcePixels:6,measurements,aiCharacterInputs:0,backgroundConfirmed:false,productionComplete:false};
save(path.join(root,'qa',variant+'-native-video-tracking.json'),report);
if(!report.passed)throw Error('Native-rendered tracking error exceeds tolerance');
console.log(JSON.stringify({passed:report.passed,variant,decodedFrames:frame,maxErrorPixels:maxError,maxSpatialErrorPixels:maxSpatialError,spatialScreenTravelPixels:spatialTravel,windowTravel,maxTrackedErrorPixels:report.maxTrackedErrorPixels,audioStreams:0,backgroundConfirmed:false,productionComplete:false}));
