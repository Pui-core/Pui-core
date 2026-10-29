import fs from 'node:fs';
import {stage,native,ff,hash,save} from './background.mjs';
const root=stage+'/pv-v01',D=15.2,W=1080,H=1920;
const project=root+'/projects/opening-v02.ecproj',picture=root+'/media/opening-v02.mov';
if(fs.existsSync(project)||fs.existsSync(picture))throw Error('Existing opening, inspect before resuming');
const assets=JSON.parse(fs.readFileSync(root+'/source-assets-clean.json'));
const wordmark=root+'/media/wordmark.png',pc=root+'/projects/wordmark.pcraft';
if(!fs.existsSync(pc)){
await native('photocraft',['run','--new',JSON.stringify({width:1000,height:230,resolution:72,name:'EMBERWAKE campaign wordmark',background:'#00000000'}),'--cmd','type.create','--params',JSON.stringify({x:25,y:118,text:'EMBERWAKE',font:'Meiryo',style:'Bold',weight:700,size:120,color:'#f6dfb5',name:'EMBERWAKE native type'}),'--cmd','type.create','--params',JSON.stringify({x:420,y:191,text:'灰の灯',font:'Meiryo',style:'Bold',size:48,color:'#d8aa70',name:'Japanese title'}),'--cmd','shape.create','--params',JSON.stringify({kind:'rect',rect:[28,213,945,3],fill:'#e0a767',name:'Ember rule'}),'--out',pc],root+'/qa/pc-wordmark-save.json');
await native('photocraft',['info',pc,'--compact'],root+'/qa/pc-wordmark-reopen.json');
await native('photocraft',['convert',pc,wordmark,'--format','png'],root+'/qa/pc-wordmark-export.json');
}
const shots=[
 {id:'First leap',asset:'wind-leap',a:0,b:1.6,from:0,anchorA:[980,665],anchorB:[990,720],scaleA:280,scaleB:240,copy:'この灯を、上へ。'},
 {id:'Carry detail',asset:'core-floor',a:1.6,b:2.4,from:0,anchorA:[260,300],anchorB:[275,285],scaleA:600,scaleB:560,copy:'運ぶ。'},
 {id:'Commit jump',asset:'jump-city',a:2.4,b:4,from:1.4,anchorA:[790,675],anchorB:[950,690],scaleA:250,scaleB:225,copy:'跳ぶ。'},
 {id:'Step into moon',asset:'moon-run',a:4,b:5.6,from:.3,anchorA:[505,740],anchorB:[925,730],scaleA:250,scaleB:230,copy:'まだ、先へ。'},
 {id:'World reveal',asset:'wind-leap',a:5.6,b:8.8,from:.05,anchorA:[1020,640],anchorB:[1000,650],scaleA:210,scaleB:200,copy:'その先を、探す。'},
 {id:'Wordmark motion',asset:'moon-run',a:8.8,b:10.4,from:1.3,anchorA:[845,710],anchorB:[970,660],scaleA:245,scaleB:225,copy:'',logo:true},
 {id:'Beat closeup',asset:'core-floor',a:10.4,b:11.2,from:1.1,anchorA:[265,300],anchorB:[265,300],scaleA:590,scaleB:560,copy:''},
 {id:'Beat ascent',asset:'jump-city',a:11.2,b:12.8,from:1.5,anchorA:[820,665],anchorB:[950,700],scaleA:255,scaleB:235,copy:''},
 {id:'Crowdfunding begins',asset:'wind-leap',a:12.8,b:D,from:.4,anchorA:[990,670],anchorB:[1000,680],scaleA:230,scaleB:215,copy:'クラファン開始',sub:'制作を応援する',announce:true}
];
save(root+'/opening-shots.json',shots);
const jsx=[];
jsx.push(`app.newProject();app.beginUndoGroup('151 realgame cinematic opening');var D=${D};function r(i,p){return app.run(i,p||{});}function s(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function k(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}function rect(n,w,h,x,y,c,a,b,op){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);if(op!==undefined)s(l,'transform/opacity',op);return l;}function txt(n,v,x,y,z,c,a,b){var l=r('layer.newText',{name:n,text:v,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer;var q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>900){z=Math.floor(z*900/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}s(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);s(l,'transform/position',[x,y,0]);span(l,a,b);k(l,'transform/position',a,[x,y+45,0]);k(l,'transform/position',a+.133333,[x,y,0]);k(l,'transform/opacity',a,0);k(l,'transform/opacity',a+.066667,100);return l;}`);
jsx.push(`var paths=${JSON.stringify([...assets.assets.map(a=>a.file),wordmark])},items=r('file.import',{paths:paths,sequence:false}).items;var comp=r('comp.new',{name:'151 CAMPFIRE opening',width:${W},height:${H},frameRate:30,duration:D,background:'#090d13'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});`);
for(const sh of shots){
 const index=assets.assets.findIndex(a=>a.id===sh.asset),a=assets.assets[index];
 if(a.crop){sh.anchorA=[sh.anchorA[0]-a.crop[0],sh.anchorA[1]-a.crop[1]];sh.anchorB=[sh.anchorB[0]-a.crop[0],sh.anchorB[1]-a.crop[1]];}
 const end=Math.min(a.duration-1/30,sh.from+sh.b-sh.a);
 jsx.push(`var v=r('layer.addItem',{item:items[${index}],time:${sh.a},duration:${sh.b-sh.a}}).layer;r('layer.rename',{layer:v,name:${JSON.stringify(sh.id)}});span(v,${sh.a},${sh.b});s(v,'transform/position',[540,1050,0]);k(v,'transform/anchor',${sh.a},${JSON.stringify([...sh.anchorA,0])});k(v,'transform/anchor',${sh.b},${JSON.stringify([...sh.anchorB,0])});k(v,'transform/scale',${sh.a},[${sh.scaleA},${sh.scaleA},100]);k(v,'transform/scale',${sh.a+.166667},[${sh.scaleB},${sh.scaleB},100]);k(v,'transform/scale',${sh.b},[${sh.scaleB-3},${sh.scaleB-3},100]);r('layer.enableTimeRemap',{layers:[v],value:true});r('keys.selectAll',{});var remaps=r('keys.info',{}).filter(function(q){return q.layer===v&&q.path==='timeRemap';});r('keys.deselectAll',{});r('keys.select',{keys:remaps.map(function(q){return{layer:v,prop:'timeRemap',time:q.compTime};}),timeBase:'comp'});r('keys.delete',{});k(v,'timeRemap',${sh.a},${sh.from});k(v,'timeRemap',${sh.b},${end});`);
 // Editorial light accents are distinct from the underlying game renderer.
 jsx.push(`var wash=rect(${JSON.stringify(sh.id+' amber cut')},1080,1920,540,960,'#d39453',${sh.a},${sh.a+.133333},12);k(wash,'transform/opacity',${sh.a},12);k(wash,'transform/opacity',${sh.a+.133333},0);rect(${JSON.stringify(sh.id+' lower field')},1080,450,540,1730,'#090d13',${sh.a},${sh.b},83);rect(${JSON.stringify(sh.id+' upper field')},1080,180,540,60,'#090d13',${sh.a},${sh.b},88);`);
 if(sh.copy)jsx.push(`txt(${JSON.stringify(sh.id+' copy')},${JSON.stringify(sh.copy)},540,1555,${sh.announce?94:92},'#f6dfb5',${sh.a+.1},${sh.b});`);
 if(sh.sub)jsx.push(`txt(${JSON.stringify(sh.id+' sub')},${JSON.stringify(sh.sub)},540,1675,46,'#d8aa70',${sh.a+.3},${sh.b});`);
 if(sh.logo)jsx.push(`var logo=r('layer.addItem',{item:items[${assets.assets.length}],time:${sh.a},duration:${sh.b-sh.a}}).layer;s(logo,'transform/anchor',[500,115,0]);s(logo,'transform/position',[540,1540,0]);span(logo,${sh.a},${sh.b});k(logo,'transform/scale',${sh.a},[92,92,100]);k(logo,'transform/scale',${sh.a+.166667},[86,86,100]);`);
}
jsx.push(`txt('Development scope','開発中の実ゲーム映像',540,144,27,'#c3c2bb',0,D);txt('Music credit','Music: Cipher / Kevin MacLeod / CC BY 4.0',540,1818,22,'#a7a29a',0,D);app.endUndoGroup();writeLn(JSON.stringify({duration:D,beatSeconds:.4,sharedWindowsInput:0,narration:false,naturalModel:false}));`);
const jsxPath=root+'/opening-v02.jsx';fs.writeFileSync(jsxPath,jsx.join('\n'));
await native('effectcraft',['--empty','script',jsxPath,'--save-as',project,'--json'],root+'/qa/ec-opening-save.json');
await native('effectcraft',['--project',project,'info','--json'],root+'/qa/ec-opening-reopen.json');
for(const t of [.4,3,4.5,6.5,9.2,13.5])await native('effectcraft',['--project',project,'render-frame','--comp','151 CAMPFIRE opening','--time',String(t),'--out',root+'/qa/opening-'+t+'.png','--json'],root+'/qa/ec-frame-'+t+'.json');
save(root+'/qa/opening-native-layout.json',{issue:151,project,sha256:hash(project),D,shots,photocraft:{path:pc,sha256:hash(pc)},gameGeneration:false,technicalFramesReady:true,pictureRendered:false});
console.log(JSON.stringify({layoutReady:true,project,frames:root+'/qa/opening-*.png'}));
