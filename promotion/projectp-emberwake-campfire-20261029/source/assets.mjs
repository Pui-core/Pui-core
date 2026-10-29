import fs from 'node:fs';
import {stage,ff,hash,save} from './background.mjs';
const root=stage+'/pv-v01';
const raw='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo05-course-film/media/raw';
const old146='/mnt/f/Videos/ProjectP-EMBERWAKE-DevStory-2026-10-29/devstory-v01/media';
const assets=[
  {id:'jump-city',input:raw+'/demo01-main01.mp4',from:.15,duration:3.3,width:1920,height:1080,kind:'actual 2D game recorded input, cinematic editorial crop; no route demonstration'},
  {id:'wind-leap',input:raw+'/demo02-ferry01.mp4',from:7.9,duration:3.3,width:1920,height:1080,kind:'actual 2D game recorded input; isolated leap crop'},
  {id:'moon-run',input:raw+'/demo03-main01.mp4',from:.15,duration:3.3,width:1920,height:1080,kind:'actual 2D game recorded input; isolated movement crop'},
  {id:'core-floor',input:old146+'/c-new-safe_floor.mp4',from:.10,duration:2.8,width:600,height:450,kind:'actual game safe-floor scripted input fixture, not a puzzle solution'},
  {id:'core-carry',input:old146+'/v-motion-new.mp4',from:.45,duration:.8,width:420,height:390,kind:'actual renderer fixed entrance input fixture, tightly cropped actor motion'}
];
for(const a of assets){a.file=root+'/media/'+a.id+'.mp4';if(fs.existsSync(a.file))throw Error('Existing asset, inspect receipt rather than duplicate '+a.id);a.sourceSha256=hash(a.input);await ff(['-ss',String(a.from),'-i',a.input,'-t',String(a.duration),'-an','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',a.file],root+'/qa/asset-'+a.id+'.json');a.sha256=hash(a.file);}
const cipher='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-05-real-round/media/cipher-source.mp3';
if(hash(cipher)!=='d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522')throw Error('Licensed source differs');
fs.copyFileSync(cipher,root+'/media/Cipher.mp3');
await ff(['-i',root+'/media/Cipher.mp3','-t','65','-ac','2','-ar','48000','-c:a','pcm_f32le',root+'/media/cipher-analysis.wav'],root+'/qa/cipher-analysis.json');
save(root+'/source-assets.json',{issue:151,assets,music:{title:'Cipher',author:'Kevin MacLeod',license:'CC BY 4.0',url:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100844',originalSha256:hash(cipher),file:root+'/media/Cipher.mp3'},originalGameAudio:false,imageGeneration:false,worldStoryEndingOrPuzzleSequence:'excluded by selected crop, final output review still required'});
