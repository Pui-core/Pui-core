/** Audio-only continuity/pitch QA. No video frame is read or displayed. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
export async function checkAudio({root, skipFinal = false, calibrateOnly = false, planIds = ['a-baibai']} = {}) {
  if (!root || !path.isAbsolute(root)) throw Error('An absolute audio delivery root is required.');
  const configured = process.env.OSAYU_AUDIO_QA_PYTHON;
  const installed = '/home/pui/.local/share/ai-assistants-tools/whisper-venv/bin/python';
  const python = configured || (fs.existsSync(installed) ? installed : 'python3');
  const args = [path.join(directory, 'audio-check.py'), root, '--plans', planIds.join(',')];
  if (skipFinal) args.push('--skip-final');
  if (calibrateOnly) args.push('--calibrate-only');
  await new Promise((resolve, reject) => {
    const child = spawn(python, args, {stdio:['ignore', 'pipe', 'pipe']});
    let stderr = '';
    child.stdout.on('data', data => process.stdout.write(data));
    child.stderr.on('data', data => { stderr += data; process.stderr.write(data); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(Error('Audio numeric QA failed: ' + stderr.slice(-1200))));
  });
  const name = calibrateOnly ? 'audio-pitch-calibration.json' : skipFinal ? 'audio-waveform-source-check.json' : 'audio-waveform-check.json';
  return JSON.parse(fs.readFileSync(path.join(root, 'qa', name), 'utf8'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), root = args.find(arg => !arg.startsWith('--'));
  const plans = args.find(arg => arg.startsWith('--plans='));
  try {
    await checkAudio({root, skipFinal:args.includes('--skip-final'), calibrateOnly:args.includes('--calibrate-only'),
      planIds:plans ? plans.slice('--plans='.length).split(',') : ['a-baibai']});
  } catch (error) {
    console.error(JSON.stringify({status:'FAIL', error:error.message})); process.exitCode = 1;
  }
}
