/** Fixed music gain QA. Reads audio samples only; never video frames. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
export async function checkMusic({root, planIds = ['a-baibai'], pcmOnly = false} = {}) {
  if (!root || !path.isAbsolute(root)) throw Error('An absolute delivery root is required.');
  const installed = '/home/pui/.local/share/ai-assistants-tools/whisper-venv/bin/python';
  const python = process.env.OSAYU_AUDIO_QA_PYTHON || (fs.existsSync(installed) ? installed : 'python3');
  await new Promise((resolve,reject) => {
    const args = [path.join(directory,'music-check.py'),root,'--plans',planIds.join(',')];
    if (pcmOnly) args.push('--pcm-only');
    const child = spawn(python,args,{stdio:['ignore','pipe','pipe']});
    let stderr = '';
    child.stdout.on('data',data => process.stdout.write(data));
    child.stderr.on('data',data => { stderr += data; process.stderr.write(data); });
    child.on('error',reject);
    child.on('close',code => code === 0 ? resolve() : reject(Error('Fixed music QA failed: '+stderr.slice(-1200))));
  });
  return JSON.parse(fs.readFileSync(path.join(root,'qa',pcmOnly ? 'music-pcm-check.json' : 'music-check.json'),'utf8'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), root=args.find(arg=>!arg.startsWith('--'));
  const plans=args.find(arg=>arg.startsWith('--plans='));
  try { await checkMusic({root,planIds:plans ? plans.slice(8).split(',') : undefined,pcmOnly:args.includes('--pcm-only')}); }
  catch(error) { console.error(JSON.stringify({status:'FAIL',error:error.message})); process.exitCode=1; }
}
