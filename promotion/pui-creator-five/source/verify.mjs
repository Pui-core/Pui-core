import fs from 'node:fs';import {episodes} from './episodes.mjs';import {stem} from './produce.mjs';import {file,FF,FP,EC,FC,np,hash,parse,save,run} from './native.mjs';
const integrityOnly=process.argv.includes('--integrity-only'),ids=process.argv.slice(2).filter(v=>!v.startsWith('--')),list=ids.length?episodes.filter(e=>ids.includes(e.id)):episodes;
for(const e of list){const id=stem(e),q='qa/'+id,out=file('videos/'+id+'.mp4'),r=parse(fs.readFileSync(file(q+'/rendered.json'),'utf8'));
 const ecSha=hash(file('projects/'+id+'.ecproj')),fcSha=hash(file('projects/'+id+'.fcproj'));let relocated;try{relocated=parse(fs.readFileSync(file(q+'/delivery-native.json'),'utf8'));}catch{}
 const originalMatch=r.ecSha256===ecSha&&r.fcSha256===fcSha,deliveryMatch=relocated?.videoSha256===r.sha256&&relocated?.effectcraftSha256===ecSha&&relocated?.filmcraftSha256===fcSha;
 if(r.sha256!==hash(out)||(!originalMatch&&!deliveryMatch)||r.audioSha256!==hash(file('media/'+id+'-mix.wav')))throw Error('Changed after rendering '+id);
 if(integrityOnly){console.log('Video / native / mix integrity verified '+id+' ('+(originalMatch?'rendered':'relocated')+')');continue;}
 const p=parse((await run(FP,['-v','error','-count_frames','-show_streams','-show_format','-of','json',np(out)],q+'/probe-command.json')).stdout);save(q+'/ffprobe.json',p);const v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 if(v?.codec_name!=='h264'||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==Math.round(e.duration*30)||a?.codec_name!=='aac'||Number(a.sample_rate)!==48000||a.channels!==2||Math.abs(Number(p.format.duration)-e.duration)>.1)throw Error('Invalid format '+id);
 await run(FF,['-v','error','-i',np(out),'-f','null','-'],q+'/full-decode.json');
 const m=await run(FF,['-hide_banner','-i',np(out),'-af','ebur128=peak=true','-f','null','-'],q+'/final-audio.json');const I=Number([...m.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]),TP=Number([...m.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);if(!Number.isFinite(I)||I < -24||I > -8||!Number.isFinite(TP)||TP>0)throw Error('Invalid audio '+I+' '+TP);
 const frames=e.shots.map(s=>Math.min(Math.round((s.a+Math.min(.55,(s.b-s.a)*.6))*30),Math.round(s.b*30)-1)),cols=Math.min(5,frames.length),rows=Math.ceil(frames.length/cols);
 await run(FF,['-v','error','-y','-i',np(out),'-vf',"select='"+frames.map(n=>'eq(n,'+n+')').join('+')+"',scale=324:576,tile="+cols+'x'+rows+':padding=6:margin=6:color=0x101722','-frames:v','1',np(file(q+'/all-scenes.jpg'))],q+'/all-scenes.json');
 const t=e.shots[Math.min(3,e.shots.length-1)].a;await run(FF,['-v','error','-y','-ss',String(Math.max(0,t-.1)),'-i',np(out),'-vf','scale=216:384,tile=6x3:padding=4:margin=4:color=0x101722','-frames:v','1',np(file(q+'/continuous-cut.jpg'))],q+'/continuous-cut.json');
 await run(FF,['-v','error','-y','-ss',String(Math.min(.45,e.duration-.1)),'-i',np(out),'-frames:v','1',np(file('videos/'+id+'-cover.jpg'))],q+'/cover.json');
 const ec=np(file('projects/'+id+'.ecproj')),fc=np(file('projects/'+id+'.fcproj'));
 const footage=parse((await run(EC,['--project',ec,'run','footage.check','{"wait":true}','footage.missing','{}','--json'],q+'/ec-footage.json')).stdout),status=parse((await run(FC,['--project',fc,'exec','media.status'],q+'/fc-status.json')).stdout);
 if(footage.some(x=>x.result?.missing!==undefined&&(Array.isArray(x.result.missing)?x.result.missing.length:x.result.missing)!==0)||status.length!==2||status.some(x=>x.status!=='online'))throw Error('Missing native media');
 save(q+'/technical.json',{status:'TECHNICAL_PASS',width:1080,height:1920,fps:30,frames:Number(v.nb_read_frames),duration:Number(p.format.duration),fullDecode:true,audio:{integratedLufs:I,truePeakDbfs:TP},missingNativeAssets:0,allSceneFrames:frames,continuousCut:{start:Math.max(0,t-.1),frames:18},visualReview:'PENDING',realTimeWholeWatchAndAudition:'NOT_PERFORMED',ownerCreativeAcceptance:'PENDING',sha256:hash(out)});
 console.log('Verified '+id+' / '+I+' LUFS / '+TP+' dBTP');
}
