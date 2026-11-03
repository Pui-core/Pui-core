import fs from 'node:fs';
import path from 'node:path';
import {root,ff,save,hash,run,ffmpegPath,ffEnv} from './runtime.mjs';
import {framesFor,durationFor,cutFramesFor,sourceIn,sourceSHA256} from './full-plan-v09.mjs';
const sampleRate=11025;
const readFloats=p=>{const b=fs.readFileSync(p);return new Float32Array(b.buffer,b.byteOffset,b.length/4);};
function rms(a,from,to){let n=0,sum=0;for(let i=Math.max(0,Math.ceil(from*sampleRate));i<Math.min(a.length,Math.floor(to*sampleRate));i++){sum+=a[i]*a[i];n++;}return n?Math.sqrt(sum/n):0;}
function correlation(a,b,lag,n){let aa=0,bb=0,ab=0;for(let i=50;i<n-50;i++){const x=a[i],y=b[i+lag];aa+=x*x;bb+=y*y;ab+=x*y;}return {lagSamples:lag,correlation:ab/Math.sqrt(aa*bb),gain:ab/bb};}
for(const v of process.argv.slice(2).length?process.argv.slice(2):['solo','collab']){
 const receipt=JSON.parse(fs.readFileSync(path.join(root,'qa',v+'-final-pair-receipt.json'))),output=receipt.outputs.find(x=>x.kind==='with-audio'),duration=durationFor(v),frames=framesFor(v);
 if(hash(output.path)!==output.sha256||!receipt.videoDecodedFramesAndPTSIdentical)throw Error('Final pair changed');
 const audio=path.join(root,'audio/candidate-elektronomia-sky-high-regular.mp3');if(hash(audio)!==sourceSHA256)throw Error('Source recording changed');
 const actual=path.join(root,'qa',v+'-final-audio.f32'),reference=path.join(root,'qa',v+'-source-interval.f32');
 await ff(['-i',output.path,'-map','0:a:0','-vn','-ac','1','-ar',String(sampleRate),'-f','f32le',actual],v+'-final-audio-decode');
 await ff(['-ss',String(sourceIn),'-i',audio,'-t',String(duration),'-vn','-ac','1','-ar',String(sampleRate),'-f','f32le',reference],v+'-reference-interval-decode');
 const a=readFloats(actual),b=readFloats(reference),n=Math.min(a.length,b.length,Math.floor((duration-.4)*sampleRate));
 let best={correlation:-1};for(let lag=-32;lag<=32;lag++){const c=correlation(a,b,lag,n);if(c.correlation>best.correlation)best=c;}
 let peak=0,clipped=0;for(const x of a){peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>=.9999)clipped++;}
 const windows=[[0,.1],[duration-.4,duration-.3],[duration-.2666667,duration-.1666667],[duration-.1,duration-.05],[duration-.01,duration],[duration,a.length/sampleRate]].map(([from,to])=>{const ar=rms(a,from,to),br=rms(b,from,to);return {from,to,actualRMS:ar,referenceRMS:br,ratio:br?ar/br:null};});
 if(best.correlation<.98||Math.abs(best.lagSamples)>2||best.gain<.45||best.gain>.55||clipped||a.length/sampleRate-duration>.05||windows[0].actualRMS<=0||windows[4].ratio>.12||windows[5].actualRMS>.003)throw Error('Actual audio interval/head/tail check '+JSON.stringify({best,clipped,windows}));
 // Full final numeric-only decode. No image files or person media are returned to AI.
 const w=96,h=170,size=w*h;let pending=Buffer.alloc(0),previous=null,seen=0,maxStill=1,still=1;const deltas=[];
 await run(ffmpegPath,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-filter_threads','2','-i',output.path,'-map','0:v:0','-an','-vf',`scale=${w}:${h}:flags=area,format=gray`,'-f','rawvideo','-'],v+'-final-numeric-motion',{env:ffEnv,consumeStdout:chunk=>{
  pending=Buffer.concat([pending,chunk]);while(pending.length>=size){const frame=Buffer.from(pending.subarray(0,size));pending=pending.subarray(size);if(previous){let sum=0,changed=0;for(let i=0;i<size;i++){const d=Math.abs(frame[i]-previous[i]);sum+=d;if(d>2)changed++;}const mae=sum/size,changedFraction=changed/size;const visible=mae>.20&&changedFraction>.01;still=visible?1:still+1;maxStill=Math.max(maxStill,still);deltas.push({frame:seen,mae,changedFraction,visible});}previous=frame;seen++;}
 }});
 if(pending.length||seen!==frames||maxStill>=90)throw Error('Final motion/static duration');
 const cuts=cutFramesFor(v),shots=cuts.slice(0,-1).map((from,i)=>({fromFrame:from,toFrame:cuts[i+1],frames:cuts[i+1]-from,visibleTransitions:deltas.filter(d=>d.frame>from&&d.frame<cuts[i+1]&&d.visible).length}));
 if(shots.some(s=>s.frames>150||s.visibleTransitions<5))throw Error('Moving shot duration/evidence');
 save(path.join(root,'qa',v+'-full-final-audit.json'),{variant:v,outputSHA256:output.sha256,sourceSHA256,sourceIn,sourceOut:sourceIn+duration,audio:{...best,sampleRate,decodedSeconds:a.length/sampleRate,videoDuration:duration,peak,clipped,windows,actualAudition:false,method:'Decoded AAC vs exact official recording interval; correlation excludes native eight-frame tail fade. Mono numeric PCM; not listening.'},motion:{frames:seen,maxBelowVisibilityRunFrames:maxStill,threshold:{grayMAE:.20,grayDifference:2,changedFraction:.01,downsample:[w,h]},shots,deltas,method:'Every final frame numeric difference only, combined with saved native camera and popup audit. No mechanical cut segmentation; not creative acceptance.'},AIInputsOfPeople:0});
 console.log(JSON.stringify({variant:v,audioCorrelation:best.correlation,lagSamples:best.lagSamples,maxBelowVisibilityRunFrames:maxStill,shots}));
}
