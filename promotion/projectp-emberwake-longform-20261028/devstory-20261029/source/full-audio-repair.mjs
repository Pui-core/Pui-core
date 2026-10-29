import fs from 'node:fs';
import crypto from 'node:crypto';
import {ff,save} from './background.mjs';
// Provide a JSON config containing outputDir, canonicalRoot, cipher, daybreak, sfxQr2, originalAudioRecipe.
const config=JSON.parse(fs.readFileSync(process.argv[2]));
const root=config.outputDir,lock=root+'/owned.lock';
fs.mkdirSync(root+'/qa',{recursive:true});
const canonical=config.canonicalRoot;
const cipher=config.cipher;
const daybreak=config.daybreak;
const sfxPath=config.sfxQr2;
const bindPath=canonical+'/qa/full-voice-r3-binding.json';
const oldAudioPath=canonical+'/qa/audio-binding.json';
const sourcePath=config.originalAudioRecipe;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashFile=p=>hash(fs.readFileSync(p));
const db=x=>20*Math.log10(Math.max(x,1e-12));
const D=632,rate=48000,channels=2,frames=D*rate,N=frames*channels;
const voiceBinding=JSON.parse(fs.readFileSync(bindPath)),oldBinding=JSON.parse(fs.readFileSync(oldAudioPath));
const original={source:hashFile(sourcePath),voiceBinding:hashFile(bindPath),audioBinding:hashFile(oldAudioPath),voice:hashFile(voiceBinding.file),sfx:hashFile(sfxPath),cipher:hashFile(cipher),daybreak:hashFile(daybreak)};
if(original.voice!==voiceBinding.sha256||original.voice!==oldBinding.voiceSha||original.sfx!=='fa5bea125bcb57750078c916a407949a0bc526ee8e041d3ea41301e0af9ffe80'||original.cipher!=='d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522'||original.daybreak!=='abcb4ace07ebe6813cfc0ca9773514ddd3c6a2e535cd3b4fcdf0cf643179c2eb')throw Error('Input SHA');
const specs=[
  {id:'j',at:0,duration:214,input:cipher,filter:'atrim=start=0.824:duration=214,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=213.2:d=0.8'},
  {id:'v',at:214,duration:168,input:daybreak,filter:'asplit=2[a][b];[a]atrim=start=0.510:duration=76.8,asetpts=PTS-STARTPTS[a0];[b]atrim=start=0.510:duration=93.12,asetpts=PTS-STARTPTS[b0];[a0][b0]acrossfade=d=1.92:c1=tri:c2=tri,afade=t=in:d=0.64,afade=t=out:st=167.2:d=0.8'},
  {id:'c',at:382,duration:140,input:cipher,filter:'atrim=start=78.424:duration=140,asetpts=PTS-STARTPTS,afade=t=in:d=0.5,afade=t=out:st=139.2:d=0.8'},
  {id:'h',at:522,duration:110,input:daybreak,filter:'asplit=2[a][b];[a]atrim=start=0.510:duration=76.8,asetpts=PTS-STARTPTS[a0];[b]atrim=start=0.510:duration=35.12,asetpts=PTS-STARTPTS[b0];[a0][b0]acrossfade=d=1.92:c1=tri:c2=tri,afade=t=in:d=0.64,afade=t=out:st=109:d=1'}
];
if(specs.some(s=>fs.existsSync(root+'/local-'+s.id+'.wav'))||fs.existsSync(root+'/BGM修正-binding.json'))throw Error('Existing output; do not duplicate');
fs.writeFileSync(lock,JSON.stringify({pid:process.pid,started:new Date().toISOString(),phase:'independent chapter renders'}),{flag:'wx'});
function wav(p){const b=fs.readFileSync(p);let fmt,data;for(let q=12;q+8<=b.length;){const z=b.readUInt32LE(q+4),id=b.toString('ascii',q,q+4);if(q+8+z>b.length)throw Error('Truncated WAVE');if(id==='fmt '){fmt={format:b.readUInt16LE(q+8),channels:b.readUInt16LE(q+10),rate:b.readUInt32LE(q+12),block:b.readUInt16LE(q+20),bits:b.readUInt16LE(q+22)};if(fmt.format===65534)fmt.subformat=b.readUInt32LE(q+32);}if(id==='data')data={offset:q+8,bytes:z};q+=8+z+z%2;}if(!fmt||!data||fmt.rate!==rate||fmt.channels!==channels)throw Error('WAVE format');return{b,...fmt,...data};}
function intHeader(bytes){const b=Buffer.alloc(44);b.write('RIFF');b.writeUInt32LE(bytes+36,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(bytes,40);return b;}
function floatHeader(bytes){const b=Buffer.alloc(58);b.write('RIFF');b.writeUInt32LE(bytes+50,4);b.write('WAVEfmt ',8);b.writeUInt32LE(18,16);b.writeUInt16LE(3,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*8,28);b.writeUInt16LE(8,32);b.writeUInt16LE(32,34);b.writeUInt16LE(0,36);b.write('fact',38);b.writeUInt32LE(4,42);b.writeUInt32LE(frames,46);b.write('data',50);b.writeUInt32LE(bytes,54);return b;}
function rmsStats(b,o,n,bytes=4){let sum=0,peak=0,nz=0;for(let i=0;i<n;i++){const x=bytes===4?b.readFloatLE(o+i*4):b.readIntLE(o+i*3,3)/8388608;if(!Number.isFinite(x))throw Error('Nonfinite sample');sum+=x*x;peak=Math.max(peak,Math.abs(x));if(x!==0)nz++;}return{samples:n,nonzero:nz,rmsDbFS:db(Math.sqrt(sum/n)),peakDbFS:db(peak)};}
try{
  for(const s of specs){const f=s.filter+',loudnorm=I=-31:TP=-8:LRA=7,aresample=48000,apad,atrim=duration='+s.duration+',asetpts=PTS-STARTPTS[out]';await ff(['-i',s.input,'-filter_complex',f,'-map','[out]','-ac','2','-ar','48000','-c:a','pcm_f32le',root+'/local-'+s.id+'.wav'],root+'/qa/render-'+s.id+'.json');}
  save(root+'/owned-phase.json',{pid:process.pid,phase:'sample-domain placement and duck',at:new Date().toISOString()});
  const bed=Buffer.alloc(58+N*4);floatHeader(N*4).copy(bed);const chapterStats=[];
  for(const s of specs){const w=wav(root+'/local-'+s.id+'.wav');if(w.format!==3||w.bits!==32||w.bytes/w.block!==Math.round(s.duration*rate))throw Error('Chapter length');w.b.copy(bed,58+Math.round(s.at*rate)*8,w.offset,w.offset+w.bytes);chapterStats.push({...s,input:undefined,frames:w.bytes/w.block,sha256:hash(w.b),stats:rmsStats(w.b,w.offset,w.bytes/4)});}
  const voice=wav(voiceBinding.file),sfx=wav(sfxPath);if(voice.bits!==24||sfx.bits!==24||voice.bytes/voice.block!==frames||sfx.bytes/sfx.block!==frames)throw Error('Voice/SFX format');
  const gain=new Float32Array(frames);gain.fill(1);const cueLevels=[];
  // A small precision margin ensures the final int24 music is at least14dB below cue RMS.
  const requestedVoiceMarginDb=14.05;
  for(const c of voiceBinding.cues){const start=Math.max(0,Math.floor((c.at+c.active.start)*rate)),end=Math.min(frames,Math.ceil((c.at+c.active.end)*rate));let vs=0,ms=0;for(let k=start*2;k<end*2;k++){const v=voice.b.readIntLE(voice.offset+k*3,3)/8388608,m=bed.readFloatLE(58+k*4);vs+=v*v;ms+=m*m;}const vr=Math.sqrt(vs/(2*(end-start))),mr=Math.sqrt(ms/(2*(end-start))),target=Math.min(1,10**((db(vr)-requestedVoiceMarginDb-db(mr))/20));const attack=Math.round(.020*rate),hold=Math.round(.040*rate),release=Math.round(.180*rate);for(let i=Math.max(0,start-attack);i<Math.min(frames,end+hold+release);i++){let v=target;if(i<start)v=1+(target-1)*(i-(start-attack))/attack;else if(i>end+hold)v=target+(1-target)*(i-(end+hold))/release;gain[i]=Math.min(gain[i],v);}cueLevels.push({id:c.id,active:[start/rate,end/rate],voiceRmsDb:db(vr),unduckedMusicRmsDb:db(mr),targetGain:target});}
  for(const[a,b]of[[6.02,6.28],[9.02,9.18],[213.8,214.18],[381.8,382.18],[521.8,522.18],[618.86,619.18]])for(let i=Math.floor((a-.025)*rate);i<Math.ceil((b+.08)*rate);i++){if(i<0||i>=frames)continue;const t=i/rate,v=t<a?(a-t)/.025:t<=b?0:(t-b)/.08;gain[i]=Math.min(gain[i],Math.max(0,Math.min(1,v)));}
  let musicPeakGuard=1;const ceiling=10**(-1.05/20);
  for(let f=0;f<frames;f++)for(let ch=0;ch<2;ch++){const k=f*2+ch,base=(voice.b.readIntLE(voice.offset+k*3,3)+sfx.b.readIntLE(sfx.offset+k*3,3))/8388608,m=bed.readFloatLE(58+k*4)*gain[f];if(Math.abs(base)>=ceiling)throw Error('Voice+SFX already above ceiling');if(m>0)musicPeakGuard=Math.min(musicPeakGuard,(ceiling-base)/m);else if(m<0)musicPeakGuard=Math.min(musicPeakGuard,(-ceiling-base)/m);}
  musicPeakGuard=Math.max(0,Math.min(1,musicPeakGuard));
  const duck=Buffer.alloc(44+N*3),mix=Buffer.alloc(44+N*3);intHeader(N*3).copy(duck);intHeader(N*3).copy(mix);
  let peakInt=0,peakAt=0,clipped=0,residualMismatch=0;
  for(let f=0;f<frames;f++)for(let ch=0;ch<2;ch++){const k=f*2+ch,vi=voice.b.readIntLE(voice.offset+k*3,3),si=sfx.b.readIntLE(sfx.offset+k*3,3),mi=Math.round(bed.readFloatLE(58+k*4)*gain[f]*musicPeakGuard*8388607),sum=vi+si+mi;if(sum<-8388608||sum>8388607)throw Error('Mix overflow');duck.writeIntLE(mi,44+k*3,3);mix.writeIntLE(sum,44+k*3,3);if(sum-mi-si!==vi)residualMismatch++;if(sum===8388607||sum===-8388608)clipped++;if(Math.abs(sum)>peakInt){peakInt=Math.abs(sum);peakAt=f/rate;}}
  for(const c of cueLevels){const start=Math.floor(c.active[0]*rate),end=Math.ceil(c.active[1]*rate);let sum=0;for(let k=start*2;k<end*2;k++)sum+=(duck.readIntLE(44+k*3,3)/8388608)**2;c.duckedMusicRmsDb=db(Math.sqrt(sum/(2*(end-start))));c.voiceOverMusicDb=c.voiceRmsDb-c.duckedMusicRmsDb;}
  const minVoiceDb=Math.min(...cueLevels.map(c=>c.voiceOverMusicDb));if(minVoiceDb<14||db(peakInt/8388608)>=-1||clipped||residualMismatch)throw Error('Final mix acceptance failed');
  const output={bed:root+'/music-bed-r2.wav',duck:root+'/music-ducked-r2.wav',mix:root+'/mix-bgm-r3.wav'};
  fs.writeFileSync(output.bed,bed);fs.writeFileSync(output.duck,duck);fs.writeFileSync(output.mix,mix);
  const windows=[50,250,400,550].map(at=>({at,duration:.5,bed:rmsStats(bed,58+at*rate*8,rate),ducked:rmsStats(duck,44+at*rate*6,rate,3)}));
  if(windows.some(w=>w.bed.nonzero===0||w.ducked.nonzero===0))throw Error('Chapter still silent');
  const inputUnchanged=original.source===hashFile(sourcePath)&&original.voiceBinding===hashFile(bindPath)&&original.audioBinding===hashFile(oldAudioPath)&&original.voice===hashFile(voiceBinding.file)&&original.sfx===hashFile(sfxPath);if(!inputUnchanged)throw Error('Inputs changed');
  const proof={issue:146,state:'private corrected BGM candidate, waiting writer adoption and mux',created:new Date().toISOString(),cause:{observed:'Original four branches individually nonzero; original amix output at250/400/550s alreadyzero before loudnorm. At50s amix signal exceeds J alone, indicating unwanted overlap/alignment in original combination case.',upstreamLibraryRootCauseNotProven:true,probeMetrics:'qa/probe-metrics.json',repair:'Independent chapter-local PCM renders normalized toI-31/TP-8/LRA7 then exact global frame placement inNode. No amix/adelay for chapter combination.'},format:{duration:D,rate,channels,bed:'IEEEfloat32',duck:'PCM signedint24',mix:'PCM signedint24'},chapterStats,chapterWindows:windows,voice:{file:voiceBinding.file,sha256:original.voice,gain:1,cues:52,minimumVoiceOverMusicDb:minVoiceDb,requestedVoiceMarginDb,quantizedMixMinusMusicMinusSfxEqualsVoiceAtEverySample:residualMismatch===0},sfx:{file:sfxPath,sha256:original.sfx,qAt:425.25,unchanged:true},duck:{attackSeconds:.020,tailHoldSeconds:.040,releaseSeconds:.180,musicPeakGuard},cueLevels,peak:{pcm:peakInt,dbFS:db(peakInt/8388608),at:peakAt,clippedSamples:clipped},inputs:original,originalInputsUnchanged:inputUnchanged,outputs:Object.fromEntries(Object.entries(output).map(([k,p])=>[k,{path:p,sha256:hashFile(p),bytes:fs.statSync(p).size}])),limitations:['No subjective listening or final mux/AV synchronization performed.','OriginalJ BGM was re-rendered from the same intendedCipher source because retaining the original faultyamix could preserve unwanted overlap. Voice-r3 andQr2SFX unchanged.','Source/old WAVs unchanged. Writer owns adoption, Source integration and canonical Fcopies.','BGM licenses and credits unchanged from original approved two sources; no new music introduced.']};
  save(root+'/BGM修正-binding.json',proof);console.log(JSON.stringify({ready:true,outputs:proof.outputs,minVoiceDb,peak:proof.peak,windows}));
}finally{save(root+'/owned-lock-state.json',{pid:process.pid,finished:true,at:new Date().toISOString()});fs.unlinkSync(lock);}
