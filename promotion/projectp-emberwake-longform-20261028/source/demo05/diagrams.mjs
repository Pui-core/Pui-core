import fs from 'node:fs';
import path from 'node:path';
import {file,np,PC,run,hash,save,copy} from '../native.mjs';
// Editorial diagrams are drawn in native PhotoCraft. These are clearly
// labelled explanation graphics, never fabricated gameplay or game UI.
const specs=[];
const stage='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/demo05-course-film';
for(const p of ['projects','media'])fs.mkdirSync(path.join(stage,p),{recursive:true});
for(let cuts=1;cuts<=3;cuts++){
 const name=`core-${cuts}`,project=path.join(stage,`projects/demo05-${name}.pcraft`),png=path.join(stage,`media/${name}.png`);
 if(fs.existsSync(project)||fs.existsSync(png))throw Error('Native artwork retained: '+name);
 const args=['run','--new',JSON.stringify({width:512,height:512,name:'芯石の刻印 編集図 '+cuts,background:'transparent',resolution:72})];
 const polygons=[{n:'枠',c:'#D4A160',v:[[80,80],[432,80],[432,432],[80,432]]},{n:'内側',c:'#102F39',v:[[102,102],[410,102],[410,410],[102,410]]},{n:'光の芯',c:'#F3D49C',v:[[177,177],[335,177],[335,335],[177,335]]},{n:'芯の陰',c:'#B97B41',v:[[202,202],[310,202],[310,310],[202,310]]}];
 for(let i=0;i<cuts;i++){const x=256+(i-(cuts-1)/2)*72;polygons.push({n:'刻印 '+(i+1),c:'#F4E4C5',v:[[x-15,40],[x+15,40],[x+15,112],[x-15,112]]});}
 for(const p of polygons)args.push('--cmd','shape.create','--params',JSON.stringify({kind:'path',name:p.n,path:{subpaths:[{closed:true,knots:p.v}],fillRule:'nonzero'},fill:p.c}));
 args.push('--out',np(project));await run(PC,args,`demo05/${name}-pc-build.json`);
 await run(PC,['convert',np(project),np(png),'--format','png'],`demo05/${name}-pc-export.json`);
 copy(project,file(`projects/demo05-${name}-native.pcraft`));copy(png,file(`media/demo05/${name}.png`));
 specs.push({cuts,project:`projects/demo05-${name}-native.pcraft`,nativeFProject:project,projectSha256:hash(project),png:`media/demo05/${name}.png`,pngSha256:hash(png),kind:'Native PhotoCraft editorial icon; not a game screenshot'});
}
save('qa/demo05/native-diagrams.json',{specs,visualReview:'PENDING',imageGenerationUsed:false});console.log(JSON.stringify({nativePhotoCraftIcons:specs.length}));
