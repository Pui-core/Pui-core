/** Audit the fixed original JPEG without displaying or exporting any image. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const ORIGINAL = '/mnt/f/Users/pui/Documents/gara/立ち絵.jpg';
const EXPECTED_SHA = '89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2';
const CHARACTER_NAME = 'CHARACTER ORIGINAL FIXED';
const TICKS = 254016000000;
const DURATION = 22;
const FPS = 30;
const FRAMES = DURATION * FPS;
const SCALE = 390 / 905 * 100;
const ROI = {x:520, y:755, width:350, height:740};
// This is a declared gross-change guard, not a proof of identical pixels or a
// universal codec tolerance. Native structure and original SHA are primary.
const MAX_ROI_MSE = 9;
const FF_LINK = '/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const FP_LINK = '/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe';
const parse = text => JSON.parse(text.replace(/^\uFEFF/, ''));
const sha256 = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const approximately = (a,b) => Number.isFinite(a) && Math.abs(a-b) <= 1e-6;
const vector = (value, expected) => Array.isArray(value) && expected.every((v,i) => approximately(value[i], v));

function convertPath(filename, flag) {
  const r = spawnSync('wslpath', [flag, filename], {encoding:'utf8', timeout:10000});
  if (r.error || r.status !== 0 || !r.stdout?.trim()) throw Error('Native path conversion failed.');
  return r.stdout.trim();
}
const nativePath = filename => convertPath(path.resolve(filename), '-w');
const localPath = filename => filename.startsWith('/') ? filename : convertPath(filename, '-u');
const sameFile = (a,b) => fs.realpathSync(localPath(a)) === fs.realpathSync(localPath(b));

function properties(group, prefix='') {
  const values = [];
  for (const child of group?.children || []) {
    const name = prefix ? prefix + '/' + child.match : child.match;
    if (child.node === 'Prop') values.push({path:name, node:child});
    if (child.children) values.push(...properties(child, name));
  }
  return values;
}
function animationFields(value, location='') {
  const problems = [];
  if (!value || typeof value !== 'object') return problems;
  for (const [key, child] of Object.entries(value)) {
    const where = location ? location + '/' + key : key;
    if (/^(keys|keyframes|key_frames)$/i.test(key) && child &&
        (Array.isArray(child) ? child.length : typeof child === 'object' ? Object.keys(child).length : true)) problems.push(where);
    if (/^(expression|expr|expression_code)$/i.test(key) && child !== null && child !== undefined && child !== '' && child !== false) problems.push(where);
    if (child && typeof child === 'object') problems.push(...animationFields(child, where));
  }
  return problems;
}
function mediaImages(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...mediaImages(filename));
    else if (/\.(?:jpe?g|png|webp|gif|bmp|tiff?|avif|heic|svg|exr|hdr|tga)$/i.test(entry.name)) result.push(filename);
  }
  return result;
}
function ecItems(project) {
  if (!project?.items || typeof project.items !== 'object') throw Error('Unsupported EffectCraft project structure.');
  return Object.values(project.items);
}
function effectParam(effect, name) {
  const value = effect?.params?.[name]?.value;
  return value && Object.values(value)[0];
}

/** Runs only metadata, hashes, and local numeric video comparisons. */
export async function audit(root) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) throw Error('audit(root) requires an absolute root.');
  root = path.resolve(root);
  const qa = path.join(root, 'qa');
  fs.mkdirSync(qa, {recursive:true});
  const reportPath = path.join(qa, 'fixed-character-audit.json');
  const report = {
    status:'RUNNING', method:'Original-file SHA, native project structure, final-video numeric ROI comparison',
    visualInspection:'NOT_PERFORMED', imageOutput:'NONE', originalImageMutation:'NONE',
    checks:[], limits:['Lossy-video ROI metrics supplement structural evidence; they do not prove exact pixel identity.']
  };
  const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  const check = (id, passed, detail) => report.checks.push({id, passed:!!passed, ...(detail === undefined ? {} : {detail})});
  const assertChecks = () => {
    const failed = report.checks.filter(c => !c.passed).map(c => c.id);
    if (failed.length) throw Error('Fixed-character audit failed: ' + failed.join(', '));
  };
  function execute(exe, args, name) {
    const r = spawnSync(exe, args, {encoding:'utf8', timeout:180000, maxBuffer:24*1024*1024, windowsHide:true});
    // Commands below emit JSON or metric text only; no decoded pixels reach
    // stdout or logs, and no image file is written by this audit.
    const receipt = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
    fs.writeFileSync(path.join(qa, name + '.json'), JSON.stringify(receipt, null, 2) + '\n');
    if (r.error || r.status !== 0) throw Error('Numeric media command failed: ' + name);
    return receipt.stdout;
  }

  try {
    const original = ORIGINAL;
    const copied = path.join(root, 'media/character-original.jpg');
    const originalSha = sha256(original), copySha = sha256(copied);
    check('original_sha', originalSha === EXPECTED_SHA, {sha256:originalSha, expected:EXPECTED_SHA});
    check('copy_sha', copySha === EXPECTED_SHA, {sha256:copySha});
    const imageFiles = mediaImages(path.join(root, 'media'));
    check('media_image_allowlist', imageFiles.length === 1 && sameFile(imageFiles[0], copied), {count:imageFiles.length});

    const mainPath = path.join(root, 'projects/osayu-bingo-v3.ecproj');
    const textPath = path.join(root, 'projects/text-only.ecproj');
    const main = parse(fs.readFileSync(mainPath, 'utf8'));
    const text = parse(fs.readFileSync(textPath, 'utf8'));
    const mainItems = ecItems(main), textItems = ecItems(text);
    const footage = mainItems.filter(i => i.kind?.type === 'Footage');
    const textFootage = textItems.filter(i => i.kind?.type === 'Footage');
    check('main_footage_count', footage.length === 1, {count:footage.length});
    check('text_only_footage_count', textFootage.length === 0, {count:textFootage.length});
    if (footage.length !== 1) assertChecks();
    const asset = footage[0];
    check('native_original_reference', typeof asset.kind.path === 'string' && sameFile(asset.kind.path, copied));
    check('native_original_dimensions', asset.kind.width === 905 && asset.kind.height === 1810 && asset.kind.kind === 'Still' &&
      !asset.kind.has_audio && !asset.kind.missing, {width:asset.kind.width, height:asset.kind.height, kind:asset.kind.kind});
    const comps = mainItems.filter(i => i.kind?.type === 'Comp');
    const allLayers = comps.flatMap(comp => (comp.kind.layers || []).map(layer => ({comp, layer})));
    const characterRefs = allLayers.filter(({layer}) => layer.source?.type === 'Footage');
    check('single_image_layer', characterRefs.length === 1 && characterRefs[0]?.layer.source.item === asset.id, {count:characterRefs.length});
    check('no_global_image_modifiers', allLayers.every(({layer}) => !layer.switches?.adjustment &&
      !['Camera', 'Light'].includes(layer.source?.type)));
    if (characterRefs.length !== 1) assertChecks();
    const {comp, layer} = characterRefs[0];
    check('character_layer_name', layer.name === CHARACTER_NAME);
    check('character_direct_layer', comp.id === main.activeComp);
    check('main_canvas', comp.kind.width === 1080 && comp.kind.height === 1920 &&
      approximately(comp.kind.frame_rate?.num / comp.kind.frame_rate?.den, FPS) && comp.kind.duration === DURATION*TICKS);
    check('character_timing', layer.start_time === 0 && layer.in_point === 0 && layer.out_point === DURATION*TICKS && layer.stretch === 100);
    check('character_no_parent_matte', layer.parent === null && layer.track_matte === null);
    check('character_switches', layer.switches?.video === true && layer.switches?.motion_blur === false &&
      layer.switches?.three_d === false && layer.switches?.adjustment === false && layer.switches?.frame_blend === 'Off' &&
      !layer.switches?.guide && layer.blend_mode === 'Normal' && layer.auto_orient === 'Off');
    const groups = layer.props?.children || [];
    check('character_no_masks_effects', ['masks', 'effects'].every(name => groups.filter(g => g.match === name).every(g => !(g.children || []).length)));
    const animation = animationFields(layer.props);
    check('character_no_animation_expressions', animation.length === 0, {locations:animation});
    const props = new Map(properties(layer.props).map(p => [p.path, p.node]));
    const value = name => props.get('transform/' + name)?.value?.v;
    check('character_position', vector(value('position'), [695,1125]), {value:value('position')});
    check('character_anchor', vector(value('anchor'), [452.5,905]), {value:value('anchor')});
    check('character_uniform_scale', vector(value('scale'), [SCALE,SCALE]), {value:value('scale'), expected:SCALE});
    check('character_rotation_opacity', approximately(value('rotation'), 0) && approximately(value('rotationX'), 0) &&
      approximately(value('rotationY'), 0) && vector(value('orientation'), [0,0,0]) && approximately(value('opacity'), 100));
    const actualBox = [value('position')?.[0] - value('anchor')?.[0]*SCALE/100,
      value('position')?.[1] - value('anchor')?.[1]*SCALE/100, 905*SCALE/100, 1810*SCALE/100];
    check('character_bbox', vector(actualBox, [500,735,390,780]), {value:actualBox});
    check('character_no_time_remap_styles', ![...props.keys()].some(p => /(?:time.?remap|layer.?styles)/i.test(p)));
    report.structure = {mainProjectSha256:sha256(mainPath), textOnlyProjectSha256:sha256(textPath), assetSha256:copySha,
      characterLayer:layer.id, imageFootage:asset.id, imageLayers:characterRefs.length, textOnlyFootage:textFootage.length,
      position:value('position'), scale:value('scale'), rotation:value('rotation'), bbox:actualBox};

    const filmPath = path.join(root, 'projects/osayu-bingo-v3.fcproj');
    const film = parse(fs.readFileSync(filmPath, 'utf8'));
    const filmItems = Object.values(film.project?.items || {});
    const sequences = filmItems.filter(i => i.kind?.Sequence);
    check('film_single_sequence', sequences.length === 1, {count:sequences.length});
    if (sequences.length !== 1) assertChecks();
    const sequence = sequences[0].kind.Sequence;
    const videoTracks = sequence.video_tracks || [];
    const clips = videoTracks.flatMap(track => track.items || []);
    check('film_single_unmodified_video_track', videoTracks.length === 1 && clips.length === 1 &&
      videoTracks.every(t => t.enabled && !t.muted && !(t.effects || []).length && !(t.transitions || []).length) &&
      !(sequence.master_effects || []).length);
    if (clips.length !== 1) assertChecks();
    const clip = clips[0], clipMedia = filmItems.find(i => i.id === clip.item)?.kind?.Media;
    check('film_master_reference', !!clipMedia?.media?.File?.path &&
      sameFile(clipMedia.media.File.path, path.join(root, 'media/picture-master.mp4')) && !clipMedia.offline && !clipMedia.proxy);
    check('film_canvas', sequence.settings?.width === 1080 && sequence.settings?.height === 1920 &&
      approximately(sequence.settings?.frame_rate?.num / sequence.settings?.frame_rate?.den, FPS));
    check('film_clip_timing', clip.start === 0 && clip.duration === DURATION*TICKS && clip.source_in === 0 &&
      clip.speed === 1 && !clip.reverse && clip.enabled && !clip.frame_hold && !clip.scale_to_frame);
    const effects = clip.effects || [];
    const motion = effects.find(e => e.effect === 'motion');
    const opacity = effects.find(e => e.effect === 'opacity');
    const timeRemap = effects.find(e => e.effect === 'time_remap');
    check('film_no_added_effects', effects.length === 3 && effects.every(e => ['motion','opacity','time_remap'].includes(e.effect)));
    const motionPos = effectParam(motion, 'position'), motionAnchor = effectParam(motion, 'anchor');
    check('film_motion_identity', motion?.enabled && motionPos?.x === 540 && motionPos?.y === 960 &&
      motionAnchor?.x === 540 && motionAnchor?.y === 960 && effectParam(motion, 'scale') === 100 &&
      effectParam(motion, 'scale_width') === 100 && effectParam(motion, 'rotation') === 0 &&
      effectParam(motion, 'anti_flicker') === 0 && effectParam(motion, 'uniform_scale') === true);
    check('film_opacity_time_identity', opacity?.enabled && effectParam(opacity, 'opacity') === 100 &&
      effectParam(opacity, 'blend') === 0 && timeRemap?.enabled && effectParam(timeRemap, 'speed') === 100);
    check('film_no_animation_expressions', animationFields(effects).length === 0);
    report.filmcraft = {projectSha256:sha256(filmPath), videoClips:clips.length,
      identityMotion:report.checks.find(c => c.id === 'film_motion_identity')?.passed === true};
    save();
    assertChecks();

    const video = path.join(root, 'videos/osayu-bingo-v3-1124.mp4');
    const ffmpeg = fs.realpathSync(FF_LINK), ffprobe = fs.realpathSync(FP_LINK);
    const probe = parse(execute(ffprobe, ['-v','error','-count_frames','-select_streams','v:0',
      '-show_entries','stream=width,height,r_frame_rate,nb_read_frames:format=duration','-of','json',nativePath(video)], 'fixed-character-probe'));
    const stream = probe.streams?.[0];
    check('final_video_dimensions_frames', stream?.width === 1080 && stream?.height === 1920 && stream?.r_frame_rate === '30/1' &&
      Number(stream?.nb_read_frames) === FRAMES && Math.abs(Number(probe.format?.duration)-DURATION) <= .1,
    {width:stream?.width, height:stream?.height, frames:Number(stream?.nb_read_frames), duration:Number(probe.format?.duration)});
    assertChecks();
    const crop = `crop=${ROI.width}:${ROI.height}:${ROI.x}:${ROI.y}:exact=1`;
    const hashes = execute(ffmpeg, ['-hide_banner','-v','error','-i',nativePath(video),'-map','0:v:0','-an',
      '-vf',crop,'-frames:v',String(FRAMES),'-f','framemd5','-'], 'fixed-character-framemd5');
    const hashRows = hashes.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#')).map(line => line.split(',').at(-1).trim());
    fs.writeFileSync(path.join(qa, 'fixed-character-roi.framemd5'), hashes);
    check('roi_hash_frame_count', hashRows.length === FRAMES, {frames:hashRows.length});

    // stats_file=- emits metric rows to stdout. This avoids Windows drive-colon
    // and backslash escaping inside a filter's file option. No raster is output.
    const graph = `[0:v]${crop},format=yuv444p,split=2[a][b];` +
      `[a]select='eq(n,0)',loop=loop=-1:size=1:start=0,setpts=N/(${FPS}*TB)[ref];` +
      `[b]setpts=N/(${FPS}*TB)[main];[main][ref]psnr=stats_file=-:shortest=1[out]`;
    const statistics = execute(ffmpeg, ['-hide_banner','-v','error','-i',nativePath(video),'-filter_complex',graph,
      '-map','[out]','-an','-frames:v',String(FRAMES),'-f','null','-'], 'fixed-character-psnr-command');
    fs.writeFileSync(path.join(qa, 'fixed-character-roi-psnr.log'), statistics);
    const rows = statistics.split(/\r?\n/).filter(line => /(?:^|\s)n:\d+/.test(line)).map(line => {
      const pairs = Object.fromEntries(line.trim().split(/\s+/).map(token => token.split(':')));
      return {frame:Number(pairs.n), mse:Number(pairs.mse_avg), psnr:pairs.psnr_avg === 'inf' ? Infinity : Number(pairs.psnr_avg)};
    });
    check('roi_psnr_frame_count', rows.length === FRAMES && rows.every((r,i) => r.frame === i+1 && Number.isFinite(r.mse) && r.mse >= 0 && !Number.isNaN(r.psnr)), {frames:rows.length});
    const maxMse = rows.length ? Math.max(...rows.map(r => r.mse)) : null;
    const minPsnr = rows.length ? Math.min(...rows.map(r => r.psnr)) : null;
    const outliers = rows.filter(r => r.mse > MAX_ROI_MSE).map(r => ({frame:r.frame, seconds:(r.frame-1)/FPS, mse:r.mse}));
    check('roi_gross_change_guard', rows.length === FRAMES && maxMse <= MAX_ROI_MSE,
      {maxMse, declaredGuardMse:MAX_ROI_MSE, outlierFrames:outliers.length});
    report.roi = {rect:ROI, frames:rows.length, referenceFrame:0, pixelFormat:'yuv444p',
      exactDecodedHashCount:new Set(hashRows).size, exactHashesRequired:false, maxMse,
      minPsnr:minPsnr === Infinity ? 'inf' : minPsnr, meanMse:rows.length ? rows.reduce((s,r) => s+r.mse,0)/rows.length : null,
      declaredGuardMse:MAX_ROI_MSE, guardMeaning:'Gross-change sentinel allowing lossy-codec noise; not an exact-motion proof.',
      outliers, finalVideoSha256:sha256(video), visualFramesCreated:0};
    assertChecks();
    report.status = 'PASS_STRUCTURE_AND_NUMERIC_ROI';
    save();
    return report;
  } catch (error) {
    report.status = 'FAIL';
    report.error = error.message;
    save();
    throw error;
  }
}
