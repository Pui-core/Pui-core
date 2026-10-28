import fs from 'node:fs';
import {file,np,EC,run,parse,save,hash} from './native.mjs';
const names=['card-01.png','card-02.png','card-03.png','card-04.png','card-05.png','card-04-truth.png','seal-truth.png','seal-lie.png','logo.png','natural-still.png','app-103-simulator-example.png'];
const paths=names.map(p=>np(file('media/'+p)));
const jsx=`app.newProject();var E=${JSON.stringify(paths)},boxes=[];
function r(n,p){return app.run(n,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,c,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);return l;}
function text(n,s,x,y,z,c,a,b,max){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer,q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>max){z=Math.floor(z*max/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}set(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);set(l,'transform/position',[x,y,0]);span(l,a,b);boxes.push({name:n,text:s,from:a,to:b,width:q.width,height:q.height,x:x,y:y});return l;}
var im=r('file.import',{paths:E,sequence:false});if(im.errors.length)throw Error(JSON.stringify(im.errors));var I=im.items;
var comp=r('comp.new',{name:'Truth or Lie vertical fictional duel v6',width:1080,height:1920,frameRate:30,duration:14.5,background:'#07111a',shutterAngle:0,motionBlurSamples:1}).comp;
rect('Night',1080,1920,540,960,'#07111a',0,14.5);rect('Top fine line',930,3,500,452,'#c5a26b',0,11);
function image(n,i,a,b,x,y,s){var l=r('layer.addItem',{item:I[i],time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:n});span(l,a,b);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[s,s,100]);return l;}
text('Scope','架空の2人対戦・演出例',500,245,38,'#d9c8a6',0,11,900);
text('Question1','この5つ、',500,322,68,'#f1e7d6',0,5.3,900);text('Question2','嘘はどれ？',500,398,80,'#e6be7b',0,5.3,900);
for(var j=0;j<5;j++){var a=.18+j*.12,y=555+j*174,l=image('Evidence '+(j+1),j,a,5.3,500,y,100);key(l,'transform/position',a,[560,y+45,0]);key(l,'transform/position',a+.24,[500,y,0]);key(l,'transform/opacity',a,0);key(l,'transform/opacity',a+.16,100);if(j===1){key(l,'transform/scale',4.5,[100,100,100]);key(l,'transform/scale',4.9,[105,105,100]);key(l,'transform/position',4.5,[500,y,0]);key(l,'transform/position',4.9,[515,y,0]);}}
text('Fictional clue','手がかり：寝る前は映画だけ',500,1405,45,'#e6be7b',.8,5.3,920);text('Voting prompt','あなたなら、どれに投票？',500,1490,42,'#f3dfbf',.8,5.3,900);
text('Vote1','相手は②に投票',500,322,68,'#f1e7d6',5.3,8,900);text('Vote2','でも、',500,405,65,'#e6be7b',5.3,8,900);
var vote=image('Second testimony',1,5.3,8,500,775,100);key(vote,'transform/position',5.3,[500,855,0]);key(vote,'transform/position',5.55,[500,775,0]);var trueSeal=image('Truth mark',6,6.6,8,730,1045,70);key(trueSeal,'transform/scale',6.6,[105,105,100]);key(trueSeal,'transform/scale',6.8,[70,70,100]);text('Truth','②は真実。',500,1320,87,'#a6d6c3',6.6,8,900);
text('Lie1','嘘は④',500,322,90,'#e88b8e',8,11,900);text('Lie2','本当の答えは？',500,405,62,'#f1e7d6',8,11,900);
var old=image('Fourth false testimony',3,8,8.95,500,810,100);var actual=image('Fourth corrected testimony',5,8.95,11,500,810,100);key(actual,'transform/position',8.95,[560,810,0]);key(actual,'transform/position',9.2,[500,810,0]);var lie=image('Lie mark',7,9.1,11,725,1110,70);key(lie,'transform/scale',9.1,[105,105,100]);key(lie,'transform/scale',9.35,[70,70,100]);text('Reveal','本当はホラー映画。',500,1280,55,'#f1e7d6',8.95,11,900);
function entrance(l,t,x,y){key(l,'transform/opacity',t,0);key(l,'transform/opacity',t+.18,100);key(l,'transform/position',t,[x,y+28,0]);key(l,'transform/position',t+.18,[x,y,0]);}
var logo=image('App logo',8,11,14.5,500,430,52);key(logo,'transform/scale',11,[48,48,100]);key(logo,'transform/scale',11.3,[52,52,100]);
var appshot=image('Actual app screenshot simulator fictional example',10,11.2,14.5,260,965,30);entrance(appshot,11.2,260,965);
text('App screenshot note','別の架空例・1.03検証画面',260,1390,25,'#d9c8a6',11.35,14.5,410);
var avatar=image('Revenant Natural still',9,11.55,14.5,730,1430,26);entrance(avatar,11.55,730,1430);
var app1=text('AppStore1','iPhoneで配信中',710,845,54,'#f1e7d6',11.35,14.5,500);entrance(app1,11.35,710,845);var app2=text('AppStore2','App Storeで',710,970,50,'#e6be7b',11.8,14.5,500);entrance(app2,11.8,710,970);var app3=text('AppStore3','嘘か誠か を検索',710,1050,49,'#e6be7b',12.15,14.5,500);entrance(app3,12.15,710,1050);var cta=text('CTA','次の嘘は、あなたの番。',500,1570,43,'#f1e7d6',12.95,14.5,920);entrance(cta,12.95,500,1570);
writeLn(JSON.stringify({comp:comp,boxes:boxes,fictional:true,scope:'reconstructed fictional example, no actual play',model:'static still',published:false}));`;
if(fs.existsSync(file('projects/truthorlie-vertical-v6.ecproj')))throw Error('Existing v6 project; preserve it.');fs.writeFileSync(file('source/composition-v6.jsx'),jsx);
const result=parse((await run(EC,['--empty','script',np(file('source/composition-v6.jsx')),'--save-as',np(file('projects/truthorlie-vertical-v6.ecproj')),'--json'],'ec-v6-build.json')).stdout);if(!result.ok)throw Error(JSON.stringify(result));save('qa/ec-v6-project.json',{...parse(result.output),projectSha256:hash(file('projects/truthorlie-vertical-v6.ecproj')),rendered:false,layoutVerified:false});console.log('EffectCraft project saved; render and visual inspection pending.');
