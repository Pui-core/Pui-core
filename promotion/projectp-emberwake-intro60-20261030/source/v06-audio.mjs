import fs from'node:fs';import{cues}from'./plan.mjs';import{srcRoot as src,caseRoot as out,cue07At}from'./v06-config.mjs';import{ff,save,hash}from'./background.mjs';
// 声WAV/PCMは再生成しない。r5の各cueのPCMを、cue07だけ新しいat(plan.mjs)へ置き直し、ducking/SFX/共通gainをr5と同じ式で再計算する。
const sr=48000,N=65*sr*2,read=p=>{const b=fs.readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const old=JSON.parse(fs.readFileSync(src+'/qa/audio-binding-r5.json'));
if(cues.find(c=>c.id==='07').at!==cue07At)throw Error('plan cue07 differs from v06-config');
fs.mkdirSync(out+'/media',{recursive:true});fs.mkdirSync(out+'/qa',{recursive:true});
const voice=new Float32Array(N),bound=[];
for(const c of old.cues){const at=cues.find(x=>x.id===c.id).at,a=read(c.pcmFile),off=Math.round(at*sr)*2;if(hash(c.file)!==c.sha256)throw Error('Cue WAV changed '+c.id);for(let n=0;n<a.length;n++)voice[off+n]+=a[n];bound.push({...c,at,actualStart:c.actualStart-c.at+at,actualEnd:c.actualEnd-c.at+at});}
for(let i=0;i<bound.length-1;i++)if(bound[i].actualEnd>=bound[i+1].actualStart)throw Error('Voice overlap '+bound[i].id);
const m=read(src+'/media/music-base.f32'),music=new Float32Array(N),sfx=read(src+'/media/sfx-r5.f32');
for(let n=0;n<N;n++){const t=n/(sr*2);let g=1;for(const c of bound){if(t>c.actualStart-.09&&t<c.actualEnd+.2){const duck=t<c.actualStart?(1-(t-(c.actualStart-.09))/.09*.7):t>c.actualEnd?.3+(t-c.actualEnd)/.2*.7:.3;g=Math.min(g,duck);}}g*=Math.min(1,t/.04,(65-t)/.7);music[n]=(m[n]||0)*Math.max(0,g);sfx[n]/=old.commonGain;}
let peak=0;for(let n=0;n<N;n++)peak=Math.max(peak,Math.abs(voice[n]+music[n]+sfx[n]));const gain=Math.min(1,.64/peak);
const r5=Object.fromEntries(['voice','music','sfx'].map(k=>[k,read(src+'/media/'+k+'-r5.f32')]));const tracks={voice,music,sfx};
// 変更範囲の検証: r5との差が出る時刻(秒)の最小/最大を各トラックで記録する(gainが同値ならcue07周辺のみのはず)
const diff={};for(const k of Object.keys(tracks)){tracks[k].forEach((_,n)=>{tracks[k][n]*=gain;});let lo=Infinity,hi=-Infinity,cnt=0;for(let n=0;n<N;n++){if(Math.abs(tracks[k][n]-r5[k][n])>1e-6){const t=n/(sr*2);lo=Math.min(lo,t);hi=Math.max(hi,t);cnt++;}}diff[k]={firstDiffSeconds:cnt?lo:null,lastDiffSeconds:cnt?hi:null,diffSamples:cnt};}
for(const k of Object.keys(tracks)){fs.writeFileSync(out+'/media/'+k+'-r6.f32',Buffer.from(tracks[k].buffer));await ff(['-f','f32le','-ar','48000','-ac','2','-i',out+'/media/'+k+'-r6.f32','-c:a','pcm_s24le',out+'/media/'+k+'-r6.wav'],out+'/qa/'+k+'-r6-save.json');}
const c07=bound.find(c=>c.id==='07'),c06=bound.find(c=>c.id==='06'),c08=bound.find(c=>c.id==='08');
const result={...old,cues:bound,temporalCorrection:{...old.temporalCorrection,cue07:'v06: moved from at16.0 to '+cue07At+' (actualStart '+c07.actualStart.toFixed(4)+') after lamp-on frame523=17.4333s; WAV/query not regenerated'},commonGain:gain,mixPeakBeforeGain:peak,expectedMixPeak:peak*gain,tracks:['voice-r6.wav','music-r6.wav','sfx-r6.wav'],minVoicedGap:Math.min(...bound.slice(1).map((c,i)=>c.actualStart-bound[i].actualEnd)),r5Comparison:{r5CommonGain:old.commonGain,v06CommonGain:gain,gainChanged:Math.abs(gain-old.commonGain)>1e-9,diff},cue07Window:{actualStart:c07.actualStart,actualEnd:c07.actualEnd,gapAfterCue06:c07.actualStart-c06.actualEnd,gapBeforeCue08:c08.actualStart-c07.actualEnd,lampOnSeconds:523/30}};
save(out+'/qa/audio-binding-r6.json',result);console.log(JSON.stringify({retimed:true,cue07:[c07.actualStart,c07.actualEnd],gapToCue08:c08.actualStart-c07.actualEnd,gain,r5Gain:old.commonGain,peak:peak*gain,diff}));
