import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const source=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.env.PUI_PROMO_ROOT||'/home/pui/Videos/Pui-Promo/2026-10-24');
const EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
export const duration=18, fps=30;
const file=p=>path.join(root,p);
const json=(p,v)=>fs.writeFileSync(file(p),JSON.stringify(v,null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const d of ['source','projects','videos','media','qa','checkpoints'])fs.mkdirSync(file(d),{recursive:true});
const np=p=>spawnSync('wslpath',['-w',p],{encoding:'utf8'}).stdout.trim();
function call(exe,args,receipt,stdin){
 const r=spawnSync(exe,args,{encoding:'utf8',input:stdin,timeout:3600000,maxBuffer:16*1024*1024});
 const data={exit:r.status,error:r.error?.message,stdout:r.stdout?.replace(/^\uFEFF/,''),stderr:r.stderr};
 if(receipt)json(receipt,data);
 if(r.status!==0||r.error)throw Error(JSON.stringify({exe,args,...data}).slice(0,5000));
 return data.stdout.trim();
}
const run=(exe,args,receipt)=>new Promise((resolve,reject)=>{
 const started=Date.now(),p=spawn(exe,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
 p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);
 p.on('error',reject);p.on('close',exit=>{const r={exit,elapsedSeconds:(Date.now()-started)/1000,stdout,stderr};json(receipt,r);if(exit)reject(Error(exe+' failed '+JSON.stringify(r).slice(-3500)));else resolve(stdout);});
});

const palettes=[
 {bg:'#eff8f7',panel:'#ffffff',ink:'#112e42',muted:'#466375',accent:'#007b80',soft:'#c9eeeb',code:'#173449'},
 {bg:'#101d32',panel:'#1b2d46',ink:'#f2f6f9',muted:'#b2c9da',accent:'#69e0d1',soft:'#26475a',code:'#101d32'},
 {bg:'#fff5e8',panel:'#ffffff',ink:'#302d3c',muted:'#65576a',accent:'#a74427',soft:'#ffe0be',code:'#302d3c'},
 {bg:'#edf2ff',panel:'#ffffff',ink:'#162950',muted:'#485e83',accent:'#375eb0',soft:'#d5e2ff',code:'#162950'},
 {bg:'#201d32',panel:'#302b46',ink:'#faf5ff',muted:'#c5b9d9',accent:'#f1b7f7',soft:'#493b63',code:'#201d32'},
 {bg:'#eef8f0',panel:'#ffffff',ink:'#163c32',muted:'#446a5a',accent:'#226d4a',soft:'#d2ecd7',code:'#163c32'},
 {bg:'#112a31',panel:'#1c3c45',ink:'#f0fcfc',muted:'#b1cdd1',accent:'#8ce5e2',soft:'#29545b',code:'#112a31'},
 {bg:'#fff0f0',panel:'#ffffff',ink:'#482d40',muted:'#7b536b',accent:'#a83f68',soft:'#f9d9e5',code:'#482d40'},
 {bg:'#fbf7eb',panel:'#ffffff',ink:'#373a35',muted:'#62675c',accent:'#73601c',soft:'#f0e5bc',code:'#373a35'},
 {bg:'#17243a',panel:'#253650',ink:'#f6f8fd',muted:'#c0cedf',accent:'#9ecbff',soft:'#304d71',code:'#17243a'}
];

export function composition(ep){
 const pal=palettes[Math.floor((ep.id-1)/10)%palettes.length],logo=np(file('media/logo-original.png')),icon=np(file('media/icon-original.png'));
 const twoSteps=[5,23,73,94].includes(ep.id);
 let jsx=`app.newProject();app.beginUndoGroup('Pui promo ${ep.id}');
var E=${JSON.stringify(ep)},P=${JSON.stringify(pal)},D=18,boxes=[],keyCount=0;
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});keyCount++;}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:'Pui '+E.id,width:1080,height:1920,frameRate:30,duration:D,background:P.bg}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
function shape(name,kind,w,h,x,y,color,a,b,opacity){var l=run('layer.newShape',{name:name,kind:kind,size:[w,h],position:[x,y],fill:color,strokeWidth:0}).layer;timing(l,a||0,b||D);if(opacity!==undefined)set(l,'transform/opacity',opacity);return l;}
function entrance(l,x,y,a,b,delay){delay=delay||0;key(l,'transform/opacity',a,0);key(l,'transform/opacity',a+.18+delay,100);key(l,'transform/opacity',b-.12,100);key(l,'transform/opacity',b,0);key(l,'transform/position',a,[x,y+26]);key(l,'transform/position',a+.32+delay,[x,y]);}
function txt(name,text,x,y,size,color,a,b,justify,animate,maxWidth){
 var l=run('layer.newText',{name:name,text:text,position:[x,y],font:'Meiryo',style:'Bold',size:size,fill:color,justify:justify||'left',tracking:0}).layer;
 var obj=app.project.activeItem.layer(name),r=obj.sourceRectAtTime(a,false),limit=maxWidth||${ep.id===79?730:766};
 if(r.width>limit){size=Math.floor(size*limit/r.width);run('layer.setText',{layer:l,size:size});r=obj.sourceRectAtTime(a,false);}
 timing(l,a,b);if(animate)entrance(l,x,y,a,b,0);
 boxes.push({name:name,text:text,layer:l,size:size,start:a,end:b,x:x+r.left,y:y+r.top,width:r.width,height:r.height,animated:!!animate});return l;
}
function picture(name,item,x,y,scale,a,b){var l=run('layer.addItem',{item:item,time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:name});timing(l,a,b);set(l,'transform/position',[x,y]);set(l,'transform/scale',[scale,scale]);return l;}
var imported=run('file.import',{paths:[${JSON.stringify(logo)},${JSON.stringify(icon)}],sequence:false});if(imported.errors.length)throw Error(JSON.stringify(imported.errors));
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
 for(i=0;i<${twoSteps?2:3};i++){x=${twoSteps?'350+i*280':'248+i*245'};shape('Step circle '+i,'ellipse',94,94,x,980,P.soft,a,b);small('Step number '+i,String(i+1),x-17,997,47,P.accent);txt('Step word '+i,labels[i],x,1095,28,P.ink,a,b,'center',false,210);if(i<${twoSteps?1:2})small('Step arrow '+i,'→',x+99,995,32,P.accent);}
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
app.endUndoGroup();writeLn(JSON.stringify({episode:E.id,comp:comp,boxes:boxes,keyCount:keyCount,palette:P}));`;
 if(ep.id===58){
  const start=jsx.indexOf(" line('Flow connector'"),end=jsx.indexOf("}else if(kind==='web'||kind==='window'){",start);
  if(start<0||end<start)throw Error('Comparison illustration insertion point missing.');
  jsx=jsx.slice(0,start)+` small('Comparison heading','同じ備品名でも',170,945,29,P.ink);
 for(i=0;i<2;i++){x=325+i*330;shape('Comparison card '+i,'rounded',285,172,x,1060,P.bg,a,b);txt('Comparison name '+i,labels[0],x,1035,25,P.ink,a,b,'center',false,250);txt('Comparison ID '+i,labels[i+1],x,1100,32,P.accent,a,b,'center',false,250);}
 small('Comparison result','番号で見分ける',320,1183,25,P.muted);
`+jsx.slice(end);
 }
 return jsx;
}

function makeScore(ep){
 const rate=48000,N=rate*duration,L=new Float64Array(N),R=new Float64Array(N);let seed=ep.id*9973;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
 function snd(at,d,fn,g=.1,pan=0){const st=Math.round(at*rate),n=Math.round(d*rate);for(let i=0;i<n&&st+i<N;i++){if(st+i<0)continue;const v=fn(i/rate,i/n)*g;L[st+i]+=v*(1-pan*.3);R[st+i]+=v*(1+pan*.3);}}
 const series=Math.floor((ep.id-1)/10)%10,bpm=[108,112,104,116,106,110,100,114,108,112][series],beat=60/bpm;
 const roots=[130.8128,146.8324,164.8138,174.6141,196,146.8324,130.8128,164.8138,174.6141,146.8324];
 const base=roots[series],progression=[1,.7937005,1.122462,.8908987],melody=[0,7,12,4,9,7,4,2];
 for(let k=0,t=0;t<duration;k++,t=k*beat){
  const chord=progression[Math.floor(k/8)%4],f=base*chord;
  snd(t,.22,s=>Math.sin(2*Math.PI*(54*s+23*(1-Math.exp(-s*38))/38))*Math.exp(-s*24),.23);
  if(k%2===1)snd(t,.14,s=>(rnd()*.5+Math.sin(2*Math.PI*180*s)*.2)*Math.exp(-s*37),.09);
  snd(t+beat*.5,.055,s=>rnd()*Math.exp(-s*80),.038,k%2?.4:-.4);
  snd(t,.65,s=>Math.sin(2*Math.PI*f*.5*s)*Math.exp(-s*9),.075);
  const note=melody[(k+ep.id)%melody.length],hz=f*2**(note/12)*2;
  snd(t+beat*.5,.72,s=>(Math.sin(2*Math.PI*hz*s)+.22*Math.sin(2*Math.PI*hz*2*s))*Math.exp(-s*7)*Math.min(1,s/.008),.043,k%2?.6:-.6);
  if(k%8===0)for(const n of [0,4,7])snd(t,3.3,(s,p)=>Math.sin(2*Math.PI*f*2**(n/12)*s)*Math.sin(Math.PI*p)*.25,.05,n===4?-.5:.5);
 }
 for(const t of [3.3,8,13]){snd(t-.12,.2,(s,p)=>rnd()*Math.sin(Math.PI*p)**2,.04);snd(t,.25,s=>Math.sin(2*Math.PI*784*s)*Math.exp(-s*20),.04);}
 const wave=Buffer.alloc(44+N*4);wave.write('RIFF');wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(2,22);wave.writeUInt32LE(rate,24);wave.writeUInt32LE(rate*4,28);wave.writeUInt16LE(4,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(N*4,40);
 for(let i=0;i<N;i++){const env=Math.min(1,i/(rate*.025),(N-1-i)/(rate*.3));wave.writeInt16LE(Math.round(Math.tanh(L[i])*env*26000),44+i*4);wave.writeInt16LE(Math.round(Math.tanh(R[i])*env*26000),46+i*4);}
 const id=String(ep.id).padStart(3,'0');fs.writeFileSync(file('media/'+id+'-score.wav'),wave);
 call(FF,['-v','warning','-y','-i',np(file('media/'+id+'-score.wav')),'-af','loudnorm=I=-17:TP=-2:LRA=7','-ar','48000','-c:a','flac',np(file('media/'+id+'-score.flac'))],'qa/'+id+'/music-normalize.json');
 fs.unlinkSync(file('media/'+id+'-score.wav'));
}

function prepare(ep){
 const id=String(ep.id).padStart(3,'0');fs.mkdirSync(file('qa/'+id),{recursive:true});
 if(fs.existsSync(file('projects/'+id+'.ecproj'))){
  const checkpoint=file('checkpoints/'+id+'-'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(checkpoint,{recursive:true});
  for(const rel of ['projects/'+id+'.ecproj','projects/'+id+'.fcproj','source/'+id+'.jsx','qa/'+id+'/checkpoint.json','qa/'+id+'/rendered.json'])if(fs.existsSync(file(rel)))fs.copyFileSync(file(rel),path.join(checkpoint,path.basename(rel)));
 }
 fs.writeFileSync(file('source/'+id+'.jsx'),composition(ep));
 const built=JSON.parse(call(EC,['--empty','script',np(file('source/'+id+'.jsx')),'--save-as',np(file('projects/'+id+'.ecproj')),'--json'],'qa/'+id+'/build.json'));
 if(!built.ok)throw Error(JSON.stringify(built));const report=JSON.parse(built.output);json('qa/'+id+'/text-layout.json',report);
 for(const r of report.boxes){if(r.size<18||r.x<95||r.x+r.width>890||r.y<210||r.y+r.height+(r.animated?26:0)>1540)throw Error('Text outside safe area: '+JSON.stringify(r));}
 makeScore(ep);json('qa/'+id+'/checkpoint.json',{ecSha256:hash(file('projects/'+id+'.ecproj')),episode:ep,sourceSha256:hash(file('source/'+id+'.jsx')),saved:true});
 return report;
}

async function render(ep){
 const id=String(ep.id).padStart(3,'0');const ec=file('projects/'+id+'.ecproj'),fc=file('projects/'+id+'.fcproj'),master=file('media/'+id+'-master.mp4');
 let prepared=false;
 try{prepared=fs.existsSync(ec)&&fs.readFileSync(file('source/'+id+'.jsx'),'utf8')===composition(ep)&&fs.statSync(file('media/'+id+'-score.flac')).size>0&&JSON.parse(fs.readFileSync(file('qa/'+id+'/checkpoint.json'))).ecSha256===hash(ec);}catch{prepared=false;}
 if(!prepared)prepare(ep);
 await run(EC,['render','--project',np(ec),'--comp','Pui '+ep.id,'--out',np(master),'--format','h264','--bitrate','9000','--audio','off','--progress','--json'],'qa/'+id+'/ec-render.json');
 const init=[{id:'file.newProject',params:{name:'Pui '+id+' / '+ep.topic}},{id:'file.newSequence',params:{name:'Pui '+id,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(master),np(file('media/'+id+'-score.flac'))]}}];
 const result=call(FC,['--save-as',np(fc),'run','-'],'qa/'+id+'/fc-build.json',init.map(x=>JSON.stringify(x)).join('\n')+'\n');
 // Read native JSONL results instead of assuming imported item IDs.
 const flat=result.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
 let items;for(const r of flat){const v=r.result||r;if(v.items)items=v.items;}if(!items||items.length!==2)throw Error('Cannot find imported native IDs: '+result.slice(0,2000));
 const finish=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:duration*254016000000,video:false,audio:true}}];
 call(FC,['--project',np(fc),'--save','run','-'],'qa/'+id+'/fc-place.json',finish.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const output=file('videos/'+id+'-pui.mp4');
 const exportResult=JSON.parse(await run(FC,['--project',np(fc),'exec','file.exportMedia',JSON.stringify({path:np(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:19,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'qa/'+id+'/fc-export.json'));
 if(exportResult.offlineMedia?.length!==0)throw Error('Offline media in export '+id);
 json('qa/'+id+'/rendered.json',{id:ep.id,filename:path.basename(output),sha256:hash(output),bytes:fs.statSync(output).size,ecSha256:hash(ec),fcSha256:hash(fc),utc:new Date().toISOString()});
 console.log(JSON.stringify({id:ep.id,topic:ep.topic,rendered:true,bytes:fs.statSync(output).size}));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const mode=process.argv[2]||'help',diagramFile=path.join(source,'diagram-labels.json'),diagrams=fs.existsSync(diagramFile)?JSON.parse(fs.readFileSync(diagramFile)):{};
const episodes=fs.existsSync(path.join(source,'episodes.json'))?JSON.parse(fs.readFileSync(path.join(source,'episodes.json'))).map(e=>({...e,diagram:diagrams[String(e.id)]})):[];
const ids=(process.argv[3]||'').split(',').filter(Boolean).map(Number),selected=episodes.filter(e=>!ids.length||ids.includes(e.id));
if(mode==='prototype'){
 const ep={id:1001,series:'ぷいの、つくると伝える',topic:'毎日のコピペ',hook:['毎日のコピペ、','そろそろ卒業？'],insight:['まずは、同じ作業を','ひとつ見つけよう。'],example:['表から表へ転記。','その流れを図にする。'],cta:'小さな自動化の相談は、ぷいへ',visual:'flow'};
 prepare(ep);await render(ep);
 for(const [name,t]of [['hook',1.4],['insight',5.3],['example',10.4],['creator',15.3]])call(EC,['render-frame','--project',np(file('projects/1001.ecproj')),'--comp','Pui 1001','--time',String(t),'--out',np(file('qa/1001/'+name+'.png')),'--json'],'qa/1001/'+name+'-render.json');
}
else if(mode==='prepare'){for(const ep of selected){prepare(ep);console.log('prepared '+ep.id);}}
else if(mode==='render'){for(const ep of selected)await render(ep);}
else if(mode==='run'){
 if(episodes.length!==100||episodes.some(e=>!Array.isArray(e.diagram)||e.diagram.length!==3))throw Error('All 100 episode-specific illustrations must be prepared first.');
 const jobs=Math.max(1,Math.min(3,Number(process.env.PUI_PROMO_JOBS||2))),queue=[...selected];
 await Promise.all(Array.from({length:jobs},async()=>{while(queue.length){
  const ep=queue.shift(),id=String(ep.id).padStart(3,'0'),receipt=file('qa/'+id+'/rendered.json');
  let cached=false;
  try{const old=JSON.parse(fs.readFileSync(receipt)),checkpoint=JSON.parse(fs.readFileSync(file('qa/'+id+'/checkpoint.json')));cached=fs.existsSync(file('media/'+id+'-score.flac'))&&checkpoint.ecSha256===old.ecSha256&&fs.readFileSync(file('source/'+id+'.jsx'),'utf8')===composition(ep)&&old.sha256===hash(file('videos/'+id+'-pui.mp4'))&&old.ecSha256===hash(file('projects/'+id+'.ecproj'))&&old.fcSha256===hash(file('projects/'+id+'.fcproj'));}catch{cached=false;}
  if(cached)continue;
  await render(ep);
 }}));
}
else if(mode==='frames'){
 for(const ep of selected){const id=String(ep.id).padStart(3,'0');for(const [name,t]of [['hook',1.4],['insight',5.3],['example',10.4],['creator',15.3]])call(EC,['render-frame','--project',np(file('projects/'+id+'.ecproj')),'--comp','Pui '+ep.id,'--time',String(t),'--out',np(file('qa/'+id+'/'+name+'.png')),'--json'],'qa/'+id+'/'+name+'-render.json');}
}else if(mode==='stage'){
 fs.copyFileSync(path.join(source,'episodes.json'),file('source/episodes.json'));fs.copyFileSync(diagramFile,file('source/diagram-labels.json'));fs.copyFileSync(fileURLToPath(import.meta.url),file('source/produce.mjs'));
 json('sources.json',{creator:'ぷい',officialSpelling:'ぷぃ',identity:'Project P',checkedDate:'2026-10-24',urls:['https://pui-wobbfet.top/','https://pui-wobbfet.top/about/','https://pui-wobbfet.top/contact/'],assets:[{file:'media/logo-original.png',url:'https://pui-wobbfet.top/images/logo_p.png?v=20260121',sha256:hash(file('media/logo-original.png'))},{file:'media/icon-original.png',url:'https://pui-wobbfet.top/images/logos/icon-512.png',sha256:hash(file('media/icon-original.png'))}],audio:'Original procedural instrumental music: no third-party songs, samples, or cloned voices.',visuals:'Native vector illustrations, labelled イメージ図; no fabricated client screenshots or measured business outcomes.'});
 console.log('staged sources');
}else console.log('Modes: stage | prepare [ids] | render [ids] | run [ids] | frames [ids]');
}
