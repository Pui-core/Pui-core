import fs from 'node:fs';
import {file,np,FF,run,save,hash,copy} from './native.mjs';
const duration=19.2,base='http://127.0.0.1:50031',speaker=11;
const req=async(route,opts)=>{const r=await fetch(base+route,opts);if(!r.ok)throw Error('VOICEVOX '+r.status);return r;};
const version=await(await req('/version')).json(),speakers=await(await req('/speakers')).json();if(speakers.find(s=>s.styles.some(v=>v.id===speaker))?.name!=='玄野武宏')throw Error('Unexpected speaker');
const cues=[
{id:'hook',at:.16,end:3.10,text:'外れた一票。得点するのは、どっち？'},
{id:'rule',at:3.36,end:6.10,text:'この回、五つの回答に、嘘は一つ。'},
{id:'vote',at:6.32,end:9.50,text:'投票は二番。でも、嘘は五番。'},
{id:'result',at:9.76,end:13.45,text:'全員が外したので、出題側に一点。'},
{id:'title',at:13.44,end:16.15,text:'自作ゲーム、うそか、まことか。'},
{id:'cta',at:16.80,end:18.75,text:'アイフォーンで配信中。'}
],results=[];
for(const c of cues){const q=await(await req('/audio_query?text='+encodeURIComponent(c.text)+'&speaker='+speaker,{method:'POST'})).json();q.speedScale=1.13;q.prePhonemeLength=.035;q.postPhonemeLength=.13;q.outputSamplingRate=48000;q.outputStereo=true;
const length=()=>q.accent_phrases.reduce((s,a)=>s+a.moras.reduce((n,m)=>n+(m.consonant_length||0)+m.vowel_length,0)+(a.pause_mora?.vowel_length||0),0)/q.speedScale+q.prePhonemeLength+q.postPhonemeLength;
if(length()>c.end-c.at-.08)q.speedScale=Math.min(1.3,q.speedScale*length()/(c.end-c.at-.08));if(length()>c.end-c.at)throw Error('Phrase will not fit '+c.id);
const r=await req('/synthesis?speaker='+speaker,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});const name=`voice-real-v9-${c.id}.wav`;fs.writeFileSync(file('media/'+name),Buffer.from(await r.arrayBuffer()));save('source/voice-real-v9-'+c.id+'-query.json',q);results.push({...c,file:name,sha256:hash(file('media/'+name)),predictedDuration:length(),speed:q.speedScale,kana:q.kana});}
const args=['-hide_banner','-v','error','-y'];for(const c of results)args.push('-i',np(file('media/'+c.file)));const filter=results.map((c,i)=>`[${i}:a]adelay=${Math.round(c.at*1000)}|${Math.round(c.at*1000)}[v${i}]`);filter.push(results.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${results.length}:normalize=0:duration=longest,apad,atrim=duration=${duration}[voice]`);
await run(FF,[...args,'-filter_complex',filter.join(';'),'-map','[voice]','-ar','48000','-c:a','pcm_s24le',np(file('media/narration-real-v9.wav'))],'real-v9-voice.json');
const fx='/mnt/f/Videos/ProjectP-Missyou15-Preview-2026-10-28/revision-06-speed/media';for(const n of ['air-speed06.wav','tick-speed06.wav','chime-speed06.wav'])copy(fx+'/'+n,file('media/'+n));
const events=[{at:1.6,s:0},{at:3.2,s:0},{at:4,s:0},{at:4.8,s:0},{at:6.0,s:1},{at:7.2,s:1},{at:8.4,s:0},{at:10.4,s:2},{at:12,s:0},{at:14.4,s:0},{at:16.8,s:1}];
const filters=[],out=[];for(let s=0;s<3;s++){const a=events.map((e,i)=>e.s===s?i:null).filter(i=>i!==null);filters.push(`[${s}:a]asplit=${a.length}`+a.map(i=>`[e${i}]`).join(''));}events.forEach((e,i)=>{filters.push(`[e${i}]adelay=${e.at*1000}|${e.at*1000}[s${i}]`);out.push(`[s${i}]`);});filters.push(out.join('')+`amix=inputs=${events.length}:normalize=0:duration=longest,volume=0.8,apad,atrim=duration=${duration}[out]`);
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/air-speed06.wav')),'-i',np(file('media/tick-speed06.wav')),'-i',np(file('media/chime-speed06.wav')),'-filter_complex',filters.join(';'),'-map','[out]','-ar','48000','-c:a','pcm_s24le',np(file('media/sfx-real-v9.wav'))],'real-v9-sfx.json');
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/cipher-source.mp3')),'-i',np(file('media/narration-real-v9.wav')),'-filter_complex',`[0:a]atrim=start=0.824:duration=${duration},asetpts=PTS-STARTPTS,loudnorm=I=-27:LRA=7:TP=-6,volume=0.45,afade=t=in:st=0:d=0.03,afade=t=out:st=${duration-.40}:d=0.40[m];[m][1:a]sidechaincompress=threshold=0.055:ratio=2.2:attack=12:release=180,apad,atrim=duration=${duration}[out]`,'-map','[out]','-ar','48000','-c:a','pcm_s24le',np(file('media/musicbed-real-v9-premix.wav'))],'real-v9-musicbed.json');
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/musicbed-real-v9-premix.wav')),'-af','volume=0.666666666667','-ar','48000','-c:a','pcm_s24le',np(file('media/musicbed-real-v9.wav'))],'real-v9-musicbed-balance.json');
save('qa/real-v9-audio-binding.json',{duration,speaker:'VOICEVOX:玄野武宏',speakerId:speaker,version,cues:results,events,sourceWavsPreserved:true,music:'Cipher / Kevin MacLeod',nominalBpm:150,musicSourceIn:.824,musicProcessing:{loudnorm:{I:-27,LRA:7,TP:-6},level:.45,postPcmGain:2/3,sidechain:{threshold:.055,ratio:2.2,attackMs:12,releaseMs:180}},wholeSubjectiveListen:false});console.log('Six commentary cues and separate original editorial SFX/Cipher music tracks generated.');
