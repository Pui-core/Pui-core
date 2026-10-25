/** Read saved object-camera transforms through the native engine. No character import. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {plans} from './motion.mjs';

const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const STAGE_SHA = '248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6';
const TOLERANCE_PIXELS = 3;
const parse = s => JSON.parse(s.replace(/^\uFEFF/, '').trim());
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const fileHash = filename => sha(fs.readFileSync(filename));
const vector = (v, length) => Array.isArray(v) && v.length === length && v.every(Number.isFinite);
const distance = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
const near = (a, b, tolerance=1e-6) => Number.isFinite(a) && Math.abs(a-b) <= tolerance;
function save(filename, value) {
  fs.mkdirSync(path.dirname(filename), {recursive:true});
  fs.writeFileSync(filename, JSON.stringify(value, null, 2) + '\n');
}
function execute(exe, args) {
  const r = spawnSync(exe, args, {encoding:'utf8', timeout:180000,
    maxBuffer:32*1024*1024, windowsHide:true});
  if (r.error || r.status !== 0) throw Error('Native readback failed: ' +
    (r.error?.message || r.stderr?.slice(-1500) || String(r.status)));
  return r.stdout.replace(/^\uFEFF/, '').trim();
}
const nativePath = filename => execute('wslpath', ['-w', path.resolve(filename)]);
function localPath(filename) {
  return filename.startsWith('/') ? filename : execute('wslpath', ['-u', filename]);
}
function sameFile(a, b) {
  try { return fs.realpathSync(localPath(a)) === fs.realpathSync(localPath(b)); }
  catch { return false; }
}
function allStrings(value) {
  if (typeof value === 'string') return [value];
  return value && typeof value === 'object' ? Object.values(value).flatMap(allStrings) : [];
}

// This gate runs before invoking the native engine. It rejects an invisible
// character import as well as any unapproved image; hiding a layer is insufficient.
function isolation(root, project) {
  const stage = path.join(root, 'media/stage-background.png');
  const items = Object.values(project.items || {});
  const footage = items.filter(i => i.kind?.type === 'Footage');
  const rasterReferences = allStrings(project).filter(s =>
    /\.(?:png|jpe?g|webp|gif|bmp|tiff?|svg|exr|hdr|heic|avif)(?:$|[?#])/i.test(s));
  const stageMatches = fileHash(stage) === STAGE_SHA;
  const passed = stageMatches && footage.length === 1 && footage.every(f => sameFile(f.kind.path, stage)) &&
    rasterReferences.length > 0 && rasterReferences.every(s => s === 'stage-background.png' || sameFile(s, stage));
  const result = {passed, containsCharacter:false, nativeProjectContainsCharacter:false,
    stageSha256:fileHash(stage), approvedStageSha256:STAGE_SHA,
    rasterReferences, footageCount:footage.length, imageInputToAI:'NONE'};
  if (!passed) {
    result.containsCharacter = 'UNVERIFIED'; result.nativeProjectContainsCharacter = 'UNVERIFIED';
    throw Error('Text-only project isolation failed before native read.');
  }
  return result;
}

function validateTargets(targets, plan, comp) {
  if (!Array.isArray(targets) || !targets.length) throw Error('Missing trackingTargets for ' + plan.id);
  const names = new Map();
  for (const layer of comp.kind.layers || []) {
    const existing = names.get(layer.name) || []; existing.push(layer); names.set(layer.name, existing);
  }
  const rows = targets.map((row, index) => {
    if (typeof row.rigName !== 'string' || !row.rigName.startsWith('OBJECT CAMERA ') ||
        !Number.isFinite(row.time) || row.time < 0 || row.time >= plan.duration ||
        !vector(row.target, 2) || !vector(row.screen, 2) || !Number.isFinite(row.scale) || row.scale <= 0 ||
        typeof row.label !== 'string' || !row.label.trim() || typeof row.kind !== 'string') {
      throw Error('Invalid tracking target ' + plan.id + '[' + index + ']');
    }
    const matching = names.get(row.rigName) || [];
    if (matching.length !== 1) throw Error('Camera name is missing or ambiguous: ' + row.rigName);
    const layer = matching[0];
    if (layer.parent !== null || layer.switches?.three_d !== false || layer.source?.type !== 'Null') {
      throw Error('Tracking readback requires an independent 2D Null: ' + row.rigName);
    }
    return {...row, layerId:layer.id};
  });
  const tracks = rows.filter(row => row.kind !== 'return');
  if (tracks.length < 2 || new Set(tracks.map(row => JSON.stringify(row.target))).size < 2 ||
      !tracks.some(row => row.scale > 105)) throw Error('Insufficient distinct tracking targets for ' + plan.id);
  if (!rows.some(row => row.kind === 'return')) throw Error('Missing explicit full-frame return for ' + plan.id);
  return rows;
}

function unpackScript(raw) {
  const wrapper = parse(raw);
  if (wrapper.error || wrapper.ok === false) throw Error('Native script returned an error.');
  if (Array.isArray(wrapper.rows)) return wrapper;
  const output = typeof wrapper.output === 'string' ? parse(wrapper.output) : wrapper.output;
  if (!Array.isArray(output?.rows)) throw Error('Native script did not return tracking rows.');
  return output;
}

function auditPlan(root, plan, api) {
  const directory = path.join(root, plan.id), qa = path.join(directory, 'qa');
  const mainPath = path.join(directory, 'projects', plan.id + '.ecproj');
  const projectPath = path.join(directory, 'projects', plan.id + '-text-only.ecproj');
  const layoutPath = path.join(qa, 'layout.json'), textLayoutPath = path.join(qa, 'text-only-layout.json');
  const report = {plan:plan.id, passed:false, tolerancePixels:TOLERANCE_PIXELS,
    projectSha256:fileHash(projectPath), mainProjectSha256:fileHash(mainPath),
    layoutSha256:fileHash(layoutPath), textOnlyLayoutSha256:fileHash(textLayoutPath),
    nativeReadback:true, rasterOutput:'NONE', characterAuditDelegatedTo:'audit.mjs', rows:[]};
  try {
    const project = parse(fs.readFileSync(projectPath, 'utf8'));
    report.isolation = isolation(root, project);
    const mainTargets = parse(fs.readFileSync(layoutPath, 'utf8')).trackingTargets;
    const textTargets = parse(fs.readFileSync(textLayoutPath, 'utf8')).trackingTargets;
    if (JSON.stringify(mainTargets) !== JSON.stringify(textTargets)) throw Error('Main/text-only tracking targets differ.');
    const comps = Object.values(project.items || {}).filter(i => i.kind?.type === 'Comp');
    const comp = comps.find(c => c.name === `Osayu Thankyou ${plan.id}`);
    if (!comp || comps.length !== 1 || project.activeComp !== comp.id) throw Error('Unexpected active composition.');
    const targets = validateTargets(textTargets, plan, comp);
    const script = path.join(qa, 'tracking-native-readback.jsx');
    // prop.get was discovered from the installed engine's command metadata:
    // {layer?, path|prop, time? (comp s)}. The script only reads properties.
    const source = `var targets=${JSON.stringify(targets)},rows=[];\n` +
      `for(var i=0;i<targets.length;i++){var t=targets[i],v={};\n` +
      `var probe=app.run('prop.get',{layer:t.layerId,path:'transform/position',time:t.time});\n` +
      `var nearest=null,delta=Infinity;for(var k=0;k<probe.keys.length;k++){var key=probe.keys[k];\n` +
      `if(typeof key.compTime==='number'&&Math.abs(key.compTime-t.time)<delta){nearest=key;delta=Math.abs(key.compTime-t.time);}}\n` +
      `if(!nearest||delta>1/30+0.000001)throw Error('No corresponding saved native key within one frame for '+t.label);\n` +
      `var props=['position','scale','rotation','anchor'];\n` +
      `for(var j=0;j<props.length;j++)v[props[j]]=app.run('prop.get',{layer:t.layerId,path:'transform/'+props[j],time:nearest.compTime});\n` +
      `rows.push({index:i,layerId:t.layerId,time:t.time,declaredTime:t.time,sampledTime:nearest.compTime,\n` +
      `sampledKey:{compTime:nearest.compTime,layerTime:nearest.layerTime,value:nearest.value},values:v});}\n` +
      `writeLn(JSON.stringify({rows:rows}));\n`;
    fs.writeFileSync(script, source);
    report.nativeScriptSha256 = fileHash(script);
    report.nativeApi = api;
    const args = ['--project', nativePath(projectPath), 'script', nativePath(script), '--json'];
    const raw = execute(EC, args);
    save(path.join(qa, 'tracking-native-command.json'), {exit:0, executable:EC, args,
      projectSha256:report.projectSha256, scriptSha256:report.nativeScriptSha256, stdout:parse(raw)});
    const readback = unpackScript(raw);
    if (readback.rows.length !== targets.length) throw Error('Native tracking row count differs.');
    report.rows = targets.map((target, index) => {
      const row = readback.rows[index];
      if (row.index !== index || row.layerId !== target.layerId || !near(row.time, target.time)) {
        throw Error('Native sample identity mismatch.');
      }
      const sampleTimeDelta = Math.abs(row.sampledTime-row.declaredTime);
      const sampleTimeMatches = near(row.declaredTime, target.time) && Number.isFinite(row.sampledTime) &&
        sampleTimeDelta <= 1/30 + 1e-6 && near(row.sampledKey?.compTime, row.sampledTime);
      if (!sampleTimeMatches) throw Error('Saved native key time differs by more than one frame.');
      const values = row.values;
      const position = values.position?.value, scale = values.scale?.value;
      const rotation = values.rotation?.value, anchor = values.anchor?.value;
      if (!vector(position, 3) || !vector(scale, 3) || !vector(anchor, 3) || !Number.isFinite(rotation)) {
        throw Error('Unexpected native transform value types.');
      }
      const angle = rotation*Math.PI/180;
      const x = (target.target[0]-anchor[0])*scale[0]/100;
      const y = (target.target[1]-anchor[1])*scale[1]/100;
      const actualScreen = [position[0]+x*Math.cos(angle)-y*Math.sin(angle),
        position[1]+x*Math.sin(angle)+y*Math.cos(angle)];
      const errorPixels = distance(actualScreen, target.screen);
      const scaleMatches = near(scale[0], target.scale, .1) && near(scale[1], target.scale, .1) && near(scale[2], 100);
      const fixedAnchor = distance(anchor, [540,960]) <= 1e-6 && near(anchor[2], 0);
      const zeroRotation = near(rotation, 0, .01);
      const returnToFull = target.kind !== 'return' ||
        (distance(position, [540,960]) <= TOLERANCE_PIXELS && near(position[2], 0) &&
         near(scale[0], 100, .1) && near(scale[1], 100, .1) && zeroRotation);
      return {rigName:target.rigName, time:target.time, declaredTime:row.declaredTime,
        sampledTime:row.sampledTime, sampleTimeDelta, sampleTimeMatches, sampledKey:row.sampledKey,
        label:target.label, kind:target.kind,
        target:target.target, expectedScreen:target.screen, actualScreen, errorPixels,
        expectedScale:target.scale, scaleMatches, fixedAnchor, zeroRotation, returnToFull,
        values, passed:errorPixels <= TOLERANCE_PIXELS && scaleMatches && fixedAnchor && zeroRotation && returnToFull};
    });
    report.inputsUnchanged = fileHash(projectPath) === report.projectSha256 && fileHash(mainPath) === report.mainProjectSha256 &&
      fileHash(layoutPath) === report.layoutSha256 && fileHash(textLayoutPath) === report.textOnlyLayoutSha256;
    report.passed = report.inputsUnchanged && report.rows.every(row => row.passed);
    if (!report.passed) throw Error('Tracking coordinates or full-frame return failed.');
    save(path.join(qa, 'tracking-readback.json'), report);
    return report;
  } catch (error) {
    report.error = error.message;
    save(path.join(qa, 'tracking-readback.json'), report);
    throw Object.assign(error, {trackingReport:report});
  }
}

export function auditTracking(root, {selected=plans} = {}) {
  if (!path.isAbsolute(root)) throw Error('auditTracking requires an absolute delivery root.');
  const output = path.join(root, 'qa/tracking-audit.json');
  const report = {status:'RUNNING', plans:[], method:'Saved native prop.get transform readback and screen-coordinate evaluation',
    tolerancePixels:TOLERANCE_PIXELS, characterImageInputToAI:'NONE', rasterOutput:'NONE',
    visualInspection:'NOT_PERFORMED', fixedCharacterAudit:'Separate audit.mjs'};
  try {
    // Verify the local API before using it, without opening any production asset.
    const commands = parse(execute(EC, ['--empty', 'commands', '--filter', 'prop.get', '--json']));
    const api = commands.find(command => command.id === 'prop.get');
    if (!api || !/time\?.*comp s/.test(api.params || '')) throw Error('Expected native prop.get time API unavailable.');
    report.api = api;
    for (const plan of selected) {
      try { report.plans.push(auditPlan(root, plan, api)); }
      catch (error) { if (error.trackingReport) report.plans.push(error.trackingReport); throw error; }
    }
    report.status = 'PASS_NATIVE_TRACKING_READBACK';
    report.limitations = ['Native reads load only the stage-only preview project after reference and SHA checks.',
      'Main and preview motion identity and performer immobility are checked by audit.mjs.',
      'Declared sample times are mapped to saved native position-key comp times within one 30fps frame; all four transforms are read at that sampledTime.',
      'Coordinate evaluation measures settled native keys, not perceptual smoothness between samples.',
      'Character-free consecutive-frame visual review and listening remain separate checks.'];
    save(output, report); return report;
  } catch (error) {
    report.status = 'FAIL'; report.error = error.message; save(output, report); throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw Error('Usage: node tracking-audit.mjs /absolute/delivery/root');
  try {
    const report = auditTracking(path.resolve(process.argv[2]));
    console.log(JSON.stringify({status:report.status, plans:report.plans.map(p => ({id:p.plan, samples:p.rows.length}))}));
  } catch (error) {
    console.error(JSON.stringify({status:'FAIL', error:error.message})); process.exitCode = 1;
  }
}
