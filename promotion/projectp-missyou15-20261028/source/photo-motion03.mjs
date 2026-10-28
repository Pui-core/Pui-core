import { file, np, PC, run, hash, save } from './native.mjs';
const clean = file('media/diary-anonymized.png');
const out = file('projects/diary-anonymized.pcraft');
const cmds = [
  ['file.placeEmbedded', { path: np(clean), scale: 100, fit: false, center: [325, 400], smartObject: true }],
  ['type.create', { x: 20, y: 540, text: '相手', font: 'Meiryo', size: 36, weight: 700, color: '#49363F', name: 'Anonymized partner label' }]
];
const args = ['run', '--new', JSON.stringify({ width: 650, height: 800, name: 'MISSYOU diary / QA anonymized', background: '#E9DDC9', resolution: 72 })];
for (const [id, params] of cmds) args.push('--cmd', id, '--params', JSON.stringify(params));
await run(PC, [...args, '--out', np(out)], 'pc-diary-motion03.json');
await run(PC, ['convert', np(out), np(file('media/diary-safe.png')), '--format', 'png'], 'pc-diary-motion03-png.json');
save('qa/photo-motion03-binding.json', { inputSha256: hash(clean), projectSha256: hash(out), pngSha256: hash(file('media/diary-safe.png')), provenance: 'QA final diary screenshot, source-cropped and anonymized before import; partner label is an editorial replacement', isPrivateQa: true });
console.log('PhotoCraft anonymized diary asset exported');
