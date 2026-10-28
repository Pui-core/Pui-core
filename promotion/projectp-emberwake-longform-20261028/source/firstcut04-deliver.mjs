import fs from 'node:fs';import path from 'node:path';
import {root,file,np,PC,EC,FC,FF,FP,run,parse,save,copy,hash,digest} from './native.mjs';
const name='emberwake-firstcut04c',preliminary='emberwake-firstcut04b',tag=name+'-f-native',E=JSON.parse(fs.readFileSync(file('source/'+name+'-measured.json'))),destination='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04',marker=path.join(destination,'.projectp-issue127-firstcut04.json');
if(JSON.parse(fs.readFileSync(file('qa/emberwake-firstcut04-ec-render.json'))).exit!==0||!fs.existsSync(file('qa/'+name+'-fc-assembly.json')))throw Error('Completed full EC picture and actual corrected FC assembly required');
if(!process.argv.includes('--stage-only'))throw Error('Explicit stage-only operation required; whole FC export has a separate finite owned worker');
if(fs.existsSync(marker))throw Error('Delivery checkpoint retained; inspect before any recovery');
if(fs.existsSync(destination)&&fs.readdirSync(destination).some(n=>n!=='photocraft-stage'))throw Error('Unexpected existing F content');fs.mkdirSync(destination,{recursive:true});
fs.writeFileSync(marker,JSON.stringify({issue127:true,sourceRoot:root,state:'CURRENT_FULL_FIRSTCUT_F_NATIVE_PROOF'},null,2)+'\n');
const nativeNames=['projects/'+name+'.ecproj','projects/'+name+'.fcproj'],from=np(root),to=np(destination);
const copied=[];async function take(rel){const src=file(rel),dst=path.join(destination,rel);if(!fs.existsSync(src))throw Error('Owned source absent '+rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);const[sha,deliverySha]=await Promise.all([digest(src),digest(dst)]);if(sha!==deliverySha)throw Error('F copied asset differs '+rel);copied.push({file:rel,bytes:fs.statSync(src).size,sha256:sha});}
function refs(v,field='',out=[]){if(typeof v==='string'&&/^(?:[a-z]:\\|\\\\)/i.test(v)&&/\.(?:mp4|mov|wav|png|jpg|jpeg|m4a|aac)$/i.test(v))out.push({field,path:v});else if(Array.isArray(v))v.forEach((x,i)=>refs(x,field+'['+i+']',out));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>refs(x,field+'.'+k,out));return out;}
const sourceRefs=nativeNames.flatMap(n=>refs(JSON.parse(fs.readFileSync(file(n))),n));
if(sourceRefs.some(r=>!r.path.startsWith(from+'\\')))throw Error('Unexpected original native media outside owned source');
for(const rel of [...new Set(sourceRefs.map(r=>r.path.slice(from.length+1).replaceAll('\\','/')))])await take(rel);
for(const rel of [...new Set(E.voices.map(c=>'media/'+c.file))])await take(rel);
for(const n of nativeNames)await take(n);for(const n of ['covers/emberwake-firstcut04.pcraft','covers/emberwake-firstcut04.png','covers/firstcut04-game-crop-F.png'])await take(n);
for(const n of fs.readdirSync(file('qa')).filter(n=>/^(?:firstcut04|emberwake-firstcut04|model04|free-bgm-candidate)/.test(n)&&/\.(?:json|png)$/.test(n)))await take('qa/'+n);
for(const[staged,source]of Object.entries({'firstcut04-game-crop.png':'firstcut04-game-crop-F.png','emberwake-firstcut04.pcraft':'emberwake-firstcut04.pcraft','emberwake-firstcut04.png':'emberwake-firstcut04.png'})){const rel='photocraft-stage/'+staged,sha=hash(file('covers/'+source));if(hash(path.join(destination,rel))!==sha)throw Error('Owned PC staging alias differs');copied.push({file:rel,sourceAlias:'covers/'+source,bytes:fs.statSync(path.join(destination,rel)).size,sha256:sha});}
for(const dir of ['source','metadata'])fs.cpSync(file(dir),path.join(destination,dir),{recursive:true});
function relink(v){return typeof v==='string'&&(v===from||v.startsWith(from+'\\'))?to+v.slice(from.length):Array.isArray(v)?v.map(relink):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relink(x)])):v;}
for(const n of nativeNames)fs.writeFileSync(path.join(destination,n),JSON.stringify(relink(JSON.parse(fs.readFileSync(file(n)))) ,null,2)+'\n');
const dependencies=nativeNames.flatMap(n=>refs(JSON.parse(fs.readFileSync(path.join(destination,n))),n));
if(dependencies.some(r=>!r.path.startsWith(to+'\\')||!fs.existsSync(path.join(destination,r.path.slice(to.length+1).replaceAll('\\','/')))))throw Error('F dependency escaped or missing');
const media=file('media'),hidden=file('media-hidden-for-F-proof04'),ec=path.join(destination,nativeNames[0]),fc=path.join(destination,nativeNames[1]),receipts=[];if(fs.existsSync(hidden))throw Error('Owned hidden media needs recovery');let hiddenNow=false,interrupted=false;
function restore(){if(hiddenNow&&fs.existsSync(hidden)&&!fs.existsSync(media)){fs.renameSync(hidden,media);hiddenNow=false;}}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{interrupted=true;restore();process.exitCode=1;});
async function check(exe,args,n){if(interrupted)throw Error('Owned delivery interrupted');const q='firstcut04-delivery-'+n+'.json',r=await run(exe,args,q);copy(file('qa/'+q),path.join(destination,'qa/'+q));receipts.push(q);if(interrupted)throw Error('Owned delivery interrupted');return r;}
let status,pcReopen='projects/emberwake-firstcut04-reopened.pcraft';
try{fs.renameSync(media,hidden);hiddenNow=true;
 const m=parse((await check(EC,['--project',np(ec),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json'],'ec-media')).stdout),missing=m.result?.find(x=>x.command==='footage.missing')?.result?.missing;if(!Array.isArray(missing)||missing.length)throw Error('F EC missing/unknown media');
 const time=E.cameraPatches[3].start/30+.5;await check(EC,['--project',np(ec),'render-frame','--comp',E.comp,'--time',String(time),'--out',np(path.join(destination,'qa/firstcut04-F-ec-camera.png')),'--json'],'ec-camera');
 if(hash(path.join(destination,'qa/firstcut04-F-ec-camera.png'))!==hash(file('qa/firstcut04b-camera-clean-final4-3.png')))throw Error('F EC corrected camera pixels differ');
 await check(EC,['--project',np(ec),'render-frame','--comp',E.comp,'--time','.5','--out',np(path.join(destination,'qa/firstcut04-F-ec-opening.png')),'--json'],'ec-opening');
 status=parse((await check(FC,['--project',np(fc),'exec','media.status'],'fc-media')).stdout);if(!Array.isArray(status)||status.length!==10||status.some(x=>x.status!=='online'))throw Error('F FC offline/unknown media');
 await check(FC,['--project',np(fc),'--save','render','--seconds',String(time),'--out',np(path.join(destination,'qa/firstcut04-F-fc-camera.png'))],'fc-camera');
 await check(PC,['run',np(path.join(destination,'covers/emberwake-firstcut04.pcraft')),'--out',np(path.join(destination,pcReopen))],'pc-save');await check(PC,['convert',np(path.join(destination,pcReopen)),np(path.join(destination,'qa/firstcut04-F-pc.png')),'--format','png'],'pc-render');if(hash(path.join(destination,'qa/firstcut04-F-pc.png'))!==hash(path.join(destination,'covers/emberwake-firstcut04.png')))throw Error('F PC embedded cover pixels differ');
}finally{restore();}
if(interrupted||!fs.existsSync(media)||fs.existsSync(hidden))throw Error('Owned source restore not confirmed');
const audit={state:'STAGED_3CRAFT_F_NATIVE_PROOF_COMPLETE',destination,sourceRoot:root,name,tag,plannedSeconds:E.duration,frames:E.frames,copiedFiles:copied,dependencies,missing:0,fcOnlineMedia:status.length,sourceMediaTemporarilyUnavailable:true,sourceMediaRestored:true,externalOwnerFilesRenamed:false,rawModelOrSdkBundled:false,nativeProjects:nativeNames.concat(['covers/emberwake-firstcut04.pcraft',pcReopen]),receipts,wholeFcExportComplete:false,rootAccepted:false,published:false};save('qa/firstcut04-stage.json',audit);copy(file('qa/firstcut04-stage.json'),path.join(destination,'qa/firstcut04-stage.json'));fs.writeFileSync(marker,JSON.stringify({issue127:true,sourceRoot:root,state:audit.state,receiptSha256:hash(file('qa/firstcut04-stage.json'))},null,2)+'\n');console.log(JSON.stringify({destination,missing:0,nativeProof:true,wholeFcExportComplete:false}));
