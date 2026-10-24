/** V2 final-media verification. Importing this module does not execute checks. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const idOf=e=>e.id+'-'+e.slug;

/** Spread four cut reviews across the film; favor deliberate transitions. */
export function reviewCuts(e){
  const candidates=e.shots.slice(1).map((s,i)=>({time:s.a,shot:i+1,transition:s.transition||'cut'}));
  const selected=[];
  for(const fraction of [.16,.36,.62,.88]){
    const remaining=candidates.filter(c=>!selected.some(x=>x.time===c.time));
    if(!remaining.length)break;
    remaining.sort((a,b)=>{
      const score=c=>Math.abs(c.time-e.duration*fraction)/e.duration-(/^(whip|slide)/.test(c.transition)?.02:0);
      return score(a)-score(b);
    });
    selected.push(remaining[0]);
  }
  // The 8s music reel has only three boundaries; opening camera motion is fourth.
  if(selected.length<4)selected.push({time:0,shot:0,transition:'opening'});
  return selected.sort((a,b)=>a.time-b.time).slice(0,4).map((c,i)=>({
    ...c,index:i+1,startFrame:Math.max(0,Math.min(Math.round((c.time-.1)*30),Math.round(e.duration*30)-18)),
    frames:18,file:'continuous-cut-'+String(i+1).padStart(2,'0')+'.jpg'
  }));
}

export async function verifyEpisode(e,{integrityOnly=false}={}){
  // native.mjs creates runtime directories, so load it only on explicit execution.
  const n=await import('./native.mjs');
  const {file,hash,parse,save,run,np,FP,FF,EC,FC}=n;
  const id=idOf(e),q='qa/'+id,out=file('videos/'+id+'.mp4');
  const rendered=json(file(q+'/rendered.json'));
  const mix=file('media/'+(e.mix||id+'-mix.wav'));
  const ec=file('projects/'+id+'.ecproj'),fc=file('projects/'+id+'.fcproj');
  const ecSha=hash(ec),fcSha=hash(fc);let delivery;
  if(fs.existsSync(file(q+'/delivery-native.json')))delivery=json(file(q+'/delivery-native.json'));
  const originalMatch=rendered.ecSha256===ecSha&&rendered.fcSha256===fcSha;
  const deliveryMatch=delivery?.videoSha256===rendered.sha256&&delivery.effectcraftSha256===ecSha&&delivery.filmcraftSha256===fcSha;
  if(hash(out)!==rendered.sha256||(!originalMatch&&!deliveryMatch)||hash(mix)!==rendered.audioSha256)throw Error('Changed video/native/mix after rendering: '+id);
  const binding={videoSha256:rendered.sha256,effectcraftSha256:ecSha,filmcraftSha256:fcSha,audioSha256:hash(mix),nativeSnapshot:originalMatch?'rendered':'relocated'};
  if(integrityOnly){console.log('Video / native / mix integrity verified '+id+' ('+binding.nativeSnapshot+')');return binding;}

  const probe=parse((await run(FP,['-v','error','-count_frames','-show_streams','-show_format','-of','json',np(out)],q+'/probe-command.json')).stdout);
  save(q+'/ffprobe.json',probe);
  const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio'),expectedFrames=Math.round(e.duration*30);
  if(v?.codec_name!=='h264'||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==expectedFrames||a?.codec_name!=='aac'||Number(a.sample_rate)!==48000||a.channels!==2||Math.abs(Number(probe.format.duration)-e.duration)>.1)throw Error('Invalid output format: '+id);
  await run(FF,['-v','error','-i',np(out),'-f','null','-'],q+'/full-decode.json');
  const measured=await run(FF,['-hide_banner','-i',np(out),'-af','ebur128=peak=true','-f','null','-'],q+'/final-audio.json');
  const I=Number([...measured.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]);
  const TP=Number([...measured.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);
  if(!Number.isFinite(I)||I < -24||I > -8||!Number.isFinite(TP)||TP>0)throw Error('Invalid final AAC level: '+id+' '+I+' LUFS / '+TP+' dBTP');

  const frames=[...new Set(e.shots.map(s=>Math.max(0,Math.min(Math.round((s.a+Math.min(.35,(s.b-s.a)*.65))*30),Math.round(s.b*30)-1))))];
  const cols=Math.min(5,frames.length),rows=Math.ceil(frames.length/cols);
  await run(FF,['-v','error','-y','-i',np(out),'-vf',"select='"+frames.map(n=>'eq(n,'+n+')').join('+')+"',scale=324:576,tile="+cols+'x'+rows+':padding=6:margin=6:color=0x101722','-frames:v','1',np(file(q+'/all-scenes.jpg'))],q+'/all-scenes.json');
  const cuts=reviewCuts(e);
  for(const c of cuts)await run(FF,['-v','error','-y','-ss',String(c.startFrame/30),'-i',np(out),'-vf','scale=216:384,tile=6x3:padding=4:margin=4:color=0x101722','-frames:v','1',np(file(q+'/'+c.file))],q+'/continuous-cut-'+String(c.index).padStart(2,'0')+'.json');
  // Compatibility for tools which used the single v1 contact-sheet name.
  if(cuts.length)fs.copyFileSync(file(q+'/'+cuts[0].file),file(q+'/continuous-cut.jpg'));
  const coverTime=Math.max(0,Math.min(.3,e.shots[0].b-.05,e.duration-.1));
  await run(FF,['-v','error','-y','-ss',String(coverTime),'-i',np(out),'-frames:v','1',np(file('videos/'+id+'-cover.jpg'))],q+'/cover.json');

  const footage=parse((await run(EC,['--project',np(ec),'run','footage.check','{"wait":true}','footage.missing','{}','--json'],q+'/ec-footage.json')).stdout);
  const status=parse((await run(FC,['--project',np(fc),'exec','media.status'],q+'/fc-status.json')).stdout);
  const missing=Array.isArray(footage)&&footage.find(x=>x.command==='footage.missing');
  if(!missing||!Array.isArray(missing.result?.missing)||missing.result.missing.length||footage.some(x=>typeof x.result?.missing==='number'&&x.result.missing!==0)||!Array.isArray(status)||status.length!==2||status.some(x=>x.status!=='online'))throw Error('Missing native media: '+id);
  const report={status:'TECHNICAL_PASS',version:'V2',comp:'Pui V2 '+e.id,width:1080,height:1920,fps:30,frames:expectedFrames,duration:Number(probe.format.duration),expectedDuration:e.duration,fullDecode:true,audio:{integratedLufs:I,truePeakDbfs:TP},missingNativeAssets:0,allSceneFrames:frames,continuousCuts:cuts.map(c=>({...c,start:c.startFrame/30})),coverTime,previewTime:Math.min(3.2,e.duration-.1),...binding,sha256:rendered.sha256,visualReview:'PENDING',realTimeWholeWatchAndAudition:'NOT_PERFORMED',ownerCreativeAcceptance:'PENDING',postPublicationPerformance:'NOT_MEASURED'};
  save(q+'/technical.json',report);
  console.log('Verified V2 '+id+' / '+expectedFrames+' frames / '+I+' LUFS / '+TP+' dBTP');
  return report;
}

export async function verify({ids=[],integrityOnly=false}={}){
  const selected=ids.length?episodes.filter(e=>ids.includes(e.id)):episodes;
  if(!selected.length||ids.some(id=>!episodes.some(e=>e.id===id)))throw Error('Unknown episode ID');
  const reports=[];for(const e of selected)reports.push(await verifyEpisode(e,{integrityOnly}));return reports;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);await verify({ids:args.filter(s=>!s.startsWith('--')),integrityOnly:args.includes('--integrity-only')});
}
