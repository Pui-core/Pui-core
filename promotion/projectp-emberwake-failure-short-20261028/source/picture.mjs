import fs from 'node:fs';
import {file,np,EC,run,parse,save,hash} from './native.mjs';
const paths=['replay.mp4','natural-still.png','before-count-close.png','after-count-close.png'].map(p=>np(file('media/'+p)));
const jsx=`app.newProject();var E=${JSON.stringify(paths)},shots=[],boxes=[];
function r(n,p){return app.run(n,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,c,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);return l;}
function text(n,s,x,y,z,c,a,b,max){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer,q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>max){z=Math.floor(z*max/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}set(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);set(l,'transform/position',[x,y,0]);span(l,a,b);boxes.push({name:n,text:s,from:a,to:b,width:q.width,height:q.height,x:x,y:y});return l;}
var im=r('file.import',{paths:E,sequence:false});if(im.errors.length)throw Error(JSON.stringify(im.errors));var I=im.items;
var comp=r('comp.new',{name:'EMBERWAKE falling memory',width:1080,height:1920,frameRate:30,duration:13,background:'#101b25',shutterAngle:0,motionBlurSamples:1}).comp;
rect('Night',1080,1920,540,960,'#101b25',0,13);
function shot(n,a,b,src,speed,anchor,position,scale){var l=r('layer.addItem',{item:I[0],time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:n});span(l,a,b);r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,src);key(l,'timeRemap',b,src+(b-a)*speed);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});set(l,'transform/anchor',[anchor[0],anchor[1],0]);set(l,'transform/position',[position[0],position[1],0]);set(l,'transform/scale',[scale,scale,100]);shots.push({name:n,output:[a,b],source:[src,src+(b-a)*speed]});}
// Every value refers to the unchanged, actual recorded replay; the menu frames are held for legibility.
shot('Hook actual fall',0,.6,6.7,1,[960,540],[540,960],180);shot('Hook actual return',.6,1,7.3,1,[400,800],[540,950],140);
shot('Before actual menu',1,2.3,0,0,[340,1042],[540,960],200);
shot('Actual return and checkpoint',2.3,4.1,7.3,1,[400,800],[540,950],140);
shot('Actual retry approach',4.1,6.1,12.4,1,[960,800],[540,950],135);
shot('After actual menu',6.1,8.2,64.1,0,[340,1042],[540,960],200);
shot('Actual retry movement',9.6,13,11.5,1,[960,800],[540,950],135);
rect('Hook source UI mask',1080,260,540,590,'#101b25',0,.6);rect('Gameplay crop top hook',1080,36,540,478,'#101b25',.6,1);rect('Gameplay crop top retry',1080,36,540,478,'#101b25',2.3,6.1);rect('Gameplay crop top close',1080,36,540,478,'#101b25',9.6,13);
rect('Before counter crop',440,150,860,965,'#101b25',1,2.3);rect('After counter crop',440,150,860,965,'#101b25',6.1,8.2);
rect('Comparison backdrop',1080,880,540,900,'#162733',8.2,9.6);
function counter(item,name,y){var l=r('layer.addItem',{item:item,time:8.2,duration:1.4}).layer;r('layer.rename',{layer:l,name:name});span(l,8.2,9.6);set(l,'transform/position',[540,y,0]);set(l,'transform/scale',[100,100,100]);}
counter(I[2],'Before fall: source 0.0 seconds',720);counter(I[3],'After fall: source 64.1 seconds',1100);
rect('Top safe field',1080,460,540,230,'#101b25',0,13);rect('Bottom safe field',1080,580,540,1630,'#101b25',.6,13);
rect('Top gold rule',930,3,500,460,'#e2bb76',0,13);rect('Bottom gold rule',930,3,500,1340,'#e2bb76',.6,13);
var avatar=r('layer.addItem',{item:I[1],time:.6,duration:12.4}).layer;r('layer.rename',{layer:avatar,name:'Revenant Natural still, no lipsync'});span(avatar,.6,13);set(avatar,'transform/position',[865,1550,0]);set(avatar,'transform/scale',[55,55,100]);key(avatar,'transform/position',.6,[1010,1550,0]);key(avatar,'transform/position',.8,[865,1550,0]);key(avatar,'transform/position',9.6,[865,1550,0]);key(avatar,'transform/position',9.8,[835,1550,0]);key(avatar,'transform/position',10,[865,1550,0]);
text('Brand','EMBERWAKE',500,145,67,'#f4e7cc',0,13,920);
text('Hook','落ちると、',500,300,76,'#f4e7cc',0,2.3,920);text('Hook2','記憶を失う？',500,400,84,'#f2c47f',0,2.3,920);
text('Retry','一話を再挑戦',500,310,72,'#f4e7cc',2.3,6.1,920);text('Retry2','実際に落下',500,405,74,'#f2c47f',2.3,6.1,920);
text('Result','失った数は',500,310,71,'#f4e7cc',6.1,9.6,920);text('Result2','1のまま。',500,405,88,'#f2c47f',6.1,9.6,920);
text('End','先へ進むと、',500,310,74,'#f4e7cc',9.6,13,920);text('End2','何を失う？',500,405,82,'#f2c47f',9.6,13,920);
text('Before label','落下前',200,555,52,'#f4e7cc',8.2,9.6,300);text('After label','落下後',200,935,52,'#f2c47f',8.2,9.6,300);
text('Lower1','一話クリア済みの再訪',350,1450,40,'#d1d5cd',.6,9.6,640);
text('Lower2','開発中の実画面を編集',350,1520,37,'#d1d5cd',.6,13,640);
text('Follow','この物語の続きを。',350,1450,44,'#f4e7cc',9.6,13,640);
text('Credit','VOICEVOX:青山龍星',450,1770,26,'#d1d5cd',.6,13,860);
writeLn(JSON.stringify({comp:comp,shots:shots,boxes:boxes,model:'static still',published:false}));`;
fs.writeFileSync(file('source/composition.jsx'),jsx);
const q=parse((await run(EC,['--empty','script',np(file('source/composition.jsx')),'--save-as',np(file('projects/emberwake-fall.ecproj')),'--json'],'ec-build.json')).stdout);
if(!q.ok)throw Error(JSON.stringify(q));
save('qa/ec-project.json',{...parse(q.output),projectSha256:hash(file('projects/emberwake-fall.ecproj')),rendered:false,layoutVerified:false});
console.log('EffectCraft project saved; render and image QA pending.');
