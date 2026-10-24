app.newProject();app.beginUndoGroup('Pui kinetic episode 1');
var E={"id":1,"slug":"code-surprise","title":"同じ0なのに、答えが違う。","theme":"JavaScript / 3つの小さな罠","bg":"#10162D","accent":"#B9FF65","second":"#AC9FFF","scenes":[{"head":"え、01？","sub":"","kind":"answer","data":["01"],"pose":"shock","camera":"punch"},{"head":"足したのに。","sub":"JavaScriptの + を実験","kind":"code","data":["\"0\" + 1"],"pose":"shock","camera":"land"},{"head":"答え、どっち？","sub":"まずは直感で。","kind":"choice","data":["1","01"],"pose":"point","camera":"land"},{"head":"\"0\" + 1","sub":"引用符がヒント。","kind":"choice","data":["1","01"],"pose":"point","camera":"chase"},{"head":"答えは","sub":"01","kind":"answer","data":["01"],"pose":"peace","camera":"punch"},{"head":"くっついた。","sub":"文字があると、文字列の連結。","kind":"concat","data":["\"0\"","1","\"01\""],"pose":"point","camera":"land"},{"head":"じゃあ、これは？","sub":"0 + 1","kind":"choice","data":["1","01"],"pose":"shock","camera":"land"},{"head":"今度は、1。","sub":"引用符なしの0は数値。","kind":"compare","data":["0 + 1","1","\"0\" + 1","\"01\""],"pose":"point","camera":"land"},{"head":"見た目より、型。","sub":"文字なのか、数値なのか。","kind":"type","data":["0 : number","\"0\" : string"],"pose":"point","camera":"land"},{"head":"第2問。","sub":"\"5\" - 1 は？","kind":"choice","data":["4","51"],"pose":"shock","camera":"punch"},{"head":"＋と同じ？","sub":"JavaScriptで考えてみよう。","kind":"code","data":["\"5\" - 1"],"pose":"point","camera":"land"},{"head":"答えは、4。","sub":"− は、この文字を数値へ変換。","kind":"answer","data":["4"],"pose":"peace","camera":"punch"},{"head":"同じ文字でも","sub":"演算子で、動きが変わる。","kind":"compare","data":["\"5\" + 1","\"51\"","\"5\" - 1","4"],"pose":"point","camera":"land"},{"head":"ここで予想。","sub":"\"5\" + 1 - 1 は？","kind":"choice","data":["50","5"],"pose":"shock","camera":"land"},{"head":"左から順に。","sub":"まず \"5\" + 1 → \"51\"","kind":"concat","data":["\"5\"","1","\"51\""],"pose":"point","camera":"land"},{"head":"そのあと、−1。","sub":"\"51\" - 1 → 50","kind":"code","data":["\"51\" - 1 → 50"],"pose":"point","camera":"land"},{"head":"答えは、50。","sub":"途中で、文字から数値になる。","kind":"answer","data":["50"],"pose":"peace","camera":"punch"},{"head":"暗記より、分解。","sub":"ひとつずつ、結果と型を見る。","kind":"flow","data":["入力","演算","型を見る"],"pose":"point","camera":"land"},{"head":"数で足したいなら","sub":"Number(\"0\") + 1","kind":"code","data":["Number(\"0\") + 1"],"pose":"point","camera":"land"},{"head":"これなら、1。","sub":"文字の0を数値にしてから足す。","kind":"answer","data":["1"],"pose":"peace","camera":"land"},{"head":"今日の3問。","sub":"全部、JavaScriptで実行確認。","kind":"recap","data":["\"0\" + 1 → \"01\"","\"5\" - 1 → 4","\"5\" + 1 - 1 → 50"],"pose":"point","camera":"land"},{"head":"次は見抜けそう？","sub":"引用符と演算子を見よう。","kind":"compare","data":["文字","string","数値","number"],"pose":"point","camera":"land"},{"head":"わかった！を増やす。","sub":"ぷいの、わかる×気持ちいい実験室。","kind":"hero","data":[],"pose":"peace","camera":"land"},{"head":"次の実験も、ぷいで。","sub":"わかる×気持ちいい実験室","kind":"cta","data":["講師 / 制作 / 動画"],"pose":"peace","camera":"lock"}],"duration":64,"fps":30,"bpm":150},C=[0,0.8,2.4,4,6.4,8,10.4,12.8,15.2,16.8,19.2,22.4,25.6,28.8,32,35.2,38.4,41.6,44.8,48,51.2,54.4,57.6,60.8,64],D=64,rig=null,boxes=[],ledger=[],scene=0,dark=E.bg,accent=E.accent,second=E.second,white='#F7FAFF',ink='#10182B';
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,ts){var k=[];for(var i=0;i<ts.length;i++)k.push({layer:l,prop:p,time:Math.round(ts[i]*30)/30});run('keys.select',{keys:k,timeBase:'comp'});run('keys.interpolation',{interpolation:'bezier'});run('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:70,outInfluence:70,continuous:false});}
var comp=run('comp.new',{name:'Pui Kinetic '+E.id,width:1080,height:1920,frameRate:30,duration:D,background:dark,shutterAngle:145,shutterPhase:-72,motionBlurSamples:6}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});run('comp.setSwitch',{switch:'motionBlur',value:true});
var imp=run('file.import',{paths:["\\\\wsl.localhost\\Ubuntu\\home\\pui\\Videos\\Pui-Promo\\2026-10-24\\kinetic-five\\media\\mascot-point.png","\\\\wsl.localhost\\Ubuntu\\home\\pui\\Videos\\Pui-Promo\\2026-10-24\\kinetic-five\\media\\mascot-peace.png","\\\\wsl.localhost\\Ubuntu\\home\\pui\\Videos\\Pui-Promo\\2026-10-24\\kinetic-five\\media\\mascot-shock.png"],sequence:false});if(imp.errors.length)throw Error(JSON.stringify(imp.errors));
function attach(l,blur){if(rig)run('layer.setParent',{layers:[l],parent:rig,compensate:true});run('layer.setSwitch',{layers:[l],switch:'motionBlur',value:!!blur});return l;}
function shape(n,w,h,x,y,col,a,b,kind,stroke,blur){var l=run('layer.newShape',{name:n,kind:kind||'rounded',size:[w,h],position:[x,y],fill:col,stroke:stroke||col,strokeWidth:stroke?3:0}).layer;timing(l,a,b);return attach(l,blur);}
function txt(n,text,x,y,size,col,a,b,width){var l=run('layer.newText',{name:n,text:text,font:'Meiryo',style:'Bold',size:size,fill:col,position:[x,y],justify:'center'}).layer;var ob=app.project.activeItem.layer(n),r=ob.sourceRectAtTime(a,false);if(r.width>(width||840)){size=Math.floor(size*(width||840)/r.width);run('layer.setText',{layer:l,size:size});r=ob.sourceRectAtTime(a,false);}set(l,'transform/anchor',[r.left+r.width/2,r.top+r.height/2,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);attach(l,false);boxes.push({name:n,text:text,layer:l,scene:scene,size:size,center:[x,y],width:r.width,height:r.height,start:a,end:b});return l;}
function actor(pose,x,y,h,a,b,tilt){var po=pose==='peace'?1:pose==='shock'?2:0,l=run('layer.addItem',{item:imp.items[po],time:a,duration:b-a}).layer,s=h/1536*100;run('layer.rename',{layer:l,name:'Pui '+pose+' '+scene});timing(l,a,b);set(l,'transform/position',[x,y]);set(l,'transform/scale',[s,s]);var savedRig=rig;if(S.camera==='chase')rig=null;attach(l,true);rig=savedRig;var t=[a,a+.17,a+.3,Math.max(a+.31,b-.08)];key(l,'transform/position',t[0],[x+50,y+45]);key(l,'transform/position',t[1],[x-7,y-6]);key(l,'transform/position',t[2],[x,y]);key(l,'transform/position',t[3],[x,y-8]);key(l,'transform/rotation',a,(tilt||0)-4);key(l,'transform/rotation',a+.3,tilt||0);key(l,'transform/scale',a,[s*.94,s*1.025]);key(l,'transform/scale',a+.17,[s*1.018,s*.99]);key(l,'transform/scale',a+.3,[s,s]);ease(l,'transform/position',t);ease(l,'transform/rotation',[a,a+.3]);ease(l,'transform/scale',[a,a+.17,a+.3]);ledger.push({kind:'pose',pose:pose,layer:l,start:a,end:b});return l;}
function cam(l,t,x,y,s,r){key(l,'transform/position',t,[x,y,0]);key(l,'transform/scale',t,[s,s,100]);key(l,'transform/rotation',t,r||0);}
function focus(l,t,x,y,s){var k=s/100;cam(l,t,540+(540-x)*k,960+(960-y)*k,s,0);}
function begin(n,a,b,light){rig=null;shape('Field '+scene,1400,2500,540,960,light?accent:dark,a,b,'rect');if(!light){shape('Left rail '+scene,11,1650,45,1040,accent,a,b,'rect');shape('Right rail '+scene,11,1650,1035,1040,second,a,b,'rect');}var r=run('layer.newNull',{name:'CAM '+scene+' '+n}).layer;set(r,'transform/anchor',[540,960,0]);set(r,'transform/position',[540,960,0]);timing(r,a,b);rig=r;ledger.push({kind:'camera',scene:scene,name:n,layer:r,start:a,end:b});return r;}
function button(n,label,x,y,w,a,b,active){shape(n+' plate',w,110,x,y,active?accent:'#333C59',a,b,'rounded',active?null:second);txt(n+' label',label,x,y,active?47:36,active?ink:white,a,b,w-36);}
function pointer(x,y,a,b,toX,toY){var l=txt('Cursor '+scene,'↖',x,y,104,accent,a,b,160);key(l,'transform/position',a,[x,y]);key(l,'transform/position',a+.22,[toX,toY]);key(l,'transform/position',b-.05,[toX,toY]);ease(l,'transform/position',[a,a+.22,b-.05]);return l;}
function window(n,a,b){shape(n+' panel',850,650,520,1040,'#F4F6FD',a,b,'rounded');shape(n+' toolbar',850,58,520,745,second,a,b);for(var i=0;i<3;i++)shape(n+' dot '+i,12,12,145+i*24,745,dark,a,b,'ellipse');}
function line(n,w,x,y,a,b,col){return shape(n,w,12,x,y,col||'#CBD3E4',a,b);}
function demo(S,a,b){var d=S.data,k=S.kind,i,x,y,l;
 if(k==='hero'||k==='cta'||k==='answer'||k==='wipe'){
   actor(S.pose,540,k==='answer'?1210:1190,k==='answer'?1120:1320,a,b,scene%2?2:-2);
   if(k==='answer'){shape('Answer plate '+scene,740,245,520,860,accent,a,b);txt('Answer '+scene,d[0]||S.sub,520,860,190,ink,a,b,680);}
   if(k==='wipe'){for(i=0;i<5;i++){l=shape('Align strip '+i,690,55,520,760+i*72,i%2?second:accent,a,b,'rect',null,true);key(l,'transform/position',a,[i%2?-600:1600,760+i*72]);key(l,'transform/position',a+.28+i*.033,[520,760+i*72]);}}
 }else if(k==='code'||k==='choice'||k==='compare'||k==='type'||k==='recap'||k==='concat'){
   actor(S.pose,800,1400,710,a,b,-2);
   shape('Code panel '+scene,850,k==='recap'?600:490,520,1010,'#080F21',a,b,'rounded',second);
   if(k==='code')txt('Code '+scene,d[0],520,990,87,accent,a,b,760);
   if(k==='choice'){button('Choice A '+scene,d[0],305,1110,340,a,b,false);button('Choice B '+scene,d[1],745,1110,340,a,b,false);txt('Pick '+scene,'A',305,925,53,second,a,b,200);txt('Pick B '+scene,'B',745,925,53,second,a,b,200);}
   if(k==='compare'||k==='type'){var ar=k==='type'?[d[0],'',d[1],'']:d;for(i=0;i<2;i++){txt('Compare in '+scene+i,ar[i*2],520,825+i*220,67,white,a,b,730);if(ar[i*2+1])txt('Compare out '+scene+i,ar[i*2+1],520,912+i*220,78,i?second:accent,a,b,730);}}
   if(k==='recap')for(i=0;i<d.length;i++)txt('Recap '+scene+i,d[i],520,850+i*155,58,i%2?second:accent,a,b,760);
   if(k==='concat'){txt('Concat plus '+scene,'+',520,940,90,second,a,b,160);l=txt('Concat left '+scene,d[0],260,940,97,accent,a,b,300);key(l,'transform/position',a,[100,940]);key(l,'transform/position',a+.4,[260,940]);l=txt('Concat right '+scene,d[1],780,940,97,accent,a,b,260);key(l,'transform/position',a,[1000,940]);key(l,'transform/position',a+.4,[780,940]);txt('Concat equals '+scene,'↓',520,1075,65,white,a+.5,b,180);txt('Concat result '+scene,d[2],520,1190,107,second,a+.6,b,650);}
 }else if(k==='web'){
   window('Web '+scene,a,b);var chaos=d[0]==='chaos';
   txt('Site hero '+scene,chaos?'ようこそ':'制作のご相談',520,840,52,ink,a,b,760);
   for(i=0;i<3;i++)line('Web text '+scene+i,chaos?650-i*110:520,520,915+i*38,a,b);
   if(chaos){for(i=0;i<6;i++)button('Mystery '+scene+i,'こちら',245+(i%3)*270,1070+Math.floor(i/3)*150,220,a,b,i%2===0);pointer(910,1300,a,b,scene%2?385:755,scene%2?1110:1240);}
   else{button('Consult '+scene,'相談する',520,1120,610,a,b,true);txt('Other route '+scene,'制作例を見る',520,1270,35,ink,a,b,650);pointer(890,1320,a,b,690,1170);}
   actor(S.pose,855,1490,560,a,b,1);
 }else if(k==='button'||k==='spacing'||k==='tiny'){
   actor(S.pose,790,1400,860,a,b,1);
   if(k==='button'){button('Before '+scene,d[0],500,850,720,a,b,false);txt('Down '+scene,'↓',500,990,85,second,a,b,180);button('After '+scene,d[1],500,1140,720,a,b,true);}
   if(k==='tiny'){txt('Tiny target '+scene,d[0],350,1010,25,accent,a,b,220);shape('Finger size '+scene,90,90,450,1050,second,a,b,'ellipse');}
   if(k==='spacing'){var spaced=d[0]==='after';button('Spacing L '+scene,'戻る',spaced?285:355,1000,spaced?300:320,a,b,false);button('Spacing R '+scene,'送信',spaced?765:690,1000,spaced?300:320,a,b,true);}
 }else if(k==='form'){
   window('Form '+scene,a,b);var many=d[0]==='many',labels=many?['お名前','会社名','部署','電話','住所','メール']:['メールアドレス *','相談したいこと *'];
   for(i=0;i<labels.length;i++){y=830+i*(many?75:180);shape('Input '+scene+i,680,many?54:120,520,y+28,'#E0E5F2',a,b);txt('Input label '+scene+i,labels[i],490,y,many?25:38,ink,a,b,620);}if(!many)button('Send '+scene,'送信する',520,1240,640,a,b,true);actor(S.pose,865,1480,530,a,b);
 }else if(k==='flow'||k==='folders'){
   var num=d.length;actor(S.pose,780,1450,770,a,b,-2);
   for(i=0;i<num;i++){x=num===2?300+i*450:235+i*290;shape('Node '+scene+i,num===2?360:245,220,x,1000,i===num-1?accent:'#34415C',a,b,'rounded',second);txt('Node label '+scene+i,d[i],x,1000,num===2?62:43,i===num-1?ink:white,a,b,num===2?310:220);if(i<num-1)txt('Arrow '+scene+i,'→',x+(num===2?225:145),1000,52,second,a,b,85);}
 }else if(k==='files'||k==='fileOne'){
   actor(S.pose,540,k==='fileOne'?1270:1320,k==='fileOne'?1050:1220,a,b,scene%2?3:-3);
   var labels=d[0]==='versions'?['最終.mp4','最終_修正.mp4','最終_本当.mp4','最終_本当2.mp4']:d[0]==='timestamps'?['15:01 最終','15:03 修正','15:04 本当']:['名前をコピペ','日付をコピペ','金額をコピペ','またコピペ'];
   if(k==='fileOne'){shape('Only file '+scene,820,175,520,870,accent,a,b,'rounded');txt('Only file name '+scene,d[0],520,870,68,ink,a,b,750);}
   else for(i=0;i<labels.length;i++){x=scene%2?400+i*45:660-i*50;y=730+i*100;l=shape('File '+scene+i,660,88,x,y,i%2?second:accent,a,b,'rounded',null,true);key(l,'transform/position',a,[x+(i%2?600:-700),y-80]);key(l,'transform/position',a+.17+i*.10,[x,y]);txt('File label '+scene+i,labels[i],x,y,38,ink,a+Math.min(.25,i*.10),b,610);}
 }else if(k==='rows'){
   var mode=d[0],raw=mode==='raw',bad=mode==='invalid'||mode==='checked',rows=raw?[' ぷい  | １２，０００',' あお  | ５，０００',' みず  | （空欄）']:bad?['ぷい | 12000 | OK','あお | 5000 | OK','みず | 空欄 | 要確認']:['ぷい | 12000 | OK','あお | 5000 | OK','みず | 要確認 → 人へ'];
   shape('Table '+scene,860,620,520,1030,'#F1F7F7',a,b,'rounded');txt('Table header '+scene,'名前   /   金額   /   状態',520,815,37,ink,a,b,760);
   for(i=0;i<3;i++){y=950+i*145;shape('Row '+scene+i,800,110,520,y,i===2&&bad?'#FFD6BC':'#D3EAE5',a,b);txt('Row value '+scene+i,rows[i],520,y,42,ink,a,b,760);}actor(S.pose,855,1490,550,a,b);
 }else if(k==='normalize'){
   actor(S.pose,770,1380,850,a,b);txt('Raw '+scene,d[0],500,835,86,white,a,b,800);txt('Normalize arrow '+scene,'↓',500,1000,95,second,a,b,200);shape('Normalized plate '+scene,770,170,500,1160,accent,a,b);txt('Normalized '+scene,d[1],500,1160,101,ink,a,b,710);
 }else if(k==='warning'||k==='message'||k==='success'||k==='silent'||k==='clock'||k==='rewind'){
   actor(S.pose,540,1280,1260,a,b,-1);var plate=k==='warning'||k==='message'?'#FFD0B6':accent;
   shape('Result plate '+scene,830,235,520,880,plate,a,b);txt('Result value '+scene,d[0],520,880,k==='clock'?135:67,ink,a,b,750);
   if(k==='success')for(i=0;i<8;i++){l=shape('Confetti '+scene+i,12,38,130+i*110,720,second,a,Math.min(a+.9,b),'rect',null,true);set(l,'transform/rotation',i*31);key(l,'transform/position',a,[520,930]);key(l,'transform/position',a+.8,[130+i*110,650+(i%3)*90]);}
 }else if(k==='editor'){
   window('Editor '+scene,a,b);txt('Document title '+scene,'メモを編集',450,835,45,ink,a,b,650);for(i=0;i<4;i++)line('Document '+scene+i,520-i*60,440,920+i*45,a,b);button('Save '+scene,'保存',750,835,230,a,b,true);
   if(d[0]!=='save'){shape('Saved row '+scene,740,90,520,1245,accent,a+(d[0]==='fast'?.18:.6),b);txt('Saved label '+scene,'保存しました',520,1245,42,ink,a+(d[0]==='fast'?.18:.6),b,690);}
   pointer(d[0]==='fast'?200:920,1150,a,b,805,880);actor(S.pose,860,1510,520,a,b);
 }else if(k==='timeline'||k==='checklist'){
   actor(S.pose,810,1420,760,a,b);
   if(k==='checklist'){for(i=0;i<d.length;i++){shape('Check plate '+scene+i,670,135,450,790+i*170,i%2?second:accent,a,b);txt('Check '+scene+i,d[i],450,790+i*170,68,ink,a,b,620);}}
   else{var names=['映像','字幕','音'];for(i=0;i<3;i++){txt('Track title '+scene+i,names[i],165,860+i*160,36,white,a,b,130);shape('Track '+scene+i,650,95,580,860+i*160,'#303E5F',a,b);for(var j=0;j<3;j++)shape('Clip '+scene+i+j,150,75,370+j*210,860+i*160,j%2?second:accent,a,b);}l=shape('Playhead '+scene,7,520,270,1020,white,a,b,'rect',null,true);key(l,'transform/position',a,[270,1020]);key(l,'transform/position',b-.1,[880,1020]);}
 }
}
for(scene=0;scene<E.scenes.length;scene++){
 var S=E.scenes[scene],a=C[scene],b=C[scene+1],light=S.kind==='wipe',co=light?ink:white,r=begin(S.head,a,b,light);
 demo(S,a,b);
 // The UI and its own labels share the tracking rig. Reading text stays in screen coordinates.
 rig=null;if(S.camera==='chase')shape('Reading field '+scene,1010,515,540,433,light?accent:dark,a,b,'rect');
 // Native measured anchors keep Japanese quote marks and code in their boxes.
 var head=txt('Headline '+scene,S.head,520,scene===0?425:425,scene===0?134:S.kind==='cta'?74:101,co,a,b,865);
 if(S.sub&&S.kind!=='answer'&&S.kind!=='cta')txt('Explanation '+scene,S.sub,520,585,39,light?ink:second,a,b,850);
 if(S.kind==='answer')txt('Answer explanation '+scene,S.sub===S.data[0]?'JavaScript':S.sub,520,610,37,second,a,b,830);
 if(S.kind==='cta')txt('Series end '+scene,E.id===5?'ぷいの小さな制作劇場':'わかる × 気持ちいい実験室',520,585,40,accent,a,b,850);
 key(head,'transform/position',a,[520,447]);key(head,'transform/position',a+.16,[520,421]);key(head,'transform/position',a+.30,[520,425]);ease(head,'transform/position',[a,a+.16,a+.30]);
 var ts=[a,a+.16,a+.30,b-.05];
 if(S.camera==='lock'){cam(r,a,540,1000,110,2);cam(r,a+.24,540,960,100,0);cam(r,b-.05,540,960,100,0);ts=[a,a+.24,b-.05];}
 else if(S.camera==='chase'&&b-a>1.2){cam(r,a,scene%2?430:650,1000,115,scene%2?-3:3);cam(r,a+.23,540,960,100,0);cam(r,a+.65,540,960,100,0);var tx=S.kind==='web'?(S.data[0]==='chaos'?300:520):S.kind==='editor'?750:520,ty=S.kind==='editor'?(S.data[0]==='result'?1245:835):S.kind==='web'?1120:1000;focus(r,a+.93,tx,ty,143);focus(r,b-.38,tx,ty,143);cam(r,b-.08,540,960,100,0);ts=[a,a+.23,a+.65,a+.93,b-.38,b-.08];ledger.push({kind:'tracked-target',scene:scene,rig:r,time:Math.round((a+.93)*30)/30,x:tx,y:ty,scale:143,target:S.kind});}
 else if(S.camera==='punch'){cam(r,a,540,1050,134,-4);cam(r,a+.16,540,940,97,1);cam(r,a+.30,540,960,100,0);cam(r,b-.05,540,960,100,0);}
 else{cam(r,a,scene%2?445:635,1020,115,scene%2?-3:3);cam(r,a+.16,540,947,99,0);cam(r,a+.30,540,960,100,0);cam(r,b-.05,540,960,100,0);}
 ease(r,'transform/position',ts);ease(r,'transform/scale',ts);ease(r,'transform/rotation',ts);rig=null;
}
// Whips mark actual chapter changes. Other transitions are spatial match cuts.
for(var n=0;n<3;n++){var t=[6.4,25.6,44.8][n],sg=n%2?1:-1,w=shape('Chapter whip '+n,1150,2700,-1800*sg,960,n%2?second:accent,t-.10,t+.10,'rect',null,true);set(w,'transform/rotation',sg*13);key(w,'transform/position',t-.10,[-1800*sg,960]);key(w,'transform/position',t+.10,[2400*sg,960]);}
shape('Identity bar',620,48,380,235,dark,0,D);txt('Identity label','ぷいの、わかる×気持ちいい実験室',380,235,23,accent,0,D,590);
txt('Source note','自主制作 / '+E.theme,500,289,22,second,0,D,850);
shape('Voice credit plate',430,34,500,330,dark,0,D);txt('Voice credit','VOICEVOX:四国めたん',500,330,22,second,0,D,850);
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,motionLedger:ledger,scenes:E.scenes.length,duration:D,bpm:150,cuts:C}));