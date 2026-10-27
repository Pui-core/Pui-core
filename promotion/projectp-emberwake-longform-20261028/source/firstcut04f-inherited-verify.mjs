import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {file,np,FF,save,digest} from './native.mjs';
const read=p=>JSON.parse(fs.readFileSync(file(p)));
const current=read('qa/emberwake-firstcut04f-f-native-render.json');
const previous=read('qa/emberwake-firstcut04e-f-native-render.json');
const inherited=read('qa/firstcut04e-picture-patches.json');
const changed=read('qa/firstcut04f-picture-patches.json');
if(!current.fullAvDecode||!previous.fullAvDecode)throw Error('Both actual complete masters are required');
const wanted=new Set();
for(const p of inherited.patches)for(let n=p.start;n<p.end;n++)wanted.add(n);
for(const p of changed.patches)for(let n=p.start;n<p.end;n++)wanted.delete(n);
const frames=[...wanted].sort((a,b)=>a-b),ranges=[];
for(const n of frames){const last=ranges.at(-1);if(last&&last[1]===n)last[1]++;else ranges.push([n,n+1]);}
const pixels=160*90*3;
const expr=ranges.map(([a,b])=>'between(n\\,'+a+'\\,'+(b-1)+')').join('+');
function decode(video){const r=spawnSync(FF,['-v','error','-i',np(file(video)),'-vf','select='+expr+',scale=160:90:flags=area','-an','-vsync','0','-pix_fmt','rgb24','-f','rawvideo','-'],{encoding:null,maxBuffer:frames.length*pixels+1000000,timeout:180000});if(r.status!==0||r.stdout.length!==frames.length*pixels)throw Error('Finite inherited picture decode failed '+r.status+' '+r.stderr);return r.stdout;}
const expected=decode(previous.video),actual=decode(current.video);
let maxFrameRmse=0,sum=0,worstFrame=null;
for(let f=0;f<frames.length;f++){let sq=0;for(let n=0;n<pixels;n++){const delta=expected[f*pixels+n]-actual[f*pixels+n];sq+=delta*delta;}sum+=sq;const rmse=Math.sqrt(sq/pixels);if(rmse>maxFrameRmse){maxFrameRmse=rmse;worstFrame=frames[f];}}
if(maxFrameRmse>10)throw Error('Inherited camera/state repair differs in latest actual master: '+maxFrameRmse+' at frame '+worstFrame);
if(await digest(file(current.video))!==current.sha256||await digest(file(previous.video))!==previous.sha256)throw Error('Master SHA changed');
const q={videoSha256:current.sha256,previousMasterSha256:previous.sha256,scope:'Every 04e Native camera/state repair frame except the deliberately replaced 04f dialogue ranges. Compare actual 04f against actual 04e; original Native-to-04e correspondence remains in the 04e repair receipt.',framesCompared:frames.length,previousRepairFrames:inherited.frames,excludedCurrentRepairFrames:inherited.frames-frames.length,ranges,diagnosticSize:[160,90],maxFrameRmse,worstFrame,rmse:Math.sqrt(sum/(frames.length*pixels)),tolerance:10,allInheritedRepairFramesMatched:true,wholeDirectWatch:false,subjectiveListen:false,rootAccepted:false};
save('qa/firstcut04f-inherited-verification.json',q);
console.log(JSON.stringify({framesCompared:q.framesCompared,maxFrameRmse,allInheritedRepairFramesMatched:true}));
