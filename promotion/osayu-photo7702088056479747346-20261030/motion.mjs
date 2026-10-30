/** Character images are ordinary native-media references only. Never AI inputs. */
import path from 'node:path';
export const compName='Osayu 157 — November 3 Tutorial Battle';
export const duration=19;
export const fps=30;
export const cuts=[0,1,3.2,6,9.8,13,15.4,19];
export const reviewTimes=[.5,1.7,2.7,3.8,5.4,6.6,8.4,10.4,12.3,13.6,14.7,16.1,17.8,18.8];
export const characterBox={x:500,y:760,width:450,height:900};

export function composition(root,{includeCharacter=false}={}){
 const assets=[path.join(root,'media/stage-background.png'),...(includeCharacter?[path.join(root,'media/character-cutout.png')]:[])];
 return `app.newProject();app.beginUndoGroup('Osayu157 independent scene layout');
var D=${duration},boxes=[],ledger=[],rig=null,scene=0,ink='#F5FCFF',mint='#A8F3E0',pink='#FF95D2',navy='#0C1020';
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function time(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,ts){var keys=[];for(var i=0;i<ts.length;i++)keys.push({layer:l,prop:p,time:ts[i]});run('keys.select',{keys:keys,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:65,outInfluence:65,continuous:false});}
var comp=run('comp.new',{name:${JSON.stringify(compName)},width:1080,height:1920,frameRate:30,duration:D,background:navy}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var imported=run('file.import',{paths:${JSON.stringify(assets)},sequence:false});if(imported.errors.length)throw Error(JSON.stringify(imported.errors));
function attach(l){if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(name,w,h,x,y,color,a,b,opacity,kind,stroke,free){var l=run('layer.newShape',{name:name,kind:kind||'rounded',size:[w,h],position:[x,y],fill:color,stroke:stroke||color,strokeWidth:stroke?3:0}).layer;time(l,a,b);if(opacity!==undefined)set(l,'transform/opacity',opacity);if(!free)attach(l);return l;}
function txt(name,text,x,y,size,color,a,b,width,align,pop){var l=run('layer.newText',{name:name,text:text,font:'Meiryo',style:'Bold',size:size,fill:color,position:[x,y],justify:align||'left'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>width){size=Math.floor(size*width/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}time(l,a,b);attach(l);boxes.push({name:name,text:text,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,start:a,end:b,scene:scene,placeholder:false});if(pop){key(l,'transform/position',a,[x+160,y+55]);key(l,'transform/position',a+.15,[x-10,y-6]);key(l,'transform/position',a+.27,[x,y]);ease(l,'transform/position',[a,a+.15,a+.27]);}return l;}
function pic(name,item,x,y,scale){var l=run('layer.addItem',{item:item,time:0,duration:D}).layer;run('layer.rename',{layer:l,name:name});time(l,0,D);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[scale,scale,100]);return l;}
function begin(name,a,b){rig=null;scene++;var l=run('layer.newNull',{name:'OBJECT MOTION '+scene+' '+name}).layer;time(l,a,b);set(l,'transform/anchor',[540,960,0]);set(l,'transform/position',[540,960,0]);rig=l;ledger.push({kind:'scene',name:name,from:a,to:b,layer:l});return l;}
function cam(l,t,x,y,s,r){key(l,'transform/position',t,[x,y,0]);key(l,'transform/scale',t,[s,s,100]);key(l,'transform/rotation',t,r);}
function land(l,a,b,side){cam(l,a,540+side*145,1020,119,side*4);cam(l,a+.16,534,956,99,-side*.4);cam(l,a+.29,540,960,100,0);cam(l,b-.08,540,960,100,0);ease(l,'transform/position',[a,a+.16,a+.29,b-.08]);ease(l,'transform/scale',[a,a+.16,a+.29,b-.08]);ease(l,'transform/rotation',[a,a+.16,a+.29,b-.08]);rig=null;}
function pill(name,label,x,y,w,a,b,color,size){shape(name+' plate',w,66,x,y,navy,a,b,98,'rounded',color);txt(name+' label',label,x,y+11,size||25,color,a,b,w-28,'center',false);}
function trails(a,b,color){for(var i=0;i<5;i++){var y=340+i*92,l=shape('Trail '+scene+' '+i,220,5,80,y,color,a,Math.min(a+.3,b),70,'rect');key(l,'transform/position',a,[-350,y+70]);key(l,'transform/position',a+.24,[90,y]);}}

var stage=pic('APPROVED CHARACTER-FREE STAGE',imported.items[0],540,960,128);
key(stage,'transform/position',0,[525,970,0]);key(stage,'transform/position',9.8,[565,950,0]);key(stage,'transform/position',D,[525,970,0]);
shape('Stage contrast',1080,1920,540,960,navy,0,D,55,'rect',null,true);
for(var i=0;i<4;i++){var q=shape('Ambient tile '+i,35+i*8,35+i*8,140+i*75,1040+i*120,i%2?pink:mint,0,D,45,'rect',null,true);key(q,'transform/position',0,[140+i*75,1100+i*120]);key(q,'transform/position',D,[180+i*65,1000+i*120]);key(q,'transform/rotation',0,10+i*15);key(q,'transform/rotation',D,80+i*15);}

var c=begin('date impact',0,1);pill('Opening name','音桜夢 / おさゆ',315,315,440,0,1,pink);txt('Opening date','11/3',95,610,245,mint,0,1,790,'left',false);shape('Date underline',730,14,460,655,pink,0,1,100,'rect');trails(0,1,pink);land(c,0,1,-1);
c=begin('battle announcement',1,3.2);txt('Announcement artist','おさゆ、',95,440,106,ink,1,3.2,790,'left',true);txt('Announcement battle','バトル',95,620,175,mint,1.1,3.2,790,'left',true);txt('Announcement confirmed','決定！',95,1080,97,pink,1.2,3.2,345,'left',true);trails(1,3.2,mint);land(c,1,3.2,1);
c=begin('tutorial battle',3.2,6);pill('Tutorial date','11月3日',290,315,360,3.2,6,mint);txt('Tutorial line 1','チュートリアル',95,465,96,ink,3.2,6,790,'left',true);txt('Tutorial line 2','バトル',95,650,180,pink,3.32,6,790,'left',true);txt('Tutorial aside','応援してね！',95,1090,53,mint,3.5,6,345,'left',true);trails(3.2,6,pink);land(c,3.2,6,-1);
c=begin('respected teacher',6,9.8);pill('Teacher tag','先生は…',280,315,340,6,9.8,pink);txt('Teacher respect','尊敬する',95,460,109,ink,6.1,9.8,790,'left',true);txt('Teacher name','セラ先輩！',95,641,135,mint,6.25,9.8,790,'left',true);shape('Teacher name plate',350,160,270,1060,navy,6,9.8,98,'rounded',pink);txt('Teacher exact name','セラ・ネージュ',270,1075,45,ink,6.4,9.8,320,'center',true);land(c,6,9.8,1);
c=begin('nervous but determined',9.8,13);txt('Nervous line','緊張してるけど',95,442,87,ink,9.8,13,790,'left',true);txt('Determined line','頑張ります！',95,644,116,pink,9.95,13,790,'left',true);for(var j=0;j<3;j++){var x=145+j*112,block=shape('Cheer tile '+j,76,76,x,1060,j%2?mint:pink,9.8,13,100);key(block,'transform/position',9.8,[x,1360]);key(block,'transform/position',10.1+j*.1,[x,1060]);key(block,'transform/rotation',9.8,-25+j*20);key(block,'transform/rotation',10.35,0);}trails(9.8,13,mint);land(c,9.8,13,-1);
c=begin('invitation',13,15.4);txt('Invitation audience','みんなの応援',95,442,95,ink,13,15.4,790,'left',true);txt('Invitation call','待ってる！',95,644,142,mint,13.15,15.4,790,'left',true);pill('Invitation platform','TikTok LIVE',280,1080,350,13.3,15.4,pink);land(c,13,15.4,1);
c=begin('date and single CTA',15.4,19);pill('Final battle tag','チュートリアルバトル',490,315,790,15.4,19,mint,45);txt('Final date','11/3',95,575,223,ink,15.4,19,790,'left',true);shape('Final CTA plate',830,105,510,680,mint,15.4,19,100);txt('Final CTA','プロフィールから配信へ',510,697,43,navy,15.6,19,785,'center',true);txt('Final artist','音桜夢',95,1060,65,ink,15.4,19,345,'left',true);txt('Final reading','おさゆ',95,1135,40,pink,15.5,19,345,'left',true);txt('Final account','@oosayuuu2525',95,1435,28,mint,15.4,19,345,'left',false);land(c,15.4,19,-1);

rig=null;var transitions=${JSON.stringify(cuts.slice(1,-1))};for(var k=0;k<transitions.length;k++){var t=transitions[k],w=shape('Directional wipe '+k,1150,2400,-1700,960,k%2?mint:pink,t-.08,t+.1,100,'rect',null,true);set(w,'transform/rotation',-12);key(w,'transform/position',t-.08,[-1700,960]);key(w,'transform/position',t+.1,[2300,960]);ledger.push({kind:'wipe',time:t,duration:.18});}
shape('Brand label plate',790,58,490,215,navy,0,D,96,'rounded',null,true);txt('Brand label','OSAYU / TUTORIAL BATTLE',490,227,24,mint,0,D,750,'center',false);
${includeCharacter?`var fixed=pic('CHARACTER ORIGINAL FIXED',imported.items[1],725,1210,450/905*100);set(fixed,'transform/anchor',[452.5,905,0]);set(fixed,'transform/rotation',0);set(fixed,'transform/opacity',100);run('layer.setSwitch',{layers:[fixed],switch:'motionBlur',value:false});`:`shape('CHARACTER RESERVED — NO IMAGE IMPORT',450,900,725,1210,'#6B7F88',0,D,16,'rect',mint,true);txt('Character reservation label','人物の固定表示領域',725,1250,28,mint,0,D,410,'center',false);`}
app.endUndoGroup();writeLn(JSON.stringify({duration:D,fps:30,sceneCount:scene,boxes:boxes,ledger:ledger,includeCharacter:${includeCharacter},characterBox:${JSON.stringify(characterBox)},contentStatus:'owner_supplied_text_confirmed',musicBpm:null}));`;
}
