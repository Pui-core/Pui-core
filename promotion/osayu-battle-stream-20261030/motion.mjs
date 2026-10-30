import {width,height,fps,duration,compName,anchor,scenes,frames,cameraAt,targetAt,characterBoxes} from './plan.mjs';

export function composition({assets=null,includeCharacter=false,probe=false,variant='solo'}={}) {
 const reservations=characterBoxes(variant);
 const samples=frames.map(f=>({...f,camera:cameraAt(f.time),scene:scenes.findIndex(s=>f.time>=s.from&&f.time<s.to),target:targetAt(scenes.find(s=>f.time>=s.from&&f.time<s.to)??scenes.at(-1),f.time)}));
 return `app.newProject();app.beginUndoGroup('Osayu158 provisional stream geometry');
var D=${duration},W=${width},H=${height},samples=${JSON.stringify(samples)},scenes=${JSON.stringify(scenes)},boxes=[],ids={};
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:${JSON.stringify(compName)},width:W,height:H,frameRate:${fps},duration:D,background:'#26303A'}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var rig=null;
function attach(l){if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(name,w,h,x,y,color,a,b,free){var l=run('layer.newShape',{name:name,kind:'rect',size:[w,h],position:[x,y],fill:color,stroke:color,strokeWidth:0}).layer;timing(l,a,b);if(!free)attach(l);return l;}
function text(name,value,x,y,size,a,b,maxWidth){var l=run('layer.newText',{name:name,text:value,font:'Meiryo',style:'Bold',size:size,fill:'#F7F8FA',position:[x,y],justify:'center'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>maxWidth){size=Math.floor(size*maxWidth/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}timing(l,a,b);attach(l);boxes.push({name:name,text:value,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,from:a,to:b,layer:l});return l;}
${assets?`var imported=run('file.import',{paths:${JSON.stringify(includeCharacter?[assets.background,...assets.characters]:[assets.background])},sequence:false});if(imported.errors.length)throw Error('Binding import failed');var bg=run('layer.addItem',{item:imported.items[0],time:0,duration:D}).layer;run('layer.rename',{layer:bg,name:'CONFIRMED STREAM BACKGROUND'});set(bg,'transform/position',[540,960,0]);`:''}
${assets?'':"shape('NEUTRAL CANVAS — NOT FINAL BACKGROUND',1080,1920,540,960,'#26303A',0,D,true);"}
${assets?`shape('VIEWPORT TOP BORDER',940,8,540,192.5,'#CDD4D8',0,D,true);shape('VIEWPORT BOTTOM BORDER',940,8,540,727.5,'#CDD4D8',0,D,true);shape('VIEWPORT LEFT BORDER',8,535,70,460,'#CDD4D8',0,D,true);shape('VIEWPORT RIGHT BORDER',8,535,1010,460,'#CDD4D8',0,D,true);`:`shape('STREAM VIEWPORT FRAME',940,535,540,460,'#CDD4D8',0,D,true);shape('STREAM VIEWPORT',916,511,540,460,'#34414B',0,D,true);`}
${assets?'':"text('PROVISIONAL LAYOUT NOTICE','背景未設定・機構確認版',540,170,29,0,D,850);"}
var camera=run('layer.newNull',{name:'STAGE CAMERA — CHARACTER EXCLUDED'}).layer;
set(camera,'transform/anchor',${JSON.stringify([...anchor,0])});set(camera,'transform/position',${JSON.stringify([...anchor,0])});timing(camera,0,D);rig=camera;
${assets?"run('layer.setParent',{layers:[bg],parent:camera,compensate:true});":''}
for(var i=0;i<samples.length;i++){var q=samples[i];key(camera,'transform/position',q.time,q.camera.position);key(camera,'transform/scale',q.time,q.camera.scale);key(camera,'transform/rotation',q.time,0);}
shape('STAGE SPATIAL REFERENCE BASELINE',1100,3,540,600,'#6C7B86',0,D,false);
for(var n=0;n<5;n++)shape('STAGE SPATIAL REFERENCE '+n,8,32,80+n*230,600,'#6C7B86',0,D,false);
${probe?`shape('CAMERA SPATIAL PROBE',17,17,540,600,'#0066FF',0,D,false);`:''}
for(var j=0;j<scenes.length;j++){
 var s=scenes[j],center=s.center;
 var panel=shape('CONTENT CARD '+s.id,610,240,center[0],center[1],'#425561',s.from,s.to,false);
 var head=text('HEADING '+s.id,s.heading,center[0],center[1]+30,s.id==='date'||s.id==='return'?112:68,s.from,s.to,560);
 var sub=text('SUB '+s.id,s.sub,center[0],center[1]-80,32,s.from,s.to,590);
 var note=text('NOTE '+s.id,s.note,center[0],center[1]+98,28,s.from,s.to,570);
 ids[s.id]={panel:panel,heading:head,sub:sub,note:note};
 for(var k=0;k<samples.length;k++){var q=samples[k];if(q.scene!==j)continue;var dx=q.target[0]-center[0];key(panel,'transform/position',q.time,[q.target[0],center[1],0]);key(head,'transform/position',q.time,[q.target[0],center[1]+30,0]);key(sub,'transform/position',q.time,[q.target[0],center[1]-80,0]);key(note,'transform/position',q.time,[q.target[0],center[1]+98,0]);}
 ${probe?`var marker=shape('TRACKING PROBE '+s.id,17,17,center[0],center[1],'#00FF00',s.from,s.to,false);ids[s.id].probe=marker;for(var k=0;k<samples.length;k++){var q=samples[k];if(q.scene===j)key(marker,'transform/position',q.time,[q.target[0],q.target[1],0]);}`:''}
}
rig=null;
${variant==='solo'?`shape('FIXED INFORMATION RAIL',350,530,270,1060,'#34414B',0,D,true);
text('FIXED DATE','11月3日',270,940,52,0,D,310);
text('FIXED EVENT','バトル告知',270,1020,43,0,D,310);
text('FIXED NAME','おさゆ',270,1110,58,0,D,310);
text('FIXED CTA ONE','プロフィールから',270,1210,29,0,D,310);
text('FIXED CTA TWO','配信へ',270,1270,40,0,D,310);`:`text('FIXED DATE','11月3日',285,825,52,0,D,360);text('FIXED EVENT','チュートリアルバトル',765,825,32,0,D,480);text('FIXED OSAYU NAME','おさゆ',290,900,39,0,D,390);text('FIXED COLLAB NAME','セラ・ネージュ',790,900,32,0,D,390);text('FIXED CTA','プロフィールから配信へ',540,1830,42,0,D,930);`}
${reservations.map((b,i)=>includeCharacter?`var fixed${i}=run('layer.addItem',{item:imported.items[${i+1}],time:0,duration:D}).layer;run('layer.rename',{layer:fixed${i},name:'CHARACTER ORIGINAL FIXED ${b.id}'});set(fixed${i},'transform/anchor',[${b.sourceWidth/2},${b.sourceHeight/2},0]);set(fixed${i},'transform/position',[${b.x+b.width/2},${b.y+b.height/2},0]);set(fixed${i},'transform/scale',[${b.width/b.sourceWidth*100},${b.width/b.sourceWidth*100},100]);set(fixed${i},'transform/rotation',0);set(fixed${i},'transform/opacity',100);run('layer.setSwitch',{layers:[fixed${i}],switch:'motionBlur',value:false});`:`shape('CHARACTER RESERVED ${b.id} — NO FOOTAGE IMPORT',${b.width},${b.height},${b.x+b.width/2},${b.y+b.height/2},'#59666F',0,D,true);text('RESERVATION LABEL ${b.id}','固定人物の予約領域',${b.x+b.width/2},${b.y+b.height/2+30},27,0,D,${b.width-30});`).join('\n')}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,camera:camera,ids:ids,boxes:boxes,duration:D,fps:${fps},variant:${JSON.stringify(variant)},characterBoxes:${JSON.stringify(reservations)},provisional:true,backgroundConfirmed:${!!assets},includeCharacter:${includeCharacter},probe:${probe}}));`;
}
