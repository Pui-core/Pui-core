import {file,np,EC,run} from './native.mjs';
for(const t of [1,4,6.9,9.8,13]) await run(EC,['--project',np(file('projects/truthorlie-vertical-v5.ecproj')),'render-frame','--comp','Truth or Lie vertical fictional duel v5','--time',String(t),'--out',np(file(`qa/layout-v5-${t}.png`)),'--json'],`ec-layout-v5-${t}.json`);
console.log('Representative frame images rendered.');
