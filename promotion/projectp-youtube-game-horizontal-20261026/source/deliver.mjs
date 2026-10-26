import fs from 'node:fs';
import path from 'node:path';
import {root,file,np,PC,EC,FC,run,parse,save,hash,digest,copy} from './native.mjs';
const destination='/mnt/f/Videos/ProjectP-YouTube-Game-Horizontal-2026-10-26/revision-01';
const marker=path.join(destination,'.projectp-issue112-delivery.json');
if(fs.existsSync(destination)&&!fs.existsSync(marker)&&fs.readdirSync(destination).some(n=>n!=='photocraft-stage'))throw Error('Existing delivery contains files not owned by this task');
fs.mkdirSync(destination,{recursive:true});
fs.writeFileSync(marker,JSON.stringify({issue:'https://github.com/Pui-core/-/issues/112',writerScope:'Issue112 dedicated output only',sourceRoot:root},null,2)+'\n');
const allowed=p=>!p.includes('FilmCraft Previews')&&!p.includes('/checkpoints/')&&path.basename(p)!=='.gitignore';
fs.cpSync(root,destination,{recursive:true,filter:allowed});
const from=np(root),to=np(destination);
function relink(v){return typeof v==='string'&&(v===from||v.startsWith(from+'\\'))?to+v.slice(from.length):Array.isArray(v)?v.map(relink):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relink(x)])):v;}
const natives=['projects/first-forgetting.ecproj','projects/first-forgetting.fcproj'];
for(const n of natives){const p=path.join(destination,n);fs.writeFileSync(p,JSON.stringify(relink(JSON.parse(fs.readFileSync(p,'utf8'))),null,2)+'\n');}
const ec=path.join(destination,natives[0]),fc=path.join(destination,natives[1]),cover=path.join(destination,'covers/first-forgetting.pcraft');
const checked=[];
async function check(exe,args,name){const receipt='delivery-'+name+'.json';const r=await run(exe,args,receipt);copy(file('qa/'+receipt),path.join(destination,'qa/'+receipt));checked.push(receipt);return r;}
const er=parse((await check(EC,['--project',np(ec),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json'],'ec-media')).stdout);
const missing=er.result?.find(x=>x.command==='footage.missing')?.result?.missing;
if(!Array.isArray(missing)||missing.length!==0)throw Error('F EffectCraft missing-media status is not a verified empty list');
await check(EC,['--project',np(ec),'render-frame','--comp','EMBERWAKE First Forgetting','--time','50.5','--out',np(path.join(destination,'qa/delivery-ec.png')),'--json'],'ec-render');
const status=parse((await check(FC,['--project',np(fc),'exec','media.status'],'fc-media')).stdout);
if(!Array.isArray(status)||status.length!==3||status.some(s=>s.status!=='online'))throw Error('F FilmCraft media is not all online');
await check(FC,['--project',np(fc),'--save','render','--seconds','50.5','--out',np(path.join(destination,'qa/delivery-fc.png'))],'fc-render');
const reopened=path.join(destination,'projects/first-forgetting-reopened.pcraft');
await check(PC,['run',np(cover),'--out',np(reopened)],'pc-save');
await check(PC,['convert',np(reopened),np(path.join(destination,'qa/delivery-pc.png')),'--format','png'],'pc-render');
if(hash(path.join(destination,'qa/delivery-pc.png'))!==hash(file('covers/first-forgetting.png')))throw Error('F PhotoCraft reopened pixels differ');
// Preserve the canonical reopened originals and proof pixels in Git's source tree.
for(const n of [...natives,'projects/first-forgetting-reopened.pcraft','qa/delivery-ec.png','qa/delivery-fc.png','qa/delivery-pc.png'])copy(path.join(destination,n),file(n));
const binding=JSON.parse(fs.readFileSync(file('qa/render-binding.json'),'utf8'));
binding.renderedProjectBeforeRelocation={effectcraftSha256:binding.effectcraftSha256,filmcraftSha256:binding.filmcraftSha256};
binding.effectcraftSha256=hash(ec);binding.filmcraftSha256=hash(fc);binding.nativePathsRelocatedToF=true;binding.nativeFReopenedSavedRendered=true;
save('qa/render-binding.json',binding);copy(file('qa/render-binding.json'),path.join(destination,'qa/render-binding.json'));
const records=[];
async function walk(d,rel=''){
 for(const e of fs.readdirSync(d,{withFileTypes:true})){const n=path.join(rel,e.name),p=path.join(d,e.name);if(n==='qa/delivery.json'||n==='.projectp-issue112-delivery.json'||n.includes('FilmCraft Previews'))continue;if(e.isDirectory()){await walk(p,n);continue;}
  let source=file(n),deliveryOnly=false;
  if(n.startsWith('photocraft-stage/')){const name=path.basename(n);source=file((name==='first-forgetting.pcraft'||name==='first-forgetting.png'?'covers/':'media/')+name);deliveryOnly=true;}
  if(!fs.existsSync(source))throw Error('Unmapped extra delivery file: '+n);
  const sourceSha256=await digest(source),deliverySha256=await digest(p);
  if(sourceSha256!==deliverySha256)throw Error('F delivery SHA differs: '+n);
  records.push({file:n,bytes:fs.statSync(p).size,sourceSha256,deliverySha256,deliveryOnlyAlias:deliveryOnly});
 }
}
await walk(destination);
save('qa/delivery.json',{status:'PASS_F_NATIVE_REOPEN_SAVE_RENDER_MISSING0_AND_ALL_SHA',destination,fileCount:records.length,totalBytes:records.reduce((n,r)=>n+r.bytes,0),files:records,nativeOriginals:{effectcraft:natives[0],filmcraft:natives[1],photocraft:'covers/first-forgetting.pcraft'},nativeReopenedSavedRendered:true,missingMedia:0,photocraftReopenedPixelsIdentical:true,videoSha256:await digest(path.join(destination,'videos/emberwake-first-forgetting.mp4')),coverSha256:await digest(path.join(destination,'covers/first-forgetting.png')),checkedReceipts:checked,wholeDirectVideoWatch:false,wholeSubjectiveAudioListen:false,nativeYouTubeDisplay:false,published:false});
copy(file('qa/delivery.json'),path.join(destination,'qa/delivery.json'));
console.log(JSON.stringify({status:'PASS_F_NATIVE_REOPEN_SAVE_RENDER_ALL_SHA',destination,files:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0)}));
