import fs from'node:fs';import{caseRoot as out,lampFrame,fps}from'./v06-config.mjs';import{ff,save,hash}from'./background.mjs';
// 最終MP4(両版)の30fps連続frameで、点灯frame=523・結果字幕の出現・cue07有声開始の順序を数値+連続画像で検査する。聴感/視聴の代用ではない。
const output=JSON.parse(fs.readFileSync(out+'/qa/output-binding-v06.json')),audio=JSON.parse(fs.readFileSync(out+'/qa/audio-binding-r6.json'));
const parse=p=>fs.readFileSync(p,'utf8').split('\n').filter(l=>/=/.test(l)).map(l=>Number(l.split('=')[1]));
const res=[];
for(const b of output.bindings){if(hash(b.file)!==b.sha256)throw Error('Final changed');const id=b.variant,dir=out+'/qa/lamp-frames-'+id;fs.mkdirSync(dir,{recursive:true});
 const stat=async(name,crop,key,a,z)=>{const f=out+'/qa/lamp-'+id+'-'+name+'.txt';fs.rmSync(f,{force:true});await ff(['-i',b.file,'-vf',`select='between(n,${a},${z})',crop=${crop},signalstats,metadata=print:key=lavfi.signalstats.${key}:file=${f}`,'-f','null','-'],out+'/qa/lamp-'+id+'-'+name+'.json');return parse(f);};
 // 台座周辺(点灯で明るくなる領域): 515..530の輝度から最初の跳ね上がりを求める
 const y=await stat('pedestal','300:260:200:900','YAVG',515,530);let first=-1;for(let i=1;i<y.length;i++)if(y[i]-y[i-1]>5){first=515+i;break;}
 // 結果字幕領域(y1540-1620)のYMAX: 点灯前(453..522)は文字なし、点灯後に出現
 const pre=await stat('caption-pre','800:80:140:1540','YMAX',453,522),post=await stat('caption-post','800:80:140:1540','YMAX',526,566);
 await ff(['-i',b.file,'-vf',`select='between(n,515,530)',crop=1080:1000:0:420,scale=270:250,tile=8x2:padding=4:margin=4`,'-frames:v','1',out+'/qa/lamp-sheet-'+id+'.png'],out+'/qa/lamp-sheet-'+id+'.json');
 await ff(['-i',b.file,'-vf',`select='between(n,${lampFrame-2},${lampFrame+9})',scale=216:384,tile=6x2:padding=4:margin=4`,'-frames:v','1',out+'/qa/lamp-caption-sheet-'+id+'.png'],out+'/qa/lamp-caption-sheet-'+id+'.json');
 res.push({variant:id,sha256:b.sha256,firstLitFrame:first,firstLitSeconds:first/fps,preLampCaptionYmaxMax:Math.max(...pre),postLampCaptionYmaxMin:Math.min(...post),pedestalYavg:y.map(v=>Math.round(v*100)/100)});}
const c07=audio.cues.find(c=>c.id==='07'),c08=audio.cues.find(c=>c.id==='08'),c06=audio.cues.find(c=>c.id==='06');
const ok=res.every(r=>r.firstLitFrame===lampFrame&&r.preLampCaptionYmaxMax<60&&r.postLampCaptionYmaxMin>150)&&c07.actualStart>=lampFrame/fps&&c08.actualStart-c07.actualEnd>.5&&c07.actualStart-c06.actualEnd>.5&&Math.abs(c08.actualStart-19.8886042)<1e-4;
save(out+'/qa/lamp-sync-v06.json',{issue:156,task:'RC-156-02',lampFrame,lampSeconds:lampFrame/fps,results:res,cue07:{actualStart:c07.actualStart,actualEnd:c07.actualEnd,afterLampSeconds:c07.actualStart-lampFrame/fps,gapToCue08:c08.actualStart-c07.actualEnd,gapAfterCue06:c07.actualStart-c06.actualEnd},cue08Start:c08.actualStart,pass:ok,note:'numeric+frame sheets only; not subjective listening or real-time watch'});
console.log(JSON.stringify({pass:ok,res}));if(!ok)process.exit(1);
