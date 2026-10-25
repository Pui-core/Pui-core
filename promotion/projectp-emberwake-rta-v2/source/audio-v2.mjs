/** Issue89: add original, sparse editorial accents to the preserved Issue88 score. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SR=48000,FPS=30,DURATION=60,FRAMES=1800;
const N=SR*DURATION,TAU=2*Math.PI;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const db=x=>20*Math.log10(Math.max(1e-15,x));
const gain=d=>10**(d/20);
function command(exe,args,input){
 for(let attempt=0;attempt<3;attempt++){
  const r=spawnSync(exe,args,{input,encoding:'utf8',maxBuffer:80*1024*1024,timeout:90000});
  if(!r.error&&r.status===0)return r;
  const error=(r.error?.message||'')+' '+String(r.stderr);
  if(attempt<2&&/EPIPE|UtilAcceptVsock|accept4 failed/.test(error))continue;
  throw Error(error);
 }
}
function tool(kind){
 const override=process.env[kind==='ffmpeg'?'PUI_FFMPEG':'PUI_FFPROBE'];
 if(override)return override;
 const win='/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/'+kind+'.exe';
 return fs.existsSync(win)?fs.realpathSync(win):kind;
}
const nativePath=(p,exe)=>/\.exe$/i.test(exe)?command('wslpath',['-w',path.resolve(p)]).stdout.trim():path.resolve(p);
const parsed=s=>JSON.parse(String(s).match(/\{[\s\S]*\}/)?.[0]||'{}');
function readWave(file){
 const b=fs.readFileSync(file);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE')throw Error('Not RIFF WAVE');
 let fmt,data;
 for(let p=12;p+8<=b.length;){const id=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(p+8+size>b.length)throw Error('Truncated WAV');if(id==='fmt ')fmt=b.subarray(p+8,p+8+size);if(id==='data')data=b.subarray(p+8,p+8+size);p+=8+size+(size%2);}
 if(!fmt||!data)throw Error('Missing fmt/data');
 const format=fmt.readUInt16LE(0),channels=fmt.readUInt16LE(2),sr=fmt.readUInt32LE(4),bits=fmt.readUInt16LE(14),pcm=format===1||(format===65534&&fmt.length>=40&&fmt.readUInt16LE(24)===1);
 if(!pcm||channels!==2||sr!==SR||bits!==24||data.length!==N*6)throw Error('Expected exact60s48k stereo24 PCM source');
 const L=new Float64Array(N),R=new Float64Array(N);
 for(let i=0;i<N;i++){L[i]=data.readIntLE(i*6,3)/8388607;R[i]=data.readIntLE(i*6+3,3)/8388607;}
 return{L,R};
}
function wave(L,R,g=1){
 const b=Buffer.alloc(44+N*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(N*6,40);
 for(let i=0;i<N;i++)for(let c=0;c<2;c++){const x=(c?R:L)[i]*g;if(Math.abs(x)>=1)throw Error('PCM would clip');b.writeIntLE(Math.round(x*8388607),44+i*6+c*3,3);}
 return b;
}

/** Anchors agreed with the camera editor; at is output seconds, never source time. */
export function accentPlan(){
 const E=[],add=(at,d,kind,amplitude,why,pan=0,frequency=73.416)=>E.push({at,d,kind,amplitude,why,pan,frequency});
 add(.04,.23,'pulse',.105,'Low opening attack after the existing35ms fade');
 add(.50,.16,'pulse',.050,'One short opening pickup');
 add(1.00,.15,'pulse',.055,'Opening acceleration, not a constant percussion loop');
 add(1.30,.11,'dry-hit',.125,'First core fitting: camera agreement at frame39',-.08,140);
 add(3.08,.12,'whip',.055,'Fast title reveal: short pre-cut air',-.35,760);
 add(3.20,.24,'pulse',.100,'Title landing');
 add(6.68,.12,'whip',.044,'Gameplay premise push',.35,880);
 add(9.68,.12,'whip',.054,'TIME ATTACK menu reveal',-.30,1020);
 add(9.80,.09,'dry-hit',.067,'Readable RTA menu landing',0,165);
 add(11.84,.16,'whip',.059,'Enter the practical core puzzle',.30,740);
 add(12.00,.23,'pulse',.105,'Puzzle downbeat');
 add(14.50,.14,'pulse',.040,'One offbeat pulse in the carrying sequence');
 add(15.47,.13,'whip',.042,'Push toward the core socket',-.30,830);
 add(508/30,.115,'dry-hit',.125,'Second core fitting: camera agreement at frame508',.08,125);
 add(508/30,.18,'pulse',.065,'Low support under the core fitting',0,58.270);
 add(18.45,.15,'whip',.048,'Jump sequence entry',.30,980);
 add(586/30,.090,'dry-hit',.077,'ChapterI frame238 landing: output frame586',-.06,155);
 add(625/30,.085,'dry-hit',.070,'ChapterI frame277 landing: output frame625',.06,175);
 add(664/30,.100,'dry-hit',.080,'ChapterI frame316 landing across the22s cut',0,145);
 add(23.50,.14,'pulse',.039,'Sparse forward pulse under the town response',0,65.406);
 add(26.07,.13,'whip',.047,'Route replay entry',-.35,890);
 add(26.20,.20,'pulse',.085,'Route replay landing',0,73.416);
 add(28.49,.11,'whip',.041,'Quick change to the next route view',.35,1100);
 add(29.50,.14,'pulse',.037,'A-root pickup before the wider chapter view',0,55);
 add(30.87,.13,'whip',.050,'Faster re-fit sequence',-.30,860);
 add(31.00,.20,'pulse',.087,'Re-fit section downbeat',0,58.270);
 add(33.49,.11,'whip',.046,'One final rapid route push',.30,990);
 add(33.60,.10,'dry-hit',.061,'Self-best aspiration landing; no fabricated record',0,150);
 add(36.60,.20,'pulse',.070,'World reveal then less percussion',0,65.406);
 add(39.90,.10,'whip',.029,'Small transition into the actual code excerpt',-.20,700);
 add(43.85,.15,'whip',.028,'Making-of to the wider development image',.20,780);
 add(44.00,.18,'pulse',.052,'Quiet world-image landing',0,58.270);
 add(47.88,.12,'whip',.024,'Light introduction of support preparation',-.20,680);
 add(48.00,.10,'dry-hit',.040,'Support card: understated landing',0,125);
 // Forward action has distinct attacks above the sparse score; later editorial air stays light.
 for(const e of E)if(e.at<36.6)e.amplitude*=e.kind==='dry-hit'?1.7:e.kind==='whip'?1.6:1.4;
 return E.sort((a,b)=>a.at-b.at);
}

// Broad, pre-authored arrangement levels. This is not sample/peak-dependent compression.
// The final8s and all existing program-in/out/cadence curves keep their original shape.
export const scoreGainKeys=[[0,1.35],[3.2,1.35],[4.4,2.8],[11,2.8],[13,2.15],[28,2.15],[30,1.0],[33,.50],[35,.50],[36.5,1.0],[40,1.0],[43,2.2],[47,1.6],[49,.6],[52,0],[60,0]];
function scoreDb(t){let k=1;while(k<scoreGainKeys.length&&t>scoreGainKeys[k][0])k++;const a=scoreGainKeys[Math.min(k-1,scoreGainKeys.length-1)],b=scoreGainKeys[Math.min(k,scoreGainKeys.length-1)];if(a===b)return a[1];return a[1]+(b[1]-a[1])*ease((t-a[0])/(b[0]-a[0]));}
function synthesize(events){
 const L=new Float64Array(N),R=new Float64Array(N);let seed=0x89555a17;
 const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/2147483648-1;};
 for(const e of events){
  const start=Math.round(e.at*SR),count=Math.round(e.d*SR);let low=0,phase=0,peak=0,energy=0;
  for(let n=0;n<count;n++){
   const u=n/SR,p=n/(count-1),remaining=e.d-u;let v,pan=e.pan;
   if(e.kind==='whip'){
    // Short band-limited air plus a quiet downward tone; no sustained bright hiss.
    const frequency=e.frequency*(1.55-.95*p);phase+=TAU*frequency/SR;
    const alpha=1-Math.exp(-TAU*(1050+850*Math.sin(Math.PI*p))/SR);low+=alpha*(noise()-low);
    const env=ease(u/.018)*ease(remaining/.020)*Math.sin(Math.PI*p)**1.2;
    v=(low*1.4+.13*Math.sin(phase))*env;pan=e.pan*(2*p-1);
   }else if(e.kind==='dry-hit'){
    low+=(1-Math.exp(-TAU*1550/SR))*(noise()-low);
    phase+=TAU*(e.frequency*(.62+1.15*Math.exp(-u*48)))/SR;
    v=(.72*Math.sin(phase)*Math.exp(-u*37)+.40*low*Math.exp(-u*68))*ease(u/.0025)*ease(remaining/.016);
   }else{
    phase+=TAU*(e.frequency*(1+.30*Math.exp(-u*32)))/SR;
    v=(Math.sin(phase)+.16*Math.sin(2*phase))*Math.exp(-u*16)*ease(u/.004)*ease(remaining/.035);
   }
   v*=e.amplitude;const i=start+n;if(i>=N)break;
   const l=v*Math.sqrt((1-pan)/2),r=v*Math.sqrt((1+pan)/2);L[i]+=l;R[i]+=r;peak=Math.max(peak,Math.abs(l),Math.abs(r));energy+=l*l+r*r;
  }
  e.startSample=start;e.endSample=start+count;e.outputFrame=e.at*FPS;e.synthPeakDbfs=db(peak);e.synthRmsDbfs=10*Math.log10(Math.max(1e-30,energy/(count*2)));
 }
 return{L,R};
}

export function buildAudioV2(root=ROOT){
 const source=path.join(root,'media/emberwake-60-mix.wav'),oldQa=path.join(root,'qa/audio.json'),output=path.join(root,'media/emberwake-rta-v2-mix.wav'),qa=path.join(root,'qa/audio-v2.json');
 const before={source:hash(source),oldQa:hash(oldQa)},reference=JSON.parse(fs.readFileSync(oldQa,'utf8'));
 if(before.source!==reference.sha256)throw Error('Preserved score does not match Issue88 QA');
 const FF=tool('ffmpeg'),FP=tool('ffprobe'),bed=readWave(source),events=accentPlan(),fx=synthesize(events),L=new Float64Array(N),R=new Float64Array(N);
 let peak=0,fxActive=0;
 for(let i=0;i<N;i++){const g=gain(scoreDb(i/SR));L[i]=bed.L[i]*g+fx.L[i];R[i]=bed.R[i]*g+fx.R[i];peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));if(fx.L[i]!==0||fx.R[i]!==0)fxActive++;}
 const measure=(bytes)=>parsed(command(FF,['-hide_banner','-threads','1','-i','pipe:0','-af','loudnorm=I=-16.8:TP=-2:LRA=15:print_format=json','-f','null','-'],bytes).stderr);
 const temporaryGain=Math.min(1,.78/peak),first=measure(wave(L,R,temporaryGain));
 const staticGainDb=db(temporaryGain)+Math.min(-16.8-Number(first.input_i),-2.15-Number(first.input_tp)),G=gain(staticGainDb),final=wave(L,R,G);
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(path.dirname(qa),{recursive:true});fs.writeFileSync(output,final);
 const measurement=measure(final),probe=JSON.parse(command(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',nativePath(output,FP)]).stdout),s=probe.streams[0];
 const decoded=command(FF,['-v','error','-xerror','-threads','1','-i',nativePath(output,FF),'-map','0:a:0','-f','null','-']);
 const silenceLog=String(command(FF,['-hide_banner','-threads','1','-i',nativePath(output,FF),'-af','silencedetect=noise=-55dB:d=0.06','-f','null','-']).stderr),starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>+m[1]),ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>+m[1]),silences=starts.map((start,i)=>({start,end:ends[i]??DURATION})),unexpected=silences.filter(e=>e.start>.10&&e.start<59.3);
 const rms=(A,B,a,b)=>{let sum=0,k=0;for(let i=Math.round(a*SR);i<Math.min(N,Math.round(b*SR));i++){sum+=A[i]*A[i]+B[i]*B[i];k+=2;}return 10*Math.log10(Math.max(1e-30,sum/Math.max(1,k)));};
 const cuts=[0,1.2,3.2,6.8,9.8,12,15.6,18.6,22,26.2,28.6,31,33.6,36.6,40,44,48,53],boundaries=[...new Set([...cuts,...events.flatMap(e=>[e.at,e.at+e.d]),58.75,59.95])].sort((a,b)=>a-b).map(t=>{
  const n=Math.max(1,Math.min(N-1,Math.round(t*SR)));let step=0,sum=0,count=0,maxStep=0;
  for(let c=0;c<2;c++){const A=c?R:L;step=Math.max(step,Math.abs(A[n]-A[n-1])*G);for(let j=Math.max(1,n-480);j<Math.min(N,n+480);j++){const d=(A[j]-A[j-1])*G;sum+=d*d;count++;maxStep=Math.max(maxStep,Math.abs(d));}}
  const derivativeRms=Math.sqrt(sum/count);return{time:t,singleSampleStep:step,neighbourhoodMaxStep:maxStep,derivativeRms,isolatedJump:step>.035&&step>8*Math.max(derivativeRms,1e-12)};
 });
 let clips=0,maxError=0,ctaError=0,ctaFx=0,maxStep=0;
 for(let i=0;i<N;i++)for(let c=0;c<2;c++){
  const v=final.readIntLE(44+i*6+c*3,3)/8388607,w=(c?R:L)[i]*G;maxError=Math.max(maxError,Math.abs(v-w));if(Math.abs(v)>=1)clips++;
  if(i>=53*SR){ctaError=Math.max(ctaError,Math.abs(v-(c?bed.R:bed.L)[i]*G));ctaFx=Math.max(ctaFx,Math.abs((c?fx.R:fx.L)[i]));}
  if(i)maxStep=Math.max(maxStep,Math.abs(v-final.readIntLE(44+(i-1)*6+c*3,3)/8388607));
 }
 const after={source:hash(source),oldQa:hash(oldQa)},phases=[[0,4],[4,12],[12,30],[30,42],[42,50],[50,60],[53,60]].map(([a,b])=>({a,b,baseRmsDbfs:rms(bed.L,bed.R,a,b),mixRmsDbfs:rms(L,R,a,b)+staticGainDb,addedFxRmsDbfs:rms(fx.L,fx.R,a,b)+staticGainDb}));
 const checks={sourceAndOldQaUnchanged:JSON.stringify(before)===JSON.stringify(after),sourceMatchesOriginalQa:before.source===reference.sha256,exactSamples:Number(s.duration_ts)===N,exact60seconds:Math.abs(Number(probe.format.duration)-60)<1e-6,pcm48kStereo24:s.codec_name==='pcm_s24le'&&Number(s.sample_rate)===SR&&s.channels===2&&s.bits_per_sample===24,fullDecode:decoded.status===0,truePeakHeadroom:Number(measurement.input_tp)<=-2,integratedRangeReasonable:Number(measurement.input_i)>=-18&&Number(measurement.input_i)<=-16,noClip:clips===0,noUnexpectedSilence:unexpected.length===0,noIsolatedEditJump:!boundaries.some(b=>b.isolatedJump),ctaNoAddedFx:ctaFx===0,ctaOriginalFadeAndCadencePreserved:ctaError<=.51/8388607,sampleTimingPreserved:maxError<=.51/8388607,noFxAfter53:events.every(e=>e.at+e.d<=53),lastSamplesZero:final.readIntLE(final.length-6,3)===0&&final.readIntLE(final.length-3,3)===0};
 const report={schema:1,status:Object.values(checks).every(Boolean)?'PASS_NUMERIC_AUDIO_V2_WITH_AUDITION_LIMIT':'FAIL_NUMERIC_AUDIO_V2',issue:89,output,sha256:hash(output),duration:DURATION,fps:FPS,pictureFrames:FRAMES,sampleRate:SR,sampleFrames:N,channels:2,bits:24,bpm:120,source:{path:source,sha256Before:before.source,sha256After:after.source,qaPath:oldQa,qaSha256Before:before.oldQa,qaSha256After:after.oldQa,issue:88,preservedUnchanged:true,policy:'Decode once at its original clock; no trim, loop, resample, time-stretch or source overwrite.'},authorship:{base:'Issue88 originally authored additive-synthesis score',newFx:'Original deterministic lowpassed noise, sine pulse and short synthesized dry impact; no downloaded or game-recorded samples',gameAudioClaim:false,newVoiceOrNarration:false},arrangement:{scoreGainKeysDb:scoreGainKeys,policy:'Pre-authored broad smoothstep levels, independent of instantaneous peaks. One final static gain. No compressor/limiter/dynamic normalization.',addedFxActiveSeconds:fxActive/SR,noFxAfter53:true,cta:'From53s the original PCM and cadence/fade are unchanged apart from one constant output gain.',cameraAnchors:{coreFits:[1.3,508/30],jumpLandings:[586/30,625/30,664/30],notAccentedCoreFit:976/30},events},levels:{targetIntegratedLufs:-16.8,targetTruePeakCeilingDbtp:-2,integratedLufs:Number(measurement.input_i),truePeakDbtp:Number(measurement.input_tp),lraLu:Number(measurement.input_lra),staticGainDb,samplePeakBeforeStaticGainDbfs:db(peak),phases},fadeSync:{baseContentStartOffsetSamples:0,baseContentEndSample:N,baseSampleClockUnchanged:true,originalInSeconds:.035,originalOutSeconds:1.25,fxEnvelope:'Smoothstep attack/release; whip18/20ms, dry-hit2.5/16ms, pulse4/35ms',maxQuantizationReconstructionError:maxError,ctaMaxErrorFromSourceTimesConstantGain:ctaError,ctaFxPeak:ctaFx},waveform:{clippedSamples:clips,maxSingleSampleDelta:maxStep,boundaries,lastStereoPcm:[final.readIntLE(final.length-6,3),final.readIntLE(final.length-3,3)]},silence:{thresholdDbfs:-55,minSeconds:.06,events:silences,unexpected,allowed:'Only first100ms or terminal decay after59.3s'},probe,fullDecode:{exit:decoded.status,stderr:String(decoded.stderr)},measurementOnly:{firstPass:first,finalPass:measurement,processedOutputSaved:false},checks,verificationScope:{fullWavDecoded:true,numericBoundaryScreen:true,directWholeAudition:false,perceptualClickFreeClaim:false,finalAacMeasured:false,finalMp4:'Separate native export by root required'},reproduce:'node source/audio-v2.mjs'};
 fs.writeFileSync(qa,JSON.stringify(report,null,2)+'\n');
 if(Object.values(checks).some(v=>!v))throw Error('V2 audio QA failed '+JSON.stringify({checks,levels:report.levels,unexpected}));
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const q=buildAudioV2();console.log(JSON.stringify({file:q.output,sha256:q.sha256,duration:q.duration,lufs:q.levels.integratedLufs,truePeak:q.levels.truePeakDbtp,fx:q.arrangement.events.length,checks:q.checks}));
}
