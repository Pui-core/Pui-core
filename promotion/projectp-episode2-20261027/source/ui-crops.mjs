import fs from 'node:fs';
import path from 'node:path';
import {file,np,PC,run,copy,hash,save} from './native.mjs';
const stage='/mnt/f/Videos/ProjectP-Episode2-2026-10-27/revision-01/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
// Episode-2 memory counter before (title, still 1/15) and after result (2/15).
const crops=[
 {name:'actual-count-before',frame:50,rect:{x:70,y:1012,width:820,height:70}},
 {name:'actual-count-after',frame:1314,rect:{x:70,y:1012,width:820,height:70}}
];
for(const c of crops){const src=file('media/game/frame-'+String(c.frame).padStart(6,'0')+'.png'),out=path.join(stage,c.name+'.png');await run(PC,['run',np(src),'--cmd','image.crop','--params',JSON.stringify({...c.rect,deleteCroppedPixels:true,contentAware:false}),'--out',np(out),'--format','png'],'pc-'+c.name+'.json');copy(out,file('media/'+c.name+'.png'));c.sourceSha256=hash(src);c.cropSha256=hash(out);}
save('qa/ui-crop-binding.json',{software:'PhotoCraft actual crop',crops,gameSourceUnmodified:true,uiRecreated:false,reason:'Explicit pixel crops of the actual lost-memory counter (1/15 before, 2/15 after); preserve the true GUI text without nested time-remap cache artifacts'});
console.log('2 actual GUI counter crops saved');
