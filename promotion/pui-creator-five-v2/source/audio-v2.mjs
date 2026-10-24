/** Issue85 / 01: continuous medicate instrumental, accepted V6 vocal phrase intact. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const DEFAULT_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SR=48000,FPS=30,FRAMES=553,DURATION=FRAMES/FPS;
export const CUTS=[0,.4,.8,2,2.8,3.6,4.4,5.6,6.8,7.6,8.8,9.6,10.4,11.2,439/30,451/30,463/30,475/30,499/30,553/30];
const base='/mnt/e/Desktop/音源/medicate/MIX_v6_Natural';
const sources={master:base+'/medicate_MIX_v6_Natural.wav',beat:base+'/Audio/z5824Notag (1).wav',wet:base+'/Stems/HOOK_PLATE_WET.wav',dry:base+'/Stems/VOCAL_ALL_DRY.wav'};
const manifest=base+'/delivery-manifest-v6.json',lyrics='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/Source/lyrics-timed.json';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x)),db=x=>x>0?20*Math.log10(x):-150;
const np=p=>{const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
function exec(exe,args,input,binary=false){const r=spawnSync(exe,args,{input,encoding:binary?undefined:'utf8',timeout:90000,maxBuffer:64*1024*1024});if(r.status!==0||r.error)throw Error(r.error?.message||String(r.stderr));return{stdout:r.stdout,stderr:String(r.stderr)};}
const loggedJson=s=>JSON.parse(s.match(/\{[\s\S]*\}/)?.[0]||'{}');
function wave(L,R,gain){const b=Buffer.alloc(44+L.length*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(L.length*6,40);for(let i=0;i<L.length;i++){b.writeIntLE(Math.round(Math.max(-1,Math.min(1,L[i]*gain))*8388607),44+i*6,3);b.writeIntLE(Math.round(Math.max(-1,Math.min(1,R[i]*gain))*8388607),47+i*6,3);}return b;}
export function makeMix(root=DEFAULT_ROOT){
 root=path.resolve(root);const output=path.join(root,'media/01-pui-promo-v2-mix.wav'),qa=path.join(root,'qa/audio-v2-01.json'),fix=path.join(root,'qa/fade-fix-01.json');
 const before=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)]));const accepted=JSON.parse(fs.readFileSync(manifest));if(before.master!==accepted.files['medicate_MIX_v6_Natural.wav'].sha256)throw Error('Not accepted V6 master');
 const oldArtifacts=['source/audio-v2.mjs','media/01-pui-promo-v2-mix.wav','qa/audio-v2-01.json','qa/fade-fix-01.json'];const stamp=new Date().toISOString().replace(/[:.]/g,'-'),checkpoint=path.join(root,'checkpoints','fade-fix-01-run-'+stamp);for(const rel of oldArtifacts)if(fs.existsSync(path.join(root,rel))){const dest=path.join(checkpoint,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest,fs.constants.COPYFILE_EXCL);}
 const N=FRAMES*SR/FPS,sourceAt=65.1,chorusStart=11.2,chorusEnd=439/30;
 const decode=(p,ch=2)=>{const b=exec(FF,['-v','error','-ss',String(sourceAt),'-i',np(p),'-t',String(DURATION),'-ar',String(SR),'-ac',String(ch),'-c:a','pcm_f32le','-f','f32le','pipe:1'],undefined,true).stdout;if(b.length!==N*ch*4)throw Error('Unexpected decoded samples '+p+' '+b.length);return b;};
 const master=decode(sources.master),beat=decode(sources.beat),wet=decode(sources.wet),dry=decode(sources.dry,1);
 const masterEntry=[11.16,11.19],masterExit=[chorusEnd,chorusEnd+.020],wetEnd=14.70,wetFadeAt=14.68;
 function masterEnvelope(t){return clamp((t-masterEntry[0])/(masterEntry[1]-masterEntry[0]))*clamp((masterExit[1]-t)/(masterExit[1]-masterExit[0]));}
 const soloBeatLiftDb=2.5,beatScale=10**((-6+accepted.master.fixed_gain_db+soloBeatLiftDb)/20),wetScale=10**(accepted.master.fixed_gain_db/20);
 const L=new Float64Array(N),R=new Float64Array(N);let peak=0;const fx=[];
 for(let i=0;i<N;i++){
  const t=i/SR,m=masterEnvelope(t),program=clamp(t/.08)*clamp((DURATION-1/SR-t)/.30);
  const residual=t>=chorusEnd&&t<wetEnd?clamp((wetEnd-t)/(wetEnd-wetFadeAt)):0;
  for(let c=0;c<2;c++){
   const at=i*8+c*4;let x=master.readFloatLE(at)*m+beat.readFloatLE(at)*beatScale*(1-m)+wet.readFloatLE(at)*wetScale*residual*(1-m);
   // Two low, short accents only; original150BPM ticks/reverse sweeps removed.
   if(t<.095){const u=t;x+=Math.sin(2*Math.PI*74*u)*Math.exp(-48*u)*clamp(u/.003)*.027;}
   const d=t-chorusEnd;if(d>=.11&&d<.155){const u=d-.11;x+=Math.sin(2*Math.PI*260*u)*Math.exp(-110*u)*clamp(u/.002)*.008;}
   x*=program;(c?R:L)[i]=x;peak=Math.max(peak,Math.abs(x));
  }
 }
 fx.push({kind:'low opening accent',at:0,duration:.095},{kind:'quiet low tick after full phrase',at:chorusEnd+.11,duration:.045});
 const measurementHeadroom=Math.min(1,.80/peak),raw=wave(L,R,measurementHeadroom),first=loggedJson(exec(FF,['-hide_banner','-i','pipe:0','-af','loudnorm=I=-14:TP=-2.2:LRA=7:print_format=json','-f','null','-'],raw).stderr);
 // One static gain only; never a vocal envelope, compressor or dynamic loudnorm.
 const gainForLufs=-14-Number(first.input_i),gainForPeak=-2.25-Number(first.input_tp),gainDb=db(measurementHeadroom)+Math.min(gainForLufs,gainForPeak),gain=10**(gainDb/20);
 fs.writeFileSync(output,wave(L,R,gain));
 const measured=loggedJson(exec(FF,['-hide_banner','-i',np(output),'-af','loudnorm=I=-14:TP=-2.2:LRA=7:print_format=json','-f','null','-']).stderr);
 const probe=JSON.parse(exec(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',np(output)]).stdout);const stream=probe.streams[0];
 if(stream.codec_name!=='pcm_s24le'||Number(stream.duration_ts)!==N||Number(stream.sample_rate)!==SR||stream.channels!==2||Number(measured.input_tp)>-2.2||Number(measured.input_i)<-17||Number(measured.input_i)>-13)throw Error('Mix format/level failed '+JSON.stringify({probe,measured,gainDb,first,peak}));
 const cue=JSON.parse(fs.readFileSync(lyrics)).cues.find(c=>c.id==='hook2-L01');const mask=[];let active=0,attenuated=0,firstActive=null,lastActive=null;
 for(let i=Math.round(11.19*SR);i<Math.round((chorusEnd+.02)*SR);i+=480){let square=0;for(let n=i;n<Math.min(N,i+480);n++){const x=dry.readFloatLE(n*4);square+=x*x;}const level=10*Math.log10(Math.max(1e-30,square/480));if(level>-45){for(let n=i;n<Math.min(N,i+480);n++){if(masterEnvelope(n/SR)<1-1e-9)attenuated++;active++;}if(firstActive===null)firstActive=i/SR;lastActive=(i+480)/SR;}mask.push({globalStart:i/SR,sourceStart:sourceAt+i/SR,dryRmsDbfs:level,masterEnvelopeAtStart:masterEnvelope(i/SR)});}
 if(attenuated)throw Error('Vocal mask intersects a fade: '+attenuated);
 const silenceLog=exec(FF,['-hide_banner','-i',np(output),'-af','silencedetect=noise=-50dB:d=0.04','-f','null','-']).stderr;const starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>+m[1]),ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>+m[1]);const silence=starts.map((start,i)=>({start,end:ends[i]??DURATION}));const unexpected=silence.filter(s=>s.start>.05&&s.end<DURATION-.05);if(unexpected.length)throw Error('Unexpected silence');
 const finalPcm=fs.readFileSync(output);let maxPassError=0;for(let i=Math.ceil(masterEntry[1]*SR);i<Math.floor(chorusEnd*SR);i++)for(let c=0;c<2;c++){const actual=finalPcm.readIntLE(44+i*6+c*3,3)/8388607,expected=master.readFloatLE(i*8+c*4)*gain;maxPassError=Math.max(maxPassError,Math.abs(actual-expected));}if(maxPassError>1/8388607)throw Error('Master phrase not a constant scalar copy');
 const after=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)]));if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Source changed');
 const report={status:'TECHNICAL_PASS',revision:'fade-fix-same-song-88bpm',id:'01',slug:'pui-promo-v2',file:output,sha256:hash(output),frames:FRAMES,fps:FPS,duration:DURATION,sampleRate:SR,sampleFrames:N,channels:2,bits:24,sources:Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,{path:p,sha256:before[k],unchanged:before[k]===after[k]}])),sourceOriginalsUnchanged:true,pictureChorus:{outputStart:chorusStart,outputEnd:chorusEnd,fullSourceStart:76.3,fullSourceEnd:2392/30},continuousSongClock:{sourceStart:sourceAt,sourceEnd:sourceAt+DURATION,bpm:88,noTimeStretch:true,noPitchShift:true},timingDesign:{masterEntryCrossfade:masterEntry,masterEntrySource:masterEntry.map(t=>sourceAt+t),fullMasterEnvelopeUnity:[masterEntry[1],masterExit[0]],masterExitCrossfade:masterExit,masterExitSource:masterExit.map(t=>sourceAt+t),residualWet:[chorusEnd,wetEnd],wetFade:[wetFadeAt,wetEnd],nextDryWordExcludedAfterSource:sourceAt+masterExit[1],noIntentionalSilentPocket:true,sameSongBeatAlwaysPresent:true,programOpeningFadeSeconds:.08,programEndFadeSeconds:.30},levels:{soloBeatLiftDb,beatScale,wetScale,oneCommonStaticGainDb:gainDb,gainPolicy:'Common static gain only. No dynamic loudnorm processing or phrase-specific compression; accepted V6 phrase is a scalar copy.',preGainPeakDbfs:db(peak)},originalSfx:{removed:'All150BPM score/cut ticks/reverse sweeps',cues:fx},vocalPassThrough:{cueId:cue.id,estimatedCueSource:[cue.audioStartEstimate,cue.audioEndEstimate],points:[76.313455,79.575455,79.7,79.72,79.73].map(t=>({source:t,global:t-sourceAt,envelope:masterEnvelope(t-sourceAt),relativeFadeDb:db(masterEnvelope(t-sourceAt))})),mask:{windowSamples:480,thresholdRmsDbfs:-45,activeSamples:active,samplesInFade:attenuated,firstActiveGlobal:firstActive,lastActiveGlobal:lastActive,allActiveSamplesMasterGainConstant:true,actualOutputVsMasterMaxAbsoluteError:maxPassError,withinOne24bitLsb:maxPassError<=1/8388607},windows:mask,tailSelection:'Dry stem10ms RMS:79.69=-21dB,79.70=-25dB,79.72=-36dB,79.73=-48dB,79.74/75=-51/-55dB. Fade only after source79.733 in quiet valley; master ends79.753 before next-word onset79.76. Existing wet fades out by79.80, before strong next-word plate onset near79.91. No new reverb.'},targetIntegratedLufs:-14,acceptedIntegratedLufsRange:[-17,-13],levelTradeoff:'Owner prioritized intact vocal/natural balance over exact-14LUFS; lower loudness avoids new dynamic compression.',maximumTruePeakDbtp:-2.2,firstPass:first,measured,probe,silenceDetection:{thresholdDbfs:-50,minimumDuration:.04,events:silence,unexpected},checkpoint,originalPreFixCheckpoint:'checkpoints/fade-fix-01-2026-10-24T10-33-01-116Z',verificationScope:{fullWaveDecodedDuringMeasurement:true,sourceHashesBeforeAfter:true,directHumanListening:false,finalAacMeasured:false}};
 fs.writeFileSync(qa,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(fix,JSON.stringify({status:'FIXED_AND_MEASURED',mixSha256:report.sha256,checkpoint,originalPreFixCheckpoint:report.originalPreFixCheckpoint,levelTradeoff:report.levelTradeoff,acceptedIntegratedLufsRange:report.acceptedIntegratedLufsRange,oldProblem:'Independent150BPM bed,100ms silence, vocal head/tail faded.',newPlacement:report.timingDesign,vocalPassThrough:report.vocalPassThrough,levels:report.levels,measured,silence:report.silenceDetection,sourceOriginalsUnchanged:true,actualAudioEdited:true,directAudition:false,finalAacAndVideo:'root reexport required'},null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const r=makeMix(process.argv[2]||DEFAULT_ROOT);console.log(JSON.stringify({file:r.file,sha256:r.sha256,lufs:r.measured.input_i,truePeak:r.measured.input_tp,duration:r.duration,vocalFadeSamples:r.vocalPassThrough.mask.samplesInFade,silence:r.silenceDetection.events}));}
