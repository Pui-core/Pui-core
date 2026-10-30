import {file,np,EC,run} from './native.mjs';
for(const t of [1,4,9.8,12.5,16]) await run(EC,['--project',np(file('projects/truthorlie-vertical-v2.ecproj')),'render-frame','--comp','Truth or Lie vertical fictional duel','--time',String(t),'--out',np(file(`qa/layout-v2-${t}.png`)),'--json'],`ec-layout-v2-${t}.json`);
console.log('Representative frame images rendered.');
