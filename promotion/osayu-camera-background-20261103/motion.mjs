import {width,height,fps,duration,compName,scenesFor,characterBoxes,cameraAt} from './plan.mjs';

export function composition({variant,background,characters=[],neutral=true}){
 const scenes=scenesFor(variant),boxes=characterBoxes(variant),samples=Array.from({length:duration*fps},(_,i)=>({time:i/fps,...cameraAt(i/fps,variant)}));
 if(!neutral&&characters.length!==boxes.length)throw Error('Character inputs incomplete');
 return `app.newProject();app.beginUndoGroup('Curved studio diagonal camera');
var W=${width},H=${height},D=${duration},scenes=${JSON.stringify(scenes)},samples=${JSON.stringify(samples)},bounds=[];
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:${JSON.stringify(compName)},width:W,height:H,frameRate:${fps},duration:D,background:'#FF00FF',renderer:'classic3D'}).comp;
run('file.projectSettings',{workingSpace:'srgb',outputSpace:'srgb',bitDepth:8});
var imported=run('file.import',{paths:${JSON.stringify([background,...(neutral?[]:characters)])},sequence:false});if(imported.errors.length)throw Error('Import failed');
var bg=run('layer.addItem',{item:imported.items[0],time:0,duration:D}).layer;
run('layer.rename',{layer:bg,name:'PHOTOCRAFT ORIGINAL BACKGROUND'});set(bg,'transform/anchor',[800,1200,0]);set(bg,'transform/position',[540,960,0]);set(bg,'transform/scale',[135,135,100]);
run('layer.setSwitch',{layers:[bg],switch:'threeD',value:true});set(bg,'materialOptions/acceptsLights',false);
var cam=run('layer.newCamera',{name:'BACKGROUND DEPTH CAMERA',type:'twoNode',zoom:1800,position:[540,960,-1800],poi:[540,960,0],dof:false}).layer;
var rig=run('layer.newNull',{name:'WORLD CAMERA - PAN ZOOM ONLY'}).layer;set(rig,'transform/anchor',[540,960,0]);set(rig,'transform/position',[540,960,0]);timing(rig,0,D);
function attach(l){run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(name,w,h,x,y,color,a,b,kind,stroke){var l=run('layer.newShape',{name:name,kind:kind||'rounded',size:[w,h],position:[x,y],fill:color,stroke:stroke||color,strokeWidth:stroke?2:0}).layer;timing(l,a,b);return attach(l);}
function text(name,value,x,y,size,a,b,maxWidth,color){var l=run('layer.newText',{name:name,text:value,font:'Meiryo',style:'Bold',size:size,fill:color||'#F7F8FA',position:[x,y],justify:'center'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>maxWidth){size=Math.floor(size*maxWidth/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}timing(l,a,b);attach(l);bounds.push({name:name,text:value,x:x+r.left,y:y+r.top,width:r.width,height:r.height,from:a,to:b});return l;}
${boxes.map((b,i)=>neutral?`shape('RESERVATION ${b.id}',${b.w},${b.h},${b.x+b.w/2},${b.y+b.h/2},'${i?'#89728F':'#658B8B'}',0,D);`:`var ch${i}=run('layer.addItem',{item:imported.items[${i+1}],time:0,duration:D}).layer;run('layer.rename',{layer:ch${i},name:'ORIGINAL CHARACTER ${b.id}'});set(ch${i},'transform/anchor',[${b.sw/2},${b.sh/2},0]);set(ch${i},'transform/position',[${b.x+b.w/2},${b.y+b.h/2},0]);set(ch${i},'transform/scale',[${b.w/b.sw*100},${b.w/b.sw*100},100]);attach(ch${i});`).join('\n')}
for(var j=0;j<scenes.length;j++){var s=scenes[j],x=s.center[0],y=s.center[1],color=${JSON.stringify(variant==='solo'?'#A9F4DE':'#F5BCD9')};
 ${variant==='solo'?`shape('SOFT PANEL '+s.id,s.id==='date'||s.id==='return'?670:650,s.id==='date'||s.id==='return'?390:330,x,y-16,'#142739',s.from,s.to,s.id==='date'||s.id==='return'?'ellipse':'rounded',j%2?'#A2799B':'#4B8C88');`:`shape('CONVERSATION BACK '+s.id,620,340,x-12,y-10,'#293048',s.from,s.to,'rounded','#A2799B');shape('CONVERSATION FRONT '+s.id,620,318,x+12,y-20,'#172D3D',s.from,s.to,'rounded','#5A9E9A');shape('CONVERSATION DOT '+s.id,22,22,x-260,y+120,'#E4ADC9',s.from,s.to,'ellipse');shape('CONVERSATION DOT SECOND '+s.id,14,14,x-235,y+137,'#E4ADC9',s.from,s.to,'ellipse');`}
 shape('PILL '+s.id,490,56,x,y-120,j%2?'#60435E':'#265951',s.from,s.to,'rounded');
 text('SUB '+s.id,s.sub,x,y-107,31,s.from,s.to,470,'#E0F4F1');
 text('HEADING '+s.id,s.heading,x,y+28,s.id==='date'||s.id==='return'?150:64,s.from,s.to,590,color);
 text('NOTE '+s.id,s.note,x,y+115,30,s.from,s.to,590,'#F4F2F4');
 // Foreground comet accents pass behind the information panel, never over a character.
 var comet=shape('COMET '+s.id,90,10,x-280,y-175,color,s.from,Math.min(s.to,s.from+.7),'rounded');
 key(comet,'transform/position',s.from,[x-520,y-210,0]);key(comet,'transform/position',s.from+.22,[x+240,y-175,0]);key(comet,'transform/position',s.from+.5,[x+530,y-140,0]);
}
// Attach children at the identity transform BEFORE adding camera keys.
// Otherwise compensate:true bakes the first animated camera into every child.
for(var i=0;i<samples.length;i++){var q=samples[i];key(rig,'transform/position',q.time,q.position);key(rig,'transform/scale',q.time,q.scale);key(bg,'transform/rotationY',q.time,q.yaw);key(bg,'transform/rotationX',q.time,q.pitch);key(cam,'transform/position',q.time,[540+(q.target[0]-540)*.7,960+(q.target[1]-960)*.7,-1800/q.zoom]);key(cam,'transform/poi',q.time,[540+(q.target[0]-540)*.7,960+(q.target[1]-960)*.7,0]);}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,rig:rig,background:bg,camera:cam,bounds:bounds,neutral:${neutral},variant:${JSON.stringify(variant)}}));`;
}
