import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {root,hash,save} from './runtime.mjs';import {composition} from './motion.mjs';
const source=path.dirname(fileURLToPath(import.meta.url)),results=[];
for(const variant of ['solo','collab'])for(const mode of ['neutral','production']){
 const stem=variant+'-'+mode,background=path.join(root,'backgrounds',variant+'-curved-studio-v07.png'),characters=mode==='neutral'?[]:(variant==='solo'?['osayu.png']:['osayu.png','collaborator.png']).map(x=>path.join(root,'media',x));
 const text=composition({variant,background,characters,neutral:mode==='neutral'}),jsx=path.join(root,'source',stem+'.jsx'),project=path.join(root,'projects',stem+'.ecproj');
 if(fs.readFileSync(jsx,'utf8')!==text)throw Error('Saved JSX differs from current source '+stem);
 const binding=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-binding.json')));if(binding.projectSHA256!==hash(project))throw Error('Project changed '+stem);
 results.push({stem,jsxSHA256:hash(jsx),projectSHA256:hash(project)});
}
const files=fs.readdirSync(source).filter(x=>/\.(mjs|cs|md)$/.test(x)).map(x=>({file:x,sha256:hash(path.join(source,x))}));
save(path.join(root,'qa','source-attestation.json'),{files,projects:results,generatedJSXMatches:true});console.log('Saved 4 JSX files match current source');
