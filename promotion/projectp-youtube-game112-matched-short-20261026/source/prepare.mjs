import fs from 'node:fs';import path from 'node:path';
import {file,np,PC,FF,run,parse,copy,hash,save,digest} from './native.mjs';
const parent='/mnt/f/Videos/ProjectP-YouTube-Game-Horizontal-2026-10-26/revision-01';
const parentVideo=path.join(parent,'videos/emberwake-first-forgetting.mp4');if(await digest(parentVideo)!=='820091fc29b802c845080a780c8f143751dc3b74bd22b88f617fd50b4fbbbb7b')throw Error('Parent frozen video changed');
const frames=[10,50,95,805,1160,1400,1680,1860];for(const f of frames)copy(path.join(parent,'media/game/frame-'+String(f).padStart(6,'0')+'.png'),file('media/actual-'+f+'.png'));
copy(path.join(parent,'media/natural.mov'),file('media/natural.mov'));copy(path.join(parent,'media/natural/frame-000000.png'),file('media/natural-cover.png'));
const old=JSON.parse(fs.readFileSync(path.join(parent,'qa/narration.json'),'utf8'));
const selection=[[1,.15,3.2],[3,3.5,6.2],[4,6.5,9.4],[8,9.7,13.6],[10,13.9,17.4],[11,17.7,21.8],[13,22.1,26.2]];
const cues=selection.map(([i,at,end])=>{const c=old.cues[i-1];copy(path.join(parent,'media/'+c.file),file('media/'+c.file));if(hash(file('media/'+c.file))!==c.sha256)throw Error('Narration source changed');return {...c,originalAt:c.at,originalEnd:c.end,at,end,sourceIssue:112,wholeOriginalPhrase:true}});save('source/narration-cues.json',cues);save('qa/narration.json',{...old,reusedFromIssue:112,cues,wholeDirectAudition:false});
const model=JSON.parse(fs.readFileSync(path.join(parent,'source/model-cues.json'),'utf8'));save('qa/model-reuse.json',{sourceIssue:112,sourceMovieSha256:hash(file('media/natural.mov')),actualCoreRendered:true,newCoreRenderPerformed:false,intervals:[{output:[0,3.2],sourceModel:[0,3.2],originalOutput:[0,3.2],matchingCue:'voice-01.wav'},{output:[21.8,26.2],sourceModel:[7.6,12],originalOutput:[75,79.4],matchingCue:'voice-13.wav'}],fps:model.fps,sourceFrames:model.frames.length,tracking:false,sourceParametersSha256:hash(path.join(parent,'source/model-cues.json')),wholeDirectWatch:false});
copy('/mnt/f/Videos/ProjectP-Original-BGM-2026-10-26/revision-03-native-soundcraft/audio/connecting-lights-master.wav',file('media/connecting-lights-master.wav'));if(hash(file('media/connecting-lights-master.wav'))!=='4d3bdac03c4bbcd89511ea637265bd13d56e0f11f6b702ca4f01b66af49c50df')throw Error('BGM revision mismatch');
const clip=[];for(let n=0;n<126;n++){const original=1010+n,p='media/forge/frame-'+String(n).padStart(6,'0')+'.png';copy(path.join(parent,'media/game/frame-'+String(original).padStart(6,'0')+'.png'),file(p));clip.push({file:p,originalFrame:original,sha256:hash(file(p))});}
save('qa/actual-forge-binding.json',{sourceIssue:112,captureSourceCommit:'71584a6bd0c8852885157de71032fd9252e7a04c',sourceFrames:[1010,1136],output:[9.4,13.6],frameCount:126,rate:1,automatedOrdinaryInput:true,humanInitialPlay:false,speedrun:false,gameAudioRecorded:false,files:clip});
const stage='/mnt/f/Videos/ProjectP-YouTube-Game112-Short-2026-10-26/revision-01/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
const crops=[
 {name:'count-before',source:'media/actual-'+10+'.png',rect:{x:60,y:1020,width:330,height:60}},
 {name:'count-after',source:'media/actual-'+1400+'.png',rect:{x:60,y:1020,width:330,height:60}},
 {name:'promise-lumi',source:'media/actual-'+50+'.png',rect:{x:70,y:420,width:1280,height:88}},
 {name:'promise-ash',source:'media/actual-'+95+'.png',rect:{x:70,y:420,width:1280,height:88}},
 {name:'result-name',source:'media/actual-'+1160+'.png',rect:{x:70,y:474,width:1170,height:68}},
 {name:'journal-memory',source:'media/actual-'+1680+'.png',rect:{x:70,y:422,width:1290,height:85}},
 {name:'cover-game',source:'media/actual-805.png',rect:{x:380,y:500,width:650,height:460}}
];
for(const c of crops){const out=path.join(stage,c.name+'.png');await run(PC,['run',np(file(c.source)),'--cmd','image.crop','--params',JSON.stringify({...c.rect,deleteCroppedPixels:true,contentAware:false}),'--out',np(out),'--format','png'],'pc-crop-'+c.name+'.json');copy(out,file('media/'+c.name+'.png'));c.sourceSha256=hash(file(c.source));c.cropSha256=hash(out);}
save('qa/pixel-crops.json',{software:'PhotoCraft native',recreatedGameUi:false,crops});
save('source/edit.json',{issue:114,parentIssue:106,matchedHorizontalIssue:112,duration:26.2,fps:30,width:1080,height:1920,frames:786,question:'名前を覚えているうちに、迎えに行ける？',gameVersion:'0.12.0',sourceCommit:'71584a6bd0c8852885157de71032fd9252e7a04c',actualInput:'Automated ordinary key/physics capture inherited unmodified from112; no human or RTA claim',gameAudioRecorded:false,model:'Revenant_Natural 2026-10-18',bgm:{issue:108,revision:3,sha256:'4d3bdac03c4bbcd89511ea637265bd13d56e0f11f6b702ca4f01b66af49c50df',usage:'background for game only',bpm:96},cuts:[{a:0,b:3.2,kind:'actual-counts-editorial-comparison'},{a:3.2,b:6.2,kind:'actual-promise-lumi',frame:50},{a:6.2,b:9.4,kind:'actual-promise-ash',frame:95},{a:9.4,b:13.6,kind:'actual-third-forge',sourceFrames:[1010,1136],rate:1},{a:13.6,b:17.4,kind:'actual-result-name-remains',frame:1160},{a:17.4,b:21.8,kind:'actual-journal-first-lost-memory',frame:1680},{a:21.8,b:26.2,kind:'matched-horizontal-cta',frame:1860}],nativeRelatedVideoRequiredBeforePublic:true,musicTopic:false});
console.log('Frozen112 phrases/Core/actual frames copied; seven native PhotoCraft pixel crops created.');
