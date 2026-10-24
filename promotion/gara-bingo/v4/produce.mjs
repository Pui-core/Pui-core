/** V4 native pipeline. Character media must never be sent to an AI viewer. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {composition, reviewTimes, cuts} from './motion.mjs';
import {makePostingVersion} from './post-audio.mjs';

export const root = path.resolve(process.env.OSAYU_BINGO_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-04');
export const compName = 'Osayu Bingo V4';
export const videoName = 'osayu-bingo-v4-1124.mp4';
export const projectStem = 'osayu-bingo-v4';
export const textOnlyProjectName = 'text-only.ecproj';
export const duration = 22;
export const fps = 30;
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const file = name => path.join(root, name);
const hash = name => crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
const parse = text => JSON.parse(text.replace(/^\uFEFF/, '').trim());
const mediaNames = new Set(['character-original.jpg', 'character-cutout.png', 'stage-background.png',
  'normalized.wav', 'picture-master.mp4', 'original-score.wav', 'audio-qa.json']);
export const approvedStagePath = '/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-02/media/stage-background.png';
export const approvedStageSha256 = '248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6';

function directories() {
  for (const name of ['media', 'source', 'projects', 'videos', 'qa', 'qa/local-only', 'checkpoints']) fs.mkdirSync(file(name), {recursive:true});
}
export function nativePath(name) {
  const r = spawnSync('wslpath', ['-w', path.resolve(name)], {encoding:'utf8'});
  if (r.error || r.status || !r.stdout?.trim()) throw Error('Cannot convert native path: ' + name);
  return r.stdout.trim();
}
function save(name, value) {
  fs.mkdirSync(path.dirname(file(name)), {recursive:true});
  fs.writeFileSync(file(name), JSON.stringify(value, null, 2) + '\n');
}
function call(exe, args, receipt, input) {
  const r = spawnSync(exe, args, {encoding:'utf8', input, timeout:120000, maxBuffer:32*1024*1024});
  const value = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  if (receipt) save(receipt, value);
  if (r.error || r.status !== 0) throw Error(JSON.stringify({exe, args, ...value}).slice(-6000));
  return value.stdout.trim();
}
async function run(exe, args, receipt) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {stdio:['ignore', 'pipe', 'pipe']});
    let stdout = '', stderr = '', launchError;
    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);
    child.on('error', error => { launchError = error; });
    child.on('close', exit => {
      const result = {exit, seconds:(Date.now()-start)/1000, error:launchError?.message, stdout:stdout.replace(/^\uFEFF/, ''), stderr};
      if (receipt) save(receipt, result);
      if (launchError || exit !== 0) reject(Error(JSON.stringify({exe, args, ...result}).slice(-6000)));
      else resolve(result);
    });
  });
}
function assertAllowedMedia() {
  const unexpected = fs.readdirSync(file('media')).filter(name => !mediaNames.has(name));
  if (unexpected.length) throw Error('V4 media contains an asset outside the approved image/audio allowlist: ' + unexpected.join(', '));
  for (const name of ['character-original.jpg', 'character-cutout.png', 'stage-background.png', 'normalized.wav']) {
    if (!fs.existsSync(file('media/' + name)) || !fs.statSync(file('media/' + name)).size) throw Error('Missing V4 media: ' + name);
  }
  assertApprovedStage(root);
}
function strings(value, values = []) {
  if (typeof value === 'string') values.push(value);
  else if (Array.isArray(value)) value.forEach(child => strings(child, values));
  else if (value && typeof value === 'object') Object.values(value).forEach(child => strings(child, values));
  return values;
}
export function assertApprovedStage(mediaRoot) {
  const stage = path.join(mediaRoot, 'media', 'stage-background.png');
  if (!fs.existsSync(stage)) throw Error('Approved V2 stage is required for character-free previews.');
  const actualSha256 = hash(stage);
  if (actualSha256 !== approvedStageSha256) throw Error('V4 stage differs from the approved V2 background digest.');
  if (fs.existsSync(approvedStagePath) && hash(approvedStagePath) !== approvedStageSha256)
    throw Error('The V2 background reference changed after its approved digest was recorded.');
  return {stageSha256:actualSha256, approvedStageSha256, approvedStageMatches:true};
}
export function assertTextOnlyProject(project) {
  const parsed = parse(fs.readFileSync(project, 'utf8'));
  const rasterReferences = strings(parsed).filter(value => /\.(?:jpe?g|png|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(value));
  const forbidden = rasterReferences.filter(value => value.replaceAll('\\', '/').split('/').at(-1) !== 'stage-background.png');
  if (forbidden.length) throw Error('Character-free preview contains unapproved raster media: ' + JSON.stringify(forbidden));
  if (!rasterReferences.length) throw Error('Character-free preview must reference the approved V2 stage.');
  const projectRoot = path.dirname(path.dirname(path.resolve(project)));
  const stage = path.join(projectRoot, 'media', 'stage-background.png');
  const allowedReferences = new Set(['stage-background.png', stage, nativePath(stage)]);
  const differentPaths = rasterReferences.filter(value => !allowedReferences.has(value));
  if (differentPaths.length) throw Error('Character-free project stage points outside its own approved media: ' + JSON.stringify(differentPaths));
  const approval = assertApprovedStage(projectRoot);
  return {containsCharacter:false, characterRasterReferences:0, rasterReferences:rasterReferences.length,
    allowedRaster:'stage-background.png', aiPreviewAllowed:true, ...approval, sha256:hash(project)};
}
function checkpoint() {
  const names = ['projects/' + projectStem + '.ecproj', 'projects/' + projectStem + '.fcproj',
    'projects/' + textOnlyProjectName, 'source/' + projectStem + '.jsx', 'source/text-only.jsx',
    'qa/checkpoint.json', 'qa/text-layout.json', 'qa/text-only-layout.json'];
  const existing = names.filter(name => fs.existsSync(file(name)));
  if (!existing.length) return;
  const destination = file('checkpoints/' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(destination, {recursive:true});
  for (const name of existing) fs.copyFileSync(file(name), path.join(destination, path.basename(name)));
}
function checkedReviewTimes() {
  if (!Array.isArray(reviewTimes) || !reviewTimes.length) throw Error('motion.mjs must export reviewTimes.');
  for (const time of reviewTimes) if (!Number.isFinite(time) || time < 0 || time >= duration) throw Error('Invalid review time: ' + time);
  return [...new Set(reviewTimes)].sort((a,b) => a-b);
}
function build(includeCharacter) {
  const stem = includeCharacter ? projectStem : 'text-only';
  const jsx = composition(root, {includeCharacter});
  if (typeof jsx !== 'string' || !jsx.trim()) throw Error('composition returned no JSX: ' + stem);
  const source = file('source/' + stem + '.jsx'), project = file('projects/' + stem + '.ecproj');
  fs.writeFileSync(source, jsx);
  const result = parse(call(EC, ['--empty', 'script', nativePath(source), '--save-as', nativePath(project), '--json'], 'qa/' + stem + '-build.json'));
  if (!result.ok || result.error) throw Error(JSON.stringify(result));
  const report = parse(result.output);
  if (!Array.isArray(report.boxes) || !report.boxes.length) throw Error('Native composition did not report text boxes: ' + stem);
  const invalid = report.boxes.filter(box => typeof box.text !== 'string' || !box.text.trim() || !Number.isFinite(box.size) || box.size < 20);
  save(includeCharacter ? 'qa/text-layout.json' : 'qa/text-only-layout.json', report);
  save('qa/' + stem + '-text-validation.json', {minimumFontSize:20, errors:invalid,
    note:'文字の滞在区間・UI回避はキャラ未読込のtext-only出力と数値auditで確認。キャラ素材のAI画像解析は行わない。'});
  if (invalid.length) throw Error('Invalid text content or size: ' + JSON.stringify(invalid));
  if (report.motionLedger) save(includeCharacter ? 'qa/motion-ledger.json' : 'qa/text-only-motion-ledger.json', report.motionLedger);
  if (!includeCharacter) save('qa/text-only-isolation.json', assertTextOnlyProject(project));
  return {project:path.basename(project), projectSha256:hash(project), sourceSha256:hash(source), textLayers:report.boxes.length, includeCharacter};
}
export function prepare() {
  directories(); assertAllowedMedia(); checkedReviewTimes(); checkpoint();
  const main = build(true), textOnly = build(false);
  save('qa/checkpoint.json', {saved:true, compName, duration, fps, main, textOnly, cuts, reviewTimes:checkedReviewTimes(),
    aiImagePolicy:'Character files and character-containing outputs must not be opened by an AI viewer. Character-free previews require the approved V2 stage SHA.'});
  console.log('Saved V4 main and isolated text-only native projects.');
}

export async function render() {
  directories(); assertAllowedMedia();
  const ec = file('projects/' + projectStem + '.ecproj'), fc = file('projects/' + projectStem + '.fcproj');
  const master = file('media/picture-master.mp4'), music = file('media/normalized.wav');
  if (!fs.existsSync(ec)) throw Error('Run prepare first.');
  await run(EC, ['render', '--project', nativePath(ec), '--comp', compName, '--out', nativePath(master),
    '--format', 'h264', '--bitrate', '16000', '--audio', 'off', '--progress', '--json'], 'qa/effectcraft-render.json');
  const commands = [
    {id:'file.newProject', params:{name:'Osayu / bingo revision 04'}},
    {id:'file.newSequence', params:{name:compName, width:1080, height:1920, fps, sampleRate:48000, video:1, audio:1}},
    {id:'file.import', params:{paths:[nativePath(master), nativePath(music)]}}
  ];
  const initialized = call(FC, ['--save-as', nativePath(fc), 'run', '-'], 'qa/filmcraft-build.json', commands.map(value => JSON.stringify(value)).join('\n') + '\n');
  let items;
  for (const line of initialized.split(/\r?\n/).filter(line => line.trim())) {
    const result = parse(line), value = result.result || result;
    if (value.items) items = value.items;
  }
  if (items?.length !== 2) throw Error('Imported native IDs unavailable.');
  const ticks = duration * 254016000000;
  const clips = [
    {id:'timeline.place', params:{item:items[0], track:'V1', seconds:0, duration:ticks, video:true, audio:false}},
    {id:'timeline.place', params:{item:items[1], track:'A1', seconds:0, duration:ticks, video:false, audio:true}}
  ];
  call(FC, ['--project', nativePath(fc), '--save', 'run', '-'], 'qa/filmcraft-timeline.json', clips.map(value => JSON.stringify(value)).join('\n') + '\n');
  const output = file('videos/' + videoName);
  const exported = await run(FC, ['--project', nativePath(fc), 'exec', 'file.exportMedia', JSON.stringify({
    path:nativePath(output), format:'h264', audio:true, audioCodec:'aac', bitrateMode:'crf', crf:18,
    hardwareEncoding:'off', gpuRendering:'off', wait:true
  })], 'qa/filmcraft-export.json');
  const result = parse(exported.stdout);
  if (result.offlineMedia?.length) throw Error('Offline media: ' + JSON.stringify(result.offlineMedia));
  save('qa/rendered.json', {sha256:hash(output), bytes:fs.statSync(output).size, projectHashes:{effectcraft:hash(ec), filmcraft:hash(fc)},
    duration, fps, frames:duration*fps, containsCharacter:true, aiViewingAllowed:false});
  makePostingVersion(root);
  console.log('Exported V4 reference and silent posting master locally. Character-containing output must not be displayed to an AI viewer.');
}

export async function previews() {
  directories();
  const project = file('projects/' + textOnlyProjectName), isolation = assertTextOnlyProject(project);
  const frames = [];
  for (const [index, time] of checkedReviewTimes().entries()) {
    const name = 'text-only-preview-' + String(index+1).padStart(3, '0');
    const png = file('qa/' + name + '.png');
    // This function intentionally never renders from the main project.
    await run(EC, ['render-frame', '--project', nativePath(project), '--comp', compName, '--time', String(time),
      '--out', nativePath(png), '--json'], 'qa/' + name + '.json');
    frames.push({time, file:path.basename(png), sha256:hash(png), containsCharacter:false});
  }
  save('qa/text-only-preview-index.json', {...isolation, compName, frames});
  return frames;
}
async function textOnlyContactSheet() {
  const project = file('projects/' + textOnlyProjectName), isolation = assertTextOnlyProject(project);
  let index;
  try {
    index = parse(fs.readFileSync(file('qa/text-only-preview-index.json'), 'utf8'));
    if (index.containsCharacter !== false || index.sha256 !== isolation.sha256 || index.stageSha256 !== isolation.stageSha256
      || index.approvedStageMatches !== true || !index.frames?.length
      || index.frames.some(frame => frame.containsCharacter !== false || hash(file('qa/' + frame.file)) !== frame.sha256)) index = null;
  } catch { index = null; }
  if (!index) { await previews(); index = parse(fs.readFileSync(file('qa/text-only-preview-index.json'), 'utf8')); }
  const count = Math.min(15, index.frames.length);
  const selected = Array.from({length:count}, (_,i) => index.frames[count === 1 ? 0 : Math.round(i*(index.frames.length-1)/(count-1))]);
  const contactDirectory = file('qa/text-only-contact-frames');
  fs.mkdirSync(contactDirectory, {recursive:true});
  for (const [index, frame] of selected.entries()) fs.copyFileSync(file('qa/' + frame.file), path.join(contactDirectory, String(index+1).padStart(3,'0') + '.png'));
  const columns = Math.min(5, count), rows = Math.ceil(count/columns);
  await run(FF, ['-v', 'error', '-y', '-framerate', '1', '-start_number', '1', '-i', nativePath(path.join(contactDirectory, '%03d.png')),
    '-vf', `scale=324:576,tile=${columns}x${rows}:nb_frames=${count}:padding=8:margin=8:color=0x10131F`,
    '-frames:v', '1', nativePath(file('qa/text-only-contact-sheet.png'))], 'qa/text-only-contact-sheet.json');
  save('qa/text-only-contact-sheet-timing.json', {containsCharacter:false, projectSha256:isolation.sha256,
    stageSha256:isolation.stageSha256, approvedStageMatches:true, frames:selected});
  return {containsCharacter:false, columns, rows, frames:count, stageSha256:isolation.stageSha256,
    approvedStageMatches:true, aiPreviewAllowed:true, file:'qa/text-only-contact-sheet.png'};
}

export async function verify() {
  directories(); assertAllowedMedia();
  const output = file('videos/' + videoName);
  const probe = parse(call(FP, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', nativePath(output)], 'qa/probe-command.json'));
  save('qa/ffprobe.json', probe);
  const v = probe.streams.find(stream => stream.codec_type === 'video'), a = probe.streams.find(stream => stream.codec_type === 'audio');
  if (!v || v.width !== 1080 || v.height !== 1920 || v.r_frame_rate !== '30/1' || v.codec_name !== 'h264'
    || Number(v.nb_read_frames) !== duration*fps || !a || a.codec_name !== 'aac' || Number(a.sample_rate) !== 48000
    || Math.abs(Number(probe.format.duration)-duration) > .1) throw Error('Invalid output metadata: ' + JSON.stringify(probe));
  await run(FF, ['-v', 'error', '-i', nativePath(output), '-f', 'null', '-'], 'qa/full-decode.json');
  const measured = await run(FF, ['-hide_banner', '-i', nativePath(output), '-af', 'ebur128=peak=true', '-f', 'null', '-'], 'qa/audio-ebur128.json');
  const integrated = [...measured.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1];
  const peak = [...measured.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1];
  const audioMeasurement = {integratedLufs:Number(integrated), truePeakDbtp:Number(peak)};
  save('qa/audio-measurement.json', audioMeasurement);
  if (!Number.isFinite(audioMeasurement.integratedLufs) || Math.abs(audioMeasurement.integratedLufs+14) > 1
    || !Number.isFinite(audioMeasurement.truePeakDbtp) || audioMeasurement.truePeakDbtp > -1)
    throw Error('Final AAC audio is outside the V4 level/peak limits: ' + JSON.stringify(audioMeasurement));
  const contactSheet = await textOnlyContactSheet();
  const main = nativePath(file('projects/' + projectStem + '.ecproj'));
  const textOnly = nativePath(file('projects/' + textOnlyProjectName));
  const film = nativePath(file('projects/' + projectStem + '.fcproj'));
  const reopenedMain = parse(call(EC, ['--project', main, 'info', '--json'], 'qa/effectcraft-reopen.json'));
  const reopenedText = parse(call(EC, ['--project', textOnly, 'info', '--json'], 'qa/text-only-reopen.json'));
  const reopenedFilm = parse(call(FC, ['--project', film, 'inspect'], 'qa/filmcraft-reopen.json'));
  // Character-containing native check renders are LOCAL ONLY. Never display
  // these files, the final MP4 or its cover through view_image/image AI tools.
  await run(EC, ['--project', main, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(file('qa/local-only/main-effectcraft-reopened.png')), '--json'], 'qa/effectcraft-reopened-render.json');
  await run(FC, ['--project', film, 'render', '--seconds', '1.1', '--out', nativePath(file('qa/local-only/main-filmcraft-reopened.png'))], 'qa/filmcraft-reopened-render.json');
  await run(EC, ['--project', textOnly, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(file('qa/text-only-reopened.png')), '--json'], 'qa/text-only-reopened-render.json');
  await run(FF, ['-v', 'error', '-y', '-ss', '1.1', '-i', nativePath(output), '-frames:v', '1', nativePath(file('qa/local-only/cover-contains-character.png'))], 'qa/cover-local-only.json');
  const technical = {status:'TECHNICAL_CHECKS_COMPLETE_AUDIT_PENDING', fullDecode:true, duration, fps,
    frames:Number(v.nb_read_frames), width:v.width, height:v.height, audioMeasurement, contactSheet,
    effectcraftReopened:!!reopenedMain, textOnlyReopened:!!reopenedText, filmcraftReopened:!!reopenedFilm,
    nativeReopenRender:true, textOnlyVisualReview:'PENDING', characterVisualReview:'NOT_PERFORMED_AI_RESTRICTION',
    realTimePlayback:'NOT_CLAIMED', listening:'NOT_CLAIMED', sha256:hash(output),
    aiImagePolicy:'Only text-only renders with zero character references and a matching approved V2 stage SHA are eligible for AI viewing; all character-containing renders remain local.'};
  save('qa/technical.json', technical);
  const {audit} = await import('./audit.mjs');
  const auditResult = await audit(root);
  if (auditResult?.ok === false || /FAIL|ERROR/i.test(auditResult?.status || '')) throw Error('V4 numerical audit failed: ' + JSON.stringify(auditResult));
  let visual={status:'PENDING'};
  const visualPath=file('qa/object-visual-review.json');
  if(fs.existsSync(visualPath)){
    visual=parse(fs.readFileSync(visualPath,'utf8'));
    const current=assertTextOnlyProject(file('projects/'+textOnlyProjectName));
    if(visual.status!=='PASS'||visual.isolation?.final?.sha256!==current.sha256||visual.sourceProvenance?.finalSourceEquivalent!==true)throw Error('Visual review is not tied to the final character-free project.');
  }
  save('qa/technical.json', {...technical, status:'TECHNICAL_PASS', auditReturnedWithoutError:true, textOnlyVisualReview:visual.status, postingMaster:parse(fs.readFileSync(file('qa/posting-master.json'),'utf8'))});
  console.log('V4 numerical checks passed; only isolated text-only review sheets are eligible for AI viewing.');
  return {technical, audit:auditResult};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === 'prepare') prepare();
  else if (mode === 'previews') await previews();
  else if (mode === 'render') await render();
  else if (mode === 'verify') await verify();
  else console.log('node produce.mjs prepare|previews|render|verify');
}
