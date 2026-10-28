import fs from 'node:fs';
import {file,np,FF,FP,run,parse,save,digest,hash} from './native.mjs';
const duration=19.2,rate=48000,binding=parse(fs.readFileSync(file('qa/real-v9-audio-binding.json'),'utf8'));
const pcm=file('qa/pcm-real-v9');fs.mkdirSync(pcm,{recursive:true});
async function decode(source,name){const out=pcm+'/'+name+'.f32';await run(FF,['-v','error','-y','-i',np(source),'-vn','-ac','1','-ar',String(rate),'-c:a','pcm_f32le','-f','f32le',np(out)]);const b=fs.readFileSync(out);return new Float32Array(b.buffer,b.byteOffset,b.length/4);}
function correlation(x,y,start,count,lag=0){let xy=0,xx=0,yy=0;for(let k=start;k<start+count;k+=3){const a=x[k],b=y[k+lag];xy+=a*b;xx+=a*a;yy+=b*b;}return xy/Math.sqrt(xx*yy);}
const narration=await decode(file('media/narration-real-v9.wav'),'narration'),cues=[];
for(const c of binding.cues){const raw=await decode(file('media/'+c.file),c.id),offset=Math.round(c.at*rate);let first=-1,last=-1,error=0;for(let k=0;k<raw.length;k++){error=Math.max(error,Math.abs(narration[offset+k]-raw[k]));if(Math.abs(raw[k])>.001){if(first<0)first=k;last=k;}}if(first<0||error>1e-5||c.at+raw.length/rate>c.end+.002)throw Error('Voice cue truncated or altered '+c.id);cues.push({...c,actualDuration:raw.length/rate,firstVoiced:c.at+first/rate,lastVoiced:c.at+last/rate,sourceTailPad:(raw.length-1-last)/rate,maxSourcePcmError:error,first,last,offset});}
const outputs=[];
for(const id of ['voice','bgm']){
const video=file('videos/truthorlie-real-v9-'+id+'.mp4'),m=parse((await run(FP,['-v','error','-show_streams','-show_format','-of','json',np(video)],'real-v9-probe-'+id+'.json')).stdout),v=m.streams.find(s=>s.codec_type==='video'),a=m.streams.find(s=>s.codec_type==='audio');
if(v?.width!==1080||v.height!==1920||v.codec_name!=='h264'||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==576||a?.codec_name!=='aac'||Number(a.sample_rate)!==rate||Math.abs(Number(m.format.duration)-duration)>.08)throw Error('Final format mismatch '+id);
await run(FF,['-nostdin','-v','error','-i',np(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],'real-v9-full-decode-'+id+'.json');
const loud=await run(FF,['-nostdin','-hide_banner','-i',np(video),'-filter_complex','ebur128=peak=true','-f','null','-'],'real-v9-loudness-'+id+'.json');
const inputs=['narration-real-v9.wav','sfx-real-v9.wav',...(id==='bgm'?['musicbed-real-v9.wav']:[])],ref=pcm+'/expected-'+id+'.wav';
await run(FF,['-v','error','-y',...inputs.flatMap(n=>['-i',np(file('media/'+n))]),'-filter_complex',inputs.map((_,i)=>'['+i+':a]').join('')+'amix=inputs='+inputs.length+':normalize=0:duration=longest','-ar',String(rate),'-c:a','pcm_f32le',np(ref)]);
const expected=await decode(ref,'expected-'+id),actual=await decode(video,'actual-'+id);if(actual.length<expected.length-48)throw Error('AAC too short');
const checks=[];for(const c of cues){const start=c.offset+c.first,count=c.last-c.first+1;let best={lag:0,value:-1};for(let lag=-3;lag<=3;lag++){const value=correlation(expected,actual,start,count,lag);if(value>best.value)best={lag,value};}const n=Math.min(4800,count),head=correlation(expected,actual,start,n,best.lag),tail=correlation(expected,actual,start+count-n,n,best.lag);if(best.value<.985||head<.975||tail<.975)throw Error('Final AAC head/tail mismatch '+id+'/'+c.id+' '+JSON.stringify({best,head,tail}));checks.push({cue:c.id,lagSamples:best.lag,whole:best.value,head,tail});}
const peak=Number(loud.stderr.match(/True peak:[\s\S]*?Peak:\s*([-\d.]+)\s*dBFS/)?.[1]);if(!Number.isFinite(peak)||peak>-.1)throw Error('Missing or clipping true peak '+id+' '+peak);
outputs.push({variant:id,video:'videos/truthorlie-real-v9-'+id+'.mp4',sha256:await digest(video),frames:576,duration:Number(m.format.duration),sampleRate:rate,truePeakDbfs:peak,fullAVDecode:'exit 0',sourceMixAacHeadTail:checks,comment:m.format.tags?.comment||null});
}
const movie=np(file('videos/truthorlie-real-v9-bgm.mp4'));
await run(FF,['-v','error','-y','-i',movie,'-vf','fps=1,scale=270:480,tile=5x4','-frames:v','1',np(file('qa/real-v9-final-contact.png'))],'real-v9-contact.json');
for(const [name,start,seconds] of [['selection',5.5,1.8],['confirm-result',7.1,2.2],['result-score',9.1,1.8],['brand-close',13.5,3.4]])await run(FF,['-v','error','-y','-ss',String(start),'-i',movie,'-t',String(seconds),'-vf','fps=10,scale=180:320,tile=6x6','-frames:v','1',np(file('qa/real-v9-'+name+'-contact.png'))],'real-v9-'+name+'-contact.json');
for(const t of [.5,2,3.5,4.3,6.5,7.8,8.7,9.8,10.8,12.5,14.7,17.6,19.1])await run(FF,['-v','error','-y','-ss',String(t),'-i',movie,'-frames:v','1',np(file('qa/real-v9-actual-'+t+'.png'))]);
save('qa/real-v9-final-check.json',{status:'PASS_FULL_DECODE_PCM_BINDING_AAC_HEAD_TAIL',duration,outputs,cues:cues.map(({first,last,offset,...c})=>c),fullSourceNarrationPcm:true,wholeRealtimeWatch:false,wholeSubjectiveListen:false,nativeTikTokMusicSelected:false,published:false,finalMp4NotAnOriginalDependency:true});
console.log(JSON.stringify({duration,outputs:outputs.map(o=>({variant:o.variant,sha256:o.sha256,truePeakDbfs:o.truePeakDbfs})),cues:cues.length}));
