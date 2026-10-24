/** Package V3 with native relink checks. Character renders remain local only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root, nativePath, compName, videoName, projectStem, textOnlyProjectName, assertTextOnlyProject} from './produce.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(process.argv[2] || '/mnt/f/Users/pui/Documents/gara/bingo-1124-v3');
const editable = path.join(destination, 'editable');
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const receipts = [], copied = [];
function canonical(file) {
  if (fs.existsSync(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  return parent === file ? file : path.join(canonical(parent), path.basename(file));
}
function isWithin(file, directory) { return file === directory || file.startsWith(directory + path.sep); }
function checkCopy(from, to, label) {
  if (hash(from) !== hash(to)) throw Error('Copied file hash differs: ' + label);
  copied.push({file:label, bytes:fs.statSync(to).size, sha256:hash(to)});
}
function checkTree(from, to, prefix) {
  for (const entry of fs.readdirSync(from, {withFileTypes:true})) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name), label = prefix + '/' + entry.name;
    if (entry.isDirectory()) checkTree(a, b, label);
    else if (entry.isFile()) checkCopy(a, b, label);
    else throw Error('Unsupported package entry: ' + a);
  }
}
function execute(exe, args) {
  const r = spawnSync(exe, args, {encoding:'utf8', timeout:120000, maxBuffer:32*1024*1024});
  const receipt = {exe, args, exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  receipts.push(receipt);
  if (r.error || r.status !== 0) throw Error(JSON.stringify(receipt).slice(-6000));
  return receipt.stdout;
}
const resolvedDestination = canonical(destination);
for (const reserved of ['/mnt/f/Users/pui/Documents/gara/bingo-1124', '/mnt/f/Users/pui/Documents/gara/bingo-1124-v2']) {
  if (isWithin(resolvedDestination, canonical(reserved))) throw Error('V1/V2 delivery directory is reserved: ' + reserved);
}
if (isWithin(resolvedDestination, canonical(root))) throw Error('Package destination must be outside the working media root.');
const mediaWhitelist = new Set(['character-original.jpg', 'normalized.wav', 'picture-master.mp4']);
const allowedMedia = new Set([...mediaWhitelist, 'original-score.wav', 'audio-qa.json']);
const extraMedia = fs.readdirSync(path.join(root, 'media')).filter(name => !allowedMedia.has(name));
if (extraMedia.length) throw Error('Generated or unapproved image assets are excluded from V3: ' + extraMedia.join(', '));
for (const name of mediaWhitelist) if (!fs.existsSync(path.join(root, 'media', name))) throw Error('Required portable media is missing: ' + name);
const portableProjects = [projectStem + '.ecproj', textOnlyProjectName, projectStem + '.fcproj'];
for (const name of portableProjects) if (!fs.existsSync(path.join(root, 'projects', name))) throw Error('Missing native project: ' + name);
assertTextOnlyProject(path.join(root, 'projects', textOnlyProjectName));
fs.mkdirSync(editable, {recursive:true});
// Preserve an earlier V3 native package before relinking or resaving it.
const previous = portableProjects.filter(name => fs.existsSync(path.join(editable, 'projects', name)));
if (previous.length) {
  const checkpoint = path.join(destination, 'checkpoints', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(checkpoint, {recursive:true});
  for (const name of previous) fs.copyFileSync(path.join(editable, 'projects', name), path.join(checkpoint, name));
}
for (const name of ['media', 'projects', 'source', 'qa']) {
  const from = path.join(root, name), to = path.join(editable, name);
  fs.cpSync(from, to, {recursive:true});
  checkTree(from, to, 'editable/' + name);
}
const packagedExtraMedia = fs.readdirSync(path.join(editable, 'media')).filter(name => !allowedMedia.has(name));
if (packagedExtraMedia.length) throw Error('Portable V3 media contains unapproved assets: ' + packagedExtraMedia.join(', '));
const localVideo = path.join(root, 'videos', videoName), video = path.join(destination, videoName);
fs.copyFileSync(localVideo, video); checkCopy(localVideo, video, videoName);
const sourceNames = ['README.md', 'produce.mjs', 'typography.mjs', 'audit.mjs', 'audio.mjs', 'package.mjs'];
for (const name of sourceNames) {
  const from = path.join(source, name), to = path.join(editable, 'source', name);
  if (!fs.existsSync(from)) throw Error('Missing V3 editable source: ' + name);
  fs.copyFileSync(from, to); checkCopy(from, to, 'editable/source/' + name);
}
fs.copyFileSync(path.join(source, 'README.md'), path.join(destination, '制作方針と投稿文.md'));
checkCopy(path.join(source, 'README.md'), path.join(destination, '制作方針と投稿文.md'), '制作方針と投稿文.md');

// Relocate only the known V3 root prefix, never arbitrary matching text.
const prefixes = [[nativePath(root), nativePath(editable)], [root, editable]];
function relocate(value) {
  if (typeof value === 'string') {
    for (const [from, to] of prefixes) if (value === from || value.startsWith(from + '\\') || value.startsWith(from + '/')) return to + value.slice(from.length);
    return value;
  }
  if (Array.isArray(value)) return value.map(relocate);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, relocate(child)]));
  return value;
}
const relinked = [];
for (const name of portableProjects) {
  const project = path.join(editable, 'projects', name);
  const parsed = JSON.parse(fs.readFileSync(project, 'utf8').replace(/^\uFEFF/, ''));
  fs.writeFileSync(project, JSON.stringify(relocate(parsed)) + '\n');
  relinked.push({file:name, sha256AfterRelink:hash(project)});
}
const ec = nativePath(path.join(editable, 'projects', projectStem + '.ecproj'));
const textOnly = nativePath(path.join(editable, 'projects', textOnlyProjectName));
const fc = nativePath(path.join(editable, 'projects', projectStem + '.fcproj'));
const localOnly = path.join(editable, 'qa', 'local-only');
fs.mkdirSync(localOnly, {recursive:true});
try {
  execute(EC, ['--project', ec, '--save', 'info', '--json']);
  execute(EC, ['--project', textOnly, '--save', 'info', '--json']);
  execute(FC, ['--project', fc, '--save', 'inspect']);
  assertTextOnlyProject(path.join(editable, 'projects', textOnlyProjectName));
  // These two character-containing redraws are LOCAL ONLY: never use an AI
  // image viewer on them, the character JPEG, master, final MP4 or its cover.
  execute(EC, ['--project', ec, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(path.join(localOnly, 'relocated-main-effectcraft.png')), '--json']);
  execute(FC, ['--project', fc, 'render', '--seconds', '1.1', '--out', nativePath(path.join(localOnly, 'relocated-main-filmcraft.png'))]);
  execute(EC, ['--project', textOnly, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(path.join(editable, 'qa', 'text-only-relocated-effectcraft.png')), '--json']);
} catch (error) {
  fs.writeFileSync(path.join(editable, 'qa/portable-package-failed.json'), JSON.stringify({error:error.message, receipts}, null, 2) + '\n');
  throw error;
}
if (hash(video) !== hash(localVideo)) throw Error('Final video hash changed during packaging.');
for (const name of mediaWhitelist) checkCopy(path.join(root, 'media', name), path.join(editable, 'media', name), 'editable/media/' + name + ' after native save');
const report = {destination:nativePath(destination), bytes:fs.statSync(video).size, sha256:hash(video),
  nativeReopenSaveAndRender:true, nativeProjectCount:3, relinkedBeforeNativeSave:relinked,
  relinkedProjectHashes:Object.fromEntries(portableProjects.map(name => [name, hash(path.join(editable, 'projects', name))])),
  copiedFileHashesBeforeRelink:copied, receipts,
  aiImagePolicy:'Only explicitly named text-only renders are eligible for AI viewing. Character media and character-containing renders remain local.',
  excludedAssets:'No generated image assets; media is restricted to original JPEG, normalized BGM and silent picture master.'};
fs.writeFileSync(path.join(editable, 'qa/portable-package.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({destination:report.destination, sha256:report.sha256, nativeReopenSaveAndRender:true, nativeProjectCount:3}));
