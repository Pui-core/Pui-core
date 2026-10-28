/** Quiet, original marimba/pizzicato bed; no borrowed song, sample, or recording. */
import fs from 'node:fs';
const output=process.argv[2];
if (!output) throw Error('Usage: node score.mjs output.wav');
const sr=48000, duration=48, n=sr*duration, beat=60/112;
const left=new Float32Array(n),right=new Float32Array(n);
const hz=m=>440*2**((m-69)/12);
let seed=1482026;
const noise=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
function add(at,len,gain,pan,synth){
  const start=Math.round(at*sr),frames=Math.round(len*sr);
  for(let i=0;i<frames&&start+i<n;i++){
    const t=i/sr,v=synth(t,i/frames)*gain;
    left[start+i]+=v*Math.sqrt((1-pan)/2);
    right[start+i]+=v*Math.sqrt((1+pan)/2);
  }
}
const chords=[[48,60,64,67,71],[45,60,64,69,72],[41,60,65,69,72],[43,59,62,67,71]];
for(let b=0;b*beat<duration;b++){
  const at=b*beat,ch=chords[Math.floor(b/4)%4];
  if(b%2===0)add(at,.3,.14,0,t=>Math.sin(2*Math.PI*(52*t+1.6*(1-Math.exp(-t*40))))*Math.exp(-t*19)*Math.min(1,t/.004));
  if(b%2===1)add(at,.065,.021,.25,t=>noise()*Math.exp(-t*75)*Math.min(1,t/.001));
  if(b%2===0){const f=hz(ch[0]);add(at,beat*1.7,.075,0,(t,p)=>Math.sin(2*Math.PI*f*t)*Math.min(1,t/.02)*Math.min(1,(1-p)/.18));}
  for(let k=0;k<2;k++){
    const index=[1,3,2,4,2,3,1,2][(b%4)*2+k],f=hz(ch[index]);
    add(at+k*beat/2,.55,.055,k?-.3:.3,t=>(Math.sin(2*Math.PI*f*t)*Math.exp(-t*9)+.25*Math.sin(2*Math.PI*f*3*t)*Math.exp(-t*22))*Math.min(1,t/.003));
  }
}
const wav=Buffer.alloc(44+n*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*4,40);
for(let i=0;i<n;i++){const env=Math.min(1,i/sr/.1,(duration-i/sr)/.2);wav.writeInt16LE(Math.round(Math.tanh(left[i]*1.7)*env*32767),44+i*4);wav.writeInt16LE(Math.round(Math.tanh(right[i]*1.7)*env*32767),46+i*4);}
fs.writeFileSync(output,wav);
console.log(JSON.stringify({output,duration,sampleRate:sr,channels:2,bpm:112,source:'Original deterministic synthesis'}));
