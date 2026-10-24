app.newProject();app.beginUndoGroup('Pui promo 32');
var E={"id":32,"series":"Web改善","topic":"リンク先を名前で示す","hook":["ここをクリック","どこへ進むボタン？"],"insight":["押した後の行き先を","名前で示そう"],"example":["詳しく、を変えて","修理の料金目安を見る"],"cta":"Webの相談は、ぷいへ","caption":"ボタンやリンクの文言を見直すときは、押した後に何が分かるかを名前にする考え方があります。例えば修理店なら『修理の料金目安を見る』という表現です。リンク先の内容と一致することも確認しましょう。ぷいのWeb制作の活動はこちらから。https://pui-wobbfet.top/","tags":["ぷい","Web制作","ボタン文言","サイト改善"],"visual":"window","diagram":["詳しく？","料金を見る","行き先を明示"]},P={"bg":"#edf2ff","panel":"#ffffff","ink":"#162950","muted":"#485e83","accent":"#375eb0","soft":"#d5e2ff","code":"#162950"},D=18,boxes=[],keyCount=0;
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});keyCount++;}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:'Pui '+E.id,width:1080,height:1920,frameRate:30,duration:D,background:P.bg}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
function shape(name,kind,w,h,x,y,color,a,b,opacity){var l=run('layer.newShape',{name:name,kind:kind,size:[w,h],position:[x,y],fill:color,strokeWidth:0}).layer;timing(l,a||0,b||D);if(opacity!==undefined)set(l,'transform/opacity',opacity);return l;}
function entrance(l,x,y,a,b,delay){delay=delay||0;key(l,'transform/opacity',a,0);key(l,'transform/opacity',a+.18+delay,100);key(l,'transform/opacity',b-.12,100);key(l,'transform/opacity',b,0);key(l,'transform/position',a,[x,y+26]);key(l,'transform/position',a+.32+delay,[x,y]);}
function txt(name,text,x,y,size,color,a,b,justify,animate,maxWidth){
 var l=run('layer.newText',{name:name,text:text,position:[x,y],font:'Meiryo',style:'Bold',size:size,fill:color,justify:justify||'left',tracking:0}).layer;
 var obj=app.project.activeItem.layer(name),r=obj.sourceRectAtTime(a,false),limit=maxWidth||766;
 if(r.width>limit){size=Math.floor(size*limit/r.width);run('layer.setText',{layer:l,size:size});r=obj.sourceRectAtTime(a,false);}
 timing(l,a,b);if(animate)entrance(l,x,y,a,b,0);
 boxes.push({name:name,text:text,layer:l,size:size,start:a,end:b,x:x+r.left,y:y+r.top,width:r.width,height:r.height,animated:!!animate});return l;
}
function picture(name,item,x,y,scale,a,b){var l=run('layer.addItem',{item:item,time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:name});timing(l,a,b);set(l,'transform/position',[x,y]);set(l,'transform/scale',[scale,scale]);return l;}
var imported=run('file.import',{paths:["\\\\wsl.localhost\\Ubuntu\\home\\pui\\Videos\\Pui-Promo\\2026-10-24\\media\\logo-original.png","\\\\wsl.localhost\\Ubuntu\\home\\pui\\Videos\\Pui-Promo\\2026-10-24\\media\\icon-original.png"],sequence:false});if(imported.errors.length)throw Error(JSON.stringify(imported.errors));
// Quiet, continuous motion keeps the opening immediate without flashes.
var orb=shape('Large paper orbit','ellipse',1000,1000,1010,740,P.soft,0,18,60);key(orb,'transform/position',0,[1010,740]);key(orb,'transform/position',18,[890,920]);
var orb2=shape('Lower color field','ellipse',1000,1000,-370,1560,P.soft,0,18,45);key(orb2,'transform/position',0,[-370,1560]);key(orb2,'transform/position',18,[-240,1510]);
for(var j=0;j<4;j++){var dot=shape('Floating dot '+j,'ellipse',7+j*2,7+j*2,150+j*220,460-j*35,P.accent,0,18,25);key(dot,'transform/position',0,[150+j*220,460-j*35]);key(dot,'transform/position',18,[180+j*210,415-j*30]);}
shape('Brand accent','rounded',7,42,101,247,P.accent,0,18);
txt('Creator identity','ぷい',122,266,38,P.ink,0,18);
txt('Brand descriptor','教える・作る・伝える',122,307,23,P.muted,0,18);
picture('Official Project P logo',imported.items[0],746,260,23,0,18);
txt('Series name',E.series,100,376,29,P.accent,0,18);
txt('Episode number',('00'+E.id).slice(-3)+' / 100',100,415,20,P.muted,0,18);
function stage(lines,label,a,b,n){
 txt('Stage '+n+' label',label,100,500,24,P.accent,a,b,'left',true);
 for(var k=0;k<lines.length;k++)txt('Stage '+n+' line '+k,lines[k],100,620+k*102,78,P.ink,a,b,'left',true);
}
stage(E.hook,'その困りごと、',0,3.3,0);stage(E.insight,'考え方のヒント',3.3,8,1);stage(E.example,'たとえば、こんな一歩',8,13,2);
// A native vector demonstration, clearly labelled as illustrative.
shape('Illustration panel','rounded',780,407,490,1010,P.panel,0,13);
txt('Illustrative disclosure','イメージ図',130,850,18,P.muted,0,13);
var a=0,b=13,kind=E.visual,bar,i,x,y,l,labels=E.diagram||['整理','試す','確認'];
function line(name,w,h,x,y,c){return shape(name,'rounded',w,h,x,y,c,a,b);}
function small(name,text,x,y,s,c){return txt(name,text,x,y,s||26,c||P.ink,a,b,'left',false,690);}
if(kind==='code'){
 line('Editor',690,286,490,1038,P.code);for(i=0;i<3;i++)shape('Editor light '+i,'ellipse',12,12,176+i*25,932,['#f3a8a4','#f8dba2','#8bd4c4'][i],a,b);
 small('Code line 1','01   '+labels[0],160,1004,32,'#b8e9ed');small('Code line 2','02   '+labels[1],160,1063,32,'#f1f6fa');small('Code line 3','03   '+labels[2],160,1122,32,'#e5c992');
 bar=line('Code running marker',5,47,139,1032,P.accent);key(bar,'transform/position',0,[139,990]);key(bar,'transform/position',6,[139,1050]);key(bar,'transform/position',12.9,[139,1110]);
}else if(kind==='flow'||kind==='nodes'){
 line('Flow connector',510,4,490,1040,P.soft);
 for(i=0;i<3;i++){x=240+i*250;l=shape('Flow node '+i,'rounded',178,132,x,1040,i===2?P.soft:P.bg,a,b);txt('Flow label '+i,labels[i],x,1050,31,P.ink,a,b,'center',false,156);key(l,'transform/scale',0,[92,92]);key(l,'transform/scale',1+i*.5,[100,100]);}
 for(i=0;i<2;i++)small('Flow arrow '+i,'→',345+i*250,1050,31,P.accent);
}else if(kind==='web'||kind==='window'){
 line('Browser',690,284,490,1038,P.bg);line('Browser top',690,43,490,917,P.soft);small('Address','your-site',220,926,20,P.muted);
 small('Browser heading',labels[0],185,989,29,P.accent);small('Browser copy 1',labels[1],185,1043,25,P.ink);
 line('Action button',260,58,316,1120,P.accent);txt('Button label',labels[2],316,1130,25,P.panel,a,b,'center',false,236);
 shape('Preview image','rounded',165,165,685,1065,P.soft,a,b);
 small('Browser symbol','P',651,1090,68,P.accent);
 bar=shape('Focus ring','ellipse',24,24,420,1180,P.accent,a,b);key(bar,'transform/position',0,[775,1170]);key(bar,'transform/position',3,[428,1120]);key(bar,'transform/position',12.9,[428,1120]);
}else if(kind==='chat'){
 var phrases=labels;
 for(i=0;i<3;i++){x=i===1?550:430;y=939+i*91;l=shape('Chat bubble '+i,'rounded',540,70,x,y,i===1?P.soft:P.bg,a,b);small('Chat content '+i,phrases[i],x-220,y+10,27,P.ink);key(l,'transform/position',0,[x+15,y]);key(l,'transform/position',2+i,[x,y]);}
}else if(kind==='timeline'){
 for(i=0;i<3;i++){txt('Lane '+i,labels[i],137,960+i*73,23,P.muted,a,b,'left',false,130);line('Track '+i,540,47,563,951+i*73,P.bg);for(var q=0;q<3;q++)line('Clip '+i+' '+q,100+q*15,36,352+q*175,951+i*73,(i+q)%2?P.soft:P.accent);}
 bar=line('Playhead',4,250,280,1045,P.ink);key(bar,'transform/position',0,[280,1045]);key(bar,'transform/position',12.9,[810,1045]);
}else if(kind==='grid'){
 for(i=0;i<4;i++)for(var q=0;q<4;q++)line('Cell '+i+' '+q,148,47,246+q*162,946+i*62,i===0?P.soft:P.bg);
 for(i=0;i<3;i++)txt('Grid heading '+i,labels[i],246+i*162,955,21,P.ink,a,b,'center',false,140);
 for(i=1;i<4;i++){small('Row number '+i,('0'+i).slice(-2),218,955+i*62,21,P.muted);small('Checked '+i,'✓',710,955+i*62,28,P.accent);}
 bar=line('Selected cell',150,4,408,969,P.accent);key(bar,'transform/position',0,[408,969]);key(bar,'transform/position',12.9,[570,1155]);
}else if(kind==='search'){
 line('Search field',670,91,490,980,P.bg);small('Search question',E.topic,180,992,29,P.ink);
 for(i=0;i<3;i++){shape('Search bullet '+i,'ellipse',8,8,186,1070+i*42,P.accent,a,b);small('Search result '+i,labels[i],210,1080+i*42,24,P.ink);}
 shape('Search glass','ellipse',27,27,783,977,P.accent,a,b);line('Search handle',19,6,802,994,P.accent);
}else{
 for(i=0;i<3;i++){x=248+i*245;shape('Step circle '+i,'ellipse',94,94,x,980,P.soft,a,b);small('Step number '+i,String(i+1),x-17,997,47,P.accent);txt('Step word '+i,labels[i],x,1095,28,P.ink,a,b,'center',false,210);if(i<2)small('Step arrow '+i,'→',x+99,995,32,P.accent);}
}
// Reveal the official mascot at the creator introduction.
var hero=picture('Official mascot',imported.items[1],490,855,70,13,18);entrance(hero,490,855,13,18,0);key(hero,'transform/scale',13,[64,64]);key(hero,'transform/scale',13.6,[70,70]);key(hero,'transform/position',13.6,[490,855]);key(hero,'transform/position',18,[490,843]);
txt('Creator end title','ぷい',490,600,100,P.ink,13,18,'center',true);
txt('Creator end roles','教える。作る。伝える。',490,1145,40,P.ink,13,18,'center',true,780);
txt('Creator end action',E.cta,490,1214,33,P.accent,13,18,'center',true,766);
// Four progress marks mirror the actual edit structure.
var cuts=[0,3.3,8,13,18];for(i=0;i<4;i++){shape('Progress base '+i,'rounded',177,5,191+i*204,1307,P.soft,0,18);bar=shape('Progress fill '+i,'rounded',177,5,191+i*204,1307,P.accent,cuts[i],18);key(bar,'transform/opacity',cuts[i],30);key(bar,'transform/opacity',Math.min(cuts[i]+.4,18),100);}
txt('CTA site label','活動・ご相談は公式サイトへ',100,1383,28,P.muted,0,18);
txt('CTA official URL','pui-wobbfet.top',100,1446,43,P.ink,0,18);
txt('Official project name','PROJECT P',100,1500,20,P.muted,0,18);
app.endUndoGroup();writeLn(JSON.stringify({episode:E.id,comp:comp,boxes:boxes,keyCount:keyCount,palette:P}));