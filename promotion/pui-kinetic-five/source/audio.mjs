/** Five original kinetic-short scores. Node synthesis only; no external recordings. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const SAMPLE_RATE = 48000;
export const TARGET = {integratedLufs:-14, truePeakDbtp:-1.8, lra:7};
// The 192 kHz loudnorm limiter can overshoot slightly when resampled to 48 kHz.
// Keep a processing margin, then measure the actual 48 kHz deliverable below.
const PROCESSING_TRUE_PEAK = -2.2;
const c150 = [0,.8,2.4,4,6.4,8,10.4,12.8,15.2,16.8,19.2];
export const SHORT_SCORES = [
  {id:'01', name:'Copy avalanche → flow', bpm:150, duration:19.2, cuts:c150, pocket:[5.6,6.4], drop:6.4, tail:16.8, transpose:0, voice:'clav', seed:844101},
  {id:'02', name:'String zero quiz', bpm:144, duration:20, cuts:[0,.833333,2.5,4.166667,6.666667,8.333333,10.833333,13.333333,15.833333,17.5,20], pocket:[6.25,6.666667], drop:6.666667, tail:17.5, transpose:3, voice:'bell', seed:844102},
  {id:'03', name:'Web maze → one destination', bpm:150, duration:19.2, cuts:c150, pocket:[5.6,6.4], drop:6.4, tail:16.8, transpose:5, voice:'marimba', seed:844103},
  {id:'04', name:'Eye tracking / camera chase', bpm:160, duration:18, cuts:[0,.75,2.25,3.75,6,7.5,9.75,12,14.25,15.75,18], pocket:[5.25,6], drop:6, tail:15.75, transpose:-2, voice:'fm', seed:844104},
  {id:'05', name:'Who is Pui? Three roles, one creator', bpm:150, duration:19.2, cuts:c150, pocket:[5.6,6.4], drop:6.4, tail:16.8, transpose:7, voice:'transform', seed:844105},
];
export const MAIN_CUTS = [0,.8,2.4,4,6.4,8,10.4,12.8,15.2,16.8,19.2,22.4,25.6,28.8,32,35.2,38.4,41.6,44.8,48,51.2,54.4,57.6,60.8,64];
export const SCORES = SHORT_SCORES.map(s=>({...s,bpm:150,duration:64,cuts:MAIN_CUTS,pocket:[5.6,6.4],pockets:[[5.6,6.4],[24.8,25.6],[44,44.8]],drop:6.4,drops:[6.4,25.6,44.8,57.6],tail:60.8,format:'main-64s'}));
const TAU = 2*Math.PI;
const clamp = x => Math.max(0,Math.min(1,x));
const hz = m => 440*2**((m-69)/12);
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function native(p) {
  const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});
  if(r.error||r.status||!r.stdout.trim())throw Error('wslpath failed: '+p);
  return r.stdout.trim();
}
function exec(exe,args) {
  const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
  if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);
  return r;
}
function jsonFromLog(log) { return JSON.parse(log.match(/\{[\s\S]*\}/)?.[0]||'{}'); }

export function synthesize(root, config) {
  fs.mkdirSync(path.join(root,'media'),{recursive:true});
  fs.mkdirSync(path.join(root,'qa'),{recursive:true});
  const sr=SAMPLE_RATE, count=Math.round(config.duration*sr), L=new Float64Array(count), R=new Float64Array(count);
  const beat=60/config.bpm, cues=[];
  const pockets=config.pockets||[config.pocket], drops=config.drops||[config.drop];
  let seed=config.seed;
  const noise=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
  function add(at,dur,synth,level,pan=0) {
    const start=Math.round(at*sr), len=Math.round(dur*sr);
    const gl=Math.sqrt((1-pan)*.5), gr=Math.sqrt((1+pan)*.5);
    for(let n=0;n<len&&start+n<count;n++) {
      if(start+n<0)continue;
      const value=synth(n/sr,n/len)*level;
      L[start+n]+=value*gl; R[start+n]+=value*gr;
    }
  }
  function kick(at,gain=.4) {
    add(at,.26,t=>Math.sin(TAU*(46*t+2.4*(1-Math.exp(-50*t))))*Math.exp(-20*t)*clamp(t/.0015),gain);
  }
  function clap(at,gain=.13) {
    let low=0;
    add(at,.14,t=>{const n=noise();low=low*.65+n*.35;return (n-low)*(Math.exp(-40*t)+(t>.014?.55*Math.exp(-65*(t-.014)):0))*clamp(t/.001);},gain,-.06);
  }
  function hat(at,gain=.025,pan=.45) {
    let low=0;
    add(at,.065,t=>{const n=noise();low=low*.7+n*.3;return (n-low)*Math.exp(-90*t)*clamp(t/.001);},gain,pan);
  }
  function click(at,tone=1100,gain=.06,pan=0) {
    add(at,.065,t=>(Math.sin(TAU*t*tone)+.25*noise())*Math.exp(-90*t)*clamp(t/.001),gain,pan);
  }
  function impact(at,gain=.2) {
    add(at,.5,t=>Math.sin(TAU*(34*t+.9*(1-Math.exp(-20*t))))*Math.exp(-10*t)*clamp(t/.002),gain);
    let low=0;
    add(at,.16,t=>{low=low*.8+noise()*.2;return low*Math.exp(-28*t)*clamp(t/.001);},gain*.3,-.2);
    cues.push({kind:'impact',time:at});
  }
  function sweep(at,dur=.15,gain=.065,direction=1) {
    let low=0;
    add(at-dur,dur+.035,(t,p)=>{const n=noise(),mix=.06+p*.45;low=low*(1-mix)+n*mix;return low*Math.sin(Math.PI*p)**1.3;},gain,direction*.35);
    cues.push({kind:'swipe',from:at-dur,landing:at,direction});
  }
  function note(at,midi,gain=.065,pan=0,dur=.4,voice=config.voice) {
    const f=hz(midi+config.transpose);
    if(voice==='transform')voice=['bell','clav','marimba','fm'][Math.floor(at/12.8)%4];
    add(at,dur,(t,p)=>{
      const env=clamp(t/.003)*clamp((1-p)/.12);
      if(voice==='bell')return env*Math.exp(-6*t)*(Math.sin(TAU*f*t)+.34*Math.sin(TAU*f*2.76*t)*Math.exp(-8*t));
      if(voice==='marimba')return env*Math.exp(-11*t)*(Math.sin(TAU*f*t)+.5*Math.sin(TAU*f*3.98*t)*Math.exp(-26*t));
      if(voice==='fm')return env*Math.exp(-7*t)*Math.sin(TAU*f*t+1.7*Math.sin(TAU*f*2*t)*Math.exp(-18*t));
      return env*Math.exp(-13*t)*(Math.sin(TAU*f*t)+.43*Math.sin(TAU*f*2*t)+.2*Math.sin(TAU*f*3*t));
    },gain,pan);
  }
  function bass(at,midi,gain=.1) {
    const f=hz(midi+config.transpose);
    add(at,beat*.94,(t,p)=>clamp(t/.006)*clamp((1-p)/.14)*(.18+.82*(1-Math.exp(-30*t)))*(Math.sin(TAU*f*t)+.18*Math.sin(TAU*f*2*t)),gain);
  }
  function pad(at,notes,dur,gain=.024,tail=false) {
    notes.forEach((m,i)=>{
      const f=hz(m+config.transpose);
      add(at,dur,(t,p)=>{
        const phase=(t%beat), duck=tail?1:.28+.72*(1-Math.exp(-24*phase));
        return clamp(t/.016)*clamp((1-p)/.16)*duck*(Math.sin(TAU*f*.998*t)+Math.sin(TAU*f*1.002*t))*.5;
      },gain,(i-(notes.length-1)*.5)*.34);
    });
  }
  // New four-note pentatonic motifs for each short; no borrowed song or sample.
  const motifs=[[76,79,83,81],[79,76,84,83],[81,79,76,84],[76,84,83,79],[83,79,84,76]];
  const motif=motifs[Number(config.id)-1];
  const harmony=[{root:40,notes:[64,67,71,74]},{root:36,notes:[60,64,67,74]},{root:43,notes:[62,67,71,76]},{root:38,notes:[62,66,69,76]}];
  impact(0,.21);kick(0,.36);
  note(0,motif[0]+12,.08,-.25,.32);
  // Story-specific tactile opening hooks.
  if(config.id==='01')for(let i=0;i<9;i++)click(.08+i*.073,1050+(i%3)*120,.035,-.65+i*.15);
  if(config.id==='02'){note(.09,83,.072,-.5,.28,'bell');note(.29,88,.072,.5,.3,'bell');}
  if(config.id==='03')for(let i=0;i<4;i++)click(i*beat*.5,800+i*180,.055,i%2?-.6:.6);
  if(config.id==='04')sweep(.18,.18,.11,-1);
  if(config.id==='05')for(let i=0;i<3;i++)note(i*beat*.5,[76,79,83][i],.075,(i-1)*.5,.38,['bell','clav','marimba'][i]);
  const numberOfBeats=Math.ceil(config.duration/beat);
  for(let b=0;b<numberOfBeats;b++) {
    const at=b*beat;
    if(at>=config.tail||pockets.some(([a,b])=>at>=a&&at<b))continue;
    const post=at>=config.drop;
    const section=Math.floor(at/12.8), bar=Math.floor(b/4);
    const ch=harmony[(bar+Math.floor(section/2))%harmony.length];
    if(b%4===0)pad(at,ch.notes,Math.min(beat*3.95,config.tail-at),post?.027:.019);
    const halfTime=config.duration>30?(at>=19.2&&at<25.6||at>=38.4&&at<44.8):at>=config.cuts[7]&&at<config.cuts[8];
    if(post?(!halfTime||b%4===0||b%4===3):(b%2===0))kick(at,post?.39:.28);
    if(halfTime?b%4===2:b%2===1)clap(at,post?.13:.085);
    if(post)bass(at,ch.root+(b%8===7?7:0),.115);
    hat(at+beat*.5,post?.03:.018,b%2?.45:-.45);
    if(post&&b%4===3)hat(at+beat*.75,.016,-.35);
    if(!halfTime||b%2===0)note(at+(post&&b%2?beat*.25:0),motif[(b+section)%4]+(b%8===7?12:0),post?.061:.052,b%2?.38:-.38,beat*.9);
    if(config.duration>30&&section%2===0&&post&&b%4===2)note(at+beat*.75,motif[(b+section+2)%4]+12,.031,b%2?-.5:.5,beat*.65,'bell');
  }
  // Accelerating question/copy rhythm immediately before the intentional pause.
  for(const [pocketAt] of pockets)for(let j=0;j<6;j++)click(pocketAt-.45+j*.065,1000+j*110,.027+j*.003,j%2?.3:-.3);
  // Shared picture cuts land on audible attacks. The large drop resolves the wait.
  for(const [index,at] of config.cuts.entries()) {
    if(at===0||at===config.duration)continue;
    const isDrop=drops.includes(at);
    sweep(at,isDrop?.23:.12,.055,index%2?1:-1);
    click(at,isDrop?1500:1050+(index%10)*45,isDrop?.085:.045,index%2?.25:-.25);
    if(isDrop)impact(at,at===config.drop?.31:.25);
    else if(index===6||index===8)impact(at,.13);
    cues.push({kind:'cut-attack',time:at,cutIndex:index});
  }
  // Quiet stable CTA: chord and small signature, no full-strength drums.
  pad(config.tail,harmony[0].notes,config.duration-config.tail,.03,true);
  [76,79,83].forEach((m,i)=>note(config.tail+i*.065,m,.06,(i-1)*.3,.8,'bell'));
  note(config.tail+beat*2,88,.035,.2,Math.min(.7,config.duration-config.tail-beat*2),'bell');

  let previousL=0,previousR=0,hpL=0,hpR=0,peak=0,squares=0;
  for(let i=0;i<count;i++) {
    const t=i/sr;
    let pocket=1;
    for(const [pocketStart,pocketEnd] of pockets)if(t>=pocketStart-.025&&t<pocketEnd) {
      // Silence is intentional. A last 95ms sweep anticipates the reveal.
      pocket=t<pocketStart?clamp((pocketStart-t)/.025):t<pocketEnd-.095?0:clamp((t-(pocketEnd-.095))/.095)*.3;
    }
    const env=clamp(t/.0015)*clamp((config.duration-t)/.04)*pocket;
    hpL=.9975*(hpL+L[i]-previousL);previousL=L[i];
    hpR=.9975*(hpR+R[i]-previousR);previousR=R[i];
    L[i]=Math.tanh(hpL*1.12)*env;R[i]=Math.tanh(hpR*1.12)*env;
    peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));squares+=L[i]**2+R[i]**2;
  }
  if(!Number.isFinite(peak)||peak<=0)throw Error('Empty or invalid score '+config.id);
  const gain=.77/peak, wav=Buffer.alloc(44+count*4);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*4,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*4,40);
  for(let i=0;i<count;i++){wav.writeInt16LE(Math.round(L[i]*gain*32767),44+i*4);wav.writeInt16LE(Math.round(R[i]*gain*32767),46+i*4);}
  const stem='music-'+config.id+(config.format==='short'?'-short':'');
  const original=path.join(root,'media',stem+'-original.wav'), normalized=path.join(root,'media',stem+'.wav');
  fs.writeFileSync(original,wav);
  const base=`loudnorm=I=${TARGET.integratedLufs}:TP=${PROCESSING_TRUE_PEAK}:LRA=${TARGET.lra}`;
  const measure=f=>jsonFromLog(exec(FF,['-hide_banner','-i',native(f),'-af',base+':print_format=json','-f','null','-']).stderr);
  const firstPass=measure(original);
  const filter=base+`:measured_I=${firstPass.input_i}:measured_TP=${firstPass.input_tp}:measured_LRA=${firstPass.input_lra}:measured_thresh=${firstPass.input_thresh}:offset=${firstPass.target_offset}:linear=true:print_format=json`;
  const normalization=jsonFromLog(exec(FF,['-hide_banner','-y','-i',native(original),'-af',filter,'-ar',String(sr),'-c:a','pcm_s24le',native(normalized)]).stderr);
  const measured=measure(normalized);
  const probe=JSON.parse(exec(FP,['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels,bits_per_sample','-of','json',native(normalized)]).stdout);
  const silenceLog=exec(FF,['-hide_banner','-i',native(normalized),'-af','silencedetect=noise=-45dB:d=0.2','-f','null','-']).stderr;
  const silenceEvents=silenceLog.split(/\r?\n/).filter(s=>/silence_start|silence_end/.test(s));
  const starts=[...silenceLog.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const ends=[...silenceLog.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));
  const unexpectedSilence=starts.some((start,i)=>!pockets.some(([a,b])=>start>=a-.04&&start<=b&&(ends[i]??config.duration)<=b+.04));
  if(Math.abs(Number(measured.input_i)+14)>.3||Number(measured.input_tp)>TARGET.truePeakDbtp||Math.abs(Number(probe.format.duration)-config.duration)>.001||unexpectedSilence)throw Error('Audio QA failed '+JSON.stringify({id:config.id,measured,probe,silenceEvents}));
  const report={
    status:'TECHNICAL_PASS',id:config.id,name:config.name,duration:config.duration,bpm:config.bpm,sampleRate:sr,channels:2,
    cutSeconds:config.cuts,cues,target:TARGET,processingTruePeakGuardDbtp:PROCESSING_TRUE_PEAK,quietPockets:pockets,drops,stableCtaFrom:config.tail,
    provenance:{method:'Original deterministic additive/FM/noise synthesis in this source file.',thirdPartySamples:false,voice:false,borrowedSongOrMelody:false,usage:'Original campaign audio produced for this owner; no external sample attribution required.',motifMidiBeforeTranspose:motif,transpose:config.transpose,timbre:config.voice,seed:config.seed},
    original,normalized,bytesOriginal:fs.statSync(original).size,bytesNormalized:fs.statSync(normalized).size,
    sha256Original:sha256(original),sha256Normalized:sha256(normalized),rawPeakDb:20*Math.log10(.77),rawRmsDb:20*Math.log10(Math.sqrt(squares/(count*2))*gain),
    firstPass,normalization,measured,probe,silenceEvents,unexpectedSilence,
    audition:'Technical synthesis, loudness, duration and intentional silence verified. Human real-time listening is not claimed. Final AAC measurement belongs to final-video QA.',
  };
  fs.writeFileSync(path.join(root,'qa','audio-source-'+config.id+(config.format==='short'?'-short':'')+'.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
  const scores=process.argv.includes('--short')?SHORT_SCORES.map(s=>({...s,format:'short'})):SCORES;
  const id=process.argv.slice(3).find(s=>!s.startsWith('--'));
  const selected=id?scores.filter(s=>s.id===String(id).padStart(2,'0')):scores;
  if(!selected.length)throw Error('Unknown score ID');
  for(const score of selected){const r=synthesize(root,score);console.log(JSON.stringify({id:r.id,normalized:r.normalized,lufs:r.measured.input_i,truePeak:r.measured.input_tp,intentionalSilence:r.silenceEvents}));}
}
