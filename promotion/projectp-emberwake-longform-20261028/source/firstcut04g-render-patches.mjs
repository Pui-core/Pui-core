import fs from 'node:fs';
import {file,np,EC,FP,run,parse,save,hash} from './native.mjs';
const E=JSON.parse(fs.readFileSync(file('source/firstcut04g-edit.json'))),project=file('projects/emberwake-firstcut04g.ecproj'),patches=[];
for(let i=0;i<E.repairWindows.length;i++){
  const [a,b]=E.repairWindows[i],rel='media/firstcut04g-picture-'+i+'.mov';
  if(fs.existsSync(file(rel)))throw Error('Retain existing 04g patch '+rel);
  await run(EC,['--project',np(project),'render','--comp',E.comp,'--start',String(a/30),'--end',String(b/30),'--out',np(file(rel)),'--format','prores','--prores','4444','--audio','off','--json'],'firstcut04g-range-'+i+'.json');
  const probe=parse((await run(FP,['-v','error','-count_frames','-show_streams','-of','json',np(file(rel))],'firstcut04g-probe-'+i+'.json')).stdout);
  if(Number(probe.streams.find(s=>s.codec_type==='video')?.nb_read_frames)!==b-a)throw Error('Patch frame mismatch '+i);
  patches.push({start:a,end:b,file:rel,frames:b-a,sha256:hash(file(rel))});console.log(JSON.stringify({stage:'patch-render',completed:i+1,total:E.repairWindows.length}));
}
save('qa/firstcut04g-picture-patches.json',{patches,frames:patches.reduce((n,p)=>n+p.frames,0),masterComplete:false,wholeDirectWatch:false,subjectiveListen:false});
