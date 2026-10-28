import fs from 'node:fs';
import {file,np,EC,FF,run,parse,save,hash} from './native.mjs';
await run(FF,['-hide_banner','-v','error','-y','-i',np(file('media/opened-story05.mp4')),'-vf','crop=1100:760:0:940','-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',np(file('media/message-detail-speed06.mp4'))],'speed06-message-detail.json');
const duration=346/30,q=t=>Math.round(t*30)/30;
const shots=[
{id:'Room opens / shortened editorial playback',file:'room-entry.mp4',a:0,b:.48,w:1024,h:2048,x:540,y:960,s:105.5,from:.35,to:1.35},
{id:'Still sealed / peer already sent',file:'sealed-story05.mp4',a:.48,b:1.92,w:1100,h:1800,x:500,y:1010,s:65,punch:1.05},
{id:'Actual stamp selection / match cut',file:'select-story05.mp4',a:1.92,b:2.88,w:1100,h:1800,x:500,y:1010,s:65},
{id:'Thanks stamp / directed close cut',file:'thanks-detail-speed06.mp4',a:2.88,b:3.84,w:280,h:340,x:500,y:980,s:205,punch:1.12,rotate:-1.1,from:.28},
{id:'Actual selected seal button',file:'seal-detail-story05.mp4',a:3.84,b:4.8,w:1100,h:760,x:500,y:985,s:76,punch:1.07,from:.28},
{id:'Mutual page completed / result',file:'opened-story05.mp4',a:4.8,b:5.76,w:1100,h:1800,x:500,y:1010,s:65,punch:1.04},
{id:'Two stamps together / detail',file:'page-detail-story05.mp4',a:5.76,b:6.72,w:1100,h:1250,x:500,y:980,s:76,punch:1.035},
{id:'Short message / detail',file:'message-detail-speed06.mp4',a:6.72,b:7.68,w:1100,h:760,x:500,y:985,s:76,punch:1.045},
{id:'Page in context / return match cut',file:'opened-story05.mp4',a:7.68,b:8.64,w:1100,h:1800,x:500,y:1010,s:65}
];
save('source/speed06-shots.json',{duration,shots,semanticCuts:'Sealed -> actual selection -> thanks -> actual selected seal -> completed mutual page -> two stamps -> sentence -> full context. No invented button press or opening animation.'});
const inputs=[np(file('media/room-clean.png')),np(file('media/natural.png')),...shots.map(s=>np(file('media/'+s.file)))];
const jsx=`app.newProject();app.beginUndoGroup('MISSYOU v06 / jet cuts and restrained accents');var E=${JSON.stringify(inputs)},S=${JSON.stringify(shots)},D=${duration},boxes=[],evidence=[];
function r(id,p){return app.run(id,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}function timing(l,a,b){r('layer.timing',{layers:[l],in:Math.round(a*30)/30,out:Math.round(b*30)/30});}
function rect(n,w,h,x,y,c,a,b,o){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;timing(l,a,b);if(o!==undefined)set(l,'transform/opacity',o);return l;}
function txt(n,s,x,y,size,c,a,b,max,arrive){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:size,fill:c,position:[x,y],justify:'center'}).layer;var z=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(z.width>(max||840)){size=Math.floor(size*(max||840)/z.width);r('layer.setText',{layer:l,size:size});z=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}set(l,'transform/anchor',[z.left+z.width/2,z.top+z.height/2,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);r('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});if(arrive){key(l,'transform/position',a,[x,y+26,0]);key(l,'transform/position',a+.1333,[x,y-3,0]);key(l,'transform/position',a+.2,[x,y,0]);key(l,'transform/opacity',a,0);key(l,'transform/opacity',a+.0667,100);}boxes.push({name:n,text:s,x:x,y:y,width:z.width,height:z.height,a:a,b:b});return l;}
function add(item,n,a,b,w,h,x,y,s){var l=r('layer.addItem',{item:item,time:Math.round(a*30)/30,duration:Math.round((b-a)*30)/30}).layer;r('layer.rename',{layer:l,name:n});set(l,'transform/anchor',[w/2,h/2,0]);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[s,s,100]);timing(l,a,b);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});return l;}
function label(n,k,s,a,b){rect(n+' accent',46,5,143,221,'#B97967',a,b);txt(n+' eyebrow',k,535,220,29,'#71514D',a,b,740,false);txt(n+' headline',s,530,325,68,'#49363F',a,b,840,true);}
var im=r('file.import',{paths:E,sequence:false});if(im.errors.length)throw Error(JSON.stringify(im.errors));var I=im.items;
var comp=r('comp.new',{name:'MISSYOU v06 11.53s',width:1080,height:1920,frameRate:30,duration:D,background:'#FFF7ED',shutterAngle:110,shutterPhase:-55,motionBlurSamples:4}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var bg=add(I[0],'Actual room / editorial background',0,D,750,1080,540,960,180);set(bg,'transform/opacity',26);
for(var j=0;j<S.length;j++){var s=S[j],a=Math.round(s.a*30)/30,b=Math.round(s.b*30)/30,l=add(I[j+2],s.id,a,b,s.w,s.h,s.x,s.y,s.s);if(s.from!==undefined){r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,s.from);key(l,'timeRemap',b,s.to!==undefined?s.to:s.from+(b-a));}if(s.punch){key(l,'transform/scale',a,[s.s*s.punch,s.s*s.punch,100]);key(l,'transform/scale',a+.1667,[s.s*.994,s.s*.994,100]);key(l,'transform/scale',a+.2333,[s.s,s.s,100]);r('layer.setSwitch',{layers:[l],switch:'motionBlur',value:true});}if(s.rotate){key(l,'transform/rotation',a,s.rotate);key(l,'transform/rotation',a+.2,0);}evidence.push({id:s.id,a:a,b:b,file:s.file,punch:s.punch||null});}
// Short editorial streaks sit outside the relevant UI, rather than fake UI effects.
for(var j=0;j<3;j++){var a=[.4667,2.8667,4.8][j],st=rect('Beat streak '+j,200,8,-150,403,'#B97967',a,a+.1667,35);key(st,'transform/position',a,[-150,403,0]);key(st,'transform/position',a+.1667,[1260,403,0]);key(st,'transform/opacity',a+.1,35);key(st,'transform/opacity',a+.1667,0);r('layer.setSwitch',{layers:[st],switch:'motionBlur',value:true});}
var gl=rect('Page reveal soft warm flash',1080,1920,540,960,'#FFF4D9',4.8,4.9,14);key(gl,'transform/opacity',4.8,14);key(gl,'transform/opacity',4.9,0);
label('Hook','missyou / ふたりの交換日記','この手紙、まだ開けない。',0,1.9333);
label('Choose','01 / 相手は送信済み','スタンプを、ひとつ。',1.9333,3.8333);
label('Send','01 / 相手は送信済み','送ると……',3.8333,4.8);
label('Result','02 / ふたりが送ると','今日が、1ページに。',4.8,8.6333);
// The final phrase starts over the real page. The closing card is shorter than v05.
rect('Closing ivory field',960,355,530,365,'#FFF7ED',8.6333,D,95);
txt('App name','missyou',530,275,119,'#49363F',8.6333,D,850,true);
txt('Status','新しい部屋を制作中。',530,405,56,'#71514D',8.6333,D,850,true);
txt('One next action','この部屋の続きを、フォロー。',530,512,42,'#49363F',9.1333,D,850,true);
var host=add(I[1],'Owner specified Natural / editorial still',8.6333,D,600,780,195,1210,48);key(host,'transform/position',8.6333,[-175,1210,0]);key(host,'transform/position',8.8333,[205,1210,0]);key(host,'transform/position',8.9,[195,1210,0]);r('layer.setSwitch',{layers:[host],switch:'motionBlur',value:true});
rect('Compact development disclosure',820,65,500,1680,'#FFF7ED',0,D,96);txt('Development disclosure','開発版・架空例（名前と文面を編集）',500,1680,26,'#49363F',0,D,770,false);
rect('Voice credit field',655,63,425,1510,'#FFF7ED',8.6333,D,96);txt('Voice credit','声：VOICEVOX:玄野武宏',425,1510,29,'#49363F',8.6333,D,610,false);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,shots:evidence,duration:D,editScope:'Speed changes/crops, short text arrivals, directed scale landing, 3 streaks and one low-opacity warm flash are editorial. No app state animation synthesized.'}));`;
fs.writeFileSync(file('source/composition-speed06.jsx'),jsx);
const build=parse((await run(EC,['--empty','script',np(file('source/composition-speed06.jsx')),'--save-as',np(file('projects/missyou-speed06.ecproj')),'--json'],'speed06-effectcraft-build.json')).stdout);if(!build.ok)throw Error(JSON.stringify(build));
save('qa/speed06-layout.json',{...parse(build.output),projectSha256:hash(file('projects/missyou-speed06.ecproj')),bpm:125,frameQuantizedCuts:shots.map(s=>q(s.a))});
for(const t of [.2,.7,1.8,2.1,3.1,4,4.86,5.95,6.9,7.9,8.9,9.4,10.8])await run(EC,['--project',np(file('projects/missyou-speed06.ecproj')),'render-frame','--comp','MISSYOU v06 11.53s','--time',String(t),'--out',np(file('qa/speed06-preview-'+t+'.png')),'--json'],'speed06-preview-'+t+'.json');
console.log('Native v06 EffectCraft composition and preview frames generated.');
