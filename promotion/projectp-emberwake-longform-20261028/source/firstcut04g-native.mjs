import fs from 'node:fs';
import {file,np,EC,FP,run,parse,save,copy,hash} from './native.mjs';

// Build an independent native revision; retain 04f and its master untouched.
const E=JSON.parse(fs.readFileSync(file('source/firstcut04f-edit.json'))),project=file('projects/emberwake-firstcut04g.ecproj');
if(fs.existsSync(project))throw Error('04g project already exists; retain it');
copy(file('projects/emberwake-firstcut04f.ecproj'),project);
const p=JSON.parse(fs.readFileSync(project)),layers=p.items[p.activeComp].kind.layers;
const ids=[237,12484,357,381,2565,12868,2613,12892];
for(const id of ids)if(!layers.some(l=>l.id===id&&l.switches.video))throw Error('Expected 04f enabled layer missing '+id);
const replay=Object.values(p.items).find(i=>i.kind?.type==='Footage'&&i.name==='ep01-replay-controls01-game.mp4');
if(!replay||replay.id!==4)throw Error('Pinned episode 1 replay source mismatch');
const old=E.shots.filter(s=>s.unit==='u006'&&s.file==='media/ep02-game.mp4');
if(old.length!==2||old[0].start!==919||old[1].end!==1088)throw Error('Old episode-2 footage does not match observed interval');
const replayParts=[{start:919,end:999,sourceStart:690,scale:100,anchor:[960,540],position:[960,540]}, {start:999,end:1088,sourceStart:770,scale:150,anchor:[960,700],position:[960,600]}];
E.shots=E.shots.filter(s=>!old.includes(s));
for(const [i,s] of replayParts.entries())E.shots.push({id:'u006 episode1 replay 04g '+i,file:'media/ep01-replay-controls01-game.mp4',sourceStart:s.sourceStart,start:s.start,end:s.end,unit:'u006',kind:'actual-play',sourceEpisode:1,camera:{anchor:s.anchor,position:s.position,scale:s.scale}});
for(const s of E.shots.filter(s=>s.unit==='u005'&&s.kind==='context-actual-play'))s.camera={anchor:[960,700],position:[960,600],scale:150};
for(const s of E.shots.filter(s=>['u050','u051'].includes(s.unit)&&s.kind==='actual-ui'))s.camera={anchor:[800,400],position:[960,520],scale:130};
E.shots.sort((a,b)=>a.start-b.start);
const used=[];for(const s of E.shots.filter(s=>s.file==='media/ep01-replay-controls01-game.mp4')){const a=s.sourceStart,b=a+s.end-s.start;for(const x of used)if(a<x.b&&b>x.a)throw Error('Replay footage overlaps '+s.id+' / '+x.id);used.push({a,b,id:s.id});}
E.name='emberwake-firstcut04g';E.visualBase='media/firstcut04g-visual-base.mp4';E.visualBaseDerivedFrom='videos/emberwake-firstcut04f-f-native.mp4';E.repairWindows=[[622,879],[919,1088],[7498,7664]];E.revision04g={episodeSourceCorrection:'u006 uses episode 1 replay footage from source 23.0–28.633 seconds, not episode 2 footage',oldFootageRetained:true,openingComposition:'episode 1 gameplay is reframed to avoid protagonist clipping',storyComposition:'two rain dialogue shots enlarged without cutting words',audioCueTimesChanged:false,masterFramesChanged:false,wholeDirectWatch:false,subjectiveListen:false,published:false};
save('source/firstcut04g-edit.json',E);save('source/emberwake-firstcut04g-measured.json',E);
const at=layers.findIndex(l=>l.id===357);if(at<0)throw Error('Original layer order missing');
const jsx=`var parts=${JSON.stringify(replayParts)},index=${at},item=${replay.id};function r(i,p){return app.run(i,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}for(var id of [357,381])r('layer.setSwitch',{layers:[id],switch:'video',value:false});for(var id of [237,12484]){set(id,'transform/anchor',[960,700,0]);set(id,'transform/position',[960,600,0]);set(id,'transform/scale',[150,150,100]);}for(var id of [2565,12868,2613,12892]){set(id,'transform/anchor',[800,400,0]);set(id,'transform/position',[960,520,0]);set(id,'transform/scale',[130,130,100]);}for(var i=0;i<parts.length;i++){var p=parts[i],a=p.start/30,b=p.end/30,l=r('layer.addItem',{item:item,time:a,index:index,duration:b-a}).layer;r('layer.rename',{layer:l,name:'u006 episode1 replay 04g '+i});r('layer.timing',{layers:[l],in:a,out:b});set(l,'transform/anchor',[p.anchor[0],p.anchor[1],0]);set(l,'transform/position',[p.position[0],p.position[1],0]);set(l,'transform/scale',[p.scale,p.scale,100]);r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,p.sourceStart/30);key(l,'timeRemap',b,(p.sourceStart+p.end-p.start)/30);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});}writeLn(JSON.stringify({episode1Parts:parts.length,openingLayers:2,dialogueLayers:4}));`;
fs.writeFileSync(file('source/firstcut04g-native.jsx'),jsx);
const built=parse((await run(EC,['--project',np(project),'script',np(file('source/firstcut04g-native.jsx')),'--save-as',np(project),'--json'],'firstcut04g-native-build.json')).stdout);if(!built.ok)throw Error('Native build failed');
for(const t of [21,24,28,31.1,32.0,33.5,35.5,250.5,253.5,255.3])await run(EC,['--project',np(project),'render-frame','--comp',E.comp,'--time',String(t),'--out',np(file('qa/firstcut04g-native-'+t+'.png')),'--json'],'firstcut04g-native-preview-'+t+'.json');
console.log(JSON.stringify({stage:'native-previews-ready',project,windows:E.repairWindows,masterComplete:false}));
