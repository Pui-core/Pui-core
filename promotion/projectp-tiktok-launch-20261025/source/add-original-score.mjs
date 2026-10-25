import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=process.env.PROJECTP_DELIVERY||'/mnt/f/Videos/ProjectP-TikTok-Launch-2026-10-25';
const prior=path.resolve(root,'../projectp-emberwake-rta-v2'),FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe',FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const SR=48000,N=SR*60,TICKS=254016000000,receipts=[];
const f=p=>path.join(root,p),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),parse=s=>JSON.parse(s.replace(/^\uFEFF/,'').trim());
function exec(exe,args,opts={}){for(let attempt=0;attempt<3;attempt++){const r=spawnSync(exe,args,{encoding:'utf8',timeout:180000,maxBuffer:30*1024*1024,...opts});if(!r.error&&r.status===0)return r;if(attempt<2&&/UtilAcceptVsock.*accept4 failed/.test(String(r.stderr)))continue;throw Error(JSON.stringify({args,exit:r.status,error:r.error?.message,stderr:String(r.stderr).slice(-1500)}));}}
const np=p=>exec('wslpath',['-w',path.resolve(p)]).stdout.trim();
function run(exe,args,input){const r=exec(exe,args,{input});receipts.push({tool:path.basename(exe),args,exit:r.status,stdout:r.stdout,stderr:r.stderr});return r;}
function save(rel,j){fs.writeFileSync(f(rel),JSON.stringify(j,null,2)+'\n');}
function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);if(sha(a)!==sha(b))throw Error('Copy mismatch');}
function wav(p){const b=fs.readFileSync(p);let fmt,data;for(let p=12;p+8<b.length;){const size=b.readUInt32LE(p+4),id=b.toString('ascii',p,p+4);if(id==='fmt ')fmt=b.subarray(p+8,p+8+size);if(id==='data')data=b.subarray(p+8,p+8+size);p+=8+size+(size%2);}if(!fmt||!data||fmt.readUInt16LE(2)!==2||fmt.readUInt32LE(4)!==SR||fmt.readUInt16LE(14)!==24||data.length!==N*6)throw Error('Expected exact stereo48k24bit60s');return data;}
function writeWav(data){const b=Buffer.alloc(44+data.length);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*6,28);b.writeUInt16LE(6,32);b.writeUInt16LE(24,34);b.write('data',36);b.writeUInt32LE(data.length,40);data.copy(b,44);return b;}
function ease(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
function gate(t,a,b,attack=.12,release=.30){return t<a-attack||t>b+release?0:t<a?ease((t-a+attack)/attack):t<=b?1:1-ease((t-b)/release);}

const mode=process.argv[2]||'build';
if(mode==='build'){
 const oldFiles=['videos/emberwake-voice-sfx-no-music.mp4','videos/emberwake-sfx-only.mp4','videos/emberwake-picture-silent.mp4','media/voice-sfx-no-music.wav','covers/emberwake-cover.png','covers/emberwake-cover.pcraft'].map(file=>({file,sha256:sha(f(file))}));
 const source=path.join(prior,'media/emberwake-60-mix.wav'),sourceQa=parse(fs.readFileSync(path.join(prior,'qa/audio.json'),'utf8'));
 if(sha(source)!==sourceQa.sha256||sourceQa.sha256!=='565295d97f5525f3f6cec6dd722c5fd8b87932b58b2e10d087a3980762665da9')throw Error('Original score does not match preserved QA');
 const score=wav(source),voiceFx=wav(f('media/voice-sfx-no-music.wav')),timing=parse(fs.readFileSync(f('qa/voice-timing.json'),'utf8')).cues;
 const hits=[1.3,508/30,586/30,625/30,664/30,33.6];
 const ducked=Buffer.alloc(N*6),mixed=Buffer.alloc(N*6);let peak=0,clips=0;
 const envelope=[];for(let i=0;i<N;i++){const t=i/SR;let g=.82;for(const c of timing)g=Math.min(g,.82-(.82-.22)*gate(t,c.at,c.endActual));for(const h of hits)g=Math.min(g,.82-(.82-.40)*gate(t,h-.025,h+.08,.045,.14));if(i%4800===0)envelope.push({time:t,gain:g});for(let c=0;c<2;c++){const off=i*6+c*3,s=score.readIntLE(off,3)/8388607,v=voiceFx.readIntLE(off,3)/8388607,m=s*g,total=v+m;peak=Math.max(peak,Math.abs(total));if(Math.abs(total)>=1)clips++;ducked.writeIntLE(Math.round(m*8388607),off,3);if(Math.abs(total)>=1)throw Error('Mix would clip');mixed.writeIntLE(Math.round(total*8388607),off,3);}}
 fs.writeFileSync(f('media/original-score-ducked.wav'),writeWav(ducked));fs.writeFileSync(f('media/voice-original-score-mix.wav'),writeWav(mixed));
 copy(path.join(prior,'videos/01-emberwake-rta-v2.mp4'),f('media/picture-source.mp4'));
 const project=f('projects/voice-original-score.fcproj'),first=run(FC,['--save-as',np(project),'run','-'],[
 {id:'file.newProject',params:{name:'ProjectP original score / VOICEVOX'}},{id:'file.newSequence',params:{name:'EMBERWAKE voice and original score',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:2}},{id:'file.import',params:{paths:[np(f('media/picture-source.mp4')),np(f('media/voice-sfx-no-music.wav')),np(f('media/original-score-ducked.wav'))]}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');let items;for(const l of first.stdout.trim().split(/\r?\n/)){const j=parse(l);if(j.ok===false)throw Error(l);if(j.result?.items)items=j.result.items;}if(items?.length!==3)throw Error('Missing imported items');
 run(FC,['--project',np(project),'--save','run','-'],[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:60*TICKS,video:true,audio:false}},
 {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:60*TICKS,video:false,audio:true}},
 {id:'timeline.place',params:{item:items[2],track:'A2',seconds:0,duration:60*TICKS,video:false,audio:true}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');
 run(FC,['--project',np(project),'export',np(f('media/voice-original-score-filmcraft.aac')),'--format','aac']);
 run(FF,['-hide_banner','-y','-i',np(f('media/picture-source.mp4')),'-i',np(f('media/voice-original-score-filmcraft.aac')),'-map','0:v:0','-map','1:a:0','-c','copy','-t','60','-movflags','+faststart',np(f('videos/emberwake-voice-original-score.mp4'))]);
 const status=parse(run(FC,['--project',np(project),'exec','media.status']).stdout);if(status.length!==3||status.some(x=>x.status!=='online'))throw Error('Offline FilmCraft media');
 for(const rel of ['media/original-score-ducked.wav','media/voice-original-score-mix.wav','media/voice-original-score-filmcraft.aac','videos/emberwake-voice-original-score.mp4'])copy(f(rel),path.join(dest,rel));
 const from=np(root),to=np(dest),relink=v=>typeof v==='string'&&(v===from||v.startsWith(from+'\\'))?to+v.slice(from.length):Array.isArray(v)?v.map(relink):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relink(x)])):v;
 const dp=path.join(dest,'projects/voice-original-score.fcproj');fs.writeFileSync(dp,JSON.stringify(relink(parse(fs.readFileSync(project,'utf8')))));
 const ds=parse(run(FC,['--project',np(dp),'exec','media.status']).stdout);if(ds.length!==3||ds.some(x=>x.status!=='online'))throw Error('Offline delivery media');run(FC,['--project',np(dp),'--save','render','--seconds','14','--out',np(path.join(dest,'qa/original-score-native-preview.png'))]);copy(path.join(dest,'qa/original-score-native-preview.png'),f('qa/original-score-native-preview.png'));
 for(const x of oldFiles)if(sha(f(x.file))!==x.sha256)throw Error('Old asset changed');
 save('qa/original-score-build.json',{status:'BUILT_NATIVE_FOR_VERIFICATION',source:{sha256:sourceQa.sha256,authorship:sourceQa.authorship,bpm:sourceQa.bpm,sourceIssue:88},mix:{sampleRate:SR,frames:N,scoreFullDuration:true,voiceSfxAppliedOnce:true,scoreGainBase:.82,scoreGainUnderVoice:.22,scoreGainUnderHits:.40,voiceAttackSeconds:.12,voiceReleaseSeconds:.30,voiceOrSfxCompressed:false,scoreEnvelope:envelope,peakDbfs:20*Math.log10(peak),clippedSamples:clips},voice:timing,oldFiles,videoSha256:sha(f('videos/emberwake-voice-original-score.mp4')),waveSha256:sha(f('media/voice-original-score-mix.wav')),nativeSourceSha256:sha(project),nativeDeliverySha256:sha(dp),receipts,scope:{popularTrack:false,thirdPartyMusic:false,directWholeAudition:false,publication:false}});
 copy(f('qa/original-score-build.json'),path.join(dest,'qa/original-score-build.json'));
 console.log(JSON.stringify({video:path.join(dest,'videos/emberwake-voice-original-score.mp4'),sha256:sha(f('videos/emberwake-voice-original-score.mp4')),samplePeakDbfs:20*Math.log10(peak)}));
}else if(mode==='verify'){
 const video=f('videos/emberwake-voice-original-score.mp4'),before=parse(fs.readFileSync(f('qa/final-verification.json'),'utf8'));
 const probe=parse(run(FP,['-v','error','-show_streams','-show_format','-of','json',np(video)]).stdout),v=probe.streams.find(x=>x.codec_type==='video'),a=probe.streams.find(x=>x.codec_type==='audio');
 run(FF,['-v','error','-xerror','-threads','1','-i',np(video),'-f','null','-']);
 const picture=run(FF,['-v','error','-threads','1','-i',np(video),'-map','0:v:0','-f','hash','-hash','sha256','-']).stdout.trim();
 if(picture!==before.files[0].decodedPictureSha256||v.width!==1080||v.height!==1920||Number(v.nb_frames)!==1800)throw Error('Picture regression');
 const log=run(FF,['-hide_banner','-i',np(video),'-vn','-af','ebur128=peak=true','-f','null','-']).stderr,summary=log.slice(log.lastIndexOf('Summary:')),peak=Number(summary.match(/Peak:\s+([-\d.]+) dBFS/)?.[1]),lufs=Number(summary.match(/I:\s+([-\d.]+) LUFS/)?.[1]);if(!Number.isFinite(peak)||peak>-1||!Number.isFinite(lufs))throw Error('Bad AAC levels');
 function pcm(rel){const r=exec(FF,['-v','error','-i',np(f(rel)),'-vn','-ac','1','-ar','48000','-f','f32le','-'],{encoding:null,maxBuffer:15*1024*1024});const b=r.stdout;return Float32Array.from({length:b.length/4},(_,i)=>b.readFloatLE(i*4));}
 const source=pcm('media/voice-original-score-mix.wav'),final=pcm('videos/emberwake-voice-original-score.mp4'),correlations=[];
 for(const[a,b]of [[.1,2.3],[9.9,12.3],[53.9,56.8]]){let best={correlation:-1,lagSamples:0};for(let lag=0;lag<=1600;lag+=4){let cross=0,ss=0,ff=0;for(let i=Math.round(a*SR);i<Math.round(b*SR);i+=16){const x=source[i],y=final[i+lag];cross+=x*y;ss+=x*x;ff+=y*y;}const c=cross/Math.sqrt(ss*ff);if(c>best.correlation)best={correlation:c,lagSamples:lag};}if(best.correlation<.98)throw Error('Mix/audio timing differs');correlations.push({window:[a,b],...best,lagFrames:best.lagSamples/1600});}
 const build=parse(fs.readFileSync(f('qa/original-score-build.json'),'utf8'));for(const x of build.oldFiles)if(sha(f(x.file))!==x.sha256)throw Error('Original asset changed');
 const result={status:'PASS_FULL_DECODE_PICTURE_IDENTITY_AND_FINAL_AUDIO',video:{file:'videos/emberwake-voice-original-score.mp4',sha256:sha(video),width:v.width,height:v.height,frames:Number(v.nb_frames),fps:v.avg_frame_rate,duration:Number(probe.format.duration),decodedPictureSha256:picture,sourcePictureUnchanged:true,audioCodec:a.codec_name,sampleRate:a.sample_rate,integratedLufs:lufs,truePeakDbfs:peak},waveSha256:sha(f('media/voice-original-score-mix.wav')),voiceAndMixCorrelation:correlations,noVoiceOrSfxDoubled:true,originalScoreOnlySha256:build.source.sha256,fullAvDecode:true,nativeDeliveryReopenSaveRender:true,nativeDeliverySha256:sha(path.join(dest,'projects/voice-original-score.fcproj')),scope:{directWholeWatch:false,directWholeAudition:false,popularSong:false,publication:false},receipts};save('qa/original-score-final.json',result);copy(f('qa/original-score-final.json'),path.join(dest,'qa/original-score-final.json'));console.log(JSON.stringify(result.video));
}else throw Error('Use build|verify');
