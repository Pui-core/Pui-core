import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {file,np,FF,run,hash,save} from './native.mjs';
const modelDir='/mnt/f/Users/pui/Desktop/model/SeeThrough-workflows/Revenant_Natural';
const core='/mnt/c/Program Files/Live2D Cubism 5.3/app/lib/Live2DCubismCore.jar';
const lib='/mnt/c/Program Files/Live2D Cubism 5.3/app/dll64';
const java='/mnt/c/Program Files/Live2D Cubism 5.3/app/jre/bin/java.exe';
const model=JSON.parse(fs.readFileSync(path.join(modelDir,'Revenant_Natural.model3.json'),'utf8'));
const ref=model.FileReferences,moc=path.join(modelDir,ref.Moc),textures=ref.Textures.map(n=>path.join(modelDir,n));
if(hash(moc)!=='6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e')throw Error('Unexpected specified Natural MOC');
const before=[moc,path.join(modelDir,'Revenant_Natural.model3.json'),...textures].map(p=>({path:p,sha256:hash(p)}));
const work='/home/pui/tmp/projectp112-capture-20261026/model';
const classes=path.join(work,'classes');fs.mkdirSync(classes,{recursive:true});
await run('javac',['--release','17','-cp',core,'-d',classes,file('source/AvatarCore.java'),file('source/AlphaBounds.java')],'model-compile.json');
const voice=JSON.parse(fs.readFileSync(file('qa/narration.json'),'utf8')),sr=48000,pcm=new Float32Array(82*sr);
for(const c of voice.cues){const r=spawnSync(FF,['-v','error','-i',np(file('media/'+c.file)),'-vn','-ac','1','-ar',String(sr),'-f','f32le','-'],{encoding:null,maxBuffer:4000000,timeout:30000});if(r.status!==0)throw Error('Narration PCM decode failed');const b=r.stdout;for(let n=0;n<b.length/4;n++){const at=Math.round(c.at*sr)+n;if(at<pcm.length)pcm[at]+=b.readFloatLE(n*4);}}
// Render only the actual on-screen host intervals, without reusing old mouth poses.
const schedule=[];for(let f=0;f<438;f++){const local=f/30,outputTime=local<7.6?local:75+local-7.6;let sum=0,n=0;const center=Math.round((outputTime+1/60)*sr);for(let i=center-400;i<center+400;i++)if(i>=0&&i<pcm.length){sum+=pcm[i]*pcm[i];n++;}schedule.push({frame:f,localTime:local,outputTime,rms:Math.sqrt(sum/Math.max(1,n))});}
const voiced=schedule.filter(r=>r.rms>.006).map(r=>r.rms).sort((a,b)=>a-b),reference=voiced[Math.floor(voiced.length*.9)]||.1;
const pulse=(t,c,w)=>Math.abs(t-c)<w?(1+Math.cos(Math.PI*(t-c)/w))/2:0;
for(const r of schedule){r.mouth=r.rms<.006?0:Math.min(.78,.12+.62*Math.sqrt(r.rms/reference));r.eye=1-Math.max(...[2.9,6.7,9.1,12.4].map(c=>pulse(r.localTime,c,.1)));r.headX=2*Math.sin(r.localTime/2.8);r.headY=.5*Math.sin(r.localTime/2);r.headZ=.4*Math.sin(r.localTime/3);r.bodyX=.2*Math.sin(r.localTime/4);r.breath=.2+.07*Math.sin(r.localTime*1.3);}
save('source/model-cues.json',{fps:30,frames:schedule,intervals:[{output:[0,7.6],model:[0,7.6]},{output:[75,82],model:[7.6,14.6]}],referenceRms:reference,silenceThreshold:.006,method:'New narration-only RMS evaluated at each output video-frame center; mouth closed in silence. Restrained authored blink/head/breath parameters.',tracking:false,physicsSimulated:false});
const csv='frame,mouth,eyeL,eyeR,headX,headY,headZ,bodyX,breath\n'+schedule.map(r=>[r.frame,r.mouth,r.eye,r.eye,r.headX,r.headY,r.headZ,r.bodyX,r.breath].map(x=>Number(x).toFixed(7)).join(',')).join('\n')+'\n';
const csvPath=path.join(work,'schedule.csv');fs.writeFileSync(csvPath,csv);
const frames=file('media/natural');if(fs.existsSync(frames)&&fs.readdirSync(frames).length)throw Error('Preserve existing rendered frames; no automatic overwrite');fs.mkdirSync(frames,{recursive:true});
await run(java,['-Xmx2g','-Djava.awt.headless=true','-Djava.library.path='+np(lib),'-cp',np(core)+';'+np(classes),'AvatarCore',np(moc),...textures.map(np),np(frames),np(csvPath)],'model-native-render.json');
await run(java,['-Xmx1g','-Djava.awt.headless=true','-cp',np(classes),'AlphaBounds',np(frames),np(file('qa/model-alpha-bounds.json')),'438'],'model-alpha-check.json');
await run(FF,['-v','error','-y','-framerate','30','-i',np(path.join(frames,'frame-%06d.png')),'-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-an',np(file('media/natural.mov'))],'model-prores.json');
if(before.some(p=>hash(p.path)!==p.sha256))throw Error('Original model files changed');
save('qa/model-binding.json',{model:'Revenant_Natural / owner specified',originalFiles:before,originalsUnchanged:true,coreJarSha256:hash(core),coreNativeSha256:hash(path.join(lib,'Live2DCubismCoreJNI.dll')),rendererSha256:hash(file('source/AvatarCore.java')),frames:438,width:600,height:780,fps:30,alpha:true,movSha256:hash(file('media/natural.mov')),mouthFromNewVoiceOnly:true,cameraTracking:false,vTubeStudio:false,physicsSimulated:false,coreGeometry:true,softwareTriangleRenderer:true,limitation:'Software triangle and mask sampling approximates GPU rendering; normal blend and default color factors checked each frame; not a camera/physics capture',rawModelOrSdkBundled:false});
console.log('Natural438 actual Core frames, new narration envelope, source model unchanged');
