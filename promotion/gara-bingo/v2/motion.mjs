import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const reviewTimes=[.3,1.1,2.1,3.8,5.4,7.0,8.8,10.0,10.85,11.8,13.6,15.1,16.7,18.25,20.6];
export const cuts=[0,.8,1.6,3.2,4.8,6.4,8,12.8,14.4,16,19.2,22];
export function composition(root){
 const native=p=>{const r=spawnSync('wslpath',['-w',p],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
 const assets=['character-cutout.png','character-point.png','character-peace.png','stage-background.png'].map(f=>native(path.join(root,'media',f)));
 return `app.newProject();app.beginUndoGroup('Osayu energetic revision 02');
var D=22,boxes=[],motionLedger=[],rig=null,rigLayers=[],sceneNo=0,ink='#F5FCFF',mint='#A8F3E0',pink='#FF95D2',dark='#0C1020';
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,times){var ks=[];for(var i=0;i<times.length;i++)ks.push({layer:l,prop:p,time:times[i]});run('keys.select',{keys:ks,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:68,outInfluence:68,continuous:false});}
var comp=run('comp.new',{name:'Osayu Bingo V2',width:1080,height:1920,frameRate:30,duration:D,background:dark,shutterAngle:150,shutterPhase:-75,motionBlurSamples:8}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});run('comp.setSwitch',{switch:'motionBlur',value:true});
var imp=run('file.import',{paths:${JSON.stringify(assets)},sequence:false});if(imp.errors.length)throw Error(JSON.stringify(imp.errors));
function attach(l){if(rig){run('layer.setParent',{layers:[l],parent:rig,compensate:true});rigLayers.push(l);}run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:true});return l;}
function shape(name,w,h,x,y,c,a,b,op,kind,stroke,untracked){var l=run('layer.newShape',{name:name,kind:kind||'rounded',size:[w,h],position:[x,y],fill:c,stroke:stroke||c,strokeWidth:stroke?2:0}).layer;timing(l,a,b);if(op!==undefined)set(l,'transform/opacity',op);if(!untracked)attach(l);return l;}
function txt(name,text,x,y,size,color,a,b,width,align,pop){var l=run('layer.newText',{name:name,text:text,font:'Meiryo',style:'Bold',size:size,fill:color,position:[x,y],justify:align||'left'}).layer;var o=app.project.activeItem.layer(name),r=o.sourceRectAtTime(a,false);if(r.width>(width||790)){size=Math.floor(size*(width||790)/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}timing(l,a,b);attach(l);run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});boxes.push({name:name,text:text,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,start:a,end:b,scene:sceneNo});if(pop){key(l,'transform/position',a,[x,y+68]);key(l,'transform/position',a+.15,[x,y-7]);key(l,'transform/position',a+.24,[x,y]);ease(l,'transform/position',[a,a+.15,a+.24]);}return l;}
function picture(name,item,x,y,s,a,b,untracked){var l=run('layer.addItem',{item:item,time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:name});timing(l,a,b);set(l,'transform/position',[x,y]);set(l,'transform/scale',[s,s]);if(!untracked)attach(l);return l;}
function actor(name,pose,x,y,height,a,b,tilt){var s=height/1774*100,l=picture(name,imp.items[pose],x,y,s,a,b);key(l,'transform/position',a,[x+85,y+65]);key(l,'transform/position',a+.17,[x-12,y-10]);key(l,'transform/position',a+.28,[x,y]);key(l,'transform/position',b-.08,[x-18,y-15]);key(l,'transform/rotation',a,(tilt||0)-5);key(l,'transform/rotation',a+.22,tilt||0);key(l,'transform/rotation',b-.08,(tilt||0)+1.4);key(l,'transform/scale',a,[s*.94,s*1.035]);key(l,'transform/scale',a+.18,[s*1.025,s*.985]);key(l,'transform/scale',a+.32,[s,s]);ease(l,'transform/position',[a,a+.17,a+.28,b-.08]);ease(l,'transform/rotation',[a,a+.22,b-.08]);ease(l,'transform/scale',[a,a+.18,a+.32]);motionLedger.push({kind:'actor-gesture',name:name,pose:pose===1?'point':pose===2?'peace':'base',layer:l,from:a,to:b});return l;}
function begin(name,a,b,base){rig=null;sceneNo++;if(base)shape(name+' color field',1300,2300,540,960,base,a,b,100,'rect',null,true);var l=run('layer.newNull',{name:'CAM '+sceneNo+' '+name}).layer;set(l,'transform/anchor',[540,960,0]);set(l,'transform/position',[540,960,0]);timing(l,a,b);rig=l;rigLayers=[];motionLedger.push({kind:'camera',name:name,layer:l,from:a,to:b});return l;}
function cam(l,t,x,y,s,r){key(l,'transform/position',t,[x,y,0]);key(l,'transform/scale',t,[s,s,100]);key(l,'transform/rotation',t,r||0);}
function focus(l,t,x,y,s,r){var k=s/100;cam(l,t,540+(540-x)*k,960+(960-y)*k,s,r);}
function finish(l,times){ease(l,'transform/position',times);ease(l,'transform/scale',times);ease(l,'transform/rotation',times);rig=null;}
function pill(name,text,x,y,w,a,b,color){shape(name+' plate',w,65,x,y,dark,a,b,98,'rounded',color||mint);txt(name,text,x,y+11,27,color||mint,a,b,w-32,'center',false);}
function rays(a,b,color){for(var i=0;i<8;i++){var x=i%2?1060:15,y=350+Math.floor(i/2)*320,l=shape('Speed trail '+sceneNo+' '+i,160,4,x,y,color,a,Math.min(a+.4,b),65,'rect');set(l,'transform/rotation',i%2?-21:21);key(l,'transform/position',a,[x+(i%2?220:-220),y+85]);key(l,'transform/position',a+.28,[x,y]);}}
// The persistent stage moves at a different rate from the foreground cameras.
var stage=picture('Parallax glass stage',imp.items[3],540,960,128,0,D,true);key(stage,'transform/position',0,[540,960]);key(stage,'transform/position',8,[490,990]);key(stage,'transform/position',16,[575,925]);key(stage,'transform/position',22,[540,960]);
shape('Readable dark wash',1080,1920,540,960,dark,0,D,40,'rect',null,true);

// 0.0—0.8: immediate character close-up; half-beat punch zoom.
var c=begin('Hey',0,.8);actor('Opening peace',2,560,1500,2700,0,.8,-2);shape('Hey text shadow',780,230,490,1260,dark,0,.8,95);txt('Hey','ねえ、',105,1320,154,mint,0,.8,780,'left',false);cam(c,0,465,1060,128,-5);cam(c,.17,540,960,100,0);cam(c,.4,540,960,100,0);cam(c,.47,510,980,112,2);cam(c,.73,520,970,108,0);finish(c,[0,.17,.4,.47,.73]);

// 0.8—1.6: match the gesture, then chase the type into place.
c=begin('Osayu',.8,1.6);actor('Opening point',1,650,1730,2600,.8,1.6,1);shape('Osayu shadow',810,190,490,1190,dark,.8,1.6,97);txt('Osayu hook','おさゆに、',108,1250,123,ink,.8,1.6,780,'left',true);cam(c,.8,250,1020,117,-4);cam(c,1.01,540,960,100,0);cam(c,1.53,575,950,103,1);finish(c,[.8,1.01,1.53]);

// 1.6—3.2: the central question earns attention before explaining the rules.
c=begin('What line',1.6,3.2);actor('Question pointing',1,650,1930,2300,1.6,3.2,-1);pill('Question tag','初ビンゴ、やります。',300,335,400,1.6,3.2,pink);txt('What','何て',100,525,122,ink,1.6,3.2,790,'left',true);txt('Request question','言わせる？',100,679,110,mint,1.7,3.2,790,'left',true);rays(1.6,3.2,pink);cam(c,1.6,760,1010,126,5);cam(c,1.85,540,960,100,0);cam(c,2.35,540,960,100,0);cam(c,2.44,510,975,107,-1.5);cam(c,3.12,535,962,102,0);finish(c,[1.6,1.85,2.35,2.44,3.12]);

// 3.2—4.8: bass drop and graphic palette inversion, followed by a spring landing.
c=begin('Reward drop',3.2,4.8,mint);actor('Drop peace',2,670,1820,1900,3.2,4.8,3);txt('Every line','一列ごとに',100,428,64,dark,3.2,4.8,790,'left',true);txt('Request','リクエスト',100,585,99,dark,3.28,4.8,790,'left',true);txt('Voice line','セリフ！',92,755,144,dark,3.4,4.8,790,'left',true);rays(3.2,4.8,dark);cam(c,3.2,540,1040,145,-6);cam(c,3.38,540,940,96,1);cam(c,3.5,540,960,100,0);cam(c,4.72,523,970,104,-1);finish(c,[3.2,3.38,3.5,4.72]);

// 4.8—6.4: the pointing finger directs viewers to the first-visit goal.
c=begin('First visitors',4.8,6.4);shape('Visitor label shadow',450,360,310,535,dark,4.8,6.4,97);actor('Point at first visitors',1,720,1420,2040,4.8,6.4,0);txt('First visitor label','初見さん',100,470,76,ink,4.8,6.4,480,'left',true);txt('First visitor goal','20人',100,665,147,mint,4.94,6.4,480,'left',true);pill('First visitor caption','はじめまして、大歓迎。',490,1450,780,4.8,6.4,mint);cam(c,4.8,810,1080,125,-4);cam(c,5.02,540,960,100,0);cam(c,5.95,540,960,100,0);cam(c,6.27,515,975,106,-1);finish(c,[4.8,5.02,5.95,6.27]);

// 6.4—8.0: peace-sign pose; an invitation that costs only a greeting.
c=begin('Greeting',6.4,8);actor('Greeting peace',2,650,1510,2070,6.4,8,-2);shape('Greeting label shadow',490,380,330,535,dark,6.4,8,97);txt('Greeting label','おはさゆ',100,470,75,ink,6.4,8,490,'left',true);txt('Greeting goal','20回',100,665,147,pink,6.55,8,490,'left',true);pill('Greeting caption','ひと言から、参加できる。',490,1450,780,6.4,8,pink);cam(c,6.4,260,1040,125,4);cam(c,6.62,540,960,100,0);cam(c,7.9,565,948,104,1);finish(c,[6.4,6.62,7.9]);

// 8.0—12.8: full board -> camera follows first visitors -> greeting -> full board.
c=begin('Board chase',8,12.8);txt('Board headline','みんなで BINGO!',100,406,69,ink,8,12.8,790,'left',true);txt('Board sub','音桜夢の初挑戦  /  9つの目標',100,474,28,mint,8,12.8,790,'left',false);
var labs=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'],nums=['20人','100K','10回','20個','1個','10人','15個','20回','5人'];
for(var j=0;j<9;j++){var x=228+(j%3)*263,y=675+Math.floor(j/3)*224;shape('Goal card '+j,246,208,x,y,'#152634',8,12.8,99,'rounded',j===0||j===7?mint:'#728DAD');txt('Goal label '+j,labs[j],x,y-26,31,ink,8,12.8,220,'center',false);txt('Goal number '+j,nums[j],x,y+43,53,j===0||j===7?mint:pink,8,12.8,220,'center',false);if(j===3)txt('Any gift','なんでもOK',x,y+81,20,ink,8,12.8,220,'center',false);}
pill('Board reward','一列ごとに → リクエストセリフ',490,1435,780,8,12.8,mint);
cam(c,8,500,1080,126,-4);cam(c,8.22,540,960,100,0);cam(c,9.5,540,960,100,0);focus(c,9.76,228,675,185,-2);focus(c,10.32,228,675,185,-2);focus(c,10.58,491,1123,185,2);focus(c,11.12,491,1123,185,2);cam(c,11.4,540,960,100,0);cam(c,12.73,540,960,100,0);finish(c,[8,8.22,9.5,9.76,10.32,10.58,11.12,11.4,12.73]);motionLedger.push({kind:'tracked-targets',rig:c,targets:[{time:9.76,label:'初見さん20人',x:228,y:675},{time:10.58,label:'おはさゆ20回',x:491,y:1123}]});

// 12.8—14.4: accurately preserve the full-board reward, including chorus-only.
c=begin('Chorus reward',12.8,14.4);actor('Point at chorus reward',1,755,1830,2050,12.8,14.4,1);txt('Complete label','全マス達成で',100,413,61,ink,12.8,14.4,790,'left',true);txt('Singing label','歌ってみた',100,558,91,ink,12.92,14.4,790,'left',true);txt('Chorus label','サビを',100,719,130,pink,13.03,14.4,790,'left',true);txt('Later post','後日投稿！',100,854,83,mint,13.12,14.4,790,'left',true);cam(c,12.8,730,1050,124,4);cam(c,13.02,540,960,100,0);cam(c,14.32,520,977,105,-1);finish(c,[12.8,13.02,14.32]);

// 14.4—16.0: the person, rather than the grid, becomes the emotional payoff.
c=begin('Together',14.4,16);actor('Together peace',2,655,1910,2230,14.4,16,-2);txt('Together first line','初めての一列、',100,430,66,ink,14.4,16,790,'left',true);txt('Together second line','一緒に',100,582,119,mint,14.52,16,790,'left',true);txt('Together last line','つくって。',100,727,106,ink,14.62,16,790,'left',true);cam(c,14.4,300,1070,126,-5);cam(c,14.62,540,960,100,0);cam(c,15.9,555,950,104,1);finish(c,[14.4,14.62,15.9]);

// 16.0—19.2: pan from date to time, then lock both for the final invitation.
c=begin('Date to time',16,19.2);shape('Date time plate',900,1050,490,850,dark,16,19.2,96);txt('Event date label','初ビンゴ / TikTok LIVE',100,410,33,mint,16,19.2,790,'left',false);txt('Event date punch','11/24',490,707,171,ink,16,19.2,790,'center',true);txt('Event time punch','22:00',490,1048,177,pink,16,19.2,790,'center',true);txt('Event invitation','おさゆの配信で、待ってる。',490,1230,41,mint,16,19.2,790,'center',false);focus(c,16,490,650,143,-4);focus(c,16.22,490,730,116,0);focus(c,17.5,490,730,116,0);focus(c,17.77,490,1020,127,2);focus(c,18.98,490,1020,127,0);finish(c,[16,16.22,17.5,17.77,18.98]);

// 19.2—22.0: readable lock-off; the beat resolves while the smile stays alive.
c=begin('Meet in live',19.2,22);actor('Final peace',2,620,1915,2000,19.2,22,-1);shape('Final info plate',850,700,490,695,dark,19.2,22,97);txt('Final headline','初見さんも、一緒に。',100,460,57,ink,19.2,22,790,'left',true);txt('Final date','11/24',100,654,112,mint,19.3,22,400,'left',true);txt('Final time','22:00',570,647,85,pink,19.4,22,310,'left',true);txt('Final platform','TikTok LIVE',100,733,31,ink,19.5,22,790,'left',false);shape('Final CTA plate',780,105,490,894,mint,19.2,22,100);txt('Final CTA','プロフィールから、配信へ。',490,910,39,dark,19.55,22,740,'center',true);pill('Account handle','@oosayuuu2525',490,1450,780,19.2,22,mint);cam(c,19.2,590,1060,114,3);cam(c,19.43,540,960,100,0);cam(c,21.92,540,960,100,0);finish(c,[19.2,19.43,21.92]);

// Directional wipes bridge pose changes; they are moving panels, not strobes.
rig=null;var trans=[.8,1.6,3.2,4.8,6.4,8,12.8,14.4,16,19.2];
for(var k=0;k<trans.length;k++){var t=trans[k],sg=k%2?1:-1,w=shape('Whip transition '+k,1200,2800,-1800*sg,960,k%2?pink:mint,t-.09,t+.10,100,'rect',null,true);set(w,'transform/rotation',sg*-14);key(w,'transform/position',t-.09,[-1800*sg,960]);key(w,'transform/position',t+.10,[2500*sg,960]);run('layer.setSwitch',{layers:[w],switch:'motionBlur',value:true});motionLedger.push({kind:'whip-wipe',time:t,duration:.19});}
// Constant branding is readable independently of every foreground camera.
shape('Brand HUD',490,58,345,240,dark,0,D,97,'rounded',null,true);txt('Brand HUD text','OSAYU / 音桜夢   BINGO LIVE',345,250,24,mint,0,D,460,'center',false);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,motionLedger:motionLedger,scenes:sceneNo,duration:D,bpm:150,cuts:${JSON.stringify(cuts)},poseNames:['base','point','peace']}));`;
}
