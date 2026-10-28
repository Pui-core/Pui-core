import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const tick=254016000000,duration=404/30;
const ec=file('projects/missyou-final05.ecproj'),master=file('media/missyou-story05-picture.mov');
await run(EC,['--project',np(ec),'info','--json'],'story05-effectcraft-reopen.json');
await run(EC,['--project',np(ec),'render','--comp','MISSYOU final 13.47s','--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'story05-effectcraft-render.json');
const bindings=[];
for(const variant of [{id:'voice',audio:'narration-story05-kurono.wav'},{id:'bgm',audio:'mix-story05-kurono-daybreak.wav'}]){
 const project=file(`projects/missyou-story05-${variant.id}.fcproj`),output=file(`videos/missyou-story05-${variant.id}.mp4`);
 const first=await run(FC,['--save-as',np(project),'run','-'],`story05-filmcraft-${variant.id}-build.json`,[
 {id:'file.newProject',params:{name:'MISSYOU / actual diary example'}},
 {id:'file.newSequence',params:{name:'MISSYOU story05 '+variant.id,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},
 {id:'file.import',params:{paths:[np(master),np(file('media/'+variant.audio))]}}
 ].map(j=>JSON.stringify(j)).join('\n')+'\n');
 let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}
 if(items?.length!==2)throw Error('FilmCraft failed to import both sources');
 await run(FC,['--project',np(project),'--save','run','-'],`story05-filmcraft-${variant.id}-place.json`,[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*tick,video:true,audio:false}},
 {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:duration*tick,video:false,audio:true}}
 ].map(j=>JSON.stringify(j)).join('\n')+'\n');
 await run(FC,['--project',np(project),'inspect'],`story05-filmcraft-${variant.id}-reopen.json`);
 const exported=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],`story05-filmcraft-${variant.id}-export.json`)).stdout);
 if(exported.offlineMedia?.length)throw Error('FilmCraft exported offline media');
 bindings.push({variant:variant.id,video:`videos/missyou-story05-${variant.id}.mp4`,sha256:await digest(output),filmcraftSha256:hash(project),audio:variant.audio,audioSha256:hash(file('media/'+variant.audio)),offlineMedia:exported.offlineMedia||[]});
}
save('qa/story05-final-bindings.json',{duration,fps:30,size:[1080,1920],speaker:'VOICEVOX:玄野武宏',pictureSha256:await digest(master),effectcraftSha256:hash(ec),nativeEffectCraftRendered:true,nativeFilmCraftExported:true,wholeDirectWatch:false,wholeSubjectiveListen:false,published:false,bindings});
console.log('Voice-only and BGM final videos exported through native Craft apps.');
