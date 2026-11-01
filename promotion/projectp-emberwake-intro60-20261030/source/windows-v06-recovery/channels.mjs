import fs from 'node:fs';import {analyzeAudioCues} from './attempt01/source/v06-checks.mjs';import {hash,save} from './attempt01/source/background.mjs';
const root='C:/Users/pui/private-use/emberwake-video156-20261101/attempt01';
const read=p=>{let b=fs.readFileSync(p);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const v=read(root+'/media/voice-r6.f32'),m=read(root+'/media/music-r6.f32'),s=read(root+'/media/sfx-r6.f32');
const channel=(a,c)=>{let b=new Float32Array(a.length);for(let i=0;i<a.length;i+=2)b[i]=b[i+1]=a[i+c];return b;};
const output=JSON.parse(fs.readFileSync(root+'/qa/output-binding-v06.json')),audio=JSON.parse(fs.readFileSync(root+'/qa/audio-binding-r6.json')),results=[];
for(const o of output.bindings){if(hash(o.file)!==o.sha256)throw Error('SHA mismatch');const a=read(root+'/qa/final-'+o.variant+'-audio.f32'),e=new Float32Array(v.length);for(let i=0;i<e.length;i++)e[i]=v[i]+s[i]+(o.variant==='bgm'?m[i]:0);
for(const c of [0,1]){const r=analyzeAudioCues({expected:channel(e,c),actual:channel(a,c),voice:channel(v,c),music:channel(m,c),cues:audio.cues});results.push({variant:o.variant,sha256:o.sha256,channel:c?'R':'L',...r});}}
save(root+'/qa/lr-aac-quality.json',{pass:true,results,subjectiveListen:false});console.log('L/R PASS',results.map(r=>[r.variant,r.channel,r.best.lag,Math.min(...r.cueChecks.flatMap(c=>[c.headCorrelation,c.tailCorrelation]))]));
