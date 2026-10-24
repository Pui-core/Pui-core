/** Issue85: protect actual vocal edges; keep A/B core placement and one gain. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const DEFAULT_ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const SONG='/mnt/e/Desktop/音源/medicate';
const SR=48000,N=659200,D=412/30;
const clamp=x=>Math.max(0,Math.min(1,x));
const db=x=>10**(x/20);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sources={v5:SONG+'/MIX_v5_KeyFix/medicate_MIX_v5_KeyFix.wav',v6:SONG+'/MIX_v6_Natural/medicate_MIX_v6_Natural.wav',mv:SONG+'/MV_v3_ArtistLyrics/medicate_MV_v3_ArtistLyrics.mp4',beat:SONG+'/MIX_v6_Natural/Audio/z5824Notag (1).wav',dry:SONG+'/MIX_v6_Natural/Stems/VOCAL_ALL_DRY.wav',manifest:SONG+'/MIX_v6_Natural/delivery-manifest-v6.json',lyrics:SONG+'/MV_v3_ArtistLyrics/Source/lyrics-timed.json'};
function wave24(L,R,gain){const b=Buffer.alloc(44+N*6);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(N*6,40);for(let i=0;i<N;i++)for(let c=0;c<2;c++){const x=(c?R:L)[i]*gain;if(Math.abs(x)>1)throw Error('PCM clipping');b.writeIntLE(Math.round(x*8388607),44+i*6+c*3,3)}return b;}
export async function makeAudio05(root=DEFAULT_ROOT){
 const {FF,FP,np}=await import('./native.mjs');
 const exec=(exe,args,input,binary=false)=>{const r=spawnSync(exe,args,{input,encoding:binary?undefined:'utf8',maxBuffer:32*1024*1024,timeout:120000});if(r.error||r.status)throw Error(r.error?.message||String(r.stderr));return{stdout:r.stdout,stderr:String(r.stderr)}};
 const decode=(p,start,count)=>{const r=exec(FF,['-v','error','-ss',String(start),'-i',np(p),'-t',String(count/SR),'-vn','-ac','2','-ar',String(SR),'-c:a','pcm_f32le','-f','f32le','pipe:1'],undefined,true).stdout;if(r.length/8<count)throw Error('Decoded source shorter than required: '+p+' '+r.length/8+'/'+count);return r;};
 const sample=(b,i,c)=>b.readFloatLE(i*8+c*4);
 const before=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)]));
 const L=new Float64Array(N),R=new Float64Array(N),placements=[];
 const aN=Math.round(3.9*SR),A=decode(sources.v5,21.3,aN),B=decode(sources.v6,21.3,aN);
 function addMaster(b,start,gain,label){const first=Math.round(start*SR);for(let i=0;i<aN;i++){const t=i/SR;const env=clamp(t/.10)*clamp((3.9-t)/.010);L[first+i]+=sample(b,i,0)*gain*env;R[first+i]+=sample(b,i,1)*gain*env;}placements.push({label,sourceAt:21.3,sourceEnd:25.2,start,end:start+3.9,fadeInSource:[21.3,21.4],fadeOutSource:[25.19,25.2],coreSource:[21.7,25.1],coreGain:gain});}
 addMaster(A,.8,db(-.33),'A-v5');addMaster(B,4.9,1,'B-v6');
 function bed(start,end,sourceAt,gainDb,inDur,outDur){const count=Math.round((end-start)*SR),b=decode(sources.beat,sourceAt,count),first=Math.round(start*SR),gain=db(gainDb);for(let i=0;i<count;i++){const t=i/SR,env=clamp(t/inDur)*clamp(((count-1-i)/SR)/outDur);L[first+i]+=sample(b,i,0)*gain*env;R[first+i]+=sample(b,i,1)*gain*env;}placements.push({label:'same-song-instrumental-context',start,end,sourceAt,sourceEnd:sourceAt+count/SR,gainDb,fadeIn:inDur,fadeOut:outDur});}
 bed(0,.9,20.5,-18,.08,.10);
 bed(4.6,5.0,25.1,-22,.08,.10);
 bed(8.7,10.29,74.7,-18,.12,.03);
 const mvAt=76.26,mvStart=10.26,mvN=N-Math.round(mvStart*SR),MV=decode(sources.mv,mvAt,mvN),dry=decode(sources.dry,mvAt,mvN);
 const manifest=JSON.parse(fs.readFileSync(sources.manifest,'utf8'));const dryGainDb=Number(manifest.master.fixed_gain_db),dryGain=db(dryGainDb);
 // Keep the actual AAC master unchanged until its last 160ms. In that tail,
 // dry*acceptedStaticGain stays constant; only (master-dry) is attenuated.
 // This residual includes accompaniment, wet and mastering/codec residuals.
 for(let i=0;i<mvN;i++){const t=i/SR,fadeIn=clamp(t/.03),wetFade=clamp(((mvN-1-i)/SR)/.16),n=Math.round(mvStart*SR)+i;for(let c=0;c<2;c++){const voice=sample(dry,i,c)*dryGain,master=sample(MV,i,c),value=(voice+(master-voice)*wetFade)*fadeIn;(c?R:L)[n]+=value;}}
 placements.push({label:'finished-MV',start:mvStart,end:D,sourceAt:mvAt,sourceEnd:2392/30,fadeInSource:[76.26,76.29],vocalUnitySource:[76.29,2392/30],residualOnlyFadeOutSource:[2392/30-.16,2392/30],protectedDryGainDb:dryGainDb});
 const raw=wave24(L,R,1),measure=exec(FF,['-hide_banner','-i','pipe:0','-af','loudnorm=I=-14:TP=-2.3:LRA=7:print_format=json','-f','null','-'],raw).stderr;
 const m=JSON.parse(measure.slice(measure.lastIndexOf('{'),measure.lastIndexOf('}')+1));
 const commonGainDb=Math.min(-14-Number(m.input_i),-2.35-Number(m.input_tp));if(!Number.isFinite(commonGainDb))throw Error('Invalid common static gain');
 const output=path.join(root,'media/05-medicate-chorus-v2-mix.wav');fs.writeFileSync(output,wave24(L,R,db(commonGainDb)));
 const finalLog=exec(FF,['-hide_banner','-i',np(output),'-af','ebur128=peak=true','-f','null','-']).stderr;
 const I=Number([...finalLog.matchAll(/\bI:\s*(-?[\d.]+)\s+LUFS/g)].at(-1)?.[1]),TP=Number([...finalLog.matchAll(/Peak:\s*(-?[\d.]+)\s+dBFS/g)].at(-1)?.[1]);
 const probe=JSON.parse(exec(FP,['-v','error','-show_streams','-show_format','-of','json',np(output)]).stdout),stream=probe.streams.find(s=>s.codec_type==='audio');
 const out=fs.readFileSync(output),pcm=(n,c)=>out.readIntLE(44+n*6+c*3,3)/8388607;
 const fairness=[{name:'A',buffer:A,at:1.2,relativeGainDb:-.33},{name:'B',buffer:B,at:5.3,relativeGainDb:0}].map(x=>{let square=0,diff=0,dot=0;const g=db(commonGainDb+x.relativeGainDb);for(let i=0;i<163200;i++)for(let c=0;c<2;c++){const ref=sample(x.buffer,19200+i,c),actual=pcm(Math.round(x.at*SR)+i,c);square+=ref*ref;diff+=(actual-ref*g)**2;dot+=actual*ref;}return{label:x.name,source:[21.7,25.1],timeline:[x.at,x.at+3.4],expectedGainDb:commonGainDb+x.relativeGainDb,measuredGainDb:20*Math.log10(dot/square),normalizedResidualDb:10*Math.log10(diff/(square*g*g)),noFadeInsideCore:true};});
 let longest=0,run=0,minRms=0;for(let first=4800;first+480<N;first+=480){let sum=0;for(let j=0;j<480;j++)sum+=L[first+j]**2+R[first+j]**2;const rms=10*Math.log10(sum/960);minRms=Math.min(minRms,rms);if(rms<-65){run+=10;longest=Math.max(longest,run)}else run=0;}
 const after=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,hash(p)])),unchanged=Object.keys(before).every(k=>before[k]===after[k]);
 const checks={samples:Number(stream.duration_ts)===N,format:stream.codec_name==='pcm_s24le'&&Number(stream.sample_rate)===SR&&stream.channels===2,duration:Math.abs(Number(probe.format.duration)-D)<.00003,integratedNearMinus14:Math.abs(I+14)<=.75,truePeakAtMostMinus2_2:TP<=-2.2,abSameCoreEnvelope:fairness.every(x=>x.normalizedResidualDb<-120),noInternal100msSilence:longest<100,sourceHashesUnchanged:unchanged};
 const result={status:Object.values(checks).every(Boolean)?'PASS_NUMERICAL_VOCAL_EDGE_FIX':'CHECK_FAILED',output,sha256:hash(output),durationSeconds:D,videoFrames:412,totalSamples:N,sampleRate:SR,format:{codec:stream.codec_name,bits:stream.bits_per_sample,channels:stream.channels,duration:probe.format.duration},audio:{integratedLufs:I,truePeakDbtp:TP,commonStaticGainDb:commonGainDb,rawInputIntegratedLufs:Number(m.input_i),rawInputTruePeak:Number(m.input_tp)},sources:Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,{path:p,sha256Before:before[k],sha256After:after[k],unchanged:before[k]===after[k]}])),allSourcesUnchanged:unchanged,comparison:{A:{source:sources.v5,sourceAt:21.7,sourceEnd:25.1,startSeconds:1.2,endSeconds:4.6,relativeGainDb:-.33},B:{source:sources.v6,sourceAt:21.7,sourceEnd:25.1,startSeconds:5.3,endSeconds:8.7,relativeGainDb:0},finishedMv:{source:sources.mv,sourceAt:76.3,sourceEnd:2392/30,startSeconds:10.3,endSeconds:D},fairness},placements,silence:{thresholdDbfs:-65,windowMs:10,longestInternalNearSilenceMs:longest,minRmsDbfs:minRms},checks,directAudition:'NOT_PERFORMED_BY_THIS_AGENT',limits:['Numerical PCM checks are not direct audition.','A/B remains the actual V5/V6 master revision comparison, with the prior -0.33dB relative trim and one final static gain.','MV residual tail contains accompaniment/wet plus mastering and AAC residuals; it is not represented as an independently exported pure instrumental stem.']};
 fs.writeFileSync(path.join(root,'qa/audio-process-05.json'),JSON.stringify(result,null,2)+'\n');
 const fix={status:result.status,scope:'05 only; unchanged picture, duration and A/B/MV core source mappings',createdUtc:new Date().toISOString(),mixSha256:result.sha256,voiceProtection:{AandB:{fadeInSource:[21.3,21.4],unitySource:[21.4,25.19],fadeOutSource:[25.19,25.2],actualTailPreservedBeyondOldEndSeconds:.09,nextVocalEarliestMeasured:25.21,nextVocalExcluded:true},MV:{fadeInSource:[76.26,76.29],constantProtectedDrySource:[76.29,2392/30],dryGainBeforeCommonDb:dryGainDb,firstCueSource:76.313455,oldOnsetFadeGainDb:20*Math.log10((76.313455-76.3)/.1),newOnsetFadeGainDb:0,last160msFadeAppliesTo:'master minus accepted-static-gain dry only',dryFadeOutApplied:false,nextVocalEarliestMeasured:79.76,nextVocalExcluded:true}},overlap:{masterA:[.8,4.7],masterB:[4.9,8.8],masterMV:[10.26,D],voicedABSimultaneousSeconds:0,bedCrossfadeSeconds:{A:.1,B:.1,MV:.03}},fairness,checks,audio:result.audio,inputHashesUnchanged:unchanged,directAudition:result.directAudition};
 fs.writeFileSync(path.join(root,'qa/fade-fix-05.json'),JSON.stringify(fix,null,2)+'\n');
 if(!Object.values(checks).every(Boolean))throw Error(JSON.stringify(checks));console.log(JSON.stringify({status:result.status,sha256:result.sha256,I,TP,commonGainDb,samples:N,fairness}));return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await makeAudio05(process.env.PUI_CREATOR_ROOT||DEFAULT_ROOT);
