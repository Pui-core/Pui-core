/** Copy V2 to its own Windows directory, then reopen and render native projects. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root, nativePath, compName, videoName, projectStem} from './produce.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(process.argv[2] || '/mnt/f/Users/pui/Documents/gara/bingo-1124-v2');
const editable = path.join(destination, 'editable');
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const receipts = [];
const copied = [];
function checkCopy(from, to, label) {
  if (hash(from) !== hash(to)) throw Error('Copied file hash differs: ' + label);
  copied.push({file:label, bytes:fs.statSync(to).size, sha256:hash(to)});
}
function checkTree(from, to, prefix) {
  for (const entry of fs.readdirSync(from, {withFileTypes:true})) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name), label = prefix + '/' + entry.name;
    if (entry.isDirectory()) checkTree(a, b, label);
    else if (entry.isFile()) checkCopy(a, b, label);
  }
}
function execute(exe, args) {
  const r = spawnSync(exe, args, {encoding:'utf8', timeout:120000, maxBuffer:24*1024*1024});
  const receipt = {exe, args, exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  receipts.push(receipt);
  if (r.error || r.status !== 0) throw Error(JSON.stringify(receipt).slice(-6000));
  return receipt.stdout;
}
// A package must never overwrite the first edit's delivery directory.
if (destination === '/mnt/f/Users/pui/Documents/gara/bingo-1124') throw Error('V1 destination is reserved.');
if (destination === root || destination.startsWith(root + path.sep)) throw Error('Package destination must be outside the working media root.');
fs.mkdirSync(editable, {recursive:true});
for (const name of ['media', 'projects', 'source', 'qa']) {
  const from = path.join(root, name), to = path.join(editable, name);
  fs.cpSync(from, to, {recursive:true});
  checkTree(from, to, 'editable/' + name);
}
const localVideo = path.join(root, 'videos', videoName), video = path.join(destination, videoName);
fs.copyFileSync(localVideo, video);
checkCopy(localVideo, video, videoName);
fs.copyFileSync(path.join(root, 'cover.png'), path.join(destination, 'cover.png'));
checkCopy(path.join(root, 'cover.png'), path.join(destination, 'cover.png'), 'cover.png');
for (const name of ['README.md', 'image-prompts.md', 'produce.mjs', 'motion.mjs', 'audio.mjs', 'package.mjs']) {
  fs.copyFileSync(path.join(source, name), path.join(editable, 'source', name));
  checkCopy(path.join(source, name), path.join(editable, 'source', name), 'editable/source/' + name);
}
fs.copyFileSync(path.join(source, 'README.md'), path.join(destination, '制作方針と投稿文.md'));

// Change only the known media-root prefix; leave unrelated string values intact.
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
for (const extension of ['ecproj', 'fcproj']) {
  const project = path.join(editable, 'projects', projectStem + '.' + extension);
  const parsed = JSON.parse(fs.readFileSync(project, 'utf8').replace(/^\uFEFF/, ''));
  fs.writeFileSync(project, JSON.stringify(relocate(parsed)) + '\n');
}
const ec = nativePath(path.join(editable, 'projects', projectStem + '.ecproj'));
const fc = nativePath(path.join(editable, 'projects', projectStem + '.fcproj'));
try {
  execute(EC, ['--project', ec, '--save', 'info', '--json']);
  execute(FC, ['--project', fc, '--save', 'inspect']);
  execute(EC, ['--project', ec, 'render-frame', '--comp', compName, '--time', '1.1', '--out', nativePath(path.join(editable, 'qa/relocated-effectcraft.png')), '--json']);
  execute(FC, ['--project', fc, 'render', '--seconds', '1.1', '--out', nativePath(path.join(editable, 'qa/relocated-filmcraft.png'))]);
} catch (error) {
  fs.writeFileSync(path.join(editable, 'qa/portable-package-failed.json'), JSON.stringify({error:error.message, receipts}, null, 2) + '\n');
  throw error;
}
if (hash(video) !== hash(localVideo)) throw Error('Final video hash changed during packaging.');
const report = {destination:nativePath(destination), bytes:fs.statSync(video).size, sha256:hash(video),
  coverSha256:hash(path.join(destination, 'cover.png')), nativeReopenAndRender:true,
  relinkedProjectHashes:{effectcraft:hash(path.join(editable, 'projects', projectStem + '.ecproj')), filmcraft:hash(path.join(editable, 'projects', projectStem + '.fcproj'))},
  copiedFileHashesBeforeRelink:copied, receipts};
fs.writeFileSync(path.join(editable, 'qa/portable-package.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({destination:report.destination, sha256:report.sha256, nativeReopenAndRender:true}));
