import fs from 'node:fs';import path from 'node:path';
import {root,save,hash} from './runtime.mjs';
import {preview,cutFrames,cameraSample,synchronization} from './preview-plan-v09.mjs';
const TPS=254016000000;
function prop(l,p){let n=l.props;for(const k of p.split('/'))n=n.children.find(x=>x.match===k);if(!n)throw Error('missing '+p);return n;}
function at(p,f){if(!p.keys?.length)return p.value.v;const k=p.keys.find(x=>Math.abs(x.time-f/30*TPS)<2);if(!k)throw Error('missing frame key '+f);return k.value.v;}
const close=(a,b)=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-4);
for(const variant of process.argv.slice(2).length?process.argv.slice(2):['solo','collab']){
 const project=path.join(root,'projects',variant+'-candidate-neutral.ecproj'),binding=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-candidate-binding.json'))),p=JSON.parse(fs.readFileSync(project)),c=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind,layout=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-candidate-layout.json'))),ls=c.layers,rig=ls.find(l=>l.name==='COMMON PAN ZOOM - NO CHARACTER IMPORT');
 if(binding.projectSHA256!==hash(project)||binding.footage.some(x=>hash(x.path)!==x.sha256)||binding.characterImports!==0||c.duration!==preview.duration*TPS||c.width!==1080||c.height!==1920)throw Error('binding/comp');
 const imports=Object.values(p.items).filter(x=>x.kind?.type==='Footage');if(imports.length!==1||imports[0].kind.path!==binding.footage[0].path)throw Error('unsafe import');
 if(!close(prop(rig,'transform/anchor').value.v,[540,960,0])||prop(rig,'transform/anchor').keys?.length||prop(rig,'transform/anchor').expression||rig.parent!==null||rig.switches.three_d||rig.switches.motion_blur)throw Error('rig anchor/protection');
 for(const k of ['rotation','rotationX','rotationY','opacity']){const q=prop(rig,'transform/'+k);if(q.keys?.length||q.expression||q.value.v!==(k==='opacity'?100:0))throw Error('rig extra transform');}
 for(const l of ls)if(l.switches.solo||l.switches.guide)throw Error('unexpected visibility');
 let holds=1,maxHold=1,previous='',readFrames=0;const violations=[];
 for(let f=0;f<preview.frames;f++){
  const pos=at(prop(rig,'transform/position'),f),scale=at(prop(rig,'transform/scale'),f),expected=cameraSample(f,variant);if(!close(pos,expected.position)||!close(scale,expected.scale))throw Error('camera mismatch '+f);
  const sig=JSON.stringify([pos,scale]);if(sig===previous)holds++;else holds=1;maxHold=Math.max(maxHold,holds);previous=sig;
  const world=(x,y)=>[pos[0]+(x-540)*scale[0]/100,pos[1]+(y-960)*scale[1]/100];
  const index=f<85?0:1,a=cutFrames[index],b=cutFrames[index+1],pop=ls.find(l=>l.name==='POPUP ENTRY LAND EXIT '+index),pp=at(prop(pop,'transform/position'),f),ps=at(prop(pop,'transform/scale'),f),anchor=prop(pop,'transform/anchor').value.v;
  if(pop.parent!==rig.id||pop.switches.three_d||pop.switches.motion_blur)throw Error('popup hierarchy');
  if(f>=a+14&&f<b-10){readFrames++;
   for(const box of layout.bounds.filter(x=>x.fromFrame===a)){
    const l=ls.find(x=>x.name===box.name);if(l.parent!==pop.id)throw Error('text parent');
    const apply=(x,y)=>world(pp[0]+(x-anchor[0])*ps[0]/100,pp[1]+(y-anchor[1])*ps[1]/100);
    const q=apply(box.x,box.y),z=apply(box.x+box.width,box.y+box.height);
    if(q[0]<32||z[0]>1048||q[1]<150||z[1]>1780)violations.push({frame:f,name:box.name,q,z});
   }
  }
  for(const l of ls.filter(x=>x.name.startsWith('RESERVATION ONLY'))){
   if(l.parent!==rig.id||l.switches.three_d||l.switches.motion_blur||prop(l,'transform/position').keys?.length)throw Error('reservation transform');
   const p=prop(l,'transform/position').value.v,w=variant==='solo'?260:220,h=variant==='solo'?520:440,q=world(p[0]-w/2,p[1]-h/2),z=world(p[0]+w/2,p[1]+h/2);
   if(q[0]<24||z[0]>1056||q[1]<100||z[1]>1840)violations.push({frame:f,name:l.name,q,z});
  }
 }
 const report={variant,projectSHA256:hash(project),characterImports:0,frameCount:preview.frames,cuts:cutFrames.slice(0,-1).map((a,i)=>({fromFrame:a,toFrame:cutFrames[i+1],frames:cutFrames[i+1]-a})),maxCameraHoldFrames:maxHold,readableCheckedFrames:readFrames,readableTextOrReservationCropViolations:violations.length,violations:violations.slice(0,10),synchronization:synchronization.map(x=>({...x,deltaMs:Math.round((x.sourceSeconds-x.measuredTransient)*1000)})),actualRenderedMotionChecked:false,ownerCreativeAcceptance:false,TikTokVersionVerified:false};
 save(path.join(root,'qa',variant+'-candidate-native-audit.json'),report);
 if(violations.length||maxHold>=90||report.cuts.some(x=>x.frames>150))throw Error('native audit '+JSON.stringify(violations.slice(0,3)));
 console.log(JSON.stringify({variant,nativeAudit:true,frames:preview.frames,maxHold,readFrames}));
}
