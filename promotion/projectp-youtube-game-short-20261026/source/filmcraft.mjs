import {file,np,FC,run,save,parse,hash} from './native.mjs';
const p=file('projects/game-short.fcproj'),duration=20.8,tick=254016000000;
const jsonl=a=>a.map(x=>JSON.stringify(x)).join('\n')+'\n';
const built=await run(FC,['--save-as',np(p),'run','-'],'filmcraft-build.json',jsonl([
 {id:'file.newProject',params:{name:'ProjectP / actual game question / YouTube Short'}},
 {id:'file.newSequence',params:{name:'Actual game / 20.8 seconds',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:2}},
 {id:'file.import',params:{paths:['media/game-short-picture.mov','media/voice-sfx.wav','media/music-bed.wav'].map(x=>np(file(x)))}}
]));
let items;for(const line of built.stdout.trim().split(/\r?\n/)){const j=parse(line);if(j.ok===false)throw Error(line);if(j.result?.items)items=j.result.items;}if(items?.length!==3)throw Error('Three imported role files required');
await run(FC,['--project',np(p),'--save','run','-'],'filmcraft-place.json',jsonl(items.map((item,i)=>({id:'timeline.place',params:{item,track:['V1','A1','A2'][i],seconds:0,duration:duration*tick,video:i===0,audio:i!==0}}))));
const media=parse((await run(FC,['--project',np(p),'exec','media.status'],'filmcraft-reopen-media.json')).stdout);if(media.length!==3||media.some(x=>x.status!=='online'))throw Error('Offline FilmCraft media');
await run(FC,['--project',np(p),'--save','render','--seconds','5.6','--out',np(file('qa/filmcraft-reopened-5.6.png'))],'filmcraft-reopen-render.json');
const video=file('videos/game-short.mp4');
const result=parse((await run(FC,['--project',np(p),'exec','file.exportMedia',JSON.stringify({path:np(video),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export.json')).stdout);
if(result.offlineMedia?.length)throw Error('Offline export');
save('qa/native-master-binding.json',{videoSha256:hash(video),effectcraftSha256:hash(file('projects/game-short.ecproj')),filmcraftSha256:hash(p),pictureSha256:hash(file('media/game-short-picture.mov')),voiceFxSha256:hash(file('media/voice-sfx.wav')),musicBedSha256:hash(file('media/music-bed.wav')),referenceMixSha256:hash(file('media/reference-mix.wav')),coverSha256:hash(file('covers/game-short-cover.png')),nativeMediaOnline:media.map(x=>x.status),audioTracks:{A1:'independent original voice and editorial SFX, +0.8 s, no fades',A2:'private original SoundCraft 108 source final; music-only duck and tail fade'},musicTopic:false,published:false,directSubjectiveAudition:false});
