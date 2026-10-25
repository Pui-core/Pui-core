import fs from 'node:fs';import {spawn} from 'node:child_process';
const cues=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),dest=process.argv[3],base='http://127.0.0.1:50026';
// Finite headless synthesis. Preserve occupied ports; close only the owned process.
let preexisting=false;try{preexisting=(await fetch(base+'/version',{signal:AbortSignal.timeout(1000)})).ok;}catch{}
if(preexisting)throw Error('Owned synthesis port occupied; preserve existing server');
const child=spawn('C:\\Program Files\\VOICEVOX\\vv-engine\\run.exe',['--host','127.0.0.1','--port','50026','--cpu_num_threads','2','--disable_mutable_api','--output_log_utf8'],{cwd:'C:\\Program Files\\VOICEVOX\\vv-engine',windowsHide:true,stdio:['ignore','ignore','pipe']});
let errors='';child.stderr.on('data',d=>errors+=d);let closed=false;child.on('close',()=>closed=true);
try{
 let ready=false;for(let i=0;i<90;i++){if(closed)throw Error('Engine exited '+errors.slice(-1200));try{ready=(await fetch(base+'/version',{signal:AbortSignal.timeout(1000)})).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Engine readiness timeout');
 const speakers=await(await fetch(base+'/speakers')).json(),speaker=speakers.find(x=>x.styles.some(s=>s.id===13));if(speaker?.name!=='青山龍星')throw Error('Speaker mismatch');const result=[];
 for(let i=0;i<cues.length;i++){
  const c=cues[i],q=await(await fetch(base+'/audio_query?text='+encodeURIComponent(c.text)+'&speaker=13',{method:'POST'})).json();q.speedScale=1.12;q.intonationScale=1.10;q.prePhonemeLength=.035;q.postPhonemeLength=.10;q.outputSamplingRate=48000;q.outputStereo=true;
  const length=q=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((z,m)=>z+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
  let d=length(q);if(d>c.end-c.at){q.speedScale=Math.min(1.45,q.speedScale*d/(c.end-c.at-.03));d=length(q);}if(d>c.end-c.at)throw Error('Voice cue does not fit');
  const r=await fetch(base+'/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});if(!r.ok)throw Error(await r.text());const name='voice-'+(i+1)+'.wav';fs.writeFileSync(dest+'/'+name,Buffer.from(await r.arrayBuffer()));fs.writeFileSync(dest+'/voice-'+(i+1)+'-query.json',JSON.stringify(q,null,2));result.push({...c,file:name,predictedDuration:d,speedScale:q.speedScale});
 }
 console.log(JSON.stringify({speaker:speaker.name,style:'ノーマル',styleId:13,credit:'VOICEVOX:青山龍星',engineVersion:await(await fetch(base+'/version')).json(),headlessOwnedFiniteEngine:true,cues:result}));
}finally{if(!closed){child.kill();await new Promise(resolve=>{child.once('close',resolve);setTimeout(resolve,5000);});}if(!closed)throw Error('Owned engine cleanup unconfirmed');}
