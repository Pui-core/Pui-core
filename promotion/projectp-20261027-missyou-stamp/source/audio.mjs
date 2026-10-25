import fs from 'node:fs';
import {file,np,exec,FF,WNODE,run,parse,save,hash} from './native.mjs';
const e=JSON.parse(fs.readFileSync(file('source/edit.json'))),rate=48000;
const voice=parse((await run(WNODE,[np(file('source/synthesize-windows.mjs')),np(file('source/narration-cues.json')),np(file('media'))],'voicevox-synthesis.json')).stdout);
const pcm=new Float32Array(Math.round(e.duration*rate)*2),cues=[];
for(const c of voice.cues){
 const raw=exec(FF,['-v','error','-i',np(file('media/'+c.file)),'-f','f32le','-ar',String(rate),'-ac','2','-'],{encoding:null,maxBuffer:8e6}).stdout;
 const n=raw.length/8,at=Math.round(c.at*rate);
 if(at+n>Math.round(c.end*rate))throw Error('Voice exceeds its interval');
 let peak=0,first=null,last=null;
 for(let i=0;i<n;i++)for(let ch=0;ch<2;ch++){const v=raw.readFloatLE(i*8+ch*4);pcm[(at+i)*2+ch]+=v;peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>.001){if(first===null)first=i;last=i;}}
 cues.push({...c,actualDuration:n/rate,firstAboveMinus60Seconds:c.at+first/rate,lastAboveMinus60Seconds:c.at+last/rate,sourceSha256:hash(file('media/'+c.file)),peak});
}
const peak=pcm.reduce((p,x)=>Math.max(p,Math.abs(x)),0),gain=10**(-4/20)/peak,raw=Buffer.alloc(pcm.length*4);
for(let i=0;i<pcm.length;i++)raw.writeFloatLE(pcm[i]*gain,i*4);
exec(FF,['-v','error','-y','-f','f32le','-ar',String(rate),'-ac','2','-i','-','-c:a','pcm_s24le',np(file('media/narration.wav'))],{encoding:null,input:raw,maxBuffer:1e6});
const rms=[];for(let f=0;f<e.frames;f++){let sum=0;for(let i=f*1600;i<(f+1)*1600;i++)sum+=(pcm[i*2]*gain)**2;rms.push(Math.sqrt(sum/1600));}
save('source/voice-rms.json',{fps:30,windowSamples:1600,sampleRate:rate,rms,narrationSha256:hash(file('media/narration.wav')),musicDrivesMouth:false});
save('qa/narration.json',{...voice,cues,sampleRate:rate,totalSamples:e.duration*rate,gainDb:20*Math.log10(gain),targetSamplePeakDbfs:-4,narrationSha256:hash(file('media/narration.wav')),noOtherAudio:true,directSubjectiveAudition:false});
console.log('New VOICEVOX narration and 660 actual PCM RMS windows ready');
