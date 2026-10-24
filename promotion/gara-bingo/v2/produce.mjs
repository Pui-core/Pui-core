/** Native EffectCraft -> FilmCraft pipeline for the second bingo edit. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {composition, reviewTimes} from './motion.mjs';

export const root = path.resolve(process.env.OSAYU_BINGO_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-02');
export const compName = 'Osayu Bingo V2';
export const videoName = 'osayu-bingo-v2-1124.mp4';
export const projectStem = 'osayu-bingo-v2';
export const duration = 22;
export const fps = 30;
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const file = p => path.join(root, p);
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const parse = text => JSON.parse(text.replace(/^\uFEFF/, '').trim());
function directories() {
  for (const d of ['media', 'source', 'projects', 'videos', 'qa', 'checkpoints']) fs.mkdirSync(file(d), {recursive:true});
}
export function nativePath(p) {
  const r = spawnSync('wslpath', ['-w', path.resolve(p)], {encoding:'utf8'});
  if (r.error || r.status || !r.stdout?.trim()) throw Error('Cannot convert native path: ' + p);
  return r.stdout.trim();
}
function save(p, value) {
  fs.mkdirSync(path.dirname(file(p)), {recursive:true});
  fs.writeFileSync(file(p), JSON.stringify(value, null, 2) + '\n');
}
function call(exe, args, receipt, input) {
  const r = spawnSync(exe, args, {encoding:'utf8', input, timeout:120000, maxBuffer:32*1024*1024});
  const v = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  if (receipt) save(receipt, v);
  if (r.error || r.status !== 0) throw Error(JSON.stringify({exe, args, ...v}).slice(-6000));
  return v.stdout.trim();
}
async function run(exe, args, receipt) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const p = spawn(exe, args, {stdio:['ignore', 'pipe', 'pipe']});
    let stdout = '', stderr = '', launchError;
    p.stdout.on('data', d => stdout += d);
    p.stderr.on('data', d => stderr += d);
    p.on('error', error => { launchError = error; });
    p.on('close', exit => {
      const result = {exit, seconds:(Date.now()-start)/1000, error:launchError?.message, stdout:stdout.replace(/^\uFEFF/, ''), stderr};
      if (receipt) save(receipt, result);
      if (launchError || exit !== 0) reject(Error(JSON.stringify({exe, args, ...result}).slice(-6000)));
      else resolve(result);
    });
  });
}
function checkpoint() {
  const names = ['projects/' + projectStem + '.ecproj', 'projects/' + projectStem + '.fcproj',
    'source/' + projectStem + '.jsx', 'qa/checkpoint.json', 'qa/text-layout.json', 'qa/motion-ledger.json'];
  const existing = names.filter(name => fs.existsSync(file(name)));
  if (!existing.length) return;
  const destination = file('checkpoints/' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(destination, {recursive:true});
  for (const name of existing) fs.copyFileSync(file(name), path.join(destination, path.basename(name)));
}
function checkedReviewTimes() {
  if (!Array.isArray(reviewTimes) || !reviewTimes.length) throw Error('motion.mjs must export reviewTimes.');
  for (const t of reviewTimes) if (!Number.isFinite(t) || t < 0 || t >= duration) throw Error('Invalid review time: ' + t);
  return [...new Set(reviewTimes)].sort((a,b) => a-b);
}

export function prepare() {
  directories();
  checkpoint();
  const jsx = composition(root);
  if (typeof jsx !== 'string' || !jsx.trim()) throw Error('composition(root) returned no JSX.');
  checkedReviewTimes();
  const source = file('source/' + projectStem + '.jsx');
  const project = file('projects/' + projectStem + '.ecproj');
  fs.writeFileSync(source, jsx);
  const built = parse(call(EC, ['--empty', 'script', nativePath(source), '--save-as', nativePath(project), '--json'], 'qa/build.json'));
  if (!built.ok || built.error) throw Error(JSON.stringify(built));
  const report = parse(built.output);
  if (!Array.isArray(report.boxes) || !report.boxes.length) throw Error('Native composition did not report text boxes.');
  if (!report.motionLedger || typeof report.motionLedger !== 'object') throw Error('Native composition did not report its motion ledger.');
  save('qa/text-layout.json', report);
  save('qa/motion-ledger.json', report.motionLedger);
  // Entry and exit poses deliberately leave the frame. Visual review checks the
  // readable dwell poses instead of applying V1 static bounds to every motion.
  const invalid = report.boxes.filter(b => typeof b.text !== 'string' || !b.text.trim() || !Number.isFinite(b.size) || b.size < 20);
  save('qa/text-validation.json', {minimumFontSize:20, staticBoundsEnforced:false, errors:invalid,
    note:'文字が読み取れる滞在区間とUI回避はプレビューおよび最終動画で目視確認する。'});
  if (invalid.length) throw Error('Invalid text content or size: ' + JSON.stringify(invalid));
  save('qa/checkpoint.json', {saved:true, compName, duration, fps, projectSha256:hash(project), sourceSha256:hash(source), reviewTimes:checkedReviewTimes()});
  console.log('Saved V2 native project; checked ' + report.boxes.length + ' text layers.');
}

export async function render() {
  directories();
  const ec = file('projects/' + projectStem + '.ecproj');
  const fc = file('projects/' + projectStem + '.fcproj');
  const master = file('media/picture-master.mp4');
  const music = file('media/normalized.wav');
  if (!fs.existsSync(ec)) throw Error('Run prepare first.');
  if (!fs.existsSync(music) || !fs.statSync(music).size) throw Error('V2 audio missing: ' + music);
  await run(EC, ['render', '--project', nativePath(ec), '--comp', compName, '--out', nativePath(master),
    '--format', 'h264', '--bitrate', '16000', '--audio', 'off', '--progress', '--json'], 'qa/effectcraft-render.json');
  const commands = [
    {id:'file.newProject', params:{name:'Osayu / bingo revision 02'}},
    {id:'file.newSequence', params:{name:compName, width:1080, height:1920, fps, sampleRate:48000, video:1, audio:1}},
    {id:'file.import', params:{paths:[nativePath(master), nativePath(music)]}}
  ];
  const init = call(FC, ['--save-as', nativePath(fc), 'run', '-'], 'qa/filmcraft-build.json', commands.map(v => JSON.stringify(v)).join('\n') + '\n');
  let items;
  for (const line of init.split(/\r?\n/).filter(line => line.trim())) {
    const result = parse(line), value = result.result || result;
    if (value.items) items = value.items;
  }
  if (items?.length !== 2) throw Error('Imported native IDs unavailable.');
  const ticks = duration * 254016000000;
  const clips = [
    {id:'timeline.place', params:{item:items[0], track:'V1', seconds:0, duration:ticks, video:true, audio:false}},
    {id:'timeline.place', params:{item:items[1], track:'A1', seconds:0, duration:ticks, video:false, audio:true}}
  ];
  call(FC, ['--project', nativePath(fc), '--save', 'run', '-'], 'qa/filmcraft-timeline.json', clips.map(v => JSON.stringify(v)).join('\n') + '\n');
  const output = file('videos/' + videoName);
  const exported = await run(FC, ['--project', nativePath(fc), 'exec', 'file.exportMedia', JSON.stringify({
    path:nativePath(output), format:'h264', audio:true, audioCodec:'aac', bitrateMode:'crf', crf:18,
    hardwareEncoding:'off', gpuRendering:'off', wait:true
  })], 'qa/filmcraft-export.json');
  const result = parse(exported.stdout);
  if (result.offlineMedia?.length) throw Error('Offline media: ' + JSON.stringify(result.offlineMedia));
  save('qa/rendered.json', {sha256:hash(output), bytes:fs.statSync(output).size,
    projectHashes:{effectcraft:hash(ec), filmcraft:hash(fc)}, duration, fps, frames:duration*fps});
  console.log('Exported ' + output);
}

export async function previews() {
  directories();
  const times = checkedReviewTimes();
  for (const [index, time] of times.entries()) {
    const name = 'preview-' + String(index+1).padStart(2, '0') + '-' + time.toFixed(3).replace('.', '_');
    await run(EC, ['render-frame', '--project', nativePath(file('projects/' + projectStem + '.ecproj')),
      '--comp', compName, '--time', String(time), '--out', nativePath(file('qa/' + name + '.png')), '--json'], 'qa/' + name + '.json');
  }
  save('qa/preview-index.json', times.map((time,index) => ({time, file:'preview-' + String(index+1).padStart(2,'0') + '-' + time.toFixed(3).replace('.','_') + '.png'})));
}

function finalContactFrames() {
  const frames = [...new Set(checkedReviewTimes().map(time => Math.min(duration*fps-1, Math.round(time*fps))))];
  if (frames.length >= 15) return Array.from({length:15}, (_,i) => frames[Math.round(i*(frames.length-1)/14)]);
  return [0.2,1.1,2.1,3.1,4.1,5.2,6.8,8,9.6,11.4,13.3,15.6,17.8,19.5,21.4].map(time => Math.round(time*fps));
}
export async function verify() {
  directories();
  const output = file('videos/' + videoName);
  const probe = parse(call(FP, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', nativePath(output)], 'qa/probe-command.json'));
  save('qa/ffprobe.json', probe);
  const v = probe.streams.find(s => s.codec_type === 'video');
  const a = probe.streams.find(s => s.codec_type === 'audio');
  if (!v || v.width !== 1080 || v.height !== 1920 || v.r_frame_rate !== '30/1' || v.codec_name !== 'h264' ||
      Number(v.nb_read_frames) !== duration*fps || !a || a.codec_name !== 'aac' || Number(a.sample_rate) !== 48000 ||
      Math.abs(Number(probe.format.duration)-duration) > .1) throw Error('Invalid output media: ' + JSON.stringify(probe));
  await run(FF, ['-v', 'error', '-i', nativePath(output), '-f', 'null', '-'], 'qa/full-decode.json');
  const measured = await run(FF, ['-hide_banner', '-i', nativePath(output), '-af', 'ebur128=peak=true', '-f', 'null', '-'], 'qa/audio-ebur128.json');
  const integrated = [...measured.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1];
  const peak = [...measured.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1];
  const audioMeasurement = {integratedLufs:Number(integrated), truePeakDbfs:Number(peak)};
  save('qa/audio-measurement.json', audioMeasurement);
  if (!Number.isFinite(audioMeasurement.integratedLufs) || audioMeasurement.integratedLufs < -60 ||
      !Number.isFinite(audioMeasurement.truePeakDbfs) || audioMeasurement.truePeakDbfs > 0) throw Error('Silent, clipped, or unmeasurable output audio.');
  const frames = finalContactFrames();
  const select = frames.map(frame => 'eq(n,' + frame + ')').join('+');
  await run(FF, ['-v', 'error', '-y', '-i', nativePath(output), '-vf',
    "select='" + select + "',scale=324:576,tile=5x3:padding=8:margin=8:color=0x10131F",
    '-frames:v', '1', nativePath(file('qa/final-contact-sheet.png'))], 'qa/final-contact-sheet.json');
  save('qa/final-contact-sheet-timing.json', frames.map(frame => ({frame, seconds:frame/fps})));
  await run(FF, ['-v', 'error', '-y', '-ss', '1.1', '-i', nativePath(output), '-frames:v', '1', nativePath(file('cover.png'))], 'qa/cover.json');
  const ec = nativePath(file('projects/' + projectStem + '.ecproj'));
  const fc = nativePath(file('projects/' + projectStem + '.fcproj'));
  const reopenedEffect = parse(call(EC, ['--project', ec, 'info', '--json'], 'qa/effectcraft-reopen.json'));
  const reopenedFilm = parse(call(FC, ['--project', fc, 'inspect'], 'qa/filmcraft-reopen.json'));
  await run(EC, ['--project', ec, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(file('qa/reopened-effectcraft.png')), '--json'], 'qa/effectcraft-reopened-render.json');
  await run(FC, ['--project', fc, 'render', '--seconds', '1.1', '--out', nativePath(file('qa/reopened-filmcraft.png'))], 'qa/filmcraft-reopened-render.json');
  save('qa/technical.json', {status:'TECHNICAL_PASS', visualReview:'PENDING', listening:'PENDING', fullDecode:true,
    effectcraftReopened:!!reopenedEffect, filmcraftReopened:!!reopenedFilm, nativeReopenRender:true,
    duration, fps, frames:Number(v.nb_read_frames), width:v.width, height:v.height, audioMeasurement,
    coverTime:1.1, contactSheet:'5x3', sha256:hash(output)});
  console.log('Technical checks passed: 660 frames, full decode, audio, and both native reopen renders.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === 'prepare') prepare();
  else if (mode === 'previews') await previews();
  else if (mode === 'render') await render();
  else if (mode === 'verify') await verify();
  else console.log('node produce.mjs prepare|previews|render|verify');
}
