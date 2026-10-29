import fs from'node:fs';import{stage,ff,native,hash,save}from'./background.mjs';
const root=stage+'/pilot02',previous=JSON.parse(fs.readFileSync(root+'/qa/pilot-binding.json')),D=32;
if(fs.existsSync(root+'/qa/pilot02-r3-binding.json'))throw Error('Already fixed; no duplicate export');
const cues=previous.cues.filter(c=>c.id!==4);
for(const[id,at,text,max]of[['hold',12.12,'長押しの高さは、そのまま。',1.78],['normal',14.12,'短く押しても同じ。',1.78],['instant',16.12,'一瞬で離せば、小さく。',2.03]]){
 const q=await(await fetch('http://127.0.0.1:50031/audio_query?text='+encodeURIComponent(text.replaceAll('長押し','ながおし'))+'&speaker=11',{method:'POST'})).json();q.speedScale=1.13;q.prePhonemeLength=.025;q.postPhonemeLength=.10;q.outputSamplingRate=48000;q.outputStereo=true;
 const len=()=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+.125;if(len()>max)q.speedScale=Math.min(1.45,q.speedScale*len()/(max-.04));if(len()>max)throw Error('Cue fit '+id);
 const response=await fetch('http://127.0.0.1:50031/synthesis?speaker=11',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});if(!response.ok)throw Error('synthesis');const file=root+'/media/voice-r3-'+id+'.wav';fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));save(root+'/source/voice-query-r3-'+id+'.json',q);cues.push({id,at,text,predictedDuration:len(),file,sha256:hash(file)});
}
cues.sort((a,b)=>a.at-b.at);
const filter=cues.map((c,i)=>`[${i}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)}[v${i}]`);filter.push(cues.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${cues.length}:normalize=0,apad,atrim=duration=${D}[out]`);
const voice=root+'/media/narration-r3.wav',mix=root+'/media/mix-r3.wav';
await ff([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filter.join(';'),'-map','[out]','-c:a','pcm_s24le',voice],root+'/qa/narration-r3.json');
await ff(['-i','/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-05-real-round/media/cipher-source.mp3','-i',voice,'-filter_complex','[0:a]atrim=start=0.824:duration=32,asetpts=PTS-STARTPTS,loudnorm=I=-31:TP=-8:LRA=7,afade=t=in:d=0.03,afade=t=out:st=31.5:d=0.5[m];[1:a]asplit=2[sc][v];[m][sc]sidechaincompress=threshold=0.008:ratio=5:attack=8:release=180[b];[b][v]amix=inputs=2:normalize=0,atrim=duration=32[out]','-map','[out]','-c:a','pcm_s24le',mix],root+'/qa/mix-r3.json');
const picture=root+'/media/pilot02-picture.mov',fc=root+'/projects/pilot02-r3.fcproj',video=root+'/videos/emberwake-devstory-pilot02-r3.mp4';
const build=await native('filmcraft',['--save-as',fc,'run','-'],root+'/qa/filmcraft-r3-build.json',[{id:'file.newProject',params:{name:'146 pilot02 voice picture alignment fix'}},{id:'file.newSequence',params:{name:'146 native revised opening r3',width:1280,height:720,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[picture,mix]}}].map(c=>JSON.stringify(c)).join('\n')+'\n');let items;for(const line of build.stdout.trim().split(/\r?\n/)){const r=JSON.parse(line);if(r.ok===false)throw Error(line);if(r.result?.items)items=r.result.items;}if(items?.length!==2)throw Error('Native import');
await native('filmcraft',['--project',fc,'--save','run','-'],root+'/qa/filmcraft-r3-place.json',[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:D*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:D*254016000000,video:false,audio:true}}].map(c=>JSON.stringify(c)).join('\n')+'\n');
await native('filmcraft',['--project',fc,'inspect'],root+'/qa/filmcraft-r3-reopen.json');
await native('filmcraft',['--project',fc,'exec','file.exportMedia',JSON.stringify({path:video,format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:18,hardwareEncoding:'off',gpuRendering:'off',wait:true})],root+'/qa/filmcraft-r3-export.json');
await ff(['-i',video,'-map','0:v','-map','0:a','-f','null','-'],root+'/qa/full-decode-r3.json');
await ff(['-i',video,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'],root+'/qa/video-packet-r3.json');
await ff(['-i',previous.file,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'],root+'/qa/video-packet-first.json');
const a=JSON.parse(fs.readFileSync(root+'/qa/video-packet-r3.json')).stdout,b=JSON.parse(fs.readFileSync(root+'/qa/video-packet-first.json')).stdout;
save(root+'/qa/pilot02-r3-binding.json',{...previous,file:video,sha256:hash(video),cues,filmcraftSha:hash(fc),narrationSha:hash(voice),mixSha:hash(mix),pictureSha:hash(picture),pictureRenderedAgain:false,firstpassSha:previous.sha256,videoPacketHashesEqual:a===b,fullAVDecodeExit:0,alignmentFix:'12.12 hold /14.12 normal short /16.12 same-tick short voice aligned to actual shots',subjectiveListen:false});
console.log(JSON.stringify({ready:true,video,sha256:hash(video),videoPacketHashesEqual:a===b}));
