import fs from 'node:fs';
import {file,np,run,FF,save,hash} from './native.mjs';
import {episodes} from './episodes.mjs';
const e=episodes[0],out=file('videos/01-projectp-first.mp4'),q='qa/01-projectp-first/';
const jobFile=file(q+'review-progress.json'),sourceSha=hash(out);
let job=fs.existsSync(jobFile)?JSON.parse(fs.readFileSync(jobFile)):{videoSha256:sourceSha,done:{}};
if(job.videoSha256!==sourceSha)job={videoSha256:sourceSha,done:{}};
async function capture(exe,args,receipt){
 const key=receipt;
 if(job.done[key]){const r=job.done[key];if(fs.existsSync(file(r.file))&&hash(file(r.file))===r.sha256)return;}
 await run(exe,args,receipt);
 const winTarget=args.at(-1),pathResult=(await import('node:child_process')).spawnSync('wslpath',['-u',winTarget],{encoding:'utf8'});
 if(pathResult.status)throw Error(pathResult.stderr);
 const actual=pathResult.stdout.trim(),rel=actual.slice(file('').length+1);
 job.done[key]={file:rel,sha256:hash(actual)};save(q+'review-progress.json',job);
 await new Promise(resolve=>setTimeout(resolve,150));
}
for(const [i,start,end]of [[1,0,10],[2,10,20],[3,20,e.duration]]){
 const count=Math.ceil((end-start)*3),rows=Math.ceil(count/5);
 await capture(FF,['-v','error','-y','-ss',String(start),'-i',np(out),'-t',String(end-start),'-vf','fps=3,scale=270:480,tile=5x'+rows+':padding=5:margin=5:color=0x10151c','-frames:v','1',np(file(q+'story-'+i+'.jpg'))],q+'story-'+i+'.json');
}
const boundaries=e.shots.slice(1).map(s=>s.a);
for(const [i,t]of boundaries.entries()){
 const start=Math.max(0,Math.round(t*30)-3);
 await capture(FF,['-v','error','-y','-ss',String(start/30),'-i',np(out),'-vf','scale=216:384,tile=4x3:padding=4:margin=4:color=0x10151c','-frames:v','1',np(file(q+'boundary-'+String(i+1).padStart(2,'0')+'.jpg'))],q+'boundary-'+String(i+1).padStart(2,'0')+'.json');
}
for(const t of [4,8.1,10.7,12.7,13.9,15.6,18.2,21.1,22.4,25.3,26.2])await capture(FF,['-v','error','-y','-ss',String(t),'-i',np(out),'-frames:v','1',np(file(q+'final-'+t+'.png'))],q+'final-'+t+'.json');
save(q+'review-frames.json',{videoSha256:hash(out),storySamplingFps:3,storySheets:3,boundaries:boundaries.map((time,i)=>({time,startFrame:Math.round(time*30)-3,frames:12,file:'boundary-'+String(i+1).padStart(2,'0')+'.jpg'})),highResolutionSeconds:[4,8.1,10.7,12.7,13.9,15.6,18.2,21.1,22.4,25.3,26.2],scope:'Sampled final-video frames and every edit boundary; not real-time full playback or auditory review.'});
console.log('Review frames ready');
