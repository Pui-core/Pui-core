/** Three kinetic thank-you cuts. All character pixels stay in one static layer. */
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const spec = [
  {id:'a-baibai', title:'A｜達成ラッシュ', song:'倍倍FIGHT!', artist:'CANDY TUNE', bpm:176,
    audioFile:'baibai-fight.m4a',audioStart:.210, accent:'#A8F3E0',second:'#FF95D2',dark:'#0C1020',
    description:'数字が加速し、CLEARが連鎖。最後の1マスで一気に爆発する王道の祝勝会。',climaxBeat:44,outroBeat:56},
  {id:'b-patissier', title:'B｜ありがとうの贈りもの',song:'キス・ミー・パティシエ',artist:'CANDY TUNE',bpm:192,
    audioFile:'kiss-me-patissier.m4a',audioStart:.088,accent:'#FF95D2',second:'#A8F3E0',dark:'#27122C',
    description:'リボン、ハート、感謝のスタンプ。みんなの応援をプレゼントにして返す、かわいい感謝祭。',climaxBeat:48,outroBeat:60},
  {id:'c-disco',title:'C｜ビンゴ・ディスコ',song:'チョコレイト・ディスコ',artist:'Perfume',bpm:128,
    audioFile:'chocolate-disco.m4a',audioStart:.258,accent:'#A8F3E0',second:'#FFD79D',dark:'#111025',
    description:'9マスがダンスフロアに。マスと巨大文字がリズムで点灯する、遊び心のある祝祭。',climaxBeat:32,outroBeat:40}
];
export const plans=spec.map((p,i)=>{
 const beat=60/p.bpm,drop=2,climax=drop+p.climaxBeat*beat,outro=drop+p.outroBeat*beat;
 const montage=drop+(i===0?12:i===1?16:8)*beat;
 const span=(climax-montage)/4,last=montage+3*span;
 return {...p,index:i,duration:25,drop,beat,climax,outro,montage,
   boardZoom:[164,154,176][i],counterZoom:[146,138,154][i],lastZoom:[182,170,194][i],
   trackingReviewTimes:[2.3,2.85,3.1,3.48,3.78,4.22,4.72,5.12,
    montage+.8,montage+1.18,montage+1.75,montage+span-.28,
    last+.45,last+.85,last+1.3,climax-.23,
    climax+.65,climax+1,climax+1.75,climax+2.14,
    outro+.7,outro+1.15,outro+2.25,24.25],
   reviewTimes:[.55,1.65,2.48,3.8,montage-.35,montage+.55,montage+(climax-montage)*.35,
    montage+(climax-montage)*.68,climax-.65,climax+.5,climax+1.75,outro+.6,23.8],
   cuts:[0,2,montage,climax,outro,25]};
});
export function composition(root,p,{includeCharacter=true}={}){
 const native=f=>{const r=spawnSync('wslpath',['-w',f],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
 const images=[native(path.join(root,'media','stage-background.png'))];
 if(includeCharacter)images.push(native(path.join(root,'media','character-cutout.png')));
 return `app.newProject();app.beginUndoGroup('Osayu Thankyou ${p.id}');
var P=${JSON.stringify(p)},D=P.duration,beat=P.beat,A=P.accent,B=P.second,navy=P.dark,white='#F5FCFF',boxes=[],motionLedger=[],trackingTargets=[],rigNames={},rig=null;
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,ts){var k=[];for(var i=0;i<ts.length;i++)k.push({layer:l,prop:p,time:ts[i]});run('keys.select',{keys:k,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:65,outInfluence:65,continuous:false});}
function link(l,mb){if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:mb===true});return l;}
var comp=run('comp.new',{name:'Osayu Thankyou ${p.id}',width:1080,height:1920,frameRate:30,duration:D,background:navy,shutterAngle:120,shutterPhase:-60,motionBlurSamples:6}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});run('comp.setSwitch',{switch:'motionBlur',value:true});
var imp=run('file.import',{paths:${JSON.stringify(images)},sequence:false});if(imp.errors.length)throw Error(JSON.stringify(imp.errors));
function shape(n,w,h,x,y,col,a,b,stroke,kind,op,free){var l=run('layer.newShape',{name:n,kind:kind||'rounded',size:[w,h],position:[x,y],fill:col,stroke:stroke||col,strokeWidth:stroke?3:0}).layer;timing(l,a,b);if(op!==undefined)set(l,'transform/opacity',op);if(!free)link(l,false);return l;}
function txt(n,s,x,y,size,col,a,b,width,align,pop){var l=run('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:size,fill:col,position:[x,y],justify:align||'left'}).layer;var o=app.project.activeItem.layer(n),r=o.sourceRectAtTime(a,false);if(r.width>(width||800)){size=Math.floor(size*(width||800)/r.width);run('layer.setText',{layer:l,size:size});r=o.sourceRectAtTime(a,false);}timing(l,a,b);link(l,false);boxes.push({name:n,text:s,size:size,x:x+r.left,y:y+r.top,width:r.width,height:r.height,start:a,end:b});if(pop){key(l,'transform/position',a,[x+(P.index===1?0:125),y+100]);key(l,'transform/position',a+.16,[x-6,y-9]);key(l,'transform/position',a+.28,[x,y]);ease(l,'transform/position',[a,a+.16,a+.28]);}return l;}
function pill(n,s,x,y,w,a,b,col){shape(n+' plate',w,58,x,y,navy,a,b,col);txt(n,s,x,y+10,24,col,a,b,w-28,'center',false);}
function group(n,a,b){rig=null;var l=run('layer.newNull',{name:'OBJECT CAMERA '+n}).layer;rigNames[l]='OBJECT CAMERA '+n;set(l,'transform/anchor',[540,960,0]);set(l,'transform/position',[540,960,0]);timing(l,a,b);rig=l;motionLedger.push({kind:'object-camera',name:n,start:a,end:b});return l;}
function cam(l,t,x,y,s,r){key(l,'transform/position',t,[x,y,0]);key(l,'transform/scale',t,[s,s,100]);key(l,'transform/rotation',t,r||0);}
function follow(l,t,x,y,s,dx,dy,label){var k=s/100;cam(l,t,dx-(x-540)*k,dy-(y-960)*k,s,0);trackingTargets.push({rigName:rigNames[l],time:t,target:[x,y],screen:[dx,dy],scale:s,label:label,kind:'track'});}
function restore(l,t,label){cam(l,t,540,960,100,0);trackingTargets.push({rigName:rigNames[l],time:t,target:[540,960],screen:[540,960],scale:100,label:label,kind:'return'});}
function finish(l,ts){ease(l,'transform/position',ts);ease(l,'transform/scale',ts);ease(l,'transform/rotation',ts);rig=null;}
function picture(n,it,x,y,s){var l=run('layer.addItem',{item:it,time:0,duration:D}).layer;run('layer.rename',{layer:l,name:n});timing(l,0,D);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[s,s,100]);return l;}
function rays(n,a,b,col){for(var k=0;k<8;k++){var right=k%2,x=right?970:75,y=420+Math.floor(k/2)*210,l=shape(n+k,210,5,x,y,col,a,Math.min(a+.36,b),null,'rect',75);set(l,'transform/rotation',right?-24:24);key(l,'transform/position',a,[x+(right?320:-320),y+100]);key(l,'transform/position',a+.24,[x,y]);}}
function heart(n,x,y,s,a,b,col){var h=txt(n,'♥',x,y,s,col,a,b,s*1.3,'center',false);key(h,'transform/scale',a,[10,10]);key(h,'transform/scale',a+.18,[118,118]);key(h,'transform/scale',a+.3,[100,100]);ease(h,'transform/scale',[a,a+.18,a+.3]);return h;}
function confetti(a,b){rig=null;for(var k=0;k<46;k++){var x=60+(k*137)%910,y=270+(k*71)%120,delay=(k%7)*.045,t=a+delay,end=Math.min(b,t+2.8),l=shape('Sakura confetti '+k,k%3?14:29,k%3?38:20,x,y,k%3===0?'#FF95D2':k%2?A:B,t,end,null,k%3===0?'ellipse':'rect',85,true);key(l,'transform/position',t,[x,y]);key(l,'transform/position',end,[x+Math.sin(k*2)*150,1500+(k%4)*45]);key(l,'transform/rotation',t,k*29);key(l,'transform/rotation',end,k*29+270);key(l,'transform/opacity',t,85);key(l,'transform/opacity',end,0);}}
// Only the background and object layers can move. No group contains the character.
var stage=picture('Approved empty stage',imp.items[0],540,960,128);set(stage,'transform/opacity',P.index===1?45:70);
key(stage,'transform/position',0,[540,960,0]);key(stage,'transform/position',D,[580,920,0]);
shape('Dark tinted field',1080,1920,540,960,navy,0,D,null,'rect',66,true);
for(var k=0;k<5;k++){var o=shape('Ambient ring '+k,380+k*120,380+k*120,760,1220,navy,0,D,k%2?A:B,'ellipse',12,true);key(o,'transform/rotation',0,k*23);key(o,'transform/rotation',D,k*23+50);}
// The disco has an explicitly moving floor; the gift version has ribbons.
if(P.index===2){for(var k=0;k<15;k++){var gx=85+(k%5)*190,gy=1120+Math.floor(k/5)*155,l=shape('Disco floor '+k,174,132,gx,gy,k%2?A:B,2,D,null,'rect',8,true);for(var q=0;q<12;q++){var at=2+q*4*beat;if(at<D)key(l,'transform/opacity',at,((q+k)%3===0)?29:6);}}}
if(P.index===1){for(var k=0;k<3;k++){var ribbon=shape('Gift ribbon '+k,1250,18,500,1050+k*140,k%2?B:A,0,D,null,'rect',16,true);set(ribbon,'transform/rotation',-22);key(ribbon,'transform/position',0,[350,1100+k*140]);key(ribbon,'transform/position',D,[620,900+k*140]);}}
// Intro has breathing space where a genuine thank-you voice can later be added.
var c=group('thank-you opening',0,2);
pill('Intro eyebrow','はじめてのビンゴ企画で…',480,300,760,0,2,A);
txt('Intro opening','みんな、',90,493,108,white,0,2,800,'left',true);
txt('Intro thank you','ありがとう。',90,656,116,A,.28,2,800,'left',true);
txt('Intro note','この日を、いっしょに。',90,799,34,B,.65,2,800,'left',false);
if(P.index===1)heart('Opening heart',280,1160,142,0,2,A);
else {txt('Opening 09','09',95,1225,220,A,.4,2,400,'left',true);txt('Opening 09 label','マスの物語',100,1290,29,white,.75,2,390,'left',false);}
cam(c,0,540,960,100,0);cam(c,1.92,540,960,100,0);finish(c,[0,1.92]);
// The first drop reveals an empty grid, then fills three cells on the beat.
var boardLabels=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'];
var order=P.index===1?[4,0,8,1,7,3,6,2,5]:P.index===2?[0,4,8,2,6,1,7,3,5]:[0,1,2,4,7,6,3,8,5];
function board(n,a,b,filled,animated){for(var j=0;j<9;j++){var x=221+(j%3)*269,y=465+Math.floor(j/3)*146,which=-1;for(var z=0;z<9;z++)if(order[z]===j)which=z;var on=which<filled,start=on&&animated?a+(.65+which*.57):a;
 shape(n+' cell '+j,250,132,x,y,on?'#1B3E40':'#1B2439',a,b,on?A:'#51647F');
 txt(n+' label '+j,boardLabels[j],x,y+8,26,white,a,b,222,'center',false);
 if(on){shape(n+' lit '+j,250,132,x,y,P.index===1?'#74334F':'#255D5B',start,b,A,'rounded',97);
 txt(n+' clear '+j,P.index===1?'♥ CLEAR':'CLEAR!',x,y-12,32,A,start,b,220,'center',false);
 txt(n+' cleared label '+j,boardLabels[j],x,y+35,24,white,start,b,220,'center',false);}}
}
c=group('empty board to first clears',2,P.montage);
board('Opening board',2,P.montage,3,true);
cam(c,2,540,960,100,0);cam(c,2.5,540,960,100,0);
var bt=[2,2.5];for(var j=0;j<3;j++){var cellIndex=order[j],wx=221+(cellIndex%3)*269,wy=465+Math.floor(cellIndex/3)*146,at=2.86+j*.62,hold=at+.28;
follow(c,at,wx,wy,P.boardZoom,420,595,'盤面 '+boardLabels[cellIndex]);follow(c,hold,wx,wy,P.boardZoom,420,595,'盤面着地 '+boardLabels[cellIndex]);bt.push(at,hold);}
restore(c,4.92,'最初の3マスから盤面全体へ');cam(c,P.montage-.02,540,960,100,0);bt.push(4.92,P.montage-.02);finish(c,bt);
// A fixed viewport clips only moving board objects; the character is above it.
shape('Opening board lower viewport',1080,1080,540,1405,navy,2,P.montage,null,'rect',100,true);
shape('Opening board upper viewport',1080,375,540,187.5,navy,2,P.montage,null,'rect',100,true);
shape('Opening board left viewport',72,520,36,635,navy,2,P.montage,null,'rect',100,true);
shape('Opening board right viewport',162,520,999,635,navy,2,P.montage,null,'rect',100,true);
txt('First drop title',P.index===0?'みんなと、挑戦！':P.index===1?'応援が、集まって。':'BINGO, START!',90,330,70,white,2,P.montage,820,'left',true);
pill('First try','初挑戦のビンゴ',300,945,420,2,P.montage,A);
txt('First drop side 1',P.index===1?'ひとつ、':'ひとマス、',90,1140,56,white,2.35,P.montage,390,'left',true);
txt('First drop side 2',P.index===1?'またひとつ。':'またひとマス。',90,1235,51,A,2.65,P.montage,400,'left',true);
rays('Drop trail ',2,P.montage,A);
// Three typography scenes take the place of future stream highlights.
var m=P.montage,span=(P.climax-m)/4;
var words=P.index===1?[['はじめまして！','出会ってくれて'],['凸、ありがとう！','つながってくれて'],['セリフも全力！','笑ってくれて']]:P.index===2?[['HELLO!','初見さん、ようこそ'],['CONNECT!','同事務所の仲間も'],['REQUEST!','セリフで、大盛況']]:[['初見さん！','出会いが増えて'],['仲間も、集合！','同事務所の凸も'],['セリフ、全力！','リクエストで加速']];
for(var sc=0;sc<3;sc++){var a=m+sc*span,b=m+(sc+1)*span,fill=4+sc*2;c=group('highlight '+sc,a,b);
 pill('Highlight badge '+sc,'THANK YOU / '+String(sc+1).padStart(2,'0'),300,300,420,a,b,sc%2?B:A);
 txt('Highlight action '+sc,words[sc][0],85,505,P.index===2?112:95,white,a,b,820,'left',true);
 txt('Highlight caption '+sc,words[sc][1],90,610,48,A,a+.15,b,800,'left',true);
 var giant=txt('Clear count '+sc,String(fill).padStart(2,'0'),83,951,268,sc%2?B:A,a+.12,b,570,'left',true);
 txt('Clear fraction '+sc,'/ 09',535,880,64,white,a+1.08,b-.38,225,'left',false);
 shape('Progress rail '+sc,795,14,490,1010,'#34435B',a,b,null,'rect');
 shape('Progress fill '+sc,795*fill/9,14,92+795*fill/18,1010,A,a,b,null,'rect');
 if(P.index===2){for(var j=0;j<5;j++){var l=txt('Disco letter '+sc+' '+j,'BINGO'.charAt(j),135+j*155,700,80,j%2?A:B,a+beat*j*.15,b,145,'center',true);}}
 else rays('Highlight trails '+sc+' ',a,b,A);
 cam(c,a,540+(sc%2?100:-100),1020,110,0);cam(c,a+.28,540,960,100,0);
 follow(c,a+.65,490,500,112,490,500,'見出し '+sc);follow(c,a+.85,490,500,112,490,500,'見出し着地 '+sc);
 follow(c,a+1.14,267,850,P.counterZoom,300,625,'達成カウンター '+fill);follow(c,b-.62,267,850,P.counterZoom,300,625,'数字着地 '+fill);
 restore(c,b-.30,'ハイライト '+sc+' 全体復帰');cam(c,b-.02,540,960,100,0);finish(c,[a,a+.28,a+.65,a+.85,a+1.14,b-.62,b-.30,b-.02]);
 shape('Highlight upper viewport '+sc,1080,430,540,215,navy,a+.92,b-.38,null,'rect',100,true);
 txt('Highlight lower '+sc,P.index===1?'応援を、':'どんどん、',90,1200,52,white,a+.23,b,395,'left',true);
 txt('Highlight lower 2 '+sc,P.index===1?'ぎゅっと。':'CLEAR!',90,1290,70,sc%2?B:A,a+.35,b,395,'left',true);
 if(P.index===1)heart('Gift heart '+sc,320,1480,90,a+.3,b,sc%2?B:A);
}
// Final cell: the eight lit squares return as an actual board.
var a=m+3*span,b=P.climax;c=group('last square',a,b);
board('Almost board',a,b,8,false);
var cell=shape('Final square focus',250,132,759,611,navy,a,b,A,'rounded',100);
txt('Final square question','あと１マス！',759,623,29,A,a,b,220,'center',false);
cam(c,a,540,960,100,0);cam(c,a+.35,540,960,100,0);
follow(c,a+.78,759,611,P.lastZoom,420,595,'最後の１マス');follow(c,b-.65,759,611,P.lastZoom,420,595,'最後の１マス着地');restore(c,b-.22,'達成直前の盤面全体');cam(c,b-.03,540,960,100,0);finish(c,[a,a+.35,a+.78,b-.65,b-.22,b-.03]);
shape('Last board lower viewport',1080,1080,540,1405,navy,a,b,null,'rect',100,true);
shape('Last board upper viewport',1080,375,540,187.5,navy,a,b,null,'rect',100,true);
shape('Last board left viewport',72,520,36,635,navy,a,b,null,'rect',100,true);
shape('Last board right viewport',162,520,999,635,navy,a,b,null,'rect',100,true);
txt('Last square headline','あと、ひとマス。',90,328,78,white,a,b,815,'left',true);
txt('Reach label','REACH!',90,1020,112,B,a+.15,b,410,'left',true);
txt('Reach aside','みんなの力で',90,1190,43,white,a+.3,b,395,'left',true);
txt('Reach aside 2','ここまで来た。',90,1265,43,A,a+.4,b,395,'left',true);
key(cell,'transform/scale',b-2*beat,[100,100]);key(cell,'transform/scale',b-beat,[106,106]);key(cell,'transform/scale',b-.03,[100,100]);
// Completion expands across a full grid; effects remain below the fixed image.
a=P.climax;b=P.outro;c=group('all nine complete',a,b);
shape('Victory field',1100,1940,540,960,navy,a,b,null,'rect',97,true);
txt('Victory BINGO','BINGO!',82,435,P.index===2?173:164,A,a,b,825,'left',true);
txt('Victory headline','初ビンゴ、',90,565,75,white,a+.18,b,820,'left',true);
txt('Victory all clear','全マス達成!!',90,715,108,B,a+.30,b,820,'left',true);
for(var j=0;j<9;j++){var x=127+j%3*126,y=962+Math.floor(j/3)*112;shape('Victory mini cell '+j,110,96,x,y,j%2?A:B,a+.12+j*.035,b,null,'rounded');txt('Victory mini check '+j,P.index===1?'♥':'✓',x,y+22,45,navy,a+.15+j*.035,b,100,'center',true);}
txt('Victory 9/9','9 / 9',90,1390,78,A,a+.7,b,395,'left',true);
if(P.index===1)heart('Victory gift heart',320,1520,70,a+.8,b,B);
cam(c,a,650,1040,116,0);cam(c,a+.25,540,960,100,0);cam(c,a+.65,540,960,100,0);
follow(c,a+1,253,1074,164,300,630,'完成した9マスへ');follow(c,a+1.75,253,1074,164,300,630,'完成盤面を読む');restore(c,a+2.14,'BINGOと全マス達成へ復帰');cam(c,b-.03,540,960,100,0);finish(c,[a,a+.25,a+.65,a+1,a+1.75,a+2.14,b-.03]);confetti(a,b);
shape('Completion focus upper viewport',1080,290,540,145,navy,a+.84,a+1.98,null,'rect',100,true);
txt('Completion focus caption','みんなで、9マス。',90,355,52,white,a+.95,a+1.88,820,'left',false);
// Four seconds of readable appreciation and the exact promise, without a date.
a=P.outro;b=D;c=group('thank you and chorus preview',a,b);
txt('Outro thank you 1','みんな本当に',90,480,94,white,a,b,810,'left',true);
txt('Outro thank you 2','ありがとう♡',90,625,106,A,a+.15,b,810,'left',true);
shape('Chorus reveal card',810,165,490,815,'#203443',a+.35,b,A);
txt('Chorus reveal 1','歌ってみたサビ',490,802,61,white,a+.38,b,760,'center',true);
txt('Chorus reveal 2','後日公開！',490,878,61,B,a+.52,b,760,'center',true);
txt('Outro follow up','お楽しみに。',90,1175,55,white,a+.7,b,400,'left',true);
txt('Outro name','音桜夢',90,1345,68,A,a+.8,b,380,'left',true);
txt('Outro reading','おさゆ',95,1400,30,white,a+.85,b,380,'left',false);
txt('Outro handle','@oosayuuu2525',90,1510,27,A,a+.9,b,410,'left',false);
cam(c,a,575,990,105,0);cam(c,a+.3,540,960,100,0);
follow(c,a+.7,490,560,112,490,500,'感謝の言葉へ');follow(c,a+1.12,490,815,111,490,745,'歌ってみたサビ予告へ');follow(c,a+2.25,490,815,111,490,745,'後日公開を読む');restore(c,24.25,'感謝と予告の全体表示');cam(c,D-.03,540,960,100,0);finish(c,[a,a+.3,a+.7,a+1.12,a+2.25,24.25,D-.03]);
// Directional wipes punctuate the story, never affecting the character layer.
var trans=[2,m,m+span,m+span*2,m+span*3,P.climax,P.outro];rig=null;
for(var k=0;k<trans.length;k++){var at=trans[k],sg=P.index===1?1:k%2?1:-1,w=shape('Whip transition '+k,1160,2600,-1700*sg,960,k%2?B:A,at-.085,at+.11,null,'rect',100,true);set(w,'transform/rotation',sg*-12);key(w,'transform/position',at-.085,[-1700*sg,960]);key(w,'transform/position',at+.11,[2300*sg,960]);run('layer.setSwitch',{layers:[w],switch:'motionBlur',value:true});motionLedger.push({kind:'wipe',time:at});}
shape('Brand strip',810,46,490,200,navy,0,D,null,'rounded',95,true);
txt('Brand text','OSAYU / 音桜夢     FIRST BINGO : THANK YOU',490,209,21,A,0,D,775,'center',false);
${includeCharacter?`var fixed=picture('CHARACTER ORIGINAL FIXED',imp.items[1],730,1290,380/905*100);set(fixed,'transform/anchor',[452.5,905,0]);set(fixed,'transform/rotation',0);set(fixed,'transform/opacity',100);run('layer.setSwitch',{layers:[fixed],switch:'motionBlur',value:false});`:`shape('CHARACTER RESERVED PREVIEW ONLY',380,760,730,1290,'#6B7F88',0,D,A,'rect',18,true);`}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,motionLedger:motionLedger,trackingTargets:trackingTargets,includeCharacter:${includeCharacter},duration:D,bpm:P.bpm,cuts:P.cuts,characterBounds:{x:540,y:910,width:380,height:760}}));`;
}
