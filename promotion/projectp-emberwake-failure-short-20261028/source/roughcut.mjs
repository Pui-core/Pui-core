import {file,np,FC,run,parse,save,hash} from './native.mjs';
const tick=254016000000,project=file('projects/emberwake-fall-roughcut.fcproj');
const init=[{id:'file.newProject',params:{name:'EMBERWAKE falling memory ROUGHCUT'}},{id:'file.newSequence',params:{name:'Roughcut raw footage, not final',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(file('media/replay.mp4'))]}}];
const r=await run(FC,['--save-as',np(project),'run','-'],'fc-roughcut-init.json',init.map(x=>JSON.stringify(x)).join('\n')+'\n');let items;for(const line of r.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}if(items?.length!==1)throw Error('Native import ID missing');
const clips=[{at:0,source:6.7,duration:1},{at:1,source:0,duration:1},{at:2,source:7.3,duration:1.8},{at:3.8,source:12.4,duration:2},{at:5.8,source:64.1,duration:.8},{at:6.6,source:13.1,duration:3.4}];
const commands=clips.map(c=>({id:'timeline.place',params:{item:items[0],track:'V1',seconds:c.at,sourceIn:Math.round(c.source*tick),duration:Math.round(c.duration*tick),video:true,audio:false}}));
await run(FC,['--project',np(project),'--save','run','-'],'fc-roughcut-place.json',commands.map(x=>JSON.stringify(x)).join('\n')+'\n');save('qa/fc-roughcut.json',{project:'projects/emberwake-fall-roughcut.fcproj',sha256:hash(project),clips,roughcutOnly:true,rendered:false,audio:false,finalLayout:false,published:false});
console.log('FilmCraft roughcut saved; final motion/picture and audio still pending.');
