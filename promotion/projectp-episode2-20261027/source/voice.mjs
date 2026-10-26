import fs from 'node:fs';
import {file,save,hash} from './native.mjs';
const base=process.env.PROJECTP_VOICEVOX_URL||'http://127.0.0.1:50031';
const get=async(route,options)=>{const r=await fetch(base+route,options);if(!r.ok)throw Error(route+': '+await r.text());return r;};
const version=await(await get('/version')).json();
const speakers=await(await get('/speakers')).json();
const speaker=speakers.find(s=>s.styles.some(v=>v.id===13));
if(speaker?.name!=='青山龍星')throw Error('Existing speaker13 does not match the intended narrator');
const cues=JSON.parse(fs.readFileSync(file('source/narration-cues.json'),'utf8'));
const result=[];
for(let i=0;i<cues.length;i++){
 const c=cues[i];
 const q=await(await get('/audio_query?text='+encodeURIComponent(c.text)+'&speaker=13',{method:'POST'})).json();
 q.speedScale=1.06;q.intonationScale=1.04;q.prePhonemeLength=.045;q.postPhonemeLength=.15;q.outputSamplingRate=48000;q.outputStereo=true;
 const length=()=>q.accent_phrases.reduce((sum,a)=>sum+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
 if(length()>c.end-c.at)q.speedScale=Math.min(1.38,q.speedScale*length()/(c.end-c.at-.04));
 if(length()>c.end-c.at)throw Error('Narration does not fit without excessive speed: '+c.text);
 const r=await get('/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});
 const name='voice-'+String(i+1).padStart(2,'0')+'.wav';
 fs.writeFileSync(file('media/'+name),Buffer.from(await r.arrayBuffer()));
 save('source/'+name.replace('.wav','-query.json'),q);
 result.push({...c,file:name,predictedDuration:length(),speedScale:q.speedScale,sha256:hash(file('media/'+name))});
 console.log(JSON.stringify({file:name,at:c.at,predictedDuration:length()}));
}
save('qa/narration.json',{engine:'VOICEVOX',engineVersion:version,existingLocalEndpoint:base,speaker:speaker.name,styleId:13,style:'ノーマル',credit:'VOICEVOX:青山龍星',voiceActorRecording:false,wholeDirectAudition:false,cues:result});
