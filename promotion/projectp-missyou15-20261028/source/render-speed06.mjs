import {file,np,EC,FC,run,parse,save,hash,digest} from './native.mjs';
const tick=254016000000,duration=346/30,ec=file('projects/missyou-speed06.ecproj'),picture=file('media/missyou-speed06-picture.mov');
await run(EC,['--project',np(ec),'info','--json'],'speed06-effectcraft-reopen.json');
await run(EC,['--project',np(ec),'render','--comp','MISSYOU v06 11.53s','--out',np(picture),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'speed06-effectcraft-render.json');
const bindings=[];
for(const id of ['voice','bgm']){
 const project=file('projects/missyou-speed06-'+id+'.fcproj'),output=file('videos/missyou-speed06-'+id+'.mp4'),audios=['narration-speed06.wav','sfx-speed06.wav',...(id==='bgm'?['musicbed-speed06.wav']:[])];
 const first=await run(FC,['--save-as',np(project),'run','-'],'speed06-filmcraft-'+id+'-build.json',[
 {id:'file.newProject',params:{name:'MISSYOU v06 / selected stamp and page'}},{id:'file.newSequence',params:{name:'MISSYOU speed06 '+id,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:audios.length}},
 {id:'file.import',params:{paths:[np(picture),...audios.map(n=>np(file('media/'+n)))]}}
 ].map(j=>JSON.stringify(j)).join('\n')+'\n');
 let items;for(const line of first.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}if(items?.length!==1+audios.length)throw Error('Import mismatch');
 const commands=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*tick,video:true,audio:false}},...audios.map((n,i)=>({id:'timeline.place',params:{item:items[i+1],track:'A'+(i+1),seconds:0,duration:duration*tick,video:false,audio:true}}))];
 await run(FC,['--project',np(project),'--save','run','-'],'speed06-filmcraft-'+id+'-place.json',commands.map(j=>JSON.stringify(j)).join('\n')+'\n');
 await run(FC,['--project',np(project),'inspect'],'speed06-filmcraft-'+id+'-reopen.json');
 const exp=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'speed06-filmcraft-'+id+'-export.json')).stdout);if(exp.offlineMedia?.length)throw Error('Offline media');
 bindings.push({variant:id,video:'videos/missyou-speed06-'+id+'.mp4',sha256:await digest(output),filmcraftSha256:hash(project),audioTracks:audios.map(n=>({file:n,sha256:hash(file('media/'+n))})),offlineMedia:exp.offlineMedia||[]});
}
save('qa/speed06-final-bindings.json',{duration,fps:30,frames:346,size:[1080,1920],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,effectcraftSha256:hash(ec),pictureSha256:await digest(picture),bindings,wholeSubjectiveListen:false,wholeRealtimeWatch:false,published:false});
console.log('v06 final voice/SFX and BGM videos exported through FilmCraft.');
