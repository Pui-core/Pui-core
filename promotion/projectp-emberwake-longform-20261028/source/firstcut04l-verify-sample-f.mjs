import fs from 'node:fs';import path from 'node:path';
import {np,PC,EC,FC,run,parse} from './native.mjs';
const v=process.argv[2];if(!/^v(?:10|11)$/.test(v))throw Error('v10 or v11 required');
const dest=`/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04l-pilot-${v}-F`,manifest=path.join(dest,'qa/stage-manifest.json');if(!fs.existsSync(manifest))throw Error('stage incomplete');
const c=`EMBERWAKE 記憶と手帳 creative sample ${v}`,results={version:v,ec:[],fc:[],pc:false,subjectiveListen:false,wholeDirectWatch:false,selected:false,published:false};
for(let i=1;i<=2;i++){
 const p=path.join(dest,`projects/firstcut04l-story-pilot-${v}-${i}.ecproj`),name=`firstcut04l-${v}-F-ec-${i}`;
 const m=parse((await run(EC,['--project',np(p),'--save','run','footage.check','{"wait":true}','footage.missing','{}','--json'],name+'-media.json')).stdout);const missing=m.result?.find(x=>x.command==='footage.missing')?.result?.missing;if(!Array.isArray(missing)||missing.length)throw Error('EC missing '+i);
 await run(EC,['--project',np(p),'render-frame','--comp',c,'--time','2','--out',np(path.join(dest,`qa/${name}.png`)),'--json'],name+'-frame.json');results.ec.push({part:i,missing:0});
}
for(const n of [`firstcut04l-story-pilot-${v}-1`,`firstcut04l-story-pilot-${v}-2`,`firstcut04l-story-pilot-assembly-${v}`,`firstcut04l-story-pilot-bgm-assembly-${v}`]){
 const p=path.join(dest,`projects/${n}.fcproj`),name=`${n}-F`;const status=parse((await run(FC,['--project',np(p),'exec','media.status'],name+'-status.json')).stdout);if(!Array.isArray(status)||status.length<2||status.some(x=>x.status!=='online'))throw Error('FC offline '+n);
 await run(FC,['--project',np(p),'--save','render','--seconds','2','--out',np(path.join(dest,`qa/${name}.png`))],name+'-frame.json');results.fc.push({project:n,online:status.length});
}
const p=path.join(dest,'projects/traveler-material.pcraft'),reopen=path.join(dest,'projects/traveler-material-reopened.pcraft');await run(PC,['run',np(p),'--out',np(reopen)],`firstcut04l-${v}-F-pc-open.json`);await run(PC,['convert',np(reopen),np(path.join(dest,'qa/traveler-material-reopened.png')),'--format','png'],`firstcut04l-${v}-F-pc-convert.json`);results.pc=true;
fs.writeFileSync(path.join(dest,'qa/reopen-report.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results));
