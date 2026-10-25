/** Archive editing runs locally. Never show character media or renders to AI. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root, previousRoot, archive, TICKS, fps, plans, loadEdit} from './config.mjs';
import {composition} from './motion.mjs';

export {root};
export const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
export const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
export const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
export const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const backgroundName = 'bingo-paper-background.png';
const parse = s => JSON.parse(s.replace(/^\uFEFF/, '').trim());
export function hash(file) {
  const digest = crypto.createHash('sha256'), buffer = Buffer.allocUnsafe(1024*1024), fd = fs.openSync(file, 'r');
  try { let count; while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) digest.update(buffer.subarray(0, count)); }
  finally { fs.closeSync(fd); }
  return digest.digest('hex');
}
export function nativePath(file) {
  const r = spawnSync('wslpath', ['-w', path.resolve(file)], {encoding:'utf8'});
  if (r.error || r.status !== 0 || !r.stdout.trim()) throw Error('wslpath failed: ' + file);
  return r.stdout.trim();
}
function save(file, value) { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value, null, 2)+'\n'); }
const folder = p => path.join(root, p.id);
const qa = (p, name) => path.join(folder(p), 'qa', name+'.json');
const comp = p => 'Osayu Archive '+p.id;
const project = (p, textOnly=false) => path.join(folder(p), 'projects', p.id+(textOnly?'-text-only':'')+'.ecproj');
const movie = (p, suffix) => path.join(folder(p), 'videos', p.id+'-'+suffix+'.mp4');
function directories(p) {
  for (const dir of ['projects','source','media','videos','qa','qa/local-only']) fs.mkdirSync(path.join(folder(p),dir), {recursive:true});
}
function call(exe, args, log, input) {
  const r = spawnSync(exe, args, {encoding:'utf8', input, timeout:180000, maxBuffer:32*1024*1024});
  const result = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/,''), stderr:r.stderr};
  if (log) save(log,result);
  if (r.error || r.status !== 0) throw Error(JSON.stringify({exe,args,...result}).slice(-6000));
  return result.stdout.trim();
}
async function run(exe, args, log) {
  const start=Date.now();
  return new Promise((resolve,reject)=>{
    const child=spawn(exe,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='',error;
    child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('error',e=>error=e.message);
    child.on('close',exit=>{const result={exit,seconds:(Date.now()-start)/1000,error,stdout:stdout.replace(/^\uFEFF/,''),stderr};
      if(log)save(log,result);if(error||exit!==0)reject(Error(JSON.stringify({exe,args,...result}).slice(-6000)));else resolve(result);});
  });
}
function probe(file, count=false, log) {
  return parse(call(FP,['-v','error',...(count?['-count_frames']:[]),'-show_streams','-show_format','-of','json',nativePath(file)],log));
}
function strings(value, out=[]) {
  if(typeof value==='string')out.push(value);else if(Array.isArray(value))value.forEach(v=>strings(v,out));
  else if(value&&typeof value==='object')Object.values(value).forEach(v=>strings(v,out));return out;
}
export function assertBackground() {
  const file=path.join(root,'media/background-manifest.json'), m=parse(fs.readFileSync(file,'utf8'));
  if(m.file!==backgroundName||m.containsCharacter!==false||!/^[a-f0-9]{64}$/.test(m.sha256||'')||hash(path.join(root,'media',backgroundName))!==m.sha256)throw Error('Current character-free paper background manifest required.');
  return {backgroundSha256:m.sha256,backgroundManifestSha256:hash(file)};
}
export function assertTextOnly(p) {
  const file=project(p,true), data=parse(fs.readFileSync(file,'utf8'));
  const refs=strings(data).filter(s=>/\.(?:png|jpe?g|webp|gif|bmp|tiff?|mp4|mov|mkv|webm|avi)(?:$|[?#])/i.test(s));
  const allow=new Set([backgroundName,nativePath(path.join(root,'media',backgroundName))]);
  if(!refs.length||refs.some(s=>!allow.has(s)))throw Error('Text-only project imports character/archive media: '+JSON.stringify(refs.filter(s=>!allow.has(s))));
  return {containsCharacter:false,containsArchive:false,aiViewingAllowed:true,projectSha256:hash(file),mediaReferences:refs,...assertBackground()};
}
function readExtraction() {
  const file=path.join(root,'qa/extraction.json');return fs.existsSync(file)?parse(fs.readFileSync(file,'utf8')):{clips:[]};
}
function clipPath(s) {return path.join(root,'media/clips',s.id+'.mp4');}
function editSha() {return hash(path.join(root,'edit-manifest.json'));}
function inputStats(file) {const s=fs.statSync(file);return {path:file,size:s.size,mtimeMs:s.mtimeMs};}
function staticStatsMatch(a,b) {return a.path===b.path&&a.size===b.size&&a.mtimeMs===b.mtimeMs;}
function requireExtracted(edit) {
  const evidence=readExtraction();
  for(const shot of edit.shots.filter(s=>s.kind==='archive')) {
    const e=evidence.clips.find(c=>c.id===shot.id);
    if(!e||e.sourceIn!==shot.sourceIn||e.sourceOut!==shot.sourceOut||e.duration!==shot.end-shot.start||!fs.existsSync(clipPath(shot))||hash(clipPath(shot))!==e.sha256)throw Error('Extracted clip is missing or stale: '+shot.id);
  }
  const voice=path.join(root,'media/voice-mix.wav');
  if(evidence.voice?.editManifestSha256!==editSha()||!fs.existsSync(voice)||hash(voice)!==evidence.voice.sha256)throw Error('Voice timeline is missing or stale; run extract after the edit manifest is final.');
  return evidence;
}

async function buildVoice(edit, sourceSeal) {
  if(!edit.voice.length)throw Error('At least one real archive voice event is required.');
  const events=[];
  for(const v of edit.voice) {
    const duration=v.sourceOut-v.sourceIn, output=path.join(root,'media/voice',v.id+'.wav');
    const fade=Math.min(.008,duration/4);
    const filter=`aresample=48000,aformat=channel_layouts=stereo,highpass=f=65,acompressor=threshold=0.18:ratio=2.5:attack=5:release=80:makeup=1,afade=t=in:st=0:d=${fade},afade=t=out:st=${duration-fade}:d=${fade},apad,atrim=duration=${duration},asetpts=PTS-STARTPTS`;
    await run(FF,['-hide_banner','-y','-ss',String(v.sourceIn),'-i',nativePath(edit.alignedAudio),'-t',String(duration),'-vn','-af',filter,'-ac','2','-ar','48000','-c:a','pcm_s24le',nativePath(output)],path.join(root,'qa','voice-'+v.id+'.json'));
    const data=probe(output),audio=data.streams.find(s=>s.codec_type==='audio');
    if(audio?.sample_rate!=='48000'||audio.channels!==2||Math.abs(Number(data.format.duration)-duration)>.002)throw Error('Voice event metadata mismatch: '+v.id);
    events.push({...v,duration,file:path.relative(root,output),sha256:hash(output),containsRealPerformerVoice:true});
  }
  const output=path.join(root,'media/voice-mix.wav'), inputs=events.flatMap(e=>['-i',nativePath(path.join(root,e.file))]);
  const nodes=events.map((e,i)=>`[${i}:a]adelay=${Math.round(e.start*48000)}S:all=1[v${i}]`);
  nodes.push(events.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${events.length}:normalize=0:dropout_transition=0,apad,atrim=duration=${edit.duration},loudnorm=I=-16:TP=-2.5:LRA=9,aresample=48000[out]`);
  await run(FF,['-hide_banner','-y',...inputs,'-filter_complex',nodes.join(';'),'-map','[out]','-ac','2','-c:a','pcm_s24le',nativePath(output)],path.join(root,'qa/voice-timeline-mix.json'));
  if(!staticStatsMatch(sourceSeal,inputStats(edit.alignedAudio)))throw Error('Aligned source WAV changed while voice events were cut.');
  return {file:'media/voice-mix.wav',sha256:hash(output),editManifestSha256:editSha(),alignedAudio:sourceSeal,events,sourceClock:'container zero; gap-padded alignedAudio',normalization:'-16 LUFS, -2.5 dBTP target; final AAC separately measured'};
}

export async function extract({shotIds,buildVoiceTimeline=shotIds===undefined}={}) {
  fs.mkdirSync(path.join(root,'media/clips'),{recursive:true});fs.mkdirSync(path.join(root,'media/voice'),{recursive:true});fs.mkdirSync(path.join(root,'qa'),{recursive:true});
  const edit=loadEdit(), manifestSha=editSha(), all=edit.shots.filter(s=>s.kind==='archive'), selected=shotIds?all.filter(s=>shotIds.includes(s.id)):all;
  if(!selected.length||shotIds?.some(id=>!all.some(s=>s.id===id)))throw Error('No matching archive shot.');
  const before=inputStats(archive), old=readExtraction();
  const archiveSha256=old.archive&&staticStatsMatch(old.archive,before)?old.archive.sha256:hash(archive);
  const source={...before,sha256:archiveSha256}, clips=new Map((old.clips||[]).map(c=>[c.id,c]));
  for(const shot of selected) {
    const duration=shot.end-shot.start, expectedFrames=Math.round(duration*fps), output=clipPath(shot), cached=clips.get(shot.id);
    if(cached&&cached.archiveSha256===archiveSha256&&cached.sourceIn===shot.sourceIn&&cached.sourceOut===shot.sourceOut&&cached.duration===duration&&fs.existsSync(output)&&hash(output)===cached.sha256){console.log('Reused extracted '+shot.id);continue;}
    const filter=`fps=fps=${fps}:start_time=0,scale=720:1280:flags=lanczos,setsar=1`;
    await run(FF,['-hide_banner','-y','-ss',String(shot.sourceIn),'-i',nativePath(archive),'-t',String(duration),'-map','0:v:0','-an','-vf',filter,'-frames:v',String(expectedFrames),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',nativePath(output)],path.join(root,'qa','extract-'+shot.id+'.json'));
    const data=probe(output,true,path.join(root,'qa','clip-'+shot.id+'-ffprobe.json')),v=data.streams.find(s=>s.codec_type==='video');
    if(v?.width!==720||v.height!==1280||v.r_frame_rate!=='30/1'||v.avg_frame_rate!=='30/1'||Number(v.nb_read_frames)!==expectedFrames||data.streams.some(s=>s.codec_type==='audio')||Math.abs(Number(v.start_time||0))>.001)throw Error('CFR/source-zero clip check failed: '+shot.id);
    clips.set(shot.id,{id:shot.id,file:path.relative(root,output),sourceIn:shot.sourceIn,sourceOut:shot.sourceOut,duration,frames:expectedFrames,archiveSha256,sha256:hash(output),sourceClock:'archive container seconds',clipClock:'zero-based CFR30',aiViewingAllowed:false});
    console.log('Extracted '+shot.id);
  }
  if(!staticStatsMatch(before,inputStats(archive)))throw Error('Source archive changed during extraction.');
  let voice=old.voice;
  if(buildVoiceTimeline) {
    if(typeof edit.alignedAudio!=='string'||!fs.existsSync(edit.alignedAudio))throw Error('Gap-padded alignedAudio is required.');
    voice=await buildVoice(edit,inputStats(edit.alignedAudio));
  }
  if(editSha()!==manifestSha)throw Error('Edit manifest changed during extraction.');
  const result={archive:source,editManifestSha256:manifestSha,clips:[...clips.values()],voice,performedAt:new Date().toISOString(),characterAiViewingPerformed:false};
  save(path.join(root,'qa/extraction.json'),result);return result;
}

export function prepare(selected=plans) {
  const edit=loadEdit();assertBackground();requireExtracted(edit);
  for(const p of selected) {
    directories(p);
    for(const includeArchive of [true,false]) {
      const stem=p.id+(includeArchive?'':'-text-only'), source=path.join(folder(p),'source',stem+'.jsx');
      fs.writeFileSync(source,composition(root,p,{includeArchive}));
      const result=parse(call(EC,['--empty','script',nativePath(source),'--save-as',nativePath(project(p,!includeArchive)),'--json'],qa(p,stem+'-build')));
      if(!result.ok||result.error)throw Error(JSON.stringify(result));
      const layout=typeof result.output==='string'?parse(result.output):result.output;
      if(!layout?.boxes?.length||layout.boxes.some(b=>!b.text?.trim()||!Number.isFinite(b.size)||b.size<20))throw Error('Invalid native text layout: '+stem);
      save(qa(p,includeArchive?'layout':'text-only-layout'),layout);
    }
    save(qa(p,'text-only-isolation'),assertTextOnly(p));console.log('Prepared '+p.id);
  }
}
function inputSeals(p) {
  const edit=loadEdit();requireExtracted(edit);
  return {...assertBackground(),editManifestSha256:editSha(),clips:edit.shots.filter(s=>s.kind==='archive').map(s=>({id:s.id,file:path.relative(root,clipPath(s)),sha256:hash(clipPath(s))})),
    voiceSha256:hash(path.join(folder(p),'media/voice.wav')),musicSha256:hash(path.join(folder(p),'media/music.wav'))};
}
function duckExpression(edit) {
  const factors=edit.voice.map(v=>{
    const a=v.start,b=v.start+v.sourceOut-v.sourceIn,attack=.04,release=.16,r=.22;
    return `if(lt(t,${Math.max(0,a-attack)}),1,if(lt(t,${a}),1-${1-r}*(t-${Math.max(0,a-attack)})/${Math.min(a,attack)||attack},if(lt(t,${b}),${r},if(lt(t,${b+release}),${r}+${1-r}*(t-${b})/${release},1))))`;
  });
  return factors.reduce((a,b)=>`min(${a},${b})`,'1');
}
async function music(p,edit) {
  const source=path.join(previousRoot,'audio-preview',p.audioFile), local=path.join(root,'audio-preview',p.audioFile);
  fs.mkdirSync(path.dirname(local),{recursive:true});if(!fs.existsSync(local))fs.copyFileSync(source,local);
  if(!/^[a-f0-9]{64}$/.test(p.previewSha256||'')||hash(local)!==p.previewSha256)throw Error('Preview music differs from its recorded source digest.');
  const remaining=edit.duration-edit.drop, data=probe(local);
  if(p.audioStart<0||p.audioStart+remaining>Number(data.format.duration)+.03)throw Error('Music preview is too short for this edit: '+p.id);
  const out=path.join(folder(p),'media/music.wav');
  const filter=`atrim=start=${p.audioStart}:duration=${remaining},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.04,adelay=${Math.round(edit.drop*48000)}S:all=1,apad,atrim=duration=${edit.duration},loudnorm=I=-22:TP=-3:LRA=9,aresample=48000,volume='${duckExpression(edit)}':eval=frame,afade=t=out:st=${edit.duration-.55}:d=0.55`;
  await run(FF,['-hide_banner','-y','-i',nativePath(local),'-vn','-af',filter,'-ac','2','-c:a','pcm_s24le',nativePath(out)],qa(p,'music-mix'));
  save(qa(p,'music-source'),{song:p.song,artist:p.artist,file:path.basename(local),sha256:hash(local),previewStart:p.audioStart,previewEnd:p.audioStart+remaining,videoStart:edit.drop,ownerPreviewUseAuthorized:true,exactTikTokVersionVerified:false});return out;
}
function createFilm(p,edit,master,voice,musicFile) {
  const output=path.join(folder(p),'projects',p.id+'.fcproj');
  const commands=[{id:'file.newProject',params:{name:'Osayu / Archive Jet V4 / '+p.title}},
    {id:'file.newSequence',params:{name:comp(p),width:1080,height:1920,fps,sampleRate:48000,video:1,audio:2}},
    {id:'file.import',params:{paths:[nativePath(master),nativePath(voice),nativePath(musicFile)]}}];
  const initialized=call(FC,['--save-as',nativePath(output),'run','-'],qa(p,'filmcraft-build'),commands.map(c=>JSON.stringify(c)).join('\n')+'\n');let items;
  for(const line of initialized.split(/\r?\n/).filter(Boolean)){const q=parse(line),v=q.result||q;if(v.items)items=v.items;}
  if(items?.length!==3)throw Error('FilmCraft native imported IDs missing.');
  const clips=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:Math.round(edit.duration*TICKS),video:true,audio:false}},
    {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:Math.round(edit.duration*TICKS),video:false,audio:true}},
    {id:'timeline.place',params:{item:items[2],track:'A2',seconds:0,duration:Math.round(edit.duration*TICKS),video:false,audio:true}}];
  call(FC,['--project',nativePath(output),'--save','run','-'],qa(p,'filmcraft-timeline'),clips.map(c=>JSON.stringify(c)).join('\n')+'\n');
  call(FC,['--project',nativePath(output),'inspect'],qa(p,'filmcraft-reopen'));
}
export async function render(selected=plans) {
  const edit=loadEdit();assertBackground();requireExtracted(edit);
  for(const p of selected) {
    directories(p);
    const voice=path.join(folder(p),'media/voice.wav');fs.copyFileSync(path.join(root,'media/voice-mix.wav'),voice);
    const musicFile=await music(p,edit), assets=inputSeals(p), input={projectSha256:hash(project(p)),assets,startedAt:new Date().toISOString()};
    const master=path.join(folder(p),'media/picture-master.mp4');
    await run(EC,['render','--project',nativePath(project(p)),'--comp',comp(p),'--out',nativePath(master),'--format','h264','--bitrate','18000','--audio','off','--progress','--json'],qa(p,'effectcraft-render'));
    if(hash(project(p))!==input.projectSha256||JSON.stringify(inputSeals(p))!==JSON.stringify(assets))throw Error('Native rendering inputs changed: '+p.id);
    save(qa(p,'render-input'),{...input,endedAt:new Date().toISOString(),masterSha256:hash(master)});
    for(const suffix of ['reference','voice-only']) {
      const mixed=path.join(folder(p),'media',suffix+'-mix.wav');
      if(suffix==='reference')await run(FF,['-hide_banner','-y','-i',nativePath(voice),'-i',nativePath(musicFile),'-filter_complex',`[0:a][1:a]amix=inputs=2:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,apad,atrim=duration=${edit.duration}[a]`,'-map','[a]','-ac','2','-c:a','pcm_s24le',nativePath(mixed)],qa(p,suffix+'-audio-mix'));
      else await run(FF,['-hide_banner','-y','-i',nativePath(voice),'-af',`loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,apad,atrim=duration=${edit.duration}`,'-ac','2','-c:a','pcm_s24le',nativePath(mixed)],qa(p,suffix+'-audio-mix'));
      await run(FF,['-hide_banner','-y','-i',nativePath(master),'-i',nativePath(mixed),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-t',String(edit.duration),'-movflags','+faststart',nativePath(movie(p,suffix))],qa(p,suffix+'-export'));
    }
    createFilm(p,edit,master,voice,musicFile);console.log('Rendered '+p.id);
  }
}
export async function previews(selected=plans) {
  const edit=loadEdit();
  for(const p of selected) {
    directories(p);const isolation=assertTextOnly(p),layout=parse(fs.readFileSync(qa(p,'text-only-layout'),'utf8'));
    const proposed=layout.previewTimes||layout.reviewTimes||edit.reviewTimes||edit.shots.flatMap(s=>[(s.start+s.end)/2,...(s.end-s.start>.4?[s.start+.13]:[])]);
    const times=[...new Set(proposed.map(t=>Math.min(Math.round(edit.duration*fps)-1,Math.max(0,Math.round(t*fps)))/fps))].sort((a,b)=>a-b),frames=[];
    for(const [i,time]of times.entries()) {
      const stem='text-only-'+String(i+1).padStart(3,'0'),file=path.join(folder(p),'qa',stem+'.png');
      await run(EC,['render-frame','--project',nativePath(project(p,true)),'--comp',comp(p),'--time',String(time),'--out',nativePath(file),'--json'],qa(p,stem));
      frames.push({time,file:path.basename(file),sha256:hash(file),containsCharacter:false,containsArchive:false});
    }
    if(hash(project(p,true))!==isolation.projectSha256)throw Error('Safe preview project changed during sampling.');
    const sheets=[];
    for(let first=0;first<frames.length;first+=24) {
      const count=Math.min(24,frames.length-first),sheet=path.join(folder(p),'qa','text-only-sheet-'+String(sheets.length+1).padStart(2,'0')+'.png');
      await run(FF,['-v','error','-y','-framerate','1','-start_number',String(first+1),'-i',nativePath(path.join(folder(p),'qa/text-only-%03d.png')),'-vf',`scale=270:480,tile=4x${Math.ceil(count/4)}:nb_frames=${count}:padding=8:margin=8:color=0xf4ecd9`,'-frames:v','1',nativePath(sheet)],qa(p,'sheet-'+sheets.length));
      sheets.push({file:path.basename(sheet),sha256:hash(sheet),frames:frames.slice(first,first+count)});
    }
    save(qa(p,'text-only-preview-index'),{...isolation,frames,sheets,visualInspectionPerformed:false});console.log('Safe previews '+p.id);
  }
}
export async function verify(selected=plans) {
  const edit=loadEdit(),summary=[];
  for(const p of selected) {
    const input=parse(fs.readFileSync(qa(p,'render-input'),'utf8'));
    if(input.projectSha256!==hash(project(p))||input.masterSha256!==hash(path.join(folder(p),'media/picture-master.mp4'))||JSON.stringify(input.assets)!==JSON.stringify(inputSeals(p)))throw Error('Rendered input seals are stale: '+p.id);
    const outputs=[],audio={};
    for(const suffix of ['reference','voice-only']) {
      const file=movie(p,suffix),data=probe(file,true,qa(p,suffix+'-ffprobe')),v=data.streams.find(s=>s.codec_type==='video'),a=data.streams.filter(s=>s.codec_type==='audio');
      if(v?.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||v.codec_name!=='h264'||Number(v.nb_read_frames)!==Math.round(edit.duration*fps)||a.length!==1||a[0].codec_name!=='aac'||Number(a[0].sample_rate)!==48000||Math.abs(Number(data.format.duration)-edit.duration)>.08)throw Error('Final output metadata mismatch: '+file);
      await run(FF,['-v','error','-i',nativePath(file),'-f','null','-'],qa(p,suffix+'-decode'));
      const level=await run(FF,['-hide_banner','-i',nativePath(file),'-af','ebur128=peak=true','-f','null','-'],qa(p,suffix+'-levels'));
      const lufs=Number([...level.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]),peak=Number([...level.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);
      if(!Number.isFinite(lufs)||lufs < -19||lufs > -12||!Number.isFinite(peak)||peak > -.7)throw Error('Final AAC levels outside the declared limits: '+suffix+' '+JSON.stringify({lufs,peak}));
      audio[suffix==='reference'?'reference':'voiceOnly']={integratedLufs:lufs,truePeakDbtp:peak};
      outputs.push({file:path.relative(root,file),sha256:hash(file),bytes:fs.statSync(file).size,duration:Number(data.format.duration),frames:Number(v.nb_read_frames),audioStreams:1,containsAddedBgm:suffix==='reference',containsRealPerformerVoice:true,
        archiveAudioMayContainOriginalMusicOrSoundEffects:true,audioDescription:suffix==='reference'?'配信音声＋追加の試聴用BGM':'配信音声・追加BGMなし（元配信のBGM/SEが残る場合あり）'});
    }
    const isolation=assertTextOnly(p),fc=path.join(folder(p),'projects',p.id+'.fcproj');
    call(EC,['--project',nativePath(project(p)),'info','--json'],qa(p,'effectcraft-reopen'));call(EC,['--project',nativePath(project(p,true)),'info','--json'],qa(p,'text-only-reopen'));
    call(FC,['--project',nativePath(fc),'inspect'],qa(p,'filmcraft-final-reopen'));
    const sample=edit.shots.find(s=>s.kind==='archive');if(!sample)throw Error('No real archive shot to verify.');const time=(sample.start+sample.end)/2;
    await run(EC,['render-frame','--project',nativePath(project(p)),'--comp',comp(p),'--time',String(time),'--out',nativePath(path.join(folder(p),'qa/local-only/ec-reopened.png')),'--json'],qa(p,'effectcraft-reopened-render'));
    await run(FC,['--project',nativePath(fc),'render','--seconds',String(time),'--out',nativePath(path.join(folder(p),'qa/local-only/fc-reopened.png'))],qa(p,'filmcraft-reopened-render'));
    const result={id:p.id,title:p.title,technicalPassed:true,renderInputProjectSha256:input.projectSha256,renderInputAssets:input.assets,outputs,audio,characterFreePreview:isolation,nativeReopenAndRender:true,
      humanRealtimeReview:false,archiveImageAiViewingPerformed:false,tiktokDeviceReview:false,ownerCreativeApproval:false};
    save(qa(p,'validation'),result);summary.push(result);console.log('Verified '+p.id);
  }
  save(path.join(root,'qa/validation.json'),summary);return summary;
}

export async function smoke() {
  const base=path.join(root,'qa/synthetic-clock-smoke');fs.mkdirSync(base,{recursive:true});
  const clip=path.join(base,'synthetic-red-blue.mp4');
  await run(FF,['-hide_banner','-y','-f','lavfi','-i',"color=c=red:s=720x1280:r=30:d=0.8,drawbox=x=0:y=0:w=iw:h=ih:color=blue:t=fill:enable='gte(t,0.4)'",'-an','-c:v','libx264','-preset','ultrafast','-crf','12','-pix_fmt','yuv420p',nativePath(clip)],path.join(base,'synthetic-build.json'));
  const jsx=path.join(base,'synthetic.jsx'),native=path.join(base,'synthetic.ecproj');
  fs.writeFileSync(jsx,`app.newProject();var c=app.run('comp.new',{name:'Archive clock smoke',width:1080,height:1920,frameRate:30,duration:2.5,background:'#000000'}).comp;var item=app.run('file.import',{paths:[${JSON.stringify(nativePath(clip))}]}).items[0];for(var i=0;i<2;i++){var a=i?1.4:.3,l=app.run('layer.addItem',{item:item,time:a,duration:.8}).layer;app.run('layer.timing',{layers:[l],start:a,in:a,out:a+.8});app.run('prop.set',{layer:l,path:'transform/anchor',value:[360,640,0]});app.run('prop.set',{layer:l,path:'transform/position',value:[540,960,0]});app.run('prop.set',{layer:l,path:'transform/scale',value:[150,150,100]});}writeLn(JSON.stringify({comp:c}));`);
  call(EC,['--empty','script',nativePath(jsx),'--save-as',nativePath(native),'--json'],path.join(base,'native-build.json'));
  const samples=[];
  for(const [time,expected]of [[.1,'black'],[.433333,'red'],[.866667,'blue'],[1.2,'black'],[1.533333,'red'],[1.966667,'blue'],[2.366667,'black']]) {
    const png=path.join(base,'sample-'+time+'.png');await run(EC,['render-frame','--project',nativePath(native),'--comp','Archive clock smoke','--time',String(time),'--out',nativePath(png),'--json'],path.join(base,'sample-'+time+'.json'));
    const r=spawnSync(FF,['-v','error','-i',nativePath(png),'-vf','crop=1:1:540:960,format=rgb24','-frames:v','1','-f','rawvideo','-'],{maxBuffer:1024*1024,timeout:60000});
    if(r.error||r.status!==0||r.stdout.length!==3)throw Error('Synthetic RGB probe failed.');const [red,green,blue]=r.stdout;
    const passed=expected==='black'?Math.max(red,green,blue)<10:expected==='red'?red>180&&green<50&&blue<50:blue>180&&red<50&&green<50;
    samples.push({time,expected,rgb:[red,green,blue],passed});
  }
  const result={passed:samples.every(s=>s.passed),samples,projectSha256:hash(native),clipSha256:hash(clip),sourceZeroForBothShots:samples.filter(s=>s.expected!=='black').every(s=>s.passed),timingApi:'layer.addItem time=a; layer.timing start=a,in=a,out=a+duration',containsCharacter:false,containsArchive:false};
  save(path.join(base,'result.json'),result);if(!result.passed)throw Error('Native synthetic clip clock smoke failed.');console.log('Synthetic native source-zero/2-shot clock PASS');return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const op=process.argv[2],id=process.argv[3];
  if(op==='smoke')await smoke();else if(op==='extract')await extract(id?{shotIds:[id],buildVoiceTimeline:false}:{});
  else {const selected=id?plans.filter(p=>p.id===id):plans;if(!selected.length)throw Error('Unknown plan ID.');const actions={prepare,render,previews,verify};if(!actions[op])throw Error('Use smoke | extract [shot-id] | prepare/render/previews/verify [plan-id].');await actions[op](selected);}
}
