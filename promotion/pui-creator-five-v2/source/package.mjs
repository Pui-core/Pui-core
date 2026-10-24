/** V2 portable bundle. Import is inert; packaging requires an explicit call. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const idOf=e=>e.id+'-'+e.slug;
const DEFAULT_DEST='/mnt/f/Videos/ぷい本人プロモ5本-V2-2026-10-24';

export async function packageBundle(destination=DEFAULT_DEST){
  const {root,np,hash,run,EC,FC}=await import('./native.mjs');
  const {composition}=await import('./produce.mjs');
  const dest=path.resolve(destination),sourceReal=fs.realpathSync(root),destinationReal=fs.existsSync(dest)?fs.realpathSync(dest):dest;
  const oldV1=['/mnt/f/Videos/ぷい本人プロモ5本-2026-10-24','/home/pui/Videos/Pui-Promo/2026-10-24/creator-five'];
  if(destinationReal===sourceReal||destinationReal.startsWith(sourceReal+path.sep)||sourceReal.startsWith(destinationReal+path.sep)||oldV1.some(p=>dest===p||dest.startsWith(p+path.sep)))throw Error('V2 destination must be separate; v1 is reserved.');
  // A portable relink must not certify edited native files against an old export.
  // Validate the production binding before any copying or destination mutation.
  for(const e of episodes){
    const id=idOf(e),r=JSON.parse(fs.readFileSync(path.join(root,'qa',id,'rendered.json'),'utf8'));
    const checks=[['videos/'+id+'.mp4',r.sha256],['projects/'+id+'.ecproj',r.ecSha256],['projects/'+id+'.fcproj',r.fcSha256],['media/'+(e.mix||id+'-mix.wav'),r.audioSha256]];
    for(const [relative,expected]of checks)if(!expected||hash(path.join(root,relative))!==expected)throw Error('Production changed since render: '+relative);
  }
  fs.mkdirSync(dest,{recursive:true});
  const copies=[],receipts=[],relocatedSources=[],backupRoot=path.join(dest,'prior-package-'+Date.now());
  const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
  function copy(from,to){
    const sourceSha=hash(from);
    if(fs.existsSync(to)&&hash(to)===sourceSha){copies.push({file:path.relative(dest,to),sha256:sourceSha,bytes:fs.statSync(to).size,existingIdentical:true});return;}
    if(fs.existsSync(to)){const backup=path.join(backupRoot,path.relative(dest,to));fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(to,backup);}
    fs.copyFileSync(from,to);if(hash(to)!==sourceSha)throw Error('Copy SHA differs: '+to);
    copies.push({file:path.relative(dest,to),sha256:sourceSha,bytes:fs.statSync(to).size});
  }
  function tree(from,to){
    fs.mkdirSync(to,{recursive:true});
    for(const e of fs.readdirSync(from,{withFileTypes:true})){
      if(e.name==='checkpoints'||e.name==='research'||e.name.startsWith('prior-package-'))continue;
      const a=path.join(from,e.name),b=path.join(to,e.name);
      if(e.isDirectory())tree(a,b);else if(e.isFile())copy(a,b);
    }
  }
  for(const e of fs.readdirSync(root,{withFileTypes:true})){
    if(e.name==='checkpoints'||e.name==='research'||e.name.startsWith('prior-package-'))continue;
    if(e.isDirectory())tree(path.join(root,e.name),path.join(dest,e.name));else if(e.isFile())copy(path.join(root,e.name),path.join(dest,e.name));
  }
  const roots=[[np(root),np(dest)],[root,dest]];
  function relocate(v){
    if(typeof v==='string'){for(const [a,b]of roots)if(v===a||v.startsWith(a+'\\')||v.startsWith(a+'/'))return b+v.slice(a.length);return v;}
    if(Array.isArray(v))return v.map(relocate);
    if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,c])=>[k,relocate(c)]));
    return v;
  }
  for(const e of episodes){const p=path.join(dest,'source',idOf(e)+'.jsx');fs.writeFileSync(p,composition(dest,e));relocatedSources.push({file:path.relative(dest,p),sha256:hash(p)});}
  async function native(exe,args){const r=await run(exe,args);receipts.push({exe,args,...r});return r.stdout;}
  function pngExists(p){const b=fs.readFileSync(p);return b.length>32&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));}
  for(const e of episodes){
    const id=idOf(e),q=path.join(dest,'qa',id);fs.mkdirSync(q,{recursive:true});
    const rendered=json(path.join(root,'qa',id,'rendered.json'));
    for(const ext of ['ecproj','fcproj']){const p=path.join(dest,'projects',id+'.'+ext);fs.writeFileSync(p,JSON.stringify(relocate(json(p)))+'\n');}
    const ec=np(path.join(dest,'projects',id+'.ecproj')),fc=np(path.join(dest,'projects',id+'.fcproj'));
    await native(EC,['--project',ec,'--save','info','--json']);
    await native(FC,['--project',fc,'--save','inspect']);
    const ecStatus=JSON.parse((await native(EC,['--project',ec,'run','footage.check','{"wait":true}','footage.missing','{}','--json'])).replace(/^\uFEFF/,''));
    const fcStatus=JSON.parse((await native(FC,['--project',fc,'exec','media.status'])).replace(/^\uFEFF/,''));
    const missing=Array.isArray(ecStatus)&&ecStatus.find(x=>x.command==='footage.missing');
    if(!missing||!Array.isArray(missing.result?.missing)||missing.result.missing.length||ecStatus.some(x=>typeof x.result?.missing==='number'&&x.result.missing!==0))throw Error('Missing EffectCraft footage: '+id);
    if(!Array.isArray(fcStatus)||fcStatus.length!==2||fcStatus.some(x=>x.status!=='online'))throw Error('Offline FilmCraft footage: '+id);
    const previewTime=Math.max(0,Math.min(3.2,e.duration-.1));
    const ecProof=path.join(q,'delivery-effectcraft.png'),fcProof=path.join(q,'delivery-filmcraft.png');
    await native(EC,['--project',ec,'render-frame','--comp','Pui V2 '+e.id,'--time',String(previewTime),'--out',np(ecProof),'--json']);
    await native(FC,['--project',fc,'render','--seconds',String(previewTime),'--out',np(fcProof)]);
    if(!pngExists(ecProof)||!pngExists(fcProof))throw Error('Native delivery preview missing: '+id);
    for(const ext of ['ecproj','fcproj']){const v=fs.readFileSync(path.join(dest,'projects',id+'.'+ext),'utf8');if(v.includes(JSON.stringify(np(root)).slice(1,-1))||v.includes(root))throw Error('Original V2 root remains in native project: '+id);}
    const video=path.join(dest,'videos',id+'.mp4'),mixName=e.mix||id+'-mix.wav',mix=path.join(dest,'media',mixName);
    if(hash(video)!==hash(path.join(root,'videos',id+'.mp4'))||hash(video)!==rendered.sha256||hash(mix)!==rendered.audioSha256)throw Error('Delivery video/mix SHA differs: '+id);
    fs.writeFileSync(path.join(q,'delivery-native.json'),JSON.stringify({version:'V2',comp:'Pui V2 '+e.id,previewTime,nativeReopenSaveRender:true,missingAssets:0,videoSha256:hash(video),audioSha256:hash(mix),effectcraftFootage:ecStatus,filmcraftStatus:fcStatus,effectcraftSha256:hash(path.join(dest,'projects',id+'.ecproj')),filmcraftSha256:hash(path.join(dest,'projects',id+'.fcproj')),proofs:{effectcraft:{file:'delivery-effectcraft.png',sha256:hash(ecProof)},filmcraft:{file:'delivery-filmcraft.png',sha256:hash(fcProof)}}},null,2)+'\n');
    console.log('V2 relinked / native rendered from delivery: '+id+' @ '+previewTime+'s');
  }
  const report={version:'V2',destination:np(dest),copiesBeforeRelink:copies,relocatedSources,nativeReopenSaveRender:true,receipts};
  fs.writeFileSync(path.join(dest,'qa','portable-package.json'),JSON.stringify(report,null,2)+'\n');
  console.log(np(dest));return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await packageBundle(process.argv[2]||DEFAULT_DEST);
