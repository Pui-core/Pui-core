import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

export const stage=process.env.PROJECTP145_STAGE||'/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/background-bgm-20261029';
export const v10='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/model-motion-20261029';
export const v9='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-05-real-round';
export const tools='/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0';
export const file=p=>path.join(stage,p);
export const save=(p,j)=>{fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),JSON.stringify(j,null,2)+'\n');};
export async function hash(p){const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(p))h.update(b);return h.digest('hex');}
export async function run(name,args,receipt){return new Promise((resolve,reject)=>{
 const exe=path.join(tools,'bin',name),cmd=['-n','10','ionice','-c','3',exe,...args];
 const p=spawn('/usr/bin/nice',cmd,{stdio:['ignore','pipe','pipe'],env:{...process.env,LD_LIBRARY_PATH:path.join(tools,'lib')}});let stdout='',stderr='';
 const started=new Date().toISOString();console.log(JSON.stringify({process:name,pid:p.pid,started,threads:2,nice:10,ioPriority:'idle',windowsExe:false}));
 const timer=setTimeout(()=>p.kill('SIGTERM'),180000);
 p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('close',code=>{clearTimeout(timer);const r={exe,args,pid:p.pid,started,ended:new Date().toISOString(),exit:code,stdout,stderr};if(receipt)save('qa/'+receipt,r);if(code!==0)reject(Error(name+' exit '+code+': '+stderr.slice(-1600)));else resolve(r);});
});}
export const ff=args=>['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-filter_complex_threads','2',...args];
export async function makeMusic(){
 await run('ffmpeg',ff(['-i',file('media/musicbed-v9-retained.wav'),'-af','volume=2','-ar','48000','-c:a','pcm_s24le',file('media/cipher-bed-premix-v11.wav')]),'musicbed-premix.json');
 for(const [name,src]of [['duck-voice','narration-real-v9.wav'],['duck-premix','cipher-bed-premix-v11.wav']])await run('ffmpeg',ff(['-i',file('media/'+src),'-ar','48000','-ac','2','-f','f32le',file('qa/'+name+'.f32')]),name+'.json');
 const f32=p=>{const b=fs.readFileSync(file(p));return new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);},voice=f32('qa/duck-voice.f32'),music=f32('qa/duck-premix.f32');
 const rms=(a,s,e)=>{let q=0,n=0;for(let i=Math.round(s*96000);i<Math.round(e*96000);i++){q+=a[i]**2;n++;}return Math.sqrt(q/n);};
 const cues=JSON.parse(fs.readFileSync(v10+'/qa/audio-acceptance.json','utf8')).sourceCues.map(c=>{const gap=20*Math.log10(rms(voice,c.firstVoiced,c.lastVoiced)/rms(music,c.firstVoiced,c.lastVoiced)),gain=Math.min(1,10**((gap-12.5)/20));return {id:c.id,firstVoiced:c.firstVoiced,lastVoiced:c.lastVoiced,gapBeforeDb:gap,gain,duckDb:20*Math.log10(gain),start:Math.max(0,c.firstVoiced-.10),attack:.08,holdUntil:c.lastVoiced+.04,release:.18};});
 const envelopes=cues.filter(c=>c.gain<1).map(c=>{const s=c.start,a=c.attack,e=c.holdUntil,r=c.release,g=c.gain;return `if(lt(t,${s}),1,if(lt(t,${s+a}),1-(1-${g})*(t-${s})/${a},if(lt(t,${e}),${g},if(lt(t,${e+r}),${g}+(1-${g})*(t-${e})/${r},1))))`;});
 await run('ffmpeg',ff(['-i',file('media/cipher-bed-premix-v11.wav'),'-af',`volume='${envelopes.join('*')}':eval=frame:precision=double`,'-ar','48000','-c:a','pcm_s24le',file('media/cipher-bed-v11.wav')]),'phrase-duck-render.json');
 save('qa/phrase-duck-plan.json',{targetVoiceOverMusicDb:12.5,cues,changesMusicOnly:true,voiceGain:1,sfxGain:1,sourceTimingUnchanged:true,reason:'First-pass title voice/music gap 0.54dB required BGM attenuation in voiced spans; no increase or fade of original voice/SE'});
}
const expected={
 'accepted-v10.mp4':'e683ad00bad973a09456fd49895f8eddcde884be9c37f2ae5dca8bbaa4935592',
 'narration-real-v9.wav':'a8052a999efb483db9c2209f559b315907ed2f460b227839d1f6b4f996f4adcf',
 'sfx-real-v9.wav':'1e352d7fcc2ad9b59a99017b400c70152ae12b15ef7e7cb41e9fe53e7af9b68e',
 'cipher-source.mp3':'d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522',
 'truthorlie-real-v10-picture.mov':'ad635bba0c9863a20fe007197207d01976d6b9ba74908266b5072ce9547d4cc2'
};
export async function produce(){
 for(const d of ['source','media','projects','videos','qa','qa/pcm','metadata'])fs.mkdirSync(file(d),{recursive:true});
 const lock=file('qa/production-job.json');const h=fs.openSync(lock,'wx');fs.writeFileSync(h,JSON.stringify({issue:145,pid:process.pid,started:new Date().toISOString(),status:'running'}));fs.closeSync(h);
 const inputs=[['accepted-v10.mp4',v10+'/videos/truthorlie-real-v10-voice.mp4'],['narration-real-v9.wav',v10+'/media/narration-real-v9.wav'],['sfx-real-v9.wav',v10+'/media/sfx-real-v9.wav'],['cipher-source.mp3',v9+'/media/cipher-source.mp3'],['musicbed-v9-retained.wav',v9+'/media/musicbed-real-v9.wav'],['truthorlie-real-v10-picture.mov',v10+'/media/truthorlie-real-v10-picture.mov']];
 const binding=[];
 for(const [name,src] of inputs){const before=await hash(src);if(expected[name]&&expected[name]!==before)throw Error('Input binding changed: '+name);const target=file('media/'+name);if(fs.existsSync(target))throw Error('New stage dependency already exists: '+name);fs.copyFileSync(src,target);if(await hash(target)!==before)throw Error('Copy mismatch');binding.push({file:name,source:src,sha256:before,bytes:fs.statSync(target).size});}
 save('qa/input-bindings.json',{issue:145,inputs:binding,sourceFilesChanged:false,videoFrames:576,duration:19.2});
 await makeMusic();
 await run('ffmpeg',ff(['-i',file('media/narration-real-v9.wav'),'-i',file('media/sfx-real-v9.wav'),'-i',file('media/cipher-bed-v11.wav'),'-filter_complex','[0:a][1:a][2:a]amix=inputs=3:normalize=0:duration=longest,apad,atrim=duration=19.2[out]','-map','[out]','-ar','48000','-c:a','pcm_s24le',file('media/mix-v11.wav')]),'pcm-mix.json');
 await run('ffmpeg',ff(['-i',file('media/accepted-v10.mp4'),'-i',file('media/mix-v11.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart','-metadata','comment=Cipher — Kevin MacLeod (incompetech.com), CC BY 4.0. Excerpt, level, ducking and fade edits. Background BGM confirmation v11; not TikTok native sound selection.',file('videos/truthorlie-v11-bgm.mp4')]),'packet-copy-export.json');
 // Offline-only preparation from the known schema15 original. No native app is launched.
 const project=JSON.parse(fs.readFileSync(v10+'/projects/truthorlie-real-v10-voice.fcproj','utf8'));
 const old=JSON.parse(fs.readFileSync(v9+'/projects/truthorlie-real-v9-bgm.fcproj','utf8'));
 if(project.format!=='filmcraft.project'||project.schema_version!==15||project.project.next_id!==11)throw Error('Known native project schema changed');
 const seq=project.project.items['4'].kind.Sequence,oldSeq=old.project.items['5'].kind.Sequence;
 if(seq.audio_tracks.length!==2||oldSeq.audio_tracks.length!==3||seq.video_tracks[0].items[0].duration!==4877107200000)throw Error('Known timeline changed');
 for(const item of Object.values(project.project.items)){const m=item.kind.Media;if(m){const p=m.media.File.path;const name=p.split(/[\\/]/).at(-1);if(!['truthorlie-real-v10-picture.mov','narration-real-v9.wav','sfx-real-v9.wav'].includes(name))throw Error('Unexpected native dependency');m.media.File.path='F:'+file('media/'+name).slice('/mnt/f'.length).replaceAll('/','\\');}}
 const music=structuredClone(old.project.items['9']);music.id=11;music.created=11;music.name='cipher-bed-v11.wav';music.kind.Media.media.File.path='F:'+file('media/cipher-bed-v11.wav').slice('/mnt/f'.length).replaceAll('/','\\');music.kind.Media.info.name='cipher-bed-v11.wav';music.kind.Media.info.file_size=fs.statSync(file('media/cipher-bed-v11.wav')).size;music.kind.Media.identity=null;
 project.project.items['11']=music;project.project.root.children.push({Item:11});
 const track=structuredClone(oldSeq.audio_tracks[2]);track.id=12;track.name='Cipher BGM v11';track.items[0].id=13;track.items[0].item=11;track.items[0].name='cipher-bed-v11.wav';seq.audio_tracks.push(track);
 project.project.next_id=14;project.project.name='truthorlie-v11-bgm-offline';project.project.root.name=project.project.name;project.project.items['4'].name='TruthOrLie v11 BGM background confirmation';
 fs.writeFileSync(file('projects/truthorlie-v11-bgm-offline.fcproj'),JSON.stringify(project));
 save('qa/native-offline-preparation.json',{issue:145,schema:15,projectSha256:await hash(file('projects/truthorlie-v11-bgm-offline.fcproj')),originalV10Sha256:await hash(v10+'/projects/truthorlie-real-v10-voice.fcproj'),nativeReopenPerformed:false,nativeAppInvocations:0,mode:'Offline known-schema clone with baked BGM track; not native reload/save/export validated',selfContainedDependencies:true,missing:[],videoSourceIsAcceptedV10Picture:true,voiceSeUnchanged:true});
 const job={issue:145,pid:process.pid,finished:new Date().toISOString(),status:'rendered-awaiting-QA',video:file('videos/truthorlie-v11-bgm.mp4'),videoSha256:await hash(file('videos/truthorlie-v11-bgm.mp4')),windowsExeInvocations:0,gui:0,focus:0,publicationIntents:0};fs.writeFileSync(lock,JSON.stringify(job,null,2)+'\n');console.log(JSON.stringify(job));
}
if(process.argv[1]===new URL(import.meta.url).pathname)await produce();
