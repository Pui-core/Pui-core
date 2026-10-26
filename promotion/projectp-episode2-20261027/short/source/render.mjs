import fs from 'node:fs';
import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const platform=process.env.PROJECTP_SHORT_PLATFORM||'youtube';if(!['youtube','tiktok'].includes(platform))throw Error('Unsupported platform');const suffix=platform==='youtube'?'':'-tiktok';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'),'utf8')),tick=254016000000;
const ec=file('projects/episode2-short'+suffix+'.ecproj'),master=file('media/episode2-short-picture'+suffix+'.mov');
await run(EC,['--project',np(ec),'render','--comp','EMBERWAKE Episode2 Matched Short','--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-full-render'+suffix+'.json');
const pictureSha256=await digest(master);
const project=file('projects/episode2-short'+suffix+'.fcproj');
const first=await run(FC,['--save-as',np(project),'run','-'],'filmcraft-build'+suffix+'.json',[
 {id:'file.newProject',params:{name:'EMBERWAKE / episode2 / actual shortcut'}},
 {id:'file.newSequence',params:{name:'Episode2 Short27.5s',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:2}},
 {id:'file.import',params:{paths:[np(master),np(file('media/narration-stem.wav')),np(file('media/background-stem.wav'))]}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}
if(items?.length!==3)throw Error('FilmCraft did not import the picture and both separate audio stems');
await run(FC,['--project',np(project),'--save','run','-'],'filmcraft-place'+suffix+'.json',[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:edit.duration*tick,video:true,audio:false}},
 {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:edit.duration*tick,video:false,audio:true}},
 {id:'timeline.place',params:{item:items[2],track:'A2',seconds:0,duration:edit.duration*tick,video:false,audio:true}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
const output=file('videos/episode2-short'+suffix+'.mp4');
const exported=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export'+suffix+'.json')).stdout);
if(exported.offlineMedia?.length)throw Error('FilmCraft exported offline media');
save('qa/render-binding'+suffix+'.json',{video:'videos/episode2-short'+suffix+'.mp4',platform,videoSha256:await digest(output),pictureSha256,effectcraftSha256:hash(ec),filmcraftSha256:hash(project),voiceSha256:hash(file('media/narration-stem.wav')),backgroundSha256:hash(file('media/background-stem.wav')),duration:edit.duration,fps:30,size:[1080,1920],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,offlineMedia:exported.offlineMedia||[],wholeDirectWatch:false,wholeSubjectiveListen:false,published:false});
console.log('27.5second actual EffectCraft picture / FilmCraft three-track MP4 complete');
