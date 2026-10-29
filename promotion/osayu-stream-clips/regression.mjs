/** Regression: a valid direct-audio plan must reject an attached padded WAV. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const folder=fs.mkdtempSync(path.join(os.tmpdir(),'osayu-audio-regression-'));
try{
  const input=path.join(folder,'forbidden.json'),output=path.join(folder,'render');
  fs.writeFileSync(input,JSON.stringify({
    audioCutMode:'direct-container-seek-continuous-samples',
    sourceVideo:'/private/original.mp4',
    alignedAudio:'/private/research-only-padded.wav',
    clips:[],
  }));
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('./render.mjs',import.meta.url)),input,output,'preview'],{encoding:'utf8'});
  assert.equal(result.error,undefined);
  assert.notEqual(result.status,0,'The old defective input must not be accepted');
  assert.match(result.stderr,/Padded alignedAudio is forbidden/);
  assert.equal(fs.existsSync(output),false,'Reject before creating or rendering output');
  console.log('PASS: padded WAV rejected even with a valid direct-audio mode');
}finally{
  fs.rmSync(folder,{recursive:true});
}
