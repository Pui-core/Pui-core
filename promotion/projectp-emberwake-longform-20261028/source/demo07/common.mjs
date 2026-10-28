import fs from 'node:fs';
import path from 'node:path';
import {file,copy,hash} from '../native.mjs';
export const stage='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo07-natural';
export const old='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo05-course-film';
export const plan=JSON.parse(fs.readFileSync(file('source/demo05/edit-plan.json')));
export const close=plan.sections.find(s=>s.id==='close');
export const masters=JSON.parse(fs.readFileSync(file('qa/demo06/master-binding.json')));
for(const d of ['source/classes','media/avatar-frames','media/picture','media/raw','projects','qa','videos','private/model','public-ready-demo07'])fs.mkdirSync(path.join(stage,d),{recursive:true});
export function retainedCopy(a,b){if(fs.existsSync(b)){if(hash(a)!==hash(b))throw Error('Retained dependency differs '+b);}else copy(a,b);return b;}
