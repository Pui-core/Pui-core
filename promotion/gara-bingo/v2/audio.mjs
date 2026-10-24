import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const DURATION = 22;
export const SAMPLE_RATE = 48000;
export const BPM = 150;
export const CUTS = [0, .4, .8, 1.6, 2.4, 3.2, 4.8, 6.4, 8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 20.8];
const TAU = Math.PI * 2;
const beat = 60 / BPM;
const clip = v => Math.max(0, Math.min(1, v));
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const FF_LINK = '/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
// A small processing guard keeps the 48kHz export below the -1.5 dBTP ceiling.
const PROCESSING_TP = -1.7;

// Entirely original deterministic synthesis: no recordings, voice or song quotes.
export function makeScore(root) {
  const media = path.join(path.resolve(root), 'media');
  fs.mkdirSync(media, {recursive: true});
  const length = Math.round(SAMPLE_RATE * DURATION);
  const left = new Float64Array(length), right = new Float64Array(length);
  let seed = 83202402;
  const noise = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  function sound(at, duration, synth, level, pan = 0) {
    const start = Math.round(at * SAMPLE_RATE), count = Math.round(duration * SAMPLE_RATE);
    const gl = Math.sqrt((1 - pan) * .5), gr = Math.sqrt((1 + pan) * .5);
    for (let n = 0; n < count && start + n < length; n++) {
      if (start + n < 0) continue;
      const v = synth(n / SAMPLE_RATE, n / count) * level;
      left[start + n] += v * gl;
      right[start + n] += v * gr;
    }
  }
  // Smooth finite-harmonic wavetable avoids aliased saw edges at high notes.
  const size = 4096, table = new Float64Array(size + 1);
  for (let i = 0; i <= size; i++) {
    const phase = i / size;
    for (let harmonic = 1; harmonic <= 8; harmonic++) {
      table[i] += Math.sin(TAU * phase * harmonic) * Math.exp(-harmonic * .17) / harmonic;
    }
  }
  const osc = phase => {
    const index = (phase - Math.floor(phase)) * size, lower = Math.floor(index), f = index - lower;
    return table[lower] * (1 - f) + table[lower + 1] * f;
  };
  function kick(at, gain = .46) {
    sound(at, .29, t => {
      const env = Math.exp(-t * 19) * Math.min(1, t / .0015);
      const phase = 47 * t + 2.7 * (1 - Math.exp(-t * 48));
      return Math.sin(TAU * phase) * env + .08 * noise() * Math.exp(-t * 210);
    }, gain);
  }
  function clap(at, gain = .15) {
    let low = 0;
    sound(at, .19, t => {
      const n = noise(); low = low * .62 + n * .38;
      const burst = Math.exp(-t * 35) + (t >= .014 ? .6 * Math.exp(-(t - .014) * 50) : 0)
        + (t >= .027 ? .4 * Math.exp(-(t - .027) * 45) : 0);
      return ((n - low) * .65 * burst + Math.sin(TAU * 185 * t) * .16 * Math.exp(-t * 25)) * Math.min(1, t / .001);
    }, gain, -.03);
  }
  function hat(at, gain = .026, opened = false, pan = .35) {
    let previous = 0;
    sound(at, opened ? .15 : .045, t => {
      const n = noise(), high = n - previous; previous = n;
      return high * Math.exp(-t * (opened ? 26 : 100)) * Math.min(1, t / .001);
    }, gain, pan);
  }
  function impact(at, gain = .22) {
    sound(at, .55, t => {
      const phase = 36 * t + .68 * (1 - Math.exp(-t * 22));
      return Math.sin(TAU * phase) * Math.exp(-t * 8) * Math.min(1, t / .003);
    }, gain);
    let smooth = 0;
    sound(at, .2, t => {
      smooth = smooth * .75 + noise() * .25;
      return smooth * Math.exp(-t * 24) * Math.min(1, t / .001);
    }, .12, -.2);
  }
  function sweep(at, duration = .18, level = .11) {
    let smooth = 0;
    sound(at - duration, duration + .075, (t, p) => {
      const n = noise(); smooth = smooth * (.94 - p * .55) + n * (.06 + p * .55);
      return smooth * Math.sin(Math.PI * p) ** 1.3;
    }, level, .3);
  }
  function pluck(at, midi, gain = .07, pan = 0, length = .54, echoed = true) {
    const f = hz(midi);
    const synth = t => Math.min(1, t / .004) * Math.exp(-t * 6.4)
      * (Math.sin(TAU * f * t) + .29 * Math.sin(TAU * f * 2.002 * t) * Math.exp(-t * 7)
        + .13 * Math.sin(TAU * f * 3.001 * t) * Math.exp(-t * 11));
    sound(at, length, synth, gain, pan);
    if (echoed) {
      sound(at + .3, length, synth, gain * .16, -pan * .85);
      sound(at + .6, length, synth, gain * .06, pan * .85);
    }
  }
  const chords = [
    {root: 42, notes: [66, 69, 73, 76, 80]}, // F#m9
    {root: 38, notes: [62, 66, 69, 73, 76]}, // Dmaj9
    {root: 45, notes: [61, 64, 69, 71, 76]}, // Aadd9
    {root: 40, notes: [59, 64, 68, 71, 78]}, // Eadd9
  ];
  function chord(at, chord, duration, level = .037, tail = false) {
    chord.notes.forEach((midi, index) => {
      const f = hz(midi), pan = (index - 2) * .32;
      sound(at, duration, (t, p) => {
        const attack = Math.min(1, t / .009), release = clip((duration - t) / (tail ? .4 : .12));
        const phaseBeat = ((at + t - 3.2) % beat + beat) % beat;
        const duck = tail ? 1 : .12 + .88 * (1 - Math.exp(-phaseBeat * 20));
        const shimmer = tail ? .43 : 1;
        return attack * release * duck * shimmer
          * (.49 * osc(f * .9975 * t + index * .12) + .49 * osc(f * 1.0025 * t + index * .12)
            + .14 * Math.sin(TAU * f * 2 * t));
      }, level, pan);
    });
  }
  // Immediate eight-beat build: impact, syncopated hook and rising snare density.
  impact(0, .25); kick(0, .38);
  const introNotes = [81, 78, 76, 73, 78, 81, 80, 85];
  for (let b = 0; b < 8; b++) {
    const at = b * beat;
    pluck(at, introNotes[b], .072, b % 2 ? .48 : -.48, .62);
    if (b === 2 || b === 4 || b === 6) kick(at, .28);
    if (b % 2 === 1) clap(at, .1);
    hat(at + .2, .02, false, b % 2 ? -.55 : .55);
  }
  chord(0, chords[0], 1.56, .018);
  chord(1.6, chords[1], 1.53, .021);
  for (let i = 0; i < 8; i++) clap(2.4 + i * .1, .045 + i * .006);
  sweep(3.2, .52, .18);
  // A clear drop, with variation at 8, 12.8 and 16 seconds.
  for (let bar = 0; 3.2 + bar * 1.6 < 19.19; bar++) {
    const at = 3.2 + bar * 1.6, ch = chords[bar % 4];
    const halfTime = at >= 12.8 && at < 16;
    chord(at, ch, 1.58, at >= 16 ? .047 : .043);
    for (let b = 0; b < 4; b++) {
      const t = at + b * beat;
      if (!halfTime || b === 0 || b === 3) kick(t, b === 0 ? .48 : .38);
      if (halfTime ? b === 2 : b % 2 === 1) clap(t, .17);
      const f = hz(ch.root + (b === 3 && bar % 2 ? 7 : 0));
      sound(t, beat * .96, (s, p) => {
        const env = Math.min(1, s / .005) * clip((1 - p) / .14);
        const duck = .24 + .76 * (1 - Math.exp(-s * 27));
        return env * duck * (Math.sin(TAU * f * s) + .22 * Math.sin(TAU * f * 2 * s) + .065 * osc(f * 3 * s));
      }, .12);
      hat(t + .2, .034, b === 3, b % 2 ? -.48 : .48);
      if (bar % 2 === 1 || at >= 16) hat(t + .3, .017, false, -.4);
    }
    // Original short call-and-response motif; gaps keep text readable.
    const motif = bar % 2 ? [4, 2, 1, 3] : [2, 4, 3, 1];
    const rhythm = bar % 2 ? [.1, .6, .95, 1.3] : [0, .5, .8, 1.2];
    if (!halfTime || bar % 2 === 0) {
      motif.forEach((idx, n) => pluck(at + rhythm[n], ch.notes[idx] + (n === 3 ? 12 : 0), .072, n % 2 ? .42 : -.42, .75));
    }
  }
  // Tactile cut punctuation is varied rather than a loud impact on every edit.
  for (const at of [.4, .8, 1.6, 2.4, 4.8, 6.4, 8, 9.6, 11.2, 12.8, 14.4, 16, 17.6]) {
    if ([1.6, 2.4, 6.4, 9.6, 12.8, 16, 17.6].includes(at)) sweep(at, at === 16 ? .3 : .15, .085);
    sound(at, .09, t => Math.sin(TAU * (520 * t + .55 * (1 - Math.exp(-t * 70)))) * Math.exp(-t * 68) * Math.min(1, t / .002), .047, at % 1.6 ? -.25 : .25);
  }
  for (const at of [3.2, 8, 12.8, 16]) impact(at, at === 3.2 ? .3 : .16);
  // The last 2.8s release the pressure so the date can actually be read.
  sweep(19.2, .18, .07);
  impact(19.2, .1);
  chord(19.2, chords[2], 2.8, .035, true);
  [76, 81, 85].forEach((m, i) => pluck(19.2 + i * .06, m, .052, (i - 1) * .4, 1.2));
  [81, 85, 88].forEach((m, i) => pluck(20.8 + i * .055, m, .034, (i - 1) * .4, 1.15));

  let priorL = 0, priorR = 0, hpL = 0, hpR = 0, peak = 0, squares = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = clip(t / .002) * clip((DURATION - t) / .32);
    hpL = .9974 * (hpL + left[i] - priorL); priorL = left[i];
    hpR = .9974 * (hpR + right[i] - priorR); priorR = right[i];
    left[i] = Math.tanh(hpL * 1.4) * env;
    right[i] = Math.tanh(hpR * 1.4) * env;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    squares += left[i] ** 2 + right[i] ** 2;
  }
  const gain = .77 / peak;
  const wav = Buffer.alloc(44 + length * 4);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24); wav.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
  for (let i = 0; i < length; i++) {
    wav.writeInt16LE(Math.round(left[i] * gain * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(right[i] * gain * 32767), 46 + i * 4);
  }
  const original = path.join(media, 'original-score.wav'), normalized = path.join(media, 'normalized.wav');
  fs.writeFileSync(original, wav);
  const ffmpeg = fs.realpathSync(FF_LINK);
  function win(p) {
    const result = spawnSync('wslpath', ['-w', p], {encoding: 'utf8'});
    if (result.status) throw new Error(result.stderr);
    return result.stdout.trim();
  }
  function exec(exe, args) {
    const result = spawnSync(exe, args, {encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024});
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr);
    return result;
  }
  function measure(file) {
    const log = exec(ffmpeg, ['-hide_banner', '-i', win(file), '-af', `loudnorm=I=-14:TP=${PROCESSING_TP}:LRA=8:print_format=json`, '-f', 'null', '-']).stderr;
    return JSON.parse(log.match(/\{[\s\S]*\}/)?.[0] || '{}');
  }
  const firstPass = measure(original);
  const filter = `loudnorm=I=-14:TP=${PROCESSING_TP}:LRA=8:measured_I=${firstPass.input_i}:measured_TP=${firstPass.input_tp}:measured_LRA=${firstPass.input_lra}:measured_thresh=${firstPass.input_thresh}:offset=${firstPass.target_offset}:linear=true:print_format=json`;
  const normalization = exec(ffmpeg, ['-hide_banner', '-y', '-i', win(original), '-af', filter, '-ar', String(SAMPLE_RATE), '-c:a', 'pcm_s24le', win(normalized)]);
  const normalizationReport = JSON.parse(normalization.stderr.match(/\{[\s\S]*\}/)?.[0] || '{}');
  const verification = measure(normalized);
  const probe = JSON.parse(exec(path.join(path.dirname(ffmpeg), 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels,bits_per_sample', '-of', 'json', win(normalized)]).stdout);
  const silenceLog = exec(ffmpeg, ['-hide_banner', '-i', win(normalized), '-af', 'silencedetect=noise=-45dB:d=0.25', '-f', 'null', '-']).stderr;
  const silenceEvents = silenceLog.split(/\r?\n/).filter(line => /silence_start|silence_end/.test(line));
  if (Math.abs(Number(verification.input_i) + 14) > .3 || Number(verification.input_tp) > -1.49
    || Number(probe.format.duration) !== DURATION || silenceEvents.length) {
    throw new Error('Audio verification failed: ' + JSON.stringify({verification, probe, silenceEvents}));
  }
  const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const report = {
    duration: DURATION, sampleRate: SAMPLE_RATE, channels: 2, bpm: BPM, cutSeconds: CUTS,
    targetIntegratedLufs: -14, maximumTruePeakDbtp: -1.5, processingPeakGuardDbtp: PROCESSING_TP,
    arrangement: {build: [0, 3.2], drop: [3.2, 19.2], readingSpace: [19.2, 22], halfTime: [12.8, 16]},
    source: 'Original deterministic finite-harmonic synthesis; no borrowed recordings, melody or voice.',
    original, normalized, bytesOriginal: fs.statSync(original).size, bytesNormalized: fs.statSync(normalized).size,
    sha256Original: sha256(original), sha256Normalized: sha256(normalized),
    rawPeakDb: 20 * Math.log10(.77), rawRmsDb: 20 * Math.log10(Math.sqrt(squares / (length * 2)) * gain),
    firstPass, normalizationReport, verification, probe, silenceEvents,
    audition: 'Technical measurements verified; human playback quality is not claimed.',
  };
  fs.writeFileSync(path.join(media, 'audio-qa.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node audio.mjs /path/to/delivery-root');
  console.log(JSON.stringify(makeScore(process.argv[2]), null, 2));
}
