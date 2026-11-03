import fs from 'node:fs';import path from 'node:path';
import {root,save,hash} from './runtime.mjs';import {prop,at,TPS} from './native-props-v09.mjs';
import {framesFor,durationFor,cutFramesFor,characterBoxes,scenesFor,cameraAtFrame,popupAtFrame} from './full-plan-v09.mjs';
const close=(a,b)=>Array.isArray(a)?Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-4):Math.abs(a-b)<1e-4;
function staticProp(l,k,v){const p=prop(l,k);if(p.keys?.length||p.expression||!close(p.value.v,v))throw Error('fixed '+l.name+'/'+k);}
function protectedLayer(l,parent,duration,animated=[]){
 const s=l.switches,masks=l.props.children.find(x=>x.match==='masks');
 if(l.parent!==parent||l.start_time!==0||l.in_point!==0||l.out_point!==duration*TPS||l.stretch!==100||!s.video||s.guide||s.solo||s.three_d||s.motion_blur||s.adjustment||s.collapse||s.frame_blend!=='Off'||l.blend_mode!=='Normal'||l.preserve_transparency||l.track_matte||l.auto_orient!=='Off'||prop(l,'effects').children?.length||masks?.children?.length)throw Error('protected '+l.name);
 for(const p of prop(l,'transform').children)if(p.expression||(!animated.includes(p.match)&&p.keys?.length))throw Error('animated '+l.name+'/'+p.match);
 for(const [k,v] of Object.entries({orientation:[0,0,0],rotationX:0,rotationY:0,rotation:0,opacity:100}))staticProp(l,'transform/'+k,v);
}
export function audit(project,layout,variant,mode){
 const frames=framesFor(variant),duration=durationFor(variant),c=Object.values(project.items).find(x=>x.kind?.type==='Comp').kind,ls=c.layers,rig=ls.find(l=>l.name==='WORLD CAMERA - PAN ZOOM ONLY'),bg=ls.find(l=>l.name==='PHOTOCRAFT ORIGINAL BACKGROUND'),cam=ls.find(l=>l.name==='BACKGROUND PERSPECTIVE ONLY');
 if(c.width!==1080||c.height!==1920||c.duration!==duration*TPS||c.frame_rate.num!==30||c.frame_rate.den!==1||!rig||!bg||!cam||ls.some(l=>l.switches.solo||l.switches.guide))throw Error('comp');
 protectedLayer(rig,null,duration,['position','scale']);staticProp(rig,'transform/anchor',[540,960,0]);
 staticProp(bg,'transform/anchor',[800,1422,0]);staticProp(bg,'transform/position',[540,960,0]);staticProp(bg,'transform/scale',[100,100,100]);
 const boxes=characterBoxes(variant),scenes=scenesFor(variant),violations=[];
 for(const b of boxes){const l=ls.find(x=>x.name===(mode==='neutral'?'RESERVATION ':'ORIGINAL CHARACTER ')+b.id);if(!l)throw Error('character layer');protectedLayer(l,rig.id,duration);staticProp(l,'transform/position',[b.x+b.w/2,b.y+b.h/2,0]);staticProp(l,'transform/anchor',mode==='neutral'?[0,0,0]:[b.sw/2,b.sh/2,0]);staticProp(l,'transform/scale',mode==='neutral'?[100,100,100]:[b.w/b.sw*100,b.w/b.sw*100,100]);}
 let holds=1,maxHold=1,previous='',readableFrames=0;const zooms=[];
 for(let frame=0;frame<frames;frame++){
  const t=frame/30,p=at(prop(rig,'transform/position'),t),scale=at(prop(rig,'transform/scale'),t),expected=cameraAtFrame(frame,variant);
  if(!close(p,expected.position)||!close(scale,expected.scale)||!close(at(prop(bg,'transform/rotationY'),t),expected.yaw)||!close(at(prop(bg,'transform/rotationX'),t),expected.pitch))throw Error('camera/bg sample '+frame);
  if(!close(at(prop(cam,'transform/position'),t),[540+(expected.target[0]-540)*.65,960+(expected.target[1]-960)*.65,-1800/expected.zoom]))throw Error('perspective camera sample');
  const sig=JSON.stringify([p,scale]);holds=sig===previous?holds+1:1;maxHold=Math.max(maxHold,holds);previous=sig;zooms.push(scale[0]/100);
  const world=(x,y)=>[p[0]+(x-540)*scale[0]/100,p[1]+(y-960)*scale[1]/100];
  for(const b of boxes){const a=world(b.x,b.y),z=world(b.x+b.w,b.y+b.h);if(a[0]<24||z[0]>1056||a[1]<100||z[1]>1840)violations.push({frame,kind:'character-crop',id:b.id,a,z});}
  const s=scenes.find(s=>frame>=s.fromFrame&&frame<s.toFrame),pop=ls.find(x=>x.name==='POPUP '+s.id),pp=at(prop(pop,'transform/position'),t),ps=at(prop(pop,'transform/scale'),t),pe=popupAtFrame(frame,s);
  staticProp(pop,'transform/anchor',[...s.center,0]);if(pop.parent!==rig.id||!close(pp,pe.position)||!close(ps,pe.scale)||pop.switches.three_d||pop.switches.motion_blur||prop(pop,'effects').children?.length||pop.props.children.find(x=>x.match==='masks')?.children?.length)throw Error('popup '+frame);
  if(frame>=s.readFrom&&frame<s.readTo){readableFrames++;
   for(const b of layout.bounds.filter(x=>frame>=x.fromFrame&&frame<x.toFrame)){
    const l=ls.find(x=>x.name===b.name);if(l.parent!==pop.id)throw Error('text parent');staticProp(l,'transform/anchor',b.anchor);staticProp(l,'transform/scale',[100,100,100]);
    if(!close(at(prop(l,'transform/position'),t),b.position))throw Error('text not landed '+b.name);
    const apply=(x,y)=>world(pp[0]+(x-s.center[0])*ps[0]/100,pp[1]+(y-s.center[1])*ps[1]/100),a=apply(b.x,b.y),z=apply(b.x+b.width,b.y+b.height);
    if(a[0]<32||z[0]>1048||a[1]<150||z[1]>1780)violations.push({frame,kind:'text-crop',name:b.name,a,z});
   }
  }
 }
 const cuts=cutFramesFor(variant).slice(0,-1).map((a,i)=>({fromFrame:a,toFrame:cutFramesFor(variant)[i+1],frames:cutFramesFor(variant)[i+1]-a}));
 if(violations.length)throw Error('crop '+JSON.stringify(violations.slice(0,8)));
 if(maxHold>=90||cuts.some(x=>x.frames>150))throw Error('duration rule');
 return {frames,duration,cuts,maxCameraHoldFrames:maxHold,readableFrames,characterLocalTransformsProtected:true,textReadableCropViolations:0,characterCropViolations:0,minZoom:Math.min(...zooms),maxZoom:Math.max(...zooms),personMediaAIInputs:0,creativeAcceptance:'UNVERIFIED',TikTokIDRequiredForPrivateDelivery:false};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/full-audit-v09.mjs')){
 const [variant,mode]=process.argv.slice(2),stem=variant+'-'+mode,p=path.join(root,'projects',stem+'.ecproj'),binding=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-binding.json')));
 if(binding.projectSHA256!==hash(p)||binding.footage.some(x=>hash(x.path)!==x.sha256))throw Error('binding');
 const result=audit(JSON.parse(fs.readFileSync(p)),JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-layout.json'))),variant,mode);
 save(path.join(root,'qa',stem+'-audit.json'),{...result,projectSHA256:hash(p)});console.log(JSON.stringify(result));
}
