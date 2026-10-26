import fs from 'node:fs';
import path from 'node:path';
export const root = path.resolve(process.env.OSAYU_ARCHIVE_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-26/a-loop-v8');
export const version = 'a-loop-v8';
export const playbackRate = 1.25;
export const previousRoot = '/home/pui/Videos/Osayu-Bingo/2026-10-25/thankyou-wholeframe-v3';
export const destination = '/mnt/f/Users/pui/Documents/gara/ビンゴ達成ありがとう_A案_予告からつながるループ版_20261026';
export const archive = '/mnt/f/Users/pui/Documents/gara/配信アーカイブ/20261024_アーカイブ.mp4';
export const TICKS = 254016000000;
export const fps = 30;
export const snap = t => Math.round(t*fps)/fps;
export const plans = [
  {id:'a-baibai',title:'A｜予告からつながる達成ループ',song:'倍倍FIGHT!',artist:'CANDY TUNE',bpm:176,audioFile:'baibai-fight.m4a',previewSha256:'9462f11e4699ff67da2b53bdf777d55882552285e267b6d11ac78d1a4d98631f',audioStart:.210,accent:'#556EB4',second:'#CE82C8',tint:'#DCEBFF',index:0}
];
export function loadEdit(base = root) {
  const e = JSON.parse(fs.readFileSync(path.join(base,'edit-manifest.json'),'utf8'));
  if (!Array.isArray(e.shots) || !Array.isArray(e.voice) || !Number.isFinite(e.duration) || e.duration < 20 || e.duration > 40 || !Number.isFinite(e.drop) || e.drop < 0 || e.drop >= e.duration) throw Error('Invalid archive edit manifest.');
  let end = 0;
  const ids = new Set();
  for (const s of e.shots) {
    if (ids.has(s.id) || !/^[a-z0-9-]+$/.test(s.id) || !Number.isFinite(s.start)||!Number.isFinite(s.end)||Math.abs(s.start-end)>1/120 || s.end<=s.start || s.end>e.duration+1/120) throw Error('Noncontiguous or invalid shot: '+s.id);
    const rate=s.playbackRate??1;
    if (s.kind==='archive' && (!Number.isFinite(s.sourceIn)||!Number.isFinite(s.sourceOut)||!Number.isFinite(rate)||rate<=0||s.sourceIn<0 || Math.abs((s.sourceOut-s.sourceIn)/rate-(s.end-s.start))>1e-6)) throw Error('Archive clip clock mismatch: '+s.id);
    if (!['archive','title','board','reach','victory','teaser'].includes(s.kind)) throw Error('Unknown shot kind: '+s.kind);
    ids.add(s.id); end=s.end;
  }
  if (Math.abs(end-e.duration)>1/120) throw Error('Edit does not cover the complete duration.');
  const voiceIds=new Set();
  for (const v of e.voice) {const rate=v.playbackRate??1,duration=(v.sourceOut-v.sourceIn)/rate;if (voiceIds.has(v.id)||!/^[a-z0-9-]+$/.test(v.id)||![v.sourceIn,v.sourceOut,v.start,rate,duration].every(Number.isFinite)||rate<=0||v.sourceIn<0||v.sourceOut<=v.sourceIn||v.start<0||v.start+duration>e.duration+1/30||v.duration!==undefined&&Math.abs(v.duration-duration)>1e-6) throw Error('Invalid voice event: '+v.id);voiceIds.add(v.id);}
  if(e.compositionMode==='live-during-all-speech') {
    if(e.musicStart!==0||e.musicGainMode!=='constant')throw Error('Live revision requires continuous fixed-gain music.');
    for(const v of e.voice){const s=e.shots.find(s=>s.kind==='archive'&&s.voiceId===v.id),rate=v.playbackRate??1;
      if(!s||s.start>v.start+1e-6||s.end<v.start+v.duration-1e-6||Math.abs(s.playbackRate-rate)>1e-6||Math.abs(s.sourceIn+(v.start-s.start)*rate-v.sourceIn)>1e-6)throw Error('Speech is not covered by matching live footage: '+v.id);}
  }
  if(e.loop?.enabled){const loop=e.loop,head=e.voice.find(v=>v.id===loop.voiceJoin?.headCueId),tail=e.voice.find(v=>v.id===loop.voiceJoin?.prefixCueId);
    if(!head||!tail||head.start!==0||Math.abs(tail.start+tail.duration-e.duration)>1e-6||Math.abs(tail.sourceOut-head.sourceIn)>1e-6||Math.abs((loop.voiceJoin.sourceOut-loop.voiceJoin.sourceIn)/e.playbackRate*48000-loop.voiceJoin.totalSamples)>.001||loop.voiceJoin.splitSamples!==Math.round(tail.duration*48000)||loop.voiceJoin.totalSamples!==Math.round((tail.duration+head.duration)*48000))throw Error('Invalid continuous-sentence loop declaration.');}
  return e;
}
