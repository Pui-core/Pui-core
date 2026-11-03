import fs from 'node:fs';
import path from 'node:path';
import {root, hash, save} from './runtime.mjs';
import {prop, at, TPS} from './audit.mjs';
import {scenesFor} from './plan.mjs';

// Saved native values, not declared durations or file/clip boundaries.
export function auditCuts(project, variant) {
 const c=Object.values(project.items).find(x=>x.kind?.type==='Comp')?.kind;
 if(!c||c.duration!==19*TPS||c.frame_rate.num!==30||c.frame_rate.den!==1)throw Error('Cut audit composition');
 const layers=c.layers,rig=layers.find(x=>x.name==='WORLD CAMERA - PAN ZOOM ONLY');
 const bg=layers.find(x=>x.name==='PHOTOCRAFT ORIGINAL BACKGROUND'),camera=layers.find(x=>x.name==='BACKGROUND DEPTH CAMERA');
 if(!rig||!bg||!camera)throw Error('Missing camera');
 const state=frame=>{
  const t=frame/30;
  return [...at(prop(rig,'transform/position'),t),...at(prop(rig,'transform/scale'),t),at(prop(bg,'transform/rotationY'),t),at(prop(bg,'transform/rotationX'),t),...at(prop(camera,'transform/position'),t),...at(prop(camera,'transform/poi'),t)];
 };
 const samples=Array.from({length:570},(_,f)=>state(f));
 if(samples.some(s=>s.some(x=>!Number.isFinite(x))))throw Error('Non-finite camera');
 const signatures=samples.map(s=>JSON.stringify(s.map(x=>Math.round(x*1e8)/1e8)));
 const holds=[];let start=0;
 // Do not reset stationary duration at text or clip boundaries.
 for(let f=1;f<=570;f++)if(f===570||signatures[f]!==signatures[start]){holds.push({fromFrame:start,toFrameExclusive:f,frames:f-start});start=f;}
 const maxStillFrames=Math.max(...holds.map(x=>x.frames));
 if(maxStillFrames>=90)throw Error('Continuous still >=3 seconds');
 const cuts=scenesFor(variant).map(scene=>{
  const from=Math.round(scene.from*30),to=Math.round(scene.to*30);
  if(Math.abs(from-scene.from*30)>1e-8||Math.abs(to-scene.to*30)>1e-8||to-from>150)throw Error('Moving cut >5 seconds or off grid');
  for(const prefix of ['HEADING ','SUB ','NOTE ']){
   const l=layers.find(x=>x.name===prefix+scene.id);
   if(!l||l.in_point!==from*TPS/30||l.out_point!==to*TPS/30)throw Error('Saved information timing mismatch');
  }
  if(new Set(signatures.slice(from,to)).size<=1)throw Error('No camera motion in cut');
  let boundary=null;
  if(from){
   const a=samples[from-1],b=samples[from],positionJump=Math.hypot(b[0]-a[0],b[1]-a[1]),scaleJump=Math.abs(b[3]-a[3]);
   if(positionJump<60&&scaleJump<8)throw Error('Camera continues through cut boundary');
   boundary={beforeFrame:from-1,afterFrame:from,positionJumpPixels:positionJump,scaleJumpPercentagePoints:scaleJump};
  }
  return {id:scene.id,fromFrame:from,toFrameExclusive:to,frames:to-from,seconds:(to-from)/30,boundary};
 });
 return {cuts,maxStillFrames,maxStillSeconds:maxStillFrames/30,holds:holds.filter(x=>x.frames>1),frames:570,requiresSafeNeutralVisualConfirmation:true,creativeAcceptance:'UNVERIFIED'};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/cut-audit.mjs')){
 const [variant,mode]=process.argv.slice(2);
 if(!['solo','collab'].includes(variant)||!['neutral','production'].includes(mode))throw Error('Arguments');
 const project=path.join(root,'projects',variant+'-'+mode+'.ecproj');
 const result={...auditCuts(JSON.parse(fs.readFileSync(project)),variant),projectSHA256:hash(project)};
 save(path.join(root,'qa',variant+'-'+mode+'-cut-audit.json'),result);
 console.log(JSON.stringify({variant,mode,maxStillSeconds:result.maxStillSeconds,cuts:result.cuts}));
}
