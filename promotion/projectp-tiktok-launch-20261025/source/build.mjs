import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const PRIOR=process.env.PROJECTP_PRIOR||path.resolve(ROOT,'../projectp-emberwake-rta-v2');
export const DEST=process.env.PROJECTP_DELIVERY||'/mnt/f/Videos/ProjectP-TikTok-Launch-2026-10-25';
const PC='/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe',EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe',FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const WNODE='/mnt/c/Program Files/nodejs/node.exe';
const TICKS=254016000000,DURATION=60,SR=48000;
export const file=p=>path.join(ROOT,p),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const np=p=>exec('wslpath',['-w',path.resolve(p)]).stdout.trim();
function exec(exe,args,opts={}){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:20*1024*1024,timeout:180000,...opts});if(r.error||r.status!==0)throw Error(JSON.stringify({exe,args,status:r.status,error:r.error?.message,stderr:r.stderr,stdout:r.stdout}).slice(-6000));return r;}
function save(p,j){fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),JSON.stringify(j,null,2)+'\n');}
function run(exe,args,receipt,input){const r=exec(exe,args,{input});save('qa/'+receipt,{exe:path.basename(exe),args,exit:r.status,stdout:r.stdout,stderr:r.stderr});return r;}
function json(s){return JSON.parse(s.replace(/^\uFEFF/,'').trim());}
function safeCopy(src,dst){fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);if(hash(src)!==hash(dst))throw Error('Copy mismatch '+dst);}
for(const d of ['source','media','videos','covers','projects','qa'])fs.mkdirSync(file(d),{recursive:true});

export const VOICE=[
 {at:.10,end:3.15,text:'その一手で、何秒縮める？'},
 {at:3.60,end:9.65,text:'灯を運ぶ、ツーディーアクション。エンバーウェイク。'},
 {at:9.95,end:12.30,text:'同じコースで、自己ベストへ。'},
 {at:12.50,end:17.90,text:'運ぶ。はめる。道が変わる。'},
 {at:18.85,end:22.80,text:'着地点を狙って、跳ぶ。'},
 {at:36.85,end:39.95,text:'全五章のデモから、本制作へ。'},
 {at:48.20,end:52.80,text:'クラウドファンディングは、公開準備中。'},
 {at:54.00,end:59.50,text:'この制作を、フォローで応援してください。'}
];

export function prepare(){
 const input=path.join(PRIOR,'videos/01-emberwake-rta-v2.mp4');
 if(hash(input)!=='9504430b7677be349efd78e9f7c6177082896cfac9f373266e64243eb7da0c8b')throw Error('Unexpected prior picture');
 safeCopy(input,file('media/picture-source.mp4'));
 const src=path.join(PRIOR,'source/audio-v2.mjs'),text=fs.readFileSync(src,'utf8');
 fs.writeFileSync(file('source/referenced-audio-v2.mjs'),text+'\nexport {synthesize,wave};\n');
 safeCopy(path.join(PRIOR,'source/edit.json'),file('source/visual-edit-reference.json'));
 const priorMedia=path.join(PRIOR,'media');
 for(const name of fs.readdirSync(priorMedia)){if(/\.(wav|mov)$/i.test(name))continue;const src=path.join(priorMedia,name),dst=file('media/'+name);if(fs.statSync(src).isDirectory())fs.cpSync(src,dst,{recursive:true});else safeCopy(src,dst);}
 let ec=json(fs.readFileSync(path.join(PRIOR,'projects/01-emberwake-rta-v2.ecproj'),'utf8'));
 const prefixes=[np(PRIOR),'F:\\Videos\\ProjectP-EMBERWAKE-RTA-V2-2026-10-25'];
 const rewrite=v=>typeof v==='string'?prefixes.reduce((s,p)=>s===p||s.startsWith(p+'\\')?np(ROOT)+s.slice(p.length):s,v):Array.isArray(v)?v.map(rewrite):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,rewrite(x)])):v;
 fs.writeFileSync(file('projects/visual-source.ecproj'),JSON.stringify(rewrite(ec)));
 const ecCheck=json(run(EC,['--project',np(file('projects/visual-source.ecproj')),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json'],'ec-reopen-save.json').stdout);if(ecCheck.result?.find(x=>x.command==='footage.missing')?.result?.missing?.length!==0)throw Error('EffectCraft missing footage');
 run(EC,['--project',np(file('projects/visual-source.ecproj')),'render-frame','--comp','EMBERWAKE RTA V2','--time','14','--out',np(file('qa/effectcraft-reopened.png')),'--json'],'ec-render.json');
 save('qa/provenance.json',{issue:'https://github.com/Pui-core/-/issues/94',priorIssue:'https://github.com/Pui-core/-/issues/89',pictureSourceSha256:hash(input),priorAudioSourceSha256:hash(src),noGenerativeImages:true,sourcePictureChanged:false,note:'Existing EXPLORE game footage, 3D development imagery and typography. Audio is replaced only; not an actual RTA record.'});
}

export async function audio(reuseVoices=false){
 const {accentPlan,synthesize,wave}=await import('./referenced-audio-v2.mjs');
 const events=accentPlan(),fx=synthesize(events);fs.writeFileSync(file('media/editorial-sfx.wav'),wave(fx.L,fx.R,.80));
 const script=`import fs from 'node:fs'; const cues=JSON.parse(fs.readFileSync(process.argv[2],'utf8')); const dest=process.argv[3]; const base='http://127.0.0.1:50025'; const speakers=await(await fetch(base+'/speakers')).json();const speaker=speakers.find(x=>x.styles.some(s=>s.id===13)); if(speaker?.name!=='青山龍星')throw Error('Speaker mismatch'); const report=[];for(let i=0;i<cues.length;i++){const c=cues[i];let q=await(await fetch(base+'/audio_query?text='+encodeURIComponent(c.text)+'&speaker=13',{method:'POST'})).json();q.speedScale=1.14;q.intonationScale=1.12;q.prePhonemeLength=.045;q.postPhonemeLength=.10;q.outputSamplingRate=48000;q.outputStereo=true; const duration=q=>q.accent_phrases.reduce((sum,a)=>sum+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;let d=duration(q);if(d>c.end-c.at){q.speedScale=Math.min(1.50,q.speedScale*d/(c.end-c.at-.04));d=duration(q);}if(d>c.end-c.at+.015)throw Error('Cue too long '+i);const r=await fetch(base+'/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});if(!r.ok)throw Error(await r.text());fs.writeFileSync(dest+'/voice-'+String(i+1).padStart(2,'0')+'.wav',Buffer.from(await r.arrayBuffer()));fs.writeFileSync(dest+'/voice-'+String(i+1).padStart(2,'0')+'-query.json',JSON.stringify(q,null,2));report.push({...c,predictedDuration:d,speedScale:q.speedScale});}console.log(JSON.stringify({speaker:speaker.name,style:'ノーマル',styleId:13,credit:'VOICEVOX:青山龍星',engineVersion:await(await fetch(base+'/version')).json(),cues:report}));`;
 fs.writeFileSync(file('source/synthesize-windows.mjs'),script+'\n');save('source/narration-cues.json',VOICE);
 const report=reuseVoices?json(fs.readFileSync(file('qa/narration.json'),'utf8')):json(run(WNODE,[np(file('source/synthesize-windows.mjs')),np(file('source/narration-cues.json')),np(file('media'))],'voicevox-synthesis.json').stdout);save('qa/narration.json',report);
 const ins=['-hide_banner','-y','-i',np(file('media/editorial-sfx.wav'))];for(let i=0;i<VOICE.length;i++)ins.push('-i',np(file('media/voice-'+String(i+1).padStart(2,'0')+'.wav')));
 const filters=VOICE.map((c,i)=>`[${i+1}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)},volume=1.35[v${i}]`);
 filters.push(`[0:a]volume=0.75[fx]`);filters.push(`[fx]${VOICE.map((_,i)=>`[v${i}]`).join('')}amix=inputs=${VOICE.length+1}:normalize=0,apad,atrim=duration=60[mix]`);
 run(FF,[...ins,'-filter_complex',filters.join(';'),'-map','[mix]','-c:a','pcm_s24le','-ar','48000',np(file('media/voice-sfx-no-music.wav'))],'voice-sfx-mix.json');
 const measurements=VOICE.map((c,i)=>{const p=file('media/voice-'+String(i+1).padStart(2,'0')+'.wav');const probe=json(exec(FP,['-v','error','-show_entries','format=duration','-of','json',np(p)]).stdout);const d=Number(probe.format.duration);if(d>c.end-c.at+.02)throw Error('Actual narration exceeds cue');return{...c,duration:d,endActual:c.at+d,sha256:hash(p)};});
 save('qa/voice-timing.json',{...report,cues:measurements,directAudition:false,voiceImpersonation:false});
 const edit=json(fs.readFileSync(file('source/visual-edit-reference.json'),'utf8'));
 save('source/beat-map.json',{bpm:120,beatSeconds:.5,zero:0,beats:Array.from({length:121},(_,i)=>({beat:i+1,time:i*.5,frame:i*15})),cuts:edit.shots.map(x=>({time:x.a,frame:Math.round(x.a*30),nearestBeat:Math.round(x.a*2)/2,offsetFromNearestBeat:x.a-Math.round(x.a*2)/2})),editorialSfx:events,nativeMusicSelected:false,note:'Existing visual cuts are not all beat aligned. Select actual TikTok sound and align its first suitable downbeat to video zero; this map alone does not prove popular-track synchronization.'});
}

export function cover(){
 const source=file('media/chapter-I/frame-000238.png'),stage='/mnt/c/Users/pui/AppData/Local/Temp/projectp-94-native-cover',out=path.join(stage,'emberwake-cover.pcraft');
 fs.mkdirSync(stage,{recursive:true});
 const cmds=[
 ['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#08151e',name:'Deep teal field'}],
 ['file.placeEmbedded',{path:np(source),scale:112,fit:false,center:[610,1040],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,0,1080,680],fill:'#08151e',name:'Quiet title field'}],
 ['shape.create',{kind:'rect',rect:[0,1515,1080,405],fill:'#08151e',name:'Lower caption field'}],
 ['shape.create',{kind:'rect',rect:[90,263,10,225],fill:'#edb468',name:'Gold rule'}],
 ['type.create',{x:128,y:272,text:'PROJECT P  /  ぷい',font:'Meiryo',size:28,color:'#a8bfc1',name:'Author'}],
 ['type.create',{x:124,y:384,text:'その一手で、',font:'Meiryo',size:76,weight:700,color:'#f3e7ca',name:'Hook line one'}],
 ['type.create',{x:120,y:492,text:'何秒縮める？',font:'Meiryo',size:84,weight:700,color:'#edb468',name:'Hook line two'}],
 ['type.create',{x:126,y:574,text:'同じコース。次は、もっと速く。',font:'Meiryo',size:29,color:'#c3d2d0',name:'Premise'}],
 ['type.create',{x:94,y:1612,text:'EMBERWAKE',font:'Meiryo',size:77,weight:700,color:'#f3e7ca',name:'Game title'}],
 ['type.create',{x:98,y:1680,text:'灰の灯  /  制作、本格化。',font:'Meiryo',size:37,weight:700,color:'#edb468',name:'Game subtitle'}],
 ['type.create',{x:98,y:1756,text:'開発中の実ゲーム映像 / 探索モード',font:'Meiryo',size:23,color:'#a8bfc1',name:'Source disclosure'}]
 ];
 const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'EMBERWAKE TikTok cover',background:'#08151e',resolution:72})];
 for(const[c,p]of cmds)args.push('--cmd',c,'--params',JSON.stringify(p));args.push('--out',np(out));
 run(PC,args,'photocraft-build.json');save('source/cover-commands.json',cmds);
 run(PC,['convert',np(out),np(path.join(stage,'emberwake-cover.png')),'--format','png'],'photocraft-export.json');
 const info=json(run(PC,['info',np(out),'--compact'],'photocraft-info.json').stdout);if(info.warnings?.length||info.width!==1080||info.height!==1920||info.layers.length!==13)throw Error('PhotoCraft document mismatch');
 run(PC,['run',np(out),'--out',np(path.join(stage,'cover-reopened.pcraft'))],'photocraft-reopen-save.json');
 run(PC,['convert',np(path.join(stage,'cover-reopened.pcraft')),np(path.join(stage,'cover-reopened.png')),'--format','png'],'photocraft-reopen-render.json');
 for(const[a,b]of [['emberwake-cover.pcraft','covers/emberwake-cover.pcraft'],['emberwake-cover.png','covers/emberwake-cover.png'],['cover-reopened.pcraft','projects/cover-reopened.pcraft'],['cover-reopened.png','qa/cover-reopened.png']])safeCopy(path.join(stage,a),file(b));
 if(hash(file('covers/emberwake-cover.png'))!==hash(file('qa/cover-reopened.png')))throw Error('PhotoCraft roundtrip pixels differ');
}

function fcProject(name,mix,out){
 const project=file('projects/'+name+'.fcproj');
 const first=run(FC,['--save-as',np(project),'run','-'],name+'-build.json',[
 {id:'file.newProject',params:{name:'ProjectP TikTok launch / '+name}},
 {id:'file.newSequence',params:{name,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},
 {id:'file.import',params:{paths:[np(file('media/picture-source.mp4')),np(file(mix))]}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');
 let items;for(const l of first.stdout.trim().split(/\r?\n/)){const j=json(l);if(j.ok===false)throw Error(l);if(j.result?.items)items=j.result.items;}if(items?.length!==2)throw Error('FilmCraft imports missing');
 run(FC,['--project',np(project),'--save','run','-'],name+'-place.json',[
 {id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:DURATION*TICKS,video:true,audio:false}},
 {id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:DURATION*TICKS,video:false,audio:true}}
 ].map(x=>JSON.stringify(x)).join('\n')+'\n');
 run(FC,['--project',np(project),'export',np(file(out)),'--format','aac'],name+'-aac-export.json');
 const media=json(run(FC,['--project',np(project),'exec','media.status'],name+'-media-status.json').stdout);if(media.length!==2||media.some(x=>x.status!=='online'))throw Error('FilmCraft offline media');
 run(FC,['--project',np(project),'--save','render','--seconds','14','--out',np(file('qa/'+name+'-reopened.png'))],name+'-reopen-render.json');
}
export function native(){
 fcProject('voice-sfx-no-music','media/voice-sfx-no-music.wav','media/voice-sfx-filmcraft.aac');
 fcProject('sfx-only','media/editorial-sfx.wav','media/sfx-filmcraft.aac');
 for(const[name,a]of [['emberwake-voice-sfx-no-music','voice-sfx-filmcraft'],['emberwake-sfx-only','sfx-filmcraft']])run(FF,['-hide_banner','-y','-i',np(file('media/picture-source.mp4')),'-i',np(file('media/'+a+'.aac')),'-map','0:v:0','-map','1:a:0','-c','copy','-t','60','-movflags','+faststart',np(file('videos/'+name+'.mp4'))],name+'-mux.json');
 run(FF,['-hide_banner','-y','-i',np(file('media/picture-source.mp4')),'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',np(file('videos/emberwake-picture-silent.mp4'))],'silent-master.json');
}

export function verify(){
 const picture=p=>exec(FF,['-v','error','-threads','1','-i',np(p),'-map','0:v:0','-f','hash','-hash','sha256','-']).stdout.trim();
 const original=picture(file('media/picture-source.mp4')),files=[];
 for(const name of ['emberwake-voice-sfx-no-music','emberwake-sfx-only','emberwake-picture-silent']){
  const p=file('videos/'+name+'.mp4'),probe=json(exec(FP,['-v','error','-show_streams','-show_format','-of','json',np(p)]).stdout),v=probe.streams.find(x=>x.codec_type==='video'),a=probe.streams.find(x=>x.codec_type==='audio');
  run(FF,['-v','error','-xerror','-threads','1','-i',np(p),'-f','null','-'],name+'-full-decode.json');
  const same=picture(p)===original;if(!same||v.width!==1080||v.height!==1920||v.nb_frames!=='1800')throw Error('Picture regression');
  let audio=null;if(a){const r=run(FF,['-hide_banner','-threads','1','-i',np(p),'-vn','-af','ebur128=peak=true','-f','null','-'],name+'-audio-measure.json');const tail=r.stderr.slice(r.stderr.lastIndexOf('Summary:'));audio={summary:tail,codec:a.codec_name,sampleRate:a.sample_rate};const peak=tail.match(/Peak:\s+([-\d.]+) dBFS/);if(!peak||Number(peak[1])>-1)throw Error('Missing/headroom peak measurement');}
  files.push({file:'videos/'+name+'.mp4',sha256:hash(p),bytes:fs.statSync(p).size,decodedPictureSha256:original,unchangedDecodedPicture:same,fullDecode:true,width:v.width,height:v.height,frames:Number(v.nb_frames),fps:v.avg_frame_rate,duration:Number(probe.format.duration),audio});
 }
 save('qa/final-verification.json',{status:'PASS_TECHNICAL_AND_PICTURE_IDENTITY',files,cover:{file:'covers/emberwake-cover.png',sha256:hash(file('covers/emberwake-cover.png')),nativeSha256:hash(file('covers/emberwake-cover.pcraft')),nativeReopenSamePixels:true},native:{effectcraftSha256:hash(file('projects/visual-source.ecproj')),filmcraftVoiceSha256:hash(file('projects/voice-sfx-no-music.fcproj')),filmcraftSfxSha256:hash(file('projects/sfx-only.fcproj'))},limitations:{directWholePlayback:false,directWholeAudition:false,popularSongSelected:false,tiktokSoundSync:false,publication:false}});
}

export function packageDelivery(){
 if(fs.existsSync(DEST))throw Error('Delivery exists; preserve it and explicitly choose a new path');
 fs.cpSync(ROOT,DEST,{recursive:true});
 const from=np(ROOT),to=np(DEST);
 function relink(v){return typeof v==='string'&&(v===from||v.startsWith(from+'\\'))?to+v.slice(from.length):Array.isArray(v)?v.map(relink):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relink(x)])):v;}
 for(const rel of ['projects/visual-source.ecproj','projects/voice-sfx-no-music.fcproj','projects/sfx-only.fcproj']){const p=path.join(DEST,rel);fs.writeFileSync(p,JSON.stringify(relink(json(fs.readFileSync(p,'utf8')))));}
 const receipts=[];const record=(exe,args)=>{const r=exec(exe,args);receipts.push({tool:path.basename(exe),args,exit:r.status,stdout:r.stdout,stderr:r.stderr});return r;};
 const ecCheck=json(record(EC,['--project',np(path.join(DEST,'projects/visual-source.ecproj')),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json']).stdout);if(ecCheck.result?.find(x=>x.command==='footage.missing')?.result?.missing?.length!==0)throw Error('Delivery EffectCraft missing footage');
 record(EC,['--project',np(path.join(DEST,'projects/visual-source.ecproj')),'render-frame','--comp','EMBERWAKE RTA V2','--time','14','--out',np(path.join(DEST,'qa/delivery-ec.png')),'--json']);
 for(const n of ['voice-sfx-no-music','sfx-only']){const media=json(record(FC,['--project',np(path.join(DEST,'projects/'+n+'.fcproj')),'exec','media.status']).stdout);if(media.length!==2||media.some(x=>x.status!=='online'))throw Error('Delivery FilmCraft offline media');record(FC,['--project',np(path.join(DEST,'projects/'+n+'.fcproj')),'--save','render','--seconds','14','--out',np(path.join(DEST,'qa/delivery-'+n+'.png'))]);}
 record(PC,['run',np(path.join(DEST,'covers/emberwake-cover.pcraft')),'--out',np(path.join(DEST,'projects/cover-delivery-reopened.pcraft'))]);record(PC,['convert',np(path.join(DEST,'projects/cover-delivery-reopened.pcraft')),np(path.join(DEST,'qa/delivery-cover.png')),'--format','png']);
 if(hash(path.join(DEST,'qa/delivery-cover.png'))!==hash(file('covers/emberwake-cover.png')))throw Error('Delivery cover roundtrip differs');
 const bound=['videos/emberwake-voice-sfx-no-music.mp4','videos/emberwake-sfx-only.mp4','videos/emberwake-picture-silent.mp4','covers/emberwake-cover.png','media/voice-sfx-no-music.wav','media/editorial-sfx.wav'].map(rel=>{if(hash(file(rel))!==hash(path.join(DEST,rel)))throw Error('Delivery differs '+rel);return{file:rel,sha256:hash(file(rel))};});
 const nativeArtifacts=['projects/visual-source.ecproj','projects/voice-sfx-no-music.fcproj','projects/sfx-only.fcproj','covers/emberwake-cover.pcraft'].map(rel=>({file:rel,sourceSha256:hash(file(rel)),deliverySha256:hash(path.join(DEST,rel))}));
 const report={status:'PASS_DELIVERY_NATIVE_REOPEN_SAVE_RENDER',destination:DEST,bound,nativeArtifacts,receipts,publication:false};save('qa/delivery.json',report);fs.writeFileSync(path.join(DEST,'qa/delivery.json'),JSON.stringify(report,null,2)+'\n');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2];if(mode==='prepare')prepare();else if(mode==='audio')await audio();else if(mode==='remix')await audio(true);else if(mode==='cover')cover();else if(mode==='native')native();else if(mode==='verify')verify();else if(mode==='package')packageDelivery();else throw Error('prepare|audio|remix|cover|native|verify|package');console.log('Completed '+mode);
}
