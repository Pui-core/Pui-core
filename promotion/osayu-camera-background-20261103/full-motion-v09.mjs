import {width,height,fps,compName,framesFor,durationFor,scenesFor,characterBoxes,cameraAtFrame,popupAtFrame} from './full-plan-v09.mjs';
export function composition({variant,background,characters=[],neutral=true}){
 const frames=framesFor(variant),duration=durationFor(variant),scenes=scenesFor(variant),boxes=characterBoxes(variant),samples=Array.from({length:frames},(_,f)=>cameraAtFrame(f,variant));
 if(!neutral&&characters.length!==boxes.length)throw Error('characters');
 const pops=scenes.map(s=>Array.from({length:s.toFrame-s.fromFrame},(_,i)=>({frame:s.fromFrame+i,...popupAtFrame(s.fromFrame+i,s)})));
 return `app.newProject();app.beginUndoGroup('v09 full private production');
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}function key(l,p,f,v){run('prop.addKey',{layer:l,path:p,time:f/30,timeBase:'comp',value:v});}function timing(l,a,b){run('layer.timing',{layers:[l],in:a/30,out:b/30});}
var comp=run('comp.new',{name:${JSON.stringify(compName)},width:${width},height:${height},frameRate:${fps},duration:${duration},background:'#FF00FF',renderer:'classic3D'}).comp;
run('file.projectSettings',{workingSpace:'srgb',outputSpace:'srgb',bitDepth:8});
var imports=run('file.import',{paths:${JSON.stringify([background,...(neutral?[]:characters)])},sequence:false});if(imports.errors.length)throw Error('Import failed');
var bg=run('layer.addItem',{item:imports.items[0],time:0,duration:${duration}}).layer;
run('layer.rename',{layer:bg,name:'PHOTOCRAFT ORIGINAL BACKGROUND'});set(bg,'transform/anchor',[800,1422,0]);set(bg,'transform/position',[540,960,0]);set(bg,'transform/scale',[100,100,100]);run('layer.setSwitch',{layers:[bg],switch:'threeD',value:true});set(bg,'materialOptions/acceptsLights',false);
var cam=run('layer.newCamera',{name:'BACKGROUND PERSPECTIVE ONLY',type:'twoNode',zoom:1800,position:[540,960,-1800],poi:[540,960,0],dof:false}).layer;
var rig=run('layer.newNull',{name:'WORLD CAMERA - PAN ZOOM ONLY'}).layer;set(rig,'transform/anchor',[540,960,0]);set(rig,'transform/position',[540,960,0]);timing(rig,0,${frames});
function parent(l,p){run('layer.setParent',{layers:[l],parent:p,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});}
function shape(name,w,h,x,y,color,a,b,parentLayer){var l=run('layer.newShape',{name:name,kind:'rounded',size:[w,h],position:[x,y],fill:color,stroke:color,strokeWidth:0}).layer;timing(l,a,b);parent(l,parentLayer);return l;}
var bounds=[];function text(name,value,x,y,size,a,b,maxWidth,color,parentLayer){var l=run('layer.newText',{name:name,text:value,font:'Meiryo',style:'Bold',size:size,fill:color,position:[x,y],justify:'center'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a/30,false);if(r.width>maxWidth){size=Math.floor(size*maxWidth/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a/30,false);}set(l,'transform/anchor',[r.left+r.width/2,r.top+r.height/2,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);parent(l,parentLayer);bounds.push({name:name,text:value,x:x-r.width/2,y:y-r.height/2,width:r.width,height:r.height,fromFrame:a,toFrame:b,position:[x,y,0],anchor:[r.left+r.width/2,r.top+r.height/2,0]});return l;}
${boxes.map((b,i)=>neutral?`shape('RESERVATION ${b.id}',${b.w},${b.h},${b.x+b.w/2},${b.y+b.h/2},'${i?'#866A8D':'#5F8B8B'}',0,${frames},rig);`:`var ch${i}=run('layer.addItem',{item:imports.items[${i+1}],time:0,duration:${duration}}).layer;run('layer.rename',{layer:ch${i},name:'ORIGINAL CHARACTER ${b.id}'});set(ch${i},'transform/anchor',[${b.sw/2},${b.sh/2},0]);set(ch${i},'transform/position',[${b.x+b.w/2},${b.y+b.h/2},0]);set(ch${i},'transform/scale',[${b.w/b.sw*100},${b.w/b.sw*100},100]);parent(ch${i},rig);`).join('\n')}
var scenes=${JSON.stringify(scenes)},pops=${JSON.stringify(pops)},colors=${JSON.stringify(variant==='solo'?['#C9FBE8','#FFD1EB']:['#FFD1EB','#C9FBE8'])};
for(var j=0;j<scenes.length;j++){var s=scenes[j],a=s.fromFrame,b=s.toFrame,c=s.center[0],y=s.center[1];
 var pop=run('layer.newNull',{name:'POPUP '+s.id}).layer;set(pop,'transform/anchor',[c,y,0]);set(pop,'transform/position',[c,y,0]);timing(pop,a,b);parent(pop,rig);
 shape('GLASS LABEL '+s.id,560,66,c,y-170,'#293D51',a,b,pop);
 text('SUB '+s.id,s.sub,c,y-170,38,a,b,520,'#F7ECF8',pop);
 text('HEADING '+s.id,s.heading,c,y,s.id==='date'||s.id==='return'?193:s.id==='teacher'?140:110,a,b,720,colors[j%2],pop);
 var note=text('NOTE '+s.id,s.note,c,y+185,42,a,b,690,'#FFFFFF',pop);
 for(var f=a;f<b;f++){var q=f-a,off=q<10?36:q<18?36*Math.pow(1-(q-10)/8,3):0;key(note,'transform/position',f,[c,y+185+off,0]);}
 for(var k=0;k<pops[j].length;k++){var q=pops[j][k];key(pop,'transform/position',q.frame,q.position);key(pop,'transform/scale',q.frame,q.scale);}
}
// All parenting happens at identity before the common camera is animated.
var samples=${JSON.stringify(samples)};
for(var i=0;i<samples.length;i++){var s=samples[i];key(rig,'transform/position',s.frame,s.position);key(rig,'transform/scale',s.frame,s.scale);key(bg,'transform/rotationY',s.frame,s.yaw);key(bg,'transform/rotationX',s.frame,s.pitch);key(cam,'transform/position',s.frame,[540+(s.target[0]-540)*.65,960+(s.target[1]-960)*.65,-1800/s.zoom]);key(cam,'transform/poi',s.frame,[540+(s.target[0]-540)*.65,960+(s.target[1]-960)*.65,0]);}
app.endUndoGroup();writeLn(JSON.stringify({bounds:bounds,neutral:${neutral},variant:${JSON.stringify(variant)},frames:${frames}}));`;
}
