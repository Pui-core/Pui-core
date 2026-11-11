import fs from'node:fs';import{file,np,FF,FP,run,parse,save,digest,hash}from'./native.mjs';
const movie=file('videos/truthorlie129-rules-block44-read-v02-cipher.mp4'),segments=[{id:'first-score',start:18,end:21.2},{id:'second-score-and-comparison',start:31.8,end:41.2}],records=[];
for(const s of segments){
 const rel='qa/read-continuity-'+s.id+'.mp4',out=file(rel),duration=Number((s.end-s.start).toFixed(3));
 await run(FF,['-hide_banner','-v','error','-ss',String(s.start),'-i',np(movie),'-t',String(duration),'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','17','-c:a','aac','-b:a','192k','-movflags','+faststart','-y',np(out)],'read-continuity-'+s.id+'.json');
 const probe=parse((await run(FP,['-v','error','-show_format','-show_streams','-of','json',np(out)],'read-continuity-'+s.id+'-probe.json')).stdout);if(Math.abs(Number(probe.format.duration)-duration)>.05)throw Error('Continuity clip duration');
 const dir=file('qa/read-sequence/'+s.id);fs.mkdirSync(dir,{recursive:true});if(fs.readdirSync(dir).length)throw Error('Preserve existing continuity frames');
 await run(FF,['-hide_banner','-v','error','-ss',String(s.start),'-i',np(movie),'-t',String(duration),'-an','-vf','select=not(mod(n\\,5))','-fps_mode','vfr','-q:v','2','-y',np(dir+'/frame-%03d.jpg')],'read-sequence-'+s.id+'.json');
 const frames=fs.readdirSync(dir).filter(n=>n.endsWith('.jpg')).sort().map((name,i)=>({file:'qa/read-sequence/'+s.id+'/'+name,nominalMasterTime:Number((s.start+i/6).toFixed(6)),sha256:hash(dir+'/'+name)}));
 records.push({...s,clip:rel,clipSha256:await digest(out),clipDuration:Number(probe.format.duration),clipVideoFrames:probe.streams.find(x=>x.codec_type==='video').nb_frames,sampling:'Every5th decoded frame at native30fps: 6fps sequence; nominal source time=start+index/6',frames});
}
const layout=JSON.parse(fs.readFileSync(file('qa/layout-story-block.json'))),labels=layout.boxes.filter(b=>/current gain|cumulative|awarded role/.test(b.name));
save('qa/read-continuity.json',{status:'PASS_FINAL_NATIVE_AV_EXCERPTS_AND_6FPS_SEQUENCE_CREATED',finalMasterSha256:await digest(movie),segments:records,totalSampledFrames:records.reduce((n,r)=>n+r.frames.length,0),nativeLabels:labels,annotationOrder:'role → current +1 → actual UI score row → cumulative total',priorMasterKept:true,voiceNineCuesUnchanged:true,coreRmsBindingUnchanged:true,rootReadFixAccepted:false,wholeSubjectiveWatch:false,wholeSubjectiveListen:false,notFull600Master:true});
console.log(JSON.stringify({continuityClips:records.length,sampledFrames:records.reduce((n,r)=>n+r.frames.length,0)}));
