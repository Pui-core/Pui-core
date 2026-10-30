/** Private editable package, byte-verified copies and actual native relink/reopen/redraw. */
import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {acceptedBinding} from './binding.mjs';
import {root,native,filmNative,hash,save} from './runtime.mjs';
import {compName} from './plan.mjs';
const out=path.join(root,'editable');if(fs.existsSync(out))throw Error('Existing editable package retained');fs.mkdirSync(out,{mode:0o700});
const copied=[];
function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true,mode:0o700});fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);if(hash(a)!==hash(b))throw Error('Private copy differs');copied.push({destination:b,bytes:fs.statSync(b).size,sha256:hash(b)});}
function tree(a,b){for(const e of fs.readdirSync(a,{withFileTypes:true})){if(e.isDirectory())tree(path.join(a,e.name),path.join(b,e.name));else if(e.isFile())copy(path.join(a,e.name),path.join(b,e.name));else throw Error('No symlinks in editable media');}}
tree(path.join(root,'media'),path.join(out,'media'));tree(path.join(root,'projects'),path.join(out,'projects'));tree(path.join(root,'source'),path.join(out,'generated-scripts'));
tree(path.dirname(fileURLToPath(import.meta.url)),path.join(out,'recipe'));
const binding=acceptedBinding(process.env.OSAYU158_BINDING,'collab');
binding.background.path=path.join(out,'media','solo','background'+path.extname(binding.background.path));binding.character.path=path.join(out,'media','solo','osayu'+path.extname(binding.character.path));binding.collaborator.path=path.join(out,'media','collab','collaborator'+path.extname(binding.collaborator.path));
save(path.join(out,'binding.private.json'),binding);
for(const variant of ['solo','collab'])copy(path.join(root,'videos',variant+'-production.mp4'),path.join(out,'videos',variant+'-production.mp4'));
const replace=v=>typeof v==='string'&&(v===root||v.startsWith(root+'/'))?out+v.slice(root.length):Array.isArray(v)?v.map(replace):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,replace(x)])):v;
const reopened=[];
for(const variant of ['solo','collab']){
 for(const name of [variant+'-production.ecproj',variant+'-neutral.ecproj',variant+'-final.fcproj']){
  const file=path.join(out,'projects',name);fs.writeFileSync(file,JSON.stringify(replace(JSON.parse(fs.readFileSync(file))))+'\n');
  if(name.endsWith('ecproj'))await native(['--project',file,'--save','info','--json'],'package-reopen-'+name);
  else await filmNative(['--project',file,'--save','inspect'],'package-reopen-'+name);
  reopened.push({name,sha256:hash(file),reopenSaveExit:0});
 }
 const local=path.join(out,'private-numeric');fs.mkdirSync(local,{recursive:true,mode:0o700});
 await native(['--project',path.join(out,'projects',variant+'-production.ecproj'),'render-frame','--comp',compName,'--time','16.5','--out',path.join(local,variant+'-effect.png'),'--json'],variant+'-package-effect-redraw');
 await filmNative(['--project',path.join(out,'projects',variant+'-final.fcproj'),'render','--seconds','16.5','--out',path.join(local,variant+'-film.png')],variant+'-package-film-redraw');
}
save(path.join(root,'qa','editable-package.private.json'),{passed:true,directory:out,copiedBeforeIntentionalRelink:copied,reopened,actualNativeRedraws:4,characterAiInputs:0});
console.log(JSON.stringify({packageVerified:true,copiedFiles:copied.length,reopened:reopened.length,actualNativeRedraws:4,characterAiInputs:0}));
