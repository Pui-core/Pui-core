import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {file} from '../native.mjs';
import {queryInputText,readingCacheMatches} from '../demo05/reading.mjs';
const read=p=>JSON.parse(fs.readFileSync(file(p)));
const gen=read('qa/demo06/reading-generation.json'), master=read('qa/demo06/master-binding.json');
const independent=read('qa/demo06/independent-reading-review.json');
const ids=['course1-15','course2-01','course5-12'];
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file('qa/demo06/reading-generation.json'))).digest('hex'),independent.reviewedArtifactSha256);
assert.deepEqual(gen.records.map(r=>r.id),ids);
assert.equal(gen.unchanged.length,73);assert.equal(master.other73.length,73);
for(const r of gen.records){
  assert.equal(r.spokenText,queryInputText(r.displayText));
  assert.ok(r.displayText.includes('鐘楼')&&r.spokenText.includes('しょうろう'));
  assert.equal(readingCacheMatches({text:r.displayText},r.displayText),false);
  assert.equal(readingCacheMatches({text:r.displayText,spokenText:r.spokenText},r.displayText),true);
  const b=fs.readFileSync(file(`source/demo06/queries/${r.id}.json`));
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.querySha256);
  const m=JSON.parse(b).accent_phrases[r.readingProof.phrase].moras.slice(r.readingProof.index,r.readingProof.index+4);
  assert.deepEqual(m.map(x=>[x.consonant||null,x.vowel]),[['sh','o'],[null,'o'],['r','o'],[null,'o']]);
  assert.ok(m.every(x=>Number.isFinite(x.vowel_length)&&x.vowel_length>0));
}
const plan=read('source/demo05/edit-plan.json').sections.flatMap(s=>s.units).filter(u=>u.wav);
assert.equal(plan.length,76);
for(const u of plan.filter(u=>!ids.includes(u.id)))assert.ok(readingCacheMatches(u,u.text));
assert.ok(master.allOutside3CueWindowsByteIdentical&&master.other73.every(r=>r.byteIdentical));
const meta=read('metadata/youtube-demo06.json'),nas=read('qa/demo06/nas-final-binding.json');
for(const kind of ['voice','bgm']){
  const f=read(`qa/demo06/${kind}-final-binding.json`),q=read(`qa/demo06/${kind}-audio-qa.json`),a=nas.archives.find(a=>a.kind===kind);
  assert.equal(f.sha256,q.finalSha256);assert.equal(a.sha256,f.sha256);
  assert.equal(kind==='bgm'?meta.videoSha256:meta.voiceOnlySha256,f.sha256);
  assert.ok(f.fullDecode&&f.allH264PacketsIncludingTimestampsIdentical&&f.frames===18194&&f.seconds>=600&&f.nativeOnline===8);
  assert.ok(q.headBodyTailPass&&q.count===76&&q.maximumLagSamples===0&&q.minCorrelation>.98&&q.truePeak<=-.9);
  assert.ok(a.hashMatched&&a.sourceUnchanged&&a.decodedFromNas&&a.decoderExit===0&&!a.sourceDeleted);
}
assert.equal(meta.published,false);assert.equal(meta.deliveryVersion,'v06');
console.log(JSON.stringify({passed:true,repaired:3,unchanged:73,aacCuesPerVersion:76,fullDecodeVersions:2,nasVersions:2,frames:18194,published:false}));
