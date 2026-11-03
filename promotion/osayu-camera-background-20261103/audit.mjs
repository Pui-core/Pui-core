import fs from 'node:fs';import path from 'node:path';
import {root,save,hash} from './runtime.mjs';
import {cameraAt,characterBoxes,scenesFor} from './plan.mjs';
export const TPS=254016000000;
export function prop(l,key){let n=l.props;for(const p of key.split('/'))n=n.children?.find(x=>x.match===p);if(!n)throw Error('Missing property '+key);return n;}
export function at(p,t){const k=p.keys;if(!k?.length)return p.value.v;const i=k.findIndex(x=>x.time>=t*TPS-1);if(i<0)return k.at(-1).value.v;if(i===0||Math.abs(k[i].time-t*TPS)<2)return k[i].value.v;const a=k[i-1],b=k[i],u=(t*TPS-a.time)/(b.time-a.time);if(a.out_interp!=='Linear'||b.in_interp!=='Linear')throw Error('Unhandled interpolation');return Array.isArray(a.value.v)?a.value.v.map((x,j)=>x+(b.value.v[j]-x)*u):a.value.v+(b.value.v-a.value.v)*u;}
const close=(a,b)=>Array.isArray(a)?a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-4):Math.abs(a-b)<1e-4;
function protectedLayer(l,parent,animated=[]){
 const s=l.switches,masks=l.props.children.find(x=>x.match==='masks');
 if(l.parent!==parent||l.start_time!==0||l.in_point!==0||l.out_point!==19*TPS||l.stretch!==100||!s.video||s.guide||s.three_d||s.motion_blur||s.adjustment||s.collapse||s.frame_blend!=='Off'||l.blend_mode!=='Normal'||l.preserve_transparency||l.track_matte||l.auto_orient!=='Off'||prop(l,'effects').children.length||masks?.children.length)throw Error('Layer rendering protection: '+l.name);
 for(const p of prop(l,'transform').children)if(p.expression||(!animated.includes(p.match)&&p.keys?.length))throw Error('Unexpected animated transform: '+l.name+'/'+p.match);
 for(const [key,value] of Object.entries({orientation:[0,0,0],rotationX:0,rotationY:0,rotation:0,opacity:100}))if(!close(prop(l,'transform/'+key).value.v,value))throw Error('Layer fixed transform: '+l.name+'/'+key);
}
export function audit(project,layout,variant,mode){
 const c=Object.values(project.items).find(i=>i.kind?.type==='Comp').kind,ls=c.layers,rig=ls.find(l=>l.name==='WORLD CAMERA - PAN ZOOM ONLY'),bg=ls.find(l=>l.name==='PHOTOCRAFT ORIGINAL BACKGROUND');
 if(!rig||!bg||c.width!==1080||c.height!==1920||c.duration!==19*TPS||c.frame_rate.num!==30||c.frame_rate.den!==1)throw Error('Composition contract');
 if(ls.some(l=>l.switches.solo))throw Error('Solo layer would change composition visibility');
 protectedLayer(rig,null,['position','scale']);
 if(!close(prop(rig,'transform/anchor').value.v,[540,960,0]))throw Error('World rig anchor');
 const boxes=characterBoxes(variant),records=[],violations=[];
 for(const b of boxes){
  const l=ls.find(l=>l.name===(mode==='neutral'?'RESERVATION ':'ORIGINAL CHARACTER ')+b.id);
  if(!l)throw Error('Missing character layer');
  protectedLayer(l,rig.id);
  const pos=prop(l,'transform/position'),scale=prop(l,'transform/scale'),anchor=prop(l,'transform/anchor');
  const expectedPosition=[b.x+b.w/2,b.y+b.h/2,0];
  if(!close(pos.value.v,expectedPosition))throw Error('Parent compensation changed character position');
  if(mode==='production'&&(!close(scale.value.v,[b.w/b.sw*100,b.w/b.sw*100,100])||!close(anchor.value.v,[b.sw/2,b.sh/2,0])))throw Error('Character local transform');
  if(mode==='neutral'&&(!close(scale.value.v,[100,100,100])||!close(anchor.value.v,[0,0,0])))throw Error('Reservation local transform');
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
