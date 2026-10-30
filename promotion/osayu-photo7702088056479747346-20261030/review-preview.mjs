import fs from 'node:fs';
import path from 'node:path';
import {root,native,ff,hash,save} from './runtime.mjs';
import {compName,cuts,fps} from './motion.mjs';
const project=path.join(root,'projects/character-free-preview.ecproj');
const p=JSON.parse(fs.readFileSync(project));const media=Object.values(p.items).filter(i=>i.kind?.type==='Footage');
if(media.length!==1||media[0].kind.path!==root+'/media/stage-background.png'||hash(media[0].kind.path)!=='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6')throw Error('Preview isolation not established');
const dir=path.join(root,'qa/preview/transitions');fs.mkdirSync(dir,{recursive:true});const frames=[];
for(const cut of cuts.slice(1,-1))for(const offset of [-2,-1,0,1,2,9]){
 const seconds=cut+offset/fps,index=frames.length,out=path.join(dir,String(index).padStart(3,'0')+'.png');
 await native('effectcraft',['--project',project,'render-frame','--comp',compName,'--time',String(seconds),'--max-side','768','--out',out,'--json'],path.join(root,'qa','transition-'+index+'.json'));
 frames.push({cut,seconds,path:out,sha256:hash(out)});
}
const contact=path.join(dir,'contact.png');
await ff(['-y','-framerate','1','-i',path.join(dir,'%03d.png'),'-vf','scale=216:384,tile=6x6:padding=6:margin=6:color=0x101420','-frames:v','1',contact],path.join(root,'qa/transition-contact.json'));
save(path.join(dir,'view-allowlist.json'),{projectSha256:hash(project),characterImports:0,frames,contact:{path:contact,sha256:hash(contact)},aiViewingAllowed:true});console.log(JSON.stringify({contact,frames:frames.length,characterImports:0}));
