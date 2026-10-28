import fs from 'node:fs';
import {file,np,FF,run,save} from './native.mjs';
const n='firstcut04k-artinput-agent03';
const edit=JSON.parse(fs.readFileSync(file(`source/${n}-edit.json`)));
for(const [input,output] of [[`media/${n}-narration.wav`,`qa/${n}-reference.f32`],[`videos/${n}.mp4`,`qa/${n}-export.f32`]]) await run(FF,['-y','-v','error','-i',np(file(input)),'-vn','-ac','1','-ar','48000','-f','f32le',np(file(output))],`${n}-decode-${output.includes('reference')?'reference':'export'}.json`);
const ref=fs.readFileSync(file(`qa/${n}-reference.f32`)), out=fs.readFileSync(file(`qa/${n}-export.f32`));
const read=(b,i)=>i>=0&&i*4+4<=b.length?b.readFloatLE(i*4):0;
const checks=[];
for(const cue of edit.cues){
 let start=Math.round(cue.at*48000), end=Math.min(start+Math.round(cue.duration*48000),Math.floor(ref.length/4));
 let best={correlation:-1,lagSamples:null};
 for(let lag=-8;lag<=8;lag++){
  let aa=0,bb=0,ab=0;
  for(let i=start;i<end;i+=4){let a=read(ref,i),b=read(out,i+lag);aa+=a*a;bb+=b*b;ab+=a*b;}
  let correlation=ab/Math.sqrt(aa*bb);if(correlation>best.correlation)best={correlation,lagSamples:lag};
 }
 checks.push({id:cue.id,start:cue.at,duration:cue.duration,...best});
}
const result={checks,threshold:0.98,pass:checks.every(x=>x.correlation>0.98),note:'Correlation with source narration verifies placement and signal, not audibility, mix quality, full viewing, or subjective listening.'};
save(`qa/${n}-audio-correlation.json`,result);console.log(JSON.stringify(result,null,2));
