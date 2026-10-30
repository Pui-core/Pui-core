/** All-frame numeric measurement of the real final file's persistent stage tick. */
import fs from 'node:fs';import path from 'node:path';
import {root,run,ffRoot,save,hash} from './runtime.mjs';
import {composition,projected} from './audit.mjs';
import {frames,trackWindows,variantArg} from './plan.mjs';
const variant=variantArg(),p=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-production.ecproj'))),layers=composition(p).kind.layers;
const rig=layers.find(l=>l.name.startsWith('STAGE CAMERA')),tick=layers.find(l=>l.name==='STAGE STATION 2');
if(tick.parent!==rig.id)throw Error('Persistent tick outside camera');
const final=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-final.private.json')));
if(!final.passed||hash(final.path)!==final.sha256)throw Error('Final changed');
const expected=frames.map(f=>({...f,screen:projected(tick,rig,f.time)})),w=270,h=480,size=w*h*3;
let pending=Buffer.alloc(0),index=0;const measurements=[];
await run(path.join(ffRoot,'bin/ffmpeg'),['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',final.path,'-map','0:v:0','-an','-vf',`scale=${w}:${h}:flags=neighbor,format=rgb24`,'-f','rawvideo','pipe:1'],variant+'-final-actual-pan',{env:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')},consumeStdout(chunk){
 pending=Buffer.concat([pending,chunk]);while(pending.length>=size){const f=pending.subarray(0,size);pending=pending.subarray(size);const e=expected[index];if(!e)throw Error('Unexpected final frame');let n=0,xsum=0,ysum=0;
  for(let y=Math.max(0,Math.floor(e.screen[1]/4)-4);y<Math.min(h,Math.ceil(e.screen[1]/4)+4);y++)for(let x=Math.max(0,Math.floor(e.screen[0]/4)-9);x<Math.min(w,Math.ceil(e.screen[0]/4)+9);x++){
   const k=(y*w+x)*3,r=f[k],g=f[k+1],b=f[k+2];if(r>170&&g>70&&g<215&&b>130&&r>g*1.12&&b>g*1.05){n++;xsum+=x+.5;ysum+=y+.5;}
  }
  if(!n)throw Error('Final persistent tick not visible');const screen=[xsum/n*4,ysum/n*4];measurements.push({frame:index,time:e.time,screen,expected:e.screen,error:Math.hypot(screen[0]-e.screen[0],screen[1]-e.screen[1])});index++;
 }
}});
if(index!==570||pending.length)throw Error('Final numeric stream incomplete');
const maxError=Math.max(...measurements.map(x=>x.error)),windows=trackWindows.map(w=>{const a=measurements.filter(x=>x.time>=w.from&&x.time<=w.to);return {id:w.id,frames:a.length,screenTravel:Math.max(...a.map(x=>x.screen[0]))-Math.min(...a.map(x=>x.screen[0]))};});
const report={passed:maxError<6&&windows.every(x=>x.screenTravel>20),variant,decodedFrames:index,maxErrorPixels:maxError,windows,method:'Actual FilmCraft final MP4; persistent world-fixed pink station tick, quarter-resolution numeric-only centroid vs saved native matrix; no AI media input',measurements,characterAIInputs:0};
save(path.join(root,'qa',variant+'-final-motion.private.json'),report);if(!report.passed)throw Error('Actual final pan verification failed');
console.log(JSON.stringify({variant,passed:true,decodedFrames:index,maxErrorPixels:maxError,windows,characterAIInputs:0}));
