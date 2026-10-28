import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { file } from './native.mjs';

// Build only a review entry for the existing, unaccepted F master.
const destination = JSON.parse(fs.readFileSync(file('qa/firstcut04j-stage.json'))).destination;
const render = JSON.parse(fs.readFileSync(file('qa/emberwake-firstcut04j-f-native-render.json')));
const scan = JSON.parse(fs.readFileSync(file('qa/emberwake-firstcut04j-f-native-allframe-scan.json')));
const repair = JSON.parse(fs.readFileSync(file('qa/firstcut04j-repair-verification.json')));
if (!render.fullAvDecode || !scan.pass || !repair.allNativeRepairFramesMatched ||
    scan.videoSha256 !== render.sha256 || repair.videoSha256 !== render.sha256) {
  throw new Error('The 04j master or its recorded checks do not agree');
}
const references = [render.video, 'covers/emberwake-firstcut04.png', 'covers/emberwake-firstcut04.pcraft',
  'projects/emberwake-firstcut04j.ecproj', 'projects/emberwake-firstcut04j.fcproj'];
for (const reference of references) if (!fs.existsSync(path.join(destination, reference))) throw new Error('Missing: ' + reference);
const sourceIndex = file('index-firstcut04j.html');
const destinationIndex = path.join(destination, 'index.html');
if (fs.existsSync(sourceIndex) || fs.existsSync(destinationIndex)) throw new Error('Preserve existing entry');
const html = fs.readFileSync(file('index-firstcut04h.html'), 'utf8')
  .replaceAll('04h', '04j')
  .replace('第1話の説明に合わせて実映像を差し替え、序盤の注目点と画角を調整しました。', '主人公の画角と字幕の切替を修正し、保存された原画の比較に注目箇所を加えました。')
  .replace('全AVデコード、113句の音声頭尾、既知の全黒・カラーバー、修正した592フレームの対応を検査。', '全AVデコード、既知の全黒・カラーバー、修正した1,151フレームの対応を検査。')
  .replace('e3d65a7e1a1f856c9e5c1bae682c4558c84e0f95e6e54231047e67f6cd800ec0', render.sha256);
const credits = 'metadata/firstcut04-credits.txt';
fs.mkdirSync(path.join(destination, 'metadata'), { recursive: true });
if (fs.existsSync(path.join(destination, credits))) throw new Error('Preserve existing credits');
await pipeline(fs.createReadStream(file(credits), { highWaterMark: 4096 }),
  fs.createWriteStream(path.join(destination, credits), { flags: 'wx', highWaterMark: 4096 }));
fs.writeFileSync(sourceIndex, html, { flag: 'wx' });
fs.writeFileSync(destinationIndex, html, { flag: 'wx' });
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if (hash(sourceIndex) !== hash(destinationIndex) || hash(file(credits)) !== hash(path.join(destination, credits))) {
  throw new Error('Review entry or credits differ');
}
console.log(JSON.stringify({ destination: destinationIndex, sha256: render.sha256, published: false, creativeAccepted: false }));
