import fs from 'node:fs';
import { file, hash, save } from './native.mjs';

// Separate alternate edit: facts are from product/docs/verification-jump-response.md.
// Do not overwrite the existing 04j audio or any earlier generated voice.
const base = process.env.PROJECTP_VOICEVOX_URL || 'http://127.0.0.1:50031';
const request = async (route, options) => {
  const r = await fetch(base + route, options);
  if (!r.ok) throw new Error(`${route}: ${r.status}`);
  return r;
};
const version = await (await request('/version')).json();
const speakers = await (await request('/speakers')).json();
if (!speakers.find(s => s.name === '青山龍星' && s.styles.some(x => x.id === 13))) throw new Error('Narrator identity mismatch');
const prior = JSON.parse(fs.readFileSync(file('qa/narration.json')));
if (prior.engineVersion !== version || prior.speaker !== '青山龍星' || prior.styleId !== 13) throw new Error('Voice engine changed from previous narration');
const cues = [
  ['jump01', '最初のプレイテストでは、操作感はいい一方で、ジャンプの待ちが長く、タイムを狙う時の邪魔になると指摘されました。'],
  ['jump02', '調べると、押してすぐ離した入力が、着地の前後で長押しと同じ大きなジャンプに変わる場合がありました。'],
  ['jump03', '六十ヘルツの当時の計測では、同じタイミングの短押しで、旧版は高さおよそ五十七ピクセル、修正後はおよそ十九ピクセル。'],
  ['jump04', '空中にいる長さも四十六ティックから二十三ティックへ。短く押した意図が、短い跳躍として残ります。'],
  ['jump05', '一方、長く押した時の最大の高さは変えていません。着地直前に押して離した入力も記録し、接地した時に一回だけ受け取るようにしました。'],
  ['jump06', 'これは当時の入力計測の記録です。いま見ている短押しと長押しの収録は、修正前と修正後のプレイ比較ではありません。'],
  ['city01', '第一章では、重なる建物の輪郭が背景に続き、夜空には丸い月が浮かびます。'],
  ['city02', '第二章の別の画面では、背景が青みのある色に変わり、柱と建物が重なっています。']
];
const result = [];
for (const [id, text] of cues) {
  const out = file(`media/firstcut04k-${id}.wav`), queryPath = `source/firstcut04k-${id}-query.json`;
  if (fs.existsSync(out) || fs.existsSync(file(queryPath))) throw new Error(`Preserve existing ${id}`);
  const q = await (await request('/audio_query?text=' + encodeURIComponent(text) + '&speaker=13', { method: 'POST' })).json();
  q.speedScale = 1.06; q.intonationScale = 1.04; q.prePhonemeLength = .045; q.postPhonemeLength = .15;
  q.outputSamplingRate = 48000; q.outputStereo = true;
  const audio = await (await request('/synthesis?speaker=13', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })).arrayBuffer();
  fs.writeFileSync(out, Buffer.from(audio), { flag: 'wx' });
  save(queryPath, q);
  result.push({ id, text, file: `media/firstcut04k-${id}.wav`, sha256: hash(out) });
  console.log(JSON.stringify({ id, bytes: audio.byteLength }));
}
save('source/firstcut04k-extra-voice.json', { engineVersion: version, speaker: '青山龍星', styleId: 13,
  sources: ['production/product/docs/verification-jump-response.md', 'media/ep03-game.mp4', 'media/ep05-game.mp4'], cues: result, subjectiveListen: false });
