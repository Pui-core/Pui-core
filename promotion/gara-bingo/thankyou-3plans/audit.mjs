/** Numeric-only audit. Character artwork and native probes are never displayed. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans, composition} from './motion.mjs';

const TICKS = 254016000000;
const DURATION = 25;
const FPS = 30;
const CHARACTER = 'CHARACTER ORIGINAL FIXED';
const POSITION = [730, 1290, 0];
const ANCHOR = [452.5, 905, 0];
const SCALE = [380 / 905 * 100, 380 / 905 * 100, 100];
const BOX = {x:540, y:910, width:380, height:760};
const HASHES = {
  'character-original.jpg':'89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2',
  'character-cutout.png':'e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef',
  'stage-background.png':'248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6'
};
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const MAGICK = '/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const parse = s => JSON.parse(s.replace(/^\uFEFF/, ''));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const fileHash = filename => sha(fs.readFileSync(filename));
const near = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 1e-6;
const vec = (a, b) => Array.isArray(a) && a.length === b.length && b.every((v, i) => near(a[i], v));
const save = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), {recursive:true});
  fs.writeFileSync(filename, JSON.stringify(value, null, 2) + '\n');
};

function command(exe, args, raw = false) {
  const r = spawnSync(exe, args, {encoding:raw ? undefined : 'utf8', timeout:180000,
    maxBuffer:32 * 1024 * 1024, windowsHide:true});
  if (r.error || r.status !== 0) throw Error('Numeric command failed: ' +
    (r.error?.message || String(r.stderr).slice(-1500)));
  return r.stdout;
}
function nativePath(filename) { return command('wslpath', ['-w', path.resolve(filename)]).trim(); }
function localPath(filename) {
  if (filename.startsWith('/')) return filename;
  return command('wslpath', ['-u', filename]).trim();
}
function sameFile(a, b) {
  try { return fs.realpathSync(localPath(a)) === fs.realpathSync(localPath(b)); }
  catch { return false; }
}
function properties(group, prefix = '') {
  return (group?.children || []).flatMap(node => {
    const p = prefix ? prefix + '/' + node.match : node.match;
    return [...(node.node === 'Prop' ? [{path:p, node}] : []), ...properties(node, p)];
  });
}
function animation(value, prefix = '') {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, v]) => {
    const p = prefix ? prefix + '/' + key : key;
    const populated = v !== null && v !== undefined && v !== false && v !== '' &&
      (typeof v !== 'object' || Object.keys(v).length > 0);
    const found = populated && /^(keys|keyframes|key_frames|expression|expr|expression_code)$/i.test(key);
    return [...(found ? [p] : []), ...animation(v, p)];
  });
}
function strings(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(strings);
}

// Generated numeric IDs differ because only main imports the character. Preserve
// parent/source relationships by replacing IDs with stable names, then compare
// every remaining serialized property, layer order and composition setting.
function canonicalComp(project, comp) {
  const items = Object.values(project.items || {});
  const layerNames = new Map((comp.kind.layers || []).map(l => [l.id, l.name]));
  const itemNames = new Map(items.map(i => [i.id, i.name]));
  function clean(value, key = '') {
    if (Array.isArray(value)) return value.map(v => clean(v));
    if (!value || typeof value !== 'object') {
      if (value !== null && ['parent', 'track_matte'].includes(key)) return layerNames.get(value) ?? value;
      if (value !== null && key === 'item') return itemNames.get(value) ?? value;
      return value;
    }
    return Object.fromEntries(Object.keys(value).sort().filter(k => !['id', 'uid'].includes(k))
      .map(k => [k, clean(value[k], k)]));
  }
  const layers = comp.kind.layers.filter(l => l.name !== CHARACTER && !/^CHARACTER RESERVED/.test(l.name));
  return clean({...comp, kind:{...comp.kind, layers}});
}

function structure(root, plan) {
  const checks = [];
  const check = (id, passed, detail) => checks.push({id, passed:!!passed,
    ...(detail === undefined ? {} : {detail})});
  const directory = path.join(root, plan.id);
  const mainPath = path.join(directory, 'projects', plan.id + '.ecproj');
  const textPath = path.join(directory, 'projects', plan.id + '-text-only.ecproj');
  const main = parse(fs.readFileSync(mainPath, 'utf8'));
  const text = parse(fs.readFileSync(textPath, 'utf8'));
  const items = Object.values(main.items || {});
  const textItems = Object.values(text.items || {});
  const footage = items.filter(i => i.kind?.type === 'Footage');
  const previewFootage = textItems.filter(i => i.kind?.type === 'Footage');
  const stage = path.join(root, 'media/stage-background.png');
  const cutout = path.join(root, 'media/character-cutout.png');
  check('plan_duration_25_seconds', plan.duration === DURATION);
  check('main_footage_allowlist', footage.length === 2 && footage.every(f =>
    [stage, cutout].some(p => sameFile(f.kind.path, p))) &&
    [stage, cutout].every(p => footage.some(f => sameFile(f.kind.path, p))));
  check('preview_has_stage_only', previewFootage.length === 1 &&
    previewFootage.every(f => sameFile(f.kind.path, stage)));
  const rasterReferences = strings(text).filter(s => /\.(png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr)(?:$|[?#])/i.test(s));
  check('preview_no_hidden_character_reference', rasterReferences.length > 0 && rasterReferences.every(s =>
    s === 'stage-background.png' || sameFile(s, stage)), {rasterReferences});
  const asset = footage.find(f => sameFile(f.kind.path, cutout));
  check('character_asset_metadata', asset?.kind.width === 905 && asset?.kind.height === 1810 &&
    asset?.kind.kind === 'Still' && !asset?.kind.missing);
  const comps = items.filter(i => i.kind?.type === 'Comp');
  const textComps = textItems.filter(i => i.kind?.type === 'Comp');
  check('single_composition', comps.length === 1 && textComps.length === 1);
  const comp = comps[0];
  const layers = comps.flatMap(c => c.kind.layers || []);
  const references = layers.filter(l => l.source?.type === 'Footage' && l.source.item === asset?.id);
  check('one_character_reference', references.length === 1, {count:references.length});
  const character = references[0];
  if (comp && character) {
    check('character_identity', character.name === CHARACTER && main.activeComp === comp.id &&
      comp.name === `Osayu Thankyou ${plan.id}` && comp.kind.layers[0]?.id === character.id);
    check('canvas_1080_1920_30fps_25s', comp.kind.width === 1080 && comp.kind.height === 1920 &&
      comp.kind.duration === DURATION * TICKS &&
      near(comp.kind.frame_rate?.num / comp.kind.frame_rate?.den, FPS));
    check('full_interval', character.start_time === 0 && character.in_point === 0 &&
      character.out_point === DURATION * TICKS && character.stretch === 100);
    check('independent_character', character.parent === null && character.track_matte === null &&
      character.auto_orient === 'Off' && character.blend_mode === 'Normal');
    const switches = character.switches || {};
    check('fixed_character_switches', switches.video === true && switches.motion_blur === false &&
      switches.three_d === false && switches.adjustment === false && switches.frame_blend === 'Off' && !switches.guide);
    check('no_character_keys_or_expressions', animation(character).length === 0,
      {fields:animation(character)});
    check('no_character_masks_or_effects', ['effects', 'masks'].every(name =>
      (character.props?.children || []).filter(g => g.match === name).every(g => !(g.children || []).length)));
    const props = new Map(properties(character.props).map(p => [p.path, p.node]));
    const value = name => props.get('transform/' + name)?.value?.v;
    check('fixed_transform', vec(value('position'), POSITION) && vec(value('anchor'), ANCHOR) &&
      vec(value('scale'), SCALE) && near(value('rotation'), 0) && near(value('rotationX'), 0) &&
      near(value('rotationY'), 0) && vec(value('orientation'), [0,0,0]) && near(value('opacity'), 100),
    {position:value('position'), anchor:value('anchor'), scale:value('scale'), opacity:value('opacity')});
    check('no_time_remap_or_styles', ![...props.keys()].some(n => /time.?remap|layer.?styles/i.test(n)));
  }
  check('no_global_adjustment_camera_or_light', layers.every(l => !l.switches?.adjustment &&
    !['Camera', 'Light'].includes(l.source?.type)));
  if (comp && textComps.length === 1) {
    const mainCanonical = JSON.stringify(canonicalComp(main, comp));
    const previewCanonical = JSON.stringify(canonicalComp(text, textComps[0]));
    check('main_preview_motion_structure_identical', mainCanonical === previewCanonical,
      {mainSha256:sha(mainCanonical), previewSha256:sha(previewCanonical),
        normalization:'IDs replaced by layer/item names; character and reserved rectangle excluded'});
  }
  return {plan:plan.id, passed:checks.every(c => c.passed), checks,
    mainProjectSha256:fileHash(mainPath), textOnlyProjectSha256:fileHash(textPath),
    characterLayerId:character?.id, visualInspection:'NOT_PERFORMED'};
}

function opaqueCore(root, plan) {
  const cutout = path.join(root, 'media/character-cutout.png');
  const mask = command(MAGICK, [nativePath(cutout), '-alpha', 'extract', '-filter', 'Box',
    '-resize', BOX.width + 'x' + BOX.height + '!', '-threshold', '99.99%',
    '-morphology', 'Erode', 'Diamond:2', '-depth', '8', 'GRAY:-'], true);
  if (mask.length !== BOX.width * BOX.height) throw Error('Unexpected alpha-mask length.');
  const offsets = [];
  for (let p = 0; p < mask.length; p++) if (mask[p] === 255) offsets.push(p*3, p*3+1, p*3+2);
  if (offsets.length < 3000) throw Error('Opaque core is too small.');
  const montageSpan = (plan.climax - plan.montage) / 4;
  // Eight distinct representatives cover intro, initial board, all three
  // highlight scenes, last square, completion and outro without re-rendering
  // the same frame. Full-duration immobility is established structurally.
  const times = [.55, 3.8, ...[.5, 1.5, 2.5].map(n => plan.montage + montageSpan*n),
    plan.climax-.65, plan.climax+.5, 23.8];
  if (times.some(t => !Number.isFinite(t) || t < 0 || t >= DURATION)) throw Error('Invalid native sample times.');
  const frames = [...new Set(times.map(t => Math.round(t*FPS)))].sort((a, b) => a-b);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'osayu-thankyou-native-core-'));
  const samples = [];
  let reference;
  try {
    for (const frame of frames) {
      const png = path.join(temporary, 'frame-' + frame + '.png');
      command(EC, ['--project', nativePath(path.join(root, plan.id, 'projects', plan.id + '.ecproj')),
        'render-frame', '--comp', `Osayu Thankyou ${plan.id}`, '--frame', String(frame), '--out', nativePath(png), '--json']);
      const raw = command(MAGICK, [nativePath(png), '-crop', `${BOX.width}x${BOX.height}+${BOX.x}+${BOX.y}`,
        '+repage', '-alpha', 'off', '-depth', '8', 'RGB:-'], true);
      fs.unlinkSync(png);
      if (raw.length !== BOX.width * BOX.height * 3) throw Error('Unexpected native RGB sample length.');
      const core = Buffer.from(offsets.map(i => raw[i]));
      if (!reference) reference = Buffer.from(core);
      let changedChannels = 0, maxDelta = 0, squared = 0;
      for (let i=0; i<core.length; i++) {
        const d = Math.abs(core[i]-reference[i]);
        if (d) changedChannels++;
        maxDelta = Math.max(maxDelta, d); squared += d*d;
      }
      samples.push({frame, seconds:frame/FPS, sha256:sha(core), exactMatch:core.equals(reference),
        changedChannels, maxDelta, mse:squared/core.length});
    }
  } finally {
    for (const name of fs.readdirSync(temporary)) fs.unlinkSync(path.join(temporary, name));
    fs.rmdirSync(temporary);
  }
  return {passed:samples.length >= 2 && samples.every(s => s.exactMatch), samples,
    bbox:BOX, opaquePixels:offsets.length/3,
    method:'Lossless native RGB opaque-core exact byte identity; no lossy video MSE threshold',
    transientCharacterRastersDeleted:true, visualInspection:'NOT_PERFORMED', aiImageInput:'NONE'};
}

export function audit(root, {nativeProof = false, selected = plans} = {}) {
  if (!path.isAbsolute(root)) throw Error('audit requires an absolute delivery root.');
  const output = path.join(root, 'qa/fixed-character-audit.json');
  const report = {status:'RUNNING', aiImageInput:'NONE', characterVisualInspection:'NOT_PERFORMED',
    compositionExportAvailable:typeof composition === 'function', assets:[], plans:[],
    nativeProofRequested:nativeProof, lossyVideoMseUsedAsMotionDetector:false};
  try {
    for (const [name, expectedSha256] of Object.entries(HASHES)) {
      const actualSha256 = fileHash(path.join(root, 'media', name));
      report.assets.push({name, expectedSha256, actualSha256, passed:actualSha256 === expectedSha256});
    }
    if (!report.assets.every(a => a.passed)) throw Error('Approved media SHA differs.');
    if (!report.compositionExportAvailable) throw Error('Missing composition export.');
    for (const plan of selected) {
      const result = structure(root, plan);
      report.plans.push(result);
      save(path.join(root, plan.id, 'qa/fixed-character-structure-audit.json'), result);
      if (!result.passed) throw Error(plan.id + ': ' + result.checks.filter(c => !c.passed).map(c => c.id).join(', '));
      if (nativeProof) {
        result.nativeOpaqueCore = opaqueCore(root, plan);
        save(path.join(root, plan.id, 'qa/native-opaque-core-proof.json'), result.nativeOpaqueCore);
        if (!result.nativeOpaqueCore.passed) throw Error(plan.id + ': native opaque-core bytes changed.');
      } else result.nativeOpaqueCore = {status:'NOT_RUN'};
    }
    report.status = nativeProof ? 'PASS_STRUCTURE_SHA_NATIVE_OPAQUE_CORE' : 'PASS_STRUCTURE_SHA_ONLY';
    report.limitations = ['No character-containing raster was displayed or submitted to AI.',
      'Native core proof, when requested, samples stated frames; structural audit covers all 25 seconds.',
      'Semitransparent pixels are excluded. H.264 temporal quantization is not used to infer motion.',
      'Playback, listening, TikTok device confirmation and creative approval are separate checks.'];
    save(output, report);
    return report;
  } catch (error) {
    report.status = 'FAIL'; report.error = error.message; save(output, report); throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2];
  if (!root) throw Error('Usage: node audit.mjs /absolute/delivery/root [--native]');
  const report = audit(path.resolve(root), {nativeProof:process.argv.includes('--native')});
  console.log(JSON.stringify({status:report.status, plans:report.plans.map(p => p.plan),
    nativeProofRequested:report.nativeProofRequested}));
}
