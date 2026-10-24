/**
 * Pui Creator V2 / 01. Original instrumental + an actual accepted medicate hook.
 * Only the final WAV and its QA receipt are written; source WAVs remain intact.
 * All placement uses integer 48 kHz samples on the shared 30 fps picture grid.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const source=path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT=path.resolve(source,'..');
export const SR=48000, FPS=30, FRAMES=553, DURATION=FRAMES/FPS;
export const CUTS=[0,.4,.8,2,2.8,3.6,4.4,5.6,6.8,7.6,8.8,9.6,10.4,11.2,439/30,451/30,463/30,475/30,499/30,553/30];
const music='/home/pui/Videos/Pui-Promo/2026-10-24/kinetic-five/media/music-01.wav';
const medicate='/mnt/e/Desktop/音源/medicate/MIX_v6_Natural/medicate_MIX_v6_Natural.wav';
const v6Manifest='/mnt/e/Desktop/音源/medicate/MIX_v6_Natural/delivery-manifest-v6.json';
const lyrics='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/Source/lyrics-timed.json';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const TAU=2*Math.PI;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const hashBuffer=b=>crypto.createHash('sha256').update(b).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x));
const native=p=>{const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status||r.error)throw Error('wslpath: '+p);return r.stdout.trim();};
function execute(exe,args,input,binary=false){
  const r=spawnSync(exe,args,{input,encoding:binary?undefined:'utf8',timeout:120000,maxBuffer:48*1024*1024});
  if(r.error||r.status!==0)throw Error(r.error?.message||String(r.stderr));
  return {stdout:r.stdout,stderr:String(r.stderr||''),exit:r.status};
}
const logJson=log=>JSON.parse(log.match(/\{[\s\S]*\}/)?.[0]||'{}');
function pcmWave(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw Error('Not RIFF WAVE');
  let format,data;
  for(let p=12;p+8<=buffer.length;){const id=buffer.toString('ascii',p,p+4),size=buffer.readUInt32LE(p+4);if(id==='fmt ')format=buffer.subarray(p+8,p+8+size);if(id==='data')data=buffer.subarray(p+8,p+8+size);p+=8+size+(size%2);}
  if(!format||!data)throw Error('Incomplete WAV chunks');
  const tag=format.readUInt16LE(0),channels=format.readUInt16LE(2),rate=format.readUInt32LE(4),bits=format.readUInt16LE(14);
  const subtype=tag===65534&&format.length>=40?format.readUInt16LE(24):tag;
  if(subtype!==1||![16,24,32].includes(bits))throw Error('Expected PCM WAV: '+JSON.stringify({tag,subtype,bits}));
  return {data,tag,subtype,channels,rate,bits,bytes:bits/8,frames:data.length/(channels*bits/8)};
}
function stereoSample(wave,index,channel){
  if(index<0||index>=wave.frames)throw Error('Source sample out of range: '+index);
  const p=(index*wave.channels+Math.min(channel,wave.channels-1))*wave.bytes;
  return wave.data.readIntLE(p,wave.bytes)/(2**(wave.bits-1));
}
function wave24(L,R){
  const b=Buffer.alloc(44+L.length*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(L.length*6,40);
  for(let i=0;i<L.length;i++){b.writeIntLE(Math.round(Math.max(-1,Math.min(1,L[i]))*8388607),44+i*6,3);b.writeIntLE(Math.round(Math.max(-1,Math.min(1,R[i]))*8388607),47+i*6,3);}return b;
}

export function makeMix(root=DEFAULT_ROOT){
  root=path.resolve(root);fs.mkdirSync(path.join(root,'media'),{recursive:true});fs.mkdirSync(path.join(root,'qa'),{recursive:true});
  const output=path.join(root,'media/01-pui-promo-v2-mix.wav'),qa=path.join(root,'qa/audio-v2-01.json');
  const v6=JSON.parse(fs.readFileSync(v6Manifest,'utf8')),cue=JSON.parse(fs.readFileSync(lyrics,'utf8')).cues.find(c=>c.id==='hook2-L01');
  const before={instrumental:hash(music),medicate:hash(medicate)};
  if(before.medicate!==v6.files['medicate_MIX_v6_Natural.wav'].sha256)throw Error('Accepted V6 SHA mismatch');
  const bed=pcmWave(fs.readFileSync(music));if(bed.rate!==SR||bed.channels!==2)throw Error('Instrumental must be48k stereo');
  const N=FRAMES*(SR/FPS),chorusStart=336*(SR/FPS),chorusEnd=439*(SR/FPS),chorusCount=chorusEnd-chorusStart;
  const decoded=execute(FF,['-v','error','-ss','76.3','-i',native(medicate),'-t',String(103/30),'-vn','-ar',String(SR),'-ac','2','-c:a','pcm_f32le','-f','f32le','pipe:1'],undefined,true).stdout;
  if(decoded.length%8||Math.abs(decoded.length/8-chorusCount)>2)throw Error('Unexpected chorus frame count: '+decoded.length/8);
  const L=new Float64Array(N),R=new Float64Array(N),fxL=new Float64Array(N),fxR=new Float64Array(N),cues=[];
  const bedGain=.70,chorusGain=.95;
  for(let i=0;i<N;i++){
    if(i>=chorusStart&&i<chorusEnd){
      const n=i-chorusStart;
      if(n>=decoded.length/8)throw Error('Chorus conversion lost an audible sample');
      const env=Math.sin(Math.PI/2*clamp(n/(SR*.18)))*Math.sin(Math.PI/2*clamp((chorusCount-1-n)/(SR*.24)));
      L[i]=decoded.readFloatLE(n*8)*chorusGain*env;R[i]=decoded.readFloatLE(n*8+4)*chorusGain*env;
    }else{
      const t=i/SR,index=i<chorusStart?Math.round(6.4*SR)+i:Math.round(17.6*SR)+(i-chorusEnd);
      // A real 100ms pause: thin during11.02–11.10, silent11.10–11.20.
      const pocket=i<chorusStart?clamp((11.1-t)/.08):1;
      const edge=i<chorusStart?clamp(t/.10):clamp((i-chorusEnd)/(SR*.20));
      const ending=clamp((N-1-i)/(SR*.30));
      L[i]=stereoSample(bed,index,0)*bedGain*pocket*edge*ending;
      R[i]=stereoSample(bed,index,1)*bedGain*pocket*edge*ending;
    }
  }
  let seed=26012401;
  const noise=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
  function add(kind,at,duration,synth,gain,pan=0){
    const start=Math.round(at*SR),count=Math.round(duration*SR),gl=Math.sqrt((1-pan)*.5),gr=Math.sqrt((1+pan)*.5);
    for(let n=0;n<count&&start+n<N;n++){
      const i=start+n;if(i<0||i>=chorusStart&&i<chorusEnd)continue;
      const t=i/SR,pocket=i<chorusStart?clamp((11.1-t)/.08):1;
      const end=clamp((N-1-i)/(SR*.30));
      const value=synth(n/SR,n/count)*gain*pocket*end;
      fxL[i]+=value*gl;fxR[i]+=value*gr;
    }
    cues.push({kind,startSeconds:at,endSeconds:at+duration,landingFrame30:Math.round(at*FPS),gain,pan});
  }
  function impact(at,gain=.17){
    add('original-low-impact',at,.29,t=>Math.sin(TAU*(43*t+1.9*(1-Math.exp(-48*t))))*Math.exp(-22*t)*clamp(t/.0017),gain);
    let low=0;add('original-impact-air',at,.09,t=>{const n=noise();low=low*.75+n*.25;return low*Math.exp(-55*t)*clamp(t/.001);},gain*.22,-.15);
  }
  function tick(at,gain=.042,pan=0){
    add('original-tactile-tick',at,.065,t=>(Math.sin(TAU*1240*t)+.28*Math.sin(TAU*1920*t))*Math.exp(-95*t)*clamp(t/.0009),gain,pan);
  }
  function swipe(landing,duration=.13,gain=.06,pan=.4){
    let low=0;add('original-reverse-suction',landing-duration,duration,(t,p)=>{const n=noise(),mix=.045+.52*p;low=low*(1-mix)+n*mix;return low*Math.sin(Math.PI*p/2)**1.5*clamp((1-p)/.08);},gain,pan);
  }
  impact(0,.21);
  for(const [i,at]of [.4,.8,2,2.8,3.6,4.4,5.6,6.8,7.6,8.8,9.6,10.4].entries()){
    tick(at,i%3===0?.052:.035,i%2?-.42:.42);
    if([.8,2.8,4.4,6.8,8.8].includes(at))swipe(at,.12,i%2?.057:.046,i%2?-.45:.45);
  }
  for(const at of [2.8,5.6,8.8])impact(at,at===5.6?.19:.12);
  // The intake stops before the silent pocket; the real hook has no added FX.
  swipe(11.08,.20,.075,-.25);
  impact(chorusEnd/SR+.06,.075);
  for(const [i,at]of [451/30,463/30,475/30,499/30].entries()){
    tick(at,i===2?.065:.044,i%2?-.35:.35);
    if(i===0||i===2)swipe(at,.10,.052,i%2?-.4:.4);
  }
  impact(475/30,.13);
  let fxPeak=0,prePeak=0,fxSamplesInsideChorus=0;
  for(let i=0;i<N;i++){
    if(i>=chorusStart&&i<chorusEnd&&(fxL[i]!==0||fxR[i]!==0))fxSamplesInsideChorus++;
    fxPeak=Math.max(fxPeak,Math.abs(fxL[i]),Math.abs(fxR[i]));
    L[i]+=fxL[i];R[i]+=fxR[i];prePeak=Math.max(prePeak,Math.abs(L[i]),Math.abs(R[i]));
  }
  if(fxSamplesInsideChorus)throw Error('SFX contaminated the artist hook');
  const overloadGuard=prePeak>.94?.94/prePeak:1;
  if(overloadGuard<1)for(let i=0;i<N;i++){L[i]*=overloadGuard;R[i]*=overloadGuard;}
  const raw=wave24(L,R),base='loudnorm=I=-14:TP=-2.2:LRA=7';
  const first=logJson(execute(FF,['-hide_banner','-i','pipe:0','-af',base+':print_format=json','-f','null','-'],raw).stderr);
  const filter=base+`:measured_I=${first.input_i}:measured_TP=${first.input_tp}:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true:print_format=json`;
  const normalization=logJson(execute(FF,['-hide_banner','-y','-i','pipe:0','-af',filter,'-ar',String(SR),'-ac','2','-c:a','pcm_s24le',native(output)],raw).stderr);
  const measured=logJson(execute(FF,['-hide_banner','-i',native(output),'-af',base+':print_format=json','-f','null','-']).stderr);
  const probe=JSON.parse(execute(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',native(output)]).stdout);
  const stream=probe.streams[0];
  if(Math.abs(Number(measured.input_i)+14)>.35||Number(measured.input_tp)>-1.6||stream.codec_name!=='pcm_s24le'||Number(stream.sample_rate)!==SR||stream.channels!==2||Number(stream.duration_ts)!==N)throw Error('Final WAV QA failed '+JSON.stringify({measured,probe}));
  const silenceLog=execute(FF,['-hide_banner','-i',native(output),'-af','silencedetect=noise=-50dB:d=0.04','-f','null','-']).stderr;
  const starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>Number(m[1])),ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const silence=starts.map((start,i)=>({start,end:ends[i]??DURATION}));
  const unexpectedSilence=silence.filter(s=>!(s.start>=11.04&&s.end<=11.23)&&!(s.start>=DURATION-.06&&s.end<=DURATION+.001));
  if(unexpectedSilence.length)throw Error('Unexpected silence '+JSON.stringify(unexpectedSilence));
  const after={instrumental:hash(music),medicate:hash(medicate)};
  if(JSON.stringify(before)!==JSON.stringify(after))throw Error('A source WAV was modified');
  const report={
    status:'TECHNICAL_PASS',id:'01',slug:'pui-promo-v2',file:output,sha256:hash(output),frames:FRAMES,fps:FPS,duration:DURATION,sampleRate:SR,sampleFrames:N,channels:2,bits:24,
    sources:{instrumental:{path:music,sha256:before.instrumental,wavFormat:{tag:bed.tag,subtype:bed.subtype,rate:bed.rate,bits:bed.bits,channels:bed.channels},segments:[{sourceStart:6.4,sourceEnd:17.6,sourceStartSample:307200,sourceEndSample:844800,outputStart:0,outputEnd:11.2,outputStartSample:0,outputEndSample:chorusStart},{sourceStart:17.6,sourceEnd:21.4,sourceStartSample:844800,sourceEndSample:1027200,outputStart:chorusEnd/SR,outputEnd:DURATION,outputStartSample:chorusEnd,outputEndSample:N}]},
      artistChorus:{path:medicate,sha256:before.medicate,acceptedManifest:v6Manifest,acceptedVersion:v6.version,acceptedStatus:v6.status,cueId:cue.id,lyric:cue.text,fullSourceStart:76.3,fullSourceEnd:2392/30,sourceStartFrame30:2289,sourceEndFrame30:2392,sourceStartSample44100:3364830,sourceEndSample44100:3516240,outputStart:11.2,outputEnd:439/30,outputStartFrame30:336,outputEndFrame30:439,outputStartSample:chorusStart,outputEndSample:chorusEnd,resampledSampleFrames:decoded.length/8,phraseStartInOutput:11.2+cue.audioStartEstimate-76.3,phraseEndInOutput:11.2+cue.audioEndEstimate-76.3,wholeCueContained:cue.audioStartEstimate>=76.3&&cue.audioEndEstimate<=2392/30}},
    sourceOriginalsUnchanged:true,cutSeconds:CUTS,levelsBeforeFinalNormalization:{instrumentalGain:bedGain,artistChorusGain:chorusGain,overloadGuard,preGuardPeakDbfs:20*Math.log10(prePeak),sfxPeakDbfs:20*Math.log10(fxPeak)},
    timingDesign:{instrumentalThin:[11.02,11.10],intentionalSilentPocket:[11.10,11.20],artistChorus:[11.20,439/30],returnDrop:439/30,addedSfxDuringChorus:false,sfxSamplesInsideChorus:fxSamplesInsideChorus,endFadeSeconds:.30,artistFadeInSeconds:.18,artistFadeOutSeconds:.24,instrumentalReturnFadeInSeconds:.20},
    originalSfx:{provenance:'Deterministic additive bass/tick and filtered-noise reverse suction synthesized in this file. No external samples or recordings.',seed:26012401,cues},
    rawInMemoryWaveSha256:hashBuffer(raw),targetIntegratedLufs:-14,maximumTruePeakDbtp:-1.6,processingPeakGuardDbtp:-2.2,firstPass:first,normalization,measured,probe,
    silenceDetection:{thresholdDbfs:-50,minimumDuration:.04,events:silence,unexpected:unexpectedSilence},
    verificationScope:{exactSampleDuration:true,sourceHashesBeforeAfter:true,pcmNormalizationAndPeakMeasured:true,fullWaveDecodedDuringMeasurements:true,finalAacMeasured:false,directHumanListening:false,sourceMovieAudition:false},
    pictureSync:'global11.2 maps to full MV76.3/frame2289. Global14.633333 maps to full MV79.733333/frame2392. Do not start the old Highlight at0: that is Verse2.',
    writtenArtifacts:['source/audio-v2.mjs','media/01-pui-promo-v2-mix.wav','qa/audio-v2-01.json']
  };
  fs.writeFileSync(qa,JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const r=makeMix(process.argv[2]||DEFAULT_ROOT);console.log(JSON.stringify({file:r.file,sha256:r.sha256,duration:r.duration,samples:r.sampleFrames,lufs:r.measured.input_i,truePeak:r.measured.input_tp,chorus:r.timingDesign.artistChorus,silence:r.silenceDetection.events}));
}
