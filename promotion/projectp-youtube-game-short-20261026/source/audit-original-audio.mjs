import fs from 'node:fs';
import crypto from 'node:crypto';
import {file} from './native.mjs';
const base=process.env.PP111_INPUT||'/mnt/f/Videos/ProjectP-Core-Puzzle-2026-10-26/revision-04-licensed-classic';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function wav(file){const p=base+'/media/'+file,b=fs.readFileSync(p);let format,data;
 for(let i=12;i+8<=b.length;){const n=b.readUInt32LE(i+4),q=i+8,id=b.toString('ascii',i,i+4);if(q+n>b.length)throw Error('Truncated RIFF');if(id==='fmt '){format={containerFormat:b.readUInt16LE(q),channels:b.readUInt16LE(q+2),sampleRate:b.readUInt32LE(q+4),align:b.readUInt16LE(q+12),bits:b.readUInt16LE(q+14)};format.effectiveFormat=format.containerFormat===65534&&n>=40?b.readUInt16LE(q+24):format.containerFormat;}if(id==='data')data=b.subarray(q,q+n);i=q+n+(n&1);}
 if(!format||!data||format.effectiveFormat!==1||format.channels!==2||format.sampleRate!==48000||![16,24].includes(format.bits))throw Error('Unexpected actual WAV '+file);
 const samples=data.length/(format.bits/8),pcm=new Float64Array(samples);let peak=0,lastActive=-1;
 for(let i=0;i<samples;i++){const v=data.readIntLE(i*(format.bits/8),format.bits/8)/2**(format.bits-1);pcm[i]=v;peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>1e-4)lastActive=Math.floor(i/2);}
 return{file,sha256:sha(p),...format,sampleFrames:samples/2,durationSeconds:samples/2/48000,peak,lastActiveSeconds:lastActive/48000,pcm};
}
const voices=['voice-1.wav','voice-2.wav','voice-3.wav'].map(wav),sfx=wav('editorial-sfx.wav'),mix=wav('voice-sfx-no-music.wav'),at=[.12,5.15,14.6];
let max=0,errorSq=0,signalSq=0;
for(let i=0;i<mix.pcm.length;i++){let value=(sfx.pcm[i]||0)*.85;for(let c=0;c<3;c++){const j=i-Math.round(at[c]*48000)*2;if(j>=0&&j<voices[c].pcm.length)value+=voices[c].pcm[j]*1.35;}const delta=mix.pcm[i]-value;max=Math.max(max,Math.abs(delta));errorSq+=delta*delta;signalSq+=value*value;}
const report={schemaVersion:1,at:new Date().toISOString(),scope:'Independent full-PCM reconstruction of existing voice+sfx-no-music from3 originalVOICEVOX WAV and originaleditorialSFX only',files:[...voices,sfx,mix].map(({pcm,...x})=>x),voicePositionsOriginalSeconds:at,originalVoiceGain:1.35,originalSfxGain:.85,maxAbsoluteReconstructionError:max,errorRms:Math.sqrt(errorSq/mix.pcm.length),signalToErrorDb:10*Math.log10(signalSq/errorSq),pass:max<5e-7,oldLicensedMusicUsed:false,sourceAudition:false};
fs.writeFileSync(file('qa/source-audio-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
