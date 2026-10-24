/** Animate typography only. The original portrait is a separate fixed layer. */
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const reviewTimes=[.5,2.2,3.8,5.4,7,8.6,10.2,11.8,13.5,15.1,17,18.4,20.5];
export const portraitBounds={x:500,y:735,width:390,height:780};
export function composition(root,{includeCharacter=true}={}){
 const result=spawnSync('wslpath',['-w',path.join(root,'media/character-original.jpg')],{encoding:'utf8'});
 if(result.status)throw Error(result.stderr);
 const originalPath=result.stdout.trim();
 return `app.newProject();app.beginUndoGroup('Osayu original fixed typography');
var D=22,boxes=[],motionLedger=[],sceneNo=0,topRig=null,leftRig=null,pending=null,ink='#142130',teal='#007D76',pink='#C02679';
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function time(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,ts){var ks=[];for(var i=0;i<ts.length;i++)ks.push({layer:l,prop:p,time:ts[i]});run('keys.select',{keys:ks,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:68,outInfluence:68,continuous:false});}
var comp=run('comp.new',{name:'Osayu Bingo V3',width:1080,height:1920,frameRate:30,duration:D,background:'#FFFFFF'}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
run('comp.setSwitch',{switch:'motionBlur',value:false});
function parent(l,zone){var rig=zone==='left'?leftRig:zone==='top'?topRig:null;if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});return l;}
function rect(name,w,h,x,y,color,a,b,zone){var l=run('layer.newShape',{name:name,kind:'rect',size:[w,h],position:[x,y],fill:color,strokeWidth:0}).layer;time(l,a,b);parent(l,zone);return l;}
function txt(name,text,x,y,size,color,a,b,width,zone,align,pop){var l=run('layer.newText',{name:name,text:text,position:[x,y],font:'Meiryo',style:'Bold',size:size,fill:color,justify:align||'left'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>width){size=Math.floor(size*width/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}time(l,a,b);parent(l,zone);run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});boxes.push({name:name,text:text,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,start:a,end:b,scene:sceneNo,zone:zone,settled:true});if(pop){key(l,'transform/position',a,[x,y+38]);key(l,'transform/position',a+.12,[x,y-4]);key(l,'transform/position',a+.22,[x,y]);ease(l,'transform/position',[a,a+.12,a+.22]);}return l;}
function makeRig(name,x,y,a,b){var l=run('layer.newNull',{name:name}).layer;set(l,'transform/anchor',[x,y,0]);set(l,'transform/position',[x,y,0]);time(l,a,b);return l;}
function finishScene(){if(!pending)return;var a=pending.a,b=pending.b,sign=pending.sign,topRig=pending.top,leftRig=pending.left;
 key(topRig,'transform/position',a,[490+sign*190,502,0]);key(topRig,'transform/position',a+.14,[490-sign*12,488,0]);key(topRig,'transform/position',a+.24,[490,490,0]);key(topRig,'transform/position',b-.08,[490,490,0]);key(topRig,'transform/scale',a,[118,118,100]);key(topRig,'transform/scale',a+.14,[98,98,100]);key(topRig,'transform/scale',a+.24,[100,100,100]);
 key(leftRig,'transform/position',a,[130,1105,0]);key(leftRig,'transform/position',a+.14,[285,1085,0]);key(leftRig,'transform/position',a+.24,[280,1090,0]);key(leftRig,'transform/scale',a,[112,112,100]);key(leftRig,'transform/scale',a+.14,[97,97,100]);key(leftRig,'transform/scale',a+.24,[100,100,100]);
 ease(topRig,'transform/position',[a,a+.14,a+.24,b-.08]);ease(topRig,'transform/scale',[a,a+.14,a+.24]);ease(leftRig,'transform/position',[a,a+.14,a+.24]);ease(leftRig,'transform/scale',[a,a+.14,a+.24]);
 pending=null;}
function scene(name,a,b,n){finishScene();sceneNo++;var sign=n%2?1:-1;topRig=makeRig('TEXT CAMERA '+sceneNo+' '+name,490,490,a,b);leftRig=makeRig('TEXT DETAIL '+sceneNo,280,1090,a,b);pending={a:a,b:b,sign:sign,top:topRig,left:leftRig};
 motionLedger.push({kind:'typography-only',name:name,from:a,to:b,rigs:[topRig,leftRig]});
 txt('Section '+sceneNo,('0'+sceneNo).slice(-2)+' / BINGO LIVE',100,302,23,teal,a,b,790,null,'left',false);
}
function top(name,text,y,size,c,a,b,pop){return txt(name,text,100,y,size,c,a,b,790,'top','left',pop!==false);}
function left(name,text,y,size,c,a,b,pop){return txt(name,text,100,y,size,c,a,b,360,'left','left',pop!==false);}

scene('Hook',0,1.6,0);top('Hook identity','おさゆに、',440,77,ink,0,1.6,false);top('Hook question','何て言わせる？',590,90,teal,.1,1.6);left('Hook your','あなたの',920,60,ink,0,1.6);left('Hook request','リクエストが',1020,51,ink,.12,1.6);left('Hook reward','セリフに。',1140,76,pink,.24,1.6);
scene('Line reward',1.6,3.2,1);top('Every line','一列そろうたび',440,79,ink,1.6,3.2);top('Requested line','リクエストセリフ',590,79,teal,1.72,3.2);left('Line repeated','一列ごとに',920,38,ink,1.6,3.2);left('Say it','言います。',1060,84,pink,1.8,3.2);
scene('First bingo',3.2,4.8,2);top('First bingo title','初ビンゴ、',440,108,ink,3.2,4.8);top('Join bingo','一緒にやろ。',590,97,teal,3.32,4.8);left('New people','初見さんも',940,59,ink,3.2,4.8);left('Welcome','大歓迎。',1100,108,pink,3.4,4.8);
scene('One greeting',4.8,6.4,3);top('One word title','まずは、ひと言。',440,88,ink,4.8,6.4);top('Say hi in live','配信で声をかけてね。',575,50,teal,4.92,6.4);left('Greeting word','おはさゆ',980,76,pink,4.9,6.4);left('Greeting suffix','って！',1120,99,ink,5.06,6.4);
scene('First visitor goal',6.4,8,4);top('Participation title','あなたの参加が',440,84,ink,6.4,8);top('One square','ひとマスの力に。',590,78,teal,6.52,8);left('First visitor label','初見さん',920,66,ink,6.4,8);left('First visitor amount','20人',1085,135,teal,6.6,8);left('Goal note visitor','みんなで目指す目標',1190,24,ink,6.72,8);
scene('Greeting goal',8,9.6,5);top('Greeting title','あいさつでも',440,99,ink,8,9.6);top('Join with greeting','参加できる。',590,100,teal,8.12,9.6);left('Greeting goal label','おはさゆ',920,76,ink,8,9.6);left('Greeting goal amount','20回',1085,135,pink,8.2,9.6);left('Goal note greeting','みんなで目指す目標',1190,24,ink,8.32,9.6);

scene('Nine goals',9.6,12.8,6);top('Nine goals title','みんなで BINGO',366,67,ink,9.6,12.8);var labs=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'],nums=['20人','100K','10回','20個','1個','10人','15個','20回','5人'];
for(var j=0;j<9;j++){var x=228+(j%3)*263,y=455+Math.floor(j/3)*100;rect('Goal divider '+j,230,2,x,y+43,'#D5E6E3',9.6,12.8,null);txt('Goal label '+j,labs[j],x,y-8,25,ink,9.6,12.8,228,null,'center',false);txt('Goal amount '+j,nums[j],x,y+33,39,j===0||j===7?teal:pink,9.6,12.8,228,null,'center',false);}
left('Nine line label','一列ごとに',920,37,ink,9.6,12.8);left('Nine request line','セリフを',1020,65,teal,9.74,12.8);left('Nine request suffix','リクエスト',1125,57,pink,9.88,12.8);left('Gift note label','ギフトは',1250,29,ink,9.6,12.8,false);left('Gift note value','なんでもOK',1320,38,ink,9.6,12.8,false);

scene('Complete reward',12.8,14.4,7);top('Complete condition','全マス達成で',440,88,ink,12.8,14.4);top('Singing promise','歌ってみた',590,102,teal,12.92,14.4);left('Chorus only','サビを',980,100,pink,12.96,14.4);left('Later post','後日投稿',1120,78,ink,13.12,14.4);
scene('Together',14.4,16,8);top('Together first','初めての一列、',440,80,ink,14.4,16);top('Together second','一緒につくって。',590,77,teal,14.52,16);left('Together welcome','初見さんも',980,59,ink,14.4,16);left('Together word','一緒に。',1120,96,pink,14.6,16);
scene('Date and time',16,19.2,9);top('Date big','11/24',470,153,ink,16,19.2);top('Time big','22:00',665,156,pink,16.16,19.2);left('Date description','11月24日',960,54,ink,16.2,19.2);left('Time description','22時スタート',1050,43,teal,16.32,19.2);left('Live platform','TikTok LIVE',1160,33,ink,16.44,19.2);
scene('Final invitation',19.2,22,10);top('Final date','11/24',470,114,ink,19.2,22);txt('Final time','22:00',570,465,85,pink,19.32,22,310,'top','left',true);top('Final platform','TikTok LIVE',555,36,teal,19.4,22);top('Final welcome','初見さんも、大歓迎。',660,52,ink,19.5,22);left('Final destination','プロフィールから',960,38,ink,19.2,22);left('Final action','配信へ。',1110,92,teal,19.4,22);

finishScene();topRig=null;leftRig=null;txt('Creator identity','音桜夢 / おさゆ',100,242,32,ink,0,D,790,null,'left',false);rect('Identity accent',98,7,149,265,teal,0,D,null);txt('Account handle','@oosayuuu2525',100,1450,25,teal,0,D,360,null,'left',false);
var portrait=null;
${includeCharacter?`var imported=run('file.import',{paths:[${JSON.stringify(originalPath)}],sequence:false});if(imported.errors.length)throw Error(JSON.stringify(imported.errors));portrait=run('layer.addItem',{item:imported.items[0],time:0,duration:D}).layer;run('layer.rename',{layer:portrait,name:'CHARACTER ORIGINAL FIXED'});time(portrait,0,D);set(portrait,'transform/position',[695,1125,0]);set(portrait,'transform/scale',[${390/905*100},${390/905*100},100]);set(portrait,'transform/rotation',0);set(portrait,'transform/opacity',100);run('layer.setParent',{layers:[portrait],parent:null,compensate:true});run('layer.setSwitch',{layers:[portrait],switch:'motionBlur',value:false});`:`rect('Reserved original portrait area',390,780,695,1125,'#F2F4F4',0,D,null);txt('Text-only notice','固定立ち絵の領域',695,1125,24,'#708080',0,D,360,null,'center',false);`}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,motionLedger:motionLedger,scenes:sceneNo,duration:D,bpm:150,includeCharacter:${includeCharacter},portraitLayer:portrait,portraitBounds:{x:500,y:735,width:390,height:780},portraitPolicy:'Original JPEG fixed; no image AI, effects, masks, parent, keys or pose variants.'}));`;
}
