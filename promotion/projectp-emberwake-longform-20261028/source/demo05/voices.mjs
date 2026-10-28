import fs from 'node:fs';
import path from 'node:path';
import {sections} from './story.mjs';
import {file,hash,save} from '../native.mjs';
const base='http://127.0.0.1:50031',speaker=11;
const fetchOk=async(url,options={})=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('VOICEVOX '+r.status+' '+url);return r;};
const speakers=await(await fetchOk(base+'/speakers')).json(),version=await(await fetchOk(base+'/version')).json();
const selected=speakers.find(x=>x.name==='玄野武宏'&&x.styles.some(s=>s.id===speaker));if(!selected)throw Error('Required live narrator absent');
save('qa/demo05/voicevox-live.json',{observedAt:new Date().toISOString(),version,speaker,selected,localOnly:true});
const dir=file('media/demo05/voice');fs.mkdirSync(dir,{recursive:true});
function wavInfo(buf){let format,data;for(let p=12;p+8<=buf.length;){const id=buf.toString('ascii',p,p+4),n=buf.readUInt32LE(p+4);if(id==='fmt ')format={encoding:buf.readUInt16LE(p+8),channels:buf.readUInt16LE(p+10),sampleRate:buf.readUInt32LE(p+12),byteRate:buf.readUInt32LE(p+16),bits:buf.readUInt16LE(p+22)};if(id==='data')data={offset:p+8,bytes:n};p+=8+n+(n%2);}if(!format||!data||format.encoding!==1||format.bits!==16)throw Error('Expected PCM16 WAV');let first=-1,last=-1,peak=0;for(let i=0;i<data.bytes/2;i++){const v=Math.abs(buf.readInt16LE(data.offset+i*2));peak=Math.max(peak,v);if(v>100){if(first<0)first=i;last=i;}}return {...format,seconds:data.bytes/format.byteRate,firstAboveMinus50dB:first/format.sampleRate,lastAboveMinus50dB:last/format.sampleRate,samplePeak:peak/32768};}
const cues=[];
for(const section of sections)for(let i=0;i<section.units.length;i++){
 const [title,text,attempt,at,span]=section.units[i],id=section.id+'-'+String(i+1).padStart(2,'0'),wav=path.join(dir,id+'.wav'),receipt=file('qa/demo05/'+id+'-voice.json');
 if(fs.existsSync(wav)||fs.existsSync(receipt)){const old=JSON.parse(fs.readFileSync(receipt));if(old.text!==text||old.sha256!==hash(wav))throw Error('Retained cue mismatch: '+id);cues.push(old);continue;}
 const query=await(await fetchOk(base+'/audio_query?'+new URLSearchParams({text,speaker:String(speaker)}),{method:'POST'})).json();
 Object.assign(query,{speedScale:1.12,intonationScale:1.08,volumeScale:1,prePhonemeLength:.08,postPhonemeLength:.16,outputSamplingRate:48000,outputStereo:false});
 save('source/demo05/queries/'+id+'.json',query);
 const buf=Buffer.from(await(await fetchOk(base+'/synthesis?speaker='+speaker,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(query)})).arrayBuffer());
 fs.writeFileSync(wav,buf,{flag:'wx'});const info=wavInfo(buf);
 const c={id,section:section.id,title,text,attempt,at,span,wav:'media/demo05/voice/'+id+'.wav',sha256:hash(wav),query:'source/demo05/queries/'+id+'.json',speaker,voicevoxVersion:version,...info,subjectiveListen:false};save('qa/demo05/'+id+'-voice.json',c);cues.push(c);console.log(JSON.stringify({id,seconds:info.seconds}));
}
save('source/demo05/voiced-cues.json',{cues,seconds:cues.reduce((n,c)=>n+c.seconds,0),units:cues.length,narrator:'VOICEVOX:玄野武宏',subjectiveListen:false});
console.log(JSON.stringify({units:cues.length,rawVoiceSeconds:cues.reduce((n,c)=>n+c.seconds,0)}));
