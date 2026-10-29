import fs from 'node:fs';
import {stage,native,ff,run,ffRoot,save,hash} from './background.mjs';
const root=stage+'/devstory-v01',plan=JSON.parse(fs.readFileSync(root+'/qa/remap-repair-plan.json'));
if(!plan.complete)throw Error('Remap audit incomplete');
const lock=root+'/qa/range-repair.lock',lockfd=fs.openSync(lock,'wx');fs.writeSync(lockfd,JSON.stringify({pid:process.pid,at:new Date().toISOString()}));fs.closeSync(lockfd);
fs.mkdirSync(root+'/media/repairs',{recursive:true});
async function packets(file,receipt){const r=await run(ffRoot+'/bin/ffprobe',['-v','error','-select_streams','v:0','-show_streams','-show_packets','-show_data_hash','sha256','-show_entries','stream=codec_name,width,height,pix_fmt,r_frame_rate,duration:packet=pts_time,dts_time,duration_time,data_hash,flags','-of','json',file],receipt,{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});return JSON.parse(r.stdout);}
function assertShape(p,n,label){if(p.packets.length!==n||p.streams.length!==1||p.streams[0].width!==1280||p.streams[0].height!==720||p.streams[0].r_frame_rate!=='30/1')throw Error('Unexpected frame shape '+label+' '+p.packets.length+'/'+n);}
try{for(const s of plan.sections){
 const binding=root+'/qa/'+s.section+'-repaired-picture-binding.json';if(fs.existsSync(binding)){const b=JSON.parse(fs.readFileSync(binding));if(b.projectSha!==hash(s.project)||b.fileSha!==hash(s.finalMovie)||b.decodeExit!==0)throw Error('Checkpoint differs '+s.section);console.log(JSON.stringify({reused:s.section}));continue;}
 if(s.section==='CLOSE'){
  if(fs.existsSync(s.finalMovie))throw Error('Unbound closing output retained');await native('effectcraft',['--project',s.project,'render','--comp',s.comp,'--out',s.finalMovie,'--format','prores','--prores','standard','--audio','off','--progress','--json'],root+'/qa/CLOSE-final-render.json',undefined,3600000);
  const p=await packets(s.finalMovie,root+'/qa/CLOSE-final-packets.json');assertShape(p,s.frames,s.section);await ff(['-i',s.finalMovie,'-map','0:v:0','-f','null','-'],root+'/qa/CLOSE-final-decode.json');save(binding,{...s,file:s.finalMovie,fileSha:hash(s.finalMovie),nativeRenderExit:0,decodeExit:0,actualFrameCount:p.packets.length});continue;
 }
 const original=await packets(s.originalMovie,root+'/qa/'+s.section+'-original-packets.json');assertShape(original,s.frames,s.section+' original');let expected=original.packets.map(p=>p.data_hash),parts=[],cursor=0;const repairs=[];
 for(const[a,b]of s.ranges){
  const stem=s.section+'-'+a+'-'+b,output=root+'/media/repairs/'+stem+'.mov',receipt=root+'/qa/range-'+stem,checkpoint=receipt+'-binding.json';let p;
  if(fs.existsSync(checkpoint)){const c=JSON.parse(fs.readFileSync(checkpoint));if(c.projectSha!==hash(s.project)||c.fileSha!==hash(output))throw Error('Range checkpoint differs '+stem);p=JSON.parse(JSON.parse(fs.readFileSync(receipt+'-packets.json')).stdout);}
  else {if(fs.existsSync(output))throw Error('Unbound partial range retained '+stem);save(root+'/qa/range-progress.json',{ownerPid:process.pid,section:s.section,start:a,end:b,state:'native range rendering',output});await native('effectcraft',['--project',s.project,'render','--comp',s.comp,'--start',String(a),'--end',String(b),'--out',output,'--format','prores','--prores','standard','--audio','off','--progress','--json'],receipt+'-render.json',undefined,3600000);p=await packets(output,receipt+'-packets.json');assertShape(p,(b-a)*30,stem);save(checkpoint,{project:s.project,projectSha:hash(s.project),file:output,fileSha:hash(output),start:a,end:b,frameCount:p.packets.length});}
  assertShape(p,(b-a)*30,stem);if(cursor<a)parts.push({file:s.originalMovie,start:cursor,end:a});parts.push({file:output,start:0,end:b-a});cursor=b;expected.splice(a*30,(b-a)*30,...p.packets.map(p=>p.data_hash));repairs.push({start:a,end:b,file:output,fileSha:hash(output)});console.log(JSON.stringify({rangeCompleted:stem,frames:p.packets.length}));
 }
 if(cursor<s.duration)parts.push({file:s.originalMovie,start:cursor,end:s.duration});
 const list=root+'/source/concat-'+s.section+'-repairs.ffconcat';const quote=p=>"'"+p.replaceAll("'","'\\''")+"'";fs.writeFileSync(list,'ffconcat version 1.0\n'+parts.map(p=>'file '+quote(p.file)+'\ninpoint '+p.start+'\noutpoint '+p.end+'\nduration '+(p.end-p.start)+'\n').join(''));
 if(fs.existsSync(s.finalMovie))throw Error('Unbound assembled movie retained '+s.finalMovie);await ff(['-f','concat','-safe','0','-i',list,'-map','0:v:0','-an','-c:v','copy','-video_track_timescale','15360',s.finalMovie],root+'/qa/'+s.section+'-splice.json');
 const actual=await packets(s.finalMovie,root+'/qa/'+s.section+'-final-packets.json');assertShape(actual,s.frames,s.section+' repaired');for(let i=0;i<expected.length;i++){const p=actual.packets[i];if(p.data_hash!==expected[i]||Math.abs(Number(p.pts_time)-i/30)>0.000002||Math.abs(Number(p.dts_time)-i/30)>0.000002)throw Error('Packet preservation/timestamp mismatch '+s.section+' frame '+i);}
 await ff(['-i',s.finalMovie,'-map','0:v:0','-f','null','-'],root+'/qa/'+s.section+'-final-decode.json');save(binding,{...s,file:s.finalMovie,fileSha:hash(s.finalMovie),repairs,actualFrameCount:actual.packets.length,unchangedPacketPayloadsExact:true,allOutputPacketsMatchExpected:true,continuousPtsDts:true,decodeExit:0});console.log(JSON.stringify({sectionCompleted:s.section,file:s.finalMovie,sha256:hash(s.finalMovie)}));
}
save(root+'/qa/range-progress.json',{ownerPid:process.pid,state:'all corrected pictures complete',completed:new Date().toISOString()});}finally{fs.unlinkSync(lock);}
