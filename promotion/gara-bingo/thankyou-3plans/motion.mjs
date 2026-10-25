/** Pastel bingo celebration: one camera moves the complete scene, including the original illustration. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
export const characterBase={position:[730,1290,0],anchor:[452.5,905,0],scale:[380/905*100,380/905*100,100],rotation:0,opacity:100};
const snap=t=>Math.round(t*30)/30;
const specs=[
 {id:'a-baibai',title:'A｜駆け抜けるビンゴ',song:'倍倍FIGHT!',artist:'CANDY TUNE',bpm:176,audioFile:'baibai-fight.m4a',audioStart:.210,accent:'#556EB4',second:'#CE82C8',tint:'#DCEBFF',climaxBeat:44,outroBeat:56,description:'水色とラベンダー。横への全画面ワイプと、文字・盤面・立ち絵を一緒に追う勢い。'},
 {id:'b-patissier',title:'B｜ありがとうの紙ふぶき',song:'キス・ミー・パティシエ',artist:'CANDY TUNE',bpm:192,audioFile:'kiss-me-patissier.m4a',audioStart:.088,accent:'#A34F97',second:'#7F9FDA',tint:'#F6DDF4',climaxBeat:48,outroBeat:60,description:'薄桃のペーパーとリボン。画面ごと弾むズーム、斜めのシーンチェンジ。'},
 {id:'c-disco',title:'C｜ビンゴ・パレード',song:'チョコレイト・ディスコ',artist:'Perfume',bpm:128,audioFile:'chocolate-disco.m4a',audioStart:.258,accent:'#705BAF',second:'#749ED8',tint:'#E5DFFD',climaxBeat:32,outroBeat:40,description:'ペリウィンクルと水色。強い全画面パンと傾き、次々に切り替わるビンゴの祝祭。'}
];
export const plans=specs.map((p,index)=>{
 const beat=60/p.bpm,drop=2,climax=17,outro=snap(drop+p.outroBeat*beat),montage=snap(drop+(index===0?12:index===1?16:8)*beat),span=(climax-montage)/4;
 const sceneCuts=[0,.8,2,montage,snap(montage+span),snap(montage+span*2),snap(montage+span*3),climax,outro,snap(outro+1.35),25];
 const scenes=sceneCuts.slice(0,-1).map((a,i)=>({a,b:sceneCuts[i+1],index:i}));
 const reviewTimes=scenes.map(s=>snap(s.a+Math.min(.65,(s.b-s.a)*.5)));
 const extraTransitions=[3,4,5].map(j=>snap(sceneCuts[j]+1));
 const wholeReviewTimes=[];
 for(const s of scenes){wholeReviewTimes.push(snap(s.a+.1),snap(s.a+Math.min(.5,(s.b-s.a)*.5)),snap(s.b-.12));}
 for(const j of [3,4,5])wholeReviewTimes.push(snap(sceneCuts[j]+.72),snap(sceneCuts[j]+1.35),snap(sceneCuts[j+1]-.35));
 wholeReviewTimes.sort((a,b)=>a-b);
 return {...p,index,beat,drop,climax,outro,montage,span,duration:25,sceneCuts,extraTransitions,reviewTimes,wholeReviewTimes,scenes};
});
export function composition(root,p,{includeCharacter=true}={}){
 const native=f=>{const r=spawnSync('wslpath',['-w',f],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'media/background-manifest.json'),'utf8'));
 const images=[native(path.join(root,'media/bingo-paper-background.png'))];if(includeCharacter)images.push(native(path.join(root,'media/character-cutout.png')));
 return `app.newProject();app.beginUndoGroup('Osayu wholeframe V3 ${p.id}');
var P=${JSON.stringify(p)},D=25,ink='#3B3562',A=P.accent,B=P.second,paper='#FFFDFE',lav='#EEE7F8',blue='#ADCFF4',pink='#DFABE3',boxes=[],wholeCameraKeys=[],transitions=[],base=${JSON.stringify(characterBase)};
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,prop,ts){var keys=[];for(var i=0;i<ts.length;i++)keys.push({layer:l,prop:prop,time:Math.round(ts[i]*30)/30});run('keys.select',{keys:keys,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:62,outInfluence:62,continuous:false});}
var comp=run('comp.new',{name:'Osayu Thankyou ${p.id}',width:1080,height:1920,frameRate:30,duration:D,background:lav,shutterAngle:120,shutterPhase:-60,motionBlurSamples:6}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});run('comp.setSwitch',{switch:'motionBlur',value:true});
var imp=run('file.import',{paths:${JSON.stringify(images)},sequence:false});if(imp.errors.length)throw Error(JSON.stringify(imp.errors));
var world=run('layer.newNull',{name:'WHOLE FRAME CAMERA'}).layer;set(world,'transform/anchor',[540,960,0]);set(world,'transform/position',[540,960,0]);timing(world,0,D);
function attach(l){run('layer.setParent',{layers:[l],parent:world,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
function shape(n,w,h,x,y,c,a,b,stroke,kind,op){var l=run('layer.newShape',{name:n,kind:kind||'rounded',size:[w,h],position:[x,y],fill:c,stroke:stroke||c,strokeWidth:stroke?3:0}).layer;timing(l,a,b);attach(l);if(op!==undefined)set(l,'transform/opacity',op);return l;}
function txt(n,s,x,y,z,c,a,b,w,align,pop){var l=run('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:align||'left'}).layer;var rect=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(rect.width>(w||850)){z=Math.floor(z*(w||850)/rect.width);run('layer.setText',{layer:l,size:z});rect=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}timing(l,a,b);attach(l);boxes.push({name:n,text:s,size:z,x:x+rect.left,y:y+rect.top,width:rect.width,height:rect.height,start:a,end:b});if(pop){key(l,'transform/position',a,[x+(align==='center'||P.index===1?0:95),y+(align==='center'?35:80)]);key(l,'transform/position',a+.13,[x-5,y-7]);key(l,'transform/position',a+.24,[x,y]);ease(l,'transform/position',[a,a+.13,a+.24]);}return l;}
function picture(n,it,x,y,s,anchor){var l=run('layer.addItem',{item:it,time:0,duration:D}).layer;run('layer.rename',{layer:l,name:n});timing(l,0,D);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[s,s,100]);set(l,'transform/anchor',anchor);set(l,'transform/rotation',0);set(l,'transform/opacity',100);attach(l);return l;}
function pill(n,s,x,y,w,a,b,c){shape(n+' paper',w,62,x,y,paper,a,b,c,'rounded',94);txt(n,s,x,y+12,25,ink,a,b,w-30,'center',false);}
function focus(t,target,screen,s,r,label){t=Math.round(t*30)/30;var q=r*Math.PI/180,k=s/100,dx=(target[0]-540)*k,dy=(target[1]-960)*k;var pos=[screen[0]-dx*Math.cos(q)+dy*Math.sin(q),screen[1]-dx*Math.sin(q)-dy*Math.cos(q),0];wholeCameraKeys.push({time:t,position:pos,scale:[s,s,100],rotation:r,anchor:[540,960,0],focus:{target:target,screen:screen},label:label});}
function cameraShot(a,b,index,tx,ty,zoom){var sg=(index+P.index)%2?1:-1;focus(a,[540,960],[540+sg*230,1010],123,sg*2.8,'scene '+index+' arrival');focus(a+.2,[540,960],[540,960],102,sg*.6,'scene '+index+' settle');if(b-a>.95){focus(a+.56,[tx,ty],[520,690],zoom,sg*(P.index===2?2.7:1.7),'scene '+index+' follow');focus(b-.28,[tx,ty],[520,680],zoom+2,sg*(P.index===2?1.5:.8),'scene '+index+' hold');}focus(b-.03334,[540,960],[540-sg*50,960],105,-sg*.4,'scene '+index+' exit');}
// One real paper world. The background, all pages, text and illustration share this parent.
var bg=picture('BINGO PAPER BACKGROUND',imp.items[0],540,960,160,[${manifest.width/2},${manifest.height/2},0]);
for(var i=0;i<P.scenes.length;i++){var s=P.scenes[i],col=i%3===0?blue:i%3===1?pink:lav;shape('Scene pastel wash '+i,2000,3400,540,960,col,s.a,s.b,null,'rect',i===7?22:13);}
for(var i=0;i<9;i++){var dot=shape('Paper world confetti '+i,28+(i%3)*8,28+(i%3)*8,i%2?1030:45,330+i*150,i%2?blue:pink,0,D,null,i%3?'rounded':'ellipse',65);set(dot,'transform/rotation',i*23);}
// Locally unaltered original; its parent is intentionally moving under the latest owner instruction.
${includeCharacter?`var character=picture('CHARACTER ORIGINAL FIXED',imp.items[1],730,1290,380/905*100,[452.5,905,0]);`:`shape('CHARACTER RESERVED PREVIEW ONLY',380,760,730,1290,'#B4A8CD',0,D,'#8A7EC8','rect',18);`}
var labs=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'];
var order=P.index===0?[0,1,2,4,7,6,3,8,5]:P.index===1?[4,0,8,1,7,3,6,2,5]:[0,4,8,2,6,1,7,3,5];
function board(n,a,b,clear,animate){for(var j=0;j<9;j++){var x=221+(j%3)*269,y=465+Math.floor(j/3)*140,idx=order.indexOf(j),at=animate?a+.45+idx*.43:a;shape(n+' cell '+j,248,126,x,y,paper,a,b,'#9FB0E8','rounded',96);txt(n+' label '+j,labs[j],x,y+9,27,ink,a,b,222,'center',false);if(idx<clear){shape(n+' stamp '+j,248,126,x,y,idx%2?'#DCEBFF':'#F4DDF5',at,b,A,'rounded',98);txt(n+' CLEAR '+j,'CLEAR!',x,y-8,32,A,at,b,222,'center',false);txt(n+' done label '+j,labs[j],x,y+35,24,ink,at,b,220,'center',false);}}}
function header(n,small,a,b){pill(n+' label',small,330,270,490,a,b,A);}
// 0—2: two short thank-you cards. The whole poster moves, including the illustration.
var a=0,b=.8;header('Opening','初めてのビンゴ企画で…',a,b);txt('Opening word','みんな！',85,555,150,ink,a,b,850,'left',true);txt('Opening aside','この日を、一緒に。',90,1260,32,A,a,b,400,'left',false);cameraShot(a,b,0,470,530,115);
a=.8;b=2;header('Thanks opening','OSAYU / FIRST BINGO',a,b);txt('Thanks opening word','ありがとう♡',85,560,115,A,a,b,860,'left',true);txt('Thanks opening second','はじめての挑戦が…',90,730,60,ink,a+.1,b,820,'left',true);cameraShot(a,b,1,490,580,116);
// Empty grid -> first three stamps. Camera crosses the poster, not a small viewport.
a=2;b=P.montage;header('First bingo','みんなと、初挑戦！',a,b);board('First board',a,b,3,true);txt('First board aside 1','ひとつずつ、',90,1180,48,ink,a+.3,b,395,'left',true);txt('First board aside 2','CLEAR!',90,1270,68,A,a+.5,b,400,'left',true);
focus(a,[540,960],[770,1010],123,2.8,'board page arrival');focus(a+.24,[540,960],[540,960],100,0,'board whole');
for(var j=0;j<3;j++){var at=a+.85+j*.65,cell=order[j];focus(at,[221+(cell%3)*269,465+Math.floor(cell/3)*140],[490,620],P.index===2?151:144,(j%2?1:-1)*2,'board cell '+j);}
focus(b-.42,[540,960],[540,960],103,-1,'board return');focus(b-.03334,[540,960],[490,960],105,-.4,'board exit');
// Three quick full-page scene changes, with a new headline and huge result each time.
var words=P.index===0?[['初見さん！','出会いが増えて'],['仲間も集合！','同事務所の凸も'],['セリフ、全力！','リクエストで加速']]:P.index===1?[['はじめまして！','出会ってくれて'],['凸、ありがとう！','つながってくれて'],['セリフも全力！','笑ってくれて']]:[['HELLO!','初見さん、ようこそ'],['CONNECT!','同事務所の仲間も'],['REQUEST!','セリフで、大盛況']];
for(var i=0;i<3;i++){a=P.sceneCuts[3+i];b=P.sceneCuts[4+i];header('Highlight '+i,'THANK YOU / '+String(i+1),a,b);txt('Highlight word '+i,words[i][0],85,475,P.index===2?116:94,ink,a,a+1,850,'left',true);txt('Highlight sub '+i,words[i][1],90,585,43,A,a+.12,a+1,820,'left',true);txt('Result '+i,String(4+i*2).padStart(2,'0'),90,955,270,A,a+.16,b,600,'left',true);txt('Result fraction '+i,'/ 09',515,895,64,ink,a+.35,b,265,'left',false);pill('Result tag '+i,'CLEAR!',290,1130,390,a+.3,b,B);txt('Result lower '+i,P.index===1?'応援を、ぎゅっと。':'みんなの力で。',90,1335,38,ink,a+.4,b,410,'left',true);
var sg=(i+P.index)%2?1:-1,z=P.index===2?143:P.index===1?132:139;focus(a,[540,960],[540+sg*230,1010],123,sg*2.8,'highlight page arrival');focus(a+.2,[540,960],[540,960],102,sg*.5,'highlight whole');focus(a+.5,[490,460],[490,560],116,sg*1.5,'headline follow');focus(a+.90,[490,460],[490,560],116,sg*.8,'headline readable hold');focus(a+1.20,[290,825],[430,760],z,sg*2,'counter page follow');focus(b-.28,[290,825],[440,750],z+2,sg*.7,'counter readable hold');focus(b-.03334,[540,960],[540-sg*50,960],105,-sg*.4,'counter page exit');}
// Reach page, close-up of the last square, then return before the completion hit.
a=P.sceneCuts[6];b=17;header('Reach','あと、ひとマス。',a,b);board('Reach board',a,b,8,false);shape('Last square paper',248,126,759,605,'#F1D8F2',a,b,A);txt('Last square label','あと1マス！',759,617,29,ink,a,b,222,'center',false);txt('Reach big','REACH!',90,1110,102,A,a+.2,b,410,'left',true);txt('Reach aside','ここまで、一緒に。',90,1290,37,ink,a+.35,b,400,'left',true);
focus(a,[540,960],[320,980],122,-2.8,'reach page arrival');focus(a+.24,[540,960],[540,960],100,0,'reach whole');focus(a+.75,[759,605],[520,650],P.index===2?170:160,2.4,'last square');focus(b-.55,[759,605],[520,650],P.index===2?174:164,1,'last square hold');focus(b-.20,[540,960],[540,960],100,0,'reach return');focus(b-.03334,[540,960],[540,960],103,-.4,'reach exit');
// The 17-second hit is a new page, followed by a travelling complete grid.
a=17;b=P.outro;header('Victory','初ビンゴ、全マス達成！',a,b);txt('Victory big','BINGO!',65,535,174,A,a,b,890,'left',true);txt('Victory full','全マス達成!!',90,735,108,ink,a+.18,b,840,'left',true);
for(var j=0;j<9;j++){var x=145+j%3*119,y=1030+Math.floor(j/3)*108;shape('Completed tile '+j,102,94,x,y,j%2?blue:pink,a+.15+j*.025,b,A);txt('Completed check '+j,'✓',x,y+18,45,ink,a+.19+j*.025,b,90,'center',false);}txt('Victory 9/9','9 / 9',90,1440,72,A,a+.6,b,410,'left',true);
focus(a,[540,960],[740,1020],125,2.8,'victory scene hit');focus(a+.25,[540,960],[540,960],100,0,'victory whole');focus(a+.85,[264,1138],[380,795],139,-2.3,'completed grid follow');focus(a+1.5,[264,1138],[400,790],143,1,'completed grid hold');focus(a+1.95,[490,580],[520,650],119,-1,'victory words');focus(b-.25,[540,960],[540,960],100,0,'victory return');focus(b-.03334,[540,960],[500,960],104,-.4,'victory exit');
for(var j=0;j<34;j++){var x=j%2?30+(j*79)%430:970+(j%3)*25,t=a+(j%5)*.04,end=Math.min(b,t+2.8),l=shape('Victory confetti '+j,12+j%3*5,32,x,250+(j%7)*60,j%2?blue:pink,t,end,null,j%3?'rect':'ellipse',85);key(l,'transform/position',t,[x,250+(j%7)*60]);key(l,'transform/position',end,[x+(j%2?90:-40),1520]);key(l,'transform/rotation',t,j*27);key(l,'transform/rotation',end,j*27+240);key(l,'transform/opacity',end,0);}
// Separate gratitude and teaser pages keep the ending moving and readable.
a=P.outro;b=P.sceneCuts[9];header('Closing thanks','みんな、本当に',a,b);txt('Closing thanks big','ありがとう♡',85,565,116,A,a,b,855,'left',true);txt('Closing thanks lower','一緒に叶えた、9マス。',90,780,55,ink,a+.1,b,830,'left',true);txt('Closing thanks name','音桜夢 / おさゆ',90,1360,35,ink,a,b,430,'left',false);cameraShot(a,b,8,490,590,116);
a=P.sceneCuts[9];b=D;header('Chorus teaser','約束のごほうび、準備中。',a,b);txt('Chorus teaser first','歌ってみた',85,485,113,ink,a,b,855,'left',true);txt('Chorus teaser chorus','サビ',85,665,160,A,a+.12,b,840,'left',true);shape('Chorus teaser ribbon',820,123,490,830,'#E4D5F8',a+.2,b,A);txt('Chorus teaser soon','後日公開！',490,861,78,ink,a+.25,b,765,'center',true);txt('Chorus teaser enjoy','お楽しみに。',90,1250,49,A,a+.35,b,405,'left',true);txt('Chorus teaser handle','@oosayuuu2525',90,1435,27,ink,a+.4,b,410,'left',false);
focus(a,[540,960],[310,1000],123,-2.8,'teaser new page');focus(a+.23,[540,960],[540,960],100,0,'teaser whole');focus(a+.7,[490,700],[490,720],116,1.7,'teaser follow');focus(24.33,[540,960],[540,960],100,0,'final whole return');focus(24.96667,[540,960],[540,960],100,0,'final readable hold');
// Full-screen paper shutters are above the illustration and belong to the SAME camera.
var transitionTimes=P.sceneCuts.slice(1,-1).concat(P.extraTransitions).sort(function(a,b){return a-b;});for(var i=0;i<transitionTimes.length;i++){var t=transitionTimes[i],sg=(i+P.index)%2?1:-1,col=i%3===0?lav:i%3===1?blue:pink;var w=shape('FULL SCENE PAPER WIPE '+i,2200,5200,540-sg*2700,960,col,t-.13,t+.15,null,'rect',100);set(w,'transform/rotation',sg*(P.index===1?11:6));key(w,'transform/position',t-.13,[540-sg*2700,960]);key(w,'transform/position',t-.03334,[540,960]);key(w,'transform/position',t+.03334,[540,960]);key(w,'transform/position',t+.15,[540+sg*3300,960]);run('layer.setSwitch',{layers:[w],switch:'motionBlur',value:true});transitions.push({time:t,type:P.index===1?'diagonal-paper-wipe':'whole-screen-paper-whip',layer:w,includesIllustration:true});}
wholeCameraKeys.sort(function(a,b){return a.time-b.time;});for(var ki=0;ki<wholeCameraKeys.length;ki++){var kk=wholeCameraKeys[ki];key(world,'transform/position',kk.time,kk.position);key(world,'transform/scale',kk.time,kk.scale);key(world,'transform/rotation',kk.time,kk.rotation);}var ts=wholeCameraKeys.map(function(k){return k.time;});ease(world,'transform/position',ts);ease(world,'transform/scale',ts);ease(world,'transform/rotation',ts);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,wholeCameraKeys:wholeCameraKeys,sceneCuts:P.sceneCuts,transitions:transitions,includeCharacter:${includeCharacter},duration:D,bpm:P.bpm,characterBase:base,backgroundBounds:{x:${540-manifest.width*.8},y:${960-manifest.height*.8},width:${manifest.width*1.6},height:${manifest.height*1.6}},wholeFrameCamera:'WHOLE FRAME CAMERA'}));`;
}
