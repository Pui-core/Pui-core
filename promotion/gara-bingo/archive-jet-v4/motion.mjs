/** The original graphical movie remains the main picture; archive clips are brief inserts. */
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {composition as originalComposition,plans as originalPlans,characterBase} from './base-graphics.mjs';
import {loadEdit} from './config.mjs';
export {characterBase};
export function composition(root,p,{includeArchive=true}={}) {
  const edit=loadEdit(root),original=originalPlans.find(x=>x.id===p.id);if(!original)throw Error('Missing original graphic plan.');
  let jsx=originalComposition(root,{...original,...p},{includeCharacter:includeArchive});
  const prefix="var imp=run('file.import',{paths:",start=jsx.indexOf(prefix)+prefix.length,end=jsx.indexOf(',sequence:false});',start);
  if(start<prefix.length||end<start)throw Error('Original import landmark missing.');
  const imports=JSON.parse(jsx.slice(start,end));
  if(includeArchive)for(const s of edit.inserts){const r=spawnSync('wslpath',['-w',path.join(root,'media/clips',s.id+'.mp4')],{encoding:'utf8'});if(r.status||r.error)throw Error('wslpath failed');imports.push(r.stdout.trim());}
  jsx=jsx.slice(0,start)+JSON.stringify(imports)+jsx.slice(end);
  jsx=jsx.replaceAll('Osayu Thankyou '+p.id,'Osayu Archive '+p.id).replace('Osayu wholeframe V3','Osayu graphics with archive inserts V6');
  const marker='// Full-screen paper shutters are above the illustration and belong to the SAME camera.';
  if(!jsx.includes(marker))throw Error('Original overlay landmark missing.');
  const inserts=`
// Four brief native inserts. Original art and all graphical scenes are retained beneath them.
var E=${JSON.stringify(edit)},archiveLayers=[],archiveInclude=${includeArchive};
wholeCameraKeys=wholeCameraKeys.filter(function(k){for(var i=0;i<E.inserts.length;i++){var s=E.inserts[i];if(k.time>=s.start-.03334&&k.time<=s.end+.03334)return false;}return true;});
for(var i=0;i<E.inserts.length;i++){
 var s=E.inserts[i],a=s.start,b=s.end,sg=(i+P.index)%2?1:-1;
 shape('ARCHIVE INSERT PAPER '+s.id,2200,3900,540,960,lav,a,b,null,'rect',100);
 shape('ARCHIVE INSERT BORDER '+s.id,940,1640,540,930,'#FFFDFE',a,b,A,'rounded',100);
 var n='ARCHIVE SHOT '+s.id,l;
 ${includeArchive?`l=run('layer.addItem',{item:imp.items[2+i],time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:n});run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/position',[540,930,0]);set(l,'transform/scale',[125,125,100]);set(l,'transform/anchor',[360,640,0]);set(l,'transform/rotation',0);set(l,'transform/opacity',100);attach(l);`:`l=shape(n,720,1280,540,930,'#B4A8CD',a,b,'#8A7EC8','rect',100);run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/scale',[125,125,100]);set(l,'transform/anchor',[0,0,0]);`}
 archiveLayers.push({name:n,id:l,shotId:s.id,start:a,end:b,sourceIn:s.sourceIn,sourceOut:s.sourceOut,clipFile:s.id+'.mp4',sourceWidth:720,sourceHeight:1280,basePosition:[540,930,0],baseScale:[125,125,100]});
 shape('INSERT CAPTION PAPER '+s.id,940,160,540,1790,'#FFFDFE',a,b,A,'rounded',98);
 txt('INSERT CAPTION '+s.id,s.caption,540,1810,64,ink,a,b,855,'center',false);
 txt('INSERT HEADER '+s.id,'配信のひとコマ',100,130,30,A,a,b,880,'left',false);
 focus(a,[540,960],[540+sg*75,960],112,sg*1.8,'insert '+s.id+' arrival');
 focus(a+.13334,[540,960],[540,960],100,0,'insert '+s.id+' settle');
 focus(b-.10,[540,960],[540,960],104,sg*.5,'insert '+s.id+' hold');
 focus(b,[540,960],[540,960],100,0,'insert '+s.id+' graphic return');
}
`;
  jsx=jsx.replace(marker,inserts+'\n'+marker);
  const transition="var transitionTimes=P.sceneCuts.slice(1,-1).concat(P.extraTransitions).sort(function(a,b){return a-b;});";
  if(!jsx.includes(transition))throw Error('Original transition landmark missing.');
  jsx=jsx.replace(transition,"var transitionTimes=P.sceneCuts.slice(1,-1).concat(P.extraTransitions).filter(function(t){for(var j=0;j<E.inserts.length;j++)if(t>=E.inserts[j].start-.18&&t<=E.inserts[j].end+.18)return false;return true;});for(var j=0;j<E.inserts.length;j++)transitionTimes.push(E.inserts[j].start,E.inserts[j].end);transitionTimes.sort(function(a,b){return a-b;});");
  const ending='app.endUndoGroup();writeLn(JSON.stringify({';
  if(!jsx.includes(ending))throw Error('Original output landmark missing.');
  jsx=jsx.replace(ending,`var previewTimes=P.reviewTimes.concat(P.wholeReviewTimes);for(var i=0;i<E.inserts.length;i++){var s=E.inserts[i];previewTimes.push(s.start+.1,s.start+.3,s.end-.10,s.end+.2);}previewTimes=previewTimes.filter(function(t){return t>=0&&t<25;});\n${ending}archiveLayers:archiveLayers,previewTimes:previewTimes,originalGraphicsSeconds:E.originalGraphicsSeconds,includeArchive:archiveInclude,shotCount:E.shots.length,`);
  return jsx;
}
