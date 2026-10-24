/** Local VOICEVOX narration, measured per-scene placement and original-music mix. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cuts,stories} from './stories.mjs';
const source=path.dirname(fileURLToPath(import.meta.url));
const plan=JSON.parse(fs.readFileSync(path.join(source,'narration.json'),'utf8'));
const SR=48000, D=64;
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x));
function native(p){const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status||r.error)throw Error('wslpath '+p);return r.stdout.trim();}
function call(exe,args){const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});if(r.error||r.status)throw Error(r.error?.message||r.stderr);return r;}
const fromLog=s=>JSON.parse(s.match(/\{[\s\S]*\}/)?.[0]||'{}');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
async function request(route,options={}){
  // A long offline loudness pass can outlast uvicorn's keep-alive timeout.
  // These synthesis requests are stateless; retry a closed idle connection.
  for(let attempt=0;attempt<3;attempt++)try{
    const r=await fetch(plan.engineUrl+route,{...options,signal:AbortSignal.timeout(60000)});
    if(!r.ok)throw Error('VOICEVOX '+r.status+' '+await r.text());
    return r;
  }catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));}
}
function decodeWave(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw Error('Not a RIFF WAVE');
  let fmt,data;
  for(let p=12;p+8<=buffer.length;){const id=buffer.toString('ascii',p,p+4),n=buffer.readUInt32LE(p+4);if(id==='fmt ')fmt=buffer.subarray(p+8,p+8+n);if(id==='data')data=buffer.subarray(p+8,p+8+n);p+=8+n+(n%2);}
  if(!fmt||!data)throw Error('Missing WAV chunks');
  const format=fmt.readUInt16LE(0),channels=fmt.readUInt16LE(2),rate=fmt.readUInt32LE(4),bits=fmt.readUInt16LE(14),bytes=bits/8;
  if(rate!==SR||![1,2].includes(channels)||![16,24,32].includes(bits)||![1,3,65534].includes(format))throw Error('Unsupported WAV format '+JSON.stringify({format,channels,rate,bits}));
  const count=Math.floor(data.length/(bytes*channels)),samples=Array.from({length:channels},()=>new Float64Array(count));
  for(let i=0;i<count;i++)for(let c=0;c<channels;c++){const p=(i*channels+c)*bytes;samples[c][i]=bits===16?data.readInt16LE(p)/32768:bits===24?data.readIntLE(p,3)/8388608:format===3?data.readFloatLE(p):data.readInt32LE(p)/2147483648;}
  return {samples,rate,channels,bits,count,duration:count/rate};
}
function encodeWave(channels,bits=24){
  const count=channels[0].length,bytes=bits/8,nc=channels.length,b=Buffer.alloc(44+count*nc*bytes);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(nc,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*nc*bytes,28);b.writeUInt16LE(nc*bytes,32);b.writeUInt16LE(bits,34);b.write('data',36);b.writeUInt32LE(count*nc*bytes,40);
  const scale=2**(bits-1)-1;
  for(let i=0;i<count;i++)for(let c=0;c<nc;c++){const v=Math.round(Math.max(-1,Math.min(1,channels[c][i]))*scale),p=44+(i*nc+c)*bytes;if(bits===16)b.writeInt16LE(v,p);else b.writeIntLE(v,p,bytes);}
  return b;
}
function predicted(q){return q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;}
function region(i){
  const start=cuts[i]+.05;
  let end=cuts[i+1]-.1;
  for(const [a,b] of plan.quietPockets)if(start<a&&end>a)end=a-.1;
  if(plan.quietPockets.some(([a,b])=>start>=a&&start<b))throw Error('Narration starts in quiet pocket');
  return {start,end,available:end-start};
}
async function segment(root,id,i,alternatives){
  const dir=path.join(root,'media/voice-segments',id),qa=path.join(root,'qa/narration',id);
  fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(qa,{recursive:true});
  const name=String(i+1).padStart(2,'0'),window=region(i),attempts=[];
  const candidateHash=crypto.createHash('sha256').update(JSON.stringify(alternatives)).digest('hex');
  const cachedFile=path.join(dir,name+'.wav'),cachedLedger=path.join(qa,name+'-segment.json');
  if(fs.existsSync(cachedFile)&&fs.existsSync(cachedLedger)){
    const ledger=JSON.parse(fs.readFileSync(cachedLedger,'utf8'));
    if(ledger.candidateHash===candidateHash&&ledger.start===window.start&&ledger.available===window.available&&ledger.duration<=window.available&&sha(cachedFile)===ledger.sha256)return {wave:decodeWave(fs.readFileSync(cachedFile)),ledger};
  }
  for(const text of alternatives){
    const query=await (await request('/audio_query?'+new URLSearchParams({text,speaker:plan.speakerId}),{method:'POST'})).json();
    Object.assign(query,{speedScale:1.16,intonationScale:1.10,prePhonemeLength:.03,postPhonemeLength:.06,outputSamplingRate:SR,outputStereo:false});
    const phonemeSeconds=predicted(query)-.09;
    query.speedScale=Math.min(1.4,Math.max(1.10,Math.ceil((phonemeSeconds*query.speedScale/(window.available-.16))*100)/100,1.16));
    let estimate=predicted(query);
    if(estimate>window.available-.035){attempts.push({text,speed:query.speedScale,estimate,reason:'predicted too long'});continue;}
    let raw,wave;
    for(let retry=0;retry<3;retry++){
      raw=Buffer.from(await (await request('/synthesis?speaker='+plan.speakerId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(query)})).arrayBuffer());
      wave=decodeWave(raw);
      if(wave.duration<=window.available+1e-9)break;
      attempts.push({text,speed:query.speedScale,duration:wave.duration,reason:'actual too long; retry within speed ceiling'});
      if(query.speedScale>=1.4)break;
      query.speedScale=Math.min(1.4,Math.max(query.speedScale+.02,Math.ceil(query.speedScale*(wave.duration-.09)/(window.available-.15)*100)/100));
      estimate=predicted(query);
    }
    if(wave.duration>window.available+1e-9){attempts.push({text,speed:query.speedScale,duration:wave.duration,reason:'actual too long'});continue;}
    if(wave.channels!==1)throw Error('Expected mono voice segment');
    const file=path.join(dir,name+'.wav');fs.writeFileSync(file,raw);write(path.join(qa,name+'-query.json'),query);
    const reading=query.accent_phrases.map(a=>a.moras.map(m=>m.text).join('')).join(' / ');
    const ledger={scene:i+1,text,reading,speedScale:query.speedScale,intonationScale:query.intonationScale,cutStart:cuts[i],cutEnd:cuts[i+1],start:window.start,end:window.start+wave.duration,duration:wave.duration,minimumEndMargin:.1,actualSceneEndMargin:cuts[i+1]-window.start-wave.duration,quietPocketClear:true,available:window.available,estimate,file:path.relative(root,file),sha256:sha(file),candidateHash,attempts};
    write(path.join(qa,name+'-segment.json'),ledger);
    return {wave,ledger};
  }
  throw Error('No sentence fits '+id+' scene '+(i+1)+' '+JSON.stringify({window,attempts}));
}
function normalize(input,output){
  const base='loudnorm=I=-14:TP=-2.2:LRA=7';
  const measure=f=>fromLog(call(FF,['-hide_banner','-i',native(f),'-af',base+':print_format=json','-f','null','-']).stderr);
  const firstPass=measure(input);
  const filter=base+`:measured_I=${firstPass.input_i}:measured_TP=${firstPass.input_tp}:measured_LRA=${firstPass.input_lra}:measured_thresh=${firstPass.input_thresh}:offset=${firstPass.target_offset}:linear=true:print_format=json`;
  const normalization=fromLog(call(FF,['-hide_banner','-y','-i',native(input),'-af',filter,'-ar',String(SR),'-c:a','pcm_s24le',native(output)]).stderr);
  const measured=measure(output);
  const probe=JSON.parse(call(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample','-of','json',native(output)]).stdout);
  if(Math.abs(Number(measured.input_i)+14)>.35||Number(measured.input_tp)>-1.8||Number(probe.format.duration)!==D||probe.streams[0].channels!==2)throw Error('Narration mix QA failed '+JSON.stringify({measured,probe}));
  return {firstPass,normalization,measured,probe};
}
export async function makeNarration(root,episodeId){
  root=path.resolve(root);const id=String(episodeId).padStart(2,'0');
  const episode=plan.episodes.find(e=>e.id===Number(episodeId)),story=stories.find(e=>e.id===Number(episodeId));
  if(!episode||episode.segments.length!==24||story.scenes.length!==24)throw Error('Invalid episode');
  const voice=new Float64Array(D*SR),ledger=[];
  for(let i=0;i<24;i++){
    const result=await segment(root,id,i,episode.segments[i]);
    const samples=result.wave.samples[0],start=Math.round(result.ledger.start*SR);let sum=0,peak=0;
    for(const s of samples){sum+=s*s;peak=Math.max(peak,Math.abs(s));}
    const rms=Math.sqrt(sum/samples.length),gain=Math.min(.10/Math.max(rms,1e-8),.65/Math.max(peak,1e-8));
    for(let n=0;n<samples.length;n++){const env=clamp(n/(SR*.008))*clamp((samples.length-1-n)/(SR*.012));voice[start+n]+=samples[n]*gain*env;}
    ledger.push({...result.ledger,sourceHead:story.scenes[i].head,sourceSub:story.scenes[i].sub,segmentRmsDbfs:20*Math.log10(rms),gainDb:20*Math.log10(gain)});
    console.log(JSON.stringify({episode:id,scene:i+1,text:result.ledger.text,duration:result.ledger.duration,speed:result.ledger.speedScale}));
  }
  const voiceFile=path.join(root,'media','voice-'+id+'.wav');fs.writeFileSync(voiceFile,encodeWave([voice]));
  const musicFile=path.join(root,'media','music-'+id+'.wav'),musicSha=sha(musicFile),music=decodeWave(fs.readFileSync(musicFile));
  if(music.channels!==2||music.duration!==D)throw Error('Music timebase mismatch');
  const L=new Float64Array(voice.length),R=new Float64Array(voice.length);
  // Stable ducking follows whole phrases, avoiding syllable-by-syllable pumping.
  for(let n=0;n<voice.length;n++){
    const t=n/SR;let duck=0;
    for(const s of ledger){if(t<s.start-.045||t>s.end+.18)continue;const a=clamp((t-(s.start-.045))/.045),b=clamp((s.end+.18-t)/.18);duck=Math.max(duck,a*b);}
    const musicGain=.76-(.76-.18)*duck;
    L[n]=music.samples[0][n]*musicGain+voice[n]*Math.SQRT1_2;
    R[n]=music.samples[1][n]*musicGain+voice[n]*Math.SQRT1_2;
  }
  let rawPeak=0;for(let n=0;n<L.length;n++)rawPeak=Math.max(rawPeak,Math.abs(L[n]),Math.abs(R[n]));
  if(rawPeak>.94){const guard=.94/rawPeak;for(let n=0;n<L.length;n++){L[n]*=guard;R[n]*=guard;}}
  const rawFile=path.join(root,'media','mix-'+id+'-raw.wav'),mixFile=path.join(root,'media','mix-'+id+'.wav');
  fs.writeFileSync(rawFile,encodeWave([L,R]));
  const measures=normalize(rawFile,mixFile);
  if(sha(musicFile)!==musicSha)throw Error('Original music was altered');
  const silenceLog=call(FF,['-hide_banner','-i',native(mixFile),'-af','silencedetect=noise=-45dB:d=0.2','-f','null','-']).stderr;
  const silenceEvents=silenceLog.split(/\r?\n/).filter(line=>/silence_start|silence_end/.test(line));
  const starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const unexpectedSilence=starts.some((s,i)=>!plan.quietPockets.some(([a,b])=>s>=a-.06&&s<=b&&(ends[i]??D)<=b+.06));
  if(unexpectedSilence)throw Error('Unexpected mixed-audio silence');
  const report={status:'TECHNICAL_PASS',episode:Number(episodeId),duration:D,sampleRate:SR,channels:2,engineUrl:plan.engineUrl,speakerId:plan.speakerId,credit:plan.voice,
    narrationFile:path.relative(root,voiceFile),mixFile:path.relative(root,mixFile),narrationSha256:sha(voiceFile),mixSha256:sha(mixFile),originalMusicSha256:musicSha,musicPreserved:true,
    voicePerSegmentTargetRmsDbfs:-20,voiceSegmentPeakCeilingDbfs:20*Math.log10(.65),ducking:{musicClearGain:.76,musicUnderVoiceGain:.18,attackSeconds:.045,releaseSeconds:.18},
    intendedQuietPockets:plan.quietPockets,segments:ledger,targetIntegratedLufs:-14,maximumTruePeakDbtp:-1.8,processingTruePeakGuardDbtp:-2.2,...measures,silenceEvents,unexpectedSilence,
    creativeChecks:{answerOrder:'Scene-specific authored speech; answer lines occur at their displayed answer scenes.',cta:'次の実験も、ぷいで。',websiteOrSalesCopyRead:false},
    licensing:{commercialAllowedWithCredit:true,sources:['https://voicevox.hiroshiba.jp/term/','https://www.zunko.jp/con_ongen_kiyaku.html'],creditRequired:plan.voice,characterIllustrationUsed:false},
    verificationScope:{durationAndPlacementMeasured:true,readingsRecorded:true,quietPocketsPreserved:true,humanRealtimeListening:false,finalAacMeasurement:false}};
  write(path.join(root,'qa','narration-'+id+'.json'),report);
  return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(process.argv[2]||path.join(source,'..')),id=process.argv[3];
  const selected=plan.episodes.filter(e=>!id||e.id===Number(id));
  if(!selected.length)throw Error('Unknown narration episode: '+id);
  if(cuts.length!==25||cuts.at(-1)!==D)throw Error('Narration requires the shared 24-scene / 64-second timebase');
  for(const e of selected){const r=await makeNarration(root,e.id);console.log(JSON.stringify({complete:r.episode,mix:r.mixFile,lufs:r.measured.input_i,truePeak:r.measured.input_tp}));}
}
