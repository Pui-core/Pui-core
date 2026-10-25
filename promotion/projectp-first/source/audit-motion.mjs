import fs from 'node:fs';
import {episodes} from './episodes.mjs';
import {stem} from './produce.mjs';
import {file,hash,save,readText} from './native.mjs';
const tick=254016000000;
const props=l=>Object.fromEntries(l.props.children.find(x=>x.match==='transform').children.map(x=>[x.match,x]));
function at(p,t){const k=p.keys?.find(x=>Math.abs(x.time/tick-t)<1e-5);if(!k)throw Error('Missing saved key '+p.match+' @ '+t);return k.value.v;}
for(const e of episodes){
const id=stem(e),p=JSON.parse(readText(file('projects/'+id+'.ecproj'))),comp=Object.values(p.items).find(x=>x.kind.type==='Comp'),ls=comp.kind.layers,m=JSON.parse(readText(file('qa/'+id+'/layout-and-motion.json'))),records=[];
for(const name of ['Hook top','Hook question','PUI reveal'])if(ls.filter(x=>x.name===name).length!==1)throw Error('Duplicate/missing named text: '+name);
let max=0;
for(const row of m.motionLedger){const l=ls.find(l=>l.id===row.layer),v=ls.find(l=>l.name==='Source '+row.scene),tr=props(l),nativeSource=props(v),base=nativeSource.scale.value.v[0]/100,childPos=nativeSource.position.value.v,anchor=tr.anchor.value.v;
if(v.parent!==l.id||Math.abs(base-row.baseScale)>1e-5)throw Error('Parent/base scale differs');
for(const k of row.keys){const pos=at(tr.position,k.time),z=at(tr.scale,k.time)[0]/100,r=at(tr.rotation,k.time)*Math.PI/180,dx=(childPos[0]-anchor[0]+(k.focus[0]-row.sourceSize[0]/2)*base)*z,dy=(childPos[1]-anchor[1]+(k.focus[1]-row.sourceSize[1]/2)*base)*z,screen=[pos[0]+dx*Math.cos(r)-dy*Math.sin(r),pos[1]+dx*Math.sin(r)+dy*Math.cos(r)];
const enter=Math.abs(k.time-e.shots[row.scene].a)<1e-5&&/^slide/.test(e.shots[row.scene].transition||''),expected=[(e.shots[row.scene].kind==='chat'?500:540)+(enter?(e.shots[row.scene].transition==='slideL'?1280:-1280):0),960],err=Math.hypot(screen[0]-expected[0],screen[1]-expected[1]);
if(err>.01||Math.abs(pos[0]-k.position[0])>.01||Math.abs(pos[1]-k.position[1])>.01)throw Error('Native camera mismatch '+row.scene+' @ '+k.time+' '+JSON.stringify({screen,expected,err}));
max=Math.max(max,err);records.push({scene:row.scene,time:k.time,focus:k.focus,screen,expected,entering:enter,errorPx:err});}
if(['contain','pixel'].includes(e.shots[row.scene].fit)&&v.switches.motion_blur)throw Error('Unexpected UI/pixel blur');}
const captions=m.boxes.filter(b=>/^(Punch|Hook|PUI reveal|Signature|Real question)/.test(b.name));
for(const b of captions)if(b.center[0]-b.width/2<25||b.center[0]+b.width/2>980||b.center[1]-b.height/2<300||b.center[1]+b.height/2>1500)throw Error('Main text outside chosen design bounds '+b.name);
save('qa/'+id+'/saved-motion-audit.json',{status:'SAVED_NATIVE_KEYS_MATCH_FOCUS_PLAN',nativeSha256:hash(file('projects/'+id+'.ecproj')),rigs:m.motionLedger.length,keys:records.length,maxFocusErrorAtKeysPx:max,uniqueHookAndName:true,mainTextDesignBounds:{x:[25,980],y:[300,1500]},scope:'Saved native child/parent transforms at keys and declared text landing bounds. Does not assert full continuous actor tracking or guaranteed safety under every platform UI.',records});
console.log('Saved native focus verified: '+records.length+' keys / '+captions.length+' main text boxes');
}
