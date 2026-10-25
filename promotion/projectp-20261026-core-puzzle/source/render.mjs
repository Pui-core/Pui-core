import fs from 'node:fs';import {file,np,EC,FC,run,save,parse,hash}from'./native.mjs';
const e=JSON.parse(fs.readFileSync(file('source/edit.json'),'utf8')),tick=254016000000,master=file('media/core-puzzle-picture.mov');
await run(EC,['--project',np(file('projects/core-puzzle.ecproj')),'render','--comp','ProjectP Core Puzzle','--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-render.json');
const masterSha=hash(master),ecSha=hash(file('projects/core-puzzle.ecproj'));
for(const[name,mix]of [['core-puzzle-voice-no-music','voice-sfx-no-music.wav'],['core-puzzle-sfx-only','editorial-sfx.wav'],['core-puzzle-voice-original-score','voice-sfx-original-score.wav']]){
 const project=file('projects/'+name+'.fcproj'),first=await run(FC,['--save-as',np(project),'run','-'],name+'-build.json',[
 {id:'file.newProject',params:{name:'ProjectP core puzzle / '+name}},{id:'file.newSequence',params:{name:'Core puzzle20 seconds',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(master),np(file('media/'+mix))]}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');let items;for(const l of first.stdout.trim().split(/\r?\n/)){const j=parse(l);if(j.ok===false)throw Error(l);if(j.result?.items)items=j.result.items;}if(items?.length!==2)throw Error('Imported media missing');
 await run(FC,['--project',np(project),'--save','run','-'],name+'-place.json',[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:e.duration*tick,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:e.duration*tick,video:false,audio:true}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');
 const exported=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(file('videos/'+name+'.mp4')),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],name+'-export.json')).stdout);if(exported.offlineMedia?.length)throw Error('Offline export');save('qa/'+name+'-binding.json',{videoSha256:hash(file('videos/'+name+'.mp4')),effectcraftSha256:ecSha,filmcraftSha256:hash(project),masterSha256:masterSha,mixSha256:hash(file('media/'+mix)),music:name.includes('original-score')?'OWNED_ORIGINAL_SCORE_NOT_POPULAR':false,state:'PROVISIONAL_PENDING_ACTUAL_POPULAR_SOUND_AND_NEW_MODEL_UI'});
}
console.log('Actual provisional MP4s rendered');
