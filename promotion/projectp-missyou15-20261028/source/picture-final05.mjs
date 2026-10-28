import fs from 'node:fs';
import {file,np,EC,run,parse,save,hash} from './native.mjs';

// Clips in this manifest are genuine, bounded pieces of the isolated QA capture.
// No missing app transition is synthesized by removing an editorial mask.
const manifest=JSON.parse(fs.readFileSync(file('source/final05-shots.json')));
const duration=404/30, quant=t=>Math.round(t*30)/30;
const shotFiles=manifest.shots.map(s=>np(file('media/'+s.file)));
const inputs=[np(file('media/room-clean.png')),np(file('media/natural.png')),...shotFiles];
const jsx=`app.newProject();app.beginUndoGroup('MISSYOU final / real QA motion');
var E=${JSON.stringify(inputs)},M=${JSON.stringify(manifest)},D=${duration},boxes=[],shots=[];
function r(id,p){return app.run(id,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}
function timing(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,c,a,b,o){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;timing(l,a,b);if(o!==undefined)set(l,'transform/opacity',o);return l;}
function txt(n,s,x,y,size,c,a,b,max){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:size,fill:c,position:[x,y],justify:'center'}).layer;var q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>(max||880)){size=Math.floor(size*(max||880)/q.width);r('layer.setText',{layer:l,size:size});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}set(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);r('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});boxes.push({name:n,text:s,x:x,y:y,width:q.width,height:q.height,a:a,b:b});return l;}
function add(item,n,a,b,anchor,pos,scale){var l=r('layer.addItem',{item:item,time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:n});set(l,'transform/anchor',[anchor[0],anchor[1],0]);set(l,'transform/position',[pos[0],pos[1],0]);set(l,'transform/scale',[scale,scale,100]);timing(l,a,b);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});return l;}
function label(n,k,s,a,b){rect(n+' accent',46,5,143,221,'#B97967',a,b);txt(n+' eyebrow',k,535,220,29,'#71514D',a,b,740);txt(n+' headline',s,530,325,68,'#49363F',a,b,850);}
var im=r('file.import',{paths:E,sequence:false});if(im.errors.length)throw Error(JSON.stringify(im.errors));var I=im.items;
var comp=r('comp.new',{name:'MISSYOU final 13.47s',width:1080,height:1920,frameRate:30,duration:D,background:'#FFF7ED',shutterAngle:120,shutterPhase:-60,motionBlurSamples:4}).comp;
r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
// A restrained editorial background. Each screen remains the actual app UI.
var room=add(I[0],'Room environment / actual development artwork',0,D,[375,540],[540,960],180);set(room,'transform/opacity',26);
for(var j=0;j<M.shots.length;j++){
  var s=M.shots[j],a=Math.round(s.at*30)/30,b=Math.round(s.end*30)/30;
  if(s.clearBackground)rect(s.id+' clean cream',1080,1920,540,960,'#FFF7ED',a,b);
  var l=add(I[j+2],s.id,a,b,[s.width/2,s.height/2],s.position,s.scale);
  if(s.sourceIn){r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,s.sourceIn);key(l,'timeRemap',b,s.sourceIn+(b-a));}
  shots.push({id:s.id,at:a,end:b,file:s.file,sourceIn:s.sourceIn||0,actualUi:true,crop:s.crop||null});
}
// The reveal is the first image; explanatory titles follow the first beat.
label('Hook','missyou / ふたりの交換日記','この手紙、まだ開けない。',0,2.8666667);
label('Stamp','01 / 相手は送信済み','スタンプをひとつ、送ると。',2.8666667,5.7666667);
label('Diary','02 / ふたりが送ると','今日が、1ページに。',5.7666667,9.6);
// Closing: title, status and one next action; no invented download claim.
rect('Closing ivory header',960,355,530,365,'#FFF7ED',9.6,D,95);
txt('App name','missyou',530,275,119,'#49363F',9.6,D,850);
txt('Development status','新しい部屋を制作中。',530,405,56,'#71514D',9.6,D,850);
var follow=txt('Follow the development','この部屋の続きを、フォロー。',530,512,42,'#49363F',11.0333333,D,850);
key(follow,'transform/opacity',11.0333333,0);key(follow,'transform/opacity',11.1666667,100);
var host=add(I[1],'Owner specified Natural / editorial still',9.6,D,[300,390],[195,1210],48);
key(host,'transform/position',9.6,[-185,1210,0]);key(host,'transform/position',9.8333333,[205,1210,0]);key(host,'transform/position',10,[195,1210,0]);
rect('Compact development disclosure',820,65,500,1680,'#FFF7ED',0,D,96);
txt('Development disclosure','開発版・架空例（名前と文面を編集）',500,1680,26,'#49363F',0,D,770);
rect('Closing voice credit field',655,63,425,1510,'#FFF7ED',9.6,D,96);
txt('Voice credit','声：VOICEVOX:玄野武宏',425,1510,29,'#49363F',9.6,D,610);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,shots:shots,duration:D,editing:'Real app shots are cuts/crops; titles and Natural slide are editorial.'}));`;
fs.writeFileSync(file('source/composition-final05.jsx'),jsx);
const result=parse((await run(EC,['--empty','script',np(file('source/composition-final05.jsx')),'--save-as',np(file('projects/missyou-final05.ecproj')),'--json'],'final05-effectcraft-build.json')).stdout);
if(!result.ok)throw Error(JSON.stringify(result));
save('qa/final05-layout.json',{...parse(result.output),projectSha256:hash(file('projects/missyou-final05.ecproj')),nominalMusicBpm:125,actualBoundaries:[0,quant(.96),quant(2.88),quant(4.32),quant(5.76),quant(7.2),quant(8.64),quant(9.6),duration]});
for(const t of [0,.5,1.3,2.5,3.2,4.8,6.2,7.8,8.9,9.7,10.6,11.4,12.7,13.4])await run(EC,['--project',np(file('projects/missyou-final05.ecproj')),'render-frame','--comp','MISSYOU final 13.47s','--time',String(t),'--out',np(file('qa/final05-preview-'+t+'.png')),'--json'],'final05-preview-'+t+'.json');
console.log('EffectCraft final composition and native frames generated.');
