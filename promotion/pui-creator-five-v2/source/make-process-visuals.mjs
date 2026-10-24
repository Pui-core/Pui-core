import {FF,np,file,run,hash,save} from './native.mjs';
const base='/mnt/e/Desktop/音源/medicate/';
const sources=[base+'MIX_v5_KeyFix/medicate_MIX_v5_KeyFix.wav',base+'MIX_v6_Natural/medicate_MIX_v6_Natural.wav'];
const rows=[];for(const [i,source]of sources.entries()){const p=file('media/05-wave-'+(i?'after':'before')+'.png');await run(FF,['-v','error','-y','-ss','21.7','-t','3.4','-i',np(source),'-filter_complex','aformat=channel_layouts=mono,showwavespic=s=1000x360:colors='+(i?'0xa7f4da':'0xc6d4ff')+':split_channels=0,pad=1080:1920:40:780:color=0x08111b','-frames:v','1',np(p)]);rows.push({source,sourceSha256:hash(source),sourceAt:21.7,duration:3.4,output:p,outputSha256:hash(p)});}save('qa/process-waveforms.json',{kind:'Computed audio waveform, not a DAW/ChatGPT screenshot',rows});
