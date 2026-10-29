import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {stage,ffRoot,cpuSubset,save,hash,ff} from './background.mjs';
const root=stage+'/jump-v01';
// The first 310 rows contain the heading, including unsafe y=0. The game lights
// at y=325..359 were false positives in the original full-360px classifier.
// We preserve that failed result and validate this classifier on the actual v01.
async function inspect(file){
 const width=1080,height=360,size=width*height*3,rows=[];let pending=Buffer.alloc(0),stderr='';
 const child=spawn('/usr/bin/nice',['-n','10','ionice','-c','3','taskset','-c',cpuSubset,ffRoot+'/bin/ffmpeg','-nostdin','-v','error','-threads','2','-i',file,'-vf','crop=1080:360:0:0','-an','-f','rawvideo','-pix_fmt','rgb24','-'],{env:{...process.env,LD_LIBRARY_PATH:ffRoot+'/lib'},stdio:['ignore','pipe','pipe']});
 const timer=setTimeout(()=>child.kill('SIGTERM'),90000);child.stderr.on('data',b=>stderr+=b);
 child.stdout.on('data',chunk=>{pending=Buffer.concat([pending,chunk]);while(pending.length>=size){const data=pending.subarray(0,size);pending=pending.subarray(size);const boxes=Array.from({length:2},()=>({minX:width,minY:height,maxX:-1,maxY:-1,pixels:0}));for(let n=0;n<width*height;n++){const i=n*3,r=data[i],g=data[i+1],b=data[i+2];if(r>190&&g>160&&b>90&&r-g>10&&g-b>15){const x=n%width,y=Math.floor(n/width),box=boxes[y<310?0:1];box.minX=Math.min(box.minX,x);box.maxX=Math.max(box.maxX,x);box.minY=Math.min(box.minY,y);box.maxY=Math.max(box.maxY,y);box.pixels++;}}
 const convert=b=>({pixels:b.pixels,bbox:b.pixels?[b.minX,b.minY,b.maxX,b.maxY]:null,centerX:b.pixels?(b.minX+b.maxX)/2:null});rows.push({frame:rows.length,time:rows.length/30,heading:convert(boxes[0]),excludedGameBand:convert(boxes[1])});}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});clearTimeout(timer);if(code!==0||stderr||pending.length||rows.length!==240)throw Error('Incomplete actual frame inspection');
 const checked=rows.filter(r=>(r.frame>=4&&r.frame<96)||(r.frame>=100&&r.frame<180));const failures=checked.filter(r=>r.heading.pixels<1000||r.heading.bbox?.[1]<144||r.heading.bbox?.[3]>310||Math.abs(r.heading.centerX-540)>5);
 return{file,sha256:hash(file),decodedFrames:rows.length,checkedFrames:checked.length,failures,centerRange:[Math.min(...checked.map(r=>r.heading.centerX)),Math.max(...checked.map(r=>r.heading.centerX))],topRange:[Math.min(...checked.map(r=>r.heading.bbox?.[1]??-1)),Math.max(...checked.map(r=>r.heading.bbox?.[1]??-1))],bottomRange:[Math.min(...checked.map(r=>r.heading.bbox?.[3]??-1)),Math.max(...checked.map(r=>r.heading.bbox?.[3]??-1))],rows};
}
const final=await inspect(root+'/videos/emberwake-jump-v03-bgm.mp4');
const prior=await inspect(root+'/videos/emberwake-jump-v01-bgm.mp4');
const failedOriginal=JSON.parse(fs.readFileSync(root+'/qa/final-v03-heading-bounds.json','utf8'));
const classification=failedOriginal.failures.map(old=>({frame:old.frame,time:old.time,original360px:old,heading:final.rows[old.frame].heading,excludedGameBand:final.rows[old.frame].excludedGameBand,classification:'Gold game light below the independently measured heading; retained original failed result'}));
save(root+'/qa/final-v03-heading-classified.json',{method:'Actual decoded RGB: heading ROI x0..1079,y0..309, includes unsafe top rows; game-band y310..359 classified separately. Same warm-pixel predicate as failed full-360 inspection. Entrance frames 0..3/96..99 excluded only.',originalFailedInspection:'final-v03-heading-bounds.json',originalFailedInspectionSha256:hash(root+'/qa/final-v03-heading-bounds.json'),final,priorFinalControl:prior,historicalUnsafeControl:'NOT REPRODUCED: retained actual v01 MP4 and first-pass frame-4_4.png have safe top around190..196. Initial report of top clipping cannot be validated against retained files; do not manufacture RED.',classification,wholeRealtimeWatch:false,sharedGui:0});
if(final.failures.length)throw Error('Final heading unsafe');
for(const frame of[38,113])await ff(['-i',final.file,'-vf',`select=eq(n\\,${frame}),crop=1080:420:0:0`,'-frames:v','1',root+'/qa/false-positive-frame-'+frame+'.png'],root+'/qa/false-positive-frame-'+frame+'.json');
console.log(JSON.stringify({finalFailures:final.failures.length,controlFailures:prior.failures.length,finalTop:final.topRange,finalCenter:final.centerRange,classified:classification.map(r=>({frame:r.frame,heading:r.heading.bbox,game:r.excludedGameBand.bbox})),output:root+'/qa/final-v03-heading-classified.json'}));
