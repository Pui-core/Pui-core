import fs from 'node:fs';
import {duration,fps,anchor,frames,sceneAt,trackWindows,characterBoxes} from './plan.mjs';
export const ticks=254016000000;
export const composition=p=>Object.values(p.items||{}).find(x=>x.kind?.type==='Comp');
export function prop(l,name){return l.props.children.find(x=>x.match==='transform').children.find(x=>x.match===name);}
export function valueAt(p,t){
 const k=p.keys;if(!k?.length)return p.value.v;
 const time=t*ticks;if(time<=k[0].time)return k[0].value.v;if(time>=k.at(-1).time)return k.at(-1).value.v;
 let i=1;while(k[i].time<time)i++;
 const a=k[i-1],b=k[i];
 if(a.out_interp!=='Linear'||b.in_interp!=='Linear')throw Error('Unsupported saved interpolation; use native sampler');
 const u=(time-a.time)/(b.time-a.time),av=a.value.v,bv=b.value.v;
 return Array.isArray(av)?av.map((x,j)=>x+(bv[j]-x)*u):av+(bv-av)*u;
}
export function projected(layer,rig,t,point=[0,0]){
 const p=valueAt(prop(layer,'position'),t),a=valueAt(prop(layer,'anchor'),t),s=valueAt(prop(layer,'scale'),t);
 const local=[p[0]+(point[0]-a[0])*s[0]/100,p[1]+(point[1]-a[1])*s[1]/100];
 if(layer.parent===null)return local;
 if(layer.parent!==rig.id)throw Error('Unexpected parent');
 const rp=valueAt(prop(rig,'position'),t),ra=valueAt(prop(rig,'anchor'),t),rs=valueAt(prop(rig,'scale'),t),r=valueAt(prop(rig,'rotation'),t)*Math.PI/180;
 const x=(local[0]-ra[0])*rs[0]/100,y=(local[1]-ra[1])*rs[1]/100;
 return [rp[0]+x*Math.cos(r)-y*Math.sin(r),rp[1]+x*Math.sin(r)+y*Math.cos(r)];
}
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function auditProject(p,layout){
 const comp=composition(p),layers=comp.kind.layers,rig=layers.find(x=>x.name.startsWith('STAGE CAMERA'));
 const checks=[],samples=[];const check=(id,pass,detail)=>checks.push({id,passed:!!pass,...(detail?{detail}:{})});
 check('canvas_and_time',comp.kind.width===1080&&comp.kind.height===1920&&comp.kind.duration===duration*ticks&&comp.kind.frame_rate.num/comp.kind.frame_rate.den===fps);
 const footage=Object.values(p.items).filter(x=>x.kind?.type==='Footage');
 check('media_import_boundary',footage.length===(layout.includeCharacter?characterBoxes(layout.variant).length+1:0));
 check('independent_camera',rig?.parent===null);
 check('camera_anchor',JSON.stringify(prop(rig,'anchor').value.v)===JSON.stringify([...anchor,0]));
 const marker=s=>layers.find(x=>x.name==='TRACKING PROBE '+s.id),spatial=layers.find(x=>x.name==='CAMERA SPATIAL PROBE');
 for(const f of frames){const s=sceneAt(f.time),m=marker(s);if(!m)throw Error('Saved probe layer missing');
  const screen=projected(m,rig,f.time),target=valueAt(prop(m,'position'),f.time);
  const tracking=trackWindows.some(w=>w.id===s.id&&f.time>=w.from&&f.time<=w.to);
  const error=Math.hypot(screen[0]-540,screen[1]-480);
  samples.push({...f,id:s.id,screen,target,spatialScreen:spatial?projected(spatial,rig,f.time):null,tracking,error});
 }
 const tracked=samples.filter(x=>x.tracking),maxError=Math.max(...tracked.map(x=>x.error));
 check('all_tracked_targets_centered',maxError<.02,{samples:tracked.length,maxErrorPixels:maxError});
 check('all_targets_in_view',samples.every(x=>x.screen[0]>=70&&x.screen[0]<=1010&&x.screen[1]>=200&&x.screen[1]<=720));
 for(const w of trackWindows){const a=tracked.filter(x=>x.id===w.id),motion=Math.max(...a.map(x=>x.target[0]))-Math.min(...a.map(x=>x.target[0]));check('moving_target_'+w.id,motion>20,{worldMotionPixels:motion});}
 const final=samples.filter(x=>x.time>=15.7);
 check('return_to_full_view_and_hold',final.every(x=>{const pos=valueAt(prop(rig,'position'),x.time),scale=valueAt(prop(rig,'scale'),x.time);return Math.hypot(pos[0]-540,pos[1]-480)<.01&&Math.abs(scale[0]-100)<.01;}),{frames:final.length});
 const reservations=characterBoxes(layout.variant),fixed=layers.filter(x=>/^CHARACTER ORIGINAL FIXED|^CHARACTER RESERVED/.test(x.name));
 check('character_outside_motion_tree',fixed.length===reservations.length&&fixed.every(l=>l.parent===null&&l.track_matte===null&&!l.switches.motion_blur&&!l.switches.three_d&&l.props.children.find(x=>x.match==='transform').children.every(x=>!x.keys?.length&&!x.expression&&!x.expr)),{reservedPeople:reservations.length});
 const movingText=layout.boxes.filter(x=>/^(HEADING|SUB|NOTE) /.test(x.name)),fixedText=layout.boxes.filter(x=>!movingText.includes(x));
 const collisions=[],outside=[],textCollisions=[];
 for(const f of frames){const visible=[];for(const b of [...movingText,...fixedText]){if(f.time<b.from||f.time>=b.to)continue;const l=layers.find(x=>x.id===b.layer);
   const original=valueAt(prop(l,'position'),b.from),delta=[b.x-original[0],b.y-original[1]];
   const corner=projected(l,rig,f.time,[delta[0],delta[1]]),rscale=l.parent===rig.id?valueAt(prop(rig,'scale'),f.time)[0]/100:1;
   const rect={x:corner[0],y:corner[1],width:b.width*rscale,height:b.height*rscale};
   visible.push({...rect,name:b.name});
   if(reservations.some(box=>overlaps(rect,box))&&!/^RESERVATION/.test(b.name))collisions.push({frame:f.frame,name:b.name});
   if(rect.x<0||rect.x+rect.width>1080||rect.y<0||rect.y+rect.height>1920)outside.push({frame:f.frame,name:b.name});
  }for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++)if(overlaps(visible[i],visible[j]))textCollisions.push({frame:f.frame,names:[visible[i].name,visible[j].name]});}
 check('text_never_covers_character_reservation',collisions.length===0,{violations:collisions.slice(0,5),count:collisions.length});
 check('text_inside_canvas_all_frames',outside.length===0,{violations:outside.slice(0,5),count:outside.length});
 check('text_boxes_never_overlap',textCollisions.length===0,{violations:textCollisions.slice(0,5),count:textCollisions.length});
 check('facts_current_without_fabricated_time',layout.boxes.some(x=>x.text==='セラ・ネージュ'||x.text==='先生は セラ・ネージュ')&&!layout.boxes.some(x=>/11\/24|22:00|ビンゴ|BINGO|150BPM|2026/.test(x.text)));
 check('visible_spatial_camera_reference',layers.some(x=>x.name==='STAGE SPATIAL REFERENCE BASELINE'&&x.parent===rig.id)&&spatial?.parent===rig.id&&!prop(spatial,'position').keys?.length);
 return {passed:checks.every(x=>x.passed),variant:layout.variant,checks,samples,characterImagesAIViewed:0,backgroundConfirmed:false,backgroundCandidateUsed:!!layout.backgroundCandidateUsed};
}
export function readAudit(projectFile,layoutFile){return auditProject(JSON.parse(fs.readFileSync(projectFile)),JSON.parse(fs.readFileSync(layoutFile)));}
