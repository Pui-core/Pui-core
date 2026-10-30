import fs from 'node:fs';
import {file,np,EC,FC,FP,run,parse,save,digest,hash} from './native.mjs';
const tick=254016000000, duration=75, comp='TruthOrLie129 Editorial Sample75 v02 corrected';
const ec=file('projects/truthorlie129-sample75-v02-corrected.ecproj');
const fc=file('projects/truthorlie129-sample75-v02-corrected.fcproj');
const patches=[{start:26.4,end:32,name:'vote'},{start:41.6,end:44.8,name:'role'}];
for(const p of patches){
 p.path=file(`media/truthorlie129-correction-${p.name}.mp4`);
 await run(EC,['--project',np(ec),'render','--comp',comp,'--start',String(p.start),'--end',String(p.end),'--out',np(p.path),'--format','h264','--bitrate','24000','--audio','off','--progress','--json'],`ec-correction-${p.name}.json`);
 const probe=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(p.path)],`correction-${p.name}-probe.json`)).stdout);
 if(Math.abs(Number(probe.format.duration)-(p.end-p.start))>.04)throw Error('Patch duration mismatch '+p.name);
 p.duration=Number(probe.format.duration);p.sha256=await digest(p.path);
}
const paths=['media/truthorlie129-picture-v02.mp4','media/narration-presented-stem.wav','media/background-cipher-stem.wav'].map(file).concat(patches.map(p=>p.path));
const first=await run(FC,['--save-as',np(fc),'run','-'],'fc-corrected-build.json',[
 {id:'file.newProject',params:{name:'TruthOrLie129 edit sample corrected / not final master'}},
 {id:'file.newSequence',params:{name:'Sample75 corrected / rule-story rewrite pending',width:1920,height:1080,fps:30,sampleRate:48000,video:2,audio:2}},
 {id:'file.import',params:{paths:paths.map(np)}}
].map(x=>JSON.stringify(x)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}
if(items?.length!==5)throw Error('Native FC import count');
const placements=items.map((item,i)=>({id:'timeline.place',params:{item,track:i<3?(i?'A'+i:'V1'):'V2',seconds:i<3?0:patches[i-3].start,duration:(i<3?duration:patches[i-3].end-patches[i-3].start)*tick,video:i===0||i>=3,audio:i>0&&i<3}}));
await run(FC,['--project',np(fc),'--save','run','-'],'fc-corrected-place.json',placements.map(x=>JSON.stringify(x)).join('\n')+'\n');
const out=file('videos/truthorlie129-editorial-sample75-v02-corrected-cipher.mp4');
const ex=parse((await run(FC,['--project',np(fc),'exec','file.exportMedia',JSON.stringify({path:np(out),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'fc-corrected-export.json')).stdout);
if(ex.offlineMedia?.length)throw Error('FC missing media');
save('qa/render-sample-v02-corrected-binding.json',{duration,output:'videos/truthorlie129-editorial-sample75-v02-corrected-cipher.mp4',sha256:await digest(out),basePictureSha256:await digest(paths[0]),patches:patches.map(({path,...p})=>({...p,path:np(path)})),ecSha256:hash(ec),fcSha256:hash(fc),actualNativeEC:true,actualNativeFC:true,offlineMedia:ex.offlineMedia||[],voiceCues:14,newCoreFrames:360,newCoreSeconds:12,bgm:'Cipher comparison candidate; subjective adoption pending',bgmSeparateEditableTrack:true,notFinal600SecondMaster:true,rootQualityAccepted:false,wholeDirectWatch:false,wholeSubjectiveListen:false,published:false});
console.log('ACTUAL_NATIVE_CORRECTED_SAMPLE75_COMPLETE');
