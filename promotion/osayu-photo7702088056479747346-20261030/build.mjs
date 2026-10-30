import fs from 'node:fs';
import path from 'node:path';
import {root,hash,save,native,parseNative} from './runtime.mjs';
import {composition,compName,duration,reviewTimes} from './motion.mjs';
const original='/mnt/f/Users/pui/Documents/gara/立ち絵.jpg';
const old='/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-04';
const stageSha='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6';
const characterSha='e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef';
export function assertPreview(project){
  const p=JSON.parse(fs.readFileSync(project,'utf8'));const items=Object.values(p.items||{});
  const footage=items.filter(i=>i.kind?.type==='Footage');
  if(footage.length!==1||footage[0].kind.path!==path.join(root,'media/stage-background.png')||hash(footage[0].kind.path)!==stageSha)throw Error('Preview must import only the approved stage');
  const serialized=JSON.stringify(p);if(/character-cutout|character-original|立ち絵|gara[/\\]/i.test(serialized))throw Error('Forbidden character reference in preview');
  return {projectSha256:hash(project),containsCharacter:false,footageCount:footage.length,approvedStageSha256:stageSha,aiPreviewAllowed:true};
}
for(const d of ['media','projects','qa','qa/preview','qa/local-only','source','videos'])fs.mkdirSync(path.join(root,d),{recursive:true});
const assets=[['stage-background.png',path.join(old,'media/stage-background.png'),stageSha]];
const includeCharacter=process.argv.includes('--production-draft');
if(includeCharacter)assets.push(['character-cutout.png',path.join(old,'media/character-cutout.png'),characterSha]);
if(hash(original)!=='89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2')throw Error('Original changed; do not reuse old alpha');
for(const[n,p,h]of assets){if(hash(p)!==h)throw Error('Asset mismatch: '+n);const out=path.join(root,'media',n);if(fs.existsSync(out)&&hash(out)!==h)throw Error('Refuse to overwrite changed asset');fs.copyFileSync(p,out);}
const stem=includeCharacter?'osayu-tutorial-battle':'character-free-preview';
const jsx=path.join(root,'source',stem+'.jsx'),project=path.join(root,'projects',stem+'.ecproj');
if(fs.existsSync(project))throw Error('Existing project retained; create a new revision before rebuilding');
fs.writeFileSync(jsx,composition(root,{includeCharacter}));
const result=await native('effectcraft',['--empty','script',jsx,'--save-as',project,'--json'],path.join(root,'qa',stem+'-build.json'));
const response=parseNative(result.stdout);if(!response.ok||response.error)throw Error('Native script failed');
const layout=JSON.parse(response.output);save(path.join(root,'qa',stem+'-layout.json'),layout);
if(!layout.boxes.length||layout.boxes.some(b=>!Number.isFinite(b.width)||b.size<20))throw Error('Invalid native text bounds');
if(!includeCharacter)save(path.join(root,'qa',stem+'-isolation.json'),assertPreview(project));
await native('effectcraft',['--project',project,'--save','info','--json'],path.join(root,'qa',stem+'-reopen-save.json'));
if(!includeCharacter)assertPreview(project);
save(path.join(root,'qa',stem+'-summary.json'),{project,projectSha256:hash(project),jsxSha256:hash(jsx),duration,sceneCount:layout.sceneCount,textLayerCount:layout.boxes.length,containsCharacter:includeCharacter,contentStatus:layout.contentStatus,finalMusic:false,reviewTimes});
console.log(JSON.stringify({project,sceneCount:layout.sceneCount,textLayers:layout.boxes.length,containsCharacter:includeCharacter,contentStatus:layout.contentStatus}));
