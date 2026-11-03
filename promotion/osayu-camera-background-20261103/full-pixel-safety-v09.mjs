import {framesFor} from './full-plan-v09.mjs';
import path from 'node:path';import fs from 'node:fs';
import {root,run,ffmpegPath,save,hash} from './runtime.mjs';
const [variant,mode]=process.argv.slice(2),frames=framesFor(variant);

if(!['solo','collab'].includes(variant)||!['neutral','production'].includes(mode))throw Error('args');
const stem=variant+'-'+mode,receipt=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-full-receipt.json'))),file=receipt.out;
if(hash(file)!==receipt.sha256)throw Error('Changed video');
// Numeric only. Character-containing frames are never emitted or viewed.
// The composition uses a saturated magenta background under the oversized plane.
// Any visible edge therefore gives an unambiguous coverage failure.
let carry=Buffer.alloc(0),pixel=0,magenta=0,seenFrames=0,total=0,max=0;
const failures=[];
await run(ffmpegPath,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-i',file,'-map','0:v:0','-an','-f','rawvideo','-pix_fmt','rgb24','-'],stem+'-full-numeric-pixels',{
 timeoutMs:180000,consumeStdout(chunk){
  const b=carry.length?Buffer.concat([carry,chunk]):chunk,limit=b.length-b.length%3;
  for(let i=0;i<limit;i+=3){if(b[i]>230&&b[i+1]<30&&b[i+2]>230)magenta++;pixel++;if(pixel===1080*1920){if(magenta>2)failures.push({frame:seenFrames,magentaPixels:magenta});total+=magenta;max=Math.max(max,magenta);seenFrames++;pixel=0;magenta=0;}}
  carry=b.subarray(limit);
 }});
if(carry.length||pixel||seenFrames!==frames||failures.length)throw Error('Coverage/decode failed '+JSON.stringify({frames,failures:failures.slice(0,8)}));
save(path.join(root,'qa',stem+'-full-coverage.json'),{videoSHA256:receipt.sha256,frames,totalMagentaPixels:total,maxMagentaPixelsPerFrame:max,uncoveredBackgroundDetected:false,inspection:'numeric RGB only; no AI frame input'});
console.log(JSON.stringify({variant,mode,frames,uncoveredBackgroundDetected:false}));
