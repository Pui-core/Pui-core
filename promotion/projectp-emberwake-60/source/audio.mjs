/** EMBERWAKE / Issue88: newly composed60s instrumental, no external samples or voices. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SR=48000,DURATION=60,FPS=30,FRAMES=1800,BPM=120;
const REFERENCE='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/media/original-score.wav';
const REFERENCE_SCRIPT='/home/pui/Videos/Studio-PV/2026-10-23/EMBERWAKE/source/produce_cinematic.mjs';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},db=x=>x>0?20*Math.log10(x):-150,hz=m=>440*2**((m-69)/12),TAU=2*Math.PI;
const np=p=>{const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
function command(exe,args,input,binary=false){for(let retry=0;retry<3;retry++){const r=spawnSync(exe,args,{input,encoding:binary?undefined:'utf8',maxBuffer:80*1024*1024,timeout:90000});if(!r.error&&r.status===0)return r;const e=(r.error?.message||'')+' '+String(r.stderr);if(retry<2&&/EPIPE|UtilAcceptVsock|accept4 failed/.test(e))continue;throw Error(e);}}
const jsonLog=s=>JSON.parse(String(s).match(/\{[\s\S]*\}/)?.[0]||'{}');
function wave(L,R,gain){const b=Buffer.alloc(44+L.length*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(L.length*6,40);for(let i=0;i<L.length;i++)for(let c=0;c<2;c++){const x=(c?R:L)[i]*gain;if(Math.abs(x)>1)throw Error('PCM clip');b.writeIntLE(Math.round(x*8388607),44+i*6+c*3,3);}return b;}
function makePlan(){
 const E=[],add=(t,d,m,a,kind,pan=0,why='')=>E.push({t,d,midi:m,amplitude:a,kind,pan,why});
 const chords={Dm:{root:38,notes:[50,53,57,64]},Bb:{root:34,notes:[46,50,53,57]},F:{root:41,notes:[48,53,57,60]},C:{root:36,notes:[48,52,55,62]},Gm:{root:43,notes:[50,55,58,62]},Asus:{root:33,notes:[45,50,52,57]},A:{root:33,notes:[45,49,52,57]}};
 const pad=(t,d,name,a)=>{const c=chords[name];for(const[i,m]of c.notes.entries())add(t,d,m,a/Math.sqrt(c.notes.length),'pad',(i-1.5)*.24,'Harmony '+name);};
 // A recognizable D-A-F question, then a first landing. No sweep or noise hit.
 pad(0,4.5,'Dm',.075);add(.015,.46,38,.16,'pulse',0,'Immediate low hook');
 for(const[t,m,a]of[[.035,74,.13],[.58,69,.095],[1.25,77,.115],[2.0,76,.09],[2.75,74,.12]])add(t,3.2,m,a,'bell',t<1?-.18:.18,'Opening D-A-F-E-D theme');
 add(2,.35,38,.08,'pulse');add(3.5,.35,45,.065,'pulse');
 pad(4,4.5,'Bb',.068);pad(8,4.6,'Dm',.066);
 for(const[t,m]of[[4.5,62],[6.5,69],[8.5,65],[10,64]])add(t,2.7,m,.07,'bell',Math.sin(t)*.25,'Title breathing room');
 for(const[t,m]of[[4,34],[8,38],[10,45]])add(t,.42,m,.07,'pulse');
 // Nine two-second bars: puzzle action develops instead of repeating an old file.
 const puzzle=['Dm','Dm','Bb','Bb','F','C','Dm','Gm','Asus'];
 for(let bar=0;bar<9;bar++){
  const t=12+bar*2,c=chords[puzzle[bar]];pad(t,2.55,puzzle[bar],bar<3?.067:.073);
  add(t,.36,c.root,.13,'pulse',0,'Puzzling half-time downbeat');if(bar!==8)add(t+1,.31,c.root,.085,'pulse');
  const pattern=bar<3?[0,.5,1.25]:bar<7?[0,.5,.75,1.25,1.5]:[0,.5,1.25];
  for(const[j,off]of pattern.entries()){const order=[0,2,1,3,2],m=c.notes[order[(j+bar)%5]]+12;add(t+off,.72,m,.072+(bar>3?.008:0),'pluck',(j%2?1:-1)*.24,'Ascent answers the core puzzle');}
 }
 add(16,2.5,77,.083,'bell',-.22,'First harmonic reveal');add(22,2.7,81,.082,'bell',.22,'Higher melodic answer');add(28,2.4,76,.075,'bell',0,'Held note before the world opens');
 // Broadening chapters and town: wider harmony, less busy lead.
 for(const[bar,name]of['Bb','F','C','Dm','Gm','Asus'].entries()){
  const t=30+bar*2,c=chords[name];pad(t,2.8,name,.082);add(t,.42,c.root,.11,'pulse');
  if(bar<4)add(t+1,.38,c.root,.065,'pulse');for(const[j,off]of[.25,1.25].entries())add(t+off,1.25,c.notes[(bar+j*2)%4]+12,.083,'pluck',j?-.28:.28,'Space between the chapter views');
 }
 for(const[t,m]of[[30,77],[34,81],[38,79],[40,76]])add(t,3.2,m,.094,'bell',t===34?.28:-.2,'Wide-world theme');
 // Making-of section returns to the lower motif and removes the strong pulse.
 for(const[bar,name]of['Dm','Bb','C','Asus'].entries()){
  const t=42+bar*2,c=chords[name];pad(t,2.7,name,.067);if(bar===0||bar===2)add(t,.40,c.root,.065,'pulse');
  add(t+.5,1.6,c.notes[0]+12,.067,'pluck',-.17);add(t+1.5,1.6,c.notes[2]+12,.053,'pluck',.17);
 }
 // CTA gets five distinct bars, a proper cadence and no new attacks after56s.
 pad(50,2.35,'Bb',.062);pad(52,2.35,'C',.058);pad(54,2.1,'A',.054);pad(56,4,'Dm',.061);
 add(50,.42,34,.055,'pulse');add(50.5,2.8,65,.055,'bell',-.17,'One quiet CTA pickup');add(54,2.3,69,.045,'pluck',.16,'Dominant before the final tonic');
 add(56,3.9,74,.079,'bell',.10,'Final D tonic and authentic decay');add(56,3.8,50,.040,'bell',-.16,'Low final D');
 return E;
}
export function buildAudio(root=ROOT){
 const output=path.join(root,'media/emberwake-60-mix.wav'),qa=path.join(root,'qa/audio.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(path.dirname(qa),{recursive:true});
 const before={wav:hash(REFERENCE),script:hash(REFERENCE_SCRIPT)},events=makePlan(),N=SR*DURATION,L=new Float64Array(N),R=new Float64Array(N),sendL=new Float64Array(N),sendR=new Float64Array(N);
 for(const e of events){
  const start=Math.round(e.t*SR),count=Math.round(e.d*SR),f=hz(e.midi),gl=Math.sqrt((1-e.pan)/2),gr=Math.sqrt((1+e.pan)/2);
  for(let n=0;n<count&&start+n<N;n++){
   const u=n/SR,p=n/count,attack=e.kind==='pad'?.16:e.kind==='pulse'?.004:.007,release=e.kind==='pad'?.65:.09;
   const edge=ease(u/attack)*ease((e.d-u)/release);let v;
   if(e.kind==='pad')v=(Math.sin(TAU*f*u)+.36*Math.sin(TAU*f*1.0021*u)+.12*Math.sin(TAU*f*2*u))*.70*edge;
   else if(e.kind==='pulse')v=Math.sin(TAU*(f*u+f*.42*(1-Math.exp(-u*28))/28))*Math.exp(-u*13)*edge;
   else if(e.kind==='bell')v=(Math.sin(TAU*f*u)+.27*Math.sin(TAU*f*2.76*u)+.11*Math.sin(TAU*f*4.1*u))*Math.exp(-u/1.18)*edge;
   else v=(Math.sin(TAU*f*u)+.18*Math.sin(TAU*f*2*u)+.055*Math.sin(TAU*f*3*u))*Math.exp(-u/.31)*edge;
   v*=e.amplitude;const at=start+n;L[at]+=v*gl;R[at]+=v*gr;if(e.kind!=='pulse'){sendL[at]+=v*gl*.16;sendR[at]+=v*gr*.16;}
  }
 }
 // Short original room diffusion; lowpassed feedback, not a noise/sweep layer.
 const delays=[.0371,.0413,.0539,.0617],gains=[.69,.70,.65,.67];
 for(let c=0;c<2;c++)for(let j=0;j<delays.length;j++){
  const delay=Math.round((delays[j]+(c?.0017:0))*SR),ring=new Float64Array(delay),src=c?sendR:sendL,dst=c?R:L;let low=0;
  for(let i=0,p=0;i<N;i++,p=(p+1)%delay){const old=ring[p];low+=.20*(old-low);ring[p]=src[i]+low*gains[j];dst[i]+=old*.21;}
 }
 // Smooth levels around editorial phases; never the old step-wise breathe multiplier.
 const energy=[[0,1.02],[4,.77],[11,.77],[13,.94],[28,1],[32,1.03],[39,1],[43,.81],[49,.73],[51,.63],[56,.60],[60,.60]];
 function dynamics(t){let i=1;while(i<energy.length&&t>energy[i][0])i++;if(i===energy.length)return energy.at(-1)[1];const a=energy[i-1],b=energy[i],p=ease((t-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*p;}
 let peak=0,mean=0;for(let i=0;i<N;i++){const t=i/SR,edge=ease(t/.035)*ease((DURATION-1/SR-t)/1.25),g=dynamics(t)*edge;L[i]*=g;R[i]*=g;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));mean+=L[i]+R[i];}
 const headroom=Math.min(1,.75/peak),first=jsonLog(command(FF,['-hide_banner','-i','pipe:0','-af','loudnorm=I=-17:TP=-3:LRA=15:print_format=json','-f','null','-'],wave(L,R,headroom)).stderr);
 const gainDb=db(headroom)+Math.min(-17-Number(first.input_i),-3.05-Number(first.input_tp)),gain=10**(gainDb/20),final=wave(L,R,gain);fs.writeFileSync(output,final);
 const measurement=jsonLog(command(FF,['-hide_banner','-i',np(output),'-af','loudnorm=I=-17:TP=-3:LRA=15:print_format=json','-f','null','-']).stderr),probe=JSON.parse(command(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,time_base','-of','json',np(output)]).stdout),s=probe.streams[0];
 const fullDecode=command(FF,['-v','error','-xerror','-threads','1','-i',np(output),'-map','0:a:0','-f','null','-']);
 const silenceLog=String(command(FF,['-hide_banner','-i',np(output),'-af','silencedetect=noise=-55dB:d=0.06','-f','null','-']).stderr),starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>+m[1]),ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>+m[1]),silence=starts.map((start,i)=>({start,end:ends[i]??DURATION})),unexpectedSilence=silence.filter(w=>w.start>.10&&w.end<59.3);
 const rms=(a,b)=>{let sum=0,k=0;for(let i=Math.round(a*SR);i<Math.min(N,Math.round(b*SR));i++){sum+=L[i]*L[i]+R[i]*R[i];k+=2;}return 10*Math.log10(Math.max(1e-30,sum/k))+gainDb;};
 const boundaryTimes=[0,4,12,30,42,50,56,59.95],boundaries=boundaryTimes.map(t=>{const n=Math.max(1,Math.min(N-1,Math.round(t*SR)));let step=0,local=0,count=0,maxStep=0;for(let c=0;c<2;c++){const A=c?R:L;step=Math.max(step,Math.abs(A[n]-A[n-1])*gain);for(let i=Math.max(1,n-480);i<Math.min(N,n+480);i++){const d=(A[i]-A[i-1])*gain;local+=d*d;count++;maxStep=Math.max(maxStep,Math.abs(d));}}const derivativeRms=Math.sqrt(local/count);return{time:t,singleSampleStep:step,neighbourhoodMaxStep:maxStep,derivativeRms,ratio:step/Math.max(derivativeRms,1e-12),isolatedJump:step>.035&&step>8*derivativeRms};});
 let clipSamples=0,maxPcmStep=0;for(let i=0;i<N;i++)for(let c=0;c<2;c++){const v=final.readIntLE(44+i*6+c*3,3);if(Math.abs(v)>=8388607)clipSamples++;if(i)maxPcmStep=Math.max(maxPcmStep,Math.abs(v-final.readIntLE(44+(i-1)*6+c*3,3))/8388607);}
 const after={wav:hash(REFERENCE),script:hash(REFERENCE_SCRIPT)},phases=[[0,4,'Immediate D-A-F hook and low response'],[4,12,'Title and creator introduction: more air'],[12,30,'Core puzzle: increasingly articulated plucks'],[30,42,'Chapters and town: wider harmony'],[42,50,'Making-of: lower register and fewer pulses'],[50,60,'CTA: thin accompaniment; A to Dm at56s; authentic tail']].map(([a,b,description])=>({start:a,end:b,description,rmsDbfs:rms(a,b)}));
 const checks={exactSamples:Number(s.duration_ts)===N,exact60seconds:Math.abs(Number(probe.format.duration)-60)<1e-6,pcm48kStereo24:s.codec_name==='pcm_s24le'&&Number(s.sample_rate)===SR&&s.channels===2&&s.bits_per_sample===24,fullDecode:fullDecode.status===0,peakHeadroom:Number(measurement.input_tp)<=-3,integratedRangeReasonable:Number(measurement.input_i)>=-23&&Number(measurement.input_i)<=-14,noClip:clipSamples===0,noUnexpectedSilence:unexpectedSilence.length===0,noIsolatedSectionJump:!boundaries.some(b=>b.isolatedJump),referenceUnchanged:JSON.stringify(before)===JSON.stringify(after)};if(Object.values(checks).some(v=>!v))throw Error('Score QA failed '+JSON.stringify({checks,measurement,unexpectedSilence,boundaries}));
 const report={schema:1,status:'TECHNICAL_PASS',issue:88,output,sha256:hash(output),duration:60,fps:30,pictureFrames:1800,sampleRate:SR,sampleFrames:N,channels:2,bits:24,bpm:BPM,timeSignature:'4/4',authorship:'Newly authored deterministic additive synthesis and short room diffusion. No external samples, voice or game SFX.',reference:{wav:REFERENCE,wavSha256Before:before.wav,wavSha256After:after.wav,script:REFERENCE_SCRIPT,scriptSha256Before:before.script,scriptSha256After:after.script,role:'D-minor bell/pluck/low-pulse palette only. The48s recording is not decoded, concatenated, time-stretched or looped into this60s score.'},form:{key:'D minor, A dominant at54s resolves to Dm at56s',barSeconds:2,barCount:30,phases,finalNewAttackSeconds:56,finalCadence:['Bb50s','C52s','A54s','Dm56s'],noAttacksAfter56:true},events,levels:{targetIntegratedLufs:-17,integratedLufs:Number(measurement.input_i),truePeakDbtp:Number(measurement.input_tp),lraLu:Number(measurement.input_lra),oneStaticGainDb:gainDb,peakCeilingDbtp:-3,preGainSamplePeakDbfs:db(peak),dcMean:(mean/(N*2))*gain,policy:'Only one constant gain after authored dynamics. No limiter, compressor, dynamic loudnorm or hard clipping. Measurement-only loudnorm output is discarded.'},envelopes:{eventAttackRelease:'Smoothstep at every note start/end',phaseDynamics:'Continuous smoothstep interpolation',programInSeconds:.035,programOutSeconds:1.25},waveform:{boundaryChecks:boundaries,clippedSamples:clipSamples,maxSingleSampleDelta:maxPcmStep,lastStereoPcm:[final.readIntLE(final.length-6,3),final.readIntLE(final.length-3,3)]},silence:{thresholdDbfs:-55,minSeconds:.06,events:silence,intendedOnly:'First100ms and final decay after59.3s may fall below threshold.',unexpected:unexpectedSilence},probe,measurementOnly:{firstPass:first,finalPass:measurement,processedOutputSaved:false},checks,verificationScope:{fullWavDecoded:true,numericDiscontinuityScreen:true,directWholeAudition:false,perceptualClickFreeClaim:false,finalAacMeasured:false,finalMp4:'root will export and verify separately'}};
 fs.writeFileSync(qa,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'qa/audio-full-decode.json'),JSON.stringify({file:output,sha256:report.sha256,exit:fullDecode.status,stderr:String(fullDecode.stderr),fullDecode:true},null,2)+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const r=buildAudio();console.log(JSON.stringify({file:r.output,sha256:r.sha256,seconds:r.duration,samples:r.sampleFrames,lufs:r.levels.integratedLufs,truePeak:r.levels.truePeakDbtp,lra:r.levels.lraLu,phases:r.form.phases,checks:r.checks}));}
