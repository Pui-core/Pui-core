import {width,height,fps,duration,compName,anchor,scenes,frames,cameraAt,targetAt,characterBoxes} from './plan.mjs';

export function composition({assets=null,includeCharacter=false,probe=false,variant='solo'}={}) {
 const reservations=characterBoxes(variant);
 const samples=frames.map(f=>({...f,camera:cameraAt(f.time),scene:scenes.findIndex(s=>f.time>=s.from&&f.time<s.to),target:targetAt(scenes.find(s=>f.time>=s.from&&f.time<s.to)??scenes.at(-1),f.time)}));
 return `app.newProject();app.beginUndoGroup('Osayu158 stream-board final pair');
var D=${duration},W=${width},H=${height},samples=${JSON.stringify(samples)},scenes=${JSON.stringify(scenes)},boxes=[],ids={};
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:${JSON.stringify(compName)},width:W,height:H,frameRate:${fps},duration:D,background:'#101D2E'}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var rig=null;
function attach(l){if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(name,w,h,x,y,color,a,b,free){var l=run('layer.newShape',{name:name,kind:'rect',size:[w,h],position:[x,y],fill:color,stroke:color,strokeWidth:0}).layer;timing(l,a,b);if(!free)attach(l);return l;}
function text(name,value,x,y,size,a,b,maxWidth,color){var l=run('layer.newText',{name:name,text:value,font:'Meiryo',style:'Bold',size:size,fill:color||'#F7F8FA',position:[x,y],justify:'center'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>maxWidth){size=Math.floor(size*maxWidth/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}timing(l,a,b);attach(l);boxes.push({name:name,text:value,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,from:a,to:b,layer:l});return l;}
${assets?`var imported=run('file.import',{paths:${JSON.stringify(includeCharacter?[assets.background,...assets.characters]:[assets.background])},sequence:false});if(imported.errors.length)throw Error('Binding import failed');var bg=run('layer.addItem',{item:imported.items[0],time:0,duration:D}).layer;run('layer.rename',{layer:bg,name:'FIXED BACKGROUND BASE — PROVENANCE UNVERIFIED'});set(bg,'transform/anchor',[${assets.backgroundSize[0]/2},${assets.backgroundSize[1]/2},0]);set(bg,'transform/position',[540,960,0]);set(bg,'transform/scale',[${Math.max(width/assets.backgroundSize[0],height/assets.backgroundSize[1])*100},${Math.max(width/assets.backgroundSize[0],height/assets.backgroundSize[1])*100},100]);set(bg,'transform/rotation',0);set(bg,'transform/opacity',100);run('layer.setSwitch',{layers:[bg],switch:'motionBlur',value:false});`:''}
shape('STREAM HEADER PLATE',1080,204,540,102,'#101D2E',0,D,true);
shape('DATE HEADER ACCENT',270,111,220,92,'#57DEC6',0,D,true);
text('FIXED HEADER DATE','11月3日',220,116,52,0,D,245,'#101D2E');
text('FIXED HEADER TITLE','おさゆ、挑戦。',680,113,54,0,D,600);
text('FIXED HEADER SUB','チュートリアルバトル',540,187,31,0,D,890);
shape('STREAM VIEWPORT FRAME',996,531,540,475,'#57DEC6',0,D,true);
shape('STREAM VIEWPORT',980,515,540,475,'#14263B',0,D,true);
shape('STAGE SIDE PINK STRIPE',16,460,1043,475,'#FA9CBF',0,D,true);
var camera=run('layer.newNull',{name:'STAGE CAMERA — CHARACTER EXCLUDED'}).layer;
set(camera,'transform/anchor',${JSON.stringify([...anchor,0])});set(camera,'transform/position',${JSON.stringify([...anchor,0])});timing(camera,0,D);rig=camera;
for(var i=0;i<samples.length;i++){var q=samples[i];key(camera,'transform/position',q.time,q.camera.position);key(camera,'transform/scale',q.time,q.camera.scale);key(camera,'transform/rotation',q.time,0);}
shape('STAGE SPATIAL REFERENCE BASELINE',1100,4,540,600,'#79ACA9',0,D,false);
for(var n=0;n<5;n++){shape('STAGE SPATIAL REFERENCE '+n,8,n%2?24:40,80+n*230,600,'#79ACA9',0,D,false);shape('STAGE STATION '+n,30,5,80+n*230,635,'#FA9CBF',0,D,false);}
${probe?`shape('SPATIAL PROBE BACKPLATE',32,32,540,600,'#101D2E',0,D,false);shape('CAMERA SPATIAL PROBE',17,17,540,600,'#0066FF',0,D,false);`:''}
for(var j=0;j<scenes.length;j++){
 var s=scenes[j],center=s.center;
 var panel=shape('CONTENT CARD '+s.id,610,240,center[0],center[1],'#14263B',s.from,s.to,false);
 var accent=shape('CARD ACCENT '+s.id,580,6,center[0],center[1]-121,j%2?'#FA9CBF':'#57DEC6',s.from,s.to,false);
 var head=text('HEADING '+s.id,s.heading,center[0],center[1]+30,s.id==='date'||s.id==='return'?112:68,s.from,s.to,560);
 var sub=text('SUB '+s.id,s.sub,center[0],center[1]-80,32,s.from,s.to,590);
 var note=text('NOTE '+s.id,s.note,center[0],center[1]+98,28,s.from,s.to,570);
 ids[s.id]={panel:panel,heading:head,sub:sub,note:note};
 for(var k=0;k<samples.length;k++){var q=samples[k];if(q.scene!==j)continue;var dx=q.target[0]-center[0];key(panel,'transform/position',q.time,[q.target[0],center[1],0]);key(accent,'transform/position',q.time,[q.target[0],center[1]-121,0]);key(head,'transform/position',q.time,[q.target[0],center[1]+30,0]);key(sub,'transform/position',q.time,[q.target[0],center[1]-80,0]);key(note,'transform/position',q.time,[q.target[0],center[1]+98,0]);}
 ${probe?`var marker=shape('TRACKING PROBE '+s.id,17,17,center[0],center[1],'#00FF00',s.from,s.to,false);ids[s.id].probe=marker;for(var k=0;k<samples.length;k++){var q=samples[k];if(q.scene===j)key(marker,'transform/position',q.time,[q.target[0],q.target[1],0]);}`:''}
}
rig=null;
${variant==='solo'?`shape('SOLO CHALLENGE SIDEBAR',352,570,260,1090,'#101D2E',0,D,true);
shape('SOLO SIDEBAR ACCENT',10,570,79,1090,'#57DEC6',0,D,true);
text('FIXED SOLO LABEL','おさゆの挑戦',260,906,43,0,D,310);
text('FIXED SOLO TEACHER LABEL','先生',260,1010,30,0,D,310,'#57DEC6');
text('FIXED SOLO TEACHER','セラ・ネージュ',260,1070,36,0,D,320);
text('FIXED SOLO RESOLVE','緊張してるけど',260,1180,32,0,D,320);
text('FIXED SOLO WILL','頑張ります！',260,1260,40,0,D,320);
shape('SOLO NAMEPLATE',450,80,725,1708,'#101D2E',0,D,true);text('FIXED SOLO NAME','おさゆ',725,1732,46,0,D,420);`:`shape('COLLAB DUO NAMEPLATE',994,172,540,838,'#101D2E',0,D,true);shape('COLLAB DUO DIVIDER',6,110,540,838,'#57DEC6',0,D,true);text('FIXED OSAYU ROLE','挑戦',290,798,29,0,D,390,'#57DEC6');text('FIXED COLLAB ROLE','先生',790,798,29,0,D,390,'#FA9CBF');text('FIXED OSAYU NAME','おさゆ',290,880,48,0,D,390);text('FIXED COLLAB NAME','セラ・ネージュ',790,875,36,0,D,420);`}
shape('FIXED CTA PLATE',1080,166,540,1837,'#101D2E',0,D,true);
shape('FIXED CTA ACCENT',1080,9,540,1758,'#57DEC6',0,D,true);
text('FIXED CTA','プロフィールから配信へ',540,1850,45,0,D,960);
${assets?'':"text('SAFE PREVIEW NOTICE','人物・背景画像未import',540,1913,19,0,D,900,'#9AB2BF');"}
${reservations.map((b,i)=>includeCharacter?`var fixed${i}=run('layer.addItem',{item:imported.items[${i+1}],time:0,duration:D}).layer;run('layer.rename',{layer:fixed${i},name:'CHARACTER ORIGINAL FIXED ${b.id}'});set(fixed${i},'transform/anchor',[${b.sourceWidth/2},${b.sourceHeight/2},0]);set(fixed${i},'transform/position',[${b.x+b.width/2},${b.y+b.height/2},0]);set(fixed${i},'transform/scale',[${b.width/b.sourceWidth*100},${b.width/b.sourceWidth*100},100]);set(fixed${i},'transform/rotation',0);set(fixed${i},'transform/opacity',100);run('layer.setSwitch',{layers:[fixed${i}],switch:'motionBlur',value:false});`:`shape('CHARACTER RESERVED ${b.id} — NO FOOTAGE IMPORT',${b.width},${b.height},${b.x+b.width/2},${b.y+b.height/2},'#59666F',0,D,true);text('RESERVATION LABEL ${b.id}','固定人物の予約領域',${b.x+b.width/2},${b.y+b.height/2+30},27,0,D,${b.width-30});`).join('\n')}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,camera:camera,ids:ids,boxes:boxes,duration:D,fps:${fps},variant:${JSON.stringify(variant)},characterBoxes:${JSON.stringify(reservations)},design:'stream-board-v04',backgroundConfirmed:false,backgroundCandidateUsed:${!!assets},backgroundFixed:true,includeCharacter:${includeCharacter},probe:${probe}}));`;
}
