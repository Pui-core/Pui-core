// Copy character metadata only; never copy the old background into the new revision.
import fs from 'node:fs';import path from 'node:path';import {acceptedBinding} from './binding.mjs';
const [oldFile,out]=process.argv.slice(2);if(!oldFile||!out||!path.isAbsolute(out))throw Error('usage: node make-binding.mjs OLD_PRIVATE_BINDING NEW_ABSOLUTE_BINDING');
const old=JSON.parse(fs.readFileSync(oldFile,'utf8'));if(old.issue!==160||!old.character||!old.collaborator)throw Error('OLD_CHARACTER_BINDING_INVALID');
const next={schemaVersion:4,issue:160,background:{kind:'original_vector_studio',characterFree:true,actualStreamProvenanceConfirmed:false,cameraPolicy:'shared_world_camera'},character:old.character,collaborator:old.collaborator};
fs.writeFileSync(out,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});try{acceptedBinding(out,'solo');acceptedBinding(out,'collab');}catch(e){fs.unlinkSync(out);throw e;}console.log(JSON.stringify({created:true,background:'original_vector_studio',characterMediaCopied:false}));
