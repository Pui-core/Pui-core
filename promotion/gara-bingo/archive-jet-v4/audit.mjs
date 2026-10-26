/** Metadata-only archive audit. Never displays archive or character-containing frames. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root as defaultRoot, plans, loadEdit, playbackRate, TICKS, fps as FPS} from './config.mjs';

const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const MAGICK = '/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const CAMERA = 'WHOLE FRAME CAMERA', BACKGROUND = 'BINGO PAPER BACKGROUND';
const CHARACTER='CHARACTER ORIGINAL FIXED',PREVIEW_CHARACTER='CHARACTER RESERVED PREVIEW ONLY';
const CHARACTER_BASE={position:[730,1290,0],anchor:[452.5,905,0],scale:[380/905*100,380/905*100,100],rotation:0,opacity:100};
const CUTOUT_SHA256='e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef';
const MEDIA_EXTENSION = /\.(?:png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr|avif|heic|mp4|m4v|mov|mkv|webm|avi|mpeg|mpg|mxf|wav|mp3|m4a|flac|ogg|aac)(?:$|[?#])/i;
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
export function matchingSpeechEvidence(edit,layers,archiveSlots,layout) {
  const shots=edit.shots.filter(s=>s.kind==='archive');
  const interval=l=>[l.in_point/TICKS,l.out_point/TICKS];
  const overlap=(a,b)=>Math.max(0,Math.min(a[1],b[1])-Math.max(a[0],b[0]));
  const wipes=layers.filter(l=>/^FULL SCENE PAPER WIPE /.test(l.name)&&l.switches?.video!==false);
  const rows=edit.voice.map(v=>{
    const duration=(v.sourceOut-v.sourceIn)/v.playbackRate,voice=[v.start,v.start+duration];
    const matches=shots.filter(s=>s.voiceId===v.id),s=matches[0];
    const layer=s&&layers.find(l=>l.name==='ARCHIVE SHOT '+s.id),slot=s&&archiveSlots.find(x=>x.shotId===s.id);
    const declaration=s&&layout.archiveLayers?.find(d=>d.shotId===s.id);
    const blockers=layer?layers.slice(0,layers.indexOf(layer)).filter(l=>l.source?.type!=='Null'&&l.switches?.video!==false&&overlap(interval(l),voice)>1e-7&&
      !['INSERT CAPTION PAPER ','INSERT CAPTION ','INSERT PROMISE TITLE ','INSERT HEADER PAPER ','INSERT HEADER '].some(prefix=>l.name===prefix+s.id)):[];
    const transitionOverlaps=wipes.filter(l=>overlap(interval(l),voice)>1e-7).map(l=>({name:l.name,interval:interval(l)}));
    const sourceAtVoiceStart=s?s.sourceIn+(v.start-s.start)*s.playbackRate:null;
    const sourceAtVoiceEnd=s?s.sourceIn+(voice[1]-s.start)*s.playbackRate:null;
    const nativeInterval=layer?interval(layer):null;
    const passed=matches.length===1&&!!slot?.passed&&declaration?.fullScreenLive===true&&declaration.voiceId===v.id&&
      near(s.playbackRate,v.playbackRate)&&near(sourceAtVoiceStart,v.sourceIn)&&near(sourceAtVoiceEnd,v.sourceOut)&&
      s.start<=voice[0]+1e-7&&s.end>=voice[1]-1e-7&&nativeInterval[0]<=voice[0]+1e-7&&nativeInterval[1]>=voice[1]-1e-7&&
      layer.switches?.video===true&&transitionOverlaps.length===0&&blockers.length===0;
    return {voiceId:v.id,shotId:s?.id,voiceInterval:voice,nativeInterval,sourceInterval:[v.sourceIn,v.sourceOut],sourceAtVoiceStart,sourceAtVoiceEnd,
      playbackRate:v.playbackRate,fullScreenLive:declaration?.fullScreenLive===true,transitionOverlaps,blockingLayers:blockers.map(l=>l.name),passed};
  });
  const unique=shots.length===edit.voice.length&&new Set(shots.map(s=>s.voiceId)).size===edit.voice.length&&
    Array.isArray(edit.inserts)&&JSON.stringify(edit.inserts)===JSON.stringify(shots);
  return {passed:unique&&rows.length>0&&rows.every(r=>r.passed),voiceCount:rows.length,matchingArchiveCount:shots.length,rows,
    wipeIntervals:wipes.map(l=>({name:l.name,interval:interval(l)})),nativeLayerOrder:'front-to-back',
    scope:'Native source/timeline/rate, enabled archive geometry, complete speech coverage and absence of opaque scene wipes or unrelated foreground layers; no claim of AI lip/face inspection.'};
}
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

function auditPlan(root,plan,bg,edit,clips) {
  const dir=path.join(root,plan.id),mainFile=path.join(dir,'projects',plan.id+'.ecproj'),textFile=path.join(dir,'projects',plan.id+'-text-only.ecproj');
  const layoutFile=path.join(dir,'qa/layout.json'),textLayoutFile=path.join(dir,'qa/text-only-layout.json');
  const report={plan:plan.id,passed:false,mainProjectSha256:hash(mainFile),textOnlyProjectSha256:hash(textFile),
    layoutSha256:hash(layoutFile),textOnlyLayoutSha256:hash(textLayoutFile),backgroundSha256:bg.backgroundSha256,
    backgroundManifestSha256:bg.backgroundManifestSha256,editManifestSha256:hash(path.join(root,'edit-manifest.json')),clips,structureChecks:[],nativeCamera:null};
  const check=(id,passed,detail)=>report.structureChecks.push({id,passed:!!passed,...(detail===undefined?{}:{detail})});
  const assert=()=>{const bad=report.structureChecks.filter(c=>!c.passed);if(bad.length)throw Error(plan.id+': '+bad.map(c=>c.id).join(', '));};
  try {
    const main=read(mainFile),text=read(textFile),layout=read(layoutFile),textLayout=read(textLayoutFile);
    const comps=p=>Object.values(p.items||{}).filter(i=>i.kind?.type==='Comp');
    check('one_comp_each',comps(main).length===1&&comps(text).length===1);assert();
    const comp=comps(main)[0],preview=comps(text)[0],layers=comp.kind.layers,previewLayers=preview.kind.layers;
    const footage=p=>Object.values(p.items||{}).filter(i=>i.kind?.type==='Footage');
    const cutout=path.join(root,'media/character-cutout.png');
    const mainFootage=footage(main),textFootage=footage(text),allowed=[bg.filename,cutout,...clips.map(c=>path.join(root,c.file))];
    check('main_footage_background_and_selected_clips_only',mainFootage.length===allowed.length&&mainFootage.every(f=>allowed.some(p=>same(f.kind.path,p)))&&allowed.every(p=>mainFootage.some(f=>same(f.kind.path,p))));
    check('text_only_has_background_only',textFootage.length===1&&textFootage.every(f=>same(f.kind.path,bg.filename)));
    check('background_dimensions_match_png',textFootage.every(f=>f.kind.width===bg.width&&f.kind.height===bg.height&&!f.kind.missing));
    const references=strings(text).filter(s=>MEDIA_EXTENSION.test(s));
    check('preview_no_hidden_image_video_audio_reference',references.length>0&&references.every(s=>s==='bingo-paper-background.png'||same(s,bg.filename)),{mediaReferences:references});
    const cameras=layers.filter(l=>l.name===CAMERA),previewCameras=previewLayers.filter(l=>l.name===CAMERA);
    check('one_whole_frame_camera_each',cameras.length===1&&previewCameras.length===1);assert();
    const camera=cameras[0],previewCamera=previewCameras[0];
    check('camera_is_root_2d_null',camera.parent===null&&camera.source?.type==='Null'&&!camera.switches?.three_d&&previewCamera.parent===null&&previewCamera.source?.type==='Null');
    check('all_main_layers_direct_children',layers.every(l=>l.id===camera.id||l.parent===camera.id),{layers:layers.length});
    check('all_preview_layers_direct_children',previewLayers.every(l=>l.id===previewCamera.id||l.parent===previewCamera.id),{layers:previewLayers.length});
    check('no_local_viewports_or_global_effects',layers.every(l=>!l.name.toLowerCase().includes('viewport')&&!l.switches?.adjustment&&!['Camera','Light'].includes(l.source?.type)));
    check('camera_no_effects_or_masks',!effectsOrMasks(camera)&&!effectsOrMasks(previewCamera));
    check('canvas_and_duration',comp.kind.width===1080&&comp.kind.height===1920&&near(comp.kind.duration/TICKS,plan.duration,1e-7)&&
      near(comp.kind.frame_rate?.num/comp.kind.frame_rate?.den,FPS)&&preview.kind.width===1080&&preview.kind.height===1920&&preview.kind.duration===comp.kind.duration);
    const shots=edit.shots.filter(s=>s.kind==='archive'),names=new Set(shots.map(s=>'ARCHIVE SHOT '+s.id));
    check('archive_slot_count_matches_manifest',Array.isArray(layout.archiveLayers)&&layout.archiveLayers.length===shots.length&&Array.isArray(textLayout.archiveLayers)&&textLayout.archiveLayers.length===shots.length&&layers.filter(l=>l.name.startsWith('ARCHIVE SHOT ')).length===shots.length&&previewLayers.filter(l=>l.name.startsWith('ARCHIVE SHOT ')).length===shots.length);assert();
    report.archiveSlots=shots.map(s=>{
      const name='ARCHIVE SHOT '+s.id,m=layers.filter(l=>l.name===name),p=previewLayers.filter(l=>l.name===name);
      if(m.length!==1||p.length!==1)throw Error('Archive/placeholder pair missing: '+s.id);
      const a=m[0],b=p[0],av=values(a),bv=values(b),asset=mainFootage.find(f=>f.id===a.source?.item),decl=layout.archiveLayers.find(d=>d.shotId===s.id),pd=textLayout.archiveLayers.find(d=>d.shotId===s.id);
      const base={position:decl?.basePosition,scale:decl?.baseScale,rotation:0,opacity:100};
      const baseEqual=finiteVector(base.position,3)&&finiteVector(base.scale,3)&&base.scale[0]>0&&base.scale[1]>0&&[av,bv].every(v=>Object.entries(base).every(([k,x])=>Array.isArray(x)?vector(v.get('transform/'+k),x):near(v.get('transform/'+k),x)));
      const am=affine({position:av.get('transform/position'),scale:av.get('transform/scale'),anchor:av.get('transform/anchor'),rotation:av.get('transform/rotation')}),bm=affine({position:bv.get('transform/position'),scale:bv.get('transform/scale'),anchor:bv.get('transform/anchor'),rotation:bv.get('transform/rotation')});
      const mainCore=[[0,0],[720,0],[720,1280],[0,1280]].map(p=>transform(am,p)),previewCore=[[-360,-640],[360,-640],[360,640],[-360,640]].map(p=>transform(bm,p));
      const geometryError=Math.max(...mainCore.map((p,i)=>Math.hypot(p[0]-previewCore[i][0],p[1]-previewCore[i][1])));
      const interval=[a,b].every(l=>near(l.in_point/TICKS,s.start,1/120)&&near(l.out_point/TICKS,s.end,1/120)&&l.stretch===100&&l.track_matte===null&&l.blend_mode==='Normal'&&!l.switches?.three_d&&l.switches?.video===true&&!animated(l.props).length&&!effectsOrMasks(l));
      const declaration=[decl,pd].every(d=>d?.name===name&&d.clipFile===s.id+'.mp4'&&near(d.start,s.start)&&near(d.end,s.end)&&near(d.sourceIn,s.sourceIn)&&near(d.sourceOut,s.sourceOut)&&d.sourceWidth===720&&d.sourceHeight===1280);
      return {shotId:s.id,name,mainCoreQuad:mainCore,previewCoreQuad:previewCore,geometryErrorPixels:geometryError,
        permittedDifferences:['native video footage versus gray shape','footage anchor [360,640,0] versus centered shape anchor [0,0,0]','gray preview stroke extends beyond the matched 720x1280 core'],
        passed:baseEqual&&interval&&declaration&&a.parent===camera.id&&b.parent===previewCamera.id&&a.source?.type==='Footage'&&b.source?.type==='Shape'&&vector(bv.get('contents/group/contents/rect/size'),[720,1280])&&vector(bv.get('contents/group/contents/rect/position'),[0,0])&&asset?.kind.width===720&&asset.kind.height===1280&&!asset.kind.missing&&same(asset.kind.path,path.join(root,'media/clips',s.id+'.mp4'))&&vector(av.get('transform/anchor'),[360,640,0])&&vector(bv.get('transform/anchor'),[0,0,0])&&geometryError<.001&&near(a.start_time/TICKS,s.start,1/120)};
    });
    check('archive_and_placeholder_local_geometry_timing_match',report.archiveSlots.every(s=>s.passed),report.archiveSlots);
    report.matchingSpeech=matchingSpeechEvidence(edit,layers,report.archiveSlots,layout);
    check('all_speech_has_matching_full_screen_native_archive',report.matchingSpeech.passed,report.matchingSpeech);
    const characters=layers.filter(l=>l.name===CHARACTER),previewCharacters=previewLayers.filter(l=>l.name===PREVIEW_CHARACTER);
    check('one_original_character_and_one_gray_character',characters.length===1&&previewCharacters.length===1);assert();
    const character=characters[0],placeholder=previewCharacters[0],cv=values(character),asset=mainFootage.find(f=>f.id===character.source?.item);
    check('original_character_bytes_and_local_base_unchanged',hash(cutout)===CUTOUT_SHA256&&character.source?.type==='Footage'&&asset?.kind.width===905&&asset.kind.height===1810&&same(asset.kind.path,cutout)&&Object.entries(CHARACTER_BASE).every(([k,v])=>Array.isArray(v)?vector(cv.get('transform/'+k),v):near(cv.get('transform/'+k),v))&&!animated(character.props).length&&!effectsOrMasks(character)&&character.parent===camera.id&&character.stretch===100&&character.track_matte===null&&character.blend_mode==='Normal'&&!character.switches?.three_d&&near(character.in_point/TICKS,0)&&near(character.out_point/TICKS,plan.duration));
    const pv=values(placeholder);
    check('gray_character_is_not_a_footage_reference',placeholder.source?.type==='Shape'&&placeholder.parent===previewCamera.id&&!animated(placeholder.props).length&&!effectsOrMasks(placeholder)&&vector(pv.get('transform/position'),[730,1290,0])&&vector(pv.get('transform/scale'),[100,100,100])&&vector(pv.get('transform/anchor'),[0,0,0])&&near(pv.get('transform/rotation'),0)&&vector(pv.get('contents/group/contents/rect/size'),[380,760])&&near(placeholder.in_point/TICKS,0)&&near(placeholder.out_point/TICKS,plan.duration));
    report.character={sourceSha256:hash(cutout),localBaseUnchanged:report.structureChecks.find(c=>c.id==='original_character_bytes_and_local_base_unchanged').passed,wholeFrameParent:CAMERA,previewReplacement:PREVIEW_CHARACTER};
    names.add(CHARACTER);names.add(PREVIEW_CHARACTER);
    const mainNormal=canonical(main,comp,names),previewNormal=canonical(text,preview,names);
    check('main_preview_all_other_structure_identical',JSON.stringify(mainNormal)===JSON.stringify(previewNormal),{mainCanonicalSha256:digest(mainNormal),textCanonicalSha256:digest(previewNormal)});
    const sourceKeys=layout.wholeCameraKeys;
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
    const liveCoverage=nativeData.coverage.flatMap(r=>report.matchingSpeech.rows.filter(v=>r.time>=v.voiceInterval[0]-1e-7&&r.time<v.voiceInterval[1]-1e-7).map(v=>{
      const slot=report.archiveSlots.find(s=>s.shotId===v.shotId),layer=layers.find(l=>l.name===slot.name),lv=values(layer),cm=affine(r.camera);
      const lm=affine({position:lv.get('transform/position'),scale:lv.get('transform/scale'),anchor:lv.get('transform/anchor'),rotation:lv.get('transform/rotation')});
      const localCorners=corners.map(p=>inverse(lm,inverse(cm,p))),minimumMargin=Math.min(...localCorners.map(p=>Math.min(p[0],720-p[0],p[1],1280-p[1])));
      return {time:r.time,voiceId:v.voiceId,shotId:v.shotId,localCorners,minimumMarginPixels:minimumMargin,passed:minimumMargin>=-.1};
    }));
    report.matchingSpeech.frameCoverage={passed:liveCoverage.length>0&&report.matchingSpeech.rows.every(v=>liveCoverage.some(r=>r.voiceId===v.voiceId))&&liveCoverage.every(r=>r.passed),samples:liveCoverage,allVideoFramesClaimed:false};
    check('matching_live_video_covers_frame_at_sampled_camera_values',report.matchingSpeech.frameCoverage.passed);
    check('audit_inputs_unchanged',hash(mainFile)===report.mainProjectSha256&&hash(textFile)===report.textOnlyProjectSha256&&
      hash(layoutFile)===report.layoutSha256&&hash(textLayoutFile)===report.textOnlyLayoutSha256&&hash(bg.filename)===bg.backgroundSha256&&hash(bg.manifestFile)===bg.backgroundManifestSha256&&hash(path.join(root,'edit-manifest.json'))===report.editManifestSha256&&clips.every(c=>hash(path.join(root,c.file))===c.sha256));
    assert();report.passed=true;save(path.join(dir,'qa/audit.json'),report);return report;
  }catch(error){report.error=error.message;save(path.join(dir,'qa/audit.json'),report);throw Object.assign(error,{wholeframeReport:report});}
}

export function auditArchive(root=defaultRoot,{selected=plans}={}) {
  root=path.resolve(root);const out=path.join(root,'qa/audit.json'),report={status:'RUNNING',plans:[],
    characterImageInputToAI:'NONE',archiveVideoInputToAI:'NONE',nativeProjectSaved:false,rasterOutput:'NONE'};
  try {
    const bg=backgroundAudit(root);Object.assign(report,{backgroundSha256:bg.backgroundSha256,backgroundManifestSha256:bg.backgroundManifestSha256,
      background:{file:bg.manifest.file,width:bg.width,height:bg.height,opaque:bg.opaque,containsCharacter:false}});
    const edit=loadEdit(root),clips=edit.shots.filter(s=>s.kind==='archive').map(s=>({id:s.id,file:'media/clips/'+s.id+'.mp4',sha256:hash(path.join(root,'media/clips',s.id+'.mp4')),playbackRate:s.playbackRate,sourceDuration:s.sourceOut-s.sourceIn,targetDuration:s.end-s.start}));
    if(!near(edit.playbackRate,playbackRate)||edit.pitchPreserved!==true||edit.audioCutMode!=='direct-container-seek-continuous-samples'||edit.alignedAudio)throw Error('Pitch-preserving direct-source edit required.');
    if(edit.compositionMode!=='live-during-all-speech'||edit.musicStart!==0||edit.musicGainMode!=='constant')throw Error('Matching live speech and constant music from zero are required.');
    if(!near(edit.duration*FPS,Math.round(edit.duration*FPS),1e-6)||edit.voice.some(v=>!near(v.playbackRate,playbackRate)||v.pitchPreserved!==true))throw Error('Invalid frame clock or voice playback rate.');
    const sortedVoice=[...edit.voice].sort((a,b)=>a.start-b.start);
    for(let i=1;i<sortedVoice.length;i++){const previous=sortedVoice[i-1];if(sortedVoice[i].start<previous.start+(previous.sourceOut-previous.sourceIn)/previous.playbackRate-1/FPS)throw Error('Voice cues overlap after retiming.');}
    Object.assign(report,{playbackRate,pitchPreserved:true,audioCutMode:edit.audioCutMode,frameCount:Math.round(edit.duration*FPS),compositionMode:edit.compositionMode,musicStart:edit.musicStart,musicGainMode:edit.musicGainMode});
    report.editManifestSha256=hash(path.join(root,'edit-manifest.json'));report.clips=clips;
    if(!clips.length)throw Error('At least one archive clip is required.');
    const extractionFile=path.join(root,'qa/extraction.json'),extraction=read(extractionFile);
    if(extraction.editManifestSha256!==report.editManifestSha256||!extraction.archive?.sha256||!edit.voice.length||extraction.voice?.editManifestSha256!==report.editManifestSha256||hash(path.join(root,'media/voice-mix.wav'))!==extraction.voice.sha256)throw Error('Archive extraction or voice timebase evidence is stale.');
    const ve=extraction.voice;
    if(ve.sourceMode!=='direct-container-seek-continuous-samples'||ve.cutMode!=='direct-container-seek-continuous-samples'||!near(ve.playbackRate??ve.rate,playbackRate)||ve.pitchPreserved!==true||ve.sourceArchiveSha256!==extraction.archive.sha256)throw Error('Voice must be cut directly from the archive at the declared pitch-preserving speed.');
    for(const v of edit.voice){const cue=ve.events?.find(c=>c.id===v.id),duration=(v.sourceOut-v.sourceIn)/v.playbackRate;if(!cue||!near(cue.sourceIn,v.sourceIn)||!near(cue.sourceOut,v.sourceOut)||!near(cue.start,v.start)||!near(cue.duration,duration,1e-6)||!near(cue.playbackRate??cue.rate,v.playbackRate)||hash(path.join(root,'media/voice',v.id+'.wav'))!==cue.sha256)throw Error('Retimed voice cue evidence is stale: '+v.id);}
    for(const shot of edit.shots.filter(s=>s.kind==='archive')){
      const x=extraction.clips?.find(c=>c.id===shot.id),sealed=clips.find(c=>c.id===shot.id);
      if(!x||x.sha256!==sealed.sha256||!near(x.sourceIn,shot.sourceIn)||!near(x.sourceOut,shot.sourceOut)||!near(shot.playbackRate,playbackRate)||!near(x.playbackRate??x.rate,shot.playbackRate)||!near(x.sourceDuration,shot.sourceOut-shot.sourceIn)||!near(x.targetDuration??x.duration,shot.end-shot.start)||!near((shot.sourceOut-shot.sourceIn)/shot.playbackRate,shot.end-shot.start)||x.frames!==Math.round((shot.end-shot.start)*FPS)||x.archiveSha256!==extraction.archive.sha256)throw Error('Clip extraction clock/hash/rate mismatch: '+shot.id);
    }
    report.extractionSha256=hash(extractionFile);report.sourceArchiveSha256=extraction.archive.sha256;
    const api=parse(execute(EC,['--empty','commands','--filter','prop.get','--json'])).find(c=>c.id==='prop.get');
    if(!api||!/time\?.*comp s/.test(api.params||''))throw Error('Native prop.get time API unavailable.');report.nativeApi=api;
    const errors=[];
    for(const plan of selected){try{report.plans.push(auditPlan(root,{...plan,duration:edit.duration},bg,edit,clips));}catch(error){if(error.wholeframeReport)report.plans.push(error.wholeframeReport);errors.push(error.message);}}
    if(errors.length)throw Error(errors.join('; '));
    report.status='PASS_NATIVE_ARCHIVE_JET';report.scope='Owner-authorized ordinary native clip editing and whole-frame transform; actual archive frames are never displayed to AI.';
    report.limitations=['Background corner coverage samples all declared camera keys and their interval midpoints, not every rendered video frame.',
      'Visual review uses gray placeholders and cannot confirm expressions, mouth shapes, or framing of the actual archive.','Metadata/ASR alone cannot establish freedom from audio dropouts or clicks. Final AAC waveform QC and listening are separate checks.','No character-containing raster or video was displayed to AI.'];
    save(out,report);return report;
  }catch(error){report.status='FAIL';report.error=error.message;save(out,report);throw error;}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=process.argv[2]||defaultRoot;
  const selected=process.argv[3]?plans.filter(p=>p.id===process.argv[3]):plans;
  if(!selected?.length)throw Error('Unknown or missing plan.');
  try{const r=auditArchive(root,{selected});console.log(JSON.stringify({status:r.status,plans:r.plans.map(p=>({plan:p.plan,passed:p.passed,keys:p.nativeCamera.sampleCount,coverageSamples:p.backgroundCoverage.sampleCount}))}));}
  catch(error){console.error(JSON.stringify({status:'FAIL',error:error.message,report:path.join(root,'qa/audit.json')}));process.exitCode=1;}
}
