import fs from 'node:fs';
import path from 'node:path';
import {file,np,PC,run,copy,hash,save} from './native.mjs';
const stage='/mnt/f/Videos/ProjectP-YouTube-Game-Horizontal-2026-10-26/revision-01/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
const crops=[{name:'actual-result-line',frame:1160,rect:{x:70,y:340,width:1260,height:78}},{name:'actual-count-before',frame:10,rect:{x:60,y:1020,width:1800,height:60}},{name:'actual-count-after',frame:1400,rect:{x:60,y:1020,width:1800,height:60}}];
for(const c of crops){const src=file('media/game/frame-'+String(c.frame).padStart(6,'0')+'.png'),out=path.join(stage,c.name+'.png');await run(PC,['run',np(src),'--cmd','image.crop','--params',JSON.stringify({...c.rect,deleteCroppedPixels:true,contentAware:false}),'--out',np(out),'--format','png'],'pc-'+c.name+'.json');copy(out,file('media/'+c.name+'.png'));c.sourceSha256=hash(src);c.cropSha256=hash(out);}
save('qa/ui-crop-binding.json',{software:'PhotoCraft actual crop',crops,gameSourceUnmodified:true,uiRecreated:false,reason:'Explicit pixel crops avoid nested composition clipping/time-remap cache artifacts; preserve the true GUI text'});
console.log('3 actual GUI pixel crops saved');
