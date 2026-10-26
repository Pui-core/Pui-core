import fs from 'node:fs';import {file,np,EC,run} from './native.mjs';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'))),layout=JSON.parse(fs.readFileSync(file('qa/layout.json'))),p=file('projects/emberwake-longform.ecproj');
const points=[.5,4.5,12.5,edit.meaningfulUniqueSeconds+.5,edit.duration-1];
for(const e of edit.episodes)points.push(e.startFrame/30+2,e.playStartFrame/30+10,(edit.segments.find(s=>s.episode===e.id&&s.kind==='actual-result').startFrame+60)/30,(edit.segments.find(s=>s.episode===e.id&&s.kind==='actual-memory').startFrame+30)/30);
for(const m of layout.motions)points.push(m.peak,m.landing,m.merge);
let retained=0,rendered=0;
for(const t of [...new Set(points.map(x=>Math.round(x*30)/30))].sort((a,b)=>a-b)){
 const name='preview-'+t.toFixed(3),png=file('qa/'+name+'.png'),receipt=file('qa/'+name+'.json');
 if(fs.existsSync(png)){if(!fs.existsSync(receipt)||JSON.parse(fs.readFileSync(receipt)).exit!==0)throw Error('Existing PNG lacks a successful native receipt');retained++;continue;}
 await run(EC,['--project',np(p),'render-frame','--comp','EMBERWAKE Formal Longform','--time',String(t),'--out',np(png),'--json'],name+'.json');rendered++;
}
console.log(JSON.stringify({actualEcProject:p,retained,rendered,seconds:edit.duration,meaningfulSeconds:edit.meaningfulUniqueSeconds}));
