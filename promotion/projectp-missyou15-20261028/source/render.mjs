import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const tick=254016000000,duration=13.2;
const ec=file('projects/missyou15.ecproj'),master=file('media/missyou15-picture.mov');
await run(EC,['--project',np(ec),'render','--comp','missyou15 preview 13.2s','--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-full-render.json');
const project=file('projects/missyou15.fcproj');
const first=await run(FC,['--save-as',np(project),'run','-'],'filmcraft-build.json',[
{id:'file.newProject',params:{name:'MISSYOU 1.5 / preview'}},
{id:'file.newSequence',params:{name:'MISSYOU 1.5 / voice preview 13.2s',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},
{id:'file.import',params:{paths:[np(master),np(file('media/narration.wav'))]}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}
if(items?.length!==2)throw Error('FilmCraft failed to import picture and voice');
await run(FC,['--project',np(project),'--save','run','-'],'filmcraft-place.json',[
{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*tick,video:true,audio:false}},
{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:duration*tick,video:false,audio:true}}
].map(j=>JSON.stringify(j)).join('\n')+'\n');
const output=file('videos/missyou15-preview-voice.mp4');
const exported=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export.json')).stdout);
if(exported.offlineMedia?.length)throw Error('FilmCraft exported offline media');
save('qa/render-binding.json',{video:'videos/missyou15-preview-voice.mp4',videoSha256:await digest(output),pictureSha256:await digest(master),effectcraftSha256:hash(ec),filmcraftSha256:hash(project),voiceSha256:hash(file('media/narration.wav')),duration,fps:30,size:[1080,1920],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,offlineMedia:exported.offlineMedia||[],wholeDirectWatch:false,wholeSubjectiveListen:false,published:false});
console.log('EffectCraft picture and FilmCraft voice preview exported');
