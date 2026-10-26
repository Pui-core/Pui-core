import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import {file,np,FF,save,hash,digest} from './native.mjs';
const target=process.argv[2]||'horizontal';if(!['horizontal','youtube','tiktok'].includes(target))throw Error('Unknown target');
const prefix=target==='horizontal'?'':'short/',suffix=target==='tiktok'?'-tiktok':'';
const output=file(target==='horizontal'?'videos/emberwake-episode2-futari-no-aizu.mp4':'short/videos/episode2-short'+suffix+'.mp4');
function pcm(p){const r=spawnSync(FF,['-v','error','-i',np(p),'-vn','-ac','1','-ar','48000','-f','f32le','-'],{encoding:null,maxBuffer:24000000,timeout:45000});if(r.status!==0)throw Error('PCM decode failed');const b=r.stdout;return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
const ref=pcm(file(prefix+'media/reference-mix.wav')),actual=pcm(output),stem=pcm(file(prefix+'media/narration-stem.wav'));
const narration=JSON.parse(fs.readFileSync(file(prefix+'qa/narration.json'),'utf8')),rows=[];
function correlation(start,length,lag){let xy=0,xx=0,yy=0;for(let n=0;n<length;n+=2){const x=ref[start+n]||0,y=actual[start+n+lag]||0;xy+=x*y;xx+=x*x;yy+=y*y;}return xy/Math.sqrt(xx*yy);}
for(const c of narration.cues){const raw=pcm(file(prefix+'media/'+c.file)),at=Math.round(c.at*48000);let maxError=0,first=-1,last=-1;for(let i=0;i<raw.length;i++){maxError=Math.max(maxError,Math.abs((stem[at+i]||0)-raw[i]*1.45));if(Math.abs(raw[i])>.001){if(first<0)first=i;last=i;}}
 if(maxError>0.00001||first<0||last>=raw.length)throw Error('Whole narration PCM was altered/truncated: '+c.file);
 let best={lag:0,correlation:-1};for(let lag=-64;lag<=64;lag++){const corr=correlation(at,raw.length,lag);if(corr>best.correlation)best={lag,correlation:corr};}
 const edgeLength=Math.min(4800,last-first+1),head=correlation(at+first,edgeLength,best.lag),tail=correlation(at+last-edgeLength+1,edgeLength,best.lag);
 if(Math.abs(best.lag)>2||best.correlation<.985||head<.98||tail<.98)throw Error('Final AAC whole phrase/head/tail misalignment: '+c.file+' '+JSON.stringify({...best,head,tail}));
 rows.push({file:c.file,text:c.text,at:c.at,wavSeconds:raw.length/48000,declaredEnd:c.end,remainingCueSeconds:c.end-c.at-raw.length/48000,sourceWaveSha256:hash(file(prefix+'media/'+c.file)),wholePcmMaxError:maxError,firstVoicedSecond:first/48000,lastVoicedSecond:last/48000,lagSamples:best.lag,lagMilliseconds:best.lag/48,wholeCorrelation:best.correlation,headCorrelation:head,tailCorrelation:tail,wholePhraseRetained:true});
}
save(prefix+'qa/whole-voice-aac'+suffix+'.json',{status:'PASS_FULL_PHRASE_PCM_AND_FINAL_AAC_HEAD_TAIL_SYNC',videoSha256:await digest(output),sampleRate:48000,voiceGain:1.45,cues:rows,minimumWholeCorrelation:Math.min(...rows.map(r=>r.wholeCorrelation)),maxAbsoluteLagSamples:Math.max(...rows.map(r=>Math.abs(r.lagSamples))),subjectiveWholeListen:false,scope:'Whole source phrase versus narration stem; complete reference mix versus final AAC including voiced head/tail windows. Numerical verification is separate from direct subjective listening.'});
console.log(JSON.stringify({target,cues:rows.length,maxLag:Math.max(...rows.map(r=>Math.abs(r.lagSamples))),minWholeCorrelation:Math.min(...rows.map(r=>r.wholeCorrelation)),maxPcmError:Math.max(...rows.map(r=>r.wholePcmMaxError))}));
