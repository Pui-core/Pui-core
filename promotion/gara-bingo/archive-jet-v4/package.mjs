/** Private delivery only. Character images/renders must never be shown to AI. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans, version, playbackRate, root as defaultRoot, destination as defaultDestination, loadEdit} from './config.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const backgroundName = 'bingo-paper-background.png';
const stems={'a-baibai':'A案_倍倍FIGHT','b-patissier':'B案_キスミーパティシエ','c-disco':'C案_チョコレイトディスコ'};
const cueNames={opening:'01_冒頭のありがとう','first-viewer':'02_初見さん','gift-reaction':'03_ギフトの反応',bingo:'04_ビンゴ達成',closing:'05_締めのありがとう','teaser-promise':'06_歌ってみた予告'};
function cueName(id){if(!cueNames[id])throw Error('Missing Japanese cue purpose: '+id);return cueNames[id];}
const movieName=(p,suffix)=>stems[p.id]+'_切り抜き1.25倍_'+(suffix==='reference'?'曲入り確認用':'配信音声のみ')+'.mp4';
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
  const found = layers.filter(layer => layer.name.startsWith('ARCHIVE SHOT ')||layer.name==='CHARACTER ORIGINAL FIXED');
  if (!found.length) throw Error('Expected native archive layers.');
  return found;
}
function characterLayer(data){
  const found=Object.values(data.items||{}).filter(i=>i.kind?.type==='Comp').flatMap(i=>i.kind.layers||[]).filter(l=>l.name==='CHARACTER ORIGINAL FIXED');
  if(found.length!==1)throw Error('Expected one original character layer.');return found[0];
}
function filmMasterGain(data){
  const sequences=Object.values(data.project?.items||{}).map(i=>i.kind?.Sequence).filter(Boolean);
  if(sequences.length!==1||!Number.isFinite(sequences[0].master_volume_db))throw Error('Expected one native FilmCraft sequence with a fixed master gain.');
  return sequences[0].master_volume_db;
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
  if (['bingo-thankyou-3plans-20261025', 'bingo-thankyou-tracking-v2-20261025', 'bingo-thankyou-wholeframe-v3-20261025','bingo-thankyou-archive-jet-v4-20261026','ビンゴ達成ありがとう_切り抜き差込版_音声修正_20261026'].includes(path.basename(destination))) throw Error('Historical thank-you deliveries must be preserved.');
  const existingReceipt=path.join(destination,'制作データ/qa/package.json');
  if(fs.existsSync(existingReceipt)&&parse(existingReceipt).version!==version)throw Error('A different revision already occupies this delivery folder. Preserve it and choose a new folder.');
  if (plans.length !== 3 || new Set(plans.map(plan => plan.id)).size !== 3) throw Error('Expected three distinct plans.');
  const edit = loadEdit(root), editSha256 = hash(path.join(root, 'edit-manifest.json'));
  const sharedMedia = [backgroundName, 'background-manifest.json', 'voice-mix.wav'];
  for (const name of sharedMedia) if (!fs.existsSync(path.join(root, 'media', name))) throw Error('Missing shared media: ' + name);
  const backgroundEvidence = background(root);
  const whole = parse(path.join(root, 'qa/audit.json'));
  const visual = parse(path.join(root, 'qa/visual-review.json'));
  if (whole.status !== 'PASS_NATIVE_ARCHIVE_JET' || !Array.isArray(whole.plans) || visual.status !== 'PASS_TEXT_ONLY_VISUAL') throw Error('Current native archive and isolated visual evidence are required.');
  if(whole.playbackRate!==playbackRate||whole.pitchPreserved!==true||whole.audioCutMode!=='direct-container-seek-continuous-samples')throw Error('Current direct-source 1.25x audit is required.');
  if(whole.compositionMode!=='live-during-all-speech'||whole.musicStart!==0||whole.musicGainMode!=='constant')throw Error('Current live-speech and fixed-music audit is required.');
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
    if (!a?.passed || a.matchingSpeech?.passed!==true || a.matchingSpeech?.frameCoverage?.passed!==true || a.matchingSpeech.voiceCount!==edit.voice.length || a.mainProjectSha256 !== main || a.textOnlyProjectSha256 !== text || a.editManifestSha256 !== editSha256 || a.backgroundSha256 !== backgroundEvidence.backgroundSha256 || a.backgroundManifestSha256 !== backgroundEvidence.backgroundManifestSha256
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
    if(report.renderInputAssets.characterCutoutSha256!==hash(path.join(root,'media/character-cutout.png'))||report.renderInputAssets.characterOriginalSha256!==hash(path.join(root,'media/character-original.jpg')))throw Error('Rendered original character seals are stale: '+plan.id);
    for (const c of whole.clips) if (!report.renderInputAssets.clips?.some(s=>s.id===c.id&&s.sha256===c.sha256)) throw Error('Rendered clip input seal missing: '+c.id);
    const wholeReport = whole.plans.find(item => item.plan === plan.id);
    return {plan, report, archive:archiveLayers(parse(originalProject)), character:characterLayer(parse(originalProject)),wholeReport,
      mainWhole:wholeStructure(parse(originalProject)), textWhole:wholeStructure(parse(path.join(root, plan.id, 'projects', plan.id+'-text-only.ecproj')))};
  });

  // Physical waveform evidence is required; ASR recognition cannot replace it.
  const sourceCheckFile=path.join(root,'qa/audio-waveform-source-check.json'),finalCheckFile=path.join(root,'qa/audio-waveform-check.json');
  const sourceAudio=parse(sourceCheckFile),finalAudio=parse(finalCheckFile),extraction=parse(path.join(root,'qa/extraction.json'));
  for(const [q,status]of [[sourceAudio,'PASS_PITCH_CONTINUITY_SOURCE'],[finalAudio,'PASS_PITCH_CONTINUITY_FINAL']]){
    if(q.status!==status||q.passed!==true||q.manifestSha256!==editSha256||q.sourceArchiveSha256!==extraction.archive.sha256||q.asrUsedAsAudioQualityGate!==false)throw Error('Current waveform/pitch QA is required.');
    if(q.sourceChecks?.length!==edit.voice.length||q.expectedVoiceCount!==edit.voice.length||q.checks?.allVoiceChecks!==true)throw Error('All current waveform source cues are required.');
    for(const v of edit.voice){const c=q.sourceChecks.find(c=>c.id===v.id);if(!c?.passed||c.rawSha256!==hash(path.join(root,'media/voice-raw',v.id+'.wav'))||c.voiceSha256!==hash(path.join(root,'media/voice',v.id+'.wav'))||c.playbackRate!==playbackRate)throw Error('Waveform cue evidence changed: '+v.id);}
  }
  if(finalAudio.finalAACStatus!=='CHECKED'||finalAudio.checks?.finalAAC!==true)throw Error('Final AAC waveform check has not passed.');
  for(const p of plans)for(const variant of ['voice-only','reference']){const c=finalAudio.finalChecks?.find(c=>c.plan===p.id&&c.variant===variant),f=path.join(root,p.id,'videos',p.id+'-'+variant+'.mp4');if(!c?.passed||c.inputsUnchanged!==true||c.videoSha256!==hash(f))throw Error('Final AAC waveform evidence is stale: '+p.id+'/'+variant);}
  const voicePacketEquivalence=plans.map(p=>{
    const file=path.join(root,p.id,'videos',p.id+'-voice-only.mp4'),args=['-v','error','-i',native(file),'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'];
    const r=spawnSync(FF,args,{encoding:'utf8',timeout:180000});if(r.error||r.status!==0||!/^SHA256=[a-f0-9]{64}$/i.test(r.stdout?.trim()))throw Error('Current AAC stream hash failed: '+p.id);
    return {id:p.id,file:path.relative(root,file),videoSha256:hash(file),audioPacketSha256:r.stdout.trim()};
  });
  if(new Set(voicePacketEquivalence.map(p=>p.audioPacketSha256)).size!==1)throw Error('B/C voice-only AAC differs from waveform-checked A.');
  const audioEvidence={sourceReportSha256:hash(sourceCheckFile),finalReportSha256:hash(finalCheckFile),sourceStatus:sourceAudio.status,finalStatus:finalAudio.status,voicePacketEquivalence,asrUsedAsAudioQualityGate:false};
  const musicCheckFile=path.join(root,'qa/music-check.json'),musicCheck=parse(musicCheckFile);
  if(musicCheck.status!=='PASS_FIXED_MUSIC_LEVEL'||musicCheck.passed!==true||musicCheck.manifestSha256!==editSha256||musicCheck.negativeControl?.passed!==true||musicCheck.checks?.allRequestedPlans!==true||musicCheck.checks?.voiceDuckNegativeControlRejected!==true||musicCheck.checks?.manifestUnchanged!==true||musicCheck.plans?.length!==plans.length||musicCheck.plansRequested?.length!==plans.length||!plans.every(p=>musicCheck.plansRequested.includes(p.id)))throw Error('Current fixed-gain music evidence with a rejected speech-duck negative control is required.');
  const sealedMusicInputs=[];
  function musicSeal(file,expected,label){if(typeof expected!=='string'||hash(file)!==expected)throw Error('Fixed-music input changed: '+label);sealedMusicInputs.push({file,sha256:expected});}
  for(const p of plans){
    const row=musicCheck.plans.find(r=>r.plan===p.id),folder=path.join(root,p.id);
    if(!row?.passed||row.sourceComparison?.passed!==true||row.musicFixedGainComparison?.passed!==true||!row.checks||!Object.values(row.checks).every(v=>v===true)||row.finalMixes?.length!==2)throw Error('Fixed music or final static mix failed: '+p.id);
    musicSeal(path.join(folder,'qa/music-source.json'),row.sourceMetadataSha256,p.id+' source metadata');
    musicSeal(path.join(root,'audio-preview',p.audioFile),row.sourceSha256,p.id+' original trial');
    if(row.sourceSha256!==p.previewSha256)throw Error('Fixed-music source is not the approved trial: '+p.id);
    musicSeal(path.join(folder,'media/music-source.wav'),row.sourcePcmSha256,p.id+' decoded trial');
    musicSeal(path.join(folder,'media/music.wav'),row.musicSha256,p.id+' constant-gain music');
    for(const variant of ['voice-only','reference']){
      const mix=row.finalMixes.find(m=>m.variant===variant);
      if(!mix?.passed||mix.comparison?.passed!==true||!mix.checks||!Object.values(mix.checks).every(v=>v===true))throw Error('Final fixed-scalar bus check is incomplete: '+p.id+'/'+variant);
      musicSeal(path.join(folder,'qa',variant+'-fixed-mix.json'),mix.metadataSha256,p.id+'/'+variant+' mix metadata');
      musicSeal(path.join(folder,'media',variant+'-mix.wav'),mix.pcmSha256,p.id+'/'+variant+' final PCM');
      musicSeal(path.join(folder,'media/voice.wav'),mix.voiceSha256,p.id+'/'+variant+' voice');
      musicSeal(path.join(folder,'videos',p.id+'-'+variant+'.mp4'),mix.videoSha256,p.id+'/'+variant+' final movie');
    }
  }
  const musicEvidence={status:musicCheck.status,reportSha256:hash(musicCheckFile),musicStart:0,gainMode:'constant',speechDucking:false,maximumBoundaryRampSeconds:.010,inputs:sealedMusicInputs};

  const editable = path.join(destination, '制作データ');
  const copied = [], receipts = [], relinked = [];
  const fileMap=[];
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
  function mappedCopy(relative,delivered,kind='asset'){
    const from=path.join(root,relative),to=path.join(destination,delivered);
    copy(from,to);fileMap.push({workRelative:relative,deliveredRelative:delivered,kind,sha256:hash(to),originalLinux:from,originalNative:native(from),publishedLinux:to,publishedNative:native(to)});return to;
  }
  function execute(exe, args) {
    const result = spawnSync(exe, args, {encoding:'utf8', timeout:180000, maxBuffer:32*1024*1024});
    const receipt = {exe, args, exit:result.status, error:result.error?.message, stdout:result.stdout?.replace(/^\uFEFF/, ''), stderr:result.stderr};
    receipts.push(receipt);
    if (result.error || result.status !== 0) throw Error(JSON.stringify(receipt).slice(-5000));
    return receipt.stdout;
  }
  fs.mkdirSync(editable, {recursive:true});
  const deliveredBackground=mappedCopy('media/'+backgroundName,'制作データ/共通素材/淡色の紙背景.png');
  const deliveredManifest=mappedCopy('media/background-manifest.json','制作データ/media/background-manifest.json');
  mappedCopy('media/voice-mix.wav','制作データ/共通素材/配信音声ミックス_1.25倍速.wav');
  for(const [from,to]of [['character-original.jpg','元の立ち絵.jpg'],['character-cutout.png','立ち絵_通常透過.png']])if(fs.existsSync(path.join(root,'media',from)))mappedCopy('media/'+from,'制作データ/共通素材/'+to);
  copy(path.join(root,'edit-manifest.json'),path.join(editable,'edit-manifest.json'));
  for (const s of edit.shots.filter(s=>s.kind==='archive')) mappedCopy('media/clips/'+s.id+'.mp4','制作データ/共通素材/切り抜き/'+cueName(s.voiceId)+'.mp4');
  for (const v of edit.voice){mappedCopy('media/voice/'+v.id+'.wav','制作データ/共通素材/発話/'+cueName(v.id)+'.wav');const raw='media/voice-raw/'+v.id+'.wav';if(fs.existsSync(path.join(root,raw)))mappedCopy(raw,'制作データ/共通素材/音質検証用_処理前/'+cueName(v.id)+'.wav');}
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
    const p=plans.find(p=>p.audioFile===name);
    mappedCopy('audio-preview/'+name,'制作データ/試聴曲/'+(p?stems[p.id]+'_試聴.m4a':name));
  }
  const sourceNames = [...new Set(['config.mjs', 'build-edit.mjs', 'insert-edit.mjs', 'base-graphics.mjs', 'motion.mjs', 'pipeline.mjs', 'audit.mjs', 'package.mjs', 'README.md', '音源後付けガイド.md',...fs.readdirSync(source).filter(n=>/\.(?:mjs|py)$/.test(n))])];
  for (const name of sourceNames) copy(path.join(source, name), path.join(editable, '制作ソース', name));
  for (const name of ['validation.json', 'asset-policy.md']) {
    if (fs.existsSync(path.join(source, name))) copy(path.join(source, name), path.join(editable, '制作ソース', name));
  }
  if (fs.existsSync(path.join(root, 'qa'))) copyTree(path.join(root, 'qa'), path.join(editable, 'qa'));
  if (!fs.existsSync(path.join(editable,'qa/extraction.json'))) throw Error('Portable extraction provenance is required.');
  if (fs.existsSync(path.join(source,'背景生成プロンプト.md'))) copy(path.join(source,'背景生成プロンプト.md'),path.join(editable,'制作ソース/背景生成プロンプト.md'));
  copy(path.join(source, 'README.md'), path.join(destination, '制作方針と投稿文.md'));
  copy(path.join(source, '音源後付けガイド.md'), path.join(destination, '音源後付けガイド.md'));
  const prefixes = [[native(root), native(editable)], [root, editable]];
  function relocate(value) {
    if (typeof value === 'string') {
      for(const m of fileMap)if(value===m.originalLinux)return m.publishedLinux;else if(value===m.originalNative||value===m.originalNative.replaceAll('\\','/'))return m.publishedNative;
      for (const [from, to] of prefixes) if (value === from || value.startsWith(from + '/') || value.startsWith(from + '\\')) return to + value.slice(from.length);
      return value;
    }
    if (Array.isArray(value)) return value.map(relocate);
    if (value && typeof value === 'object') {
      const mapped=Object.fromEntries(Object.entries(value).map(([key,child])=>[key,relocate(child)]));
      const mediaPath=mapped.kind?.path||mapped.kind?.Media?.media?.File?.path;
      if(mediaPath&&typeof mapped.name==='string'){mapped.name=mediaPath.split(/[\\/]/).at(-1);if(mapped.kind?.Media?.info)mapped.kind.Media.info.name=mapped.name;}
      return mapped;
    }
    return value;
  }
  function assertTextOnly(project) {
    const data = parse(project);
    const references = strings(data).filter(value => /\.(?:png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr|avif|heic|mp4|m4v|mov|mkv|webm|avi|mpeg|mpg|mxf|wav|mp3|m4a|flac|ogg|aac)(?:$|[?#])/i.test(value));
    const allowed = new Set([backgroundName, path.basename(deliveredBackground), native(deliveredBackground)]);
    if (!references.length || references.some(value => !allowed.has(value))) throw Error('Character-free delivery project contains an unexpected image path.');
    if(hash(deliveredBackground)!==backgroundEvidence.backgroundSha256||hash(deliveredManifest)!==backgroundEvidence.backgroundManifestSha256)throw Error('Delivered background bytes changed.');
    return {...backgroundEvidence, containsCharacter:false,containsArchive:false, aiViewingAllowed:true, projectSha256:hash(project), rasterReferences:references};
  }
  const summaries = [];
  try {
    for (const {plan, report, archive, character, wholeReport, mainWhole, textWhole} of evidence) {
      const work = path.join(root, plan.id), delivered = path.join(editable, plan.id);
      for (const name of ['source', 'qa']) copyTree(path.join(work, name), path.join(delivered, name));
      for (const [from,to] of [['picture-master.mp4','映像マスター.mp4'],['voice.wav','配信音声_1.25倍速.wav'],['music.wav','追加曲.wav'],['music-source.wav','音量検証用_曲の原区間.wav'],['reference-sum.wav','音量検証用_調整前の曲入り.wav'],['voice-only-sum.wav','音量検証用_調整前の配信音声.wav'],['reference-mix.wav','音量検証用_曲入りミックス.wav'],['voice-only-mix.wav','音量検証用_配信音声ミックス.wav']])mappedCopy(plan.id+'/media/'+from,'制作データ/案別素材/'+stems[plan.id]+'/'+to);
      const movieDigests = [];
      for (const suffix of ['reference', 'voice-only']) {
        const name = movieName(plan,suffix), from = path.join(work, 'videos',plan.id+'-'+suffix+'.mp4'), to = path.join(destination, name);
        copy(from, to); movieDigests.push({file:name, sha256:hash(to), bytes:fs.statSync(to).size});
      }
      const names = [plan.id + '.ecproj', plan.id + '-text-only.ecproj', plan.id + '.fcproj'];
      const purposes=['映像編集.ecproj','人物未読込確認.ecproj','映像と音声編集.fcproj'];
      const projects=names.map((name,i)=>mappedCopy(plan.id+'/projects/'+name,'編集原本/'+stems[plan.id]+'/'+stems[plan.id]+'_'+purposes[i],'project'));
      for (const project of projects) {
        fs.writeFileSync(project, JSON.stringify(relocate(parse(project))) + '\n');
        const obsolete = strings(parse(project)).filter(value => prefixes.some(([from]) => value === from || value.startsWith(from + '/') || value.startsWith(from + '\\')));
        if (obsolete.length) throw Error('Native project still references working media: ' + project);
        relinked.push({file:path.relative(destination, project), sha256:hash(project)});
      }
      // Generated JSX keeps useful editable paths as well as the native project.
      for (const name of fs.readdirSync(path.join(delivered, 'source')).filter(name => /\.jsx$/.test(name))) {
        const file = path.join(delivered, 'source', name);
        let jsx = fs.readFileSync(file, 'utf8');
        for(const m of fileMap)for(const [from,to]of [[m.originalNative,m.publishedNative],[m.originalLinux,m.publishedLinux]])jsx=jsx.replaceAll(JSON.stringify(from).slice(1,-1),JSON.stringify(to).slice(1,-1));
        for (const [from, to] of prefixes) jsx = jsx.replaceAll(JSON.stringify(from).slice(1, -1), JSON.stringify(to).slice(1, -1));
        fs.writeFileSync(file, jsx);
      }
      const [ec,text,fc] = projects;
      const expectedMasterGain=parse(path.join(work,'qa/reference-fixed-mix.json')).busGainDb;
      if(!Number.isFinite(expectedMasterGain)||Math.abs(filmMasterGain(parse(fc))-expectedMasterGain)>1e-5)throw Error('Delivery FilmCraft fixed master gain differs from the measured PCM mix: '+plan.id);
      const before = archiveLayers(parse(ec));
      if (JSON.stringify(before) !== JSON.stringify(archive)) throw Error('Relinking changed the archive layer properties: ' + plan.id);
      if(JSON.stringify(characterLayer(parse(ec)))!==JSON.stringify(character))throw Error('Relinking changed original character local properties: '+plan.id);
      assertTextOnly(text);
      execute(EC, ['--project', native(ec), '--save', 'info', '--json']);
      execute(EC, ['--project', native(text), '--save', 'info', '--json']);
      execute(FC, ['--project', native(fc), '--save', 'inspect']);
      if(Math.abs(filmMasterGain(parse(fc))-expectedMasterGain)>1e-5)throw Error('Native resave changed FilmCraft fixed master gain: '+plan.id);
      if (JSON.stringify(archiveLayers(parse(ec))) !== JSON.stringify(archive)) throw Error('Native resave changed the archive layer properties: ' + plan.id);
      if(JSON.stringify(characterLayer(parse(ec)))!==JSON.stringify(character))throw Error('Native resave changed original character local properties: '+plan.id);
      if (JSON.stringify(wholeStructure(parse(ec))) !== JSON.stringify(mainWhole)
        || JSON.stringify(wholeStructure(parse(text))) !== JSON.stringify(textWhole)) throw Error('Native delivery relink/resave changed whole-frame camera keys or parent structure: ' + plan.id);
      const firstClip = edit.shots.find(s=>s.kind==='archive');
      const sample = (firstClip.start+firstClip.end)/2;
      const nativeComp=Object.values(parse(ec).items).find(i=>i.kind?.type==='Comp')?.name;
      const previewComp=Object.values(parse(text).items).find(i=>i.kind?.type==='Comp')?.name;
      if(!nativeComp||!previewComp)throw Error('Native comp names are missing.');
      const localOnly = path.join(delivered, 'qa/local-only');
      fs.mkdirSync(localOnly, {recursive:true});
      execute(EC, ['render-frame', '--project', native(ec), '--comp', nativeComp, '--time', String(sample), '--out', native(path.join(localOnly, 'delivery-ec.png')), '--json']);
      execute(FC, ['--project', native(fc), 'render', '--seconds', String(sample), '--out', native(path.join(localOnly, 'delivery-fc.png'))]);
      execute(EC, ['render-frame', '--project', native(text), '--comp', previewComp, '--time', String(sample), '--out', native(path.join(delivered, 'qa/text-only-delivery.png')), '--json']);
      const isolation = assertTextOnly(text);
      for(const f of projects){const m=fileMap.find(m=>m.publishedLinux===f);m.sha256=hash(f);const seal=relinked.find(s=>s.file===path.relative(destination,f));if(seal)seal.sha256=m.sha256;}
      for (const movie of movieDigests) if (hash(path.join(destination, movie.file)) !== movie.sha256) throw Error('Movie changed during native reopen: ' + movie.file);
      summaries.push({id:plan.id, title:plan.title, movies:movieDigests, nativeReopenSaveAndRender:true, archiveLayerPropertiesUnchanged:true,characterLayerPropertiesUnchanged:true,
        wholeFrameKeysAndParentsUnchanged:true,fixedMasterGainUnchanged:true,fixedMasterGainDb:expectedMasterGain,wholeFrameSourceEvidence:wholeReport, characterFreeDelivery:isolation, technicalSourceEvidence:report});
    }
    for (const m of fileMap.filter(m=>m.kind==='asset')) if (hash(path.join(root,m.workRelative)) !== hash(path.join(destination,m.deliveredRelative))) throw Error('Delivered media changed during native resave: ' + m.deliveredRelative);
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
  fs.writeFileSync(path.join(editable,'名前対応表.json'),JSON.stringify({version,files:fileMap,provenanceNote:'旧ASR資料は発話検索の出典。時刻補完WAVは今回の最終音源に使用せず、音切れ改善PASSの根拠にも使用しない。'},null,2)+'\n');
  fs.writeFileSync(path.join(editable,'再制作用ファイルを準備.mjs'),String.raw`/** Run only when regenerating from source. Published Japanese originals are never overwritten. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{spawnSync}from'node:child_process';import{fileURLToPath}from'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),data=path.basename(here)==='制作ソース'?path.dirname(here):here,delivery=path.dirname(data),map=JSON.parse(fs.readFileSync(path.join(data,'名前対応表.json'),'utf8')).files;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const nativeCache=new Map(),native=p=>{if(nativeCache.has(p))return nativeCache.get(p);const r=spawnSync('wslpath',['-w',p],{encoding:'utf8'});if(r.status||r.error)throw Error('wslpath failed');nativeCache.set(p,r.stdout.trim());return r.stdout.trim();};
const inside=(p,r)=>p.startsWith(r+path.sep);
function relocate(v){if(typeof v==='string'){for(const m of map){const published=path.resolve(delivery,m.deliveredRelative);if([m.publishedLinux,m.publishedNative,native(published)].includes(v))return v.startsWith('/')?path.resolve(data,m.workRelative):native(path.resolve(data,m.workRelative));}return v;}if(Array.isArray(v))return v.map(relocate);if(v&&typeof v==='object'){const o=Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relocate(x)])),p=o.kind?.path||o.kind?.Media?.media?.File?.path;if(p&&typeof o.name==='string'){o.name=p.split(/[\\/]/).at(-1);if(o.kind?.Media?.info)o.kind.Media.info.name=o.name;}return o;}return v;}
const rows=[];for(const m of map){const from=path.resolve(delivery,m.deliveredRelative),to=path.resolve(data,m.workRelative);if(!inside(from,delivery)||!inside(to,data))throw Error('Unsafe mapping path');const bytes=fs.readFileSync(from);if(m.kind==='asset'&&hash(bytes)!==m.sha256)throw Error('Published media changed: '+m.deliveredRelative);const output=m.kind==='project'?Buffer.from(JSON.stringify(relocate(JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''))))+'\n'):bytes;if(from===to)continue;if(fs.existsSync(to)&&hash(fs.readFileSync(to))!==hash(output))throw Error('既存の再制作ファイルを保持しました: '+to);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,output);rows.push({file:m.workRelative,sha256:hash(output)});}fs.writeFileSync(path.join(data,'再制作準備記録.json'),JSON.stringify({files:rows},null,2)+'\n');console.log('再制作ファイルを準備しました。公開用の日本語原本は保持されています。');
`);
  copy(path.join(editable,'再制作用ファイルを準備.mjs'),path.join(editable,'制作ソース/再制作用ファイルを準備.mjs'));
  copy(path.join(editable,'名前対応表.json'),path.join(editable,'制作ソース/名前対応表.json'));
  const cards = plans.map((plan, index) => `<article><div class="eyebrow">${String(index + 1).padStart(2, '0')}案</div><h2>${escape(plan.title)}</h2><p class="song">${escape(plan.song)}</p><video controls playsinline preload="metadata" src="${encodeURI(movieName(plan,'reference'))}"></video><p>${escape(descriptions[plan.id] || plan.description)}</p><div class="links"><a href="${encodeURI(movieName(plan,'reference'))}">切り抜き1.25倍・曲入り確認用</a><a href="${encodeURI(movieName(plan,'voice-only'))}">切り抜き1.25倍・配信音声のみ</a><a href="${encodeURI('編集原本/'+stems[plan.id]+'/')}">編集原本</a></div></article>`).join('\n');
  fs.writeFileSync(path.join(destination, '3案を見比べる.html'), `<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>おさゆ｜ライブ感重視・曲の音量一定・3案比較</title>
<style>body{margin:0;background:#0c1020;color:#f7fbff;font:16px/1.75 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:48px 24px 64px}h1{line-height:1.35;font-size:clamp(26px,4vw,44px);margin:8px 0 18px}.intro{color:#bdd2d8;max-width:780px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:36px}article{border:1px solid #355061;background:#131b2d;border-radius:20px;padding:22px}.eyebrow{color:#a8f3e0;letter-spacing:.2em;font-size:12px}h2{font-size:23px;line-height:1.4;margin:8px 0}.song{color:#ff95d2;font-size:14px;min-height:48px}video{display:block;width:100%;aspect-ratio:9/16;background:#060b13;border-radius:12px}.links{display:flex;gap:12px;flex-wrap:wrap}a{color:#a8f3e0;text-underline-offset:4px}footer{margin-top:36px;color:#98afb8;font-size:14px}@media(max-width:900px){.grid{grid-template-columns:1fr}article{max-width:440px;margin:auto}.song{min-height:0}}</style>
<main><div class="eyebrow">おさゆ / ライブ感重視 / 切り抜き1.25倍</div><h1>初ビンゴ、全マス達成！<br>ライブの声と映像で伝える・3案</h1><p class="intro">9:16・25秒。本人の声が聞こえる6区間は、その発話と一致する配信映像をフレーズ全体に表示し、間をビンゴ盤面・文字・元の立ち絵の演出でつなぎます。切り抜きと声はピッチを保つ1.25倍速。曲入り確認版は通常速度の試聴曲を冒頭から固定音量で流し、発話中も下げません。配信音声版は追加曲なしです。</p><div class="grid">${cards}</div><footer>曲入りは今回のプレビュー用です。投稿時は配信音声版へTikTok内の音源を冒頭から追加し、元の声と両立する一定の音量へ調整してください。<a href="${encodeURI('音源後付けガイド.md')}">音源ガイド</a> ／ <a href="${encodeURI('制作方針と投稿文.md')}">構成・投稿文</a><br>元配信のBGMやギフトSEは残る場合があります。純粋なボーカル分離音源ではありません。TikTok実機での同期と創作上の採用判断は別途確認となります。</footer></main></html>\n`);
  const report = {status:'PASS_PORTABLE_NATIVE_PACKAGE', version,playbackRate,pitchPreserved:true,audioEvidence,musicEvidence, background:backgroundEvidence, destination:native(destination), nativeProjects:plans.length*3, plans:summaries, copiedBeforeRelink:copied, relinked, receipts,fileMap,
    aiImagePolicy:'Archive videos and character-containing frames stay local; AI previews import only the approved background and gray placeholders.',
    humanRealtimeReview:false, tiktokDeviceReview:false, ownerCreativeApproval:false};
  fs.mkdirSync(path.join(editable, 'qa'), {recursive:true});
  if(hash(sourceCheckFile)!==audioEvidence.sourceReportSha256||hash(finalCheckFile)!==audioEvidence.finalReportSha256)throw Error('Waveform QA reports changed during packaging.');
  if(hash(musicCheckFile)!==musicEvidence.reportSha256||sealedMusicInputs.some(s=>hash(s.file)!==s.sha256))throw Error('Fixed music QA reports or inputs changed during packaging.');
  fs.writeFileSync(path.join(editable, 'qa/package.json'), JSON.stringify(report, null, 2) + '\n');
  fs.mkdirSync(path.join(destination,'検証記録'),{recursive:true});
  fs.writeFileSync(path.join(destination,'検証記録/納品検証.json'),JSON.stringify({status:report.status,version,playbackRate,frames:Math.round(edit.duration*30),duration:edit.duration,nativeProjects:9,movies:summaries.flatMap(s=>s.movies),sourceWaveformStatus:sourceAudio.status,finalWaveformStatus:finalAudio.status,fixedMusicStatus:musicCheck.status,musicStart:0,speechDucking:false,voiceCueCount:edit.voice.length,asrUsedAsAudioQualityGate:false,humanListening:finalAudio.humanListening,detail:'制作データ/qa/package.json'},null,2)+'\n');
  console.log(JSON.stringify({destination:report.destination, nativeProjects:report.nativeProjects, nativeReopenSaveAndRender:true, movieCount:summaries.reduce((sum, plan) => sum + plan.movies.length, 0)}));
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) packageDelivery({destination:process.argv[2] || defaultDestination});
