import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Original instrumental score. No external recording, melody or sample is used.
export const DURATION = 22;
export const SAMPLE_RATE = 48000;
const FF_LINK = '/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const TAU = Math.PI * 2;
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

export function makeScore(root) {
  const media = path.join(path.resolve(root), 'media');
  fs.mkdirSync(media, {recursive: true});
  const length = Math.round(DURATION * SAMPLE_RATE);
  const left = new Float64Array(length);
  const right = new Float64Array(length);
  let seed = 830024;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const clip = x => Math.max(0, Math.min(1, x));
  function sound(at, duration, synth, level, pan = 0) {
    const start = Math.round(at * SAMPLE_RATE);
    const count = Math.round(duration * SAMPLE_RATE);
    const gl = Math.sqrt((1 - pan) / 2), gr = Math.sqrt((1 + pan) / 2);
    for (let n = 0; n < count && n + start < length; n++) {
      if (n + start < 0) continue;
      const v = synth(n / SAMPLE_RATE, n / count) * level;
      left[start + n] += v * gl;
      right[start + n] += v * gr;
    }
  }
  function pluck(at, midi, level = .07, pan = 0, duration = 1.25) {
    const f = hz(midi);
    const voice = t => {
      const a = Math.min(1, t / .006);
      return a * (Math.sin(TAU * f * t) * Math.exp(-t * 3.8)
        + .38 * Math.sin(TAU * f * 2.002 * t) * Math.exp(-t * 8)
        + .15 * Math.sin(TAU * f * 3.001 * t) * Math.exp(-t * 12)
        + .08 * Math.sin(TAU * f * 4.003 * t) * Math.exp(-t * 16));
    };
    sound(at, duration, voice, level, pan);
    sound(at + .201, duration, voice, level * .17, -pan * .8);
    sound(at + .402, duration, voice, level * .09, pan * .7);
  }
  function pad(at, notes, duration, level = .035) {
    notes.forEach((m, index) => {
      const f = hz(m), pan = (index / (notes.length - 1) - .5) * 1.3;
      sound(at, duration, (t, p) => {
        const env = clip(t / .11) * clip((duration - t) / .6);
        const vibrato = .0006 * Math.sin(TAU * 4.3 * t + index);
        return env * (.52 * Math.sin(TAU * f * (1 + vibrato) * t)
          + .3 * Math.sin(TAU * f * 1.0025 * t)
          + .12 * Math.sin(TAU * f * 2 * t));
      }, level, pan);
    });
  }
  const bpm = 112, beat = 60 / bpm;
  const chords = [
    {root: 50, notes: [62, 66, 69, 73, 76]},
    {root: 47, notes: [62, 66, 69, 71, 76]},
    {root: 43, notes: [59, 62, 66, 69, 74]},
    {root: 45, notes: [61, 64, 69, 71, 74]},
  ];
  // The sparse 7-12.5s middle leaves room for viewers to read the board.
  for (let bar = 0; bar * 4 * beat < 20.6; bar++) {
    const at = bar * 4 * beat, chord = chords[bar % 4];
    pad(at, chord.notes, Math.min(4 * beat + .65, 21.8 - at), .023);
    for (let step = 0; step < 8; step++) {
      const t = at + step * beat / 2;
      if (t > 20.7) continue;
      const density = t >= 7 && t < 12.5 ? .72 : 1;
      const phrase = [[0, 2, 4, 1, 3, 2, 1, 4], [2, 4, 3, 1, 0, 2, 4, 1]][bar % 2];
      if (step % 2 === 0 || bar % 2 === 1) {
        pluck(t + (step % 2 ? .017 : 0), chord.notes[phrase[step]] + (step === 7 ? 12 : 0), .055 * density, step % 2 ? .32 : -.32);
      }
    }
  }
  for (let b = 0; b * beat < 20.7; b++) {
    const at = b * beat, chord = chords[Math.floor(b / 4) % 4];
    const space = at >= 7 && at < 12.5;
    if (!space || b % 2 === 0) {
      sound(at, .31, t => {
        const phase = 49 * t + 3.7 * (1 - Math.exp(-t * 38));
        return Math.sin(TAU * phase) * Math.exp(-t * 17) * Math.min(1, t / .0025);
      }, .23);
    }
    const bassPitch = hz(chord.root - 12 + (b % 8 === 7 ? 7 : 0));
    sound(at, beat * .87, (t, p) => {
      const env = clip(t / .012) * clip((1 - p) / .22);
      return env * (Math.sin(TAU * bassPitch * t) + .16 * Math.sin(TAU * bassPitch * 2 * t));
    }, space ? .052 : .07);
    if (b % 2 === 1 && !space) {
      let prior = 0;
      sound(at, .17, t => {
        const n = random(), high = n - prior; prior = n * .5 + prior * .5;
        return (.37 * high + .12 * Math.sin(TAU * 182 * t)) * Math.exp(-t * 28) * Math.min(1, t / .002);
      }, .075, -.08);
    }
    if (b % 2 === 0 || !space) {
      let prior = 0;
      sound(at + beat * .53, .058, t => {
        const n = random(), high = n - prior; prior = n;
        return high * Math.exp(-t * 91) * Math.min(1, t / .0015);
      }, .026, b % 2 ? -.52 : .52);
    }
  }
  // Rounded UI pop + brief airy transitions, synced to visual chapter changes.
  for (const [index, at] of [0, 2.8, 7, 12.5, 17].entries()) {
    if (at > 0) {
      let smooth = 0;
      sound(at - .16, .22, (t, p) => {
        smooth = smooth * .83 + random() * .17;
        return smooth * Math.sin(Math.PI * p) ** 2;
      }, .095, index % 2 ? -.35 : .35);
    }
    sound(at, .18, t => Math.sin(TAU * (300 * t + .85 * (1 - Math.exp(-t * 24)))) * Math.exp(-t * 31) * Math.min(1, t / .003), .08);
    [74, 78, 81].forEach((m, k) => pluck(at + k * .055, m, index === 4 ? .07 : .045, (k - 1) * .35, 1.1));
  }
  // Final tonic resolves before the small tail rather than ending mid-note.
  pad(20.65, [62, 66, 69, 73], 1.35, .031);
  [74, 78, 81, 86].forEach((m, i) => pluck(20.65 + i * .065, m, .05, (i - 1.5) * .24, 1.3));
  let peak = 0, sum = 0, previousL = 0, previousR = 0, hpL = 0, hpR = 0;
  for (let n = 0; n < length; n++) {
    const t = n / SAMPLE_RATE;
    const env = clip(t / .008) * clip((DURATION - t) / .35);
    // Gentle DC removal and bus saturation keep the generated transients smooth.
    hpL = .997 * (hpL + left[n] - previousL); previousL = left[n];
    hpR = .997 * (hpR + right[n] - previousR); previousR = right[n];
    left[n] = Math.tanh(hpL * 1.1) * env;
    right[n] = Math.tanh(hpR * 1.1) * env;
    peak = Math.max(peak, Math.abs(left[n]), Math.abs(right[n]));
    sum += left[n] ** 2 + right[n] ** 2;
  }
  const gain = .69 / peak;
  const wav = Buffer.alloc(44 + length * 4);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24); wav.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
  for (let n = 0; n < length; n++) {
    wav.writeInt16LE(Math.round(left[n] * gain * 32767), 44 + n * 4);
    wav.writeInt16LE(Math.round(right[n] * gain * 32767), 46 + n * 4);
  }
  const original = path.join(media, 'original-score.wav');
  const normalized = path.join(media, 'normalized.wav');
  fs.writeFileSync(original, wav);
  const ffmpeg = fs.realpathSync(FF_LINK);
  function win(p) {
    const r = spawnSync('wslpath', ['-w', p], {encoding: 'utf8'});
    if (r.status) throw new Error(r.stderr);
    return r.stdout.trim();
  }
  function ff(args) {
    const r = spawnSync(ffmpeg, args, {encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024});
    if (r.error || r.status !== 0) throw new Error(r.error?.message || r.stderr);
    return r.stderr;
  }
  const first = ff(['-hide_banner', '-i', win(original), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json', '-f', 'null', '-']);
  const measured = JSON.parse(first.match(/\{[\s\S]*\}/)?.[0] || '{}');
  const filter = `loudnorm=I=-16:TP=-1.5:LRA=8:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true:print_format=json`;
  const second = ff(['-hide_banner', '-y', '-i', win(original), '-af', filter, '-ar', String(SAMPLE_RATE), '-c:a', 'pcm_s24le', win(normalized)]);
  const normalizedReport = JSON.parse(second.match(/\{[\s\S]*\}/)?.[0] || '{}');
  const verified = ff(['-hide_banner', '-i', win(normalized), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json', '-f', 'null', '-']);
  const verification = JSON.parse(verified.match(/\{[\s\S]*\}/)?.[0] || '{}');
  if (!Number.isFinite(Number(verification.input_i)) || Number(verification.input_tp) > -1) {
    throw new Error('Audio loudness / peak verification failed: ' + JSON.stringify(verification));
  }
  const report = {
    duration: DURATION, sampleRate: SAMPLE_RATE, channels: 2, bpm,
    source: 'Deterministic original synthesis; no borrowed recordings or melodies.',
    original, normalized, bytesOriginal: fs.statSync(original).size, bytesNormalized: fs.statSync(normalized).size,
    rawPeakDb: 20 * Math.log10(.69), rawRmsDb: 20 * Math.log10(Math.sqrt(sum / (length * 2)) * gain),
    firstPass: measured, normalizedReport, verification,
    audition: 'Not claimed; technical measurement only.',
  };
  fs.writeFileSync(path.join(media, 'audio-qa.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2];
  if (!root) throw new Error('Usage: node audio.mjs /path/to/delivery-root');
  console.log(JSON.stringify(makeScore(root), null, 2));
}
