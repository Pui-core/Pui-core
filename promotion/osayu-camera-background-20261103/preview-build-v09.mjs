import fs from 'node:fs';import path from 'node:path';
import {root,native,save,hash,parseNative} from './runtime.mjs';
import {preview,cutFrames,cameraSample,synchronization} from './preview-plan-v09.mjs';
const [variant='solo']=process.argv.slice(2);if(!['solo','collab'].includes(variant))throw Error('variant');
const project=path.join(root,'projects',variant+'-candidate-neutral.ecproj'),background=path.join(root,'backgrounds',variant+'-glass-stage-v09-r01.png'),jsx=path.join(root,'source',variant+'-candidate-neutral.jsx');
if(fs.existsSync(project))throw Error('Keep existing native');
const p=JSON.parse(fs.readFileSync(background.replace('.png','-provenance.json')));
if(!p.characterFree||p.pngSHA256!==hash(background)||p.externalMediaImports.length!==1||p.externalMediaImports[0].sha256!=='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6')throw Error('Background provenance');
const samples=Array.from({length:preview.frames},(_,i)=>cameraSample(i,variant));
const first=variant==='solo'?{cx:515,cy:720,entry:[400,220],exit:[-180,-220],heading:'11/3',sub:'チュートリアルバトル',note:'おさゆ、挑戦。'}:{cx:585,cy:720,entry:[-420,180],exit:[180,-190],heading:'11/3',sub:'チュートリアルバトル',note:'おさゆ、挑戦。'};
const second=variant==='solo'?{cx:500,cy:730,entry:[-420,70],exit:[170,270],heading:'頑張ります！',sub:'緊張してるけど',note:'おさゆの挑戦'}:{cx:590,cy:720,entry:[430,-120],exit:[-160,250],heading:'セラ先輩',sub:'先生は セラ・ネージュ',note:'尊敬する先輩と。'};
const colors=variant==='solo'?['#C9FBE8','#FFCEE9']:['#FFD1EA','#BFF8ED'];
const script=`app.newProject();app.beginUndoGroup('v09 measured-music candidate neutral');
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}function key(l,p,f,v){run('prop.addKey',{layer:l,path:p,time:f/30,timeBase:'comp',value:v});}function timing(l,a,b){run('layer.timing',{layers:[l],in:a/30,out:b/30});}
var comp=run('comp.new',{name:${JSON.stringify(preview.compName)},width:1080,height:1920,frameRate:30,duration:${preview.duration},background:'#FF00FF',renderer:'classic3D'}).comp;
run('file.projectSettings',{workingSpace:'srgb',outputSpace:'srgb',bitDepth:8});
var imports=run('file.import',{paths:[${JSON.stringify(background)}],sequence:false});if(imports.errors.length)throw Error('Background import');
var bg=run('layer.addItem',{item:imports.items[0],time:0,duration:${preview.duration}}).layer;
run('layer.rename',{layer:bg,name:'VERIFIED CHARACTER-FREE PHOTOCRAFT BACKGROUND'});set(bg,'transform/anchor',[800,1422,0]);set(bg,'transform/position',[540,960,0]);set(bg,'transform/scale',[100,100,100]);run('layer.setSwitch',{layers:[bg],switch:'threeD',value:true});set(bg,'materialOptions/acceptsLights',false);
var cam=run('layer.newCamera',{name:'BACKGROUND PERSPECTIVE ONLY',type:'twoNode',zoom:1800,position:[540,960,-1800],poi:[540,960,0],dof:false}).layer;
var rig=run('layer.newNull',{name:'COMMON PAN ZOOM - NO CHARACTER IMPORT'}).layer;set(rig,'transform/anchor',[540,960,0]);set(rig,'transform/position',[540,960,0]);timing(rig,0,169);
function parent(l,p){run('layer.setParent',{layers:[l],parent:p,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});}
function shape(name,w,h,x,y,color,a,b,parentLayer){var l=run('layer.newShape',{name:name,kind:'rounded',size:[w,h],position:[x,y],fill:color,stroke:'#C7E6ED',strokeWidth:0}).layer;timing(l,a,b);parent(l,parentLayer);return l;}
var bounds=[];function text(name,value,x,y,size,a,b,maxWidth,color,parentLayer){var l=run('layer.newText',{name:name,text:value,font:'Meiryo',style:'Bold',size:size,fill:color,position:[x,y],justify:'center'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a/30,false);if(r.width>maxWidth){size=Math.floor(size*maxWidth/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a/30,false);}timing(l,a,b);parent(l,parentLayer);bounds.push({name:name,text:value,x:x+r.left,y:y+r.top,width:r.width,height:r.height,fromFrame:a,toFrame:b});return l;}
${variant==='solo'?"shape('RESERVATION ONLY - OSAYU',260,520,540,1250,'#5F8B8B',0,169,rig);":"shape('RESERVATION ONLY - OSAYU',220,440,395,1240,'#5F8B8B',0,169,rig);shape('RESERVATION ONLY - COLLABORATOR',220,440,685,1240,'#866A8D',0,169,rig);"}
var scenes=${JSON.stringify([first,second])},colors=${JSON.stringify(colors)};
for(var j=0;j<2;j++){var s=scenes[j],a=j?85:0,b=j?169:85,c=s.cx,y=s.cy;
 var pop=run('layer.newNull',{name:'POPUP ENTRY LAND EXIT '+j}).layer;set(pop,'transform/anchor',[c,y,0]);set(pop,'transform/position',[c,y,0]);timing(pop,a,b);parent(pop,rig);
 shape('GLASS LABEL '+j,550,62,c,y-137,'#293D51',a,b,pop);
 text('SUB '+j,s.sub,c,y-123,32,a,b,510,'#F4E9F8',pop);
 text('HEADING '+j,s.heading,c,y+40,j?73:193,a,b,750,colors[j],pop);
 text('NOTE '+j,s.note,c,y+134,38,a,b,640,'#FFFFFF',pop);
 // The popup's entry is decelerated, overshoots briefly, then holds fully readable.
 for(var f=a;f<b;f++){var q=f-a,dx=0,dy=0,z=100;
  if(q<10){var u=q/10,e=1-Math.pow(1-u,3);dx=s.entry[0]*(1-e);dy=s.entry[1]*(1-e);z=78+25*e;}
  else if(q<14){var u=(q-10)/4,e=u*u*(3-2*u);z=103-3*e;}
  if(q>=b-a-10){var u=(q-(b-a-10))/9;dx=s.exit[0]*u*u;dy=s.exit[1]*u*u;z=100-12*u*u;}
  key(pop,'transform/position',f,[c+dx,y+dy,0]);key(pop,'transform/scale',f,[z,z,100]);
 }
}
var samples=${JSON.stringify(samples)};
for(var i=0;i<samples.length;i++){var s=samples[i];key(rig,'transform/position',s.frame,s.position);key(rig,'transform/scale',s.frame,s.scale);key(bg,'transform/rotationY',s.frame,s.yaw);key(bg,'transform/rotationX',s.frame,s.pitch);key(cam,'transform/position',s.frame,[540+(s.target[0]-540)*.65,960+(s.target[1]-960)*.65,-1800/s.z]);key(cam,'transform/poi',s.frame,[540+(s.target[0]-540)*.65,960+(s.target[1]-960)*.65,0]);}
app.endUndoGroup();writeLn(JSON.stringify({bounds:bounds,characterImports:0,variant:${JSON.stringify(variant)}}));`;
fs.writeFileSync(jsx,script);
const res=parseNative((await native(['--empty','script',jsx,'--save-as',project,'--json'],variant+'-candidate-native-build')).stdout);if(!res.ok)throw Error('native');
save(path.join(root,'qa',variant+'-candidate-layout.json'),JSON.parse(res.output));
await native(['--project',project,'--save','info','--json'],variant+'-candidate-native-reopen');
const nativeData=JSON.parse(fs.readFileSync(project)),footage=Object.values(nativeData.items).filter(x=>x.kind?.type==='Footage').map(x=>x.kind.path);
if(footage.length!==1||footage[0]!==background)throw Error('Neutral has unapproved import');
save(path.join(root,'qa',variant+'-candidate-binding.json'),{project,projectSHA256:hash(project),jsxSHA256:hash(jsx),footage:[{path:background,sha256:hash(background)}],characterImports:0,neutral:true,adoptedTikTokSound:false,preview,cutFrames,synchronization});
console.log(JSON.stringify({variant,project,characterImports:0}));
