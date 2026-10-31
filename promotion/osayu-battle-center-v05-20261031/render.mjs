import fs from 'node:fs';import path from 'node:path';
import {acceptedBinding,stageBinding} from './binding.mjs';
import {compName,variantArg} from './plan.mjs';
const mode=process.argv[2];if(!['neutral','preview','production'].includes(mode))throw Error('Expected neutral, preview or production');
const variant=variantArg();
const binding=mode==='production'?acceptedBinding(process.env.OSAYU160_BINDING,variant):null;
const {root,native,ff,save,hash}=await import('./runtime.mjs');
const assets=binding?stageBinding(binding,root,variant):null;
const stem=variant+'-'+mode+(process.argv.includes('--probe')?'-probe':''),project=path.join(root,'projects',stem+'.ecproj');
const p=JSON.parse(fs.readFileSync(project));
if(mode!=='production'&&Object.values(p.items).some(x=>x.kind?.type==='Footage'))throw Error('Safe preview imports footage');
if(assets){const expected=[assets.background,...(mode==='production'?assets.characters:[])],refs=Object.values(p.items).filter(x=>x.kind?.type==='Footage');if(refs.length!==expected.length||refs.some(x=>!expected.includes(x.kind.path)))throw Error('PROJECT_MEDIA_BINDING_MISMATCH');}
const out=path.join(root,'videos',stem+'.mp4');if(fs.existsSync(out))throw Error('Existing render retained; select another private revision');
fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});
await native(['--project',project,'render','--comp',compName,'--out',out,'--format','h264','--bitrate','18000','--audio','off','--json'],stem+'-render');
await ff(['-i',out,'-map','0:v:0','-an','-f','null','-'],stem+'-whole-decode');
save(path.join(root,'qa',stem+'-render-summary.json'),{mode,variant,probe:process.argv.includes('--probe'),bytes:fs.statSync(out).size,sha256:hash(out),projectHash:hash(project),backgroundConfirmed:binding?.background.kind==='owner_stream_background',backgroundCandidateUsed:binding?.background.kind==='stream_background_candidate',backgroundFixed:false,characterImported:mode==='production',creativeAcceptance:false,wholeDecodeExit:0});
console.log(JSON.stringify({mode,variant,bytes:fs.statSync(out).size,wholeDecodeExit:0,provisional:true}));
