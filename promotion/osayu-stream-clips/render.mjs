/** Shorts: direct continuous source audio; captions never overlap the footage. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const [planFile,rootArg,mode='render']=process.argv.slice(2);
if(!planFile||!rootArg||!['render','preview'].includes(mode))throw Error('Usage: node render.mjs private-plan.json root [render|preview]');
const plan=JSON.parse(fs.readFileSync(planFile,'utf8'));
const AUDIO_MODE='direct-container-seek-continuous-samples';
// v1 reused a research WAV with artificial word-internal silence. No fallback.
if('alignedAudio' in plan||plan.audioCutMode!==AUDIO_MODE)throw Error('Padded alignedAudio is forbidden for finished voice. Use direct original MP4 continuous samples.');
const root=path.resolve(rootArg),fps=30,sr=48000;
const FF=process.env.FFMPEG||'/mnt/f/ffmpeg/bin/ffmpeg.exe';
const FP=process.env.FFPROBE||'/mnt/f/ffmpeg/bin/ffprobe.exe';
const native=p=>FF.endsWith('.exe')?execFileSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'}).trim():path.resolve(p);
const layout={width:1080,height:1920,captionCenter:[540,264],titleCenter:[540,70],video:{x:134,y:432,width:810,height:1440},captionMaxBottom:405};
fs.mkdirSync(root,{recursive:true});fs.mkdirSync(path.join(root,'fonts'),{recursive:true});
const font='/mnt/c/Windows/Fonts/meiryob.ttc',fontCopy=path.join(root,'fonts/meiryob.ttc');
if(fs.existsSync(font)&&!fs.existsSync(fontCopy))fs.copyFileSync(font,fontCopy);
const run=(exe,args,log)=>new Promise((resolve,reject)=>{
  const child=spawn(exe,args,{cwd:root,windowsHide:true});let out='';
  for(const s of [child.stdout,child.stderr])s.on('data',d=>out+=d.toString());
  child.on('error',reject);child.on('close',code=>{if(log)fs.writeFileSync(path.join(root,log),out);code?reject(Error(out.slice(-2200))):resolve(out);});
});
const digest=x=>createHash('sha256').update(x).digest('hex');
const planSha=digest(JSON.stringify(plan)),rendererSha=digest(fs.readFileSync(new URL(import.meta.url)));
const stamp=t=>{const n=Math.round(t*100);return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;};
const clean=x=>String(x).replace(/[{}\\]/g,'').replace(/\n/g,'\\N');
const color=x=>'&H00'+x.replace('#','').match(/../g).reverse().join('');
const event=(a,b,style,text)=>`Dialogue: 0,${stamp(a)},${stamp(b)},${style},,0,0,0,,${text}\n`;
const assHeader=`[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Meiryo,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,7,0,5,45,45,0,1
Style: Title,Meiryo,56,&H004DF0FF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,5,45,45,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
function readFloatWave(file){
  const b=fs.readFileSync(file);let data,format;
  for(let p=12;p+8<=b.length;){const name=b.toString('ascii',p,p+4),n=b.readUInt32LE(p+4),start=p+8;if(name==='fmt ')format={tag:b.readUInt16LE(start),channels:b.readUInt16LE(start+2),rate:b.readUInt32LE(start+4),bits:b.readUInt16LE(start+14)};if(name==='data')data=Buffer.from(b.subarray(start,start+n));p=start+n+n%2;}
  if(!data||!format||![3,65534].includes(format.tag)||format.channels!==2||format.rate!==sr||format.bits!==32||data.length%8)throw Error('Expected stereo 48k float PCM');
  return data;
}
function writeFloatWave(file,data){
  const b=Buffer.alloc(44);b.write('RIFF');b.writeUInt32LE(data.length+36,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*8,28);b.writeUInt16LE(8,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(data.length,40);fs.writeFileSync(file,Buffer.concat([b,data]));
}
function normalizeBoundary(raw,targetSamples){
  const rawSamples=raw.length/8;
  if(rawSamples>targetSamples||targetSamples-rawSamples>Math.ceil(sr*.055))throw Error('Unexpected audio duration; refuse speech trimming or long silent padding');
  const b=Buffer.alloc(targetSamples*8);raw.copy(b);
  const fadeIn=Math.min(Math.round(sr*.015),Math.floor(rawSamples/4)),fadeOut=Math.min(Math.round(sr*.020),Math.floor(rawSamples/4));
  for(let n=0;n<rawSamples;n++){
    const g=Math.min(1,n/fadeIn,(rawSamples-1-n)/fadeOut);
    for(let c=0;c<2;c++){const i=n*8+c*4,v=raw.readFloatLE(i);if(!Number.isFinite(v))throw Error('Invalid PCM sample');b.writeFloatLE(v*g,i);}
  }
  return {data:b,rawSamples,targetSamples,tailPaddingSamples:targetSamples-rawSamples,fadeInSamples:fadeIn,fadeOutSamples:fadeOut};
}
function mergeContinuous(cuts){
  const groups=[];
  for(const cut of cuts){
    if(!(cut.start>=0&&cut.end>cut.start&&cut.speed>=1.15&&cut.speed<=1.25))throw Error('Invalid cut bounds or speed');
    for(const sub of cut.captions||[])if(!(sub.start>=cut.start-.01&&sub.end<=cut.end+.01&&sub.end>sub.start))throw Error('Subtitle outside source interval');
    const last=groups.at(-1);
    if(last&&Math.abs(last.speed-cut.speed)<1e-9&&cut.start>=last.end-.001&&cut.start-last.end<=.20){last.end=cut.end;last.captions.push(...cut.captions);last.originalCutCount++;}
    else groups.push({...cut,captions:[...(cut.captions||[])],originalCutCount:1});
  }
  return groups;
}
async function preview(id,duration){
  await run(FF,['-hide_banner','-y','-f','lavfi','-i',`color=c=black:s=1080x1920:r=30:d=${duration}`,'-vf',`drawbox=x=134:y=432:w=810:h=1440:color=0x25313b:t=fill,ass=filename='${id}/captions.ass':fontsdir='fonts'`,'-an','-c:v','libx264','-preset','veryfast','-crf','22',native(path.join(root,id,'no-footage-preview.mp4'))],`${id}/preview.log`);
}
for(const clip of plan.clips){
  if(process.env.CLIP&&process.env.CLIP!==clip.id)continue;
  if(!/^[a-z0-9-]+$/.test(clip.id))throw Error('Unsafe clip id');
  const dir=path.join(root,clip.id);fs.mkdirSync(dir,{recursive:true});
  const saved=fs.existsSync(path.join(dir,'edit.json'))?JSON.parse(fs.readFileSync(path.join(dir,'edit.json'))):null;
  if(mode==='preview'&&saved?.planSha===planSha&&saved?.rendererSha===rendererSha&&saved.groups.every(x=>x.audioEvidence)){
    await preview(clip.id,saved.duration);continue;
  }
  const groups=mergeContinuous(clip.cuts),audioParts=[];let cursor=0,ass=assHeader;
  for(const [i,cut] of groups.entries()){
    const prefix=`${clip.id}/run-${String(i).padStart(2,'0')}`,rawFile=path.join(root,prefix+'-direct.wav');
    let raw;
    if(mode==='render'){
      const filter=`asetpts=N/SR/TB,aresample=48000:async=0,atempo=${cut.speed},aformat=channel_layouts=stereo`;
      await run(FF,['-hide_banner','-y','-ss',String(cut.start),'-t',String(cut.end-cut.start),'-i',native(plan.sourceVideo),'-map','0:a:0','-vn','-af',filter,'-ar',String(sr),'-ac','2','-c:a','pcm_f32le',native(rawFile)],prefix+'-direct.log');
      raw=readFloatWave(rawFile);cut.audioFrames=raw.length/8;
      cut.frames=Math.ceil(Math.max((cut.end-cut.start)/cut.speed,cut.audioFrames/sr)*fps-1e-8);
      const boundary=normalizeBoundary(raw,Math.round(cut.frames/fps*sr));
      cut.audioEvidence={...boundary,data:undefined,sourceMode:AUDIO_MODE,tempoFilter:filter,rawSha256:digest(raw)};
      audioParts.push(boundary.data);
    }else cut.frames=Math.ceil((cut.end-cut.start)/cut.speed*fps-1e-8);
    cut.duration=cut.frames/fps;cut.outputStart=cursor;
    for(const sub of cut.captions){
      const lines=String(sub.text).split('\n');if(lines.length>2)throw Error('Two subtitle lines maximum');
      const units=Math.max(...lines.map(s=>[...s].reduce((n,c)=>n+(c.charCodeAt(0)<128?.55:1),0)));
      const size=Math.min(sub.emphasis?94:84,Math.floor(950/Math.max(1,units)));
      const estimatedBottom=layout.captionCenter[1]+lines.length*size*.65+9;
      if(estimatedBottom>=layout.captionMaxBottom||layout.captionMaxBottom>=layout.video.y)throw Error('Caption intrudes into the protected footage rectangle');
      const a=cursor+(sub.start-cut.start)/cut.speed,b=Math.min(cursor+cut.duration,cursor+(sub.end-cut.start)/cut.speed);
      ass+=event(a,b,'Main',`{\\an5\\pos(540,264)\\fs${size}\\c${color(sub.color||'#FFFFFF')}}`+clean(sub.text));
    }
    if(mode==='render'){
      const video=`setpts=(PTS-STARTPTS)/${cut.speed},fps=30,scale=810:1440:flags=lanczos,setsar=1,pad=1080:1920:134:432:color=black,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=${cut.duration},setpts=PTS-STARTPTS`;
      await run(FF,['-hide_banner','-y','-ss',String(cut.start),'-t',String(cut.end-cut.start),'-i',native(plan.sourceVideo),'-map','0:v:0','-an','-vf',video,'-frames:v',String(cut.frames),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','6',native(path.join(root,prefix+'.mkv'))],prefix+'-video.log');
      console.log(JSON.stringify({clip:clip.id,run:i+1,total:groups.length,duration:cut.duration,paddedSamples:cut.audioEvidence.tailPaddingSamples}));
    }
    cursor+=cut.duration;
  }
  const title=String(clip.title).split('\n')[0];
  ass+=event(0,cursor,'Title','{\\pos(540,70)}'+clean(title));
  const assFile=`${clip.id}/captions.ass`;fs.writeFileSync(path.join(root,assFile),ass);
  if(mode==='render'||!saved?.groups?.every(x=>x.audioEvidence))fs.writeFileSync(path.join(dir,'edit.json'),JSON.stringify({audioCutMode:AUDIO_MODE,planSha,rendererSha,layout,title,duration:cursor,groups},null,2));
  if(mode==='preview'){
    // This branch never opens or references the character-containing source.
    await preview(clip.id,cursor);continue;
  }
  const sum=path.join(dir,'voice-continuous.wav');writeFloatWave(sum,Buffer.concat(audioParts));
  const level=await run(FF,['-hide_banner','-i',native(sum),'-vn','-af','loudnorm=I=-16:TP=-2.5:LRA=9:print_format=json','-f','null','-'],`${clip.id}/voice-level.log`);
  const measurement=JSON.parse(level.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
  const gainDb=Math.min(-16-Number(measurement.input_i),-2.5-Number(measurement.input_tp));
  if(!Number.isFinite(gainDb))throw Error('Invalid measured voice gain');
  fs.writeFileSync(path.join(dir,'voice-gain.json'),JSON.stringify({measurement,gainDb,staticGain:true,dynamicNormalization:false},null,2));
  fs.writeFileSync(path.join(dir,'concat.txt'),groups.map((_,i)=>`file 'run-${String(i).padStart(2,'0')}.mkv'`).join('\n')+'\n');
  const output=path.join(root,clip.filename);
  await run(FF,['-hide_banner','-y','-f','concat','-safe','0','-i',native(path.join(dir,'concat.txt')),'-i',native(sum),'-map','0:v:0','-map','1:a:0','-vf',`ass=filename='${assFile}':fontsdir='fonts'`,'-af',`volume=${gainDb}dB:precision=double`,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','6','-c:a','aac','-b:a','192k','-ar','48000','-t',String(cursor),'-movflags','+faststart',native(output)],`${clip.id}/final.log`);
  fs.writeFileSync(path.join(dir,'final-probe.json'),await run(FP,['-v','error','-show_format','-show_streams','-of','json',native(output)]));
  if(plan.bgm){
    const bgmOutput=output.replace(/_音声のみ\.mp4$/,'_BGMあり.mp4');if(bgmOutput===output)throw Error('Expected _音声のみ.mp4 filename');
    const mix=`[1:a]loudnorm=I=-30:TP=-9:LRA=7,afade=t=in:d=0.35,afade=t=out:st=${Math.max(0,cursor-.6)}:d=0.6[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.79:level=false:latency=1[a]`;
    await run(FF,['-hide_banner','-y','-i',native(output),'-stream_loop','-1','-i',native(plan.bgm),'-filter_complex',mix,'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(cursor),'-movflags','+faststart',native(bgmOutput)],`${clip.id}/bgm.log`);
  }
  console.log(JSON.stringify({clip:clip.id,complete:true,duration:cursor,runs:groups.length}));
}
