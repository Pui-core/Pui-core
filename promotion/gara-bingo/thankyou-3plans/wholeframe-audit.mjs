/** Native whole-frame audit. Artwork is inspected as metadata and hashes only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as motion from './motion.mjs';

const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const MAGICK = '/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const CAMERA = 'WHOLE FRAME CAMERA', BACKGROUND = 'BINGO PAPER BACKGROUND';
const TICKS = 254016000000, FPS = 30;
const BASE = {position:[730,1290,0], anchor:[452.5,905,0],
  scale:[380/905*100,380/905*100,100], rotation:0, opacity:100};
const SOURCE_HASHES = {
  'character-original.jpg':'89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2',
  'character-cutout.png':'e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef'
};
const parse = s => JSON.parse(s.replace(/^\uFEFF/, '').trim());
const read = p => parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const digest = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const near = (a,b,e=1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b)<=e;
const vector = (a,b,e=1e-6) => Array.isArray(a) && a.length===b.length && b.every((v,i)=>near(a[i],v,e));
const finiteVector = (a,n) => Array.isArray(a) && a.length===n && a.every(Number.isFinite);
const save = (p,v) => {fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
function execute(exe,args) {
  const r=spawnSync(exe,args,{encoding:'utf8',timeout:180000,maxBuffer:48*1024*1024,windowsHide:true});
  if(r.error||r.status!==0)throw Error('Native audit command failed: '+(r.error?.message||r.stderr?.slice(-1800)||r.status));
  return r.stdout.replace(/^\uFEFF/,'').trim();
}
const native = p => execute('wslpath',['-w',path.resolve(p)]);
const local = p => p.startsWith('/')?p:execute('wslpath',['-u',p]);
const same = (a,b) => {try{return fs.realpathSync(local(a))===fs.realpathSync(local(b));}catch{return false;}};
function strings(v) {return typeof v==='string'?[v]:v&&typeof v==='object'?Object.values(v).flatMap(strings):[];}
function props(group,prefix='') {
  return (group?.children||[]).flatMap(n=>{const p=prefix?prefix+'/'+n.match:n.match;
    return [...(n.node==='Prop'?[{path:p,node:n}]:[]),...props(n,p)];});
}
function animated(v,p='') {
  if(!v||typeof v!=='object')return[];
  return Object.entries(v).flatMap(([k,x])=>{const name=p?p+'/'+k:k;
    const set=x!==null&&x!==undefined&&x!==false&&x!==''&&(typeof x!=='object'||Object.keys(x).length>0);
    return [...(set&&/^(keys|keyframes|key_frames|expression|expr|expression_code)$/i.test(k)?[name]:[]),...animated(x,name)];});
}
function effectsOrMasks(layer) {
  return (layer.props?.children||[]).filter(p=>['effects','masks'].includes(p.match)).some(p=>p.children?.length);
}
function values(layer) {return new Map(props(layer.props).map(p=>[p.path,p.node.value?.v]));}
function canonical(project,comp,excluded) {
  const names=new Map(comp.kind.layers.map(l=>[l.id,l.name]));
  const items=new Map(Object.values(project.items).map(i=>[i.id,i.name]));
  function clean(v,key='') {
    if(Array.isArray(v))return v.map(x=>clean(x));
    if(!v||typeof v!=='object') {
      if(v!==null&&['parent','track_matte'].includes(key))return names.get(v)??v;
      if(v!==null&&key==='item')return items.get(v)??v;
      return v;
    }
    return Object.fromEntries(Object.keys(v).sort().filter(k=>!['id','uid'].includes(k)).map(k=>[k,clean(v[k],k)]));
  }
  return clean({...comp,kind:{...comp.kind,layers:comp.kind.layers.filter(l=>!excluded.has(l.name))}});
}
function normalizedKey(k,duration) {
  const time=k.time, scale=typeof k.scale==='number'?[k.scale,k.scale,100]:k.scale;
  const position=k.position,rotation=k.rotation??0,anchor=k.anchor??[540,960,0];
  if(!Number.isFinite(time)||time<0||time>duration||!finiteVector(position,3)||
    !finiteVector(scale,3)||!finiteVector(anchor,3)||!Number.isFinite(rotation)||
    scale[0]<=0||scale[1]<=0||!near(scale[0],scale[1],.1))throw Error('Invalid wholeCameraKeys entry: '+JSON.stringify(k));
  if(k.focus&&(!Array.isArray(k.focus.target)||k.focus.target.length!==2||!k.focus.target.every(Number.isFinite)||
    !Array.isArray(k.focus.screen)||k.focus.screen.length!==2||!k.focus.screen.every(Number.isFinite)))throw Error('Invalid focus declaration.');
  return {time,position,scale,rotation,anchor,focus:k.focus,label:k.label||'whole-frame key'};
}
function unwrap(raw) {
  const p=parse(raw);if(p.error||p.ok===false)throw Error('Native script error: '+JSON.stringify(p.error));
  return typeof p.output==='string'?parse(p.output):(p.output||p);
}
function affine(v) {
  const [px,py]=v.position,[ax,ay]=v.anchor,[sx,sy]=v.scale,r=v.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  const a=c*sx/100,b=s*sx/100,d=c*sy/100,e=-s*sy/100;
  return {a,b,c:e,d,tx:px-a*ax-e*ay,ty:py-b*ax-d*ay};
}
function transform(m,p) {return [m.a*p[0]+m.c*p[1]+m.tx,m.b*p[0]+m.d*p[1]+m.ty];}
function inverse(m,p) {const q=m.a*m.d-m.b*m.c;if(Math.abs(q)<1e-12)throw Error('Singular frame transform.');
  const x=p[0]-m.tx,y=p[1]-m.ty;return [(m.d*x-m.c*y)/q,(-m.b*x+m.a*y)/q];}
function backgroundAudit(root) {
  const filename=path.join(root,'media/bingo-paper-background.png'),manifestFile=path.join(root,'media/background-manifest.json');
  const manifest=read(manifestFile),backgroundSha256=hash(filename),backgroundManifestSha256=hash(manifestFile);
  if(manifest.file!=='bingo-paper-background.png'||manifest.containsCharacter!==false||manifest.sha256!==backgroundSha256)
    throw Error('Background manifest/hash/isolation mismatch.');
  const bytes=fs.readFileSync(filename);if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Expected PNG background.');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(manifest.width!==undefined&&manifest.width!==width||manifest.height!==undefined&&manifest.height!==height)throw Error('Background dimensions differ from manifest.');
  const opaque=execute(MAGICK,['identify','-format','%[opaque]',native(filename)]).toLowerCase()==='true';
  if(!opaque)throw Error('Whole-frame background must be opaque.');
  return {filename,manifestFile,backgroundSha256,backgroundManifestSha256,width,height,opaque,containsCharacter:false,manifest};
}

function auditPlan(root,plan,bg) {
  const dir=path.join(root,plan.id),mainFile=path.join(dir,'projects',plan.id+'.ecproj'),textFile=path.join(dir,'projects',plan.id+'-text-only.ecproj');
  const layoutFile=path.join(dir,'qa/layout.json'),textLayoutFile=path.join(dir,'qa/text-only-layout.json');
  const report={plan:plan.id,passed:false,mainProjectSha256:hash(mainFile),textOnlyProjectSha256:hash(textFile),
    layoutSha256:hash(layoutFile),textOnlyLayoutSha256:hash(textLayoutFile),backgroundSha256:bg.backgroundSha256,
    backgroundManifestSha256:bg.backgroundManifestSha256,structureChecks:[],nativeCamera:null};
  const check=(id,passed,detail)=>report.structureChecks.push({id,passed:!!passed,...(detail===undefined?{}:{detail})});
  const assert=()=>{const bad=report.structureChecks.filter(c=>!c.passed);if(bad.length)throw Error(plan.id+': '+bad.map(c=>c.id).join(', '));};
  try {
    const main=read(mainFile),text=read(textFile),layout=read(layoutFile),textLayout=read(textLayoutFile);
    const comps=p=>Object.values(p.items||{}).filter(i=>i.kind?.type==='Comp');
    check('one_comp_each',comps(main).length===1&&comps(text).length===1);assert();
    const comp=comps(main)[0],preview=comps(text)[0],layers=comp.kind.layers,previewLayers=preview.kind.layers;
    const footage=p=>Object.values(p.items||{}).filter(i=>i.kind?.type==='Footage');
    const cutout=path.join(root,'media/character-cutout.png'),mainFootage=footage(main),textFootage=footage(text);
    check('main_footage_background_and_original_cutout',mainFootage.length===2&&mainFootage.every(f=>[bg.filename,cutout].some(p=>same(f.kind.path,p)))&&[bg.filename,cutout].every(p=>mainFootage.some(f=>same(f.kind.path,p))));
    check('text_only_has_background_only',textFootage.length===1&&textFootage.every(f=>same(f.kind.path,bg.filename)));
    check('background_dimensions_match_png',textFootage.every(f=>f.kind.width===bg.width&&f.kind.height===bg.height&&!f.kind.missing));
    const references=strings(text).filter(s=>/\.(?:png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr|avif|heic)(?:$|[?#])/i.test(s));
    check('text_only_no_hidden_character_reference',references.length>0&&references.every(s=>s==='bingo-paper-background.png'||same(s,bg.filename)),{rasterReferences:references});
    const cameras=layers.filter(l=>l.name===CAMERA),previewCameras=previewLayers.filter(l=>l.name===CAMERA);
    check('one_whole_frame_camera_each',cameras.length===1&&previewCameras.length===1);assert();
    const camera=cameras[0],previewCamera=previewCameras[0];
    check('camera_is_root_2d_null',camera.parent===null&&camera.source?.type==='Null'&&!camera.switches?.three_d&&previewCamera.parent===null&&previewCamera.source?.type==='Null');
    check('all_main_layers_direct_children',layers.every(l=>l.id===camera.id||l.parent===camera.id),{layers:layers.length});
    check('all_preview_layers_direct_children',previewLayers.every(l=>l.id===previewCamera.id||l.parent===previewCamera.id),{layers:previewLayers.length});
    check('no_local_viewports_or_global_effects',layers.every(l=>!l.name.toLowerCase().includes('viewport')&&!l.switches?.adjustment&&!['Camera','Light'].includes(l.source?.type)));
    check('camera_no_effects_or_masks',!effectsOrMasks(camera)&&!effectsOrMasks(previewCamera));
    check('canvas_and_duration',comp.kind.width===1080&&comp.kind.height===1920&&comp.kind.duration===plan.duration*TICKS&&
      near(comp.kind.frame_rate?.num/comp.kind.frame_rate?.den,FPS)&&preview.kind.width===1080&&preview.kind.height===1920&&preview.kind.duration===comp.kind.duration);
    const charAsset=mainFootage.find(f=>same(f.kind.path,cutout)),character=layers.filter(l=>l.source?.type==='Footage'&&l.source.item===charAsset?.id);
    const placeholders=previewLayers.filter(l=>/^CHARACTER (?:RESERVED|PREVIEW|TRACKING)/.test(l.name));
    check('one_original_character_and_one_placeholder',character.length===1&&placeholders.length===1);assert();
    const char=character[0],localValues=values(char);
    check('character_source_metadata',charAsset.kind.width===905&&charAsset.kind.height===1810&&charAsset.kind.kind==='Still'&&!charAsset.kind.missing);
    check('character_local_base_unchanged',Object.entries(BASE).every(([k,v])=>Array.isArray(v)?vector(localValues.get('transform/'+k),v):near(localValues.get('transform/'+k),v)),
      {position:localValues.get('transform/position'),scale:localValues.get('transform/scale'),anchor:localValues.get('transform/anchor')});
    check('character_no_local_animation_effects_masks',animated(char.props).length===0&&!effectsOrMasks(char));
    check('character_normal_2d_full_duration',char.parent===camera.id&&char.track_matte===null&&char.blend_mode==='Normal'&&char.auto_orient==='Off'&&
      char.start_time===0&&char.in_point===0&&char.out_point===plan.duration*TICKS&&char.stretch===100&&char.switches?.video===true&&char.switches?.three_d===false);
    if(motion.characterBase)check('exported_character_base_unchanged',Object.entries(BASE).every(([k,v])=>Array.isArray(v)?vector(motion.characterBase[k],v):near(motion.characterBase[k],v)));
    const mainNormal=canonical(main,comp,new Set([char.name])),previewNormal=canonical(text,preview,new Set([placeholders[0].name]));
    check('main_preview_all_other_structure_identical',JSON.stringify(mainNormal)===JSON.stringify(previewNormal),{mainCanonicalSha256:digest(mainNormal),textCanonicalSha256:digest(previewNormal)});
    const sourceKeys=layout.wholeCameraKeys||plan.wholeCameraKeys;
    check('main_text_camera_declarations_identical',Array.isArray(sourceKeys)&&JSON.stringify(layout.wholeCameraKeys)===JSON.stringify(textLayout.wholeCameraKeys));assert();
    const keys=sourceKeys.map(k=>normalizedKey(k,plan.duration));
    check('camera_has_position_scale_rotation_changes',keys.length>=3&&new Set(keys.map(k=>JSON.stringify(k.position))).size>1&&
      new Set(keys.map(k=>JSON.stringify(k.scale))).size>1&&Math.max(...keys.map(k=>k.rotation))-Math.min(...keys.map(k=>k.rotation))>.1);
    const backgroundAsset=textFootage[0],backgrounds=previewLayers.filter(l=>l.name===BACKGROUND&&l.source?.type==='Footage'&&l.source.item===backgroundAsset.id);
    check('named_full_frame_background',backgrounds.length===1&&backgrounds.every(l=>l.parent===previewCamera.id));assert();
    const background=backgrounds[0],times=[...new Set(keys.map(k=>Math.min(k.time,plan.duration-1/FPS)).concat(keys.slice(1).map((k,i)=>(k.time+keys[i].time)/2)))].sort((a,b)=>a-b);
    const script=path.join(dir,'qa/wholeframe-native-readback.jsx');
    const jsx=`var keys=${JSON.stringify(keys)},times=${JSON.stringify(times)},camera=${previewCamera.id},background=${background.id},cache={};\n`+
      `function values(id,t){var out={},names=['position','scale','rotation','anchor','opacity'];for(var i=0;i<names.length;i++){var p=app.run('prop.get',{layer:id,path:'transform/'+names[i],time:t});out[names[i]]=p.value;if(i===0)out.sampledTime=p.time;}return out;}\n`+
      `function cam(t){var s=String(t);if(!cache[s])cache[s]=values(camera,t);return cache[s];}\n`+
      `var probe=app.run('prop.get',{layer:camera,path:'transform/position',time:0}),rows=[];\n`+
      `for(var i=0;i<keys.length;i++){var k=keys[i],nearest=null,delta=Infinity;for(var j=0;j<probe.keys.length;j++){var q=probe.keys[j];if(typeof q.compTime==='number'&&Math.abs(q.compTime-k.time)<delta){nearest=q;delta=Math.abs(q.compTime-k.time);}}if(!nearest||delta>1/30+.000001)throw Error('Missing saved whole-frame key');rows.push({index:i,declaredTime:k.time,sampledTime:nearest.compTime,values:cam(nearest.compTime)});}\n`+
      `var coverage=[];for(var i=0;i<times.length;i++)coverage.push({time:times[i],camera:cam(times[i]),background:values(background,times[i])});writeLn(JSON.stringify({rows:rows,coverage:coverage}));\n`;
    fs.writeFileSync(script,jsx);
    const args=['--project',native(textFile),'script',native(script),'--json'],raw=execute(EC,args),nativeData=unwrap(raw);
    save(path.join(dir,'qa/wholeframe-native-command.json'),{exit:0,args,projectSha256:report.textOnlyProjectSha256,scriptSha256:hash(script),output:parse(raw)});
    if(nativeData.rows?.length!==keys.length||nativeData.coverage?.length!==times.length)throw Error('Native whole-frame sample count mismatch.');
    const rows=nativeData.rows.map((r,i)=>{const k=keys[i],v=r.values,m=affine(v),focus=k.focus?transform(m,k.focus.target):null;
      const focusError=focus?Math.hypot(focus[0]-k.focus.screen[0],focus[1]-k.focus.screen[1]):null;
      const passed=r.index===i&&Math.abs(r.sampledTime-k.time)<=1/FPS+1e-6&&vector(v.position,k.position,3)&&vector(v.scale,k.scale,.1)&&
        vector(v.anchor,k.anchor,.001)&&near(v.rotation,k.rotation,.05)&&near(v.opacity,100,.01)&&(focusError===null||focusError<=3);
      return {...r,label:k.label,expected:k,actualFocus:focus,focusErrorPixels:focusError,passed};});
    const corners=[[0,0],[1080,0],[0,1920],[1080,1920]],coverage=nativeData.coverage.map(r=>{
      const cameraMatrix=affine(r.camera),backgroundMatrix=affine(r.background);
      const localCorners=corners.map(p=>inverse(backgroundMatrix,inverse(cameraMatrix,p)));
      const margins=localCorners.map(p=>Math.min(p[0],bg.width-p[0],p[1],bg.height-p[1]));
      const active=r.time>=background.in_point/TICKS&&r.time<background.out_point/TICKS;
      return {...r,screenCornersInBackgroundPixels:localCorners,minimumSourceMarginPixels:Math.min(...margins),
        passed:active&&Math.abs(r.camera.sampledTime-r.time)<=1/FPS+1e-6&&near(r.background.opacity,100,.01)&&margins.every(m=>m>=-.5)};});
    report.nativeCamera={rows,passed:rows.every(r=>r.passed),sampleCount:rows.length,positionTolerancePixels:3,scaleTolerancePercent:.1,
      rotationToleranceDegrees:.05,savedTimeToleranceSeconds:1/FPS};
    report.backgroundCoverage={samples:coverage,passed:coverage.every(r=>r.passed),sampleCount:coverage.length,
      minimumSourceMarginPixels:Math.min(...coverage.map(r=>r.minimumSourceMarginPixels)),opaqueBackground:true,
      method:'Inverse native whole-frame and background affine transforms: screen corners inside opaque background at all camera keys and interval midpoints',allVideoFramesClaimed:false};
    check('native_camera_keys_match',report.nativeCamera.passed);
    check('sampled_background_covers_frame',report.backgroundCoverage.passed);
    check('audit_inputs_unchanged',hash(mainFile)===report.mainProjectSha256&&hash(textFile)===report.textOnlyProjectSha256&&
      hash(layoutFile)===report.layoutSha256&&hash(textLayoutFile)===report.textOnlyLayoutSha256&&hash(bg.filename)===bg.backgroundSha256&&hash(bg.manifestFile)===bg.backgroundManifestSha256);
    assert();report.passed=true;save(path.join(dir,'qa/wholeframe-audit.json'),report);return report;
  }catch(error){report.error=error.message;save(path.join(dir,'qa/wholeframe-audit.json'),report);throw Object.assign(error,{wholeframeReport:report});}
}

export function auditWholeFrame(root,{selected=motion.plans}={}) {
  root=path.resolve(root);const out=path.join(root,'qa/wholeframe-audit.json'),report={status:'RUNNING',plans:[],
    characterImageInputToAI:'NONE',nativeProjectSaved:false,rasterOutput:'NONE',fixedScreenOpaqueCoreComparisonApplicable:false};
  try {
    const bg=backgroundAudit(root);Object.assign(report,{backgroundSha256:bg.backgroundSha256,backgroundManifestSha256:bg.backgroundManifestSha256,
      background:{file:bg.manifest.file,width:bg.width,height:bg.height,opaque:bg.opaque,containsCharacter:false}});
    report.characterAssets=Object.entries(SOURCE_HASHES).map(([name,expectedSha256])=>({name,expectedSha256,actualSha256:hash(path.join(root,'media',name))}));
    if(report.characterAssets.some(a=>a.expectedSha256!==a.actualSha256))throw Error('Original artwork bytes changed.');
    const api=parse(execute(EC,['--empty','commands','--filter','prop.get','--json'])).find(c=>c.id==='prop.get');
    if(!api||!/time\?.*comp s/.test(api.params||''))throw Error('Native prop.get time API unavailable.');report.nativeApi=api;
    for(const plan of selected){try{report.plans.push(auditPlan(root,plan,bg));}catch(error){if(error.wholeframeReport)report.plans.push(error.wholeframeReport);throw error;}}
    report.status='PASS_NATIVE_WHOLEFRAME';report.scope='Owner-authorized whole-frame native transform including original artwork; character local artwork/transform remains unchanged.';
    report.limitations=['Background corner coverage samples all declared camera keys and their interval midpoints, not every rendered video frame.',
      'Visual scene/landing review and final video decode/audio verification are separate checks.','No character-containing raster was displayed to AI.'];
    save(out,report);return report;
  }catch(error){report.status='FAIL';report.error=error.message;save(out,report);throw error;}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=process.argv[2]||process.env.OSAYU_THANKYOU_ROOT||'/home/pui/Videos/Osayu-Bingo/2026-10-25/thankyou-wholeframe-v3';
  const selected=process.argv[3]?motion.plans.filter(p=>p.id===process.argv[3]):motion.plans;
  if(!selected?.length)throw Error('Unknown or missing plan.');
  const r=auditWholeFrame(root,{selected});console.log(JSON.stringify({status:r.status,plans:r.plans.map(p=>({plan:p.plan,passed:p.passed,keys:p.nativeCamera.sampleCount,coverageSamples:p.backgroundCoverage.sampleCount}))}));
}
