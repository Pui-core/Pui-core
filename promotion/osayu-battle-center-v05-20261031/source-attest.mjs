import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {root,hash,save} from './runtime.mjs';import {sourceFingerprint} from './source-fingerprint.mjs';import {acceptedBinding,stageBinding} from './binding.mjs';import {composition} from './motion.mjs';import {variantArg} from './plan.mjs';
const variant=variantArg(),mode=process.argv[2],probe=process.argv.includes('--probe');assert(['neutral','production'].includes(mode));const stem=variant+'-'+mode+(probe?'-probe':'');
const project=path.join(root,'projects',stem+'.ecproj'),jsx=path.join(root,'source',stem+'.jsx'),binding=mode==='production'?acceptedBinding(process.env.OSAYU160_BINDING,variant):null,assets=binding?stageBinding(binding,root,variant):null;
assert.equal(fs.readFileSync(jsx,'utf8'),composition({assets,includeCharacter:mode==='production',probe,variant}),'saved JSX differs from current composition');
const built=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-binding.json'))),audit=path.join(root,'qa',stem+'-camera-structure.json');assert.equal(built.projectHash,hash(project));assert.equal(JSON.parse(fs.readFileSync(audit)).projectHash,hash(project));
const out=path.join(root,'qa',stem+'-source-attestation.json');if(fs.existsSync(out))throw Error('Existing source attestation retained');
save(out,{variant,mode,probe,projectHash:hash(project),jsxHash:hash(jsx),auditHash:hash(audit),source:sourceFingerprint(),method:'regenerated JSX exact match and saved project/audit hash chain'});console.log(JSON.stringify({variant,mode,probe,sourceAttested:true}));
