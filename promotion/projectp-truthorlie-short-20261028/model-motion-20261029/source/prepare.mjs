import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {file,np,hash,save} from './native.mjs';
import {stage,baseline,retainedCopy,narrationHash,sfxHash} from './common.mjs';
const code=path.dirname(fileURLToPath(import.meta.url));
function copyTree(a,b){fs.mkdirSync(b,{recursive:true});for(const x of fs.readdirSync(a,{withFileTypes:true})){if(['classes','composition-v10.jsx','photo-v10.mjs','model-cues.json','model-schedule.csv','diagnostic.csv'].includes(x.name))continue;const src=path.join(a,x.name),dst=path.join(b,x.name);if(x.isDirectory())copyTree(src,dst);else if(path.resolve(src)!==path.resolve(dst))retainedCopy(src,dst);}}
copyTree(code,file('source'));
const original=fs.readFileSync(path.join(code,'baseline/composition-real-v9.jsx'),'utf8');
if(hash(path.join(baseline,'media/narration-real-v9.wav'))!==narrationHash||hash(path.join(baseline,'media/sfx-real-v9.wav'))!==sfxHash)throw Error('Frozen narration/SFX differs');
const assetPaths=JSON.parse(original.match(/var E=(\[.*?\]),S=/s)?.[1]||'null');if(!assetPaths||assetPaths.length!==15)throw Error('Original real-v9 asset list changed');
const assets=[];
for(const win of new Set(assetPaths)){const name=path.basename(win.replaceAll('\\','/'));if(name==='natural-still.png')continue;const src=path.join(baseline,'media',name),dst=file('media/'+name);retainedCopy(src,dst);assets.push({file:'media/'+name,sha256:hash(dst)});}
const binding=JSON.parse(fs.readFileSync(path.join(code,'baseline/audio-binding.json')));
for(const name of ['narration-real-v9.wav','sfx-real-v9.wav',...binding.cues.map(c=>c.file)]){const src=path.join(baseline,'media',name);retainedCopy(src,file('media/'+name));assets.push({file:'media/'+name,sha256:hash(src)});}
retainedCopy(path.join(baseline,'covers/truthorlie-real-v9.pcraft'),file('covers/truthorlie-real-v9.pcraft'));
let composition=original.replaceAll(JSON.stringify(np(baseline)).slice(1,-1),JSON.stringify(np(stage)).slice(1,-1));
composition=composition.replaceAll('natural-still.png','natural-rms-v10.mov').replaceAll('TruthOrLie real vote v9 19.2s','TruthOrLie real vote v10 19.2s').replaceAll('Truth or Lie v9 / one real recorded vote','Truth or Lie v10 / same recorded vote and Core portrait');
if(!composition.includes('Natural / static editorial portrait, no lip sync'))throw Error('Expected original portrait layer missing');
composition=composition.replace('Natural / static editorial portrait, no lip sync','Natural / 72 true Core frames, speech RMS').replace("natural:'Static portrait only; no source voice-video timing reused.'","natural:'72 official Core updates at30fps; current narration RMS, procedural blink/head; no tracking.'");
const hostSwitch="r('layer.setSwitch',{layers:[host],switch:'motionBlur',value:true});";
if(composition.split(hostSwitch).length!==2)throw Error('Expected unique Natural host switch');
composition=composition.replace(hostSwitch,hostSwitch+"r('layer.enableTimeRemap',{layers:[host],value:true});key(host,'timeRemap',16.8,0);key(host,'timeRemap',19.2,2.4);");
fs.writeFileSync(file('source/composition-v10.jsx'),composition,{flag:'wx'});
const photo=fs.readFileSync(path.join(code,'baseline/photo-real-v9.mjs'),'utf8').replaceAll("'./native.mjs'","'./native.mjs'").replaceAll('truthorlie-real-v9','truthorlie-real-v10').replaceAll('real-v9-photo','real-v10-photo').replaceAll('v9 cover','v10 cover');
fs.writeFileSync(file('source/photo-v10.mjs'),photo,{flag:'wx'});
save('qa/baseline-binding.json',{issue:143,sourceIssue:134,sourcePr:'https://github.com/Pui-core/Pui-core/pull/67',sourceIsUnmergedReadOnly:true,duration:19.2,frames:576,sourceNarrationSha256:narrationHash,sourceSfxSha256:sfxHash,sourceCompositionSha256:hash(path.join(code,'baseline/composition-real-v9.jsx')),assets,modifiedRegionSeconds:[16.8,19.2],modifiedRegionFrames:[504,576],newSpeechGenerated:false,oldStageModified:false,guiActions:0,published:false});
console.log(JSON.stringify({stage,retainedAssets:assets.length,unchangedNarration:true,unchangedSfx:true,frames:576,modelFrames:72}));
