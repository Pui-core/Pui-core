/** Local-only native production. Never show character media to an AI viewer. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans, composition} from './motion.mjs';

export const root = path.resolve(process.env.OSAYU_THANKYOU_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-25/thankyou-wholeframe-v3');
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const TICKS = 254016000000;
const backgroundName = 'bingo-paper-background.png';
const originalHash = '89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2';
const cutoutHash = 'e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef';
const parse = s => JSON.parse(s.replace(/^\uFEFF/, '').trim());
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dir = p => path.join(root, p.id);
const comp = p => `Osayu Thankyou ${p.id}`;
const project = (p, textOnly = false) => path.join(dir(p), 'projects', p.id + (textOnly ? '-text-only' : '') + '.ecproj');
const movie = (p, suffix) => path.join(dir(p), 'videos', p.id + '-' + suffix + '.mp4');
const receipt = (p, name) => path.join(dir(p), 'qa', name + '.json');
function save(p, v) { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }
export function nativePath(p) {
  const r = spawnSync('wslpath', ['-w', path.resolve(p)], {encoding:'utf8'});
  if (r.status || r.error || !r.stdout.trim()) throw Error('wslpath failed: ' + p);
  return r.stdout.trim();
}
function call(exe, args, log, input) {
  const r = spawnSync(exe, args, {encoding:'utf8', input, timeout:180000, maxBuffer:32*1024*1024});
  const result = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  if (log) save(log, result);
  if (r.error || r.status !== 0) throw Error(JSON.stringify({exe, args, ...result}).slice(-6000));
  return result.stdout.trim();
}
async function run(exe, args, log) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {stdio:['ignore', 'pipe', 'pipe']});
    let stdout = '', stderr = '', error;
    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);
    child.on('error', e => { error = e.message; });
    child.on('close', exit => {
      const result = {exit, seconds:(Date.now()-start)/1000, error, stdout:stdout.replace(/^\uFEFF/, ''), stderr};
      if (log) save(log, result);
      if (error || exit !== 0) reject(Error(JSON.stringify({exe, args, ...result}).slice(-6000)));
      else resolve(result);
    });
  });
}
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
  return out;
}
function directories(p) {
  for (const name of ['projects', 'source', 'media', 'videos', 'qa', 'qa/local-only']) fs.mkdirSync(path.join(dir(p), name), {recursive:true});
}
export function assertBackground(mediaRoot = root) {
  const manifestFile = path.join(mediaRoot, 'media/background-manifest.json');
  const manifest = parse(fs.readFileSync(manifestFile, 'utf8'));
  if (manifest.file !== backgroundName || manifest.containsCharacter !== false || !/^[a-f0-9]{64}$/.test(manifest.sha256 || '')) throw Error('A current character-free paper background manifest is required.');
  const digest = hash(path.join(mediaRoot, 'media', backgroundName));
  if (digest !== manifest.sha256) throw Error('Paper background digest differs from its manifest.');
  return {backgroundFile:backgroundName, backgroundSha256:digest, backgroundManifestSha256:hash(manifestFile), containsCharacter:false};
}
function assets() {
  fs.mkdirSync(path.join(root, 'media'), {recursive:true});
  for (const name of ['character-original.jpg', 'character-cutout.png']) {
    const to = path.join(root, 'media', name);
    if (!fs.existsSync(to)) throw Error('Required delivery media missing: ' + to);
  }
  assertBackground();
  if (hash(path.join(root, 'media/character-original.jpg')) !== originalHash) throw Error('Original character changed.');
  if (hash(path.join(root, 'media/character-cutout.png')) !== cutoutHash) throw Error('Existing approved conventional cutout changed.');
}
function assetSeals() {
  const background = assertBackground();
  return {backgroundSha256:background.backgroundSha256, backgroundManifestSha256:background.backgroundManifestSha256,
    characterCutoutSha256:hash(path.join(root, 'media/character-cutout.png'))};
}
export function assertTextOnly(p) {
  const file = project(p, true), data = parse(fs.readFileSync(file, 'utf8'));
  const references = strings(data).filter(s => /\.(?:png|jpe?g|webp|bmp|gif)(?:$|[?#])/i.test(s));
  const allowed = new Set([backgroundName, nativePath(path.join(root, 'media', backgroundName))]);
  const forbidden = references.filter(s => !allowed.has(s));
  if (!references.length || forbidden.length) throw Error('Preview isolation failed: ' + JSON.stringify(forbidden));
  const background = assertBackground();
  return {...background, containsCharacter:false, aiViewingAllowed:true, rasterReferences:references, projectSha256:hash(file)};
}
function walkProps(v, out = []) {
  if (!v || typeof v !== 'object') return out;
  if (v.node === 'Prop') out.push(v);
  for (const child of v.children || []) walkProps(child, out);
  return out;
}
export function auditWholeFrameCharacter(p) {
  const data = parse(fs.readFileSync(project(p), 'utf8'));
  const layers = Object.values(data.items).filter(i => i.kind?.type === 'Comp').flatMap(i => i.kind.layers || []);
  const characters = layers.filter(l => l.name === 'CHARACTER ORIGINAL FIXED');
  if (characters.length !== 1) throw Error('Expected exactly one original character with static local properties.');
  const cameras = layers.filter(l => l.name === 'WHOLE FRAME CAMERA');
  if (cameras.length !== 1) throw Error('Expected exactly one whole-frame camera.');
  const camera = cameras[0];
  const l = characters[0], props = walkProps(l.props), groups = l.props.children || [];
  const source = data.items[String(l.source?.item)]?.kind;
  const transform = Object.fromEntries(walkProps(groups.find(g => g.match === 'transform')).map(v => [v.match, v.value?.v]));
  const near = (a, b) => typeof a === 'number' && Math.abs(a-b) <= 1e-6;
  const vec = (a, b) => Array.isArray(a) && a.length === b.length && b.every((v, i) => near(a[i], v));
  const checks = {
    oneCharacter:characters.length === 1,
    oneWholeFrameRoot:cameras.length === 1 && camera.parent === null,
    allLayersShareRoot:layers.every(item => item.id === camera.id || item.parent === camera.id),
    characterMovesWithWholeFrame:l.parent === camera.id,
    completeDuration:l.in_point === 0 && Math.abs(l.out_point/TICKS-p.duration) < 1/60,
    normalBlend:l.blend_mode === 'Normal' && l.track_matte === null,
    noMotionBlur:l.switches.motion_blur === false,
    no3d:l.switches.three_d === false,
    correctSource:source?.type === 'Footage' && source.path === nativePath(path.join(root, 'media/character-cutout.png')) && source.missing === false,
    opacityAndRotation:transform.opacity === 100 && transform.rotation === 0,
    originalLocalBase:vec(transform.position, [730,1290,0]) && vec(transform.anchor, [452.5,905,0]) && vec(transform.scale, [380/905*100,380/905*100,100]),
    noKeysOrExpressions:props.every(v => !(v.keys?.length) && !v.expression && !v.expr),
    noMasksOrEffects:groups.filter(g => g.match === 'effects' || g.match === 'masks').every(g => !g.children?.length)
  };
  const result = {scope:'owner-authorized whole-frame native transform; original character local properties remain static', checks, passed:Object.values(checks).every(Boolean), characterLayer:l, wholeFrameCamera:camera, transform, source, originalSha256:originalHash,
    cutoutSha256:hash(path.join(root, 'media/character-cutout.png')), aiViewingAllowed:false};
  save(receipt(p, 'wholeframe-character'), result);
  if (!result.passed) throw Error('Whole-frame character structure audit failed: ' + JSON.stringify(checks));
  return result;
}
export function prepare(selected = plans) {
  assets();
  for (const p of selected) {
    directories(p);
    if (!p.reviewTimes?.length || p.reviewTimes.some(t => t < 0 || t >= p.duration)) throw Error('Invalid review times for ' + p.id);
    for (const includeCharacter of [true, false]) {
      const stem = p.id + (includeCharacter ? '' : '-text-only');
      const jsx = path.join(dir(p), 'source', stem + '.jsx');
      fs.writeFileSync(jsx, composition(root, p, {includeCharacter}));
      const result = parse(call(EC, ['--empty', 'script', nativePath(jsx), '--save-as', nativePath(project(p, !includeCharacter)), '--json'], receipt(p, stem + '-build')));
      if (!result.ok || result.error) throw Error(JSON.stringify(result));
      const report = typeof result.output === 'string' ? parse(result.output) : result.output;
      save(receipt(p, includeCharacter ? 'layout' : 'text-only-layout'), report);
      if (!report?.boxes?.length) throw Error('Native text layout missing for ' + p.id);
      if (report.boxes.some(b => !b.text?.trim() || !Number.isFinite(b.size) || b.size < 20)) throw Error('Invalid text size/content.');
    }
    save(receipt(p, 'text-only-isolation'), assertTextOnly(p));
    auditWholeFrameCharacter(p);
    console.log('Prepared ' + p.id);
  }
}
function audioSettings(p) {
  const file = path.join(root, 'audio-preview', p.audioFile || p.audioKey + '.m4a');
  if (!fs.existsSync(file)) throw Error('Missing downloaded public preview: ' + file);
  const audioStart = Number(p.audioStart ?? 0);
  const probe = parse(call(FP, ['-v', 'error', '-show_format', '-of', 'json', nativePath(file)]));
  if (!Number.isFinite(audioStart) || audioStart < 0 || audioStart + p.duration - p.drop > Number(probe.format.duration) + .03) throw Error('Requested segment exceeds preview length.');
  return {file, audioStart, previewDuration:Number(probe.format.duration)};
}
async function mixAudio(p) {
  const audio = audioSettings(p), music = path.join(dir(p), 'media/music-mix.wav');
  const localOutro = p.outro - p.drop;
  const remain = p.duration - p.drop;
  const filter = `atrim=start=${audio.audioStart}:duration=${remain},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.035,volume=0.28:enable='gte(t,${localOutro})',afade=t=out:st=${remain-.7}:d=0.7,adelay=${Math.round(p.drop*1000)}:all=1,apad,atrim=duration=${p.duration},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000`;
  await run(FF, ['-hide_banner', '-y', '-i', nativePath(audio.file), '-vn', '-af', filter, '-ac', '2', '-c:a', 'pcm_s24le', nativePath(music)], receipt(p, 'audio-mix'));
  save(receipt(p, 'audio-source'), {...audio, file:path.basename(audio.file), sha256:hash(audio.file), song:p.song,
    videoMusicStartsAt:p.drop, videoDuckStartsAt:p.outro, containsPerformerVoice:false, previewUseAuthorizedByOwner:true,
    exactTikTokClipMatchVerified:false, fullRecordingOffsetKnown:false});
  return music;
}
function createFilm(p, master, music) {
  const fc = path.join(dir(p), 'projects', p.id + '.fcproj');
  const commands = [
    {id:'file.newProject', params:{name:'Osayu Thankyou / 全画面追従 V3 / ' + p.title}},
    {id:'file.newSequence', params:{name:comp(p), width:1080, height:1920, fps:30, sampleRate:48000, video:1, audio:1}},
    {id:'file.import', params:{paths:[nativePath(master), nativePath(music)]}}
  ];
  const initialized = call(FC, ['--save-as', nativePath(fc), 'run', '-'], receipt(p, 'filmcraft-build'), commands.map(c => JSON.stringify(c)).join('\n') + '\n');
  let items;
  for (const line of initialized.split(/\r?\n/).filter(s => s.trim())) {
    const result = parse(line), value = result.result || result;
    if (value.items) items = value.items;
  }
  if (items?.length !== 2) throw Error('FilmCraft imported item IDs unavailable.');
  const clips = [
    {id:'timeline.place', params:{item:items[0], track:'V1', seconds:0, duration:Math.round(p.duration*TICKS), video:true, audio:false}},
    {id:'timeline.place', params:{item:items[1], track:'A1', seconds:0, duration:Math.round(p.duration*TICKS), video:false, audio:true}}
  ];
  call(FC, ['--project', nativePath(fc), '--save', 'run', '-'], receipt(p, 'filmcraft-timeline'), clips.map(c => JSON.stringify(c)).join('\n') + '\n');
  call(FC, ['--project', nativePath(fc), 'inspect'], receipt(p, 'filmcraft-reopen'));
}
export async function render(selected = plans) {
  assets();
  for (const p of selected) {
    directories(p); auditWholeFrameCharacter(p);
    const master = path.join(dir(p), 'media/picture-master.mp4');
    const input = {projectSha256:hash(project(p)), assets:assetSeals(), startedAt:new Date().toISOString()};
    await run(EC, ['render', '--project', nativePath(project(p)), '--comp', comp(p), '--out', nativePath(master), '--format', 'h264', '--bitrate', '18000', '--audio', 'off', '--progress', '--json'], receipt(p, 'effectcraft-render'));
    if (hash(project(p)) !== input.projectSha256) throw Error('Project changed during rendering: ' + p.id);
    if (JSON.stringify(input.assets) !== JSON.stringify(assetSeals())) throw Error('Raster inputs changed during rendering: ' + p.id);
    save(receipt(p, 'render-input'), {...input, endedAt:new Date().toISOString(), masterSha256:hash(master)});
    const music = await mixAudio(p);
    await run(FF, ['-hide_banner', '-y', '-i', nativePath(master), '-map', '0:v:0', '-an', '-c:v', 'copy', '-movflags', '+faststart', nativePath(movie(p, 'tiktok-silent'))], receipt(p, 'silent-export'));
    await run(FF, ['-hide_banner', '-y', '-i', nativePath(master), '-i', nativePath(music), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(p.duration), '-movflags', '+faststart', nativePath(movie(p, 'reference'))], receipt(p, 'reference-export'));
    createFilm(p, master, music);
    console.log('Rendered ' + p.id);
  }
}
export async function previews(selected = plans) {
  assets();
  for (const p of selected) {
    directories(p); const isolation = assertTextOnly(p), frames = [];
    for (const [i, time] of p.reviewTimes.entries()) {
      const stem = 'text-only-' + String(i+1).padStart(3, '0'), file = path.join(dir(p), 'qa', stem + '.png');
      await run(EC, ['render-frame', '--project', nativePath(project(p, true)), '--comp', comp(p), '--time', String(time), '--out', nativePath(file), '--json'], receipt(p, stem));
      frames.push({time, file:path.basename(file), sha256:hash(file), containsCharacter:false});
    }
    save(receipt(p, 'text-only-preview-index'), {...isolation, frames});
    const sheet = path.join(dir(p), 'qa/text-only-contact-sheet.png');
    const cols = 4, rows = Math.ceil(frames.length/cols);
    await run(FF, ['-v', 'error', '-y', '-framerate', '1', '-start_number', '1', '-i', nativePath(path.join(dir(p), 'qa/text-only-%03d.png')), '-vf', `scale=270:480,tile=${cols}x${rows}:nb_frames=${frames.length}:padding=8:margin=8:color=0x0c1020`, '-frames:v', '1', nativePath(sheet)], receipt(p, 'contact-sheet'));
    save(receipt(p, 'contact-sheet-policy'), {containsCharacter:false, projectSha256:isolation.projectSha256, sha256:hash(sheet), sourceFrames:frames});
    console.log('Character-free previews ' + p.id);
  }
}
export async function wholeReview(selected = plans) {
  assets();
  const summaries = [];
  for (const p of selected) {
    directories(p);
    const isolation = assertTextOnly(p), frames = [];
    const times = p.wholeReviewTimes;
    if (!Array.isArray(times) || !times.length || times.some(time => !Number.isFinite(time) || time < 0 || time >= p.duration)) throw Error('Valid wholeReviewTimes are required: ' + p.id);
    const layout = parse(fs.readFileSync(receipt(p, 'text-only-layout'), 'utf8'));
    for (const [i, time] of times.entries()) {
      const stem = 'text-only-whole-' + String(i+1).padStart(3, '0');
      const file = path.join(dir(p), 'qa', stem + '.png');
      await run(EC, ['render-frame', '--project', nativePath(project(p, true)), '--comp', comp(p), '--time', String(time), '--out', nativePath(file), '--json'], receipt(p, stem));
      frames.push({time, file:path.basename(file), sha256:hash(file), containsCharacter:false});
    }
    if (assertTextOnly(p).projectSha256 !== isolation.projectSha256) throw Error('Text-only project changed during whole-frame sampling.');
    const columns = 4, rows = Math.ceil(frames.length/columns);
    const sheet = path.join(dir(p), 'qa/text-only-wholeframe.png');
    await run(FF, ['-v', 'error', '-y', '-framerate', '1', '-start_number', '1', '-i', nativePath(path.join(dir(p), 'qa/text-only-whole-%03d.png')), '-vf', `scale=270:480,tile=${columns}x${rows}:nb_frames=${frames.length}:padding=8:margin=8:color=0xf4ecd9`, '-frames:v', '1', nativePath(sheet)], receipt(p, 'wholeframe-contact-sheet'));
    const index = {...isolation, id:p.id, columns, rows, frames, wholeCameraKeys:layout.wholeCameraKeys || [], sceneCuts:layout.sceneCuts || [],
      sheet:path.basename(sheet), sheetSha256:hash(sheet), visualInspectionPerformed:false};
    save(receipt(p, 'text-only-wholeframe-index'), index);
    summaries.push(index);
    console.log('Character-free whole-frame previews ' + p.id);
  }
  return summaries;
}

export async function verify(selected = plans) {
  const summary = [];
  for (const p of selected) {
    const input = parse(fs.readFileSync(receipt(p, 'render-input'), 'utf8'));
    if (input.projectSha256 !== hash(project(p)) || input.masterSha256 !== hash(path.join(dir(p), 'media/picture-master.mp4'))) throw Error('Rendered movie input seal is stale: ' + p.id);
    if (JSON.stringify(input.assets) !== JSON.stringify(assetSeals())) throw Error('Rendered raster input seals are stale: ' + p.id);
    const checks = [], outputs = [];
    for (const suffix of ['reference', 'tiktok-silent']) {
      const file = movie(p, suffix);
      const data = parse(call(FP, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', nativePath(file)], receipt(p, suffix + '-ffprobe')));
      const v = data.streams.find(s => s.codec_type === 'video'), audio = data.streams.filter(s => s.codec_type === 'audio');
      const ok = v?.width === 1080 && v.height === 1920 && v.r_frame_rate === '30/1' && v.codec_name === 'h264'
        && Number(v.nb_read_frames) === Math.round(p.duration*30) && Math.abs(Number(data.format.duration)-p.duration) < .08
        && audio.length === (suffix === 'reference' ? 1 : 0) && (!audio.length || (audio[0].codec_name === 'aac' && Number(audio[0].sample_rate) === 48000));
      if (!ok) throw Error('Output metadata mismatch: ' + file);
      await run(FF, ['-v', 'error', '-i', nativePath(file), '-f', 'null', '-'], receipt(p, suffix + '-decode'));
      checks.push({name:suffix + ' metadata + full decode', passed:true});
      outputs.push({file:path.relative(root, file), sha256:hash(file), bytes:fs.statSync(file).size, frames:Number(v.nb_read_frames), duration:Number(data.format.duration), audioStreams:audio.length});
    }
    const levels = await run(FF, ['-hide_banner', '-i', nativePath(movie(p, 'reference')), '-af', 'ebur128=peak=true', '-f', 'null', '-'], receipt(p, 'final-aac-levels'));
    const integrated = Number([...levels.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]);
    const peak = Number([...levels.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);
    const audio = {integratedLufs:integrated, truePeakDbtp:peak};
    save(receipt(p, 'audio-measurement'), audio);
    if (!Number.isFinite(integrated) || !Number.isFinite(peak) || peak > -.7 || integrated > -12 || integrated < -17) throw Error('Invalid final AAC levels: ' + JSON.stringify(audio));
    const isolation = assertTextOnly(p), character = auditWholeFrameCharacter(p);
    call(EC, ['--project', nativePath(project(p)), 'info', '--json'], receipt(p, 'effectcraft-reopen'));
    call(EC, ['--project', nativePath(project(p, true)), 'info', '--json'], receipt(p, 'text-only-reopen'));
    const fc = path.join(dir(p), 'projects', p.id + '.fcproj');
    call(FC, ['--project', nativePath(fc), 'inspect'], receipt(p, 'filmcraft-final-reopen'));
    await run(EC, ['render-frame', '--project', nativePath(project(p)), '--comp', comp(p), '--time', String(p.climax+.3), '--out', nativePath(path.join(dir(p), 'qa/local-only/ec-reopened.png')), '--json'], receipt(p, 'effectcraft-reopened-render'));
    await run(FC, ['--project', nativePath(fc), 'render', '--seconds', String(p.climax+.3), '--out', nativePath(path.join(dir(p), 'qa/local-only/fc-reopened.png'))], receipt(p, 'filmcraft-reopened-render'));
    const result = {id:p.id, title:p.title, checks, outputs, audio, wholeFrameCharacterPassed:character.passed, renderInputProjectSha256:input.projectSha256, renderInputAssets:input.assets, characterFreePreview:isolation,
      nativeReopenAndRender:true, technicalPassed:true, humanRealtimeReview:false, tiktokDeviceReview:false, ownerCreativeApproval:false};
    save(receipt(p, 'validation'), result); summary.push(result);
    console.log('Verified ' + p.id);
  }
  save(path.join(root, 'qa/validation.json'), summary);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const operation = process.argv[2], selected = process.argv[3] ? plans.filter(p => p.id === process.argv[3]) : plans;
  if (!selected.length) throw Error('Unknown plan ID.');
  const actions = {prepare, render, previews, 'whole-review':wholeReview, verify};
  if (!actions[operation]) throw Error('Use prepare | render | previews | whole-review | verify [plan-id].');
  await actions[operation](selected);
}
