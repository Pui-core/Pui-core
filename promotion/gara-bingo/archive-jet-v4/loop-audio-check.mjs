/** A-only loop audio QA. Never reads or displays video frames. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
export async function checkLoopAudio({root}={}) {
  if(!root||!path.isAbsolute(root))throw Error('Absolute loop production root required.');
  const installed='/home/pui/.local/share/ai-assistants-tools/whisper-venv/bin/python';
  const python=process.env.OSAYU_AUDIO_QA_PYTHON||(fs.existsSync(installed)?installed:'python3');
  await new Promise((resolve,reject)=>{
    const child=spawn(python,[path.join(directory,'loop-audio-check.py'),root],{stdio:['ignore','pipe','pipe']});
    let stderr='';child.stdout.on('data',b=>process.stdout.write(b));
    child.stderr.on('data',b=>{stderr+=b;process.stderr.write(b);});
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('Loop audio QA failed: '+stderr.slice(-1200))));
  });
  return JSON.parse(fs.readFileSync(path.join(root,'qa/loop-audio-check.json'),'utf8'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {await checkLoopAudio({root:process.argv[2]});}
  catch(error){console.error(JSON.stringify({status:'FAIL',error:error.message}));process.exitCode=1;}
}
