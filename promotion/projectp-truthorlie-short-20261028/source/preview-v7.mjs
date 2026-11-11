import {file,np,EC,run} from './native.mjs';
for(const t of [1,4,6.9,9.8,13]) await run(EC,['--project',np(file('projects/truthorlie-vertical-v7.ecproj')),'render-frame','--comp','Truth or Lie vertical fictional duel v7','--time',String(t),'--out',np(file(`qa/layout-v7-${t}.png`)),'--json'],`ec-layout-v7-${t}.json`);
console.log('Representative frame images rendered.');
