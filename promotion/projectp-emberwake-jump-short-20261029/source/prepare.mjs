import fs from 'node:fs';import path from 'node:path';import {stage,ff,save,hash,run,ffRoot,cli,native} from './background.mjs';
export const root=stage+'/jump-v01';
const raw='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04i/media/ep01-replay-controls01-game.mp4';
if(fs.existsSync(root))throw Error('Preserve existing152 package; inspect recorded job');
fs.mkdirSync(root,{recursive:true});for(const d of ['media','source','projects','videos','covers','qa'])fs.mkdirSync(root+'/'+d);
if(hash(raw)!=='c0b94ae3e559809216db5536c13f3ca4c9121fc2dd7b1630c91c2257df78eb86')throw Error('raw differs');
const core='/mnt/f/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29/pv-v01/private/core-closing/natural-silent.mov';
const coreReceipt=JSON.parse(fs.readFileSync('/mnt/f/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29/pv-v01/private/core-closing/qa/core-closing-binding.json','utf8'));
if(hash(core)!==coreReceipt.sha256||coreReceipt.frames!==120||coreReceipt.mouthRange.some(x=>x!==0))throw Error('Known silent Core differs');
fs.copyFileSync(raw,root+'/media/raw-replay.mp4',fs.constants.COPYFILE_EXCL);fs.copyFileSync(core,root+'/media/natural-silent.mov',fs.constants.COPYFILE_EXCL);
const music='/mnt/f/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29/pv-v01/media/Cipher.mp3';if(hash(music)!=='d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522')throw Error('Music differs');fs.copyFileSync(music,root+'/media/Cipher.mp3',fs.constants.COPYFILE_EXCL);
const sourcePlan=[{id:'short',start:176,endExclusive:217,outputFrames:48},{id:'hold',start:394,endExclusive:433,outputFrames:48},{id:'short-detail',start:196,endExclusive:214,outputFrames:24},{id:'hold-detail',start:400,endExclusive:418,outputFrames:24},{id:'landing',start:418,endExclusive:454,outputFrames:36}];
for(const c of sourcePlan){await ff(['-i',raw,'-vf',`trim=start_frame=${c.start}:end_frame=${c.endExclusive},setpts=PTS-STARTPTS,crop=720:650:740:430,tpad=stop_mode=clone:stop_duration=1`,'-frames:v',String(c.outputFrames),'-an','-c:v','prores_ks','-profile:v','2','-pix_fmt','yuv422p10le',root+'/media/'+c.id+'.mov'],root+'/qa/prepare-'+c.id+'.json');}
const inputs={raw:{file:raw,sha256:hash(raw),fps:30,ordinaryInputAutomation:true,gameAudioRecorded:false},core:{file:core,sha256:hash(core),kind:'Reused actual CoreJNI 120-frame silent blink/idle, not newly performed motion or lip-sync',receipt:coreReceipt,selectedSourceSeconds:[.6,2.6]},music:{file:music,sha256:hash(music),title:'Cipher',author:'Kevin MacLeod',license:'CC BY 4.0'},crop:[740,430,720,650],sourcePlan:sourcePlan.map(c=>({...c,motionRate:1,freezeTailFrames:c.outputFrames-(c.endExclusive-c.start)})),scope:'No original overwrite, no new capture, no shared desktop'};
save(root+'/qa/input-binding.json',inputs);
await native('effectcraft',['--empty','commands','--filter','layer.newText','--json'],root+'/qa/ec-known-command.json');
await native('filmcraft',['help'],root+'/qa/fc-help.json');
console.log(JSON.stringify({root,prepared:true,frames:240,seconds:8}));
