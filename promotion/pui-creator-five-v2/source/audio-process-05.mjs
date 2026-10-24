import fs from 'node:fs';
import {FF,FP,np,file,hash,parse,run,save} from './native.mjs';
const ROOT='/mnt/e/Desktop/音源/medicate';
const sources={v5:ROOT+'/MIX_v5_KeyFix/medicate_MIX_v5_KeyFix.wav',v6:ROOT+'/MIX_v6_Natural/medicate_MIX_v6_Natural.wav',mv:ROOT+'/MV_v3_ArtistLyrics/medicate_MV_v3_ArtistLyrics.mp4',beat:ROOT+'/MIX_v6_Natural/Audio/z5824Notag (1).wav'};
const duration=412/30,sampleRate=48000,totalSamples=659200;
const output=file('media/05-medicate-chorus-v2-mix.wav');
const receipt='qa/audio-process-05.json';
function edgeAudit(p){
 const b=fs.readFileSync(p);let data,fmt;
 for(let o=12;o+8<=b.length;){const id=b.toString('ascii',o,o+4),n=b.readUInt32LE(o+4);if(id==='fmt ')fmt={channels:b.readUInt16LE(o+10),rate:b.readUInt32LE(o+12),align:b.readUInt16LE(o+20),bits:b.readUInt16LE(o+22)};if(id==='data')data=o+8;o+=8+n+(n%2);}
 if(!fmt||data===undefined||fmt.bits!==24)throw Error('Unexpected mix PCM');
 const value=(n,c)=>b.readIntLE(data+n*fmt.align+c*3,3)/8388608;
 return [{name:'program-opening-first-100ms',start:0,duration:.1},{name:'chorus-entry-first-100ms',start:10.3,duration:.1},{name:'chorus-ending-last-200ms',start:duration-.2,duration:.2}].map(w=>{
  const first=Math.round(w.start*fmt.rate),last=Math.round((w.start+w.duration)*fmt.rate);let square=0,maxStep=0,peak=0,count=0;
  for(let n=first;n<last;n++)for(let c=0;c<fmt.channels;c++){const x=value(n,c),prev=n?value(n-1,c):0;square+=x*x;peak=Math.max(peak,Math.abs(x));maxStep=Math.max(maxStep,Math.abs(x-prev));count++;}
  return {...w,rmsDbfs:20*Math.log10(Math.sqrt(square/count)),peakDbfs:20*Math.log10(peak),maximumAdjacentSampleStep:maxStep,maximumAdjacentSampleStepDbfs:20*Math.log10(maxStep)};
 });
}
const previousMix=fs.existsSync(output)?{sha256:hash(output),edgeWindows:edgeAudit(output)}:null;
const priorReceipt=fs.existsSync(file(receipt))?parse(fs.readFileSync(file(receipt),'utf8')):null;
const before=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)]));
const inputs=Object.values(sources).flatMap(p=>['-i',np(p)]);
const graph=[
 '[0:a]atrim=start=21.7:end=25.1,asetpts=PTS-STARTPTS,volume=-0.33dB,afade=t=in:d=0.10,afade=t=out:st=3.25:d=0.15,aresample=48000,apad,atrim=end_sample=163200,adelay=57600S:all=1[A]',
 '[1:a]atrim=start=21.7:end=25.1,asetpts=PTS-STARTPTS,afade=t=in:d=0.10,afade=t=out:st=3.25:d=0.15,aresample=48000,apad,atrim=end_sample=163200,adelay=254400S:all=1[B]',
 '[2:a]atrim=start=76.3:end=79.73333333333333,asetpts=PTS-STARTPTS,afade=t=in:d=0.1,afade=t=out:st=3.2333333333333334:d=0.2,aresample=48000,apad,atrim=end_sample=164800,adelay=494400S:all=1[MV]',
 '[3:a]asplit=2[beatIntro][beatChoice]',
 '[beatIntro]atrim=start=20.5:end=21.7,asetpts=PTS-STARTPTS,volume=-18dB,afade=t=in:d=0.1,afade=t=out:st=1.15:d=0.05,aresample=48000,apad,atrim=end_sample=57600[intro]',
 '[beatChoice]atrim=start=25.1:end=26.7,asetpts=PTS-STARTPTS,volume=-18dB,afade=t=in:d=0.03,afade=t=out:st=1.46:d=0.14,aresample=48000,apad,atrim=end_sample=76800,adelay=417600S:all=1[choice]',
 '[A][B][MV][intro][choice]amix=inputs=5:duration=longest:dropout_transition=0:normalize=0,apad,atrim=end_sample=659200[mix]'
].join(';');
const first=await run(FF,['-hide_banner',...inputs,'-filter_complex',graph+';[mix]loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json[measure]','-map','[measure]','-f','null','-']);
const s=first.stderr;
const measured=parse(s.slice(s.lastIndexOf('{'),s.lastIndexOf('}')+1));
const commonGainDb=Math.min(-14-Number(measured.input_i),-1.6-Number(measured.input_tp));
if(!Number.isFinite(commonGainDb))throw Error('Invalid raw loudness');
const render=await run(FF,['-hide_banner','-v','error','-y',...inputs,'-filter_complex',graph+';[mix]volume='+commonGainDb+'dB[final]','-map','[final]','-ar','48000','-ac','2','-c:a','pcm_s24le','-bitexact',np(output)]);
const finalRun=await run(FF,['-hide_banner','-i',np(output),'-af','ebur128=peak=true','-f','null','-']);
const I=Number([...finalRun.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]);
const TP=Number([...finalRun.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);
const probe=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(output)])).stdout);
const stream=probe.streams.find(s=>s.codec_type==='audio');
const after=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)]));
const unchanged=Object.keys(before).every(k=>before[k]===after[k]);
const result={status:'BUILT_AND_NUMERICALLY_VERIFIED',output,sha256:hash(output),fps:30,videoFrames:412,durationSeconds:duration,sampleRate,totalSamples,format:{codec:stream?.codec_name,bits:stream?.bits_per_sample,channels:stream?.channels,sampleRate:stream?.sample_rate,duration:probe.format.duration},audio:{integratedLufs:I,truePeakDbtp:TP,commonStaticGainDb:commonGainDb,rawInputIntegratedLufs:Number(measured.input_i),rawInputTruePeak:Number(measured.input_tp)},sources:Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,{path:p,sha256Before:before[k],sha256After:after[k],unchanged:before[k]===after[k]}])),allSourcesUnchanged:unchanged,comparison:{A:{source:sources.v5,sourceAt:21.7,sourceEnd:25.1,startSeconds:1.2,endSeconds:4.6,relativeGainDb:-.33},gap:{startSeconds:4.6,endSeconds:5.3},B:{source:sources.v6,sourceAt:21.7,sourceEnd:25.1,startSeconds:5.3,endSeconds:8.7,relativeGainDb:0},finishedMv:{source:sources.mv,sourceAt:76.3,sourceEnd:2392/30,startSeconds:10.3,endSeconds:duration},contextBeds:[{source:sources.beat,sourceAt:20.5,sourceEnd:21.7,startSeconds:0,endSeconds:1.2,gainDb:-18},{source:sources.beat,sourceAt:25.1,sourceEnd:26.7,startSeconds:8.7,endSeconds:10.3,gainDb:-18}],policy:'One common static gain for the entire mix. A/B relative gain is preserved. No independent excerpt normalization, compression, pitch correction, time stretch or mastering added. Quiet source-beat beds only during process context; none during A/B or finished-MV listening.'},fades:{AandB:{inSeconds:.10,outSeconds:.15},mv:{inSeconds:.1,outSeconds:.2},context:'Short fade in/out on original song instrumental only.'},checks:{expectedDuration:Math.abs(Number(probe.format.duration)-duration)<.00003,expectedSamples:Number(stream.duration_ts)===totalSamples,expectedCodec:stream.codec_name==='pcm_s24le',integratedWithinHalfLu:Math.abs(I+14)<=.5,truePeakAtMostMinus1_5:TP<=-1.5,sourceHashesUnchanged:unchanged},directAudition:'NOT_PERFORMED_BY_THIS_AGENT',limits:['PCM assembly and numerical/metadata checks do not substitute for direct audition.','V5 and V6 differ in reverb and approved mastering dynamics; the A/B is an actual revision comparison, not an isolated reverb-only test.','Context beds use the original medicate project beat; no separate beat composer attribution is made.']};
result.chorusFadeComparison=priorReceipt?.chorusFadeComparison||priorReceipt?.edgeComparison||null;
result.fades.programOpeningInSeconds=.1;
result.edgeComparison={previousMix,finalEdgeWindows:edgeAudit(output),method:'Direct 24bit PCM adjacent-sample differences and RMS; not direct audition.'};
if(previousMix)result.edgeComparison.changes=result.edgeComparison.finalEdgeWindows.map((w,i)=>({name:w.name,rmsChangeDb:w.rmsDbfs-previousMix.edgeWindows[i].rmsDbfs,maxStepChangeDb:w.maximumAdjacentSampleStepDbfs-previousMix.edgeWindows[i].maximumAdjacentSampleStepDbfs}));
result.status=Object.values(result.checks).every(Boolean)?'PASS_NUMERICAL_ASSEMBLY':'CHECK_FAILED';
save(receipt,result);
if(!Object.values(result.checks).every(Boolean))throw Error(JSON.stringify(result.checks));
const research=file('research/music-process-episode.json');
if(process.env.PUI_UPDATE_PROCESS_RESEARCH==='1'&&fs.existsSync(research)){const j=parse(fs.readFileSync(research,'utf8'));j.audioBuild={script:file('source/audio-process-05.mjs'),receipt:file(receipt),output,sha256:result.sha256,status:result.status,integratedLufs:I,truePeakDbtp:TP,commonStaticGainDb:commonGainDb,directAudition:result.directAudition};j.timeline[0].audio={source:sources.beat,sourceAt:20.5,sourceEnd:21.7,relativeGainDb:-18,kind:'quiet-original-song-instrumental-context-bed',noVoiceOver:true};j.timeline[4].audio={source:sources.beat,sourceAt:25.1,sourceEnd:26.7,relativeGainDb:-18,kind:'quiet-original-song-instrumental-choice-bed',noVoiceOver:true};j.status='AUDIO_BUILT_DATA_READY_FOR_ROOT_NATIVE_EDIT';j.changesMade='Research JSONと委譲されたaudio-process-05.mjs、05 mix.wav、qa/audio-process-05.jsonのみ。原曲・CWP・動画・他source・Git・GUIは変更していない。';save('research/music-process-episode.json',j);}
console.log(JSON.stringify({output,status:result.status,durationSeconds:duration,samples:totalSamples,integratedLufs:I,truePeakDbtp:TP,commonStaticGainDb:commonGainDb,sourcesUnchanged:unchanged}));
