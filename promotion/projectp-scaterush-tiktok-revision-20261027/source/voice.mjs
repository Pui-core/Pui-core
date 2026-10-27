import fs from 'node:fs';
import {file,save,hash} from './native.mjs';
const base=process.env.PROJECTP_VOICEVOX_URL||'http://127.0.0.1:50031';
const get=async(route,options)=>{const r=await fetch(base+route,options);if(!r.ok)throw Error(route+': '+await r.text());return r;};
const version=await(await get('/version')).json();
const speakers=await(await get('/speakers')).json();
const speaker=speakers.find(s=>s.styles.some(v=>v.id===13));
if(speaker?.name!=='青山龍星')throw Error('Speaker13 does not match the authorized narrator');
const cues=JSON.parse(fs.readFileSync(file('source/narration-cues.json'),'utf8'));
const prior=fs.existsSync(file('qa/narration.json'))?JSON.parse(fs.readFileSync(file('qa/narration.json'),'utf8')).cues:[];
const progress=fs.existsSync(file('qa/narration-progress.json'))?JSON.parse(fs.readFileSync(file('qa/narration-progress.json'),'utf8')).cues:[];
const old=[...progress,...prior.filter(c=>!progress.some(p=>p.id===c.id))];
const result=[];
for(const c of cues){
 const frozen=old.find(x=>x.id===c.id&&x.text===c.text&&x.speedScale===1.08);
 if(frozen&&fs.existsSync(file('media/'+frozen.file))&&hash(file('media/'+frozen.file))===frozen.sha256){result.push({...frozen,...c});console.log(JSON.stringify({file:frozen.file,frozenWaveReused:true,at:c.at}));continue;}
 const q=await(await get('/audio_query?text='+encodeURIComponent(c.text)+'&speaker=13',{method:'POST'})).json();
 q.speedScale=1.08;q.intonationScale=1.02;q.prePhonemeLength=.07;q.postPhonemeLength=.18;q.outputSamplingRate=48000;q.outputStereo=true;
 const length=()=>q.accent_phrases.reduce((sum,a)=>sum+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
 if(length()>c.end-c.at)throw Error('Rewrite or reschedule narration; natural rate does not fit '+c.id+' '+length());
 const response=await get('/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});
 const name='voice-'+c.id+'.wav';
 fs.writeFileSync(file('media/'+name),Buffer.from(await response.arrayBuffer()));
 save('source/voice-'+c.id+'-query.json',q);
 result.push({...c,file:name,predictedDuration:length(),speedScale:q.speedScale,sha256:hash(file('media/'+name))});
 save('qa/narration-progress.json',{complete:false,cues:result});
 console.log(JSON.stringify({file:name,at:c.at,duration:length()}));
}
save('qa/narration.json',{engine:'VOICEVOX',engineVersion:version,speaker:speaker.name,styleId:13,style:'ノーマル',credit:'VOICEVOX:青山龍星',voiceActorRecording:false,wholeDirectAudition:false,cues:result});
