import fs from 'node:fs';
import {file,np,EC,FC,run,parse,hash,digest,save} from './native.mjs';
import {duration,narrationHash,sfxHash} from './common.mjs';
const tick=254016000000,comp='TruthOrLie real vote v10 19.2s',ec=file('projects/truthorlie-real-v10.ecproj'),picture=file('media/truthorlie-real-v10-picture.mov');
if(hash(file('media/narration-real-v9.wav'))!==narrationHash||hash(file('media/sfx-real-v9.wav'))!==sfxHash)throw Error('Original voice/SFX binding changed');
if(fs.existsSync(ec)||fs.existsSync(picture))throw Error('Existing render retained');
await run(EC,['--empty','script',np(file('source/composition-v10.jsx')),'--save-as',np(ec),'--json'],'effectcraft-build-native.json');
await run(EC,['--project',np(ec),'info','--json'],'effectcraft-reopen-native.json');
await run(EC,['--project',np(ec),'render','--comp',comp,'--out',np(picture),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-render.json');
const project=file('projects/truthorlie-real-v10-voice.fcproj'),video=file('videos/truthorlie-real-v10-voice.mp4'),audios=['narration-real-v9.wav','sfx-real-v9.wav'];
const first=await run(FC,['--save-as',np(project),'run','-'],'filmcraft-build-native.json',[
 {id:'file.newProject',params:{name:'TruthOrLie / real vote / Natural Core v10'}},
 {id:'file.newSequence',params:{name:'TruthOrLie real v10 voice',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:2}},
 {id:'file.import',params:{paths:[np(picture),...audios.map(n=>np(file('media/'+n)))]}}
].map(c=>JSON.stringify(c)).join('\n')+'\n');
let items;for(const line of first.stdout.trim().split(/\r?\n/)){const r=parse(line);if(r.ok===false)throw Error(line);if(r.result?.items)items=r.result.items;}
if(items?.length!==3)throw Error('Expected one picture plus original narration/SFX');
const commands=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*tick,video:true,audio:false}},...audios.map((n,i)=>({id:'timeline.place',params:{item:items[i+1],track:'A'+(i+1),seconds:0,duration:duration*tick,video:false,audio:true}}))];
await run(FC,['--project',np(project),'--save','run','-'],'filmcraft-place-native.json',commands.map(c=>JSON.stringify(c)).join('\n')+'\n');
await run(FC,['--project',np(project),'inspect'],'filmcraft-reopen-native.json');
const result=parse((await run(FC,['--project',np(project),'exec','file.exportMedia',JSON.stringify({path:np(video),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'filmcraft-export.json')).stdout);
if(result.offlineMedia?.length)throw Error('Offline media on export');
save('qa/render-binding.json',{issue:143,duration,frames:576,fps:30,size:[1080,1920],nativeEffectCraftRendered:true,nativeFilmCraftExported:true,effectcraftSha256:hash(ec),filmcraftSha256:hash(project),pictureSha256:await digest(picture),videoSha256:await digest(video),modelVideoSha256:hash(file('media/natural-rms-v10.mov')),sourceTimeRemap:{comp:[16.8,19.2],source:[0,2.4],frames:72},audioTracks:audios.map(n=>({file:n,sha256:hash(file('media/'+n))})),offlineMedia:result.offlineMedia||[],nativeMusicSelected:false,subjectiveListen:false,published:false});
console.log(JSON.stringify({video,frames:576,offline:result.offlineMedia||[]}));
