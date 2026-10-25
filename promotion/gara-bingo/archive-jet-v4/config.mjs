import fs from 'node:fs';
import path from 'node:path';
export const root = path.resolve(process.env.OSAYU_ARCHIVE_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-26/archive-jet-v4');
export const previousRoot = '/home/pui/Videos/Osayu-Bingo/2026-10-25/thankyou-wholeframe-v3';
export const destination = '/mnt/f/Users/pui/Documents/gara/bingo-thankyou-archive-jet-v4-20261026';
export const archive = '/mnt/f/Users/pui/Documents/gara/配信アーカイブ/20261024_アーカイブ.mp4';
export const TICKS = 254016000000;
export const fps = 30;
export const snap = t => Math.round(t*fps)/fps;
export const plans = [
  {id:'a-baibai',title:'A｜達成ラッシュ',song:'倍倍FIGHT!',artist:'CANDY TUNE',bpm:176,audioFile:'baibai-fight.m4a',previewSha256:'9462f11e4699ff67da2b53bdf777d55882552285e267b6d11ac78d1a4d98631f',audioStart:.210,accent:'#556EB4',second:'#CE82C8',tint:'#DCEBFF',index:0},
  {id:'b-patissier',title:'B｜ありがとうの紙ふぶき',song:'キス・ミー・パティシエ',artist:'CANDY TUNE',bpm:192,audioFile:'kiss-me-patissier.m4a',previewSha256:'62ebfa490c1a1f4f78818d4face046c4adc36100a689f2dda5ce98b82c00d26c',audioStart:.088,accent:'#A34F97',second:'#7F9FDA',tint:'#F6DDF4',index:1},
  {id:'c-disco',title:'C｜ビンゴ・パレード',song:'チョコレイト・ディスコ',artist:'Perfume',bpm:128,audioFile:'chocolate-disco.m4a',previewSha256:'e098b193b01a891aff57a3be845bc2dffcc5bfbfbc9e4005bc87348df87736f4',audioStart:.258,accent:'#705BAF',second:'#749ED8',tint:'#E5DFFD',index:2}
];
export function loadEdit(base = root) {
  const e = JSON.parse(fs.readFileSync(path.join(base,'edit-manifest.json'),'utf8'));
  if (!Array.isArray(e.shots) || !Array.isArray(e.voice) || !Number.isFinite(e.duration) || e.duration < 20 || e.duration > 40 || !Number.isFinite(e.drop) || e.drop < 0 || e.drop >= e.duration) throw Error('Invalid archive edit manifest.');
  let end = 0;
  const ids = new Set();
  for (const s of e.shots) {
    if (ids.has(s.id) || !/^[a-z0-9-]+$/.test(s.id) || Math.abs(s.start-end)>1/120 || s.end<=s.start || s.end>e.duration+1/120) throw Error('Noncontiguous or invalid shot: '+s.id);
    if (s.kind==='archive' && (!Number.isFinite(s.sourceIn) || s.sourceIn<0 || Math.abs(s.sourceOut-s.sourceIn-(s.end-s.start))>1/120)) throw Error('Archive clip clock mismatch: '+s.id);
    if (!['archive','title','board','reach','victory','teaser'].includes(s.kind)) throw Error('Unknown shot kind: '+s.kind);
    ids.add(s.id); end=s.end;
  }
  if (Math.abs(end-e.duration)>1/120) throw Error('Edit does not cover the complete duration.');
  for (const v of e.voice) if (!/^[a-z0-9-]+$/.test(v.id)||!Number.isFinite(v.sourceIn)||v.sourceIn<0||v.sourceOut<=v.sourceIn||v.start<0||v.start+v.sourceOut-v.sourceIn>e.duration+1/30) throw Error('Invalid voice event: '+v.id);
  return e;
}
