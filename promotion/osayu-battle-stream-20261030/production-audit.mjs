/** Saved-native checks; private media paths and hashes stay in private receipts. */
import fs from 'node:fs';import path from 'node:path';
import {acceptedBinding,stageBinding} from './binding.mjs';
import {root,save,hash} from './runtime.mjs';
import {auditProject,composition,prop,ticks} from './audit.mjs';
import {characterBoxes,duration,variantArg} from './plan.mjs';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function normalizedLayers(p,{safe=false}={}){
 const all=composition(p).kind.layers,names=new Map(all.map(l=>[l.id,l.name]));
 const visit=(v,k)=>k==='parent'&&v!==null?names.get(v):Array.isArray(v)?v.map(x=>visit(x)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['id','uid'].includes(k)).map(([k,x])=>[k,visit(x,k)])):v;
 return all.filter(l=>!l.name.includes('PROBE')&&(!safe||!/^CHARACTER |^RESERVATION LABEL|^SAFE PREVIEW|^FIXED BACKGROUND BASE/.test(l.name))).map(l=>visit(l));
}
function animated(v){return v&&typeof v==='object'&&Object.entries(v).some(([k,x])=>/^(keys|keyframes|expression|expr|expression_code)$/i.test(k)&&(Array.isArray(x)?x.length:!!x)||animated(x));}
export function fixedLayer(l,box){
 const value=n=>prop(l,n).value.v;
 return !!l&&l.parent===null&&l.track_matte===null&&l.auto_orient==='Off'&&l.in_point===0&&l.start_time===0&&l.out_point===duration*ticks&&l.stretch===100&&!animated(l.props)&&l.props.children.filter(x=>['effects','masks'].includes(x.match)).every(x=>!x.children.length)&&!l.switches.motion_blur&&!l.switches.three_d&&!l.switches.adjustment&&!l.switches.guide&&l.switches.frame_blend==='Off'&&l.blend_mode==='Normal'&&value('rotation')===0&&value('rotationX')===0&&value('rotationY')===0&&equal(value('orientation'),[0,0,0])&&value('opacity')===100&&equal(value('position'),[box.x+box.width/2,box.y+box.height/2,0])&&equal(value('anchor'),[box.sourceWidth/2,box.sourceHeight/2,0])&&equal(value('scale'),[box.width/box.sourceWidth*100,box.width/box.sourceWidth*100,100]);
}
export function productionAudit(variant){
 const binding=acceptedBinding(process.env.OSAYU158_BINDING,variant),assets=stageBinding(binding,root,variant);
 const read=n=>JSON.parse(fs.readFileSync(path.join(root,n)));
 const main=read(`projects/${variant}-production.ecproj`),probe=read(`projects/${variant}-production-probe.ecproj`),safe=read(`projects/${variant}-neutral.ecproj`);
 const layout=read(`qa/${variant}-production-probe-layout.json`),struct=auditProject(probe,layout),layers=composition(main).kind.layers;
 const checks=[...struct.checks],check=(id,passed)=>checks.push({id,passed:!!passed});
 check('clean_production_probe_shared_layers_equal',equal(normalizedLayers(main),normalizedLayers(probe)));
 check('safe_preview_moving_and_information_layers_equal',equal(normalizedLayers(main,{safe:true}),normalizedLayers(safe,{safe:true})));
 check('safe_preview_imports_nothing',!Object.values(safe.items).some(x=>x.kind?.type==='Footage'));
 const expected=[assets.background,...assets.characters],footage=Object.values(main.items).filter(x=>x.kind?.type==='Footage');
 check('private_media_exact_allowlist',footage.length===expected.length&&footage.every(x=>expected.includes(x.kind.path)&&!x.kind.missing));
 const boxes=characterBoxes(variant);
 check('characters_fixed_without_effects',boxes.every(b=>fixedLayer(layers.find(x=>x.name==='CHARACTER ORIGINAL FIXED '+b.id),b)));
 const bg=layers.find(x=>x.name.startsWith('FIXED BACKGROUND BASE')),scale=Math.max(1080/binding.background.width,1920/binding.background.height);
 check('unknown_background_independent_and_fixed',fixedLayer(bg,{x:540-binding.background.width*scale/2,y:960-binding.background.height*scale/2,width:binding.background.width*scale,height:binding.background.height*scale,sourceWidth:binding.background.width,sourceHeight:binding.background.height}));
 check('no_opaque_neutral_canvas',!layers.some(x=>/NEUTRAL CANVAS/.test(x.name)));
 check('no_global_image_effects',layers.every(x=>!x.switches.adjustment&&!['Camera','Light'].includes(x.source?.type)));
 const report={passed:checks.every(x=>x.passed),variant,checks,mainProjectHash:hash(path.join(root,`projects/${variant}-production.ecproj`)),backgroundProvenanceConfirmed:false,backgroundCharacterFree:null,backgroundFixed:true,characterAIInputs:0};
 save(path.join(root,'qa',variant+'-production-audit.private.json'),report);
 if(!report.passed)throw Error('Production audit failed: '+checks.filter(x=>!x.passed).map(x=>x.id).join(', '));
 console.log(JSON.stringify({variant,passed:true,checks:checks.length,backgroundProvenanceConfirmed:false,characterAIInputs:0}));return report;
}
if(process.argv[1]===new URL(import.meta.url).pathname)productionAudit(variantArg());
