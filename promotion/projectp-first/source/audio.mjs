/** ProjectP first post / Issue87. Same-song instrumental and intact accepted V6 phrase. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SAMPLE_RATE=48000,FPS=30,FRAMES=818,DURATION=FRAMES/FPS;
const SOURCE_START=54.3,CHORUS_START=22,CHORUS_END=763/30;
const MAIN_SOURCE=[76.3,2392/30];
const MASTER_ENTRY=[21.96,21.99],MASTER_EXIT=[CHORUS_END,CHORUS_END+.020];
const WET_FADE=[25.445,25.455];
const SOURCE_ROOT='/mnt/e/Desktop/音源/medicate/MIX_v6_Natural';
const SOURCES={
  master:SOURCE_ROOT+'/medicate_MIX_v6_Natural.wav',
  beat:SOURCE_ROOT+'/Audio/z5824Notag (1).wav',
  dry:SOURCE_ROOT+'/Stems/VOCAL_ALL_DRY.wav',
  wet:SOURCE_ROOT+'/Stems/HOOK_PLATE_WET.wav'
};
const MANIFEST=SOURCE_ROOT+'/delivery-manifest-v6.json';
const CUES='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/Source/lyrics-timed.json';
const GRID='/mnt/e/Desktop/音源/medicate/MV_v4_Performance/Source/beat-grid.json';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const clamp=x=>Math.max(0,Math.min(1,x));
const db=x=>x>0?20*Math.log10(x):-150;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const parse=s=>JSON.parse(s.replace(/^\uFEFF/,'').trim());
function nativePath(p){const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status!==0||r.error)throw Error(r.stderr||r.error?.message);return r.stdout.trim();}
function command(exe,args,input,binary=false){for(let attempt=0;attempt<3;attempt++){const r=spawnSync(exe,args,{input,encoding:binary?undefined:'utf8',timeout:90000,maxBuffer:80*1024*1024});if(r.status===0&&!r.error)return{stdout:r.stdout,stderr:String(r.stderr),exit:r.status};const detail=(r.error?.message||'')+' '+String(r.stderr);if(attempt<2&&/EPIPE|UtilAcceptVsock|accept4 failed/.test(detail)){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,500);continue;}throw Error(detail);}}
const analysisJson=s=>parse(s.match(/\{[\s\S]*\}/)?.[0]||'{}');
export function masterEnvelope(t){return clamp((t-MASTER_ENTRY[0])/(MASTER_ENTRY[1]-MASTER_ENTRY[0]))*clamp((MASTER_EXIT[1]-t)/(MASTER_EXIT[1]-MASTER_EXIT[0]));}
function encodeWave(left,right,gain){
  const b=Buffer.alloc(44+left.length*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SAMPLE_RATE,24);b.writeUInt32LE(SAMPLE_RATE*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(left.length*6,40);
  for(let i=0;i<left.length;i++)for(let c=0;c<2;c++){const x=(c?right:left)[i]*gain;if(Math.abs(x)>1)throw Error('PCM clipping would occur');b.writeIntLE(Math.round(x*8388607),44+i*6+c*3,3);}return b;
}
export function buildAudio(root=ROOT){
  const output=path.join(root,'media/first-mix.wav'),qa=path.join(root,'qa/audio.json'),decodeQa=path.join(root,'qa/audio-full-decode.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(path.dirname(qa),{recursive:true});
  const before=Object.fromEntries(Object.entries(SOURCES).map(([k,p])=>[k,sha(p)]));
  const approved=parse(fs.readFileSync(MANIFEST,'utf8')),grid=parse(fs.readFileSync(GRID,'utf8'));
  if(before.master!==approved.files['medicate_MIX_v6_Natural.wav'].sha256||before.master!==grid.source.master.sha256||before.beat!==grid.source.beat.sha256)throw Error('Accepted master / same-clock beat proof mismatch');
  const cue=parse(fs.readFileSync(CUES,'utf8')).cues.find(c=>c.id==='hook2-L01');
  const samples=FRAMES*SAMPLE_RATE/FPS;
  function decode(file,channels=2){const b=command(FF,['-v','error','-ss',String(SOURCE_START),'-i',nativePath(file),'-t',String(DURATION),'-ar',String(SAMPLE_RATE),'-ac',String(channels),'-c:a','pcm_f32le','-f','f32le','pipe:1'],undefined,true).stdout;if(b.length!==samples*channels*4)throw Error('Unexpected decoded sample count '+file);return b;}
  const master=decode(SOURCES.master),beat=decode(SOURCES.beat),wet=decode(SOURCES.wet),dry=decode(SOURCES.dry,1);
  const soloBeatLiftDb=2.5,beatScale=10**((-6+approved.master.fixed_gain_db+soloBeatLiftDb)/20),wetScale=10**(approved.master.fixed_gain_db/20);
  const left=new Float64Array(samples),right=new Float64Array(samples);let preGainPeak=0;
  for(let i=0;i<samples;i++){
    const t=i/SAMPLE_RATE,m=masterEnvelope(t),program=clamp(t/.08)*clamp((DURATION-1/SAMPLE_RATE-t)/.30);
    const residual=t>=CHORUS_END&&t<WET_FADE[1]?clamp((WET_FADE[1]-t)/(WET_FADE[1]-WET_FADE[0])):0;
    for(let c=0;c<2;c++){const at=i*8+c*4,x=(master.readFloatLE(at)*m+beat.readFloatLE(at)*beatScale*(1-m)+wet.readFloatLE(at)*wetScale*residual*(1-m))*program;(c?right:left)[i]=x;preGainPeak=Math.max(preGainPeak,Math.abs(x));}
  }
  // Analyze a headroom-safe copy; FFmpeg's processed loudnorm output is discarded.
  const measurementHeadroom=Math.min(1,.80/preGainPeak);
  const first=analysisJson(command(FF,['-hide_banner','-i','pipe:0','-af','loudnorm=I=-14:TP=-2.2:LRA=7:print_format=json','-f','null','-'],encodeWave(left,right,measurementHeadroom)).stderr);
  const commonGainDb=db(measurementHeadroom)+Math.min(-14-Number(first.input_i),-2.25-Number(first.input_tp));
  const commonGain=10**(commonGainDb/20),final=encodeWave(left,right,commonGain);
  fs.writeFileSync(output,final);
  const measured=analysisJson(command(FF,['-hide_banner','-i',nativePath(output),'-af','loudnorm=I=-14:TP=-2.2:LRA=7:print_format=json','-f','null','-']).stderr);
  const probe=parse(command(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',nativePath(output)]).stdout),stream=probe.streams[0];
  if(stream.codec_name!=='pcm_s24le'||Number(stream.sample_rate)!==SAMPLE_RATE||stream.channels!==2||Number(stream.bits_per_sample)!==24||Number(stream.duration_ts)!==samples||Number(measured.input_tp)>-2.2||Number(measured.input_i)<-18||Number(measured.input_i)>-12)throw Error('Audio format/level QA failed '+JSON.stringify({probe,measured}));
  const windows=[];let activeSamples=0,fadeOverlapSamples=0,maxMasterError=0;
  for(let i=Math.round(MASTER_ENTRY[0]*SAMPLE_RATE);i<Math.round(MASTER_EXIT[1]*SAMPLE_RATE);i+=480){let square=0;for(let n=i;n<Math.min(samples,i+480);n++)square+=dry.readFloatLE(n*4)**2;const rmsDbfs=10*Math.log10(Math.max(1e-30,square/480));if(rmsDbfs>-45)for(let n=i;n<Math.min(samples,i+480);n++){activeSamples++;if(masterEnvelope(n/SAMPLE_RATE)<1-1e-9)fadeOverlapSamples++;}windows.push({outputStart:i/SAMPLE_RATE,sourceStart:SOURCE_START+i/SAMPLE_RATE,dryRmsDbfs:rmsDbfs,masterEnvelope:masterEnvelope(i/SAMPLE_RATE)});}
  for(let i=Math.ceil(MASTER_ENTRY[1]*SAMPLE_RATE);i<Math.floor(CHORUS_END*SAMPLE_RATE);i++)for(let c=0;c<2;c++){const actual=final.readIntLE(44+i*6+c*3,3)/8388607,expected=master.readFloatLE(i*8+c*4)*commonGain;maxMasterError=Math.max(maxMasterError,Math.abs(actual-expected));}
  if(fadeOverlapSamples||maxMasterError>1/8388607)throw Error('A vocal fade or nonconstant phrase gain was detected');
  const nextWordStart=79.76-SOURCE_START;let nextWordMaxMasterGain=0,nextWordMaxWetGain=0;for(let i=Math.ceil(nextWordStart*SAMPLE_RATE);i<samples;i++){const t=i/SAMPLE_RATE;nextWordMaxMasterGain=Math.max(nextWordMaxMasterGain,masterEnvelope(t));nextWordMaxWetGain=Math.max(nextWordMaxWetGain,t>=CHORUS_END&&t<WET_FADE[1]?clamp((WET_FADE[1]-t)/(WET_FADE[1]-WET_FADE[0])):0);}if(nextWordMaxMasterGain||nextWordMaxWetGain)throw Error('Following lyric or wet leaks into mix');
  const decoded=command(FF,['-v','error','-threads','1','-i',nativePath(output),'-map','0:a:0','-f','null','-']);
  const silenceLog=command(FF,['-hide_banner','-i',nativePath(output),'-af','silencedetect=noise=-50dB:d=0.04','-f','null','-']).stderr;
  const starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>+m[1]),ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>+m[1]),silence=starts.map((start,i)=>({start,end:ends[i]??DURATION}));
  const unexpected=silence.filter(s=>s.start>.05&&s.end<DURATION-.05);if(unexpected.length)throw Error('Unexpected silence '+JSON.stringify(unexpected));
  const after=Object.fromEntries(Object.entries(SOURCES).map(([k,p])=>[k,sha(p)]));if(JSON.stringify(before)!==JSON.stringify(after))throw Error('An original source changed');
  const report={schema:1,status:'TECHNICAL_PASS',issue:87,output,sha256:sha(output),pictureFrames:FRAMES,fps:FPS,duration:DURATION,sampleRate:SAMPLE_RATE,sampleFrames:samples,channels:2,bits:24,sources:Object.fromEntries(Object.entries(SOURCES).map(([k,p])=>[k,{path:p,sha256:before[k],sha256After:after[k],unchanged:before[k]===after[k]}])),approvedV6Manifest:MANIFEST,continuousClock:{sourceStart:SOURCE_START,sourceEnd:SOURCE_START+DURATION,bpm:grid.bpm,zeroMasterToBeatOffsetSamples:grid.audioOffset.masterRelativeToBeatSamples,noTimeStretch:true,noPitchShift:true},mainPhrase:{cueId:cue.id,cueConfidence:cue.confidence,output:[CHORUS_START,CHORUS_END],source:MAIN_SOURCE,estimatedCueSource:[cue.audioStartEstimate,cue.audioEndEstimate]},placement:{entry:MASTER_ENTRY,entrySource:MASTER_ENTRY.map(t=>SOURCE_START+t),constantMaster:[MASTER_ENTRY[1],CHORUS_END],exit:MASTER_EXIT,exitSource:MASTER_EXIT.map(t=>SOURCE_START+t),existingWetTail:[CHORUS_END,WET_FADE[1]],existingWetFade:WET_FADE,wetClosedAtSource:SOURCE_START+WET_FADE[1],programOpeningFade:.08,programEndingFade:.30,sameSongBeatContinuous:true,intentionalSilentPocket:false},vocalProtection:{maskWindowSamples:480,maskRmsThresholdDbfs:-45,activeSamples,fadeOverlapSamples,allDetectedVocalSamplesUnityEnvelope:fadeOverlapSamples===0,actualPhrasePcmMaxError:maxMasterError,actualPhraseIsConstantScalarCopyWithinOne24bitLsb:maxMasterError<=1/8388607,points:[76.313455,79.575455,79.7,79.72,79.73].map(t=>({sourceTime:t,outputTime:t-SOURCE_START,envelope:masterEnvelope(t-SOURCE_START),fadeDb:db(masterEnvelope(t-SOURCE_START))})),nextDryWordSourceStart:79.76,nextWordMaxMasterGain,nextDryWordExcluded:true,nextWordWetGain:nextWordMaxWetGain,wetClosureGuardSeconds:79.76-(SOURCE_START+WET_FADE[1]),wetPolicy:'Original hook plate only until source79.755; closed before the following dry-word pickup at79.76. No added reverb. Entry/exit are in the measured dry quiet valleys, not on cue-estimated body.',windows},levels:{targetLufs:-14,integratedLufs:Number(measured.input_i),truePeakDbtp:Number(measured.input_tp),peakCeilingDbtp:-2.2,commonStaticGainDb:commonGainDb,soloBeatLiftDb,beatScale,wetScale,preGainPeakDbfs:db(preGainPeak),policy:'Single static program gain; loudnorm used only to measure. No compression, limiting, dynamic loudnorm, pitch/time edits or vocal-envelope fading added.',tradeoff:'Preserve vocal dynamics and a continuous same-song beat; peak ceiling takes priority over forcing exactly-14LUFS.'},effects:{added:[],gameSfx:[],reason:'No game SFX rights/recording assumptions; no fixed150BPM tick/sweep layer.'},silence:{thresholdDbfs:-50,minimumSeconds:.04,events:silence,unexpected},fullDecode:{exit:decoded.exit,stderr:decoded.stderr},probe,measurementOnlyLoudnorm:{firstPass:first,finalPass:measured,processedOutputNeverSaved:true},checks:{originalHashesUnchanged:true,fullWaveDecodePassed:decoded.exit===0,exact818FramesAt30fps:true,vocalFadeOverlapZero:fadeOverlapSamples===0,constantMainPhrase:true,nextLyricNotMixed:true,unexpectedSilenceZero:unexpected.length===0,pcm24bit48kStereo:true,truePeakWithinCeiling:Number(measured.input_tp)<=-2.2},verificationScope:{numericPcmAndStemChecks:true,directWholeAudition:false,naturalListeningQualityApproved:false,finalAacMeasured:false,finalVideoAndAac:'Root will export/verify the final MP4 separately.'}};
  fs.writeFileSync(qa,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(decodeQa,JSON.stringify({output,sha256:report.sha256,fullAudioDecode:true,exit:decoded.exit,stderr:decoded.stderr},null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const r=buildAudio();console.log(JSON.stringify({file:r.output,sha256:r.sha256,seconds:r.duration,samples:r.sampleFrames,lufs:r.levels.integratedLufs,truePeak:r.levels.truePeakDbtp,vocalFadeSamples:r.vocalProtection.fadeOverlapSamples,silence:r.silence.events}));}
