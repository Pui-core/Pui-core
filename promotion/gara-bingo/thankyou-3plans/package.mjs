/** Private delivery only. Character images/renders must never be shown to AI. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans} from './motion.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = '/home/pui/Videos/Osayu-Bingo/2026-10-25/thankyou-tracking-v2';
const defaultDestination = '/mnt/f/Users/pui/Documents/gara/bingo-thankyou-tracking-v2-20261025';
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const stageHash = '248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6';
const originalHash = '89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2';
function hash(p) {
  const digest = crypto.createHash('sha256'), buffer = Buffer.allocUnsafe(1024*1024);
  const fd = fs.openSync(p, 'r');
  try {
    let bytes;
    while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) digest.update(buffer.subarray(0, bytes));
  } finally { fs.closeSync(fd); }
  return digest.digest('hex');
}
const parse = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const within = (p, dir) => p === dir || p.startsWith(dir + path.sep);
function canonical(p) {
  if (fs.existsSync(p)) return fs.realpathSync(p);
  const parent = path.dirname(p);
  return parent === p ? p : path.join(canonical(parent), path.basename(p));
}
function native(p) {
  const result = spawnSync('wslpath', ['-w', path.resolve(p)], {encoding:'utf8'});
  if (result.error || result.status !== 0 || !result.stdout?.trim()) throw Error('wslpath failed: ' + p);
  return result.stdout.trim();
}
function strings(value, result = []) {
  if (typeof value === 'string') result.push(value);
  else if (Array.isArray(value)) value.forEach(child => strings(child, result));
  else if (value && typeof value === 'object') Object.values(value).forEach(child => strings(child, result));
  return result;
}
function fixedLayer(data) {
  const layers = Object.values(data.items || {}).filter(item => item.kind?.type === 'Comp').flatMap(item => item.kind.layers || []);
  const found = layers.filter(layer => layer.name === 'CHARACTER ORIGINAL FIXED');
  if (found.length !== 1) throw Error('Expected one fixed character layer.');
  return found[0];
}
function trackedLayers(data, names) {
  const layers = Object.values(data.items || {}).filter(item => item.kind?.type === 'Comp').flatMap(item => item.kind.layers || []);
  return names.map(name => {
    const found = layers.filter(layer => layer.name === name);
    if (found.length !== 1) throw Error('Expected one tracking rig: ' + name);
    const layer = found[0];
    return {id:layer.id, name:layer.name, parent:layer.parent, props:layer.props};
  });
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export function packageDelivery({root = process.env.OSAYU_THANKYOU_ROOT || defaultRoot, destination = defaultDestination} = {}) {
  root = path.resolve(root); destination = path.resolve(destination);
  const fromCanonical = canonical(root), toCanonical = canonical(destination);
  if (within(toCanonical, fromCanonical) || within(fromCanonical, toCanonical)) throw Error('Delivery and working root must be separate.');
  const allowedParent = canonical('/mnt/f/Users/pui/Documents/gara');
  if (toCanonical === allowedParent || !within(toCanonical, allowedParent)) throw Error('Delivery must be a new child folder under the gara media directory.');
  if (/^bingo-1124(?:-v\d+)?$/.test(path.basename(destination))) throw Error('Historical deliveries must be preserved.');
  if (path.basename(destination) === 'bingo-thankyou-3plans-20261025') throw Error('The original thank-you delivery must be preserved.');
  if (plans.length !== 3 || new Set(plans.map(plan => plan.id)).size !== 3) throw Error('Expected three distinct plans.');
  const sharedMedia = ['character-original.jpg', 'character-cutout.png', 'stage-background.png'];
  for (const name of sharedMedia) if (!fs.existsSync(path.join(root, 'media', name))) throw Error('Missing shared media: ' + name);
  if (hash(path.join(root, 'media/character-original.jpg')) !== originalHash || hash(path.join(root, 'media/stage-background.png')) !== stageHash) throw Error('Original or approved stage digest mismatch.');
  const artwork = parse(path.join(root, 'qa/fixed-character-audit.json'));
  const visual = parse(path.join(root, 'qa/visual-review.json'));
  const tracking = parse(path.join(root, 'qa/tracking-audit.json'));
  if (artwork.status !== 'PASS_STRUCTURE_SHA_NATIVE_OPAQUE_CORE' || visual.status !== 'PASS_TEXT_ONLY_VISUAL') throw Error('Current native character and isolated visual evidence are required.');
  if (tracking.status !== 'PASS_NATIVE_TRACKING_READBACK' || !Array.isArray(tracking.plans)) throw Error('Current native tracking readback is required.');
  for (const plan of plans) {
    const a = artwork.plans.find(item => item.plan === plan.id), v = visual.plans.find(item => item.id === plan.id);
    const main = hash(path.join(root, plan.id, 'projects', plan.id + '.ecproj'));
    const text = hash(path.join(root, plan.id, 'projects', plan.id + '-text-only.ecproj'));
    if (!a?.nativeOpaqueCore?.passed || a.mainProjectSha256 !== main || a.textOnlyProjectSha256 !== text || v?.projectSha256 !== main || v?.textOnlyProjectSha256 !== text) throw Error('Native or visual evidence is stale: ' + plan.id);
    const t = tracking.plans.find(item => item.plan === plan.id);
    if (!t?.passed || !t.rows?.length || t.mainProjectSha256 !== main || t.projectSha256 !== text
      || t.layoutSha256 !== hash(path.join(root, plan.id, 'qa/layout.json')) || t.textOnlyLayoutSha256 !== hash(path.join(root, plan.id, 'qa/text-only-layout.json')))
      throw Error('Tracking readback evidence is stale or incomplete: ' + plan.id);
  }

  // The pipeline seals technical output hashes. Do not convert missing QA into PASS.
  const evidence = plans.map(plan => {
    const report = parse(path.join(root, plan.id, 'qa/validation.json'));
    if (report.id !== plan.id || report.technicalPassed !== true || report.fixedCharacterPassed !== true || report.nativeReopenAndRender !== true) throw Error('Final technical verification is required: ' + plan.id);
    if (report.outputs?.length !== 2) throw Error('Expected two verified output movies: ' + plan.id);
    for (const output of report.outputs) {
      const file = path.resolve(root, output.file);
      if (!within(file, path.join(root, plan.id, 'videos')) || hash(file) !== output.sha256) throw Error('Output changed since verification: ' + file);
    }
    const originalProject = path.join(root, plan.id, 'projects', plan.id + '.ecproj');
    const trackingReport = tracking.plans.find(item => item.plan === plan.id);
    const rigNames = [...new Set(trackingReport.rows.map(row => row.rigName))];
    if (rigNames.some(name => typeof name !== 'string' || !name.trim())) throw Error('Tracking rig names are missing: ' + plan.id);
    return {plan, report, fixed:fixedLayer(parse(originalProject)), trackingReport, rigNames,
      mainRigs:trackedLayers(parse(originalProject), rigNames), textRigs:trackedLayers(parse(path.join(root, plan.id, 'projects', plan.id+'-text-only.ecproj')), rigNames)};
  });

  const editable = path.join(destination, 'editable');
  const copied = [], receipts = [], relinked = [];
  const checkpoint = path.join(destination, 'checkpoints', new Date().toISOString().replace(/[:.]/g, '-'));
  function copy(from, to) {
    if (!fs.existsSync(from) || !fs.statSync(from).isFile()) throw Error('Required delivery file missing: ' + from);
    fs.mkdirSync(path.dirname(to), {recursive:true});
    if (fs.existsSync(to) && hash(to) !== hash(from)) {
      const backup = path.join(checkpoint, path.relative(destination, to));
      fs.mkdirSync(path.dirname(backup), {recursive:true});
      fs.copyFileSync(to, backup);
    }
    fs.copyFileSync(from, to);
    const digest = hash(from);
    if (hash(to) !== digest) throw Error('Copy SHA mismatch: ' + to);
    copied.push({file:path.relative(destination, to), bytes:fs.statSync(to).size, sha256:digest});
  }
  function copyTree(from, to) {
    if (!fs.existsSync(from)) throw Error('Required delivery directory missing: ' + from);
    for (const entry of fs.readdirSync(from, {withFileTypes:true})) {
      const a = path.join(from, entry.name), b = path.join(to, entry.name);
      if (entry.isDirectory()) copyTree(a, b);
      else if (entry.isFile()) copy(a, b);
      else throw Error('Symlinks are not copied into delivery: ' + a);
    }
  }
  function execute(exe, args) {
    const result = spawnSync(exe, args, {encoding:'utf8', timeout:180000, maxBuffer:32*1024*1024});
    const receipt = {exe, args, exit:result.status, error:result.error?.message, stdout:result.stdout?.replace(/^\uFEFF/, ''), stderr:result.stderr};
    receipts.push(receipt);
    if (result.error || result.status !== 0) throw Error(JSON.stringify(receipt).slice(-5000));
    return receipt.stdout;
  }
  fs.mkdirSync(editable, {recursive:true});
  for (const name of sharedMedia) copy(path.join(root, 'media', name), path.join(editable, 'media', name));
  // Only the actual trial recordings and provenance are useful in the portable
  // edit. Large analysis buffers/search results stay in the working directory.
  const audioNames = new Set(plans.map(plan => plan.audioFile));
  for (const name of ['audio-edit-manifest.json', 'AUDIO-REPORT.md']) {
    if (fs.existsSync(path.join(root, 'audio-preview', name))) audioNames.add(name);
  }
  for (const name of audioNames) {
    if (typeof name !== 'string' || path.basename(name) !== name) throw Error('Audio basename required.');
    copy(path.join(root, 'audio-preview', name), path.join(editable, 'audio-preview', name));
  }
  const sourceNames = ['motion.mjs', 'pipeline.mjs', 'audit.mjs', 'tracking-audit.mjs', 'package.mjs', 'README.md', '音源後付けガイド.md'];
  for (const name of sourceNames) copy(path.join(source, name), path.join(editable, 'source', name));
  for (const name of ['validation.json', 'asset-policy.md']) {
    if (fs.existsSync(path.join(source, name))) copy(path.join(source, name), path.join(editable, 'source', name));
  }
  if (fs.existsSync(path.join(root, 'qa'))) copyTree(path.join(root, 'qa'), path.join(editable, 'qa'));
  copy(path.join(source, 'README.md'), path.join(destination, '制作方針と投稿文.md'));
  copy(path.join(source, '音源後付けガイド.md'), path.join(destination, '音源後付けガイド.md'));
  const prefixes = [[native(root), native(editable)], [root, editable]];
  function relocate(value) {
    if (typeof value === 'string') {
      for (const [from, to] of prefixes) if (value === from || value.startsWith(from + '/') || value.startsWith(from + '\\')) return to + value.slice(from.length);
      return value;
    }
    if (Array.isArray(value)) return value.map(relocate);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, relocate(child)]));
    return value;
  }
  function assertTextOnly(project) {
    const data = parse(project);
    const references = strings(data).filter(value => /\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:$|[?#])/i.test(value));
    const allowed = new Set(['stage-background.png', native(path.join(editable, 'media/stage-background.png'))]);
    if (!references.length || references.some(value => !allowed.has(value))) throw Error('Character-free delivery project contains an unexpected image path.');
    if (hash(path.join(editable, 'media/stage-background.png')) !== stageHash) throw Error('Delivered approved stage changed.');
    return {containsCharacter:false, aiViewingAllowed:true, projectSha256:hash(project), rasterReferences:references, stageSha256:stageHash};
  }
  const summaries = [];
  try {
    for (const {plan, report, fixed, trackingReport, rigNames, mainRigs, textRigs} of evidence) {
      const work = path.join(root, plan.id), delivered = path.join(editable, plan.id);
      for (const name of ['projects', 'source', 'qa']) copyTree(path.join(work, name), path.join(delivered, name));
      for (const name of ['picture-master.mp4', 'music-mix.wav']) copy(path.join(work, 'media', name), path.join(delivered, 'media', name));
      const movieDigests = [];
      for (const suffix of ['reference', 'tiktok-silent']) {
        const name = plan.id + '-' + suffix + '.mp4', from = path.join(work, 'videos', name), to = path.join(destination, name);
        copy(from, to); movieDigests.push({file:name, sha256:hash(to), bytes:fs.statSync(to).size});
      }
      const names = [plan.id + '.ecproj', plan.id + '-text-only.ecproj', plan.id + '.fcproj'];
      for (const name of names) {
        const project = path.join(delivered, 'projects', name);
        fs.writeFileSync(project, JSON.stringify(relocate(parse(project))) + '\n');
        const obsolete = strings(parse(project)).filter(value => prefixes.some(([from]) => value === from || value.startsWith(from + '/') || value.startsWith(from + '\\')));
        if (obsolete.length) throw Error('Native project still references working media: ' + name);
        relinked.push({file:path.relative(destination, project), sha256:hash(project)});
      }
      // Generated JSX keeps useful editable paths as well as the native project.
      for (const name of fs.readdirSync(path.join(delivered, 'source')).filter(name => /\.jsx$/.test(name))) {
        const file = path.join(delivered, 'source', name);
        let jsx = fs.readFileSync(file, 'utf8');
        for (const [from, to] of prefixes) jsx = jsx.replaceAll(JSON.stringify(from).slice(1, -1), JSON.stringify(to).slice(1, -1));
        fs.writeFileSync(file, jsx);
      }
      const ec = path.join(delivered, 'projects', names[0]), text = path.join(delivered, 'projects', names[1]), fc = path.join(delivered, 'projects', names[2]);
      const before = fixedLayer(parse(ec));
      if (JSON.stringify(before) !== JSON.stringify(fixed)) throw Error('Relinking changed the fixed character layer: ' + plan.id);
      assertTextOnly(text);
      execute(EC, ['--project', native(ec), '--save', 'info', '--json']);
      execute(EC, ['--project', native(text), '--save', 'info', '--json']);
      execute(FC, ['--project', native(fc), '--save', 'inspect']);
      if (JSON.stringify(fixedLayer(parse(ec))) !== JSON.stringify(fixed)) throw Error('Native resave changed the fixed character layer: ' + plan.id);
      if (JSON.stringify(trackedLayers(parse(ec), rigNames)) !== JSON.stringify(mainRigs)
        || JSON.stringify(trackedLayers(parse(text), rigNames)) !== JSON.stringify(textRigs)) throw Error('Native delivery relink/resave changed tracking rig keys: ' + plan.id);
      const sample = Math.min(plan.duration - .5, plan.climax + .3);
      const localOnly = path.join(delivered, 'qa/local-only');
      fs.mkdirSync(localOnly, {recursive:true});
      execute(EC, ['render-frame', '--project', native(ec), '--comp', `Osayu Thankyou ${plan.id}`, '--time', String(sample), '--out', native(path.join(localOnly, 'delivery-ec.png')), '--json']);
      execute(FC, ['--project', native(fc), 'render', '--seconds', String(sample), '--out', native(path.join(localOnly, 'delivery-fc.png'))]);
      execute(EC, ['render-frame', '--project', native(text), '--comp', `Osayu Thankyou ${plan.id}`, '--time', String(sample), '--out', native(path.join(delivered, 'qa/text-only-delivery.png')), '--json']);
      const isolation = assertTextOnly(text);
      for (const movie of movieDigests) if (hash(path.join(destination, movie.file)) !== movie.sha256) throw Error('Movie changed during native reopen: ' + movie.file);
      summaries.push({id:plan.id, title:plan.title, movies:movieDigests, nativeReopenSaveAndRender:true, fixedLayerUnchanged:true,
        trackingRigKeysUnchanged:true, trackingSourceEvidence:trackingReport, characterFreeDelivery:isolation, technicalSourceEvidence:report});
    }
    for (const name of sharedMedia) if (hash(path.join(root, 'media', name)) !== hash(path.join(editable, 'media', name))) throw Error('Shared media changed during native resave: ' + name);
  } catch (error) {
    fs.mkdirSync(path.join(editable, 'qa'), {recursive:true});
    fs.writeFileSync(path.join(editable, 'qa/package-failed.json'), JSON.stringify({error:error.message, receipts}, null, 2) + '\n');
    throw error;
  }
  const descriptions = {
    'a-baibai':'ミントの達成ラッシュ。盤面のマスとカウンターへ寄り、達成の流れを画面が追いかけます。',
    'b-patissier':'ピンクのご褒美演出。スタンプや達成マスを追い、弾む文字と寄り引きでありがとうを届けます。',
    'c-disco':'光るビンゴ盤面をリズムに合わせて追従。注目マスへの寄りから全体へ戻り、全マス達成をお祝い。'
  };
  const cards = plans.map((plan, index) => `<article><div class="eyebrow">PLAN ${String(index + 1).padStart(2, '0')}</div><h2>${escape(plan.title)}</h2><p class="song">${escape(plan.song)}</p><video controls playsinline preload="metadata" src="${encodeURI(plan.id + '-reference.mp4')}"></video><p>${escape(descriptions[plan.id] || plan.description)}</p><div class="links"><a href="${encodeURI(plan.id + '-reference.mp4')}">曲入り確認版</a><a href="${encodeURI(plan.id + '-tiktok-silent.mp4')}">TikTok用・無音版</a></div></article>`).join('\n');
  fs.writeFileSync(path.join(destination, 'index.html'), `<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>おさゆ｜画面追従 改訂版・3案比較</title>
<style>body{margin:0;background:#0c1020;color:#f7fbff;font:16px/1.75 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:48px 24px 64px}h1{line-height:1.35;font-size:clamp(26px,4vw,44px);margin:8px 0 18px}.intro{color:#bdd2d8;max-width:780px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:36px}article{border:1px solid #355061;background:#131b2d;border-radius:20px;padding:22px}.eyebrow{color:#a8f3e0;letter-spacing:.2em;font-size:12px}h2{font-size:23px;line-height:1.4;margin:8px 0}.song{color:#ff95d2;font-size:14px;min-height:48px}video{display:block;width:100%;aspect-ratio:9/16;background:#060b13;border-radius:12px}.links{display:flex;gap:12px;flex-wrap:wrap}a{color:#a8f3e0;text-underline-offset:4px}footer{margin-top:36px;color:#98afb8;font-size:14px}@media(max-width:900px){.grid{grid-template-columns:1fr}article{max-width:440px;margin:auto}.song{min-height:0}}</style>
<main><div class="eyebrow">OSAYU / THANK YOU / TRACKING V2</div><h1>初ビンゴ、全マス達成！<br>画面追従 改訂版・3案</h1><p class="intro">各25秒前後・9:16。達成マスや文字へ画面が寄って追いかけ、盤面全体へ戻る動きを3案とも追加しています。立ち絵は固定し、切り抜きと本人の声は入れていません。曲入り確認版で演出を比較できます。</p><div class="grid">${cards}</div><footer>曲入りは今回のプレビュー用です。投稿時は無音版にTikTok内の音源を追加してください。<a href="${encodeURI('音源後付けガイド.md')}">音源ガイド</a> ／ <a href="${encodeURI('制作方針と投稿文.md')}">構成・投稿文</a><br>本人声の追加、配信切り抜きへの差替え、TikTok実機での同期、創作上の採用判断は別途確認となります。</footer></main></html>\n`);
  const report = {status:'PASS_PORTABLE_NATIVE_PACKAGE', destination:native(destination), nativeProjects:plans.length*3, plans:summaries, copiedBeforeRelink:copied, relinked, receipts,
    aiImagePolicy:'Character-containing originals and renders stay local; only isolated text-only project renders may be displayed to AI.',
    humanRealtimeReview:false, tiktokDeviceReview:false, ownerCreativeApproval:false};
  fs.mkdirSync(path.join(editable, 'qa'), {recursive:true});
  fs.writeFileSync(path.join(editable, 'qa/package.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({destination:report.destination, nativeProjects:report.nativeProjects, nativeReopenSaveAndRender:true, movieCount:summaries.reduce((sum, plan) => sum + plan.movies.length, 0)}));
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) packageDelivery({destination:process.argv[2] || defaultDestination});
