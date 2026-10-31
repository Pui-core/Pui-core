import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {acceptedBinding,stageBinding} from './binding.mjs';
import {composition} from './motion.mjs';
import {variantArg} from './plan.mjs';

export async function build(mode,{probe=false,variant='solo'}={}) {
 if(!['neutral','preview','production'].includes(mode))throw Error('Expected neutral, preview or production');
 // Fail before spawning native tools or creating a production artifact.
 const binding=mode==='production'?acceptedBinding(process.env.OSAYU160_BINDING,variant):null;
 const {root,native,parseNative,save,hash}=await import('./runtime.mjs');
 const stem=variant+'-'+mode+(probe?'-probe':''), project=path.join(root,'projects',stem+'.ecproj'),jsx=path.join(root,'source',stem+'.jsx');
 if(fs.existsSync(project))throw Error('Existing native project retained; use another private revision root');
 fs.mkdirSync(path.dirname(jsx),{recursive:true,mode:0o700});fs.mkdirSync(path.dirname(project),{recursive:true,mode:0o700});
 const assets=binding?{...stageBinding(binding,root,variant),backgroundSize:[binding.background.width,binding.background.height]}:null;
 fs.writeFileSync(jsx,composition({assets,includeCharacter:mode==='production',probe,variant}),{mode:0o600});
 const r=await native(['--empty','script',jsx,'--save-as',project,'--json'],stem+'-build');
 const parsed=parseNative(r.stdout);if(!parsed.ok||parsed.error)throw Error('Native composition failed');
 const layout=JSON.parse(parsed.output);save(path.join(root,'qa',stem+'-layout.json'),layout);
 await native(['--project',project,'--save','info','--json'],stem+'-reopen-save');
 const p=JSON.parse(fs.readFileSync(project));
 const footage=Object.values(p.items||{}).filter(i=>i.kind?.type==='Footage');
 if(mode!=='production'&&footage.length)throw Error('Safe preview imported footage');
 if(binding){const selected=[{path:assets.background,asset:binding.background},...(mode==='production'?assets.characters.map((p,i)=>({path:p,asset:i===0?binding.character:binding.collaborator})):[])];if(footage.length!==selected.length||selected.some(x=>{const f=footage.find(f=>f.kind.path===x.path);return !f||f.kind.width!==x.asset.width||f.kind.height!==x.asset.height;}))throw Error('NATIVE_MEDIA_DIMENSIONS_MISMATCH');}
 save(path.join(root,'qa',stem+'-binding.json'),{mode,probe,variant,project,projectHash:hash(project),backgroundConfirmed:binding?.background.kind==='owner_stream_background',backgroundCandidateUsed:binding?.background.kind==='stream_background_candidate',backgroundFixed:false,characterImported:mode==='production',footageCount:footage.length,creativeAcceptance:false});
 console.log(JSON.stringify({mode,probe,variant,nativeReopenSaved:true,footageCount:footage.length,creativeAcceptance:false}));return {project,layout};
}
if(process.argv[1]===fileURLToPath(import.meta.url))await build(process.argv[2],{probe:process.argv.includes('--probe'),variant:variantArg()});
