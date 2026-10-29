import fs from'node:fs';import path from'node:path';import{stage,ff,save,hash}from'./background.mjs';
const root=stage+'/devstory-v01';for(const d of['source','media','qa','projects','videos','covers','private'])fs.mkdirSync(root+'/'+d,{recursive:true});
const draft='/home/pui/tmp/projectp146-script-draft/146制作秘話_cue案_v01.json',script=JSON.parse(fs.readFileSync(draft));
const existing=root+'/qa/full-voice-binding.json';if(fs.existsSync(existing))throw Error('Preserve existing full voice');
console.log(JSON.stringify({phase:'full-voice',pid:process.pid,root,expectedDuration:632}));
const cues=script.cues.filter(c=>c.section!=='OPEN').map(c=>({...c,start:c.start+2,end:c.end+2,at:c.start+2.12,ttsText:c.ttsText.replaceAll('長押し','ながおし').replaceAll('短押し','短く押す操作')}));
const intro=JSON.parse(fs.readFileSync(stage+'/pilot02/qa/pilot02-r4-binding.json'));
const readOverride={'J-01':'まず、ふつうに短く押した場合を並べます。どちらも低く跳べています。直したかったのは、すべてのジャンプを大きく変えることではありません。入力が、意図と違う動きへ変わる条件です。'};
for(const c of cues){
 if(readOverride[c.id])c.ttsText=readOverride[c.id];
 const queryFile=root+'/source/query-'+c.id+'.json',wav=root+'/media/voice-'+c.id+'.wav';
 if(fs.existsSync(queryFile)||fs.existsSync(wav))throw Error('Preserve prior voice candidate '+c.id);
 const response=await fetch('http://127.0.0.1:50031/audio_query?text='+encodeURIComponent(c.ttsText)+'&speaker=11',{method:'POST'});if(!response.ok)throw Error('query '+c.id);
 const q=await response.json();q.speedScale=1.12;q.prePhonemeLength=.035;q.postPhonemeLength=.13;q.outputSamplingRate=48000;q.outputStereo=true;
 const len=()=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+.165;
 const available=c.end-c.at-.12;if(len()>available)q.speedScale=Math.min(1.27,q.speedScale*len()/(available-.1));if(len()>available)throw Error('Narration does not fit '+c.id+' '+len());
 save(queryFile,q);c.query=queryFile;c.predictedDuration=len();c.kana=q.kana;c.moras=q.accent_phrases.map(a=>a.moras.map(m=>m.text).join('')).join('/');
 const audio=await fetch('http://127.0.0.1:50031/synthesis?speaker=11',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});if(!audio.ok)throw Error('synthesis '+c.id);
 fs.writeFileSync(wav,Buffer.from(await audio.arrayBuffer()));c.file=wav;c.sha256=hash(wav);console.log(JSON.stringify({cue:c.id,at:c.at,predictedDuration:c.predictedDuration,kana:c.kana}));
}
function bounds(file){const b=fs.readFileSync(file);let bits,channels,rate,offset,bytes;for(let p=12;p+8<b.length;){const n=b.readUInt32LE(p+4),id=b.toString('ascii',p,p+4);if(id==='fmt '){channels=b.readUInt16LE(p+10);rate=b.readUInt32LE(p+12);bits=b.readUInt16LE(p+22);}if(id==='data'){offset=p+8;bytes=n;}p+=8+n+n%2;}if(![16,24].includes(bits))throw Error('PCM format');const stride=bits/8*channels,n=Math.floor(bytes/stride),scale=2**(bits-1);let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(b.readIntLE(offset+i*stride,bits/8)/scale));let first=-1,last=-1;for(let i=0;i<n;i++)if(Math.abs(b.readIntLE(offset+i*stride,bits/8)/scale)>Math.max(.0003,peak*.002)){if(first<0)first=i;last=i;}return{start:first/rate,end:(last+1)/rate,seconds:n/rate,peak};}
const all=[...intro.cues.map(c=>({...c,id:'OPEN-'+c.id})),...cues];for(const c of all)c.active=bounds(c.file);
for(let i=0;i<all.length-1;i++)if(all[i].at+all[i].active.end+.025>all[i+1].at+all[i+1].active.start)throw Error('Voice overlap '+all[i].id);
save(root+'/source/full-cues.json',{issue:146,duration:632,cues,opening:'pilot02-r4 actual accepted candidate; keep picture and original voice cues',sourceScriptSha:hash(draft),facts:script.facts,forbiddenExposure:script.forbiddenExposure});
save(root+'/qa/voice-preflight.json',{cues:all,allNonOverlapping:true,subjectiveListen:false,readingReviewPending:true});
const filter=cues.map((c,i)=>`[${i+1}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)}[v${i}]`);filter.push('[0:a]apad,atrim=duration=632[intro]');filter.push('[intro]'+cues.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${cues.length+1}:normalize=0,apad,atrim=duration=632[out]`);
const narration=root+'/media/narration.wav';await ff(['-i',stage+'/pilot02/media/narration-r4.wav',...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filter.join(';'),'-map','[out]','-c:a','pcm_s24le',narration],root+'/qa/narration-build.json');
save(existing,{issue:146,duration:632,speaker:11,credit:'VOICEVOX:玄野武宏',file:narration,sha256:hash(narration),cues:all,allNonOverlapping:true,subjectiveListen:false,readingReviewPending:true});console.log(JSON.stringify({fullVoiceReady:true,narration,sha256:hash(narration),cues:all.length}));
