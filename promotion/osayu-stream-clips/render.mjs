/** Local stream edits. Video/character frames are never sent to an AI service. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const [planFile, rootArg, mode = 'render'] = process.argv.slice(2);
if (!planFile || !rootArg) throw Error('Usage: node render.mjs private-plan.json output-root [render|preview]');
const root = path.resolve(rootArg);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const ffmpeg = process.env.FFMPEG || '/mnt/f/ffmpeg/bin/ffmpeg.exe';
const ffprobe = process.env.FFPROBE || '/mnt/f/ffmpeg/bin/ffprobe.exe';
const win = p => ffmpeg.endsWith('.exe') ? execFileSync('wslpath', ['-w', path.resolve(p)], {encoding:'utf8'}).trim() : path.resolve(p);
const fps = 30;
fs.mkdirSync(root, {recursive:true});
fs.mkdirSync(path.join(root,'fonts'),{recursive:true});
if (process.platform!=='win32' && fs.existsSync('/mnt/c/Windows/Fonts/YuGothB.ttc') && !fs.existsSync(path.join(root,'fonts/YuGothB.ttc'))) fs.copyFileSync('/mnt/c/Windows/Fonts/YuGothB.ttc',path.join(root,'fonts/YuGothB.ttc'));
const run = (exe, args, log) => new Promise((resolve,reject) => {
  const p = spawn(exe,args,{cwd:root,windowsHide:true});
  let output='';
  for (const stream of [p.stdout,p.stderr]) stream.on('data', d => output += d.toString());
  p.on('error',reject);
  p.on('close',code => {
    if (log) fs.writeFileSync(path.join(root,log),output);
    if (code) reject(Error(`${path.basename(exe)} exit ${code}: ${output.slice(-2200)}`));
    else resolve(output);
  });
});
const time = t => {
  const n = Math.round(t*100);
  return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;
};
const clean = s => String(s).replace(/[{}\\]/g,'').replace(/\n/g,'\\N');
const assColor = hex => '&H00'+hex.replace('#','').match(/../g).reverse().join('');
const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Yu Gothic,76,&H00FFFFFF,&H00FFFFFF,&H000C1020,&H80000000,-1,0,0,0,100,100,1,0,1,7,3,5,96,160,0,1
Style: Title,Yu Gothic,68,&H00FFFFFF,&H00FFFFFF,&H000C1020,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,5,90,150,0,1
Style: Small,Yu Gothic,30,&H00DCEAE9,&H00FFFFFF,&H000C1020,&H80000000,-1,0,0,0,100,100,2,0,1,1,0,5,90,160,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
const event = (layer,a,b,style,text) => `Dialogue: ${layer},${time(a)},${time(b)},${style},,0,0,0,,${text}\n`;

for (const clip of plan.clips) {
  if (process.env.CLIP && process.env.CLIP!==clip.id) continue;
  if (!/^[a-z0-9-]+$/.test(clip.id)) throw Error('Unsafe clip id');
  const folder = path.join(root,clip.id);
  fs.mkdirSync(folder,{recursive:true});
  let cursor=0;
  let ass=header;
  const cuts=[];
  for (const [i,cut] of clip.cuts.entries()) {
    if (!(cut.end>cut.start && cut.speed>=1.15 && cut.speed<=1.25)) throw Error('Invalid edit bounds/speed');
    const frames=Math.round((cut.end-cut.start)/cut.speed*fps);
    const duration=frames/fps;
    const file=`${clip.id}/part-${String(i).padStart(2,'0')}.mkv`;
    for (const sub of cut.captions || []) {
      if (!(sub.start>=cut.start-.01 && sub.end<=cut.end+.01 && sub.end>sub.start)) throw Error('Caption outside cut');
      const a=cursor+(sub.start-cut.start)/cut.speed;
      const b=Math.min(cursor+duration,cursor+(sub.end-cut.start)/cut.speed);
      const maxLine=Math.max(...String(sub.text).split('\n').map(x=>[...x].reduce((n,c)=>n+(c.charCodeAt(0)<128?.55:1),0)));
      const size=Math.min(sub.emphasis?92:76,Math.floor(800/Math.max(1,maxLine)));
      const color=assColor(sub.color || (sub.emphasis?'#A8F3E0':'#FFFFFF'));
      const pos=sub.y || 1390;
      const tags=`{\\an5\\pos(490,${pos})\\fs${size}\\c${color}\\fscx108\\fscy108\\t(0,100,\\fscx100\\fscy100)\\fad(25,35)}`;
      ass+=event(3,a,b,'Main',tags+clean(sub.text));
      if (sub.speaker) ass+=event(3,a,b,'Small',`{\\pos(490,${pos-112})\\fs30\\c${assColor(sub.speaker==='おさゆ'?'#A8F3E0':'#FF95D2')}}`+clean(sub.speaker));
    }
    cuts.push({...cut,frames,duration,outputStart:cursor,file});
    cursor+=duration;
  }
  ass+=event(1,0,cursor,'Small','{\\pos(490,70)\\c&H00E0F3A8&}OSAYU / STREAM CLIP');
  ass+=event(1,0,cursor,'Title','{\\pos(490,192)}'+clean(clip.title));
  ass+=event(1,0,cursor,'Small','{\\pos(490,1738)}おさゆ  @oosayuuu2525');
  const assFile=`${clip.id}/captions.ass`;
  fs.writeFileSync(path.join(root,assFile),ass);
  fs.writeFileSync(path.join(folder,'edit.json'),JSON.stringify({title:clip.title,duration:cursor,cuts},null,2));
  if (mode==='preview') {
    // No footage is opened, imported, or referenced by this branch.
    const filter=`drawbox=x=54:y=350:w=972:h=860:color=0x24323E:t=fill,drawbox=x=54:y=350:w=972:h=860:color=0xA8F3E0:t=3,ass=filename='${assFile}':fontsdir='fonts'`;
    await run(ffmpeg,['-hide_banner','-y','-f','lavfi','-i',`color=c=0x0C1020:s=1080x1920:r=30:d=${cursor}`,'-vf',filter,'-an','-c:v','libx264','-preset','veryfast','-crf','22',win(path.join(folder,'no-footage-preview.mp4'))],`${clip.id}/preview.log`);
    console.log(JSON.stringify({clip:clip.id,mode,duration:cursor}));
    continue;
  }
  for (const [i,cut] of cuts.entries()) {
    const d=cut.end-cut.start;
    const signature=createHash('sha256').update(JSON.stringify({source:plan.sourceVideo,audio:plan.alignedAudio,start:cut.start,end:cut.end,speed:cut.speed,frames:cut.frames,version:1})).digest('hex');
    const sigFile=path.join(root,cut.file+'.sha256');
    if (fs.existsSync(path.join(root,cut.file)) && fs.existsSync(sigFile) && fs.readFileSync(sigFile,'utf8')===signature) continue;
    // Source footage retains its whole 9:16 frame. Only standard resizing is used.
    const vf=`setpts=(PTS-STARTPTS)/${cut.speed},fps=${fps},scale=1080:1920:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=${cut.duration},setpts=PTS-STARTPTS`;
    const af=`asetpts=PTS-STARTPTS,rubberband=tempo=${cut.speed}:pitch=1:formant=preserved:channels=together,apad,atrim=duration=${cut.duration},afade=t=in:d=0.003,afade=t=out:st=${Math.max(0,cut.duration-.004)}:d=0.004`;
    await run(ffmpeg,['-hide_banner','-y','-ss',String(cut.start),'-t',String(d),'-i',win(plan.sourceVideo),'-ss',String(cut.start),'-t',String(d),'-i',win(plan.alignedAudio),'-map','0:v:0','-map','1:a:0','-vf',vf,'-af',af,'-frames:v',String(cut.frames),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','6','-c:a','pcm_s16le','-ar','48000',win(path.join(root,cut.file))],`${clip.id}/part-${i}.log`);
    fs.writeFileSync(sigFile,signature);
    console.log(JSON.stringify({clip:clip.id,part:i+1,total:cuts.length,duration:cut.duration}));
  }
  const list=cuts.map(x=>`file '${path.basename(x.file)}'`).join('\n')+'\n';
  fs.writeFileSync(path.join(folder,'concat.txt'),list);
  const concatArgs=['-f','concat','-safe','0','-i',win(path.join(folder,'concat.txt'))];
  const loudLog=await run(ffmpeg,['-hide_banner',...concatArgs,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-'],`${clip.id}/loudness-pass1.log`);
  const m=loudLog.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!m) throw Error('Loudness measurement missing');
  const measured=JSON.parse(m[0]);
  const loud=`loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true:print_format=json`;
  const bands='drawbox=x=0:y=0:w=iw:h=320:color=0x0C1020@0.92:t=fill,drawbox=x=54:y=327:w=972:h=5:color=0xA8F3E0@0.95:t=fill,drawbox=x=0:y=1250:w=iw:h=325:color=0x0C1020@0.50:t=fill,drawbox=x=0:y=1690:w=iw:h=230:color=0x0C1020@0.92:t=fill';
  const output=path.join(root,clip.filename);
  await run(ffmpeg,['-hide_banner','-y',...concatArgs,'-vf',`${bands},ass=filename='${assFile}':fontsdir='fonts'`,'-af',loud,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','6','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',win(output)],`${clip.id}/final.log`);
  const probe=await run(ffprobe,['-v','error','-show_format','-show_streams','-of','json',win(output)]);
  fs.writeFileSync(path.join(folder,'final-probe.json'),probe);
  if (plan.bgm) {
    const bgmOut=output.replace(/_音声のみ\.mp4$/,'_BGMあり.mp4');
    if (bgmOut===output) throw Error('Voice output filename must end in _音声のみ.mp4');
    const mix=`[1:a]loudnorm=I=-30:TP=-9:LRA=7,afade=t=in:d=0.35,afade=t=out:st=${Math.max(0,cursor-.6)}:d=0.6[music];[0:a][music]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.79:level=false:latency=1[a]`;
    await run(ffmpeg,['-hide_banner','-y','-i',win(output),'-stream_loop','-1','-i',win(plan.bgm),'-filter_complex',mix,'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',String(cursor),'-movflags','+faststart',win(bgmOut)],`${clip.id}/bgm-mix.log`);
  }
  console.log(JSON.stringify({clip:clip.id,complete:true,duration:cursor,output}));
}
