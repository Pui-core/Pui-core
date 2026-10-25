import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';
const idOf=e=>e.id+'-'+e.slug;
const DEFAULT_DEST='/mnt/f/Videos/ProjectP-EMBERWAKE-60秒-2026-10-25';
export async function packageBundle(destination=DEFAULT_DEST){
 const {root,np,hash,run,readText}=await import('./native.mjs');
 const {composition}=await import('./produce.mjs');
 const {verifyEpisode}=await import('./verify.mjs');
 if(episodes.length!==1||idOf(episodes[0])!=='01-emberwake-campfire-60')throw Error('This native bridge is scoped to EMBERWAKE60');
 const e=episodes[0],id=idOf(e),dest=path.resolve(destination),sourceReal=fs.realpathSync(root);
 function realTarget(p){let ancestor=p;const tail=[];while(!fs.existsSync(ancestor)){const parent=path.dirname(ancestor);if(parent===ancestor)throw Error('No existing destination ancestor');tail.unshift(path.basename(ancestor));ancestor=parent;}return path.join(fs.realpathSync(ancestor),...tail);}
 const destinationReal=realTarget(dest);
 const comparable=p=>/^\/mnt\/[a-z](?:\/|$)/i.test(p)?p.toLowerCase():p;
 const atOrUnder=(target,base)=>comparable(target)===comparable(base)||comparable(target).startsWith(comparable(base)+path.sep);
 const reserved=['/mnt/f/Videos/ProjectP-初投稿-2026-10-25','/mnt/f/Videos/ぷい本人プロモ5本-2026-10-24','/mnt/f/Videos/ぷい本人プロモ5本-V2-2026-10-24','/home/pui/Videos/Pui-Promo/2026-10-24/creator-five','/home/pui/Videos/Pui-Promo/2026-10-24/creator-five-v2'];
 if(atOrUnder(destinationReal,sourceReal)||atOrUnder(sourceReal,destinationReal)||reserved.some(p=>[p,realTarget(p)].some(base=>[dest,destinationReal].some(target=>atOrUnder(target,base)))))throw Error('Destination must be separate; prior productions are reserved');
 // Accept either the original render binding or a verified relocated binding.
 // Never certify an edited native project against an old MP4.
 const sourceBinding=await verifyEpisode(e,{integrityOnly:true});
 const json=p=>JSON.parse(readText(p).replace(/^\uFEFF/,''));
 const copies=[],backupRoot=path.join(dest,'prior-package-'+Date.now());
 function copyBytes(a,b){
  const temp=b+'.copy-'+process.pid,buffer=Buffer.allocUnsafe(64*1024);let rd,wr,created=false;
  try{rd=fs.openSync(a,'r');wr=fs.openSync(temp,'wx');created=true;let n;
   while((n=fs.readSync(rd,buffer,0,buffer.length,null))>0){let at=0;while(at<n)at+=fs.writeSync(wr,buffer,at,n-at,null);}
   fs.closeSync(rd);rd=undefined;fs.closeSync(wr);wr=undefined;fs.renameSync(temp,b);created=false;
  }finally{if(rd!==undefined)fs.closeSync(rd);if(wr!==undefined)fs.closeSync(wr);if(created&&fs.existsSync(temp))fs.unlinkSync(temp);}
 }
 function copy(a,b){const sha=hash(a);if(fs.existsSync(b)&&hash(b)===sha){copies.push({file:path.relative(dest,b),sha256:sha,existingIdentical:true});return;}
  if(fs.existsSync(b)){const backup=path.join(backupRoot,path.relative(dest,b));fs.mkdirSync(path.dirname(backup),{recursive:true});copyBytes(b,backup);}
  copyBytes(a,b);if(hash(b)!==sha)throw Error('Copy differs '+b);copies.push({file:path.relative(dest,b),sha256:sha,bytes:fs.statSync(b).size});}
 function tree(a,b){fs.mkdirSync(b,{recursive:true});for(const entry of fs.readdirSync(a,{withFileTypes:true})){if(['checkpoints','research'].includes(entry.name)||entry.name.startsWith('prior-package-'))continue;const x=path.join(a,entry.name),y=path.join(b,entry.name);if(entry.isDirectory())tree(x,y);else if(entry.isFile())copy(x,y);}}
 tree(root,dest);
 const boundFiles=[['projects/'+id+'.ecproj',sourceBinding.effectcraftSha256],['projects/'+id+'.fcproj',sourceBinding.filmcraftSha256],['videos/'+id+'.mp4',sourceBinding.videoSha256],['media/'+e.mix,sourceBinding.audioSha256],['media/'+id+'-master.mov',sourceBinding.masterSha256]];
 for(const [relative,expected]of boundFiles)if(hash(path.join(dest,relative))!==expected||hash(path.join(root,relative))!==expected)throw Error('Source/copy changed since render binding: '+relative);
 const roots=[[np(root),np(dest)],[root,dest]];
 function relocate(v){if(typeof v==='string'){for(const[a,b]of roots)if(v===a||v.startsWith(a+'\\')||v.startsWith(a+'/'))return b+v.slice(a.length);return v;}if(Array.isArray(v))return v.map(relocate);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relocate(x)]));return v;}
 for(const ext of ['ecproj','fcproj']){const p=path.join(dest,'projects',id+'.'+ext);fs.writeFileSync(p,JSON.stringify(relocate(json(p)))+'\n');}
 fs.writeFileSync(path.join(dest,'source',id+'.jsx'),composition(dest,e));
 // Launch Windows once; all six native children run on Windows. This avoids
 // six separate WSL interop handshakes when the host is under memory pressure.
 const shell='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
 await run(shell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',np(path.join(dest,'source/verify-delivery-native.ps1')),'-BundleRoot',np(dest)]);
 const receipt=json(path.join(dest,'qa/delivery-windows-run.json'));
 if(!receipt.ok||receipt.steps.length!==6||receipt.steps.some(s=>s.exit!==0))throw Error('Incomplete native delivery verification');
 const ecStatus=JSON.parse(receipt.steps[2].stdout.replace(/^\uFEFF/,'')),fcStatus=JSON.parse(receipt.steps[3].stdout.replace(/^\uFEFF/,''));
 const missing=ecStatus.find(x=>x.command==='footage.missing');
 if(!Array.isArray(missing?.result?.missing)||missing.result.missing.length||ecStatus.some(x=>typeof x.result?.missing==='number'&&x.result.missing!==0)||!Array.isArray(fcStatus)||fcStatus.length!==2||fcStatus.some(x=>x.status!=='online'))throw Error('Offline native media');
 const proofs={};for(const [app,name]of [['effectcraft','delivery-effectcraft.png'],['filmcraft','delivery-filmcraft.png']]){const p=path.join(dest,'qa',id,name),bytes=fs.readFileSync(p);if(bytes.length<32||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Missing native image '+p);proofs[app]={file:name,sha256:hash(p)};}
 for(const ext of ['ecproj','fcproj']){const text=readText(path.join(dest,'projects',id+'.'+ext));if(text.includes(root)||text.includes(JSON.stringify(np(root)).slice(1,-1)))throw Error('Worktree reference remains');}
 const video=path.join(dest,'videos',id+'.mp4'),mix=path.join(dest,'media',e.mix);
 if(hash(video)!==sourceBinding.videoSha256||hash(mix)!==sourceBinding.audioSha256)throw Error('Changed video/mix during relink');
 const binding={version:'EMBERWAKE-60',comp:e.compName,previewTime:14,nativeReopenSaveRender:true,missingAssets:0,videoSha256:hash(video),audioSha256:hash(mix),masterSha256:sourceBinding.masterSha256,effectcraftFootage:ecStatus,filmcraftStatus:fcStatus,effectcraftSha256:hash(path.join(dest,'projects',id+'.ecproj')),filmcraftSha256:hash(path.join(dest,'projects',id+'.fcproj')),proofs};
 fs.writeFileSync(path.join(dest,'qa',id,'delivery-native.json'),JSON.stringify(binding,null,2)+'\n');
 const report={version:'EMBERWAKE-60',destination:np(dest),sourceBinding,copiesBeforeRelink:copies,nativeReopenSaveRender:true,missingAssets:0,windowsBatch:receipt,proofs};
 fs.writeFileSync(path.join(dest,'qa/portable-package.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Delivery native reopened/saved/rendered; copy SHA matches. '+np(dest));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await packageBundle(process.argv[2]||DEFAULT_DEST);
