import fs from 'node:fs';import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'))),tick=254016000000;
if(fs.existsSync(file('qa/editorial-direction.json'))&&JSON.parse(fs.readFileSync(file('qa/editorial-direction.json'))).sequential661FullRenderHold)throw Error('Sequential661 draft is superseded by owner quality correction; review jetcut sample before a newly authored formal edit');
if(edit.meaningfulUniqueSeconds<600||edit.status!=='MEASURED_UNIQUE_FOOTAGE_GE600_PENDING_FINAL_RENDER')throw Error('No unmeasured/short plan may render as formal longform');
const ec=file('projects/emberwake-longform.ecproj'),picture=file('media/emberwake-longform-picture.mov');
if(fs.existsSync(picture))throw Error('Existing rendered picture retained; use explicit revision for repair');
await run(EC,['--project',np(ec),'render','--comp','EMBERWAKE Formal Longform','--out',np(picture),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-full-render.json');
const project=file('projects/emberwake-longform.fcproj');
const first=await run(FC,['--save-as',np(project),'run','-'],'filmcraft-build.json',[
{id:'file.newProject',params:{name:'EMBERWAKE / formal longform / actual production0.12.0'}},
{id:'file.newSequence',params:{name:'Measured actual-game longform',width:1920,height:1080,fps:30,sampleRate:48000,video:1,audio:2}},
{id:'file.import',params:{paths:[np(picture),np(file('media/narration-stem.wav')),np(file('media/background-stem.wav'))]}}
].map(x=>JSON.stringify(x)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const d=parse(line);if(d.ok===false)throw Error(line);if(d.result?.items)items=d.result.items;}if(items?.length!==3)throw Error('FilmCraft imports did not produce picture and2stems');
await run(FC,['--project',np(project),'--save','run','-'],'filmcraft-place.json',[
{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:edit.duration*tick,video:true,audio:false}},
{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:edit.duration*tick,video:false,audio:true}},
{id:'timeline.place',params:{item:items[2],track:'A2',seconds:0,duration:edit.duration*tick,video:false,audio:true}}
].map(x=>JSON.stringify(x)).join('\n')+'\n');
const output=file('videos/emberwake-formal-longform.mp4');
const result=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export.json')).stdout);
if(result.offlineMedia?.length)throw Error('FilmCraft export had offline media');
save('qa/render-binding.json',{video:'videos/emberwake-formal-longform.mp4',videoSha256:await digest(output),pictureSha256:await digest(picture),effectcraftSha256:hash(ec),filmcraftSha256:hash(project),voiceSha256:hash(file('media/narration-stem.wav')),backgroundSha256:hash(file('media/background-stem.wav')),duration:edit.duration,meaningfulUniqueSeconds:edit.meaningfulUniqueSeconds,frames:edit.frames,fps:30,size:[1920,1080],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,offlineMedia:result.offlineMedia||[],wholeDirectWatch:false,wholeSubjectiveListen:false,published:false});
console.log(JSON.stringify({nativeRenderAndExport:true,seconds:edit.duration,meaningfulSeconds:edit.meaningfulUniqueSeconds,frames:edit.frames}));
