/** Numeric and native-structure checks only. No character image is AI-viewed. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,hash,save,native,ff} from './runtime.mjs';
import {duration,fps,compName,characterBox} from './motion.mjs';
const TICKS=254016000000;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const comp=p=>Object.values(p.items||{}).find(i=>i.kind?.type==='Comp');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function properties(group,prefix=''){
 return(group?.children||[]).flatMap(n=>{const p=prefix?prefix+'/'+n.match:n.match;return[...(n.node==='Prop'?[{path:p,node:n}]:[]),...properties(n,p)];});
}
function animations(v,at=''){
 if(!v||typeof v!=='object')return[];
 return Object.entries(v).flatMap(([k,x])=>{
  const p=at+'/'+k,nonempty=Array.isArray(x)?x.length:x&&typeof x==='object'?Object.keys(x).length:!!x;
  return [...((/^(keys|keyframes|expression|expr|expression_code)$/i.test(k)&&nonempty)?[p]:[]),...animations(x,p)];
 });
}
function normalized(layer,all,items){
 const ids=new Map(all.map(l=>[l.id,l.name])),itemNames=new Map(Object.values(items).map(i=>[i.id,i.name]));
 function visit(v,key){if(key==='uid'||key==='id')return undefined;if(key==='parent'&&v!==null)return ids.get(v);if(key==='item'&&typeof v==='number')return itemNames.get(v);if(Array.isArray(v))return v.map(x=>visit(x));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!['id','uid'].includes(k)).map(([k,x])=>[k,visit(x,k)]));return v;}
 return visit(layer);
}

export function structure(base=root){
 const mainPath=path.join(base,'projects/osayu-tutorial-battle.ecproj'),previewPath=path.join(base,'projects/character-free-preview.ecproj');
 const main=read(mainPath),preview=read(previewPath),mc=comp(main),layers=mc.kind.layers,pl=comp(preview).kind.layers;
 const checks=[];function check(id,passed,detail){checks.push({id,passed:!!passed,...(detail===undefined?{}:{detail})});}
 const media=Object.values(main.items).filter(i=>i.kind?.type==='Footage'),previewMedia=Object.values(preview.items).filter(i=>i.kind?.type==='Footage');
 const stage=media.find(i=>i.kind.path===path.join(base,'media/stage-background.png')),character=media.find(i=>i.kind.path===path.join(base,'media/character-cutout.png'));
 check('exact_media_allowlist',media.length===2&&stage&&character&&!media.some(i=>i.kind.missing));
 check('approved_stage',stage&&hash(stage.kind.path)==='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6');
 check('existing_conventional_cutout',character&&hash(character.kind.path)==='e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef'&&character.kind.width===905&&character.kind.height===1810);
 check('original_preserved',hash('/mnt/f/Users/pui/Documents/gara/立ち絵.jpg')==='89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2');
 check('preview_character_imports_zero',previewMedia.length===1&&previewMedia[0].kind.path===path.join(base,'media/stage-background.png')&&!/character-cutout|character-original|立ち絵/.test(JSON.stringify(preview)));
 const refs=layers.filter(l=>l.source?.type==='Footage'&&l.source.item===character?.id);check('one_character_layer',refs.length===1);
 if(refs.length!==1)throw Error('Character layer count is not one');const fixed=refs[0];
 const props=new Map(properties(fixed.props).map(p=>[p.path,p.node])),v=n=>props.get('transform/'+n)?.value?.v;
 check('top_independent_character',layers[0].id===fixed.id&&fixed.parent===null&&fixed.track_matte===null&&fixed.auto_orient==='Off');
 check('character_full_duration',fixed.in_point===0&&fixed.start_time===0&&fixed.out_point===duration*TICKS&&fixed.stretch===100);
 check('fixed_transform',equal(v('position'),[725,1210,0])&&equal(v('anchor'),[452.5,905,0])&&equal(v('scale'),[450/905*100,450/905*100,100])&&v('rotation')===0&&v('rotationX')===0&&v('rotationY')===0&&equal(v('orientation'),[0,0,0])&&v('opacity')===100,{position:v('position'),anchor:v('anchor'),scale:v('scale'),opacity:v('opacity')});
 check('character_animation_zero',animations(fixed.props).length===0,{fields:animations(fixed.props)});
 check('character_effects_masks_zero',fixed.props.children.filter(g=>['effects','masks'].includes(g.match)).every(g=>g.children.length===0));
 check('character_no_blur_3d_adjustment',!fixed.switches.motion_blur&&!fixed.switches.three_d&&!fixed.switches.adjustment&&!fixed.switches.guide&&fixed.switches.frame_blend==='Off'&&fixed.blend_mode==='Normal');
 check('global_effects_absent',layers.every(l=>!l.switches.adjustment&&!['Camera','Light'].includes(l.source?.type)));
 check('native_canvas_timing',mc.kind.width===1080&&mc.kind.height===1920&&mc.kind.duration===duration*TICKS&&mc.kind.frame_rate.num/mc.kind.frame_rate.den===fps);
 const shared=layers.filter(l=>l.id!==fixed.id),previewShared=pl.filter(l=>!/^CHARACTER RESERVED|Character reservation label/.test(l.name));
 const mismatch=shared.filter(l=>{const other=previewShared.find(x=>x.name===l.name);return !other||!equal(normalized(l,layers,main.items),normalized(other,pl,preview.items));}).map(l=>l.name);
 check('preview_production_moving_layers_equal',shared.length===previewShared.length&&mismatch.length===0,{sharedLayers:shared.length,mismatch});
 const layout=read(path.join(base,'qa/osayu-tutorial-battle-layout.json')),text=layout.boxes;
 const overlaps=text.filter(b=>b.x<characterBox.x+characterBox.width&&b.x+b.width>characterBox.x&&b.y<characterBox.y+characterBox.height&&b.y+b.height>characterBox.y).map(b=>b.name);
 const outside=text.filter(b=>b.x<70||b.x+b.width>950||b.y<180||b.y+b.height>1520).map(b=>b.name);
 check('landed_text_clear_of_character',overlaps.length===0,{overlaps});
 check('landed_text_inside_reserved_ui_margins',outside.length===0,{outside,note:'Numeric working margins; actual TikTok mobile UI remains unverified'});
 const textOverlaps=[];for(let i=0;i<text.length;i++)for(let j=i+1;j<text.length;j++){const a=text[i],b=text[j];if(a.start<b.end&&b.start<a.end&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y)textOverlaps.push([a.name,b.name]);}
 check('landed_text_boxes_nonoverlapping',textOverlaps.length===0,{overlaps:textOverlaps});
 check('current_facts_no_legacy_or_time',text.some(b=>b.text==='11/3')&&text.some(b=>b.text==='セラ・ネージュ')&&!text.some(b=>/11\/24|22:00|ビンゴ|BINGO|Pixel Galaxy|2026/.test(b.text)));
 const filmPath=path.join(base,'projects/osayu-tutorial-battle.fcproj');
 if(fs.existsSync(filmPath)){
  const film=read(filmPath),items=Object.values(film.project.items),sequences=items.filter(i=>i.kind?.Sequence),s=sequences[0]?.kind.Sequence;
  const clips=s?.video_tracks.flatMap(t=>t.items)||[],clip=clips[0],param=(e,n)=>Object.values(e?.params?.[n]?.value||{})[0];
  check('film_single_silent_master',sequences.length===1&&s.video_tracks.length===1&&s.audio_tracks.length===0&&clips.length===1&&!(s.master_effects||[]).length);
  if(clip){
   const motion=clip.effects.find(e=>e.effect==='motion'),opacity=clip.effects.find(e=>e.effect==='opacity'),time=clip.effects.find(e=>e.effect==='time_remap');
   check('film_no_timing_or_scale_change',clip.start===0&&clip.source_in===0&&clip.duration===duration*TICKS&&clip.speed===1&&!clip.reverse&&!clip.frame_hold&&!clip.scale_to_frame);
   check('film_identity_motion',equal(param(motion,'position'),{x:540,y:960})&&equal(param(motion,'anchor'),{x:540,y:960})&&param(motion,'scale')===100&&param(motion,'scale_width')===100&&param(motion,'rotation')===0&&param(motion,'anti_flicker')===0&&param(opacity,'opacity')===100&&param(time,'speed')===100&&clip.effects.length===3&&animations(clip.effects).length===0);
   const media=items.find(i=>i.id===clip.item)?.kind?.Media;
   check('film_master_media_present',media?.media?.File?.path===path.join(base,'media/picture-master.mp4')&&!media.offline&&!media.proxy);
  }
 }
 const report={at:new Date().toISOString(),passed:checks.every(c=>c.passed),mainSha256:hash(mainPath),previewSha256:hash(previewPath),characterBounds:characterBox,checks,characterImagesShownToAI:0,previewFootage:previewMedia.length};
 save(path.join(base,'qa/structure-audit.json'),report);if(!report.passed)throw Error('Structure audit failed: '+checks.filter(c=>!c.passed).map(c=>c.id).join(', '));return report;
}

export async function opaqueProof(){
 structure();const numeric=path.join(root,'qa/local-only/numeric');fs.mkdirSync(numeric,{recursive:true});
 const rgba=path.join(numeric,'cutout-alpha.rgba');
 await ff(['-y','-i',path.join(root,'media/character-cutout.png'),'-vf','scale=450:900:flags=bilinear,format=rgba','-frames:v','1','-f','rawvideo',rgba],path.join(root,'qa/alpha-mask-decode.json'));
 const raw=fs.readFileSync(rgba),w=450,h=900,offsets=[];
 if(raw.length!==w*h*4)throw Error('Mask bytes differ');
 for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){let solid=true;for(let dy=-3;dy<=3&&solid;dy++)for(let dx=-3;dx<=3;dx++)if(raw[((y+dy)*w+x+dx)*4+3]!==255){solid=false;break;}if(solid)for(let c=0;c<3;c++)offsets.push((y*w+x)*3+c);}
 if(offsets.length<3000)throw Error('Opaque core too small');fs.unlinkSync(rgba);
 const times=[0,.5,2,4.6,7.8,11.2,14.2,16.5,(duration*fps-1)/fps,3.2,9.8,15.4];let reference;const samples=[];
 for(let i=0;i<times.length;i++){
  const png=path.join(numeric,'private-'+i+'.png'),rgb=path.join(numeric,'private-'+i+'.rgb');
  await native('effectcraft',['--project',path.join(root,'projects/osayu-tutorial-battle.ecproj'),'render-frame','--comp',compName,'--time',String(times[i]),'--out',png,'--json'],path.join(root,'qa/opaque-native-'+i+'.json'));
  await ff(['-y','-i',png,'-vf','crop=450:900:500:760:exact=1,format=rgb24','-frames:v','1','-f','rawvideo',rgb],path.join(root,'qa/opaque-read-'+i+'.json'));
  const frame=fs.readFileSync(rgb);if(frame.length!==w*h*3)throw Error('RGB crop size differs');const core=Buffer.from(offsets.map(k=>frame[k]));if(!reference)reference=Buffer.from(core);let changed=0,maxDelta=0;for(let k=0;k<core.length;k++){const d=Math.abs(core[k]-reference[k]);if(d)changed++;maxDelta=Math.max(maxDelta,d);}
  samples.push({seconds:times[i],exact:core.equals(reference),changedChannels:changed,maxDelta,sha256:cryptoHash(core)});fs.unlinkSync(png);fs.unlinkSync(rgb);
 }
 const report={method:'Native lossless RGB; fully opaque alpha core eroded 3 pixels; first-native-frame reference',passed:samples.every(s=>s.exact),opaquePixels:offsets.length/3,samples,fullDurationStructuralImmobility:true,containsCharacterImagesAIViewed:0,privateNumericRasterFilesRemaining:fs.readdirSync(numeric).length,lossyTemporalMseUsedAsMotionGate:false};
 save(path.join(root,'qa/opaque-core-proof.json'),report);if(!report.passed)throw Error('Native opaque core changed');console.log(JSON.stringify({opaqueCorePassed:true,samples:samples.length,opaquePixels:report.opaquePixels}));return report;
}
function cryptoHash(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
import crypto from 'node:crypto';
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(process.argv[2]==='opaque')await opaqueProof();else console.log(JSON.stringify({passed:structure().passed}));
}
