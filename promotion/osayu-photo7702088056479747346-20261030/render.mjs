import fs from 'node:fs';
import path from 'node:path';
import {root,native,ff,hash,save} from './runtime.mjs';
import {compName,reviewTimes,duration} from './motion.mjs';

const mode=process.argv[2];
if(!['preview','main'].includes(mode))throw Error('Use preview or main');
const project=path.join(root,'projects',mode==='preview'?'character-free-preview.ecproj':'osayu-tutorial-battle.ecproj');
if(mode==='preview'){
 const parsed=JSON.parse(fs.readFileSync(project));const refs=Object.values(parsed.items||{}).filter(i=>i.kind?.type==='Footage');
 if(refs.length!==1||refs[0].kind.path!==path.join(root,'media/stage-background.png')||hash(refs[0].kind.path)!=='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6')throw Error('Preview references unapproved image');
 const frames=[];
 for(let i=0;i<reviewTimes.length;i++){
  const out=path.join(root,'qa/preview',String(i).padStart(3,'0')+'.png');
  await native('effectcraft',['--project',project,'render-frame','--comp',compName,'--time',String(reviewTimes[i]),'--max-side','960','--out',out,'--json'],path.join(root,'qa','preview-frame-'+i+'.json'));
  frames.push({seconds:reviewTimes[i],path:out,sha256:hash(out),containsCharacter:false});
 }
 const contact=path.join(root,'qa/preview/contact.png');
 await ff(['-y','-framerate','1','-i',path.join(root,'qa/preview/%03d.png'),'-vf','scale=270:480,tile=4x4:padding=10:margin=10:color=0x101420','-frames:v','1',contact],path.join(root,'qa/preview-contact.json'));
 save(path.join(root,'qa/preview/view-allowlist.json'),{projectSha256:hash(project),stageSha256:hash(refs[0].kind.path),frames,contact:{path:contact,sha256:hash(contact)},characterImports:0,onlyTheseOutputsMayBeViewedByAI:true});
 console.log(JSON.stringify({contact,characterImports:0,frames:frames.length}));
}else{
 const out=path.join(root,'media','picture-master.mp4');
 if(fs.existsSync(out))throw Error('Retain existing render; use a new revision');
 await native('effectcraft',['--project',project,'render','--comp',compName,'--out',out,'--format','h264','--bitrate','18000','--audio','off','--progress','--json'],path.join(root,'qa/main-native-render.json'),undefined,360000);
 save(path.join(root,'qa/main-render-summary.json'),{path:out,sha256:hash(out),bytes:fs.statSync(out).size,projectSha256:hash(project),duration,containsCharacter:true,aiViewingAllowed:false});
 console.log(JSON.stringify({path:out,bytes:fs.statSync(out).size,containsCharacter:true,aiViewingAllowed:false}));
}
