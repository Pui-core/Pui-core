import fs from 'node:fs';
import { file, np, FF, run, save } from './native.mjs';

// Candidate original game captures only; screenshots require visual inspection.
const samples = [
  { episode:3, second:16, proposed:'公園の柵・ベンチ' },
  { episode:5, second:20, proposed:'雨の軒・窓' },
  { episode:8, second:21, proposed:'額縁のような形' },
  { episode:10, second:20, proposed:'歯車・機械' },
  { episode:13, second:33, proposed:'アーチ・階段' }
];
for (const s of samples) {
  const input = file(`media/ep${String(s.episode).padStart(2,'0')}-game.mp4`);
  const out = file(`qa/firstcut04k-city-ep${s.episode}.png`);
  if (!fs.existsSync(input) || fs.existsSync(out)) throw new Error('Missing source or preserve prior image: ' + input);
  await run(FF,['-v','error','-ss',String(s.second),'-i',np(input),'-frames:v','1',np(out)],`firstcut04k-city-ep${s.episode}-extract.json`);
  s.file = out;
}
save('qa/firstcut04k-city-samples.json',{samples,source:'original captured gameplay, not final video',inspected:[],subjectiveWatch:false});
console.log(JSON.stringify(samples));
