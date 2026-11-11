import fs from 'node:fs';import path from 'node:path';
import {root,file,np,PC,EC,FC,run,parse,save,hash,digest,copy} from './native.mjs';
const dest='/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02';
const mark=JSON.parse(fs.readFileSync(dest+'/.projectp-issue129-delivery.json'));
if(mark.issue!==129||mark.writer!=='/root/truthorlie_quality129')throw Error('Unowned destination');
const from=np(root),to=np(dest),transforms=[],dependencies=[],checks=[];
function relink(v){return typeof v==='string'&&(v===from||v.startsWith(from+'\\'))?to+v.slice(from.length):Array.isArray(v)?v.map(relink):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relink(x)])):v;}
function refs(v,key='',out=[]){if(typeof v==='string'&&(v.startsWith('\\\\')||/^[A-Za-z]:\\/.test(v)))out.push({key,path:v});else if(Array.isArray(v))v.forEach((x,i)=>refs(x,key+'['+i+']',out));else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))refs(x,key?key+'.'+k:k,out);return out;}
for(const dir of ['media','source','covers','qa','videos']){fs.mkdirSync(dest+'/'+dir,{recursive:true});for(const e of fs.readdirSync(file(dir),{withFileTypes:true})){if(!e.isFile())continue;copy(file(dir+'/'+e.name),dest+'/'+dir+'/'+e.name);}}
for(const n of ['source/composition-sample-v02.jsx','source/composition-sample-v02-corrected.jsx']){const p=dest+'/'+n,s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.split(JSON.stringify(from).slice(1,-1)).join(JSON.stringify(to).slice(1,-1)));transforms.push({path:n,sourceSha256:hash(file(n)),deliverySha256:hash(p),change:'Only compiled native media path relocation to owned F revision'});}
const projects=['projects/truthorlie129-sample75-v02.ecproj','projects/truthorlie129-sample75-v02-corrected.ecproj','projects/truthorlie129-sample75-v02-corrected.fcproj'];
for(const n of projects){fs.writeFileSync(dest+'/'+n,JSON.stringify(relink(JSON.parse(fs.readFileSync(file(n)))),null,2)+'\n');}
async function check(exe,args,name){const r=await run(exe,args,'delivery-corrected-'+name+'.json');copy(file('qa/delivery-corrected-'+name+'.json'),dest+'/qa/delivery-corrected-'+name+'.json');checks.push(name);return r;}
for(const [base,comp] of [['truthorlie129-sample75-v02','TruthOrLie129 Editorial Sample75 v02'],['truthorlie129-sample75-v02-corrected','TruthOrLie129 Editorial Sample75 v02 corrected']]){
 const n='projects/'+base+'.ecproj',r=parse((await check(EC,['--project',np(dest+'/'+n),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json'],base+'-media')).stdout),m=r.result?.find(x=>x.command==='footage.missing')?.result?.missing;
 if(!Array.isArray(m)||m.length)throw Error('F EC missing '+base);
 await check(EC,['--project',np(dest+'/'+n),'render-frame','--comp',comp,'--time','28','--out',np(dest+'/qa/reopened-'+base+'.png'),'--json'],base+'-frame');
}
const fc=projects[2],status=parse((await check(FC,['--project',np(dest+'/'+fc),'exec','media.status'],'fc-media')).stdout);
if(!Array.isArray(status)||status.length!==5||status.some(x=>x.status!=='online'))throw Error('F FC offline');
await check(FC,['--project',np(dest+'/'+fc),'--save','render','--seconds','29.3','--out',np(dest+'/qa/reopened-corrected-fc.png')],'fc-frame');
const pc='covers/editorial-board.pcraft',pcNew='projects/editorial-board-reopened.pcraft';
await check(PC,['run',np(dest+'/'+pc),'--out',np(dest+'/'+pcNew)],'pc-save');
await check(PC,['convert',np(dest+'/'+pcNew),np(dest+'/qa/reopened-photocraft-board.png'),'--format','png'],'pc-frame');
if(hash(dest+'/qa/reopened-photocraft-board.png')!==hash(file('media/editorial-board.png')))throw Error('F PC changed pixels');
const pcInfo=parse((await check(PC,['info',np(dest+'/'+pcNew),'--compact'],'pc-info')).stdout);if(pcInfo.warnings?.length)throw Error('PC warnings');
for(const n of projects){for(const d of refs(JSON.parse(fs.readFileSync(dest+'/'+n)))){if(!d.path.startsWith(to+'\\'))throw Error('External native ref '+d.path);const rel=d.path.slice(to.length+1).replaceAll('\\','/');if(!fs.existsSync(dest+'/'+rel))throw Error('F asset missing '+rel);dependencies.push({project:n,key:d.key,relativeAsset:rel,exists:true});}transforms.push({path:n,sourceSha256:hash(file(n)),deliverySha256:hash(dest+'/'+n),change:'Media relocation and native reopen/save'});}
const movie='videos/truthorlie129-editorial-sample75-v02-corrected-cipher.mp4';
if(await digest(file(movie))!==await digest(dest+'/'+movie))throw Error('Final movie copy differs');
const receipt={status:'PASS_SAMPLE_NATIVE_PC_EC_FC_F_REOPEN_SAVE_RENDER_MISSING0',issue:129,destination:dest,sourceRoot:root,projects,photoCraft:{native:pc,reopened:pcNew,samePixels:true,sha256:hash(dest+'/'+pcNew)},dependencies,externalActiveMedia:0,missingMedia:0,transforms,checkedReceipts:checks,movie:{file:movie,sha256:await digest(dest+'/'+movie),bytes:fs.statSync(dest+'/'+movie).size},notFinal600SecondMaster:true,contentP1Unresolved:true,wholeDirectWatch:false,wholeSubjectiveListen:false,rootQualityAccepted:false,published:false,oldRevision01Changed:false};
save('qa/delivery-sample-v02-corrected.json',receipt);copy(file('qa/delivery-sample-v02-corrected.json'),dest+'/qa/delivery-sample-v02-corrected.json');
console.log('OWNED_F_SAMPLE_3CRAFT_REOPEN_SAVE_RENDER_MISSING0_COMPLETE');
