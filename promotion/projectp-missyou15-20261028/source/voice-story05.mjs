import fs from 'node:fs';
import {file,np,FF,run,save,hash} from './native.mjs';
const base='http://127.0.0.1:50031', speaker=11, duration=404/30;
const req=async(route,options)=>{const r=await fetch(base+route,options);if(!r.ok)throw Error(`${route} HTTP ${r.status}`);return r;};
const version=await(await req('/version')).json();
const speakers=await(await req('/speakers')).json();
if(speakers.find(x=>x.styles.some(s=>s.id===speaker))?.name!=='玄野武宏')throw Error('unexpected speaker');
const cues=[
 {at:.16,end:2.74,text:'この手紙、まだ開けません。'},
 {at:3.02,end:5.64,text:'スタンプをひとつ、送ると。'},
 {at:5.96,end:9.25,text:'ふたりの今日が、一ページに。'},
 {at:9.85,end:13.12,text:'ミスユー、新しい部屋を制作中。'}
],results=[];
for(let i=0;i<cues.length;i++){
 const c=cues[i],q=await(await req('/audio_query?text='+encodeURIComponent(c.text)+'&speaker='+speaker,{method:'POST'})).json();
 q.speedScale=1.1;q.prePhonemeLength=.035;q.postPhonemeLength=.14;q.outputSamplingRate=48000;q.outputStereo=true;
 const length=()=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
 if(length()>c.end-c.at-.08)q.speedScale=Math.min(1.3,q.speedScale*length()/(c.end-c.at-.08));
 if(length()>c.end-c.at)throw Error('voice cue does not fit');
 const wav=await req('/synthesis?speaker='+speaker,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});
 const name=`voice-story05-kurono-${i+1}.wav`;
 fs.writeFileSync(file('media/'+name),Buffer.from(await wav.arrayBuffer()));
 save(`source/voice-story05-kurono-${i+1}-query.json`,q);
 results.push({...c,file:name,sha256:hash(file('media/'+name)),predictedDuration:length(),speed:q.speedScale,kana:q.kana});
}
const args=['-hide_banner','-v','warning','-y'];for(const c of results)args.push('-i',np(file('media/'+c.file)));
const filters=results.map((c,i)=>`[${i}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)}[v${i}]`);
filters.push('[v0][v1][v2][v3]amix=inputs=4:normalize=0:duration=longest,apad,atrim=duration='+duration+'[voice]');
await run(FF,[...args,'-filter_complex',filters.join(';'),'-map','[voice]','-ar','48000','-c:a','pcm_s24le',np(file('media/narration-story05-kurono.wav'))],'story05-kurono-voice-assembly.json');
save('qa/story05-kurono-voice-cues.json',{speaker:'VOICEVOX:玄野武宏',speakerId:speaker,version,duration,cues:results,wholeSubjectiveListen:false,previousWavsPreserved:true});
console.log('Story voice rendered and earlier narration retained.');
