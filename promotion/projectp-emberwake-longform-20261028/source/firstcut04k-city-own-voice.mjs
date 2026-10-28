import fs from 'node:fs';
import {file,hash,save} from './native.mjs';
const base=process.env.PROJECTP_VOICEVOX_URL||'http://127.0.0.1:50031';
const get=async(route,opts)=>{const r=await fetch(base+route,opts);if(!r.ok)throw Error(route+':'+r.status);return r;};
const version=await (await get('/version')).json(),prior=JSON.parse(fs.readFileSync(file('qa/narration.json')));
if(version!==prior.engineVersion||prior.speaker!=='青山龍星'||prior.styleId!==13)throw Error('voice identity mismatch');
const cues=[['cityown01','この場面では、重なる建物の輪郭が続き、夜空には丸い月が浮かびます。'],['cityown02','別の場面では、青みのある背景に、柱と建物が重なっています。']];
const out=[];for(const [id,text] of cues){const wav=file(`media/firstcut04k-${id}.wav`),query=`source/firstcut04k-${id}-query.json`;if(fs.existsSync(wav)||fs.existsSync(file(query)))throw Error('preserve previous output');const q=await (await get('/audio_query?text='+encodeURIComponent(text)+'&speaker=13',{method:'POST'})).json();Object.assign(q,{speedScale:1.06,intonationScale:1.04,prePhonemeLength:.045,postPhonemeLength:.15,outputSamplingRate:48000,outputStereo:true});const audio=await(await get('/synthesis?speaker=13',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)})).arrayBuffer();fs.writeFileSync(wav,Buffer.from(audio),{flag:'wx'});save(query,q);out.push({id,text,file:`media/firstcut04k-${id}.wav`,sha256:hash(wav),bytes:audio.byteLength});}
save('source/firstcut04k-city-own-voice.json',{version,speaker:'青山龍星',styleId:13,cues:out,subjectiveListen:false});console.log(JSON.stringify(out));
