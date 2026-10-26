import {file,np,EC,run,save,parse} from './native.mjs';
const p=np(file('projects/game-short.ecproj')),comp='ProjectP actual game short',layer='Original silent game and Core body +24frames';
const reads=[];
for(const t of [.8,1,5.6,15.4,20.7666667])reads.push({time:t,result:parse((await run(EC,['--project',p,'get',comp,layer,'timeRemap','--time',String(t),'--json'],'time-remap-'+t+'.json')).stdout)});
save('qa/time-remap-readback.json',reads);
await run(EC,['--project',p,'render','--comp',comp,'--out',np(file('media/game-short-picture.mov')),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'effectcraft-full-render.json');
