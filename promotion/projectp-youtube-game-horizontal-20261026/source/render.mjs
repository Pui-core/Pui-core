import fs from 'node:fs';
import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'),'utf8')),tick=254016000000;
const ec=file('projects/first-forgetting.ecproj'),master=file('media/first-forgetting-picture.mov');
await run(EC,['--project',np(ec),'render','--comp','EMBERWAKE First Forgetting','--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-full-render.json');
const pictureSha256=await digest(master);
const project=file('projects/first-forgetting.fcproj');
const first=await run(FC,['--save-as',np(project),'run','-'],'filmcraft-build.json',[
 {id:'file.newProject',params:{name:'EMBERWAKE / first forgetting / actual episode1'}},
 {id:'file.newSequence',params:{name:'First forgetting82s',width:1920,height:1080,fps:30,sampleRate:48000,video:1,audio:2}},
 {id:'file.import',params:{paths:[np(master),np(file('media/narration-stem.wav')),np(file('media/background-stem.wav'))]}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}
if(items?.length!==3)throw Error('FilmCraft did not import the picture and both separate audio stems');
await run(FC,['--project',np(project),'--save','run','-'],'filmcraft-place.json',[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:edit.duration*tick,video:true,audio:false}},
 {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:edit.duration*tick,video:false,audio:true}},
 {id:'timeline.place',params:{item:items[2],track:'A2',seconds:0,duration:edit.duration*tick,video:false,audio:true}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
const output=file('videos/emberwake-first-forgetting.mp4');
const exported=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export.json')).stdout);
if(exported.offlineMedia?.length)throw Error('FilmCraft exported offline media');
save('qa/render-binding.json',{video:'videos/emberwake-first-forgetting.mp4',videoSha256:await digest(output),pictureSha256,effectcraftSha256:hash(ec),filmcraftSha256:hash(project),voiceSha256:hash(file('media/narration-stem.wav')),backgroundSha256:hash(file('media/background-stem.wav')),duration:edit.duration,fps:30,size:[1920,1080],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,offlineMedia:exported.offlineMedia||[],wholeDirectWatch:false,wholeSubjectiveListen:false,published:false});
console.log('82second actual EffectCraft picture / FilmCraft three-track MP4 complete');
