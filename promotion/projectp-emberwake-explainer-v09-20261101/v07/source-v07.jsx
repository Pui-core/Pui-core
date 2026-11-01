app.newProject();app.beginUndoGroup('156 new design preview');
function r(i,p){return app.run(i,p||{});}function s(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function k(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}function span(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,c,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:c,strokeWidth:0}).layer;span(l,a,b);return l;}
function txt(n,v,x,y,z,c,a,b){var l=r('layer.newText',{name:n,text:v,font:'Meiryo',style:'Bold',size:z,fill:c,position:[x,y],justify:'center'}).layer;var q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(q.width>940){z=Math.floor(z*940/q.width);r('layer.setText',{layer:l,size:z});q=app.project.activeItem.layer(n).sourceRectAtTime(a,false);}s(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);s(l,'transform/position',[x,y,0]);span(l,a,b);return l;}
var items=r('file.import',{paths:["C:/Users/pui/private-use/emberwake-video156-20261101/v07/media/v07-cut.mov", "C:/Users/pui/private-use/emberwake-video156-20261101/v07/media/v07-heading.png", "C:/Users/pui/private-use/emberwake-video156-20261101/v07/media/v07-memory-before.png", "C:/Users/pui/private-use/emberwake-video156-20261101/v07/media/v07-memory-after.png"],sequence:false}).items;
var body=r('comp.new',{name:'new episode2 viewport crop',width:1080,height:1170,frameRate:30,duration:16,background:'#0a202a'}).comp;
var action=r('layer.addItem',{item:items[0],time:0,duration:16}).layer;span(action,0,7);s(action,'transform/anchor',[800,555,0]);s(action,'transform/position',[540,585,0]);s(action,'transform/scale',[230,230,100]);
var pause=r('layer.addItem',{item:items[0],time:0,duration:16}).layer;span(pause,7,9);s(pause,'transform/anchor',[720,405,0]);s(pause,'transform/position',[540,585,0]);s(pause,'transform/scale',[75,75,100]);
var comp=r('comp.new',{name:'156 v07 new checkpoint preview16',width:1080,height:1920,frameRate:30,duration:16,background:'#eee8dc'}).comp;
r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var game=r('layer.addItem',{item:body,time:0,duration:16}).layer;s(game,'transform/anchor',[540,585,0]);s(game,'transform/position',[540,950,0]);span(game,0,9);
var title=r('layer.addItem',{item:items[1],time:0,duration:7}).layer;s(title,'transform/anchor',[540,165,0]);s(title,'transform/position',[540,165,0]);
txt('action setup','この中継点の先で、落下。',540,1640,52,'#173f47',0,4.2);
txt('actual return','同じ中継点へ、戻った。',540,1640,52,'#173f47',5.3,7);
rect('result header clean',1080,330,540,165,'#eee8dc',7,9);txt('result line1','戻るのは、',540,115,84,'#173f47',7,9);txt('result line2','今の中継点。',540,225,84,'#173f47',7,9);
txt('pause context','落下後に開いた、実ゲームの表示',540,1600,38,'#173f47',7,9);
rect('comparison surface',1080,1535,540,767.5,'#eee8dc',9,16);
txt('comparison heading1','失った記憶は、',540,140,76,'#173f47',9,16);txt('comparison heading2','増えていない。',540,245,76,'#173f47',11,16);
txt('before label','落下する前',540,510,48,'#567375',9,16);
var before=r('layer.addItem',{item:items[2],time:9,duration:7}).layer;s(before,'transform/anchor',[470,80,0]);s(before,'transform/position',[540,680,0]);k(before,'transform/opacity',9,0);k(before,'transform/opacity',9.1,100);
txt('after label','落下した後',540,960,48,'#567375',11,16);
var after=r('layer.addItem',{item:items[3],time:11,duration:5}).layer;s(after,'transform/anchor',[470,80,0]);s(after,'transform/position',[540,1130,0]);k(after,'transform/opacity',11,0);k(after,'transform/opacity',11.1,100);
txt('comparison conditions','第2話・物語モード／クリアせず比較',540,1450,36,'#567375',11,16);
txt('result statement','落下は、中継点からやり直せる。',540,1640,46,'#173f47',14,16);
txt('brand','EMBERWAKE / 開発中の実ゲーム',540,1825,30,'#567375',0,16);
app.endUndoGroup();writeLn(JSON.stringify({frames:480,newCaptureOnly:true,bodyComp:body,comp:comp}));
