import fs from 'node:fs';
import {file,np,EC,run,save,hash} from './native.mjs';

const project=file('projects/core-puzzle.ecproj');
const projectSha256=hash(project),compositionSha256=hash(file('source/composition.jsx'));
const frames=[0,143,144,151,480,570],captures=[];
for(const frame of frames){
 const target=file('qa/model-composite-frame-'+frame+'.png');
 const startedAt=new Date().toISOString();
 await run(EC,['--project',np(project),'render-frame','--comp','ProjectP Core Puzzle','--time',String(frame/30),'--out',np(target),'--json'],'model-composite-frame-'+frame+'.json');
 if(hash(project)!==projectSha256)throw Error('Saved EC changed during capture');
 captures.push({frame,seconds:frame/30,file:'qa/model-composite-frame-'+frame+'.png',startedAt,finishedAt:new Date().toISOString(),sha256:hash(target),bytes:fs.statSync(target).size});
}
save('qa/model-composite-binding.json',{schemaVersion:1,scope:'Fresh native snapshots of current saved portrait EC; not final encoded video or real TikTok UI',projectSha256,compositionSha256,captures,portraitComp:{width:600,height:450,avatarBottomY:619,gameStartY:650},capturedAt:new Date().toISOString()});
console.log(JSON.stringify({projectSha256,captures:captures.map(c=>({frame:c.frame,sha256:c.sha256}))}));
