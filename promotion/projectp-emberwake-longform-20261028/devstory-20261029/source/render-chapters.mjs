import fs from'node:fs';import{stage,native,ff,save,hash}from'./background.mjs';
const root=stage+'/devstory-v01',lock=root+'/qa/native-render.lock';
const fd=fs.openSync(lock,'wx');fs.writeSync(fd,JSON.stringify({pid:process.pid,started:new Date().toISOString(),scope:'J V C H sequential CPU native export'}));fs.closeSync(fd);
console.log(JSON.stringify({phase:'full-chapter-native-render',pid:process.pid,lock}));
try{
 for(const[section,duration]of[['J',182],['V',168],['C',140],['H',84]]){
  const variant=section==='V'?'layout03':'layout02',project=root+'/projects/chapter-'+section+'-'+variant+'.ecproj',out=root+'/media/chapter-'+section+'.mov',binding=root+'/qa/chapter-'+section+'-picture-binding.json';
  if(fs.existsSync(binding)){const j=JSON.parse(fs.readFileSync(binding));if(j.projectSha===hash(project)&&j.fileSha===hash(out)&&j.decodeExit===0){console.log(JSON.stringify({reused:section}));continue;}throw Error('Existing export binding differs '+section);}
  if(fs.existsSync(out))throw Error('Inspect existing partial export before resuming '+out);
  const projectSha=hash(project);save(root+'/qa/render-progress.json',{ownerPid:process.pid,section,project,projectSha,out,state:'native export running',started:new Date().toISOString()});
  const rendered=await native('effectcraft',['--project',project,'render','--comp','146 '+section,'--out',out,'--format','prores','--prores','standard','--audio','off','--progress','--json'],root+'/qa/chapter-'+section+'-render.json',undefined,3600000);
  await ff(['-i',out,'-map','0:v:0','-f','null','-'],root+'/qa/chapter-'+section+'-picture-decode.json');
  save(binding,{section,duration,frames:duration*30,fps:30,size:[1280,720],project,projectSha,file:out,fileSha:hash(out),nativeRenderExit:rendered.code,decodeExit:0,subjectiveViewing:false});console.log(JSON.stringify({chapterRendered:section,out,sha256:hash(out)}));
 }
 save(root+'/qa/render-progress.json',{ownerPid:process.pid,state:'J V C H exports complete',completed:new Date().toISOString()});
}finally{fs.unlinkSync(lock);}
