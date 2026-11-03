import fs from 'node:fs';import path from 'node:path';
import {root,filmNative,run,ff,ffprobePath,save,hash} from './runtime.mjs';
import {framesFor,durationFor,sourceIn,sourceSHA256} from './full-plan-v09.mjs';
const TPS=254016000000,eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),param=(e,n)=>Object.values(e?.params?.[n]?.value||{})[0];
function sequence(p){return Object.values(p.project.items).find(x=>x.kind?.Sequence)?.kind.Sequence;}
function videoContract(p,master,duration){
 const seq=sequence(p),clips=seq.video_tracks.flatMap(x=>x.items),clip=clips[0],motion=clip?.effects.find(e=>e.effect==='motion'),opacity=clip?.effects.find(e=>e.effect==='opacity'),time=clip?.effects.find(e=>e.effect==='time_remap');
 if(clips.length!==1||clip.start!==0||clip.source_in!==0||clip.duration!==Math.round(duration*TPS)||clip.speed!==1||clip.reverse||clip.frame_hold||clip.scale_to_frame||param(motion,'scale')!==100||param(motion,'scale_width')!==100||param(motion,'rotation')!==0||param(opacity,'opacity')!==100||param(time,'speed')!==100||!eq(param(motion,'position'),{x:540,y:960})||!eq(param(motion,'anchor'),{x:540,y:960})||clip.effects.length!==3||!clip.enabled||seq.master_effects?.length||seq.video_tracks.some(t=>t.effects?.length||t.transitions?.length||!t.enabled))throw Error('Film video contract');
 const media=p.project.items[String(clip.item)]?.kind?.Media;if(media.offline||media.media?.File?.path!==master)throw Error('Film video source');return seq;
}
const resumeExported=process.argv.includes('--resume-exported'),variants=process.argv.slice(2).filter(x=>!x.startsWith('--'));
for(const variant of variants.length?variants:['solo','collab']){
 const frames=framesFor(variant),duration=durationFor(variant),stem=variant+'-production',master=path.join(root,'videos',stem+'-full.mp4'),audio=path.join(root,'audio/candidate-elektronomia-sky-high-regular.mp3'),avProject=path.join(root,'projects',variant+'-with-audio.fcproj'),silentProject=path.join(root,'projects',variant+'-silent.fcproj'),label=variant==='solo'?'通常版':'コラボ版',av=path.join(root,'videos',label+'_音源あり.mp4'),silent=path.join(root,'videos',label+'_無音.mp4');
 if([silentProject,silent].some(p=>fs.existsSync(p)))throw Error('Preserve existing silent final');
 if(!resumeExported&&[avProject,av].some(p=>fs.existsSync(p)))throw Error('Preserve existing AV final');
 if(resumeExported&&(!fs.existsSync(avProject)||!fs.existsSync(av)||JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-full-film-export.json'))).code!==0))throw Error('Exported AV checkpoint unavailable');
 const rec=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-full-receipt.json'))),audit=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-audit.json'))),proof=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-character-proof.json'))),coverage=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-full-coverage.json')));
 if(hash(master)!==rec.sha256||rec.frames!==frames||!rec.decode||audit.projectSHA256!==rec.projectHash||!proof.passed||proof.productionProjectSHA256!==rec.projectHash||coverage.videoSHA256!==rec.sha256||coverage.uncoveredBackgroundDetected!==false||hash(audio)!==sourceSHA256)throw Error('Film input gates');
 if(!resumeExported){
 const create=[{id:'file.newProject',params:{name:'Osayu v09 full '+variant}},{id:'file.newSequence',params:{name:'November3 '+variant,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[master,audio]}}];
 const q=await filmNative(['--save-as',avProject,'run','-'],variant+'-full-film-create',create.map(x=>JSON.stringify(x)).join('\n')+'\n');
 let items;for(const line of q.stdout.split(/\r?\n/).filter(x=>x.startsWith('{'))){const j=JSON.parse(line),v=j.result||j;if(v.items)items=v.items;}if(items?.length!==2)throw Error('Film import');
 const place=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:Math.round(duration*TPS),video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,sourceIn:Math.round(sourceIn*TPS),duration:Math.round(duration*TPS),video:false,audio:true}}];
 await filmNative(['--project',avProject,'--save','run','-'],variant+'-full-film-place',place.map(x=>JSON.stringify(x)).join('\n')+'\n');
 let p=JSON.parse(fs.readFileSync(avProject)),seq=videoContract(p,master,duration),clips=seq.audio_tracks.flatMap(x=>x.items),clip=clips[0];
 if(clips.length!==1||clip.start!==0||clip.source_in!==Math.round(sourceIn*TPS)||clip.duration!==Math.round(duration*TPS)||clip.speed!==1)throw Error('Audio interval');
 const edits=[{id:'clip.audioGain',params:{clips:[clip.id],mode:'set',db:-6}},{id:'sequence.applyAudioTransition',params:{clip:clip.id,effect:'constant_power',frames:8,edge:'out'}}];
 await filmNative(['--project',avProject,'--save','run','-'],variant+'-full-film-envelope',edits.map(x=>JSON.stringify(x)).join('\n')+'\n');
 await filmNative(['--project',avProject,'--save','inspect'],variant+'-full-film-reopen');
 }
 const p=JSON.parse(fs.readFileSync(avProject)),seq=videoContract(p,master,duration),avHash=hash(avProject),savedVideo=seq.video_tracks;
 const audioClips=seq.audio_tracks.flatMap(t=>t.items),audioClip=audioClips[0];
 if(audioClips.length!==1||audioClip.start!==0||audioClip.source_in!==Math.round(sourceIn*TPS)||audioClip.duration!==Math.round(duration*TPS)||audioClip.speed!==1||audioClip.gain_db!==-6)throw Error('Saved AV audio checkpoint');
 if(!resumeExported)await filmNative(['--project',avProject,'exec','file.exportMedia',JSON.stringify({path:av,format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:18,hardwareEncoding:'off',wait:true})],variant+'-full-film-export');
 // Derive the silent native through FilmCraft. Preserve AV project and video unchanged.
 await filmNative(['--project',avProject,'--save-as',silentProject,'exec','sequence.deleteTrack',JSON.stringify({track:seq.audio_tracks[0].id})],variant+'-silent-native-derive-by-id');
 await filmNative(['--project',silentProject,'--save','inspect'],variant+'-silent-native-reopen');
 const sp=JSON.parse(fs.readFileSync(silentProject)),ss=videoContract(sp,master,duration);
 if(hash(avProject)!==avHash||ss.audio_tracks.length||!eq(ss.video_tracks,savedVideo))throw Error('Silent native differs');
 // Stream copy only: final editing was done in FilmCraft, no second video render for audio removal.
 await ff(['-i',av,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',silent],variant+'-silent-stream-copy');
 const outputs=[];let referenceFrames;
 for(const [kind,file] of [['with-audio',av],['silent',silent]]){
  const probe=JSON.parse((await run(ffprobePath,['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],variant+'-'+kind+'-final-probe')).stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.filter(s=>s.codec_type==='audio');
  if(v?.width!==1080||v?.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_read_frames)!==frames||Math.abs(Number(v.duration)-duration)>.001||a.length!==(kind==='silent'?0:1))throw Error('Final streams');
  await ff(['-i',file,'-f','null','-'],variant+'-'+kind+'-full-decode');
  const md=path.join(root,'qa',variant+'-'+kind+'-frames.md5');await ff(['-i',file,'-map','0:v:0','-an','-f','framemd5',md],variant+'-'+kind+'-frame-hash');
  const hashes=fs.readFileSync(md,'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#'));if(hashes.length!==frames)throw Error('Frame hash count');
  if(referenceFrames&&!eq(hashes,referenceFrames))throw Error('Audio/silent video mismatch');referenceFrames=hashes;
  outputs.push({kind,path:file,bytes:fs.statSync(file).size,sha256:hash(file),videoFrames:frames,audioStreams:a.length,videoDuration:Number(v.duration),audioDuration:a[0]?Number(a[0].duration):null,decoded:true,frameHashFile:md,frameHashSHA256:hash(md)});
 }
 if(hash(master)!==rec.sha256||hash(audio)!==sourceSHA256)throw Error('Final inputs changed');
 save(path.join(root,'qa',variant+'-final-pair-receipt.json'),{variant,outputs,avProject,avProjectSHA256:hash(avProject),silentProject,silentProjectSHA256:hash(silentProject),masterSHA256:rec.sha256,effectProjectSHA256:rec.projectHash,videoDecodedFramesAndPTSIdentical:true,videoRendersForAudioPair:1,sourceSHA256,sourceIn,sourceOut:sourceIn+duration,sourceGainDB:-6,tailFadeFrames:8,TikTokIDVerified:false,TikTokIDPrivateDeliveryGate:false,actualAudition:false,ownerCreativeAcceptance:false,personMediaAIInputCount:0});
 console.log(JSON.stringify({variant,frames,duration,outputs:outputs.map(x=>({kind:x.kind,path:x.path,sha256:x.sha256,bytes:x.bytes})),videoPairIdentical:true}));
}
