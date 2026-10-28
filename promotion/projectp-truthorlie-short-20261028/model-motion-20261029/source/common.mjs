import fs from 'node:fs';
import path from 'node:path';
import {root,hash,copy} from './native.mjs';
export const stage=root;
export const baseline='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-05-real-round';
export const startFrame=504,frames=72,fps=30,duration=19.2;
export const narrationHash='a8052a999efb483db9c2209f559b315907ed2f460b227839d1f6b4f996f4adcf';
export const sfxHash='1e352d7fcc2ad9b59a99017b400c70152ae12b15ef7e7cb41e9fe53e7af9b68e';
export function retainedCopy(a,b){if(fs.existsSync(b)){if(hash(a)!==hash(b))throw Error('Retained dependency differs: '+b);}else copy(a,b);return b;}
for(const d of ['source/classes','media/model-frames','projects','covers','qa/diagnostic','videos','private/model','public-ready'])fs.mkdirSync(path.join(stage,d),{recursive:true});
