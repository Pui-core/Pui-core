import fs from 'node:fs';import path from 'node:path';
import {root,native,save,hash,parseNative} from './runtime.mjs';
import {composition} from './motion.mjs';
const [variant='solo',mode='neutral']=process.argv.slice(2);
if(!['solo','collab'].includes(variant)||!['neutral','production'].includes(mode))throw Error('arguments');
const stem=variant+'-'+mode,project=path.join(root,'projects',stem+'.ecproj'),jsx=path.join(root,'source',stem+'.jsx');
if(fs.existsSync(project))throw Error('Existing project retained');
const background=path.join(root,'backgrounds',variant+'-curved-studio-v07.png'),provenance=JSON.parse(fs.readFileSync(background.replace('.png','-provenance.json')));
if(!provenance.characterFree||provenance.externalMediaImports!==0||hash(background)!==provenance.pngSHA256)throw Error('Unsafe background');
let characters=[];
if(mode==='production'){
 const b=JSON.parse(fs.readFileSync(process.env.OSAYU160_BINDING));
 for(const asset of variant==='solo'?[b.character]:[b.character,b.collaborator]){
  if(hash(asset.path)!==asset.sha256||fs.statSync(asset.path).size!==asset.bytes)throw Error('Original character changed');
  const target=path.join(root,'media',path.basename(asset.path));fs.mkdirSync(path.dirname(target),{recursive:true});
  if(!fs.existsSync(target))fs.copyFileSync(asset.path,target,fs.constants.COPYFILE_EXCL);
  if(hash(target)!==asset.sha256)throw Error('Staged character mismatch');characters.push(target);
 }
}
fs.writeFileSync(jsx,composition({variant,background,characters,neutral:mode==='neutral'}));
const result=parseNative((await native(['--empty','script',jsx,'--save-as',project,'--json'],stem+'-build')).stdout);
if(!result.ok)throw Error('Native build failed');
save(path.join(root,'qa',stem+'-layout.json'),JSON.parse(result.output));
await native(['--project',project,'--save','info','--json'],stem+'-reopen');
const p=JSON.parse(fs.readFileSync(project)),footage=Object.values(p.items).filter(x=>x.kind?.type==='Footage').map(x=>x.kind.path);
const expected=[background,...characters];if(footage.length!==expected.length||footage.some(x=>!expected.includes(x)))throw Error('Unexpected media');
save(path.join(root,'qa',stem+'-binding.json'),{project,projectSHA256:hash(project),jsxSHA256:hash(jsx),footage:expected.map(p=>({path:p,sha256:hash(p)})),characterAIInputs:0,neutral:mode==='neutral'});
console.log(JSON.stringify({variant,mode,project,footageCount:footage.length}));
