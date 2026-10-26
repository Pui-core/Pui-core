import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sourceRoot=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const input=process.env.PP111_INPUT||'/mnt/f/Videos/ProjectP-Core-Puzzle-2026-10-26/revision-04-licensed-classic';
const destination=process.env.PP111_ROOT||'/mnt/f/Videos/ProjectP-YouTube-Game-Short-2026-10-26/revision-01';
const music=process.env.PP111_BGM||'/mnt/f/Videos/ProjectP-Original-BGM-2026-10-26/revision-03-native-soundcraft/audio/connecting-lights-short-master.wav';
const digest=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');};
for(const dir of ['source','media','projects','covers','videos','qa'])fs.mkdirSync(path.join(destination,dir),{recursive:true});
const pairs=[['media/core-puzzle-picture.mov','media/game-body-silent.mov'],['media/voice-1.wav','media/voice-1.wav'],['media/voice-2.wav','media/voice-2.wav'],['media/voice-3.wav','media/voice-3.wav'],['media/editorial-sfx.wav','media/editorial-sfx.wav'],['covers/core-puzzle-cover.pcraft','media/source-cover.pcraft']];
const checked=[],manifest=JSON.parse(fs.readFileSync(path.join(input,'qa/licensed-delivery.json')));
for(const [from,to]of pairs){
 const a=path.join(input,from),b=path.join(destination,to);
 if(fs.existsSync(b))throw Error('Input copy already exists; inspect state before continuing: '+to);
 fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);
 const h=await digest(a),copy=await digest(b),entry=manifest.files.find(x=>x.file===from);
 if(h!==copy||(entry&&h!==entry.deliverySha256))throw Error('Source SHA mismatch '+from);
 checked.push({file:to,sourceFile:from,sha256:h,bytes:fs.statSync(b).size,manifestMatch:entry?true:null});
}
if(await digest(music)!=='2387bf313b689b21467cbffb0b17195ff70ab7f4e2fb8c9bf244f85bbd74101d')throw Error('BGM is not the final native SoundCraft source');
fs.copyFileSync(music,path.join(destination,'media/bgm-source.wav'),fs.constants.COPYFILE_EXCL);
checked.push({file:'media/bgm-source.wav',sourceIssue:108,sha256:await digest(path.join(destination,'media/bgm-source.wav')),bytes:fs.statSync(path.join(destination,'media/bgm-source.wav')).size,nativeSoundCraftFinal:true});
for(const f of fs.readdirSync(path.join(sourceRoot,'source'))){const from=path.join(sourceRoot,'source',f),to=path.join(destination,'source',f);if(fs.statSync(from).isFile()&&from!==to)fs.copyFileSync(from,to);}
const model=JSON.parse(fs.readFileSync(path.join(input,'source/model-cues.json'))),binding=JSON.parse(fs.readFileSync(path.join(input,'qa/core-puzzle-voice-no-music-binding.json')));
const reuse={schemaVersion:1,sourceProductionIssue:97,newProductionIssue:111,checkedInputs:checked,sourceSilentBodyBinding:binding,pictureSourceHasAudioStream:false,sourceNativeCoreCueFileSha256:await digest(path.join(input,'source/model-cues.json')),sourceMocSha256:'6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e',introSourceFrame:150,introActualCoreCue:model.frames[150],bodyTimeShiftFrames:24,bodyTimeShiftSeconds:.8,voiceAndSfxTimeShiftSeconds:.8,coreRegenerated:false,licensedMusicCopied:false,inputMediaModified:false};
fs.writeFileSync(path.join(destination,'qa/source-reuse.json'),JSON.stringify(reuse,null,2)+'\n');
console.log(JSON.stringify({inputFiles:checked.length,checked,bodyOffset:.8,oldMusicCopied:false}));
