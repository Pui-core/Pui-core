import fs from'node:fs';import{caseRoot as out,lampFrame,fps}from'./v06-config.mjs';import{ff,save,hash}from'./background.mjs';import{checkCaptionLayers,analyzeCaptionTimeline,findLampFrame}from'./v06-checks.mjs';
// 点灯frame=523・結果字幕の本文/開始/終端・cue07有声開始の順序を、(1)保存原本JSON (2)最終MP4の連続frame の独立した2経路で照合する。聴感/視聴の代用ではない。
const output=JSON.parse(fs.readFileSync(out+'/qa/output-binding-v06.json')),audio=JSON.parse(fs.readFileSync(out+'/qa/audio-binding-r6.json'));
const parse=p=>fs.readFileSync(p,'utf8').split('\n').filter(l=>/=/.test(l)).map(l=>Number(l.split('=')[1]));
const captionLayers=checkCaptionLayers(JSON.parse(fs.readFileSync(out+'/projects/intro65-v06.ecproj')),{fps,lampFrame});
const res=[];
for(const b of output.bindings){if(hash(b.file)!==b.sha256)throw Error('Final changed');const id=b.variant,dir=out+'/qa/lamp-frames-'+id;fs.mkdirSync(dir,{recursive:true});
 const stat=async(name,crop,keys,a,z)=>{const fs_=keys.map(k=>out+'/qa/lamp-'+id+'-'+name+'-'+k+'.txt');fs_.forEach(f=>fs.rmSync(f,{force:true}));await ff(['-t','20.1','-i',b.file,'-vf',`select='between(n,${a},${z})',crop=${crop},signalstats,`+keys.map((k,i)=>`metadata=print:key=lavfi.signalstats.${k}:file=${fs_[i]}`).join(','),'-f','null','-'],out+'/qa/lamp-'+id+'-'+name+'.json');return fs_.map(parse);};
 const [y]=await stat('pedestal','300:260:200:900',['YAVG'],515,530);const first=findLampFrame(y,515);
 // 結果字幕領域(y1540-1620)の全frame(453..600)統計: 開始(fade-in込み)/保持/終端/後続副行
 const [ymax,yavg]=await stat('caption','800:80:140:1540',['YMAX','YAVG'],453,600);const timeline=analyzeCaptionTimeline({ymax,yavg,lampFrame});
 await ff(['-i',b.file,'-vf',`select='between(n,515,530)',crop=1080:1000:0:420,scale=270:250,tile=8x2:padding=4:margin=4`,'-frames:v','1',out+'/qa/lamp-sheet-'+id+'.png'],out+'/qa/lamp-sheet-'+id+'.json');
 await ff(['-t','20.1','-i',b.file,'-vf',`select='between(n,${lampFrame-2},${lampFrame+9})+between(n,${566-2},${566+4})',scale=216:384,tile=7x3:padding=4:margin=4`,'-frames:v','1',out+'/qa/lamp-caption-sheet-'+id+'.png'],out+'/qa/lamp-caption-sheet-'+id+'.json');
 res.push({variant:id,sha256:b.sha256,firstLitFrame:first,firstLitSeconds:first/fps,timeline,pedestalYavg:y.map(v=>Math.round(v*100)/100)});}
const c07=audio.cues.find(c=>c.id==='07'),c08=audio.cues.find(c=>c.id==='08'),c06=audio.cues.find(c=>c.id==='06');
const ok=res.every(r=>r.firstLitFrame===lampFrame)&&c07.actualStart>=lampFrame/fps&&c08.actualStart-c07.actualEnd>.5&&c07.actualStart-c06.actualEnd>.5&&Math.abs(c08.actualStart-19.8886042)<1e-4;
save(out+'/qa/lamp-sync-v06.json',{issue:156,task:'RC-156-02',lampFrame,lampSeconds:lampFrame/fps,captionLayers,results:res,cue07:{actualStart:c07.actualStart,actualEnd:c07.actualEnd,afterLampSeconds:c07.actualStart-lampFrame/fps,gapToCue08:c08.actualStart-c07.actualEnd,gapAfterCue06:c07.actualStart-c06.actualEnd},cue08Start:c08.actualStart,pass:ok,note:'native layer readback + final MP4 frame statistics + frame sheets; not subjective listening or real-time watch'});
console.log(JSON.stringify({pass:ok,res}));if(!ok)process.exit(1);
