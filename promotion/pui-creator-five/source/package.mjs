/** Relocate ONLY this bundle, then use both native applications at delivery. */
import fs from 'node:fs';
import path from 'node:path';
import {episodes as stories} from './episodes.mjs';
import {composition,stem} from './produce.mjs';
import {root,np,hash,run,EC,FC} from './native.mjs';
const dest=path.resolve(process.argv[2]||'/mnt/f/Videos/ぷい本人プロモ5本-2026-10-24');
if(dest===root||dest.startsWith(root+path.sep))throw Error('Destination must be separate.');
fs.mkdirSync(dest,{recursive:true});
const copies=[];
function copy(from,to){const sourceSha=hash(from);if(fs.existsSync(to)&&hash(to)===sourceSha){copies.push({file:path.relative(dest,to),sha256:sourceSha,bytes:fs.statSync(to).size,existingIdentical:true});return;}if(fs.existsSync(to)){const backup=path.join(dest,'prior-package-'+Date.now(),path.relative(dest,to));fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(to,backup);}fs.copyFileSync(from,to);if(sourceSha!==hash(to))throw Error('Copy mismatch '+to);copies.push({file:path.relative(dest,to),sha256:sourceSha,bytes:fs.statSync(to).size});}
function tree(from,to){fs.mkdirSync(to,{recursive:true});for(const e of fs.readdirSync(from,{withFileTypes:true})){if(e.name==='checkpoints')continue;const a=path.join(from,e.name),b=path.join(to,e.name);if(e.isDirectory())tree(a,b);else if(e.isFile())copy(a,b);}}
for(const e of fs.readdirSync(root,{withFileTypes:true})){if(e.name==='checkpoints')continue;if(e.isDirectory())tree(path.join(root,e.name),path.join(dest,e.name));else if(e.isFile())copy(path.join(root,e.name),path.join(dest,e.name));}
const roots=[[np(root),np(dest)],[root,dest]];
function relocate(v){if(typeof v==='string'){for(const [a,b]of roots)if(v===a||v.startsWith(a+'\\')||v.startsWith(a+'/'))return b+v.slice(a.length);return v;}if(Array.isArray(v))return v.map(relocate);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,c])=>[k,relocate(c)]));return v;}
const receipts=[];
const relocatedSources=[];
for(const e of stories){const id=stem(e),p=path.join(dest,'source',id+'.jsx');fs.writeFileSync(p,composition(dest,e));relocatedSources.push({file:'source/'+id+'.jsx',sha256:hash(p)});}
async function native(exe,args){const r=await run(exe,args);receipts.push({exe,args,...r});return r.stdout;}
for(const e of stories){const id=stem(e),dir=path.join(dest,'qa',id);fs.mkdirSync(dir,{recursive:true});
 for(const ext of ['ecproj','fcproj']){const p=path.join(dest,'projects',id+'.'+ext);const parsed=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));fs.writeFileSync(p,JSON.stringify(relocate(parsed))+'\n');}
 const ec=np(path.join(dest,'projects',id+'.ecproj')),fc=np(path.join(dest,'projects',id+'.fcproj'));
 await native(EC,['--project',ec,'--save','info','--json']);await native(FC,['--project',fc,'--save','inspect']);
 const footage=await native(EC,['--project',ec,'run','footage.check','{"wait":true}','footage.missing','{}','--json']);
 const status=await native(FC,['--project',fc,'exec','media.status']);
 const ecStatus=JSON.parse(footage),fcStatus=JSON.parse(status);
 if(!Array.isArray(ecStatus)||ecStatus.some(x=>x.result?.missing!==undefined&&(Array.isArray(x.result.missing)?x.result.missing.length:x.result.missing)!==0))throw Error('Missing EffectCraft footage '+id);
 if(!Array.isArray(fcStatus)||fcStatus.length!==2||fcStatus.some(x=>x.status!=='online'))throw Error('Offline FilmCraft footage '+id);
 await native(EC,['--project',ec,'render-frame','--comp','Pui Creator '+e.id,'--time','9.6','--out',np(path.join(dir,'delivery-effectcraft.png')),'--json']);
 await native(FC,['--project',fc,'render','--seconds','9.6','--out',np(path.join(dir,'delivery-filmcraft.png'))]);
 for(const ext of ['ecproj','fcproj']){const v=fs.readFileSync(path.join(dest,'projects',id+'.'+ext),'utf8');if(v.includes(JSON.stringify(np(root)).slice(1,-1))||v.includes(root))throw Error('Original root remains in native project '+id);}
 if(hash(path.join(root,'videos',id+'.mp4'))!==hash(path.join(dest,'videos',id+'.mp4')))throw Error('Video SHA mismatch');
 fs.writeFileSync(path.join(dir,'delivery-native.json'),JSON.stringify({nativeReopenSaveRender:true,missingAssets:0,videoSha256:hash(path.join(dest,'videos',id+'.mp4')),effectcraftFootage:ecStatus,filmcraftStatus:fcStatus,effectcraftSha256:hash(path.join(dest,'projects',id+'.ecproj')),filmcraftSha256:hash(path.join(dest,'projects',id+'.fcproj'))},null,2)+'\n');
 console.log('Relinked and native rendered from delivery: '+id);
}
fs.writeFileSync(path.join(dest,'qa','portable-package.json'),JSON.stringify({destination:np(dest),copiesBeforeRelink:copies,relocatedSources,nativeReopenSaveRender:true,receipts},null,2)+'\n');
console.log(np(dest));
