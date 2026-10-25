/** Archive clips stay in native tools. AI previews do not import a single character-containing image/video. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadEdit} from './config.mjs';

export function composition(root,p,{includeArchive=true}={}) {
  const e=loadEdit(root), manifest=JSON.parse(fs.readFileSync(path.join(root,'media/background-manifest.json'),'utf8'));
  const native=f=>{const r=spawnSync('wslpath',['-w',f],{encoding:'utf8'});if(r.status||r.error)throw Error('wslpath: '+f);return r.stdout.trim();};
  const footage=e.shots.filter(s=>s.kind==='archive');
  const imports=[native(path.join(root,'media/bingo-paper-background.png'))];
  if(includeArchive)for(const s of footage)imports.push(native(path.join(root,'media/clips',s.id+'.mp4')));
  return `app.newProject();app.beginUndoGroup('Osayu archive jet V4 ${p.id}');
var P=${JSON.stringify(p)},E=${JSON.stringify(e)},D=E.duration,ink='#3B3562',A=P.accent,B=P.second,lav='#EEE7F8',blue='#ADCFF4',pink='#DFABE3',boxes=[],wholeCameraKeys=[],transitions=[],archiveLayers=[],previewTimes=[];
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}function ease(l,prop,ts){var ks=[];for(var i=0;i<ts.length;i++)ks.push({layer:l,prop:prop,time:Math.round(ts[i]*30)/30});run('keys.select',{keys:ks,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:65,outInfluence:65,continuous:false});}
var comp=run('comp.new',{name:'Osayu Archive ${p.id}',width:1080,height:1920,frameRate:30,duration:D,background:lav,shutterAngle:110,shutterPhase:-55,motionBlurSamples:4}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});run('comp.setSwitch',{switch:'motionBlur',value:true});
var imp=run('file.import',{paths:${JSON.stringify(imports)},sequence:false});if(imp.errors.length)throw Error(JSON.stringify(imp.errors));
var world=run('layer.newNull',{name:'WHOLE FRAME CAMERA'}).layer;set(world,'transform/anchor',[540,960,0]);set(world,'transform/position',[540,960,0]);timing(world,0,D);
function attach(l){run('layer.setParent',{layers:[l],parent:world,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(n,w,h,x,y,c,a,b,stroke,op,kind){var l=run('layer.newShape',{name:n,kind:kind||'rounded',size:[w,h],position:[x,y],fill:c,stroke:stroke||c,strokeWidth:stroke?4:0}).layer;timing(l,a,b);attach(l);if(op!==undefined)set(l,'transform/opacity',op);return l;}
function txt(n,s,x,y,z,c,a,b,w,align,pop){var l=run('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:align||'left'}).layer;var r=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(r.width>(w||850)){z=Math.floor(z*(w||850)/r.width);run('layer.setText',{layer:l,size:z});r=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}timing(l,a,b);attach(l);boxes.push({name:n,text:s,size:z,x:x+r.left,y:y+r.top,width:r.width,height:r.height,start:a,end:b});if(pop&&b-a>.25){key(l,'transform/position',a,[x,y+45]);key(l,'transform/position',a+.10,[x,y-5]);key(l,'transform/position',a+.20,[x,y]);ease(l,'transform/position',[a,a+.1,a+.2]);}return l;}
function picture(n,it,a,b,x,y,s,anc){var l=run('layer.addItem',{item:it,time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:n});run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[s,s,100]);set(l,'transform/anchor',anc);set(l,'transform/rotation',0);set(l,'transform/opacity',100);attach(l);return l;}
picture('BINGO PAPER BACKGROUND',imp.items[0],0,D,540,960,160,[${manifest.width/2},${manifest.height/2},0]);
for(var j=0;j<8;j++){var q=shape('Paper edge '+j,25+(j%3)*9,60,35+(j%2)*1010,300+j*185,j%2?blue:pink,0,D,null,70,'rect');set(q,'transform/rotation',j*19);}
// Every clip is individually CFR-trimmed to source zero. Both video and overlays share the camera.
var footageIndex=1,previousGroup=null;
for(var i=0;i<E.shots.length;i++){
 var s=E.shots[i],a=s.start,b=s.end,sg=(i+P.index)%2?1:-1;
 if(s.kind==='archive'){
  shape('Archive paper '+s.id,784,1330,540,960,'#FFFDFE',a,b,A,100);
  var n='ARCHIVE SHOT '+s.id,baseScale=99.3;
  ${includeArchive?`var l=picture(n,imp.items[footageIndex++],a,b,540,960,baseScale,[360,640,0]);`:`var l=shape(n,720,1280,540,960,'#B4A8CD',a,b,'#8A7EC8',100,'rect');run('layer.timing',{layers:[l],start:a,in:a,out:b});set(l,'transform/scale',[99.3,99.3,100]);set(l,'transform/anchor',[0,0,0]);`}
  archiveLayers.push({name:n,id:l,shotId:s.id,start:a,end:b,sourceIn:s.sourceIn,sourceOut:s.sourceOut,clipFile:s.id+'.mp4',sourceWidth:720,sourceHeight:1280,basePosition:[540,960,0],baseScale:[baseScale,baseScale,100]});
 }else{
  shape('Page color '+s.id,1700,3000,540,960,i%2?pink:blue,a,b,null,15,'rect');
  if(s.kind==='title'){
   txt('Title small '+s.id,'初めてのビンゴ企画で…',100,410,48,ink,a,b,880,'left',false);
   txt('Title big '+s.id,'みんなと',90,740,142,A,a,b,900,'left',true);
   txt('Title lower '+s.id,'全マス達成！',90,970,132,ink,a,b,900,'left',true);
  }else if(s.kind==='board'||s.kind==='reach'){
   var labels=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'];
   txt('Grid headline '+s.id,s.kind==='reach'?'あと、ひとマス。':'みんなの応援で',100,420,80,A,a,b,880,'left',true);
   for(var j=0;j<9;j++){var x=230+j%3*310,y=660+Math.floor(j/3)*230,at=a+Math.min((b-a)*.55,j*.045);shape('Cell '+s.id+' '+j,280,205,x,y,'#FFFDFE',a,b,'#9FB0E8',100);txt('Cell label '+s.id+' '+j,labels[j],x,y+55,29,ink,a,b,258,'center',false);if(j<(s.clearCount===undefined?(s.kind==='reach'?8:3):s.clearCount)){shape('Stamp '+s.id+' '+j,250,80,x,y-22,j%2?pink:blue,at,b,A,100);txt('Clear '+s.id+' '+j,'CLEAR!',x,y-8,36,A,at,b,235,'center',false);}}
   txt('Grid result '+s.id,s.kind==='reach'?'REACH!':'ひとつずつ、達成！',100,1500,s.kind==='reach'?140:70,ink,a,b,880,'left',true);
  }else if(s.kind==='victory'){
   txt('Victory BINGO '+s.id,'BINGO!',90,700,176,A,a,b,900,'left',true);
   txt('Victory all '+s.id,'全マス達成!!',90,975,115,ink,a,b,900,'left',true);
   txt('Victory count '+s.id,'9 / 9',100,1300,160,B,a,b,850,'left',false);
   for(var j=0;j<22;j++){var x=40+(j*193)%1000,t=a+(j%3)*.025,end=b,cf=shape('Celebration '+s.id+' '+j,15+j%3*6,40,x,260+(j%5)*100,j%2?blue:pink,t,end,null,90,'rect');key(cf,'transform/position',t,[x,260+(j%5)*100]);key(cf,'transform/position',end,[x+sg*75,1660]);key(cf,'transform/rotation',t,j*23);key(cf,'transform/rotation',end,j*23+220);}
  }else if(s.kind==='teaser'){
   txt('Teaser thanks '+s.id,'みんな、本当にありがとう♡',100,420,55,ink,a,b,880,'left',false);
   txt('Teaser sing '+s.id,'歌ってみた',90,720,126,ink,a,b,900,'left',true);
   txt('Teaser chorus '+s.id,'サビ',90,965,170,A,a,b,900,'left',true);
   shape('Teaser ribbon '+s.id,900,170,540,1195,'#E4D5F8',a+.15,b,A,100);
   txt('Teaser soon '+s.id,'後日公開！',540,1230,100,ink,a+.15,b,830,'center',true);
   txt('Teaser handle '+s.id,'音桜夢 / おさゆ  @oosayuuu2525',100,1615,33,ink,a,b,880,'left',false);
  }
 }
 var isLast=s.kind==='teaser',z=isLast?110:s.kind==='archive'?(P.index===1?118:P.index===2?129:124):128,r=isLast?0:sg*(P.index===2?4.0:P.index===1?2.3:3.2),dx=isLast?0:sg*(P.index===1?65:P.index===2?135:110);
 function camera(t,scale,x,y,rot,label){wholeCameraKeys.push({time:Math.round(t*30)/30,position:[x,y,0],scale:[scale,scale,100],rotation:rot,anchor:[540,960,0],label:label});}
 camera(a,z,540+dx,960+(P.index===1&&!isLast?22:0),r,s.id+' cut hit');
 if(b-a>.20)camera(a+.13334,isLast?100:104,540,960,0,s.id+' readable settle');
 if(b-a>.43)camera(b-.03334,isLast?100:114,540-dx*.22,960,-r*.2,s.id+' end');
 previewTimes.push(Math.round((a+Math.min(.20,(b-a)*.5))*30)/30);
 if(i>0&&s.group!==previousGroup&&!isLast){transitions.push({time:a,type:'paper-whip',includesArchive:true});}
 previousGroup=s.group;
}
// Sample short strips at the main transitions, in addition to the landing of every shot.
var extraTimes=[E.drop,E.climax,E.outro,E.shots[E.shots.length-1].start];for(var i=0;i<extraTimes.length;i++)for(var j=0;j<3;j++)previewTimes.push(Math.round((extraTimes[i]+[.03334,.10,.23334][j])*30)/30);
// Group captions stay visible across the rapid picture cuts, allowing phrases to be read.
var groups=[];for(var i=0;i<E.shots.length;i++){var s=E.shots[i],g=groups.length?groups[groups.length-1]:null;if(g&&g.id===s.group){g.end=s.end;}else{groups.push({id:s.group,start:s.start,end:s.end,caption:s.caption||'',kind:s.kind});}}
for(var i=0;i<groups.length;i++){var g=groups[i];if(g.kind!=='archive')continue;shape('Caption paper '+g.id,940,220,540,1720,'#FFFDFE',g.start,g.end,A,98);txt('Caption '+g.id,g.caption,540,1720,64,ink,g.start,g.end,855,'center',false);txt('Caption source '+g.id,'LIVE ARCHIVE / おさゆ',100,270,32,A,g.start,g.end,880,'left',false);}
for(var i=0;i<transitions.length;i++){var t=transitions[i].time,sg=(i+P.index)%2?1:-1,l=shape('FULL SCENE PAPER WIPE '+i,2200,4300,540-sg*2700,960,i%2?pink:blue,t-.06667,t+.10,null,100,'rect');set(l,'transform/rotation',sg*(P.index===1?10:5));key(l,'transform/position',t-.06667,[540-sg*2700,960]);key(l,'transform/position',t,[540,960]);key(l,'transform/position',t+.10,[540+sg*3200,960]);run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:true});}
wholeCameraKeys.sort(function(a,b){return a.time-b.time;});for(var i=0;i<wholeCameraKeys.length;i++){var k=wholeCameraKeys[i];key(world,'transform/position',k.time,k.position);key(world,'transform/scale',k.time,k.scale);key(world,'transform/rotation',k.time,k.rotation);}
var times=wholeCameraKeys.map(function(k){return k.time;});ease(world,'transform/position',times);ease(world,'transform/scale',times);ease(world,'transform/rotation',times);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,duration:D,includeArchive:${includeArchive},boxes:boxes,archiveLayers:archiveLayers,wholeCameraKeys:wholeCameraKeys,transitions:transitions,previewTimes:previewTimes,shotCount:E.shots.length,wholeFrameCamera:'WHOLE FRAME CAMERA',backgroundBounds:{x:${540-manifest.width*.8},y:${960-manifest.height*.8},width:${manifest.width*1.6},height:${manifest.height*1.6}}}));`;
}
