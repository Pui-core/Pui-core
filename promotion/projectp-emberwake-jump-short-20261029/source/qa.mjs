import fs from 'node:fs';
import {stage,ff,run,ffRoot,save,hash} from './background.mjs';
const root=stage+'/jump-v01',version='v03',resume=process.argv.includes('--resume');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const binding=read(root+'/qa/output-binding-v03.json'),results=[];
function prior(receipt,file){const x=read(receipt);if(x.code!==0||x.timedOut||x.stderr||!x.args.includes(file))throw Error('Prior check not successful for pinned final '+receipt);return x;}
for(const v of binding.bindings){
 if(hash(v.file)!==v.sha256)throw Error('Final hash mismatch');
 const receipt=root+'/qa/final-'+version+'-'+v.variant+'-format.json';
 const probe=resume?prior(receipt,v.file):await run(ffRoot+'/bin/ffprobe',['-v','error','-show_streams','-show_format','-of','json',v.file],receipt,{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});
 const info=JSON.parse(probe.stdout),video=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio');
 if(video.width!==1080||video.height!==1920||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==240||Math.abs(Number(video.duration)-8)>.001||audio.sample_rate!=='48000'||audio.channels!==2||Math.abs(Number(audio.duration)-8)>.001)throw Error('Final format');
 const decode=root+'/qa/final-'+version+'-'+v.variant+'-decode.json',frames=root+'/qa/'+version+'-'+v.variant+'-framehash.json';
 if(resume){prior(decode,v.file);prior(frames,v.file);}else{await ff(['-i',v.file,'-map','0:v:0','-map','0:a:0','-f','null','-'],decode);await ff(['-i',v.file,'-map','0:v:0','-f','framemd5',root+'/qa/'+version+'-'+v.variant+'-framehash.txt'],frames);}
 results.push({variant:v.variant,file:v.file,sha256:v.sha256,bytes:fs.statSync(v.file).size,video:{codec:video.codec_name,width:video.width,height:video.height,frames:Number(video.nb_frames),fps:30,seconds:Number(video.duration)},audio:{codec:audio.codec_name,rate:Number(audio.sample_rate),channels:audio.channels,seconds:Number(audio.duration)},fullDecodeExit:0,decodeReceipt:decode});
}
const framehash=id=>fs.readFileSync(root+'/qa/'+version+'-'+id+'-framehash.txt','utf8').split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split(',').at(-1).trim());
const a=framehash('voice'),b=framehash('bgm');if(a.length!==240||JSON.stringify(a)!==JSON.stringify(b))throw Error('Audio variants picture differs');
if(!resume){
 const final=binding.bindings.find(v=>v.variant==='bgm').file;
 for(const t of[.3,1.2,2.2,2.6,3.6,4.4,5.2,6.9,7,7.966667])await ff(['-ss',String(t),'-i',final,'-frames:v','1',root+'/qa/final-'+version+'-'+String(t).replace('.','_')+'.png'],root+'/qa/final-'+version+'-frame-'+t+'.json');
 await ff(['-i',final,'-vf','fps=2,scale=270:480,tile=4x4','-frames:v','1',root+'/qa/final-v03-whole-sheet.png'],root+'/qa/final-v03-whole-sheet.json');
 await ff(['-ss','3.2','-i',final,'-t','2.8','-vf','crop=1080:360:0:0,scale=360:120,tile=7x12','-frames:v','1',root+'/qa/final-v03-heading-strip.png'],root+'/qa/final-v03-heading-strip.json');
}
const heading=read(root+'/qa/final-v03-heading-classified.json');
if(heading.final.sha256!==binding.bindings.find(v=>v.variant==='bgm').sha256||heading.final.checkedFrames!==172||heading.final.failures.length)throw Error('Classified actual heading check absent or failed');
const refs=[];function collect(x){if(!x||typeof x!=='object')return;for(const v of Object.values(x)){if(typeof v==='string'&&v.startsWith('/mnt/f/'))refs.push(v);else if(v&&typeof v==='object')collect(v);}}
for(const p of[binding.ec,...binding.bindings.map(v=>v.nativeFilmcraftProject)])collect(read(p));
const missing=refs.filter(p=>!fs.existsSync(p));if(missing.length)throw Error('Missing Native references '+missing.join(','));
const independentFile='/home/pui/tmp/projectp152-audio-ro-20261029/audio-qa-v03.json',audio=read(independentFile);
for(const v of binding.bindings){const actual=audio.finals.find(f=>f.variant===v.variant);if(actual?.sha256!==v.sha256||!actual.bindingMatches||actual.exportCode!==0)throw Error('Independent AAC binding mismatch');}
const nas=read(root+'/qa/nas-deliver.json');if(nas.entries.length!==2||nas.consoleWindow!==0||nas.consoleWindowAfter!==0)throw Error('NAS receipt missing');
for(const v of binding.bindings){const n=nas.entries.find(e=>e.variant===v.variant);if(n?.nasSha256!==v.sha256||n.sourceSha256!==v.sha256||n.nasDirectDecodeExitCode!==0||n.nasDirectDecodeErrors)throw Error('NAS verification mismatch');}
save(root+'/qa/final-v03-quality.json',{issue:152,seconds:8,frames:240,results,pictureVariantsSameDecodedFrames:true,pictureFrameCount:a.length,nativeProjectsCreatedReopenedRenderedInFinalFPackage:true,activeOfflineMedia:[],knownExistingFReferences:[...new Set(refs)],headerInspection:'final-v03-heading-classified.json',headerInspectionSha256:hash(root+'/qa/final-v03-heading-classified.json'),historicalUnsafeControl:heading.historicalUnsafeControl,rootCreativeAcceptance:'Root actual Native/final images accepted; final Source verdict pending',rootReview:'/home/pui/tmp/projectp129-mac-preflight-20261029-2025/root152-v03-review.json',independentAudio:{file:independentFile,sha256:hash(independentFile),numericalIssuesReleased:true,directListening:false},nasReceipt:'nas-deliver.json',nasFilesOnly:nas.nasDirectoryFiles,wholeSubjectiveListen:false,wholeRealtimeWatch:false,selectedFramesAndSheetsVisuallyReadBy:['Writer','Root'],newCapture:0,sharedGui:0,posted:false});
console.log(JSON.stringify({quality:root+'/qa/final-v03-quality.json',headerFrames:172,headerFails:0,nasEntries:nas.entries.length,subjectiveListen:false,sourceVerdict:'pending'}));
