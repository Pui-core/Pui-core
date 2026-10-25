/** Private delivery only. Character images/renders must never be shown to AI. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans, root as defaultRoot, destination as defaultDestination, loadEdit} from './config.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const backgroundName = 'bingo-paper-background.png';
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
function archiveLayers(data) {
  const layers = Object.values(data.items || {}).filter(item => item.kind?.type === 'Comp').flatMap(item => item.kind.layers || []);
  const found = layers.filter(layer => layer.name.startsWith('ARCHIVE SHOT '));
  if (!found.length) throw Error('Expected native archive layers.');
  return found;
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
function background(mediaRoot) {
  const file = path.join(mediaRoot, 'media/background-manifest.json'), manifest = parse(file);
  if (manifest.file !== backgroundName || manifest.containsCharacter !== false || !/^[a-f0-9]{64}$/.test(manifest.sha256 || '')) throw Error('Current character-free background manifest is required.');
  if (hash(path.join(mediaRoot, 'media', backgroundName)) !== manifest.sha256) throw Error('Paper background differs from its manifest.');
  return {backgroundFile:backgroundName, backgroundSha256:manifest.sha256, backgroundManifestSha256:hash(file)};
}
function wholeStructure(data) {
  const layers = Object.values(data.items || {}).filter(item => item.kind?.type === 'Comp').flatMap(item => item.kind.layers || []);
  const cameras = layers.filter(layer => layer.name === 'WHOLE FRAME CAMERA');
  if (cameras.length !== 1 || cameras[0].parent !== null || layers.some(layer => layer.id !== cameras[0].id && layer.parent !== cameras[0].id)) throw Error('Every visual layer must share the whole-frame camera parent.');
  return {camera:trackedLayers(data, ['WHOLE FRAME CAMERA']), parentEdges:layers.map(layer => ({id:layer.id, name:layer.name, parent:layer.parent}))};
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export function packageDelivery({root = defaultRoot, destination = defaultDestination} = {}) {
  root = path.resolve(root); destination = path.resolve(destination);
  const fromCanonical = canonical(root), toCanonical = canonical(destination);
  if (within(toCanonical, fromCanonical) || within(fromCanonical, toCanonical)) throw Error('Delivery and working root must be separate.');
  const allowedParent = canonical('/mnt/f/Users/pui/Documents/gara');
  if (toCanonical === allowedParent || !within(toCanonical, allowedParent)) throw Error('Delivery must be a new child folder under the gara media directory.');
  if (/^bingo-1124(?:-v\d+)?$/.test(path.basename(destination))) throw Error('Historical deliveries must be preserved.');
  if (['bingo-thankyou-3plans-20261025', 'bingo-thankyou-tracking-v2-20261025', 'bingo-thankyou-wholeframe-v3-20261025'].includes(path.basename(destination))) throw Error('Historical thank-you deliveries must be preserved.');
  if (plans.length !== 3 || new Set(plans.map(plan => plan.id)).size !== 3) throw Error('Expected three distinct plans.');
  const edit = loadEdit(root), editSha256 = hash(path.join(root, 'edit-manifest.json'));
  const sharedMedia = [backgroundName, 'background-manifest.json', 'voice-mix.wav'];
  for (const name of sharedMedia) if (!fs.existsSync(path.join(root, 'media', name))) throw Error('Missing shared media: ' + name);
  const backgroundEvidence = background(root);
  const whole = parse(path.join(root, 'qa/audit.json'));
  const visual = parse(path.join(root, 'qa/visual-review.json'));
  if (whole.status !== 'PASS_NATIVE_ARCHIVE_JET' || !Array.isArray(whole.plans) || visual.status !== 'PASS_TEXT_ONLY_VISUAL') throw Error('Current native archive and isolated visual evidence are required.');
  if (whole.backgroundSha256 !== backgroundEvidence.backgroundSha256 || whole.backgroundManifestSha256 !== backgroundEvidence.backgroundManifestSha256) throw Error('Whole-frame background evidence is stale.');
  if (whole.editManifestSha256 !== editSha256 || whole.clips?.length !== edit.shots.filter(s=>s.kind==='archive').length) throw Error('Archive edit evidence is stale.');
  for (const shot of edit.shots.filter(s=>s.kind==='archive')) {
    const sealed=whole.clips.find(c=>c.id===shot.id);
    if (!sealed || sealed.file !== 'media/clips/'+shot.id+'.mp4' || hash(path.join(root,sealed.file)) !== sealed.sha256) throw Error('Archive clip changed: '+shot.id);
  }
  for (const plan of plans) {
    const a = whole.plans.find(item => item.plan === plan.id), v = visual.plans.find(item => item.id === plan.id);
    const main = hash(path.join(root, plan.id, 'projects', plan.id + '.ecproj'));
    const text = hash(path.join(root, plan.id, 'projects', plan.id + '-text-only.ecproj'));
    if (!a?.passed || a.mainProjectSha256 !== main || a.textOnlyProjectSha256 !== text || a.editManifestSha256 !== editSha256 || a.backgroundSha256 !== backgroundEvidence.backgroundSha256 || a.backgroundManifestSha256 !== backgroundEvidence.backgroundManifestSha256
      || a.layoutSha256 !== hash(path.join(root, plan.id, 'qa/layout.json')) || a.textOnlyLayoutSha256 !== hash(path.join(root, plan.id, 'qa/text-only-layout.json'))
      || v?.status !== 'PASS_TEXT_ONLY_VISUAL' || v.projectSha256 !== main || v.textOnlyProjectSha256 !== text || !Array.isArray(v.mandatoryFindings) || v.mandatoryFindings.length)
      throw Error('Whole-frame or visual evidence is stale or incomplete: ' + plan.id);
  }

  // The pipeline seals technical output hashes. Do not convert missing QA into PASS.
  const evidence = plans.map(plan => {
    const report = parse(path.join(root, plan.id, 'qa/validation.json'));
    if (report.id !== plan.id || report.technicalPassed !== true || report.nativeReopenAndRender !== true) throw Error('Final technical verification is required: ' + plan.id);
    if (report.outputs?.length !== 2) throw Error('Expected two verified output movies: ' + plan.id);
    for (const suffix of ['reference','voice-only']) {
      const expected=path.join(root,plan.id,'videos',plan.id+'-'+suffix+'.mp4');
      const sealed=report.outputs.find(o=>path.resolve(root,o.file)===expected);
      if(!sealed||sealed.audioStreams!==1||sealed.containsAddedBgm!==(suffix==='reference'))throw Error('Verified voice/reference output is missing or mislabeled: '+plan.id);
    }
    for (const output of report.outputs) {
      const file = path.resolve(root, output.file);
      if (!within(file, path.join(root, plan.id, 'videos')) || hash(file) !== output.sha256) throw Error('Output changed since verification: ' + file);
    }
    const originalProject = path.join(root, plan.id, 'projects', plan.id + '.ecproj');
    if (report.renderInputProjectSha256 !== hash(originalProject)) throw Error('Rendered movie input is stale: ' + plan.id);
    if (report.renderInputAssets?.backgroundSha256 !== backgroundEvidence.backgroundSha256 || report.renderInputAssets?.backgroundManifestSha256 !== backgroundEvidence.backgroundManifestSha256
      || report.renderInputAssets?.editManifestSha256 !== editSha256 || report.renderInputAssets?.voiceSha256 !== hash(path.join(root,plan.id,'media/voice.wav'))
      || report.renderInputAssets?.musicSha256 !== hash(path.join(root,plan.id,'media/music.wav'))) throw Error('Rendered inputs are stale: ' + plan.id);
    for (const c of whole.clips) if (!report.renderInputAssets.clips?.some(s=>s.id===c.id&&s.sha256===c.sha256)) throw Error('Rendered clip input seal missing: '+c.id);
    const wholeReport = whole.plans.find(item => item.plan === plan.id);
    return {plan, report, archive:archiveLayers(parse(originalProject)), wholeReport,
      mainWhole:wholeStructure(parse(originalProject)), textWhole:wholeStructure(parse(path.join(root, plan.id, 'projects', plan.id+'-text-only.ecproj')))};
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
  copy(path.join(root,'edit-manifest.json'),path.join(editable,'edit-manifest.json'));
  for (const s of edit.shots.filter(s=>s.kind==='archive')) copy(path.join(root,'media/clips',s.id+'.mp4'),path.join(editable,'media/clips',s.id+'.mp4'));
  for (const v of edit.voice) copy(path.join(root,'media/voice',v.id+'.wav'),path.join(editable,'media/voice',v.id+'.wav'));
  // Preserve small provenance records, not the full archive or aligned analysis WAV.
  for (const name of ['audio-timebase.json','archive-probe.json','ASR-REPORT.md','clip-candidates-final.json','clip-candidates-core-medium.json','selections.json','aligned-audio-crosscheck.json']) {
    const file=path.join(root,'research',name);
    if(fs.existsSync(file))copy(file,path.join(editable,'local-provenance',name));
  }
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
  const sourceNames = ['config.mjs', 'build-edit.mjs', 'motion.mjs', 'pipeline.mjs', 'audit.mjs', 'package.mjs', 'README.md', '音源後付けガイド.md'];
  for (const name of sourceNames) copy(path.join(source, name), path.join(editable, 'source', name));
  for (const name of ['validation.json', 'asset-policy.md']) {
    if (fs.existsSync(path.join(source, name))) copy(path.join(source, name), path.join(editable, 'source', name));
  }
  if (fs.existsSync(path.join(root, 'qa'))) copyTree(path.join(root, 'qa'), path.join(editable, 'qa'));
  if (!fs.existsSync(path.join(editable,'qa/extraction.json'))) throw Error('Portable extraction provenance is required.');
  if (fs.existsSync(path.join(source,'背景生成プロンプト.md'))) copy(path.join(source,'背景生成プロンプト.md'),path.join(editable,'source/背景生成プロンプト.md'));
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
    const references = strings(data).filter(value => /\.(?:png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr|avif|heic|mp4|m4v|mov|mkv|webm|avi|mpeg|mpg|mxf|wav|mp3|m4a|flac|ogg|aac)(?:$|[?#])/i.test(value));
    const allowed = new Set([backgroundName, native(path.join(editable, 'media', backgroundName))]);
    if (!references.length || references.some(value => !allowed.has(value))) throw Error('Character-free delivery project contains an unexpected image path.');
    const deliveredBackground = background(editable);
    return {...deliveredBackground, containsCharacter:false, aiViewingAllowed:true, projectSha256:hash(project), rasterReferences:references};
  }
  const summaries = [];
  try {
    for (const {plan, report, archive, wholeReport, mainWhole, textWhole} of evidence) {
      const work = path.join(root, plan.id), delivered = path.join(editable, plan.id);
      for (const name of ['projects', 'source', 'qa']) copyTree(path.join(work, name), path.join(delivered, name));
      for (const name of ['picture-master.mp4', 'voice.wav', 'music.wav']) copy(path.join(work, 'media', name), path.join(delivered, 'media', name));
      const movieDigests = [];
      for (const suffix of ['reference', 'voice-only']) {
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
      const before = archiveLayers(parse(ec));
      if (JSON.stringify(before) !== JSON.stringify(archive)) throw Error('Relinking changed the archive layer properties: ' + plan.id);
      assertTextOnly(text);
      execute(EC, ['--project', native(ec), '--save', 'info', '--json']);
      execute(EC, ['--project', native(text), '--save', 'info', '--json']);
      execute(FC, ['--project', native(fc), '--save', 'inspect']);
      if (JSON.stringify(archiveLayers(parse(ec))) !== JSON.stringify(archive)) throw Error('Native resave changed the archive layer properties: ' + plan.id);
      if (JSON.stringify(wholeStructure(parse(ec))) !== JSON.stringify(mainWhole)
        || JSON.stringify(wholeStructure(parse(text))) !== JSON.stringify(textWhole)) throw Error('Native delivery relink/resave changed whole-frame camera keys or parent structure: ' + plan.id);
      const firstClip = edit.shots.find(s=>s.kind==='archive');
      const sample = (firstClip.start+firstClip.end)/2;
      const localOnly = path.join(delivered, 'qa/local-only');
      fs.mkdirSync(localOnly, {recursive:true});
      execute(EC, ['render-frame', '--project', native(ec), '--comp', `Osayu Archive ${plan.id}`, '--time', String(sample), '--out', native(path.join(localOnly, 'delivery-ec.png')), '--json']);
      execute(FC, ['--project', native(fc), 'render', '--seconds', String(sample), '--out', native(path.join(localOnly, 'delivery-fc.png'))]);
      execute(EC, ['render-frame', '--project', native(text), '--comp', `Osayu Archive ${plan.id}`, '--time', String(sample), '--out', native(path.join(delivered, 'qa/text-only-delivery.png')), '--json']);
      const isolation = assertTextOnly(text);
      for (const movie of movieDigests) if (hash(path.join(destination, movie.file)) !== movie.sha256) throw Error('Movie changed during native reopen: ' + movie.file);
      summaries.push({id:plan.id, title:plan.title, movies:movieDigests, nativeReopenSaveAndRender:true, archiveLayerPropertiesUnchanged:true,
        wholeFrameKeysAndParentsUnchanged:true, wholeFrameSourceEvidence:wholeReport, characterFreeDelivery:isolation, technicalSourceEvidence:report});
    }
    for (const name of sharedMedia) if (hash(path.join(root, 'media', name)) !== hash(path.join(editable, 'media', name))) throw Error('Shared media changed during native resave: ' + name);
  } catch (error) {
    fs.mkdirSync(path.join(editable, 'qa'), {recursive:true});
    fs.writeFileSync(path.join(editable, 'qa/package-failed.json'), JSON.stringify({error:error.message, receipts}, null, 2) + '\n');
    throw error;
  }
  const descriptions = {
    'a-baibai':'ビンゴ盤面から達成マスへ、実際の配信リアクションを短くつなぎ、声とパン・ズームで達成を盛り上げます。',
    'b-patissier':'配信の感謝を残しながら、紙ふぶき・数字・切り抜きをテンポよく切り替えます。',
    'c-disco':'淡いビンゴ配色で配信の瞬間をつなぐ、強いジェットカットと全画面の動き。'
  };
  const cards = plans.map((plan, index) => `<article><div class="eyebrow">PLAN ${String(index + 1).padStart(2, '0')}</div><h2>${escape(plan.title)}</h2><p class="song">${escape(plan.song)}</p><video controls playsinline preload="metadata" src="${encodeURI(plan.id + '-reference.mp4')}"></video><p>${escape(descriptions[plan.id] || plan.description)}</p><div class="links"><a href="${encodeURI(plan.id + '-reference.mp4')}">曲入り確認版</a><a href="${encodeURI(plan.id + '-voice-only.mp4')}">配信音声版・追加BGMなし</a></div></article>`).join('\n');
  fs.writeFileSync(path.join(destination, 'index.html'), `<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>おさゆ｜配信切り抜き V4・3案比較</title>
<style>body{margin:0;background:#0c1020;color:#f7fbff;font:16px/1.75 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:48px 24px 64px}h1{line-height:1.35;font-size:clamp(26px,4vw,44px);margin:8px 0 18px}.intro{color:#bdd2d8;max-width:780px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:36px}article{border:1px solid #355061;background:#131b2d;border-radius:20px;padding:22px}.eyebrow{color:#a8f3e0;letter-spacing:.2em;font-size:12px}h2{font-size:23px;line-height:1.4;margin:8px 0}.song{color:#ff95d2;font-size:14px;min-height:48px}video{display:block;width:100%;aspect-ratio:9/16;background:#060b13;border-radius:12px}.links{display:flex;gap:12px;flex-wrap:wrap}a{color:#a8f3e0;text-underline-offset:4px}footer{margin-top:36px;color:#98afb8;font-size:14px}@media(max-width:900px){.grid{grid-template-columns:1fr}article{max-width:440px;margin:auto}.song{min-height:0}}</style>
<main><div class="eyebrow">OSAYU / THANK YOU / ARCHIVE JET V4</div><h1>初ビンゴ、全マス達成！<br>配信切り抜き V4・3案</h1><p class="intro">9:16。配信の切り抜きと実際の感謝の声を使い、画面全体のパン・ズーム・回転と速いカットで達成を振り返ります。配信音声版は追加曲なし、曲入り確認版は配信音声と選定試聴曲を含みます。</p><div class="grid">${cards}</div><footer>曲入りは今回のプレビュー用です。投稿時は配信音声版にTikTok内の音源を追加し、元の音声が聞こえる音量へ調整してください。<a href="${encodeURI('音源後付けガイド.md')}">音源ガイド</a> ／ <a href="${encodeURI('制作方針と投稿文.md')}">構成・投稿文</a><br>元配信のBGMやギフトSEは残る場合があります。純粋なボーカル分離音源ではありません。TikTok実機での同期と創作上の採用判断は別途確認となります。</footer></main></html>\n`);
  const report = {status:'PASS_PORTABLE_NATIVE_PACKAGE', version:'archive-jet-v4', background:backgroundEvidence, destination:native(destination), nativeProjects:plans.length*3, plans:summaries, copiedBeforeRelink:copied, relinked, receipts,
    aiImagePolicy:'Archive videos and character-containing frames stay local; AI previews import only the approved background and gray placeholders.',
    humanRealtimeReview:false, tiktokDeviceReview:false, ownerCreativeApproval:false};
  fs.mkdirSync(path.join(editable, 'qa'), {recursive:true});
  fs.writeFileSync(path.join(editable, 'qa/package.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({destination:report.destination, nativeProjects:report.nativeProjects, nativeReopenSaveAndRender:true, movieCount:summaries.reduce((sum, plan) => sum + plan.movies.length, 0)}));
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) packageDelivery({destination:process.argv[2] || defaultDestination});
