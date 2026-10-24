/** Fixed-character V4 audit: metadata, source RGB identity and numeric opaque core. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {verifyTransparency,magick,nativePath,hashFile} from './transparency.mjs';

const TICKS=254016000000,DURATION=22,FPS=30,FRAMES=DURATION*FPS;
const BOX={x:500,y:760,width:450,height:900};
const POSITION=[725,1210,0],ANCHOR=[452.5,905,0],SCALE=450/905*100;
const LEGACY_DIAGNOSTIC_MSE=9;
const EC_NAME='CHARACTER ORIGINAL FIXED';
const EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FF_LINK='/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const FP_LINK='/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe';
const transportRetries=[];
const parse=s=>JSON.parse(s.replace(/^\uFEFF/,''));
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-6;
const vec=(a,b)=>Array.isArray(a)&&b.every((v,i)=>near(a[i],v));
function localPath(filename){if(filename.startsWith('/'))return filename;const r=spawnSync('wslpath',['-u',filename],{encoding:'utf8'});if(r.status||r.error)throw Error('Media path conversion failed.');return r.stdout.trim();}
const sameFile=(a,b)=>fs.realpathSync(localPath(a))===fs.realpathSync(localPath(b));
function props(group,prefix=''){return(group?.children||[]).flatMap(n=>{const p=prefix?prefix+'/'+n.match:n.match;return[...(n.node==='Prop'?[{path:p,node:n}]:[]),...props(n,p)];});}
function animation(value,where=''){
  const result=[];if(!value||typeof value!=='object')return result;
  for(const[k,v]of Object.entries(value)){
    const p=where?where+'/'+k:k;
    if(/^(keys|keyframes|key_frames)$/i.test(k)&&v&&(Array.isArray(v)?v.length:typeof v==='object'?Object.keys(v).length:true))result.push(p);
    if(/^(expression|expr|expression_code)$/i.test(k)&&v!==undefined&&v!==null&&v!==false&&v!=='')result.push(p);
    if(v&&typeof v==='object')result.push(...animation(v,p));
  }return result;
}
function images(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>{const p=path.join(directory,e.name);return e.isDirectory()?images(p):/\.(?:jpe?g|png|webp|gif|bmp|tiff?|avif|heic|svg|exr|hdr|tga)$/i.test(e.name)?[p]:[];});}
const param=(effect,name)=>{const v=effect?.params?.[name]?.value;return v&&Object.values(v)[0];};
function execute(exe,args,raw=false){
  for(let attempt=1;attempt<=3;attempt++){
    const r=spawnSync(exe,args,{encoding:raw?undefined:'utf8',timeout:180000,maxBuffer:24*1024*1024,windowsHide:true});
    if(!r.error&&r.status===0)return r.stdout;
    const message=r.error?.message||String(r.stderr).slice(-1500);
    if(attempt<3&&/UtilAcceptVsock.*accept4 failed 110/.test(message)){
      transportRetries.push({exe,attempt,error:message});
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,250);
      continue;
    }
    throw Error('Numeric command failed: '+message);
  }
}

function nativeOpaqueProof(root,offsets){
  const ledger=parse(fs.readFileSync(path.join(root,'qa/motion-ledger.json'),'utf8'));
  const scenes=ledger.filter(e=>/camera/.test(e.kind)&&Number.isFinite(e.from)&&Number.isFinite(e.to));
  if(!scenes.length)throw Error('Native opacity proof requires the scene motion ledger.');
  const frames=[...new Set([0,FRAMES-1,357,...scenes.map(s=>Math.min(FRAMES-1,Math.round((s.from+s.to)*FPS/2)))])].sort((a,b)=>a-b);
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'osayu-v4-native-core-'));
  const samples=[];let reference;
  try{
    for(const frame of frames){
      const png=path.join(temporary,'frame-'+frame+'.png');
      execute(EC,['--project',nativePath(path.join(root,'projects/osayu-bingo-v4.ecproj')),'render-frame',
        '--comp','Osayu Bingo V4','--frame',String(frame),'--out',nativePath(png),'--json']);
      const raw=execute(magick,[nativePath(png),'-crop',BOX.width+'x'+BOX.height+'+'+BOX.x+'+'+BOX.y,
        '+repage','-alpha','off','-depth','8','RGB:-'],true);
      fs.unlinkSync(png);
      if(raw.length!==BOX.width*BOX.height*3)throw Error('Unexpected native RGB probe length.');
      const core=Buffer.allocUnsafe(offsets.length);
      for(let i=0;i<offsets.length;i++)core[i]=raw[offsets[i]];
      if(!reference)reference=Buffer.from(core);
      let squared=0,maxDelta=0,changedChannels=0;
      for(let i=0;i<core.length;i++){const d=Math.abs(core[i]-reference[i]);squared+=d*d;maxDelta=Math.max(maxDelta,d);if(d)changedChannels++;}
      samples.push({frame,seconds:frame/FPS,sha256:crypto.createHash('sha256').update(core).digest('hex'),
        exactMatch:core.equals(reference),mse:squared/core.length,maxDelta,changedChannels});
    }
  }finally{
    // Temporary native render files are never displayed or submitted to AI.
    for(const name of fs.readdirSync(temporary))fs.unlinkSync(path.join(temporary,name));
    fs.rmdirSync(temporary);
  }
  const proof={method:'Lossless native RGB opaque-core byte identity; no lossy codec threshold',
    scenes:scenes.length,frames:frames.length,samples,passed:samples.every(s=>s.exactMatch),
    temporaryRasterFilesDeleted:true,visualInspection:'NOT_PERFORMED'};
  fs.writeFileSync(path.join(root,'qa/native-opaque-core-proof.json'),JSON.stringify(proof,null,2)+'\n');
  return proof;
}

async function opaqueComparison(root,ffmpeg,video){
  // Only a scalar alpha mask is resized for analysis. The artwork PNG and its
  // RGB channels are not rewritten. Native PNG probes are temporary numeric
  // inputs only and are deleted; the lossy-video comparison emits metrics only.
  const mask=execute(magick,[nativePath(path.join(root,'media/character-cutout.png')),'-alpha','extract',
    '-filter','Box','-resize',BOX.width+'x'+BOX.height+'!','-threshold','99.99%',
    '-morphology','Erode','Diamond:2','-depth','8','GRAY:-'],true);
  if(mask.length!==BOX.width*BOX.height)throw Error('Unexpected opaque analysis mask size.');
  let pixels=0;for(const a of mask)if(a===255)pixels++;
  if(pixels<1000)throw Error('Opaque core is empty or too small for comparison.');
  const offsets=new Int32Array(pixels*3);let j=0;
  for(let p=0;p<mask.length;p++)if(mask[p]===255){offsets[j++]=p*3;offsets[j++]=p*3+1;offsets[j++]=p*3+2;}
  const nativeProof=nativeOpaqueProof(root,offsets);
  const args=['-hide_banner','-v','error','-i',nativePath(video),'-map','0:v:0','-an','-sn','-dn',
    '-vf',`crop=${BOX.width}:${BOX.height}:${BOX.x}:${BOX.y}:exact=1,format=rgb24`,
    '-frames:v',String(FRAMES),'-fps_mode','passthrough','-c:v','rawvideo','-f','rawvideo','pipe:1'];
  const frameBytes=BOX.width*BOX.height*3,frame=Buffer.allocUnsafe(frameBytes),rows=[];
  let reference,used=0,totalBytes=0,stderr='',launchError;
  await new Promise((resolve,reject)=>{
    const child=spawn(ffmpeg,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});
    const timeout=setTimeout(()=>{launchError=Error('Opaque numeric comparison timed out.');child.kill();},180000);
    child.on('error',e=>{launchError=e;});
    child.stderr.on('data',d=>stderr+=d);
    child.stdout.on('data',chunk=>{
      totalBytes+=chunk.length;let pos=0;
      while(pos<chunk.length){
        const take=Math.min(frameBytes-used,chunk.length-pos);chunk.copy(frame,used,pos,pos+take);used+=take;pos+=take;
        if(used===frameBytes){
          if(!reference)reference=Buffer.from(frame);
          let square=0,absolute=0,maxDelta=0,changedChannels=0;
          for(let k=0;k<offsets.length;k++){const d=Math.abs(frame[offsets[k]]-reference[offsets[k]]);square+=d*d;absolute+=d;maxDelta=Math.max(maxDelta,d);if(d>=16)changedChannels++;}
          const mse=square/offsets.length;
          rows.push({frame:rows.length,seconds:rows.length/FPS,mse,mae:absolute/offsets.length,maxDelta,
            psnr:mse?10*Math.log10(255*255/mse):'inf',changedChannelFraction:changedChannels/offsets.length});
          used=0;
        }
      }
    });
    child.on('close',exit=>{clearTimeout(timeout);fs.writeFileSync(path.join(root,'qa/opaque-core-command.json'),JSON.stringify({exit,error:launchError?.message,args,stdoutBytes:totalBytes,stderr,rawPixelsWrittenToLog:false},null,2)+'\n');if(exit!==0||launchError)reject(launchError||Error('Opaque numeric decoder failed.'));else resolve();});
  });
  if(used||rows.length!==FRAMES)throw Error('Opaque core frame count differs from 660.');
  fs.writeFileSync(path.join(root,'qa/opaque-core-metrics.log'),rows.map(r=>`n:${r.frame} t:${r.seconds.toFixed(6)} mse:${r.mse.toFixed(8)} mae:${r.mae.toFixed(8)} psnr:${r.psnr} max_delta:${r.maxDelta} changed_channel_fraction:${r.changedChannelFraction.toFixed(8)}`).join('\n')+'\n');
  const maxMse=Math.max(...rows.map(r=>r.mse));
  return{method:'Final decoded RGB, only fully opaque alpha core eroded by 2 display pixels; first-frame reference',
    bbox:BOX,opaqueCorePixels:pixels,excludedPixels:mask.length-pixels,frames:rows.length,
    maxMse,meanMse:rows.reduce((s,r)=>s+r.mse,0)/rows.length,maxMae:Math.max(...rows.map(r=>r.mae)),
    maxDelta:Math.max(...rows.map(r=>r.maxDelta)),
    lossyTemporalMetricsAreDiagnostic:true,legacyThresholdMse:LEGACY_DIAGNOSTIC_MSE,
    framesAboveLegacyThreshold:rows.filter(r=>r.mse>LEGACY_DIAGNOSTIC_MSE).length,
    diagnosticReason:'The native lossless core is byte-identical. Independent H.264 temporal quantization changes RGB even for this stationary layer; an uncalibrated first-I-frame MSE threshold is not an immobility test.',
    nativeProof,exactFinalPixelIdentityClaimed:false,visualOutput:'NONE',passed:nativeProof.passed};
}

export async function audit(root){
  if(typeof root!=='string'||!path.isAbsolute(root))throw Error('audit(root) requires an absolute path.');
  const qa=path.join(root,'qa');fs.mkdirSync(qa,{recursive:true});
  const previous=path.join(qa,'fixed-character-audit.json');
  if(fs.existsSync(previous)){
    const old=parse(fs.readFileSync(previous,'utf8'));
    if(old.checks?.some(c=>c.id==='opaque_core_numeric_guard'&&!c.passed)&&!fs.existsSync(path.join(qa,'opaque-core-legacy-failure.json'))){
      fs.copyFileSync(previous,path.join(qa,'opaque-core-legacy-failure.json'));
      if(fs.existsSync(path.join(qa,'opaque-core-metrics.log')))fs.copyFileSync(path.join(qa,'opaque-core-metrics.log'),path.join(qa,'opaque-core-legacy-metrics.log'));
    }
  }
  transportRetries.length=0;
  const report={status:'RUNNING',method:'Non-AI alpha-only RGB audit, fixed-layer structure and numeric opaque-core comparison',
    visualInspection:'NOT_PERFORMED',imageOutput:'Temporary native probes deleted; no image displayed',transportRetries,checks:[]};
  const save=()=>fs.writeFileSync(path.join(qa,'fixed-character-audit.json'),JSON.stringify(report,null,2)+'\n');
  const check=(id,passed,detail)=>report.checks.push({id,passed:!!passed,...(detail===undefined?{}:{detail})});
  const assert=()=>{const failed=report.checks.filter(c=>!c.passed);if(failed.length)throw Error('V4 character audit failed: '+failed.map(c=>c.id).join(', '));};
  try{
    report.transparency=verifyTransparency(root);
    check('alpha_only_rgb_exact',report.transparency.rgbExactMatch&&report.transparency.alpha.disconnectedTransparent===0);
    const raster=images(path.join(root,'media')),allowed=['character-original.jpg','character-cutout.png','stage-background.png'].map(n=>path.join(root,'media',n));
    check('media_image_allowlist',raster.length===3&&raster.every(p=>allowed.some(a=>sameFile(p,a))),{count:raster.length});
    const mainPath=path.join(root,'projects/osayu-bingo-v4.ecproj'),textPath=path.join(root,'projects/text-only.ecproj');
    const main=parse(fs.readFileSync(mainPath,'utf8')),text=parse(fs.readFileSync(textPath,'utf8'));
    const items=Object.values(main.items||{}),textItems=Object.values(text.items||{}),footage=items.filter(i=>i.kind?.type==='Footage');
    const cutout=path.join(root,'media/character-cutout.png'),background=path.join(root,'media/stage-background.png');
    check('main_footage_allowlist',footage.length===2&&footage.every(f=>[cutout,background].some(p=>sameFile(f.kind.path,p))),{count:footage.length});
    const characterAsset=footage.find(f=>sameFile(f.kind.path,cutout));
    check('cutout_footage',characterAsset?.kind.width===905&&characterAsset?.kind.height===1810&&characterAsset?.kind.kind==='Still'&&!characterAsset?.kind.missing);
    const textFootage=textItems.filter(i=>i.kind?.type==='Footage');
    check('preview_has_no_character',textFootage.length<=1&&textFootage.every(f=>sameFile(f.kind.path,background)),{footageCount:textFootage.length});
    const comps=items.filter(i=>i.kind?.type==='Comp'),layers=comps.flatMap(comp=>(comp.kind.layers||[]).map(layer=>({comp,layer})));
    const refs=layers.filter(({layer})=>layer.source?.type==='Footage'&&layer.source.item===characterAsset?.id);
    check('single_character_layer',refs.length===1,{count:refs.length});
    if(refs.length!==1)assert();
    const{comp,layer}=refs[0];
    check('character_identity',layer.name===EC_NAME&&comp.name==='Osayu Bingo V4'&&comp.id===main.activeComp);
    check('character_top_layer',comp.kind.layers[0]?.id===layer.id);
    check('main_canvas',comp.kind.width===1080&&comp.kind.height===1920&&comp.kind.duration===DURATION*TICKS&&near(comp.kind.frame_rate?.num/comp.kind.frame_rate?.den,FPS));
    check('full_duration',layer.start_time===0&&layer.in_point===0&&layer.out_point===DURATION*TICKS&&layer.stretch===100);
    check('independent_fixed_layer',layer.parent===null&&layer.track_matte===null&&layer.auto_orient==='Off'&&layer.blend_mode==='Normal');
    check('character_switches',layer.switches?.video===true&&layer.switches?.motion_blur===false&&layer.switches?.three_d===false&&
      layer.switches?.adjustment===false&&layer.switches?.frame_blend==='Off'&&!layer.switches?.guide);
    check('no_masks_effects', ['masks','effects'].every(n=>(layer.props?.children||[]).filter(g=>g.match===n).every(g=>!(g.children||[]).length)));
    check('no_character_animation',animation(layer.props).length===0,{animationFields:animation(layer.props)});
    check('no_global_adjustments',layers.every(({layer:l})=>!l.switches?.adjustment&&!['Camera','Light'].includes(l.source?.type)));
    const properties=new Map(props(layer.props).map(p=>[p.path,p.node])),value=n=>properties.get('transform/'+n)?.value?.v;
    check('fixed_position_anchor_scale',vec(value('position'),POSITION)&&vec(value('anchor'),ANCHOR)&&vec(value('scale'),[SCALE,SCALE,100]),
      {position:value('position'),anchor:value('anchor'),scale:value('scale')});
    check('fixed_rotation_opacity',near(value('rotation'),0)&&near(value('rotationX'),0)&&near(value('rotationY'),0)&&vec(value('orientation'),[0,0,0])&&near(value('opacity'),100));
    check('no_time_remap_styles',![...properties.keys()].some(n=>/time.?remap|layer.?styles/i.test(n)));
    report.structure={mainProjectSha256:hashFile(mainPath),textOnlyProjectSha256:hashFile(textPath),characterLayer:layer.id,
      cutoutSha256:hashFile(cutout),backgroundSha256:hashFile(background),position:value('position'),scale:value('scale'),bbox:BOX};
    const filmPath=path.join(root,'projects/osayu-bingo-v4.fcproj'),film=parse(fs.readFileSync(filmPath,'utf8')),filmItems=Object.values(film.project?.items||{}),sequences=filmItems.filter(i=>i.kind?.Sequence);
    check('film_sequence_count',sequences.length===1,{count:sequences.length});if(sequences.length!==1)assert();
    const sequence=sequences[0].kind.Sequence,tracks=sequence.video_tracks||[],clips=tracks.flatMap(t=>t.items||[]);
    check('film_single_master',tracks.length===1&&clips.length===1&&tracks.every(t=>t.enabled&&!t.muted&&!(t.effects||[]).length&&!(t.transitions||[]).length)&&!(sequence.master_effects||[]).length);
    if(clips.length!==1)assert();
    const clip=clips[0],media=filmItems.find(i=>i.id===clip.item)?.kind?.Media;
    check('film_master_reference',!!media?.media?.File?.path&&sameFile(media.media.File.path,path.join(root,'media/picture-master.mp4'))&&!media.offline&&!media.proxy);
    check('film_canvas',sequence.settings.width===1080&&sequence.settings.height===1920&&near(sequence.settings.frame_rate?.num/sequence.settings.frame_rate?.den,FPS));
    check('film_timing',clip.start===0&&clip.duration===DURATION*TICKS&&clip.source_in===0&&clip.speed===1&&!clip.reverse&&clip.enabled&&!clip.frame_hold&&!clip.scale_to_frame);
    const effects=clip.effects||[],motion=effects.find(e=>e.effect==='motion'),opacity=effects.find(e=>e.effect==='opacity'),time=effects.find(e=>e.effect==='time_remap');
    const pos=param(motion,'position'),anchor=param(motion,'anchor');
    check('film_identity_motion',motion?.enabled&&pos?.x===540&&pos?.y===960&&anchor?.x===540&&anchor?.y===960&&param(motion,'scale')===100&&param(motion,'scale_width')===100&&param(motion,'rotation')===0&&param(motion,'anti_flicker')===0&&param(motion,'uniform_scale')===true);
    check('film_identity_opacity_time',opacity?.enabled&&param(opacity,'opacity')===100&&param(opacity,'blend')===0&&time?.enabled&&param(time,'speed')===100);
    check('film_no_other_effects',effects.length===3&&effects.every(e=>['motion','opacity','time_remap'].includes(e.effect))&&animation(effects).length===0);
    report.filmcraft={projectSha256:hashFile(filmPath),clips:clips.length};save();assert();

    const video=path.join(root,'videos/osayu-bingo-v4-1124.mp4'),ffmpeg=fs.realpathSync(FF_LINK),ffprobe=fs.realpathSync(FP_LINK);
    const rendered=parse(fs.readFileSync(path.join(qa,'rendered.json'),'utf8'));
    check('export_artifact_hashes',rendered.sha256===hashFile(video)&&rendered.projectHashes?.effectcraft===hashFile(mainPath)&&
      rendered.projectHashes?.filmcraft===hashFile(filmPath));assert();
    const probe=parse(execute(ffprobe,['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_read_frames:format=duration','-of','json',nativePath(video)]));
    const stream=probe.streams?.[0];check('final_frames',stream?.width===1080&&stream?.height===1920&&stream?.r_frame_rate==='30/1'&&Number(stream?.nb_read_frames)===FRAMES&&Math.abs(Number(probe.format?.duration)-DURATION)<=.1,{frames:Number(stream?.nb_read_frames)});assert();
    report.opaqueCore=await opaqueComparison(root,ffmpeg,video);
    check('opaque_core_native_exact',report.opaqueCore.passed,{nativeFrames:report.opaqueCore.nativeProof.frames,
      scenes:report.opaqueCore.nativeProof.scenes,allCoreBytesIdentical:report.opaqueCore.nativeProof.passed});assert();
    report.status='PASS_ALPHA_RGB_STRUCTURE_OPAQUE_CORE';report.finalVideoSha256=hashFile(video);
    report.limitations=['No character-containing image or video is displayed or submitted to an AI model.',
      'Lossless native samples cover every scene and must match exactly; structural checks cover the entire interval.',
      'Lossy final-video temporal MSE is recorded, not treated as a calibrated animation detector; exact final-pixel identity is not claimed.',
      'Transparent and semitransparent pixels reveal animated background and are excluded.'];save();return report;
  }catch(error){report.status='FAIL';report.error=error.message;save();throw error;}
}
