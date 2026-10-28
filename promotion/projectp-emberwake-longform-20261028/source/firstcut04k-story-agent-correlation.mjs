import fs from 'node:fs';
import {file,np,FF,run,save} from './native.mjs';
const m=JSON.parse(fs.readFileSync(file('source/firstcut04k-story-agent-render-manifest.json'))),results=[];
for (const s of m.segments) {
 const n='firstcut04k-story-agent-'+s.part,e=JSON.parse(fs.readFileSync(file(s.source)));
 for (const [input,label] of [[`media/${n}-narration.wav`,'reference'],[s.video,'export']]) {
  const out=`qa/${n}-${label}-correlation.f32`;
  if (fs.existsSync(file(out))) throw Error('preserve existing '+out);
  await run(FF,['-v','error','-i',np(file(input)),'-vn','-ac','1','-ar','48000','-f','f32le',np(file(out))],`${n}-${label}-correlation-decode.json`);
 }
 const ref=fs.readFileSync(file(`qa/${n}-reference-correlation.f32`)),out=fs.readFileSync(file(`qa/${n}-export-correlation.f32`)), read=(b,i)=>i>=0&&i*4+4<=b.length?b.readFloatLE(i*4):0;
 for (const c of e.cues) {let start=Math.round((c.start+.05)*48000),end=Math.min(start+Math.round(c.duration*48000),Math.floor(ref.length/4)),best={correlation:-1,lagSamples:null};for(let lag=-8;lag<=8;lag++){let aa=0,bb=0,ab=0;for(let i=start;i<end;i+=4){let a=read(ref,i),b=read(out,i+lag);aa+=a*a;bb+=b*b;ab+=a*b;}let z=ab/Math.sqrt(aa*bb);if(z>best.correlation)best={correlation:z,lagSamples:lag};}results.push({part:s.part,id:c.id,...best});}
}
const result={results,threshold:.98,pass:results.every(x=>x.correlation>.98),note:'Verifies numerical timing/signal against each narration mix; not human listening, intelligibility, music, or viewer retention.'};save('qa/firstcut04k-story-agent-all-audio-correlation.json',result);console.log(JSON.stringify({count:results.length,pass:result.pass,min:Math.min(...results.map(x=>x.correlation)),maxAbsoluteLag:Math.max(...results.map(x=>Math.abs(x.lagSamples)))}));
