/**
 * Editorial sound accents for the actual-work reels 02–04.
 * Source excerpt/timebase comes from motion-episodes.mjs. No source WAV changes.
 * Only the requested final WAVs and the aggregate QA JSON are written.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {motionEpisodes} from './motion-episodes.mjs';

const source=path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT=path.resolve(source,'..');
const SR=48000,FPS=30,TAU=2*Math.PI;
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const clamp=x=>Math.max(0,Math.min(1,x));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=p=>sha(fs.readFileSync(p));
function native(p){const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.error||r.status)throw Error('wslpath '+p);return r.stdout.trim();}
function exec(exe,args,input){const r=spawnSync(exe,args,{input,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});if(r.error||r.status)throw Error(r.error?.message||r.stderr);return r;}
const jsonLog=s=>JSON.parse(s.match(/\{[\s\S]*\}/)?.[0]||'{}');
function decode(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw Error('Expected RIFF WAVE');let fmt,data;
  for(let p=12;p+8<=buffer.length;){const id=buffer.toString('ascii',p,p+4),size=buffer.readUInt32LE(p+4);if(id==='fmt ')fmt=buffer.subarray(p+8,p+8+size);if(id==='data')data=buffer.subarray(p+8,p+8+size);p+=8+size+(size%2);}
  if(!fmt||!data)throw Error('Incomplete WAV');
  const tag=fmt.readUInt16LE(0),subtype=tag===65534&&fmt.length>=40?fmt.readUInt16LE(24):tag;
  const channels=fmt.readUInt16LE(2),rate=fmt.readUInt32LE(4),bits=fmt.readUInt16LE(14),bytes=bits/8;
  if(subtype!==1||rate!==SR||channels!==2||![16,24,32].includes(bits))throw Error('Expected 48k stereo PCM '+JSON.stringify({tag,subtype,channels,rate,bits}));
  return {tag,subtype,channels,rate,bits,bytes,data,frames:data.length/(channels*bytes)};
}
function encode(L,R){
  const b=Buffer.alloc(44+L.length*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(L.length*6,40);
  for(let n=0;n<L.length;n++){b.writeIntLE(Math.round(Math.max(-1,Math.min(1,L[n]))*8388607),44+n*6,3);b.writeIntLE(Math.round(Math.max(-1,Math.min(1,R[n]))*8388607),47+n*6,3);}return b;
}

// Select gestures and landings, rather than ticking every edit.
const accents={
 '02':[
  {kind:'body',at:0,gain:.115,why:'The documented hidden-pommel close-up, with a short warm body.'},
  {kind:'air',at:.64,duration:.16,pan:[-.45,.45],gain:.044,why:'0.8s whipR from the close-up to the actual rejected prototype.'},
  {kind:'tick',at:2.8,gain:.045,why:'Attention moves to the documented hidden lower part.'},
  {kind:'body',at:5.4,gain:.075,why:'Camera finishes its close approach to the core.'},
  {kind:'tick',at:6.8,gain:.043,why:'The fixed whole sword becomes visible.'},
  {kind:'wood',at:275/30,gain:.105,why:'An editorial dry accent during actual part separation; not native collision audio.'},
  {kind:'air',at:12.02,duration:.19,pan:[-.4,.4],gain:.034,why:'Enter the real reassembly sequence without masking its whole motion.'},
  {kind:'air',at:14.12,duration:.28,pan:[.24,0],gain:.046,why:'A short intake converges exactly at the repair landing14.4s.'},
  {kind:'body',at:14.4,gain:.145,why:'Main landing: reassembly complete.'},
  {kind:'latch',at:14.4,gain:.045,why:'A soft lower latch tone makes the closure tangible.'},
  {kind:'air',at:16.66,duration:.14,pan:[.4,-.4],gain:.036,why:'Short replay whipL; no added impact on every subsequent cut.'}
 ],
 '03':[
  {kind:'body',at:0,gain:.085,why:'Open on the late real-game step.'},
  {kind:'air',at:.66,duration:.14,pan:[-.35,.4],gain:.035,why:'Return wide, then find the hero.'},
  {kind:'tick',at:1.2,gain:.027,why:'First camera pursuit settles on the hero.'},
  {kind:'air',at:4.04,duration:.20,pan:[.25,-.35],gain:.032,why:'Pull wide to show the stepping stones.'},
  {kind:'air',at:7.18,duration:.22,pan:[-.45,.35],gain:.048,why:'Main jump pursuit near the rising/apex camera key7.4s.'},
  {kind:'wood',at:9.3,gain:.098,why:'Hero/camera returns to the lower landing position at the9.3s key.'},
  {kind:'air',at:10.58,duration:.24,pan:[.28,0],gain:.026,why:'Breathe and pull away from the jump detail.'},
  {kind:'lamp',at:13.5,gain:.026,why:'Warm low-register shimmer at the lamp/bell reveal; not an asserted native game trigger.'},
  {kind:'body',at:14.4,gain:.075,why:'Lit-bell near-end frame and a wider view of the authored night.'},
  {kind:'air',at:17.05,duration:.22,pan:[-.4,.4],gain:.032,why:'Replay jump; the original instrumental breathes during16.8–17.6.'},
  {kind:'wood',at:18.8,gain:.060,why:'Replay source9.0s lower position: 16.8+(9.0-6.0)/1.5.'}
 ],
 '04':[
  {kind:'latch',at:0,gain:.044,why:'First two actual thumbnails snap into attention.'},
  {kind:'air',at:.94,duration:.24,pan:[-.18,0],gain:.031,why:'Release the close-up into the whole tool.'},
  {kind:'air',at:2.24,duration:.16,pan:[-.35,.35],gain:.038,why:'WhipR to the actual earlier revision.'},
  {kind:'tick',at:4.4,gain:.032,why:'Match the two earlier thumbnails before the version change.'},
  {kind:'body',at:5.6,gain:.122,why:'Main landing: change from earlier to current actual UI.'},
  {kind:'latch',at:5.6,gain:.040,why:'A soft contact under the visual match, without a warning beep.'},
  {kind:'tick',at:6.2,gain:.022,why:'Tiny spring settle at the camera overshoot return.'},
  {kind:'air',at:7.46,duration:.34,pan:[.35,-.35],gain:.036,why:'Move to the actual category rows and settle7.8s.'},
  {kind:'tick',at:10,gain:.030,why:'Name/edit area comes into focus; editorial accent, not fake typing.'},
  {kind:'air',at:11.08,duration:.15,pan:[.30,-.3],gain:.028,why:'The real confirmation screen enters quietly; no alarm sound.'},
  {kind:'air',at:14.08,duration:.66,pan:[-.45,.45],gain:.027,why:'Follow the actual row of thumbnails left-to-right.'},
  {kind:'latch',at:14.8,gain:.026,why:'Soft landing on the right thumbnail group.'}
 ]
};

export function mixEpisode(root,e){
  if(!['02','03','04'].includes(e.id)||e.duration!==20.8)throw Error('Expected a20.8s reel02–04');
  const sourceSha=hash(e.audio),wave=decode(fs.readFileSync(e.audio)),N=Math.round(e.duration*SR),sourceStart=Math.round(e.audioAt*SR);
  if(sourceStart+N>wave.frames)throw Error('Source excerpt exceeds its WAV');
  const L=new Float64Array(N),R=new Float64Array(N),fxL=new Float64Array(N),fxR=new Float64Array(N),cues=[];
  const bedGain=.90;
  for(let i=0;i<N;i++){
    const p=(sourceStart+i)*wave.channels*wave.bytes;
    const edge=clamp(i/(SR*.08))*clamp((N-1-i)/(SR*.28));
    L[i]=wave.data.readIntLE(p,wave.bytes)/(2**(wave.bits-1))*bedGain*edge;
    R[i]=wave.data.readIntLE(p+wave.bytes,wave.bytes)/(2**(wave.bits-1))*bedGain*edge;
  }
  let seed=26012400+Number(e.id);
  const noise=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
  function sound(event,duration,synth){
    const start=Math.round(event.at*SR),count=Math.round(duration*SR),panRange=event.pan||[0,0];
    for(let n=0;n<count&&start+n<N;n++){
      const i=start+n;if(i<0)continue;const p=n/count,pan=panRange[0]+(panRange[1]-panRange[0])*p;
      const v=synth(n/SR,p)*event.gain*clamp((N-1-i)/(SR*.28));
      fxL[i]+=v*Math.sqrt((1-pan)*.5);fxR[i]+=v*Math.sqrt((1+pan)*.5);
    }
    cues.push({...event,end:event.at+duration,frame30:Math.round(event.at*FPS),sample:Math.round(event.at*SR)});
  }
  for(const event of accents[e.id]){
    if(event.kind==='body')sound(event,.25,t=>Math.sin(TAU*(61*t+1.15*(1-Math.exp(-48*t))))*Math.exp(-23*t)*clamp(t/.002));
    else if(event.kind==='wood'){
      let low=0;sound(event,.14,t=>{low=low*.82+noise()*.18;return (Math.sin(TAU*158*t)*.66+Math.sin(TAU*263*t)*.23+low*.22)*Math.exp(-40*t)*clamp(t/.0015);});
    }else if(event.kind==='tick')sound(event,.065,t=>(Math.sin(TAU*680*t)+.26*Math.sin(TAU*1020*t))*Math.exp(-93*t)*clamp(t/.001));
    else if(event.kind==='latch')sound(event,.105,t=>(Math.sin(TAU*465*t)+.25*Math.sin(TAU*930*t))*Math.exp(-58*t)*clamp(t/.002));
    else if(event.kind==='lamp')sound(event,.70,t=>(Math.sin(TAU*349.228*t)+.55*Math.sin(TAU*440*t)+.28*Math.sin(TAU*523.251*t))*Math.exp(-7*t)*clamp(t/.018));
    else if(event.kind==='air'){
      let fast=0,slow=0;
      sound(event,event.duration,(t,p)=>{const n=noise();fast=fast*.72+n*.28;slow=slow*.96+n*.04;return (fast-slow)*Math.sin(Math.PI*p)**1.35;});
    }else throw Error('Unknown original effect '+event.kind);
  }
  let peak=0,fxPeak=0;
  for(let i=0;i<N;i++){L[i]+=fxL[i];R[i]+=fxR[i];peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));fxPeak=Math.max(fxPeak,Math.abs(fxL[i]),Math.abs(fxR[i]));}
  const guard=peak>.94?.94/peak:1;if(guard<1)for(let i=0;i<N;i++){L[i]*=guard;R[i]*=guard;}
  const raw=encode(L,R),out=path.join(root,'media',e.id+'-'+e.slug+'-mix.wav');
  const base='loudnorm=I=-14:TP=-2.1:LRA=7';
  const first=jsonLog(exec(FF,['-hide_banner','-i','pipe:0','-af',base+':print_format=json','-f','null','-'],raw).stderr);
  const filter=base+`:measured_I=${first.input_i}:measured_TP=${first.input_tp}:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true:print_format=json`;
  const normalization=jsonLog(exec(FF,['-hide_banner','-y','-i','pipe:0','-af',filter,'-ar',String(SR),'-ac','2','-c:a','pcm_s24le',native(out)],raw).stderr);
  const measured=jsonLog(exec(FF,['-hide_banner','-i',native(out),'-af',base+':print_format=json','-f','null','-']).stderr);
  const probe=JSON.parse(exec(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',native(out)]).stdout);
  const v=probe.streams[0];
  if(v.codec_name!=='pcm_s24le'||Number(v.sample_rate)!==SR||v.channels!==2||Number(v.duration_ts)!==N||Math.abs(Number(measured.input_i)+14)>.35||Number(measured.input_tp)>-1.5)throw Error('WAV QA failed '+JSON.stringify({id:e.id,probe,measured}));
  const log=exec(FF,['-hide_banner','-i',native(out),'-af','silencedetect=noise=-50dB:d=0.08','-f','null','-']).stderr;
  const starts=[...log.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>Number(m[1])),ends=[...log.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const silence=starts.map((start,i)=>({start,end:ends[i]??e.duration}));
  const sourcePauses=[[5.6,6.4],[24.8,25.6],[44,44.8]].map(([a,b])=>[a-e.audioAt,b-e.audioAt]).filter(([a,b])=>b>0&&a<e.duration).map(([a,b])=>[Math.max(0,a),Math.min(e.duration,b)]);
  const unexpected=silence.filter(s=>!sourcePauses.some(([a,b])=>s.start>=a-.06&&s.end<=b+.06));
  if(unexpected.length)throw Error('Unexpected silence '+JSON.stringify({id:e.id,unexpected}));
  if(hash(e.audio)!==sourceSha)throw Error('Instrumental source changed');
  return {status:'TECHNICAL_PASS',id:e.id,slug:e.slug,title:e.title,file:out,sha256:hash(out),duration:e.duration,pictureFrames:Math.round(e.duration*FPS),fps:FPS,sampleRate:SR,sampleFrames:N,channels:2,bits:24,
    source:{file:e.audio,sha256:sourceSha,sourceStart:e.audioAt,sourceEnd:e.audioAt+e.duration,sourceStartSample:sourceStart,sourceEndSample:sourceStart+N,sourceOriginalUnchanged:true,pcmFormat:{tag:wave.tag,subtype:wave.subtype,rate:wave.rate,bits:wave.bits}},
    cutSeconds:e.shots.map(s=>s.a).concat([e.duration]),targetChanges:e.shots.flatMap((s,i)=>s.cam.map(c=>({shot:i,globalTime:s.a+c.t,sourceTarget:[c.u,c.v],zoom:c.z}))),
    accents:cues,mainLanding:e.id==='02'?14.4:e.id==='03'?[9.3,13.5,14.4]:5.6,
    soundDesign:{bedGainBeforeNormalization:bedGain,originalEditorialSfx:true,externalSamples:false,highFrequencyNoiseSuppressed:true,bodyRangeHz:[61,263],tickRangeHz:[465,1020],noiseBand:'Smoothed fast-minus-slow noise, rounded envelope; no bright white-noise burst.',notEveryCutTicked:true,fxPeakDbfs:20*Math.log10(fxPeak),preGuardPeakDbfs:20*Math.log10(peak),overloadGuard:guard,endFadeSeconds:.045},
    rawInMemoryWaveSha256:sha(raw),targetIntegratedLufs:-14,maximumTruePeakDbtp:-1.5,processingPeakGuardDbtp:-2.1,firstPass:first,normalization,measured,probe,
    silence:{thresholdDbfs:-50,minimumDuration:.08,sourceMappedPauseWindows:sourcePauses,detected:silence,unexpected},
    verificationScope:{durationAndSourceSamples:true,fullWaveDecodedDuringMeasurement:true,sourceHashesBeforeAfter:true,finalAacMeasured:false,directHumanAudition:false},
    timingEvidence:'Authored camera keys and source-frame/event notes in motion-episodes.mjs. These are added editorial accents, not claimed native game or app recordings.'};
}

export function makeEpisodeMixes(root=DEFAULT_ROOT,ids=['02','03','04']){
  root=path.resolve(root);fs.mkdirSync(path.join(root,'media'),{recursive:true});fs.mkdirSync(path.join(root,'qa'),{recursive:true});
  if(ids.some(id=>!['02','03','04'].includes(id)))throw Error('This script owns only02–04');
  const file=path.join(root,'qa/audio-episodes-v2.json');
  const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{episodes:[]};
  const results=previous.episodes.filter(r=>!ids.includes(r.id));
  for(const e of motionEpisodes.filter(e=>ids.includes(e.id))){const r=mixEpisode(root,e);results.push(r);console.log(JSON.stringify({id:r.id,file:r.file,lufs:r.measured.input_i,tp:r.measured.input_tp,sha256:r.sha256}));}
  results.sort((a,b)=>a.id.localeCompare(b.id));
  const report={status:'TECHNICAL_PASS',scope:'02/03/04 only;01 and05 not modified.',provenance:'Commission-original instrumental excerpts plus new deterministic editorial effects; these are not marketed as a newly released Pui song.',episodes:results};
  fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))makeEpisodeMixes(process.argv[2]||DEFAULT_ROOT,process.argv.length>3?process.argv.slice(3):['02','03','04']);
