import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {root,save} from './runtime.mjs';import {audit,prop} from './audit.mjs';
// Exercise the actual saved project. Never modify the original file.
const variant=process.argv[2];if(!['solo','collab'].includes(variant))throw Error('variant');
const original=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-production.ecproj'))),layout=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-production-layout.json')));
const characterCases=[
 ['detached character',l=>{l.parent=null;}],
 ['first-frame compensation baked into position',l=>{prop(l,'transform/position').value.v[0]+=60;}],
 ['character rotation',l=>{prop(l,'transform/rotation').value.v=3;}],
 ['character 3D enabled',l=>{l.switches.three_d=true;}],
 ['character blur enabled',l=>{l.switches.motion_blur=true;}],
 ['character hidden',l=>{l.switches.video=false;}],
 ['character blend mode',l=>{l.blend_mode='Multiply';}],
 ['character mask',l=>{prop(l,'masks').children.push({node:'Group',match:'mask'});}],
 ['character guide layer',l=>{l.switches.guide=true;}],
 ['character time stretch',l=>{l.stretch=50;}]
];
const rigCases=[
 ['rig opacity',l=>{prop(l,'transform/opacity').value.v=0;}],
 ['rig anchor',l=>{prop(l,'transform/anchor').value.v=[0,0,0];}],
 ['rig animated opacity',l=>{prop(l,'transform/opacity').keys=[{time:0,value:{t:'Scalar',v:0}}];}],
 ['rig expression',l=>{prop(l,'transform/position').expression='[0,0,0]';}],
 ['rig parent',l=>{l.parent=999;}],
 ['rig solo',l=>{l.switches.solo=true;}]
];
const cases=[...characterCases.map(x=>[...x,'ORIGINAL CHARACTER ']),...rigCases.map(x=>[...x,'WORLD CAMERA'])];
audit(original,layout,variant,'production');
for(const [name,change,prefix] of cases){const p=structuredClone(original),c=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind,l=c.layers.find(x=>x.name.startsWith(prefix));change(l);assert.throws(()=>audit(p,layout,variant,'production'),undefined,name);}
save(path.join(root,'qa',variant+'-negative-audit.json'),{rejected:cases.map(x=>x[0]),originalFileModified:false});console.log('Rejected all '+cases.length+' unsafe mutations: '+variant);
