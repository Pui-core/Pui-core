import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=process.env.PROJECTP_DELIVERY||'/mnt/f/Videos/ProjectP-TikTok-Launch-2026-10-25';
const stage='/mnt/c/Users/pui/AppData/Local/Temp/projectp-94-tiktok-safe-cover';
const pc='/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function execute(exe,args){for(let attempt=0;attempt<3;attempt++){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:5*1024*1024,timeout:60000});if(!r.error&&r.status===0)return r.stdout;if(attempt<2&&/UtilAcceptVsock.*accept4 failed/.test(r.stderr))continue;throw Error(JSON.stringify({args,error:r.error?.message,exit:r.status,stderr:r.stderr}));}}
const np=p=>execute('wslpath',['-w',path.resolve(p)]).trim(),receipts=[];
function run(args){const stdout=execute(pc,args);receipts.push({args,exit:0,stdout});return stdout;}
function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);if(hash(a)!==hash(b))throw Error('Copy mismatch');}
function info(p){return JSON.parse(run(['info',np(p),'--compact']));}
fs.mkdirSync(stage,{recursive:true});
const old=path.join(root,'covers/emberwake-cover.pcraft'),oldPng=path.join(root,'covers/emberwake-cover.png');
const before={native:hash(old),png:hash(oldPng)};
const original=info(old),id=name=>{const matches=original.layers.filter(x=>x.name===name);if(matches.length!==1)throw Error('Ambiguous layer '+name);return matches[0].id;};
const commands=[
 ['shape.edit',{layer:id('Lower caption field'),rect:[0,1430,1080,490]}],
 ['type.edit',{layer:id('Game title'),point:[94,1515]}],
 ['type.edit',{layer:id('Game subtitle'),point:[98,1590]}],
 ['type.edit',{layer:id('Author'),move:[0,24]}],
 ['layer.delete',{layer:id('Source disclosure')}]
];
const native=path.join(stage,'emberwake-cover-tiktok-safe.pcraft'),png=path.join(stage,'emberwake-cover-tiktok-safe.png');
const args=['run',np(old)];for(const[c,p]of commands)args.push('--cmd',c,'--params',JSON.stringify(p));args.push('--out',np(native));run(args);
run(['convert',np(native),np(png),'--format','png']);
const newInfo=info(native),typeLayers=newInfo.layers.filter(x=>x.kind==='Type'&&x.visible);
const bounds=typeLayers.map(x=>({name:x.name,text:x.text.text,bounds:x.bounds}));
if(newInfo.warnings.length||newInfo.width!==1080||newInfo.height!==1920||typeLayers.length!==6||bounds.some(x=>x.bounds[1]<240||x.bounds[1]+x.bounds[3]>1640||x.bounds[0]<0||x.bounds[0]+x.bounds[2]>1080))throw Error('Essential text outside TikTok safe area');
const crop=path.join(stage,'cover-safe-center-3x4.png');
run(['run',np(png),'--cmd','image.crop','--params',JSON.stringify({x:0,y:240,width:1080,height:1440,deleteCroppedPixels:true,contentAware:false}),'--out',np(crop),'--format','png']);
for(const[a,b]of [[native,'covers/emberwake-cover-tiktok-safe.pcraft'],[png,'covers/emberwake-cover-tiktok-safe.png'],[crop,'qa/cover-safe-center-3x4.png']]){copy(a,path.join(root,b));copy(a,path.join(dest,b));}
const dn=path.join(dest,'covers/emberwake-cover-tiktok-safe.pcraft'),reopened=path.join(stage,'safe-delivery-reopened.pcraft'),reexport=path.join(stage,'safe-delivery-reopened.png');
run(['run',np(dn),'--out',np(reopened)]);run(['convert',np(reopened),np(reexport),'--format','png']);
if(hash(reexport)!==hash(png))throw Error('Delivery native pixels differ');
const evidence=process.env.PROJECTP_COVER_BEFORE_SCREENSHOT;
let evidenceSha256=null;if(evidence){const cropped=path.join(stage,'tiktok-before-cover-crop.png');execute(pc,['run',np(evidence),'--cmd','image.crop','--params',JSON.stringify({x:827,y:188,width:309,height:417,deleteCroppedPixels:true,contentAware:false}),'--out',np(cropped),'--format','png']);copy(cropped,path.join(root,'qa/tiktok-before-cover-crop.png'));copy(cropped,path.join(dest,'qa/tiktok-before-cover-crop.png'));evidenceSha256=hash(cropped);}
if(before.native!==hash(old)||before.png!==hash(oldPng))throw Error('Old cover changed');
const videos=['emberwake-voice-sfx-no-music','emberwake-sfx-only','emberwake-picture-silent'].map(n=>{const rel='videos/'+n+'.mp4';if(hash(path.join(root,rel))!==hash(path.join(dest,rel)))throw Error('Existing video differs');return{file:rel,sha256:hash(path.join(root,rel)),changed:false};});
const report={status:'PASS_NATIVE_ROUNDTRIP_AND_CENTER_3X4_TEXT_BOUNDS',issue:94,fix:'Native TikTok profile crop cut the old orange subtitle; safe version moves footer and author inward and omits redundant small footer disclosure.',dimensions:[1080,1920],centerCrop:{x:0,y:240,width:1080,height:1440},requiredTextVerticalRange:[240,1640],text:bounds,sourceScreenshot:'CTO actual TikTok cover editor, only cover image region retained',beforeEvidenceSha256:evidenceSha256,sourceCoverPreserved:before,newCover:{file:'covers/emberwake-cover-tiktok-safe.png',sha256:hash(png),nativeFile:'covers/emberwake-cover-tiktok-safe.pcraft',nativeSha256:hash(native)},nativeReopenedFromDelivery:true,nativeReexportIdentical:true,noGenerativeImageProcessing:true,videos,receipts,scope:{directCoverImageViewed:false,actualNewTikTokPreview:false,videoOrAudioEdited:false,publication:false}};
for(const base of [root,dest]){fs.writeFileSync(path.join(base,'qa/cover-tiktok-safe.json'),JSON.stringify(report,null,2)+'\n');const target=path.join(base,'source/make-safe-cover.mjs');if(path.resolve(target)!==fileURLToPath(import.meta.url))fs.copyFileSync(fileURLToPath(import.meta.url),target);}
console.log(JSON.stringify({file:path.join(dest,report.newCover.file),sha256:report.newCover.sha256,bounds},null,2));
