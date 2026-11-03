/** Numeric-only lossless checks. NEVER display images in qa/numeric-only. */
import fs from 'node:fs';import path from 'node:path';
import {root,native,run,ffmpegPath,save,hash} from './runtime.mjs';
import {characterBoxes,compName,cameraAt} from './plan.mjs';
const [variant,proofTag='interior-v02']=process.argv.slice(2);if(!['solo','collab'].includes(variant)||!/^[a-z0-9-]+$/.test(proofTag))throw Error('variant/tag');
const dir=path.join(root,'qa','numeric-only',variant,proofTag);fs.mkdirSync(dir,{recursive:true});
async function raw(file,name){const chunks=[];await run(ffmpegPath,['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',file,'-frames:v','1','-vf','format=rgba','-f','rawvideo','-'],name,{consumeStdout:b=>chunks.push(b)});return Buffer.concat(chunks);}
const identity=[];
for(const b of characterBoxes(variant)){
 // Osayu identity proof is reused only after exact source hash match.
 const source=path.join(root,'media',b.id==='osayu'?'osayu.png':'collaborator.png'),sourceHash=hash(source),existing=path.join(root,'qa',b.id+'-identity.json');
 if(fs.existsSync(existing)){const q=JSON.parse(fs.readFileSync(existing));if(q.sourceHash!==sourceHash||!q.exact)throw Error('Identity evidence mismatch');identity.push(q);continue;}
 const jsx=path.join(dir,b.id+'-identity.jsx'),project=path.join(dir,b.id+'-identity.ecproj'),png=path.join(dir,b.id+'-identity.png');
 fs.writeFileSync(jsx,`app.newProject();function run(id,p){return app.run(id,p||{});}var c=run('comp.new',{name:'Identity',width:${b.sw},height:${b.sh},frameRate:30,duration:1,background:'#000000'}).comp;run('file.projectSettings',{workingSpace:'srgb',outputSpace:'srgb',bitDepth:8});var i=run('file.import',{paths:${JSON.stringify([source])},sequence:false});var l=run('layer.addItem',{item:i.items[0],time:0,duration:1}).layer;run('prop.set',{layer:l,path:'transform/anchor',value:[${b.sw/2},${b.sh/2},0]});run('prop.set',{layer:l,path:'transform/position',value:[${b.sw/2},${b.sh/2},0]});run('prop.set',{layer:l,path:'transform/scale',value:[100,100,100]});`);
 await native(['--empty','script',jsx,'--save-as',project,'--json'],variant+'-'+b.id+'-identity-build');
 await native(['--project',project,'--save','info','--json'],variant+'-'+b.id+'-identity-reopen');
 await native(['--project',project,'render-frame','--comp','Identity','--time','0','--out',png,'--json'],variant+'-'+b.id+'-identity-frame');
 const a=await raw(source,variant+'-'+b.id+'-source-raw'),z=await raw(png,variant+'-'+b.id+'-identity-raw');
 if(a.length!==b.sw*b.sh*4||z.length!==a.length)throw Error('Identity dimensions');let pixels=0,changed=0,maxDelta=0;
 for(let i=0;i<a.length;i+=4)if(a[i+3]===255){pixels++;for(let k=0;k<3;k++){const d=Math.abs(a[i+k]-z[i+k]);changed+=d>0;maxDelta=Math.max(maxDelta,d);}}
 const q={id:b.id,sourceHash,opaquePixels:pixels,changedChannels:changed,maxDelta,exact:pixels>0&&changed===0,projectHash:hash(project)};save(existing,q);if(!q.exact)throw Error('Identity RGB');identity.push(q);
}
const production=path.join(root,'projects',variant+'-production.ecproj'),reference=path.join(dir,'camera-isolated.ecproj'),p=JSON.parse(fs.readFileSync(production)),c=Object.values(p.items).find(x=>x.kind?.type==='Comp').kind;
c.layers=c.layers.filter(l=>l.name.startsWith('ORIGINAL CHARACTER ')||l.name==='WORLD CAMERA - PAN ZOOM ONLY');c.background=[0,0,0];
if(fs.existsSync(reference)){
 const saved=JSON.parse(fs.readFileSync(reference)),sc=Object.values(saved.items).find(x=>x.kind?.type==='Comp').kind;
 if(JSON.stringify(sc.layers)!==JSON.stringify(c.layers)||JSON.stringify(saved.settings)!==JSON.stringify(p.settings))throw Error('Existing reference differs');
}else{fs.writeFileSync(reference,JSON.stringify(p));await native(['--project',reference,'--save','info','--json'],variant+'-isolated-reopen');}
// Use original alpha, not output alpha rounded back to eight bits. Require a
// fully opaque source footprint larger than the reconstruction filter support.
const masks=[];
for(const b of characterBoxes(variant)){
 const rgba=await raw(path.join(root,'media',b.id==='osayu'?'osayu.png':'collaborator.png'),variant+'-'+b.id+'-alpha-footprint');
 const stride=b.sw+1,prefix=new Uint32Array(stride*(b.sh+1));
 for(let y=0;y<b.sh;y++){let row=0;for(let x=0;x<b.sw;x++){row+=rgba[(y*b.sw+x)*4+3]===255?0:1;prefix[(y+1)*stride+x+1]=prefix[y*stride+x+1]+row;}}
 masks.push({b,stride,prefix});
}
const comparisons=[];
for(const [n,t] of [0.9,8.7,17.3].entries()){
 const full=path.join(dir,'full-'+n+'.png'),isolated=path.join(dir,'isolated-'+n+'.png');
 if(!fs.existsSync(full))await native(['--project',production,'render-frame','--comp',compName,'--time',String(t),'--out',full,'--json'],variant+'-full-frame-'+n);
 if(!fs.existsSync(isolated))await native(['--project',reference,'render-frame','--comp',compName,'--time',String(t),'--out',isolated,'--transparent','--json'],variant+'-isolated-frame-'+n);
 const a=await raw(isolated,variant+'-isolated-raw-'+n),z=await raw(full,variant+'-full-raw-'+n);if(a.length!==1080*1920*4||z.length!==a.length)throw Error('Camera proof dimensions');
 const cam=cameraAt(t,variant),k=cam.zoom;
 for(const m of masks){
  const b=m.b,sc=b.w/b.sw,radius=Math.ceil(4/(k*sc));let pixels=0,changed=0,maxDelta=0;
  const x0=Math.max(0,Math.floor(cam.position[0]+(b.x-540)*k)),x1=Math.min(1080,Math.ceil(cam.position[0]+(b.x+b.w-540)*k)),y0=Math.max(0,Math.floor(cam.position[1]+(b.y-960)*k)),y1=Math.min(1920,Math.ceil(cam.position[1]+(b.y+b.h-960)*k));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const sx=((x+.5-cam.position[0])/k+540-b.x)/sc,sy=((y+.5-cam.position[1])/k+960-b.y)/sc,l=Math.max(0,Math.floor(sx-radius)),r=Math.min(b.sw,Math.ceil(sx+radius+1)),top=Math.max(0,Math.floor(sy-radius)),bottom=Math.min(b.sh,Math.ceil(sy+radius+1));
   if(l>=r||top>=bottom||m.prefix[bottom*m.stride+r]-m.prefix[top*m.stride+r]-m.prefix[bottom*m.stride+l]+m.prefix[top*m.stride+l])continue;
   pixels++;const i=(y*1080+x)*4;for(let channel=0;channel<3;channel++){const d=Math.abs(a[i+channel]-z[i+channel]);changed+=d>0;maxDelta=Math.max(maxDelta,d);}
  }
  const q={time:t,id:b.id,opaqueInteriorPixels:pixels,sourceFootprintRadius:radius,changedChannels:changed,maxDelta,exact:pixels>1000&&changed===0,fullPNGHash:hash(full),isolatedPNGHash:hash(isolated)};comparisons.push(q);
  if(!q.exact){save(path.join(dir,'failed-source-alpha-comparisons.json'),comparisons);throw Error('Production camera opaque pixels differ '+JSON.stringify(q));}
 }
}
save(path.join(root,'qa',variant+'-character-proof.json'),{identity,comparisons,productionProjectSHA256:hash(production),referenceProjectSHA256:hash(reference),characterAIInputs:0,method:'Non-AI numeric comparison of original opaque RGB at identity; isolated original characters vs production at three camera times',passed:true});console.log(JSON.stringify({variant,characterProof:true,AIInputs:0}));
