import fs from 'node:fs';
import {file,np,EC,run,parse,save,hash} from './native.mjs';
const plan=JSON.parse(fs.readFileSync(file('source/plan.json')));
const E={...plan,paths:['game-original.mp4','game-ambient.mp4','model-main.mov','model-ending.mov'].map(p=>np(file('media/'+p)))};
const jsx=`app.newProject();var E=${JSON.stringify(E)},boxes=[],shots=[];
function r(n,p){return app.run(n,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function text(n,s,x,y,z,c,a,b,max){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer,q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>max){z=Math.floor(z*max/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}set(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);set(l,'transform/position',[x,y,0]);span(l,a,b);boxes.push({name:n,text:s,a:a,b:b,x:x,y:y,width:q.width,height:q.height});return l;}
var im=r('file.import',{paths:E.paths,sequence:false});if(im.errors.length)throw Error(JSON.stringify(im.errors));var I=im.items;
var comp=r('comp.new',{name:'ScateRush132 TikTok revision',width:1080,height:1920,frameRate:30,duration:E.duration,background:'#11151a',shutterAngle:0,motionBlurSamples:1}).comp;
function footage(item,s,name){var a=s.output[0],b=s.output[1],l=r('layer.addItem',{item:item,time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:name});span(l,a,b);r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,s.source);key(l,'timeRemap',b,s.source+(b-a)*s.speed);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});return l;}
// A blurred derivative of this exact game supplies colour, not a second factual action surface.
for(var n=0;n<E.shots.length;n++){var s=E.shots[n],l=footage(I[1],s,'Soft actual-game backdrop '+n);set(l,'transform/position',[540,960,0]);set(l,'transform/scale',[750,750,100]);}
for(var n=0;n<E.shots.length;n++){var s=E.shots[n],a=s.output[0],b=s.output[1],l=footage(I[0],s,s.name);set(l,'transform/position',[540,650,0]);set(l,'transform/anchor',[240,240,0]);set(l,'transform/scale',[450,450,100]);
if(n===0){key(l,'transform/anchor',a,[275,240,0]);key(l,'transform/anchor',.4,[140,240,0]);key(l,'transform/anchor',b,[140,240,0]);}
if(n===1){key(l,'transform/anchor',a,[325,240,0]);key(l,'transform/anchor',b,[205,240,0]);key(l,'transform/scale',a,[300,300,100]);key(l,'transform/scale',b,[450,450,100]);}
if(n===2){key(l,'transform/anchor',a,[205,240,0]);key(l,'transform/anchor',b,[130,240,0]);}
if(n>=3){set(l,'transform/anchor',[240,240,0]);set(l,'transform/scale',[380,380,100]);}shots.push(s);}
text('Scope','Web試作画面',210,105,25,'#9eb6b4',0,6,350);
text('Cold open result','この一瞬。',500,360,70,'#f5cf55',0,.6,900);
text('Return label','直前へ',500,330,23,'#9eb6b4',.6,1,350);
text('Question choice','くぐれる？',500,430,75,'#f5cf55',.6,1.5,920);
text('Choice result','抜けた。',500,430,70,'#32d6c8',1.7,2.4,920);
text('Approach speed','0.4× スロー',810,550,22,'#9eb6b4',.6,1.5,340);
for(var n=0;n<E.actualCore.length;n++){var p=E.actualCore[n],a=p.output[0],b=p.output[1],l=r('layer.addItem',{item:I[n+2],time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:'Specified Natural actual voice bound '+n});span(l,a,b);set(l,'transform/position',[820,1530,0]);set(l,'transform/scale',[43,43,100]);}
text('CTA first line','このゲームの続きは、',340,1410,41,'#f3ecdf',3,6,580);
text('CTA action','フォローで。',340,1490,64,'#f5cf55',3,6,580);
text('Handle','@prop_pui',340,1600,36,'#9eb6b4',3,6,580);
writeLn(JSON.stringify({comp:comp,boxes:boxes,shots:shots,actualCore:E.actualCore,music:E.music,ambient:'Blurred exact same footage, not second gameplay',wholeDirectWatch:false,wholeSubjectiveListen:false}));`;
fs.writeFileSync(file('source/composition.jsx'),jsx);
const q=parse((await run(EC,['--empty','script',np(file('source/composition.jsx')),'--save-as',np(file('projects/scaterush-revision.ecproj')),'--json'],'ec-build.json')).stdout);
if(!q.ok)throw Error(JSON.stringify(q));save('qa/layout.json',{...parse(q.output),nativeSha256:hash(file('projects/scaterush-revision.ecproj'))});
for(const t of [.1,.2,.3,.4,.5,.6333,.8,1.0,1.3,1.4667,1.5333,1.6,1.7,1.8,1.9,2.1,2.4,2.8,3.1,4.5,5.8])await run(EC,['--project',np(file('projects/scaterush-revision.ecproj')),'render-frame','--comp','ScateRush132 TikTok revision','--time',String(t),'--out',np(file('qa/preview-'+t+'.png')),'--json'],'preview-'+t+'.json');
console.log('132 revised native draft picture ready');
