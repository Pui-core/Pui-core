import path from 'node:path';import fs from 'node:fs';
import {root,native,run,ff,ffprobePath,save,hash} from './runtime.mjs';
import {compName,framesFor,durationFor} from './full-plan-v09.mjs';
const [variant='solo',mode='neutral']=process.argv.slice(2),end=durationFor(variant),frames=framesFor(variant);
if(!['solo','collab'].includes(variant)||!['neutral','production'].includes(mode))throw Error('arguments');
const stem=variant+'-'+mode,project=path.join(root,'projects',stem+'.ecproj'),out=path.join(root,'videos',stem+'-full.mp4');
if(fs.existsSync(out))throw Error('Retain existing render');
const projectHash=hash(project);
const audit=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-audit.json'))),binding=JSON.parse(fs.readFileSync(path.join(root,'qa',stem+'-binding.json')));
if(audit.projectSHA256!==projectHash||binding.projectSHA256!==projectHash||binding.footage.some(x=>hash(x.path)!==x.sha256))throw Error('Render inputs changed since audit');
const cuts=audit;
if(cuts.projectSHA256!==projectHash||cuts.frames!==frames||!Number.isInteger(cuts.maxCameraHoldFrames)||cuts.maxCameraHoldFrames>=90||cuts.cuts?.length!==5||cuts.cuts.some(x=>!Number.isInteger(x.frames)||x.frames<=0||x.frames>150))throw Error('Cut limits not verified for render input');
if(mode==='production'){
 const compare=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-neutral-production-compare.json')));
 if(!compare.sharedStructureMatches||compare.productionSHA256!==projectHash||compare.neutralSHA256!==hash(path.join(root,'projects',variant+'-neutral.ecproj')))throw Error('Production not matched to safe neutral');
}
await native(['--project',project,'render','--comp',compName,'--out',out,'--format','h264','--start','0','--end',String(end),'--fps','30','--audio','off','--bitrate','12000','--progress'],stem+'-full-render');
if(hash(project)!==projectHash)throw Error('Project changed during render');
const probe=JSON.parse((await run(ffprobePath,['-v','error','-count_frames','-show_streams','-show_format','-of','json',out],stem+'-full-probe')).stdout);
const v=probe.streams.filter(s=>s.codec_type==='video');if(probe.streams.length!==1||v.length!==1||v[0].width!==1080||v[0].height!==1920||v[0].avg_frame_rate!=='30/1'||Number(v[0].nb_read_frames)!==frames)throw Error('Render streams');
await ff(['-i',out,'-map','0:v:0','-an','-f','null','-'],stem+'-full-decode');
save(path.join(root,'qa',stem+'-full-receipt.json'),{project,projectHash,out,sha256:hash(out),bytes:fs.statSync(out).size,frames:frames,audioStreams:0,decode:true,neutral:mode==='neutral'});
console.log(JSON.stringify({out,frames:frames,decode:true}));
