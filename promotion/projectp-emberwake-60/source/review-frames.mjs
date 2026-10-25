/** Final-video review grids. Import is inert; run only after the final export completes. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const HIGH_RESOLUTION_SECONDS=[.7,5,14,20.3,24,27.3,29.7,32.3,35,38,41.5,46,50.5,54,57,59.8];
export function reviewPlan(e=episodes[0]){
  if(!e||!Number.isFinite(e.duration)||e.duration<=0)throw Error('Missing episode/duration');
  const fps=30,totalFrames=Math.round(e.duration*fps),stem=e.id+'-'+e.slug;
  const stories=Array.from({length:Math.ceil(e.duration/10)},(_,i)=>{
    const start=i*10,end=Math.min(start+10,e.duration),startFrame=Math.round(start*fps),endFrame=Math.round(end*fps);
    const sampledFrames=[];for(let f=startFrame;f<endFrame;f+=10)sampledFrames.push(f);
    return{index:i+1,start,end,startFrame,endFrame,sampleFrames:sampledFrames,columns:5,rows:Math.ceil(sampledFrames.length/5),file:'story-'+(i+1)+'.jpg'};
  });
  const boundaries=e.shots.slice(1).map((s,i)=>({index:i+1,time:s.a,startFrame:Math.max(0,Math.min(Math.round(s.a*fps)-3,totalFrames-12)),frames:12,file:'boundary-'+String(i+1).padStart(2,'0')+'.jpg'}));
  const highResolution=HIGH_RESOLUTION_SECONDS.filter(t=>t<e.duration).map(time=>({time,frame:Math.min(totalFrames-1,Math.round(time*fps)),file:'final-'+time+'.png'}));
  return{stem,duration:e.duration,fps,totalFrames,stories,boundaries,highResolution};
}
export async function buildReviewFrames(e=episodes[0]){
  const {file,np,run,FF,save,hash}=await import('./native.mjs');
  const plan=reviewPlan(e),out=file('videos/'+plan.stem+'.mp4'),q='qa/'+plan.stem+'/';
  if(!fs.existsSync(out)||fs.statSync(out).size===0)throw Error('Final MP4 is not ready: '+out);
  const sourceSha=hash(out),planSha=crypto.createHash('sha256').update(JSON.stringify(plan)).digest('hex');
  const jobFile=file(q+'review-progress.json');
  let job=fs.existsSync(jobFile)?JSON.parse(fs.readFileSync(jobFile,'utf8')):{videoSha256:sourceSha,planSha256:planSha,done:{}};
  if(job.videoSha256!==sourceSha||job.planSha256!==planSha)job={videoSha256:sourceSha,planSha256:planSha,done:{}};
  fs.mkdirSync(file(q),{recursive:true});
  async function capture(args,receipt,target){
    const cached=job.done[receipt];
    if(cached&&fs.existsSync(file(cached.file))&&hash(file(cached.file))===cached.sha256)return;
    await run(FF,args,receipt);
    const actual=file(target);if(!fs.existsSync(actual)||fs.statSync(actual).size<32)throw Error('Missing review output: '+actual);
    job.done[receipt]={file:target,sha256:hash(actual)};save(q+'review-progress.json',job);
  }
  for(const s of plan.stories){
    const target=q+s.file,receipt=q+'story-'+s.index+'.json';
    // At30fps selecting every tenth frame yields exactly3fps, including each segment's first frame.
    await capture(['-v','error','-y','-ss',String(s.start),'-i',np(out),'-t',String(s.end-s.start),'-map','0:v:0','-an','-vf',"select='not(mod(n,10))',scale=270:480,tile=5x"+s.rows+':padding=5:margin=5:color=0x10151c','-frames:v','1',np(file(target))],receipt,target);
  }
  for(const b of plan.boundaries){
    const target=q+b.file,receipt=q+'boundary-'+String(b.index).padStart(2,'0')+'.json';
    await capture(['-v','error','-y','-ss',String(b.startFrame/30),'-i',np(out),'-map','0:v:0','-an','-vf','scale=216:384,tile=4x3:padding=4:margin=4:color=0x10151c','-frames:v','1',np(file(target))],receipt,target);
  }
  for(const h of plan.highResolution){
    const target=q+h.file,receipt=q+'final-'+h.time+'.json';
    await capture(['-v','error','-y','-ss',String(h.frame/30),'-i',np(out),'-map','0:v:0','-an','-frames:v','1',np(file(target))],receipt,target);
  }
  if(hash(out)!==sourceSha)throw Error('Final MP4 changed during review extraction');
  const report={version:'EMBERWAKE-60',videoSha256:sourceSha,planSha256:planSha,stem:plan.stem,duration:plan.duration,frames:plan.totalFrames,storySamplingFps:3,storySheets:plan.stories.length,stories:plan.stories,boundaries:plan.boundaries,highResolution:plan.highResolution,highResolutionSeconds:plan.highResolution.map(h=>h.time),outputFiles:Object.values(job.done),scope:'Sampled final-video frames and12 consecutive frames at every edit boundary. Does not claim real-time whole playback, visual approval or auditory review.'};
  save(q+'review-frames.json',report);console.log('Review frames ready: '+plan.stem+' / '+plan.stories.length+' sheets / '+plan.boundaries.length+' boundaries / '+plan.highResolution.length+' high-resolution frames');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildReviewFrames();
