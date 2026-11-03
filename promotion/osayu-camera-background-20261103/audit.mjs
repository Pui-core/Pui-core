import fs from 'node:fs';import path from 'node:path';
import {root,save,hash} from './runtime.mjs';
import {cameraAt,characterBoxes,scenesFor} from './plan.mjs';
export const TPS=254016000000;
export function prop(l,key){let n=l.props;for(const p of key.split('/'))n=n.children?.find(x=>x.match===p);if(!n)throw Error('Missing property '+key);return n;}
export function at(p,t){const k=p.keys;if(!k?.length)return p.value.v;const i=k.findIndex(x=>x.time>=t*TPS-1);if(i<0)return k.at(-1).value.v;if(i===0||Math.abs(k[i].time-t*TPS)<2)return k[i].value.v;const a=k[i-1],b=k[i],u=(t*TPS-a.time)/(b.time-a.time);if(a.out_interp!=='Linear'||b.in_interp!=='Linear')throw Error('Unhandled interpolation');return Array.isArray(a.value.v)?a.value.v.map((x,j)=>x+(b.value.v[j]-x)*u):a.value.v+(b.value.v-a.value.v)*u;}
const close=(a,b)=>Array.isArray(a)?a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-4):Math.abs(a-b)<1e-4;
export function audit(project,layout,variant,mode){
 const c=Object.values(project.items).find(i=>i.kind?.type==='Comp').kind,ls=c.layers,rig=ls.find(l=>l.name==='WORLD CAMERA - PAN ZOOM ONLY'),bg=ls.find(l=>l.name==='PHOTOCRAFT ORIGINAL BACKGROUND');
 if(!rig||!bg||c.width!==1080||c.height!==1920||c.duration!==19*TPS||c.frame_rate.num!==30||c.frame_rate.den!==1)throw Error('Composition contract');
 if(rig.switches.three_d||rig.switches.motion_blur||prop(rig,'effects').children.length||!close(prop(rig,'transform/rotation').value.v,0))throw Error('World rig must only pan/zoom');
 const boxes=characterBoxes(variant),records=[],violations=[];
 for(const b of boxes){
  const l=ls.find(l=>l.name===(mode==='neutral'?'RESERVATION ':'ORIGINAL CHARACTER ')+b.id);
  if(!l||l.parent!==rig.id||l.switches.three_d||l.switches.motion_blur||l.track_matte||l.in_point!==0||l.out_point!==19*TPS||prop(l,'effects').children.length)throw Error('Character layer protection');
  const pos=prop(l,'transform/position'),scale=prop(l,'transform/scale'),anchor=prop(l,'transform/anchor');
  const expectedPosition=[b.x+b.w/2,b.y+b.h/2,0];
  if(!close(pos.value.v,expectedPosition))throw Error('Parent compensation changed character position');
  if(mode==='production'&&(!close(scale.value.v,[b.w/b.sw*100,b.w/b.sw*100,100])||!close(anchor.value.v,[b.sw/2,b.sh/2,0])))throw Error('Character local transform');
  for(const p of prop(l,'transform').children)if(p.keys?.length||p.expression)throw Error('Animated character local transform');
  if(!close(prop(l,'transform/rotation').value.v,0)||!close(prop(l,'transform/opacity').value.v,100))throw Error('Character rotation/opacity');
 }
 for(let frame=0;frame<570;frame++){
  const t=frame/30,p=at(prop(rig,'transform/position'),t),s=at(prop(rig,'transform/scale'),t),expected=cameraAt(t,variant);
  if(!close(p,expected.position)||!close(s,expected.scale))throw Error('Saved camera differs at '+frame);
  const apply=(x,y)=>[p[0]+(x-540)*s[0]/100,p[1]+(y-960)*s[1]/100];
  for(const b of boxes){const a=apply(b.x,b.y),z=apply(b.x+b.w,b.y+b.h);if(a[0]<24||z[0]>1056||a[1]<100||z[1]>1840)violations.push({frame,kind:'character-crop',id:b.id,a,z});}
  for(const b of layout.bounds.filter(x=>t>=x.from&&t<x.to)){
   const l=ls.find(x=>x.name===b.name),lp=at(prop(l,'transform/position'),t),scene=scenesFor(variant).find(x=>x.id===b.name.split(' ').at(-1));
   const offset=b.name.startsWith('SUB')?-107:b.name.startsWith('HEADING')?28:115;
   if(!close(lp,[scene.center[0],scene.center[1]+offset,0]))throw Error('Text local transform differs');
   const a=apply(b.x,b.y),z=apply(b.x+b.width,b.y+b.height);
   if(a[0]<32||z[0]>1048||a[1]<150||z[1]>1780)violations.push({frame,kind:'text-crop',name:b.name,a,z});
  }
  records.push({frame,position:p,zoom:s[0]/100});
 }
 if(violations.length)throw Error('Crop violations '+JSON.stringify(violations.slice(0,8)));
 return {frames:570,characterLocalTransformsProtected:true,textCropViolations:0,characterCropViolations:0,rotationOnCharacters:false,motionSummary:{minZoom:Math.min(...records.map(x=>x.zoom)),maxZoom:Math.max(...records.map(x=>x.zoom)),xRange:[Math.min(...records.map(x=>x.position[0])),Math.max(...records.map(x=>x.position[0]))],yRange:[Math.min(...records.map(x=>x.position[1])),Math.max(...records.map(x=>x.position[1]))]},creativeAcceptance:'UNVERIFIED'};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/audit.mjs')){
 const [variant,mode]=process.argv.slice(2),stem=variant+'-'+mode,p=path.join(root,'projects',stem+'.ecproj');
 const result=audit(JSON.parse(fs.readFileSync(p)),JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-layout.json'))),variant,mode);
 save(path.join(root,'qa',stem+'-audit.json'),{...result,projectSHA256:hash(p)});console.log(JSON.stringify(result));
}
