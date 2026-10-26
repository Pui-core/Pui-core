/** Matching full-screen live footage accompanies all speech, with graphical interludes. */
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
  jsx=jsx.replaceAll('Osayu Thankyou '+p.id,'Osayu Archive '+p.id).replace('Osayu wholeframe V3','Osayu live thankyou V7');
  const marker='// Full-screen paper shutters are above the illustration and belong to the SAME camera.';
  if(!jsx.includes(marker))throw Error('Original overlay landmark missing.');
  const inserts=`
// Live speech remains on screen for its complete phrase, including opening and promise.
var E=${JSON.stringify(edit)},archiveLayers=[],archiveInclude=${includeArchive};
wholeCameraKeys=wholeCameraKeys.filter(function(k){for(var i=0;i<E.inserts.length;i++){var s=E.inserts[i];if(k.time>=s.start-.03334&&k.time<=s.end+.03334)return false;}return true;});
for(var i=0;i<E.inserts.length;i++){
 var s=E.inserts[i],a=s.start,b=s.end,sg=(i+P.index)%2?1:-1;
 shape('ARCHIVE INSERT PAPER '+s.id,2200,3900,540,960,lav,a,b,null,'rect',100);
 var n='ARCHIVE SHOT '+s.id,l;
 ${includeArchive?`l=run('layer.addItem',{item:imp.items[2+i],time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:n});run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/position',[540,960,0]);set(l,'transform/scale',[160,160,100]);set(l,'transform/anchor',[360,640,0]);set(l,'transform/rotation',0);set(l,'transform/opacity',100);attach(l);`:`l=shape(n,720,1280,540,960,'#B4A8CD',a,b,'#8A7EC8','rect',100);run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/scale',[160,160,100]);set(l,'transform/anchor',[0,0,0]);`}
 archiveLayers.push({name:n,id:l,shotId:s.id,voiceId:s.voiceId,start:a,end:b,sourceIn:s.sourceIn,sourceOut:s.sourceOut,clipFile:s.id+'.mp4',sourceWidth:720,sourceHeight:1280,basePosition:[540,960,0],baseScale:[160,160,100],fullScreenLive:true});
 if(s.voiceId==='teaser-promise'){
  shape('INSERT CAPTION PAPER '+s.id,940,240,540,1700,'#FFFDFE',a,b,A,'rounded',98);
  txt('INSERT PROMISE TITLE '+s.id,'歌ってみたサビ',540,1680,48,ink,a,b,855,'center',false);
  txt('INSERT CAPTION '+s.id,'後日公開！',540,1770,74,A,a,b,855,'center',false);
 }else{
  shape('INSERT CAPTION PAPER '+s.id,940,150,540,1730,'#FFFDFE',a,b,A,'rounded',98);
  txt('INSERT CAPTION '+s.id,s.caption,540,1755,64,ink,a,b,855,'center',false);
 }
 shape('INSERT HEADER PAPER '+s.id,440,72,305,145,'#FFFDFE',a,b,A,'rounded',96);
 txt('INSERT HEADER '+s.id,'おさゆ / 配信のひとコマ',305,157,27,A,a,b,400,'center',false);
 focus(a,[540,960],[540+sg*25,960],108,sg*.35,'insert '+s.id+' arrival');
 focus(a+.13334,[540,960],[540,960],104,0,'insert '+s.id+' settle');
 focus(b-.10,[540,960],[540,960],106,sg*.25,'insert '+s.id+' hold');
 if(i===E.inserts.length-1||Math.abs(E.inserts[i+1].start-b)>.001)focus(b,[540,960],[540,960],104,0,'insert '+s.id+' graphic return');
}
`;
  jsx=jsx.replace(marker,inserts+'\n'+marker);
  const transition="var transitionTimes=P.sceneCuts.slice(1,-1).concat(P.extraTransitions).sort(function(a,b){return a-b;});";
  if(!jsx.includes(transition))throw Error('Original transition landmark missing.');
  jsx=jsx.replace(transition,"var transitionTimes=P.sceneCuts.slice(1,-1).concat(P.extraTransitions).filter(function(t){for(var j=0;j<E.inserts.length;j++)if(t>=E.inserts[j].start-.18&&t<=E.inserts[j].end+.18)return false;return true;});transitionTimes.sort(function(a,b){return a-b;});");
  const ending='app.endUndoGroup();writeLn(JSON.stringify({';
  if(!jsx.includes(ending))throw Error('Original output landmark missing.');
  jsx=jsx.replace(ending,`var previewTimes=P.reviewTimes.concat(P.wholeReviewTimes);for(var i=0;i<E.inserts.length;i++){var s=E.inserts[i];previewTimes.push(s.start,s.start+.1,s.start+.3,s.end-1/30,s.end+.2);}previewTimes=previewTimes.filter(function(t){return t>=0&&t<25;});\n${ending}archiveLayers:archiveLayers,previewTimes:previewTimes,originalGraphicsSeconds:E.originalGraphicsSeconds,includeArchive:archiveInclude,shotCount:E.shots.length,allSpeechOnMatchingLiveVideo:true,`);
  return jsx;
}
