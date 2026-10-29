import fs from'node:fs';
import {stage,native,ff,hash,save}from'./background.mjs';
const root=stage+'/pilot02',D=32,project=root+'/projects/pilot02.ecproj',picture=root+'/media/pilot02-picture.mov';
const resume=process.env.PROJECTP146_PILOT02_RESUME==='audio';
if(fs.existsSync(picture)&&!resume)throw Error('Do not duplicate existing pilot02 picture');
if(resume&&JSON.parse(fs.readFileSync(root+'/qa/effectcraft-render.json')).code!==0)throw Error('No successful existing picture');
if(!resume){
const patch=`function r(i,p){return app.run(i,p||{});}function s(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function label(n,v,a,b,x,y,z){var l=r('layer.newText',{name:n,text:v,font:'Meiryo',style:'Regular',size:z,fill:'#66717c',position:[x,y],justify:'center'}).layer;var q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);s(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);s(l,'transform/position',[x,y,0]);r('layer.timing',{layers:[l],in:a,out:b});}label('Automated comparison scope','比較用の自動入力',0,32,640,699,20);label('Slow same update','比較スロー',2,6,1150,129,21);label('Slow fixed case','比較スロー',16,18.3,1150,129,21);label('Slow buffer case','比較スロー',18.3,32,1150,129,21);`;
fs.writeFileSync(root+'/source/labels.jsx',patch);
await native('effectcraft',['--project',project,'script',root+'/source/labels.jsx','--save','--json'],root+'/qa/effectcraft-label-fix.json');
await native('effectcraft',['--project',project,'info','--json'],root+'/qa/effectcraft-final-reopen.json');
// The saved native composition is rendered directly; no running desktop app is used.
await native('effectcraft',['--project',project,'render','--comp','EMBERWAKE devstory pilot02','--out',picture,'--format','prores','--prores','standard','--audio','off','--progress','--json'],root+'/qa/effectcraft-render.json');
}
const scripts=[
 [0.10,'一瞬押しただけなのに、大きく跳ぶことがありました。',3.6],
 [3.85,'押す、離す。この二つが、同じ更新の間に来たときです。',4.0],
 [8.05,'離した合図が、跳ぶ前に消えていました。',3.0],
 [11.15,'そこで、跳ぶ瞬間まで合図を残します。',3.1],
 [14.4,'長押しの高さはそのまま。一瞬で離したときは、小さく。',5.0],
 [20.0,'では、着地の直前に離したら。',3.0],
 [24.0,'地面に着くまで意図を残せるか。もう一つ、比べてみます。',6.9]
],cues=[];
for(let i=0;i<scripts.length;i++){
 const[at,text,max]=scripts[i],existing=root+'/media/voice-'+i+'.wav',q=resume?JSON.parse(fs.readFileSync(root+'/source/voice-query-'+i+'.json')):await(await fetch('http://127.0.0.1:50031/audio_query?text='+encodeURIComponent(text)+'&speaker=11',{method:'POST'})).json();if(!resume){q.speedScale=1.12;q.prePhonemeLength=.03;q.postPhonemeLength=.12;q.outputSamplingRate=48000;q.outputStereo=true;}
 const length=()=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
 if(length()>max)q.speedScale=Math.min(1.4,q.speedScale*length()/(max-.08));if(length()>max)throw Error('Cue will overrun '+i);
 const file=existing;if(!resume){const res=await fetch('http://127.0.0.1:50031/synthesis?speaker=11',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});if(!res.ok)throw Error('synthesis'+res.status);fs.writeFileSync(file,Buffer.from(await res.arrayBuffer()));save(root+'/source/voice-query-'+i+'.json',q);}cues.push({id:i,at,text,predictedDuration:length(),file,sha256:hash(file)});
}
const delays=cues.map((c,i)=>`[${i}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)}[v${i}]`);delays.push(cues.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${cues.length}:normalize=0,apad,atrim=duration=${D}[out]`);
if(!resume)await ff([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',delays.join(';'),'-map','[out]','-c:a','pcm_s24le',root+'/media/narration.wav'],root+'/qa/narration.json');
const cipher='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-05-real-round/media/cipher-source.mp3';
await ff(['-i',cipher,'-i',root+'/media/narration.wav','-filter_complex',`[0:a]atrim=start=0.824:duration=${D},asetpts=PTS-STARTPTS,loudnorm=I=-31:TP=-8:LRA=7,afade=t=in:d=0.03,afade=t=out:st=31.5:d=0.5[m];[1:a]asplit=2[sc][voice];[m][sc]sidechaincompress=threshold=.008:ratio=5:attack=8:release=180[b];[b][voice]amix=inputs=2:normalize=0,atrim=duration=${D}[out]`,'-map','[out]','-c:a','pcm_s24le',root+'/media/mix.wav'],root+'/qa/mix.json');
const fc=root+'/projects/pilot02.fcproj',video=root+'/videos/emberwake-devstory-pilot02.mp4';
const build=await native('filmcraft',['--save-as',fc,'run','-'],root+'/qa/filmcraft-build.json',[
 {id:'file.newProject',params:{name:'146 Native pilot02'}},{id:'file.newSequence',params:{name:'146 revised opening',width:1280,height:720,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[picture,root+'/media/mix.wav']}}
].map(c=>JSON.stringify(c)).join('\n')+'\n');
let items;for(const line of build.stdout.trim().split(/\r?\n/)){const v=JSON.parse(line);if(v.ok===false)throw Error(line);if(v.result?.items)items=v.result.items;}if(items?.length!==2)throw Error('Native import count');
await native('filmcraft',['--project',fc,'--save','run','-'],root+'/qa/filmcraft-place.json',[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:D*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:D*254016000000,video:false,audio:true}}].map(c=>JSON.stringify(c)).join('\n')+'\n');
await native('filmcraft',['--project',fc,'inspect'],root+'/qa/filmcraft-reopen.json');
const exp=await native('filmcraft',['--project',fc,'exec','file.exportMedia',JSON.stringify({path:video,format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:18,hardwareEncoding:'off',gpuRendering:'off',wait:true})],root+'/qa/filmcraft-export.json');
if(exp.stdout.includes('offlineMedia')&&JSON.parse(exp.stdout).offlineMedia?.length)throw Error('Offline media');
save(root+'/qa/pilot-binding.json',{issue:146,state:'32s native revised editorial pilot; full length not completed',file:video,sha256:hash(video),duration:D,cues,photocraftSha:hash(root+'/projects/editorial-paper.pcraft'),effectcraftSha:hash(project),filmcraftSha:hash(fc),native3SaveReopenRendered:true,naturalNotInPilot:true,sharedGuiActions:0,subjectiveListen:false,published:false});
console.log(JSON.stringify({ready:true,video,sha256:hash(video)}));
