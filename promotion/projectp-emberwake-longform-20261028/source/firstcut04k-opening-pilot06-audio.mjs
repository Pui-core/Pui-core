import fs from 'node:fs';
import {file,np,FF,run,hash} from './native.mjs';
const spec=JSON.parse(fs.readFileSync(file('source/firstcut04k-opening-pilot04.json')));
const old=JSON.parse(fs.readFileSync(file('source/emberwake-firstcut04k-opening-pilot04-measured.json')));
spec.name='emberwake-firstcut04k-opening-pilot06';
spec.voices.find(v=>v.id==='u003').at=14.8;spec.voices.find(v=>v.id==='u004').at=18.3;
const output=file('media/'+spec.name+'-narration.wav'),target=file('source/firstcut04k-opening-pilot06.json');
if(fs.existsSync(output)||fs.existsSync(target))throw Error('Preserve existing output');
const inputs=[],filters=[];
for(const [i,v] of spec.voices.entries()){
 const prior=old.voices.find(x=>x.id===v.id);if(!prior||hash(file('media/'+prior.file))!==prior.sha256||v.at+prior.duration>v.windowEnd)throw Error('Voice mismatch '+v.id);
 inputs.push('-i',np(file('media/'+prior.file)));filters.push(`[${i}:a]adelay=${Math.round(v.at*48000)}S|${Math.round(v.at*48000)}S[v${i}]`);
}
filters.push(spec.voices.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${spec.voices.length}:normalize=0,volume=1.4,apad,atrim=duration=${spec.duration}[v]`);
await run(FF,['-v','error',...inputs,'-filter_complex',filters.join(';'),'-map','[v]','-c:a','pcm_s24le','-ar','48000',np(output)],'firstcut04k-opening-pilot06-voice-assembly.json');
fs.writeFileSync(target,JSON.stringify(spec,null,2)+'\n',{flag:'wx'});console.log('Voice starts after quote entry; subjective listening remains pending');
