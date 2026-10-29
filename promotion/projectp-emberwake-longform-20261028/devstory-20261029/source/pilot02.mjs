import fs from 'node:fs';
import {stage,native,ff,hash,save} from './background.mjs';
const root=stage+'/pilot02',oldStage=stage+'/pilot01',D=32;
for(const d of ['media','projects','source','qa','videos'])fs.mkdirSync(root+'/'+d,{recursive:true});
if(fs.existsSync(root+'/projects/pilot02.ecproj'))throw Error('Preserve existing native project');
console.log(JSON.stringify({phase:'native-pilot02',pid:process.pid,root}));
for(const key of ['tap0','tap2','hold60','buffer1','buffer7'])await ff(['-i',oldStage+'/clips/'+key+'.mp4','-vf','crop=1140:455:70:170','-an','-c:v','libx264','-preset','veryfast','-crf','16',root+'/media/'+key+'.mp4'],root+'/qa/asset-'+key+'.json');
const pc=root+'/projects/editorial-paper.pcraft',paper=root+'/media/editorial-paper.png';
await native('photocraft',['run','--new',JSON.stringify({width:1280,height:720,name:'146 pilot02 editorial field',background:'#f5f2ed'}),'--cmd','shape.create','--params',JSON.stringify({kind:'rect',rect:[54,31,1172,7],fill:'#d64949',name:'Red rule'}),'--out',pc],root+'/qa/photocraft-save.json');
await native('photocraft',['info',pc,'--compact'],root+'/qa/photocraft-reopen.json');
await native('photocraft',['convert',pc,paper],root+'/qa/photocraft-export.json');
const shots=[
 {id:'Immediate result',asset:'tap0',a:0,b:.9,from:0,title:'一瞬の入力で、大ジャンプ？',caption:'修正前は高く、修正後は低く。'},
 {id:'Result punch replay',asset:'tap0',a:.9,b:2,from:0,title:'一瞬の入力で、大ジャンプ？',caption:'まず、実際の差から。',punch:1.025},
 {id:'One update, two events',asset:'tap0',a:2,b:3.5,from:0,title:'押す → 離す が、一つの更新に。',caption:'比較用の自動入力・同じ更新内の押し離し',rate:.6},
 {id:'Input order context',asset:'tap0',a:3.5,b:6,from:0,title:'押す → 離す が、一つの更新に。',caption:'人の短押しすべてで起きる、という話ではありません。',rate:.35},
 {id:'Keep long-hold height',asset:'hold60',a:12,b:14,from:0,title:'長押しの高さは、そのまま。',caption:'長押し：両方 56.81px'},
 {id:'Normal short tap counterexample',asset:'tap2',a:14,b:16,from:0,title:'普通の短押しも、確かめる。',caption:'2更新分の短押し：両方 19.80px'},
 {id:'Fixed special case',asset:'tap0',a:16,b:18.3,from:0,title:'一瞬で離したときは、小さく。',caption:'この同時入力条件：56.81 → 18.64px',rate:.45},
 {id:'Next question near landing',asset:'buffer1',a:18.3,b:21.1,from:.45,title:'では、着地の直前に離したら？',caption:'各版の着地1更新前に押す → 次の更新で離す',rate:.8},
 {id:'Near landing replay',asset:'buffer1',a:21.1,b:24,from:.45,title:'着地まで、離した意図を残せる？',caption:'同じ「着地までの間隔」で比較',rate:.8},
 {id:'One more earlier condition',asset:'buffer7',a:24,b:27.5,from:.45,title:'さらに、少し早く押してみる。',caption:'各版の着地7更新前に押して離す',rate:.7},
 {id:'Lead into chapter',asset:'buffer7',a:27.5,b:D,from:.45,title:'この違いを、どう直したのか。',caption:'EMBERWAKE 制作記録 / 第1話へ',rate:.5}
];
const assets=['tap0','tap2','hold60','buffer1','buffer7'],jsx=[];
jsx.push(`app.newProject();app.beginUndoGroup('146 pilot02 causal edit');var D=${D};function r(i,p){return app.run(i,p||{});}function s(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function k(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}function rect(n,w,h,x,y,c,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);return l;}function txt(n,v,x,y,z,c,a,b,arrive){var l=r('layer.newText',{name:n,text:v,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer;var bnd=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(bnd.width>1160){z=Math.floor(z*1160/bnd.width);r('layer.setText',{layer:l,size:z});bnd=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}s(l,'transform/anchor',[bnd.left+bnd.width/2,bnd.top+bnd.height/2,0]);s(l,'transform/position',[x,y,0]);span(l,a,b);if(arrive){k(l,'transform/position',a,[x+24,y+6,0]);k(l,'transform/position',a+.133333,[x,y,0]);k(l,'transform/opacity',a,0);k(l,'transform/opacity',a+.066667,100);}return l;}`);
jsx.push(`var paths=${JSON.stringify([paper,...assets.map(x=>root+'/media/'+x+'.mp4')])},items=r('file.import',{paths:paths,sequence:false}).items;var c=r('comp.new',{name:'EMBERWAKE devstory pilot02',width:1280,height:720,frameRate:30,duration:D,background:'#f5f2ed'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});var bg=r('layer.addItem',{item:items[0],time:0,duration:D}).layer;s(bg,'transform/position',[640,360,0]);s(bg,'transform/anchor',[640,360,0]);`);
for(const sh of shots){
 const i=assets.indexOf(sh.asset)+1,rate=sh.rate||1,endSource=sh.from+(sh.b-sh.a)*rate;
 jsx.push(`var v=r('layer.addItem',{item:items[${i}],time:${sh.a},duration:${sh.b-sh.a}}).layer;r('layer.rename',{layer:v,name:${JSON.stringify(sh.id)}});s(v,'transform/anchor',[570,227.5,0]);s(v,'transform/position',[640,385,0]);span(v,${sh.a},${sh.b});r('layer.enableTimeRemap',{layers:[v],value:true});k(v,'timeRemap',${sh.a},${sh.from});k(v,'timeRemap',${sh.b},${Math.min(2.96,endSource)});`);
 if(sh.punch)jsx.push(`k(v,'transform/scale',${sh.a},[${sh.punch*100},${sh.punch*100},100]);k(v,'transform/scale',${sh.a+.166667},[100,100,100]);`);
 jsx.push(`txt(${JSON.stringify(sh.id+' title')},${JSON.stringify(sh.title)},640,86,42,'#20242c',${sh.a},${sh.b},true);txt(${JSON.stringify(sh.id+' old')},'修正前',285,135,24,'#20242c',${sh.a},${sh.b},false);txt(${JSON.stringify(sh.id+' new')},'修正後',955,135,24,'#20242c',${sh.a},${sh.b},false);txt(${JSON.stringify(sh.id+' caption')},${JSON.stringify(sh.caption)},640,650,27,'#20242c',${sh.a},${sh.b},true);`);
}
// The edited diagram explicitly distinguishes a lost event from a retained event.
jsx.push(`txt('Diagram question','離した合図が、跳ぶ前に消えていた。',640,86,42,'#20242c',6,9,true);txt('Diagram answer','跳ぶ瞬間まで、合図を残す。',640,86,42,'#20242c',9,12,true);txt('Diagram scope','仕組みを表す編集図解',640,657,24,'#66717c',6,12,false);txt('Old lane','修正前',118,276,27,'#b44444',6,12,false);txt('New lane','修正後',118,449,27,'#267c68',6,12,false);rect('Old line',950,4,720,280,'#b7b6b0',6,12);rect('New line',950,4,720,450,'#b7b6b0',6,12);`);
for(const [lane,y,color]of[['old',280,'#d64949'],['new',450,'#267c68']]){
 jsx.push(`rect('${lane} press',150,74,320,${y},'#dedbd5',6.15,12);txt('${lane} press text','押す',320,${y},32,'#20242c',6.15,12,true);`);
 const l=lane==='old'?'lost':'kept';jsx.push(`var ${l}=rect('${lane} release',170,74,560,${y},'${color}',6.5,12);var ${l}Text=txt('${lane} release label','離す',560,${y},32,'#ffffff',6.5,12,true);`);
 if(lane==='old')jsx.push(`k(lost,'transform/opacity',7.6,100);k(lost,'transform/opacity',7.8,0);k(lostText,'transform/opacity',7.6,100);k(lostText,'transform/opacity',7.8,0);txt('Lost indication','合図なし',560,280,29,'#b44444',7.9,12,true);txt('Old full jump','大きく跳ぶ',994,280,34,'#b44444',8.1,12,true);`);
 else jsx.push(`k(kept,'transform/position',9,[560,450,0]);k(kept,'transform/position',9.55,[785,450,0]);k(keptText,'transform/position',9,[560,450,0]);k(keptText,'transform/position',9.55,[785,450,0]);txt('Keep event','記憶して渡す',785,548,26,'#267c68',9.6,12,true);txt('New short jump','小さく跳ぶ',1050,450,32,'#267c68',10,12,true);`);
}
jsx.push(`app.endUndoGroup();writeLn(JSON.stringify({duration:D,shots:${JSON.stringify(shots)},diagram:'Edited abstraction, not a captured code debugger'}));`);
fs.writeFileSync(root+'/source/composition.jsx',jsx.join('\n'));
await native('effectcraft',['--empty','script',root+'/source/composition.jsx','--save-as',root+'/projects/pilot02.ecproj','--json'],root+'/qa/effectcraft-build.json');
await native('effectcraft',['--project',root+'/projects/pilot02.ecproj','info','--json'],root+'/qa/effectcraft-reopen.json');
await native('effectcraft',['--project',root+'/projects/pilot02.ecproj','render-frame','--time','.3','--out',root+'/qa/native-open.png','--json'],root+'/qa/effectcraft-frame.json');
save(root+'/qa/pilot02-layout-ready.json',{issue:146,duration:D,shots,photocraftSha:hash(pc),effectcraftSha:hash(root+'/projects/pilot02.ecproj'),sourceSha:hash(root+'/source/composition.jsx'),nativePicturePending:true});
console.log(JSON.stringify({layoutReady:true,frame:root+'/qa/native-open.png'}));
