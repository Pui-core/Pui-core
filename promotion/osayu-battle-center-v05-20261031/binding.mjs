import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/** Permission and provenance are separate; candidate content and stream origin remain unconfirmed. */
export function acceptedBinding(file,variant='solo') {
  if (!file) throw Error('BACKGROUND_UNCONFIRMED: explicit private PM binding required');
  const b=JSON.parse(fs.readFileSync(file,'utf8'));
  const bg=b.background;
  const confirmed=bg?.kind==='owner_stream_background'&&bg.acceptedByPM===true&&bg.characterFree===true;
  const candidate=b.schemaVersion===3&&bg?.kind==='stream_background_candidate'&&bg.usageAuthorizedByPM===true&&bg.actualStreamProvenanceConfirmed===false&&bg.characterFree===null&&bg.usage==='world_camera_private_production'&&typeof b.authorization==='string'&&b.authorization.trim();
  if(b.schemaVersion!==3||b.issue!==160||(!confirmed&&!candidate))
    throw Error('BACKGROUND_UNCONFIRMED: explicit confirmed or limited candidate-use contract required');
  if(bg.cameraPolicy!=='shared_world_camera')throw Error('BACKGROUND_CAMERA_POLICY_INVALID');
  if(typeof b.background.provenance!=='string'||!b.background.provenance.trim())throw Error('BACKGROUND_PROVENANCE_MISSING');
  const characters=variant==='collab'?[b.character,b.collaborator]:[b.character];
  if(!['solo','collab'].includes(variant))throw Error('UNKNOWN_VARIANT');
  for(const asset of [b.background,...characters]) {
    if(!asset || typeof asset.path!=='string' || !path.isAbsolute(asset.path) || !fs.statSync(asset.path).isFile()) throw Error('BINDING_ASSET_MISSING');
    const stat=fs.statSync(asset.path);
    if(!Number.isSafeInteger(asset.bytes)||asset.bytes!==stat.size||!Number.isSafeInteger(asset.width)||!Number.isSafeInteger(asset.height)||asset.width<1||asset.height<1||!(/^[a-f0-9]{64}$/i.test(asset.sha256||'')))throw Error('BINDING_METADATA_MISSING_OR_CHANGED');
    if(crypto.createHash('sha256').update(fs.readFileSync(asset.path)).digest('hex')!==asset.sha256.toLowerCase())throw Error('BINDING_BYTES_CHANGED');
  }
  if(b.character.conventionalAlpha!==true || b.character.width!==905 || b.character.height!==1810) throw Error('FIXED_CHARACTER_BINDING_INVALID');
  if(variant==='collab'&&(b.collaborator.alphaPreserved!==true||b.collaborator.width!==2000||b.collaborator.height!==4000))throw Error('COLLABORATOR_BINDING_INVALID');
  return b;
}

export function stageBinding(binding,root,variant='solo') {
  const dir=path.join(root,'media',variant);fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const selected=[['background',binding.background],['osayu',binding.character],...(variant==='collab'?[['collaborator',binding.collaborator]]:[])];
  const paths=[];
  for(const [id,asset]of selected){
    const out=path.join(dir,id+path.extname(asset.path));
    const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    if(fs.existsSync(out)){if(digest(out)!==asset.sha256.toLowerCase())throw Error('EXISTING_STAGING_DIFFERS');}
    else fs.copyFileSync(asset.path,out,fs.constants.COPYFILE_EXCL);
    if(fs.statSync(out).size!==asset.bytes||digest(out)!==asset.sha256.toLowerCase()||digest(asset.path)!==asset.sha256.toLowerCase())throw Error('STAGING_BINDING_CHANGED');
    paths.push(out);
  }
  return {background:paths[0],characters:paths.slice(1)};
}
