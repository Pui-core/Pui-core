/** Revise captions using validated, subtitle-free video and unchanged AAC. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildCaptions,layout} from './captions.mjs';
const [planFile,baseArg,outArg,mode='render']=process.argv.slice(2);
if(!planFile||!baseArg||!outArg||!['render','preview'].includes(mode))throw Error('Usage: node restyle.mjs plan.json previous-revision output [render|preview]');
const plan=JSON.parse(fs.readFileSync(planFile)),base=path.resolve(baseArg),out=path.resolve(outArg);
const digest=x=>createHash('sha256').update(x).digest('hex');
if('alignedAudio'in plan||plan.audioCutMode!=='direct-container-seek-continuous-samples')throw Error('Padded alignedAudio is forbidden for finished voice');
const previousPlan=JSON.parse(fs.readFileSync(path.join(base,'private-plan.json')));
if(plan.basePlanSha!==digest(JSON.stringify(previousPlan)))throw Error('Previous revision plan hash mismatch');
const FF=process.env.FFMPEG||'/mnt/f/ffmpeg/bin/ffmpeg.exe';
const native=p=>FF.endsWith('.exe')?execFileSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'}).trim():path.resolve(p);
const run=(args,log)=>new Promise((resolve,reject)=>{const c=spawn(FF,args,{cwd:out,windowsHide:true});let s='';for(const stream of [c.stdout,c.stderr])stream.on('data',x=>s+=x);c.on('error',reject);c.on('close',code=>{fs.writeFileSync(log,s);code?reject(Error(s.slice(-2000))):resolve(s);});});
const signature=clip=>JSON.stringify(clip.cuts.map(c=>({start:c.start,end:c.end,speed:c.speed})));
// Validate all inputs before creating outputs; captions cannot change the audio edit.
const jobs=plan.clips.map(clip=>{
  if(!/^[a-z0-9-]+$/.test(clip.id)||path.basename(clip.filename)!==clip.filename||!clip.filename.endsWith('_音声のみ.mp4'))throw Error('Unsafe clip/output name');
  const old=previousPlan.clips.find(c=>c.id===clip.id);
  if(!old||signature(clip)!==signature(old))throw Error('Caption-only revision cannot alter source intervals or speed');
  const edit=JSON.parse(fs.readFileSync(path.join(base,'render',clip.id,'edit.json')));
  if(edit.planSha!==plan.basePlanSha||JSON.stringify(edit.layout.video)!==JSON.stringify(layout.video)||!edit.groups.every(g=>g.audioEvidence))throw Error('Previous validated edit/evidence mismatch');
  return {clip,old,edit,...buildCaptions(clip,edit,plan.fonts)};
});
fs.mkdirSync(path.join(out,'fonts'),{recursive:true});
for(const [role,font]of Object.entries(plan.fonts)){
  if(!font.sha256||digest(fs.readFileSync(font.path))!==font.sha256)throw Error('Font hash mismatch');
  const target=path.join(out,'fonts',role+path.extname(font.path));
  if(fs.existsSync(target)){if(digest(fs.readFileSync(target))!==font.sha256)throw Error('Stale output font; choose a new revision instead of silently substituting');}
  else fs.copyFileSync(font.path,target);
}
for(const job of jobs){
  const {clip,old,edit,ass,audit}=job;if(process.env.CLIP&&process.env.CLIP!==clip.id)continue;
  const dir=path.join(out,clip.id);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'captions.ass'),ass);
  const revision={basePlanSha:plan.basePlanSha,planSha:digest(JSON.stringify(plan)),captionRendererSha:digest(fs.readFileSync(new URL('./captions.mjs',import.meta.url))),restyleRendererSha:digest(fs.readFileSync(new URL(import.meta.url))),assSha:digest(ass),layout,audioReencoded:false,editorialSpeakerLanes:true,sourceScreenSidesVerified:false};
  fs.writeFileSync(path.join(dir,'caption-audit.json'),JSON.stringify({...revision,captions:audit},null,2));
  const assFilter=`ass=filename='${clip.id}/captions.ass':fontsdir='fonts'`;
  if(mode==='preview'){
    // Do not open a source/finished video, even as a hidden layer.
    await run(['-hide_banner','-y','-f','lavfi','-i',`color=c=black:s=1080x1920:r=30:d=${edit.duration}`,'-vf',`drawbox=x=134:y=432:w=810:h=1440:color=0x25313b:t=fill,${assFilter}`,'-an','-c:v','libx264','-preset','veryfast','-crf','20',native(path.join(dir,'no-footage-preview.mp4'))],path.join(dir,'preview.log'));
    console.log(JSON.stringify({id:clip.id,preview:true,captions:audit.length}));continue;
  }
  const list=edit.groups.map((_,i)=>`file '${native(path.join(base,'render',clip.id,`run-${String(i).padStart(2,'0')}.mkv`)).replaceAll('\\','/')}'`).join('\n')+'\n';
  fs.writeFileSync(path.join(dir,'concat.txt'),list);
  const video=path.join(dir,'restyled-video.mp4');
  await run(['-hide_banner','-y','-f','concat','-safe','0','-i',native(path.join(dir,'concat.txt')),'-map','0:v:0','-an','-vf',assFilter,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','6','-t',String(edit.duration),native(video)],path.join(dir,'video.log'));
  for(const suffix of ['音声のみ','BGMあり']){
    const previous=path.join(base,'render',old.filename.replace('音声のみ',suffix));
    const target=path.join(out,clip.filename.replace('音声のみ',suffix));
    await run(['-hide_banner','-y','-i',native(video),'-i',native(previous),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',native(target)],path.join(dir,suffix+'-mux.log'));
  }
  fs.writeFileSync(path.join(dir,'render-receipt.json'),JSON.stringify({...revision,outputs:['音声のみ','BGMあり'].map(suffix=>{const filename=clip.filename.replace('音声のみ',suffix);return{filename,sha256:digest(fs.readFileSync(path.join(out,filename)))};})},null,2));
  console.log(JSON.stringify({id:clip.id,complete:true,duration:edit.duration,captions:audit.length,audio:'stream-copy'}));
}
