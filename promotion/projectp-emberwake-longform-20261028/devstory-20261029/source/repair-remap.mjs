import fs from 'node:fs';
import {stage,native,save,hash} from './background.mjs';
const root=stage+'/devstory-v01';
const layout=JSON.parse(fs.readFileSync(root+'/qa/layout-repairs.json'));
const specs=[['INTRO',stage+'/pilot02/projects/pilot02.ecproj','EMBERWAKE devstory pilot02',32,'opening'],...layout.reports.map(x=>[x.section,x.project,'146 '+x.section,{J:182,V:168,C:140,H:84}[x.section],'chapter-'+x.section]),['CLOSE',root+'/projects/chapter-CLOSE.ecproj','146 CLOSE',26,'chapter-CLOSE']];
const result=[];
function parsed(r){return JSON.parse(r.stdout);}
function merged(ranges,duration){const sorted=ranges.map(([a,b])=>[Math.max(0,Math.floor(a+1e-8)),Math.min(duration,Math.ceil(b-1e-8))]).sort((a,b)=>a[0]-b[0]),out=[];for(const r of sorted){if(out.length&&r[0]<=out.at(-1)[1]+1)out.at(-1)[1]=Math.max(out.at(-1)[1],r[1]);else out.push(r);}return out;}
for(const[section,input,comp,duration,stem]of specs){
 const receipt=root+'/qa/remap-'+section;
 const info=parsed(await native('effectcraft',['--project',input,'info','--json'],receipt+'-before-info.json'));
 const rows=parsed(await native('effectcraft',['--project',input,'run','keys.selectAll','{}','keys.info','{}','--json'],receipt+'-before-keys.json')).find(x=>x.command==='keys.info').result;
 const groups=new Map();for(const k of rows.filter(k=>k.path==='timeRemap')){if(!groups.has(k.layer))groups.set(k.layer,[]);groups.get(k.layer).push(k);}
 const fixes=[],audit=[];const ranges=[];
 for(const[id,keysUnsorted]of groups){const keys=keysUnsorted.sort((a,b)=>a.compTime-b.compTime),layer=info.activeComp.layers.find(l=>l.id===id);if(!layer)throw Error('Unbound remap layer '+id);let fix=false;
  if(keys.length===3){const k=keys[1];if(Math.abs(k.time-k.value)>1e-7||k.time<=0)throw Error('Unknown three-key remap '+layer.name);fix=k.compTime>layer.in+1e-7&&k.compTime<layer.out-1e-7;if(fix){fixes.push({layer:id,name:layer.name,in:layer.in,out:layer.out,removedDefault:k,keysBefore:keys,keysAfter:[keys[0],keys[2]]});ranges.push([layer.in,layer.out]);}}
  else if(keys.length!==2)throw Error('Unexpected remap key count '+layer.name+' '+keys.length);
  audit.push({layer:id,name:layer.name,in:layer.in,out:layer.out,keys:keys.map(k=>({compTime:k.compTime,layerTime:k.time,value:k.value})),defaultInsideActive:fix});
 }
 let project=input;
 if(fixes.length){project=root+'/projects/'+stem+'-timing01.ecproj';if(fs.existsSync(project))throw Error('Existing timing project retained; inspect checkpoint '+project);
  const jsx=['function r(c,p){return app.run(c,p||{});}'];
  for(const f of fixes){jsx.push("r('keys.deselectAll',{});",`r('keys.select',${JSON.stringify({keys:f.keysBefore.map(k=>({layer:f.layer,prop:'timeRemap',time:k.compTime})),timeBase:'comp'})});`,"r('keys.delete',{});");for(const k of f.keysAfter)jsx.push(`r('prop.addKey',${JSON.stringify({layer:f.layer,path:'timeRemap',time:k.compTime,timeBase:'comp',value:k.value})});`);}
  const script=root+'/source/repair-remap-'+section+'.jsx';fs.writeFileSync(script,jsx.join('\n'));const r=parsed(await native('effectcraft',['--project',input,'script',script,'--save-as',project,'--json'],receipt+'-repair.json'));if(r.ok===false)throw Error(JSON.stringify(r));
  const reread=parsed(await native('effectcraft',['--project',project,'run','keys.selectAll','{}','keys.info','{}','--json'],receipt+'-after-keys.json')).find(x=>x.command==='keys.info').result;
  for(const f of fixes){const keys=reread.filter(k=>k.layer===f.layer&&k.path==='timeRemap').sort((a,b)=>a.compTime-b.compTime);if(keys.length!==2||keys.some((k,i)=>Math.abs(k.value-f.keysAfter[i].value)>1e-7||Math.abs(k.compTime-f.keysAfter[i].compTime)>1e-7))throw Error('Reopen key verification failed '+f.name);f.reopenedKeys=keys;}
 }
 const changed=layout.reports.find(x=>x.section===section);if(changed){for(const f of changed.fitReport){const l=info.activeComp.layers.find(l=>l.name===f.name);if(!l)throw Error('Missing fitted label '+f.name);ranges.push([l.in,l.out]);}if(section==='J')ranges.push([120.7,126],[162.7,168]);}
 const record={section,comp,duration,frames:duration*30,input,inputSha:hash(input),project,projectSha:hash(project),audit,fixes,ranges:merged(ranges,duration),originalMovie:root+'/media/'+stem+'.mov',finalMovie:root+'/media/'+stem+'-final.mov'};
 result.push(record);save(root+'/qa/remap-repair-plan.json',{scope:'Finite persisted key audit; remove only default middle keys inside visible clip; source/art/voice remain retained',complete:false,sections:result});console.log(JSON.stringify({section,fixes:fixes.length,ranges:record.ranges}));
}
save(root+'/qa/remap-repair-plan.json',{scope:'Finite persisted key audit; remove only default middle keys inside visible clip; source/art/voice remain retained',complete:true,sections:result});
