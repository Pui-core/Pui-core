/** Audit the delivered MP4s and reopen their linked native projects.
 * Usage: node audit.mjs [1,11,...] (default: 1 through 100).
 * Evidence is technical QA; contact sheets still require visual review.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';

const root = path.resolve(process.env.PUI_PROMO_ROOT || '/home/pui/Videos/Pui-Promo/2026-10-24');
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const duration = 18, fps = 30, expectedFrames = duration * fps;
const summarizeOnly = process.argv[2] === '--summarize';
const ids = summarizeOnly ? [] : process.argv[2]
  ? [...new Set(process.argv[2].split(',').map(Number))]
  : Array.from({length: 100}, (_, n) => n + 1);
if ((!ids.length && !summarizeOnly) || ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
  throw Error('IDs must be positive integers separated by commas.');
}
const converted = spawnSync('wslpath', ['-w', root], {encoding: 'utf8'});
if (converted.status !== 0 || !converted.stdout.trim()) throw Error('wslpath could not resolve the output root.');
const nativeRoot = converted.stdout.trim();
const file = relative => path.join(root, relative);
const native = relative => path.win32.join(nativeRoot, ...relative.split('/'));
const json = (relative, value) => {
  fs.mkdirSync(path.dirname(file(relative)), {recursive: true});
  fs.writeFileSync(file(relative), JSON.stringify(value, null, 2) + '\n');
};
const readJson = relative => JSON.parse(fs.readFileSync(file(relative), 'utf8').replace(/^\uFEFF/, ''));
const parseJson = value => JSON.parse(value.replace(/^\uFEFF/, '').trim());
const rational = value => {
  const [a, b = '1'] = String(value).split('/').map(Number);
  return a / b;
};
const near = (actual, expected, tolerance = 0.0001) => Number.isFinite(Number(actual)) && Math.abs(Number(actual) - expected) <= tolerance;
const sha256 = async relative => {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file(relative))) hash.update(chunk);
  return hash.digest('hex');
};

function run(exe, args, receipt) {
  return new Promise(resolve => {
    const started = Date.now();
    let stdout = '', stderr = '', launchError;
    const child = spawn(exe, args, {stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000});
    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);
    child.on('error', error => launchError = error.message);
    child.on('close', (exit, signal) => {
      const result = {exe, args, exit, signal, elapsedSeconds: (Date.now() - started) / 1000,
        error: launchError, stdout: stdout.replace(/^\uFEFF/, ''), stderr};
      json(receipt, result);
      resolve(result);
    });
  });
}

function parseSignals(stderr) {
  const black = [...stderr.matchAll(/black_start:([\d.e+-]+)\s+black_end:([\d.e+-]+)\s+black_duration:([\d.e+-]+)/g)]
    .map(match => ({start: Number(match[1]), end: Number(match[2]), duration: Number(match[3])}));
  const silence = [];
  let pending;
  for (const line of stderr.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([\d.e+-]+)/);
    if (start) pending = Number(start[1]);
    const end = line.match(/silence_end:\s*([\d.e+-]+)\s*\|\s*silence_duration:\s*([\d.e+-]+)/);
    if (end) {
      silence.push({start: pending ?? Number(end[1]) - Number(end[2]), end: Number(end[1]), duration: Number(end[2])});
      pending = undefined;
    }
  }
  if (pending !== undefined) silence.push({start: pending, end: duration, duration: duration - pending});
  const loudnessJson = [...stderr.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)].at(-1)?.[0];
  return {black, silence, loudness: loudnessJson ? JSON.parse(loudnessJson) : null};
}

async function audit(id) {
  const label = String(id).padStart(3, '0'), base = `qa/${label}`;
  fs.mkdirSync(file(base), {recursive: true});
  const checks = [], assets = {};
  const check = (name, passed, evidence) => checks.push({name, passed: Boolean(passed), evidence});
  const output = `videos/${label}-pui.mp4`, ec = `projects/${label}.ecproj`, fc = `projects/${label}.fcproj`;
  const report = {id, auditedAt: new Date().toISOString(), expected: {width: 1080, height: 1920, fps, duration, frames: expectedFrames},
    checks, assets, visualReview: 'PENDING_VISUAL_REVIEW', realTimeListening: 'NOT_CLAIMED'};
  try {
    for (const relative of [output, ec, fc]) {
      const stat = fs.statSync(file(relative));
      if (!stat.isFile() || stat.size === 0) throw Error(`Missing or empty asset: ${relative}`);
      assets[relative] = {sha256: await sha256(relative), bytes: stat.size, mtimeMs: stat.mtimeMs};
    }

    const probeResult = await run(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', native(output)], `${base}/audit-probe.json`);
    check('ffprobe completed', probeResult.exit === 0 && !probeResult.error, {exit: probeResult.exit, error: probeResult.error});
    if (probeResult.exit === 0) {
      const probe = parseJson(probeResult.stdout), video = probe.streams?.find(stream => stream.codec_type === 'video'),
        audio = probe.streams?.find(stream => stream.codec_type === 'audio');
      report.media = {video, audio, format: probe.format};
      check('portrait dimensions', video?.width === 1080 && video?.height === 1920, {width: video?.width, height: video?.height});
      check('video format', video?.codec_name === 'h264' && video?.pix_fmt === 'yuv420p', {codec: video?.codec_name, pixelFormat: video?.pix_fmt});
      check('video frame count and rate', near(rational(video?.avg_frame_rate), fps) && Number(video?.nb_frames) === expectedFrames,
        {averageFrameRate: video?.avg_frame_rate, frames: video?.nb_frames});
      check('duration', near(probe.format?.duration, duration, .08) && near(video?.duration, duration, .08),
        {container: probe.format?.duration, video: video?.duration});
      check('stereo AAC 48 kHz', audio?.codec_name === 'aac' && Number(audio?.sample_rate) === 48000 && audio?.channels === 2,
        {codec: audio?.codec_name, sampleRate: audio?.sample_rate, channels: audio?.channels});
    }

    const filters = '[0:v:0]blackdetect=d=0.12:pix_th=0.06:pic_th=0.98[v];' +
      '[0:a:0]silencedetect=noise=-45dB:d=0.5,loudnorm=I=-17:TP=-1.5:LRA=12:print_format=json[a]';
    const decoded = await run(FF, ['-hide_banner', '-nostdin', '-v', 'info', '-xerror', '-i', native(output),
      '-filter_complex', filters, '-map', '[v]', '-map', '[a]', '-f', 'null', '-'], `${base}/audit-decode.json`);
    check('complete video/audio decode', decoded.exit === 0 && !decoded.error, {exit: decoded.exit, error: decoded.error});
    const decodedFrames = Number([...decoded.stderr.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]);
    check('decoded video frame count', decoded.exit === 0 && decodedFrames === expectedFrames, {decodedFrames, expectedFrames});
    const signals = parseSignals(decoded.stderr);
    report.signals = signals;
    check('black frames', decoded.exit === 0 && signals.black.every(event => event.duration <= .15),
      {thresholdSeconds: .15, pixelThreshold: .06, pictureThreshold: .98, events: signals.black});
    check('audio continuity', decoded.exit === 0 && signals.silence.every(event =>
      !(event.duration > .5 && event.end > .1 && event.start < duration - .1)),
      {noiseThresholdDb: -45, maximumInteriorSilenceSeconds: .5, events: signals.silence});
    const integrated = Number(signals.loudness?.input_i), peak = Number(signals.loudness?.input_tp);
    check('audio loudness and peak', signals.loudness && Number.isFinite(integrated) && integrated >= -20 && integrated <= -14 &&
      Number.isFinite(peak) && peak <= -1, {integratedLUFS: integrated, truePeakDbTP: peak, acceptedLUFS: [-20, -14], maximumTruePeakDbTP: -1});

    const ecInfoResult = await run(EC, ['--project', native(ec), 'info', '--json'], `${base}/audit-effectcraft-info.json`);
    check('EffectCraft reopened', ecInfoResult.exit === 0 && !ecInfoResult.error, {exit: ecInfoResult.exit});
    if (ecInfoResult.exit === 0) {
      const comp = parseJson(ecInfoResult.stdout).activeComp;
      check('EffectCraft composition contract', comp?.width === 1080 && comp?.height === 1920 && near(comp?.duration, duration) && near(comp?.frameRate, fps),
        {name: comp?.name, width: comp?.width, height: comp?.height, duration: comp?.duration, fps: comp?.frameRate, layerCount: comp?.layers?.length});
    }
    const ecMediaResult = await run(EC, ['--project', native(ec), 'run', 'footage.check', '{"wait":true}', 'footage.missing', '{}', '--json'], `${base}/audit-effectcraft-media.json`);
    if (ecMediaResult.exit === 0) {
      const results = parseJson(ecMediaResult.stdout), mediaCheck = results.find(result => result.command === 'footage.check')?.result,
        missing = results.find(result => result.command === 'footage.missing')?.result?.missing;
      check('EffectCraft linked media', mediaCheck?.missing === 0 && Array.isArray(missing) && missing.length === 0, {check: mediaCheck, missing});
    } else check('EffectCraft linked media', false, {exit: ecMediaResult.exit});

    const fcInfoResult = await run(FC, ['--project', native(fc), 'inspect', 'sequence'], `${base}/audit-filmcraft-sequence.json`);
    check('FilmCraft reopened', fcInfoResult.exit === 0 && !fcInfoResult.error, {exit: fcInfoResult.exit});
    if (fcInfoResult.exit === 0) {
      const sequence = parseJson(fcInfoResult.stdout), settings = sequence.settings;
      check('FilmCraft sequence contract', settings?.width === 1080 && settings?.height === 1920 &&
        near(settings?.frame_rate?.num / settings?.frame_rate?.den, fps) && Number(sequence.durationFrames) === expectedFrames &&
        near(sequence.duration / 254016000000, duration) && settings?.sample_rate === 48000,
      {name: sequence.name, width: settings?.width, height: settings?.height, fps: settings?.frame_rate,
        duration: sequence.duration / 254016000000, frames: sequence.durationFrames, sampleRate: settings?.sample_rate});
    }
    const fcMediaResult = await run(FC, ['--project', native(fc), 'exec', 'media.status'], `${base}/audit-filmcraft-media.json`);
    if (fcMediaResult.exit === 0) {
      const media = parseJson(fcMediaResult.stdout);
      check('FilmCraft linked media', Array.isArray(media) && media.length === 2 && media.every(item => item.status === 'online'), media);
    } else check('FilmCraft linked media', false, {exit: fcMediaResult.exit});

    const layout = readJson(`${base}/text-layout.json`);
    const invalidBoxes = layout.boxes?.filter(box => !Number.isFinite(box.width) || !Number.isFinite(box.height) || box.size < 18 ||
      box.x < 95 || box.x + box.width > 890 || box.y < 210 || box.y + box.height + (box.animated ? 26 : 0) > 1540);
    check('native measured text safe area', Array.isArray(layout.boxes) && layout.boxes.length > 0 && invalidBoxes.length === 0,
      {boxCount: layout.boxes?.length, minimumSize: 18, safeBounds: {left: 95, right: 890, top: 210, bottom: 1540}, invalidBoxes});

    const rendered = readJson(`${base}/rendered.json`);
    check('render receipt identities', rendered.sha256 === assets[output].sha256 && rendered.ecSha256 === assets[ec].sha256 && rendered.fcSha256 === assets[fc].sha256,
      {videoUnchanged: rendered.sha256 === assets[output].sha256, effectcraftUnchanged: rendered.ecSha256 === assets[ec].sha256,
        filmcraftUnchanged: rendered.fcSha256 === assets[fc].sha256});

    const contacts = "[0:v:0]split=2[cv][pv];[cv]select='eq(n,42)+eq(n,159)+eq(n,312)+eq(n,459)',scale=270:480,tile=4x1:nb_frames=4[contact];" +
      "[pv]select='eq(n,459)',scale=540:960[poster]";
    const contactResult = await run(FF, ['-hide_banner', '-nostdin', '-v', 'error', '-y', '-i', native(output), '-filter_complex', contacts,
      '-map', '[contact]', '-frames:v', '1', '-fps_mode', 'vfr', '-update', '1', native(`${base}/contact.png`),
      '-map', '[poster]', '-frames:v', '1', '-fps_mode', 'vfr', '-update', '1', native(`${base}/creator-poster.png`)], `${base}/audit-contact.json`);
    check('final MP4 visual review artifacts', contactResult.exit === 0 && fs.existsSync(file(`${base}/contact.png`)) && fs.existsSync(file(`${base}/creator-poster.png`)),
      {exit: contactResult.exit, contact: `${base}/contact.png`, creatorPoster: `${base}/creator-poster.png`,
        sampleSeconds: [1.4, 5.3, 10.4, 15.3], sampleFrames: [42, 159, 312, 459], contactSize: [1080, 480], creatorPosterSize: [540, 960]});
  } catch (error) {
    check('audit completed without exception', false, {message: error.message});
  }
  report.technicalStatus = checks.length > 0 && checks.every(item => item.passed) ? 'TECHNICAL_PASS' : 'TECHNICAL_FAIL';
  report.failedChecks = checks.filter(item => !item.passed).map(item => item.name);
  json(`${base}/audit.json`, report);
  console.log(JSON.stringify({id, status: report.technicalStatus, failedChecks: report.failedChecks}));
  return report;
}

const queue = [...ids], reports = [];
const jobs = Math.max(1, Math.min(3, Number(process.env.PUI_AUDIT_JOBS || 2) || 2));
await Promise.all(Array.from({length: jobs}, async () => {
  while (queue.length) reports.push(await audit(queue.shift()));
}));

const all = [], missing = [];
for (let id = 1; id <= 100; id++) {
  const relative = `qa/${String(id).padStart(3, '0')}/audit.json`;
  if (!fs.existsSync(file(relative))) { missing.push(id); continue; }
  const report = readJson(relative);
  const stale = Object.entries(report.assets || {}).some(([name, stored]) => {
    try { const current = fs.statSync(file(name)); return current.size !== stored.bytes || current.mtimeMs !== stored.mtimeMs; }
    catch { return true; }
  });
  all.push({id, technicalStatus: report.technicalStatus, stale, failedChecks: report.failedChecks, report: relative});
}
const failed = all.filter(report => report.technicalStatus !== 'TECHNICAL_PASS' || report.stale);
json(process.env.PUI_AUDIT_SUMMARY || 'qa/audit-summary.json', {auditedAt: new Date().toISOString(), root, requestedIds: ids, concurrency: jobs,
  expectedCount: 100, reports: all, missingIds: missing, failedIds: failed.map(report => report.id),
  technicalStatus: failed.length ? 'TECHNICAL_FAIL' : missing.length ? 'PARTIAL_TECHNICAL_PASS' : 'TECHNICAL_PASS',
  visualReview: 'PENDING_VISUAL_REVIEW', realTimeListening: 'NOT_CLAIMED',
  selectedResults: reports.map(report => ({id: report.id, technicalStatus: report.technicalStatus, failedChecks: report.failedChecks}))});
if (reports.some(report => report.technicalStatus !== 'TECHNICAL_PASS') || (summarizeOnly && (failed.length || missing.length))) process.exitCode = 1;
