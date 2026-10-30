import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {auditProject,composition,prop,ticks} from './audit.mjs';
import {acceptedBinding} from './binding.mjs';
import {composition as generatedComposition} from './motion.mjs';
const root=process.env.OSAYU158_ROOT;
if(!root)throw Error('Run against the actual saved neutral native project');
const variant=process.env.OSAYU158_VARIANT||'solo';
const project=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-neutral-probe.ecproj'))),layout=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-neutral-probe-layout.json')));
const mutated=change=>{const p=structuredClone(project);change(composition(p).kind.layers);return auditProject(p,layout);};
const failed=(r,id)=>r.checks.find(x=>x.id===id)?.passed===false;
test('actual saved neutral native project passes',()=>assert.equal(auditProject(project,layout).passed,true));
test('saved native build scripts match current Source except empty lines',()=>{
 const normalized=s=>s.split('\n').filter(x=>x.trim()).join('\n');
 for(const probe of [false,true]){const name=variant+'-neutral'+(probe?'-probe':'')+'.jsx';assert.equal(normalized(fs.readFileSync(path.join(root,'source',name),'utf8')),normalized(generatedComposition({variant,probe})));}
});
test('fixed camera regression is rejected',()=>{const r=mutated(l=>{const c=l.find(x=>x.name.startsWith('STAGE CAMERA'));for(const n of ['position','scale','rotation'])prop(c,n).keys=[];});assert.ok(failed(r,'all_tracked_targets_centered'));});
test('wrong moving target is rejected',()=>{const r=mutated(l=>{const m=l.find(x=>x.name==='TRACKING PROBE teacher');for(const k of prop(m,'position').keys)k.value.v[0]+=140;});assert.ok(failed(r,'all_tracked_targets_centered'));});
test('failure to return to full view is rejected',()=>{const r=mutated(l=>{const c=l.find(x=>x.name.startsWith('STAGE CAMERA'));for(const k of prop(c,'scale').keys)if(k.time>=15.7*ticks)k.value.v=[128,128,100];});assert.ok(failed(r,'return_to_full_view_and_hold'));});
test('parenting the character reservation to camera is rejected',()=>{const r=mutated(l=>{const c=l.find(x=>x.name.startsWith('STAGE CAMERA'));l.find(x=>x.name.startsWith('CHARACTER RESERVED')).parent=c.id;});assert.ok(failed(r,'character_outside_motion_tree'));});
test('camera pan without the fixed-world spatial reference is rejected',()=>{const r=mutated(l=>{l.find(x=>x.name==='CAMERA SPATIAL PROBE').parent=null;});assert.ok(failed(r,'visible_spatial_camera_reference'));});
test('production without explicit accepted background binding is rejected',()=>{assert.throws(()=>acceptedBinding(),/BACKGROUND_UNCONFIRMED/);assert.throws(()=>acceptedBinding(new URL('./binding.example.json',import.meta.url)),/BACKGROUND_UNCONFIRMED/);});
test('both production CLIs refuse before writing or launching native tools',()=>{
 const env={...process.env};delete env.OSAYU158_BINDING;
 for(const file of ['build.mjs','render.mjs']){const r=spawnSync(process.execPath,[new URL('./'+file,import.meta.url).pathname,'production','--variant',variant],{env,encoding:'utf8',timeout:5000});assert.equal(r.status,1);assert.match(r.stderr,/BACKGROUND_UNCONFIRMED/);}
 assert.equal(fs.existsSync(path.join(root,'projects',variant+'-production.ecproj')),false);
 assert.equal(fs.existsSync(path.join(root,'videos',variant+'-production.mp4')),false);
});
test('clean neutral and probe native projects have identical shared layers',()=>{
 const clean=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-neutral.ecproj')));
 const normalized=p=>{const l=composition(p).kind.layers,names=new Map(l.map(x=>[x.id,x.name]));
  function visit(v,key){if(key==='parent'&&v!==null)return names.get(v);if(Array.isArray(v))return v.map(x=>visit(x));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!['id','uid'].includes(k)).map(([k,x])=>[k,visit(x,k)]));return v;}
  return l.filter(x=>!x.name.startsWith('TRACKING PROBE')&&x.name!=='CAMERA SPATIAL PROBE').map(x=>visit(x));};
 assert.deepEqual(normalized(project),normalized(clean));
});
