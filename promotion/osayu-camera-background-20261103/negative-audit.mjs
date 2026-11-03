import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {root,save} from './runtime.mjs';import {audit,prop} from './audit.mjs';
// Exercise the actual saved project. Never modify the original file.
const variant=process.argv[2];if(!['solo','collab'].includes(variant))throw Error('variant');
const original=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-production.ecproj'))),layout=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-production-layout.json')));
const cases=[
 ['detached character',l=>{l.parent=null;}],
 ['first-frame compensation baked into position',l=>{prop(l,'transform/position').value.v[0]+=60;}],
 ['character rotation',l=>{prop(l,'transform/rotation').value.v=3;}],
 ['character 3D enabled',l=>{l.switches.three_d=true;}],
 ['character blur enabled',l=>{l.switches.motion_blur=true;}]
];
for(const [name,change] of cases){const p=structuredClone(original),c=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind,l=c.layers.find(x=>x.name.startsWith('ORIGINAL CHARACTER '));change(l);assert.throws(()=>audit(p,layout,variant,'production'),undefined,name);}
save(path.join(root,'qa',variant+'-negative-audit.json'),{rejected:cases.map(x=>x[0]),originalFileModified:false});console.log('Rejected all 5 unsafe mutations: '+variant);
