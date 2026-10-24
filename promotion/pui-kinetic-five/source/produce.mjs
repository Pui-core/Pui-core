import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {stories,cuts} from './stories.mjs';
import {composition} from './motion.mjs';
export const root=path.resolve(process.env.PUI_KINETIC_ROOT||fileURLToPath(new URL('..',import.meta.url)));
export const EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe',FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
export const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
export const np=p=>{const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
export const file=p=>path.join(root,p),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const parse=s=>JSON.parse(s.replace(/^\uFEFF/,'').trim());
for(const d of ['media','projects','videos','qa','source','checkpoints'])fs.mkdirSync(file(d),{recursive:true});
export function save(p,v){fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),JSON.stringify(v,null,2)+'\n');}
export function call(exe,args,receipt,input){const attempts=[];for(let attempt=0;attempt<3;attempt++){const r=spawnSync(exe,args,{encoding:'utf8',input,timeout:180000,maxBuffer:32*1024*1024});const v={exit:r.status,error:r.error?.message,stdout:r.stdout?.replace(/^\uFEFF/,''),stderr:r.stderr};attempts.push(v);if(receipt)save(receipt,{...v,attempts});if(!r.error&&r.status===0)return v.stdout.trim();if(/UtilAcceptVsock.*accept4 failed/.test(r.stderr||'')&&attempt<2){spawnSync('sleep',['2']);continue;}throw Error(JSON.stringify({exe,args,...v}).slice(-7000));}throw Error('Native launch attempts exhausted');}
export const run=(exe,args,receipt)=>new Promise((resolve,reject)=>{const st=Date.now(),p=spawn(exe,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='',error;p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('error',e=>error=e.message);p.on('close',exit=>{const r={exit,seconds:(Date.now()-st)/1000,error,stdout:stdout.replace(/^\uFEFF/,''),stderr};if(receipt)save(receipt,r);if(error||exit!==0)reject(Error(JSON.stringify({exe,args,...r}).slice(-6500)));else resolve(r);});});
export const stem=e=>String(e.id).padStart(2,'0')+'-'+e.slug;
export function prepare(e){
 const id=stem(e),qa='qa/'+id;fs.mkdirSync(file(qa),{recursive:true});
 if(fs.existsSync(file('projects/'+id+'.ecproj'))){const dest=file('checkpoints/'+id+'-'+Date.now());fs.mkdirSync(dest,{recursive:true});for(const ext of ['ecproj','fcproj'])if(fs.existsSync(file('projects/'+id+'.'+ext)))fs.copyFileSync(file('projects/'+id+'.'+ext),path.join(dest,id+'.'+ext));}
 fs.writeFileSync(file('source/'+id+'.jsx'),composition(root,e));
 const r=parse(call(EC,['--empty','script',np(file('source/'+id+'.jsx')),'--save-as',np(file('projects/'+id+'.ecproj')),'--json'],qa+'/build.json'));
 if(!r.ok||r.error)throw Error(JSON.stringify(r));const v=parse(r.output);if(v.scenes!==24||v.boxes.length<50)throw Error('Incomplete composition');
 save(qa+'/layout-and-motion.json',v);save(qa+'/checkpoint.json',{saved:true,sha256:hash(file('projects/'+id+'.ecproj')),scenes:v.scenes,story:e});
 console.log('Prepared '+id+' '+v.boxes.length+' text layers / '+v.motionLedger.length+' motion records');
}
export async function preview(e,time=1.4){const id=stem(e);await run(EC,['render-frame','--project',np(file('projects/'+id+'.ecproj')),'--comp','Pui Kinetic '+e.id,'--time',String(time),'--out',np(file('qa/'+id+'/preview-'+String(time).replace('.','_')+'.png')),'--json'],'qa/'+id+'/preview-'+time+'.json');}
export async function picture(e){
 const id=stem(e),q='qa/'+id,ec=file('projects/'+id+'.ecproj'),master=file('media/'+id+'-master.mp4');if(!fs.existsSync(ec))prepare(e);
 let old;try{old=parse(fs.readFileSync(file(q+'/picture.json'),'utf8'));}catch{}
 if(old?.ecSha256===hash(ec)&&fs.existsSync(master)&&old.sha256===hash(master)){console.log('Picture cache checked '+id);return;}
 const expectedProjectSha256=hash(ec);
 await run(EC,['render','--project',np(ec),'--comp','Pui Kinetic '+e.id,'--out',np(master),'--format','h264','--bitrate','13000','--audio','off','--progress','--json'],q+'/effectcraft-render.json');
 if(hash(ec)!==expectedProjectSha256)throw Error('Project changed while rendering; regenerate picture.');
 save(q+'/picture.json',{ecSha256:expectedProjectSha256,sha256:hash(master)});console.log('Picture rendered '+id);
}
export async function render(e){
 const id=stem(e),q='qa/'+id,ec=file('projects/'+id+'.ecproj'),fc=file('projects/'+id+'.fcproj'),master=file('media/'+id+'-master.mp4');
 await picture(e);
 const audio=file('media/mix-'+String(e.id).padStart(2,'0')+'.wav');if(!fs.existsSync(audio))throw Error('Narration/music mix is missing: '+audio);
 const commands=[{id:'file.newProject',params:{name:'Pui Kinetic '+e.id}},{id:'file.newSequence',params:{name:'Pui Kinetic '+e.id,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(master),np(audio)]}}];
 const init=call(FC,['--save-as',np(fc),'run','-'],q+'/filmcraft-build.json',commands.map(v=>JSON.stringify(v)).join('\n')+'\n');let items;
 for(const l of init.split(/\r?\n/).filter(Boolean)){const r=parse(l);if(r.ok===false)throw Error(l);if(r.result?.items)items=r.result.items;}
 if(items?.length!==2)throw Error('No imported native IDs');
 const place=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:64*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:64*254016000000,video:false,audio:true}}];
 call(FC,['--project',np(fc),'--save','run','-'],q+'/filmcraft-place.json',place.map(v=>JSON.stringify(v)).join('\n')+'\n');
 const out=file('videos/'+id+'.mp4'),r=await run(FC,['--project',np(fc),'exec','file.exportMedia',JSON.stringify({path:np(out),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:18,hardwareEncoding:'off',gpuRendering:'off',wait:true})],q+'/filmcraft-export.json');
 if(parse(r.stdout).offlineMedia?.length)throw Error('Offline export');save(q+'/rendered.json',{sha256:hash(out),bytes:fs.statSync(out).size,duration:64,fps:30,frames:1920,ecSha256:hash(ec),fcSha256:hash(fc)});console.log('Rendered '+id);
}
export async function verify(e){
 const id=stem(e),q='qa/'+id,out=file('videos/'+id+'.mp4');const p=parse(call(FP,['-v','error','-count_frames','-show_streams','-show_format','-of','json',np(out)],q+'/probe-command.json'));save(q+'/ffprobe.json',p);
 const v=p.streams.find(v=>v.codec_type==='video'),a=p.streams.find(v=>v.codec_type==='audio');if(v?.width!==1080||v?.height!==1920||v?.r_frame_rate!=='30/1'||v?.codec_name!=='h264'||Number(v.nb_read_frames)!==1920||a?.codec_name!=='aac'||Number(a.sample_rate)!==48000||Number(a.channels)!==2||Math.abs(Number(p.format.duration)-64)>.1)throw Error('Media format validation failed');
 await run(FF,['-v','error','-i',np(out),'-f','null','-'],q+'/full-decode.json');
 const m=await run(FF,['-hide_banner','-i',np(out),'-af','ebur128=peak=true','-f','null','-'],q+'/final-audio.json');const I=Number([...m.stderr.matchAll(/\bI:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS/g)].at(-1)?.[1]),TP=Number([...m.stderr.matchAll(/Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)].at(-1)?.[1]);if(!Number.isFinite(I)||I < -18||I > -12||!Number.isFinite(TP)||TP>-.5)throw Error('Audio level outside delivery target '+I+' '+TP);
 const frames=cuts.slice(0,-1).map((t,i)=>Math.round(Math.min(t+.5,cuts[i+1]-.12)*30));
 await run(FF,['-v','error','-y','-i',np(out),'-vf',"select='"+frames.map(n=>'eq(n,'+n+')').join('+')+"',scale=270:480,tile=6x4:padding=6:margin=6:color=0x12182A",'-frames:v','1',np(file(q+'/contact-all-scenes.jpg'))],q+'/contact.json');
 const layout=parse(fs.readFileSync(file(q+'/layout-and-motion.json'),'utf8')),track=layout.motionLedger.find(v=>v.kind==='tracked-target');
 const ranges=[{name:'opening',start:0,frames:12},{name:'drop',start:6.13,frames:12},{name:'tracking',start:Math.max(0,track.time-.30),frames:18},{name:'payoff',start:44.57,frames:12}];
 for(const r of ranges)await run(FF,['-v','error','-y','-ss',String(r.start),'-i',np(out),'-vf','scale=216:384,tile=6x'+Math.ceil(r.frames/6)+':padding=4:margin=4:color=0x12182A','-frames:v','1',np(file(q+'/continuous-'+r.name+'.jpg'))],q+'/continuous-'+r.name+'.json');
 await run(FF,['-v','error','-y','-ss','1.5','-i',np(out),'-frames:v','1',np(file('videos/'+id+'-cover.jpg'))],q+'/cover.json');
 save(q+'/technical.json',{status:'TECHNICAL_PASS',frames:1920,width:1080,height:1920,fps:30,duration:64,fullDecode:true,finalAudio:{integratedLufs:I,truePeakDbfs:TP},allSceneFrames:frames,continuousFrameRanges:ranges,visualReview:'PENDING',realTimeWholeWatchAndAudition:'NOT_PERFORMED',ownerCreativeAcceptance:'NOT_RECEIVED',monetizationEligibility:'PLATFORM_REVIEW_NOT_TESTED',sha256:hash(out)});console.log('Verified '+id+' '+I+' LUFS / '+TP+' dBTP');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2],ids=process.argv.slice(3).filter(v=>!v.startsWith('--')).map(Number),list=ids.length?stories.filter(e=>ids.includes(e.id)):stories;
 for(const e of list){if(mode==='prepare')prepare(e);else if(mode==='preview')await preview(e);else if(mode==='picture')await picture(e);else if(mode==='render')await render(e);else if(mode==='verify')await verify(e);else throw Error('Use prepare|preview|picture|render|verify [1..5]');}
}
