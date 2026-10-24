import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(process.env.OSAYU_BINGO_ROOT || '/home/pui/Videos/Osayu-Bingo/2026-10-24');
const EC = '/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
const FC = '/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const FF = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const FP = fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
const duration = 22;
const file = p => path.join(root, p);
for (const d of ['media', 'source', 'projects', 'videos', 'qa', 'checkpoints']) fs.mkdirSync(file(d), {recursive:true});
export const nativePath = p => spawnSync('wslpath', ['-w', p], {encoding:'utf8'}).stdout.trim();
const save = (p, v) => fs.writeFileSync(file(p), JSON.stringify(v, null, 2) + '\n');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function call(exe, args, receipt, input) {
  const r = spawnSync(exe, args, {encoding:'utf8', input, timeout:120000, maxBuffer:16*1024*1024});
  const v = {exit:r.status, error:r.error?.message, stdout:r.stdout?.replace(/^\uFEFF/, ''), stderr:r.stderr};
  if (receipt) save(receipt, v);
  if (r.error || r.status) throw Error(JSON.stringify({exe, args, ...v}).slice(0,5000));
  return v.stdout.trim();
}
async function run(exe, args, receipt) {
  const start=Date.now();
  return new Promise((resolve,reject) => {
    const p=spawn(exe,args,{stdio:['ignore','pipe','pipe']}); let stdout='',stderr='';
    p.stdout.on('data',d=>stdout+=d); p.stderr.on('data',d=>stderr+=d);
    p.on('error',reject); p.on('close',exit=>{const r={exit,seconds:(Date.now()-start)/1000,stdout,stderr};save(receipt,r);if(exit)reject(Error(JSON.stringify(r).slice(-5000)));else resolve(stdout);});
  });
}

export function composition() {
return `app.newProject();app.beginUndoGroup('Osayu first bingo');
var boxes=[],D=22,ink='#F5FBFF',mint='#A8F3E0',pink='#FFB6DF',muted='#B2BDCF',panel='#182936';
function run(id,p){return app.run(id,p||{});}function set(l,p,v){run('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){run('prop.addKey',{layer:l,path:p,time:t,timeBase:'comp',value:v});}
function timing(l,a,b){run('layer.timing',{layers:[l],in:a,out:b});}
var comp=run('comp.new',{name:'Osayu Bingo',width:1080,height:1920,frameRate:30,duration:D,background:'#10131F'}).comp;
run('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
var imported=run('file.import',{paths:${JSON.stringify([nativePath(file('media/character-cutout.png')),nativePath(file('media/stage-background.png'))])},sequence:false});
if(imported.errors.length)throw Error(JSON.stringify(imported.errors));
function shape(name,w,h,x,y,c,a,b,op,kind,stroke){var l=run('layer.newShape',{name:name,kind:kind||'rounded',size:[w,h],position:[x,y],fill:c,stroke:stroke||c,strokeWidth:stroke?2:0}).layer;timing(l,a,b);if(op!==undefined)set(l,'transform/opacity',op);return l;}
function pic(name,item,x,y,s,a,b,op){var l=run('layer.addItem',{item:item,time:a,duration:b-a}).layer;run('layer.rename',{layer:l,name:name});set(l,'transform/position',[x,y]);set(l,'transform/scale',[s,s]);timing(l,a,b);if(op!==undefined)set(l,'transform/opacity',op);return l;}
function txt(name,text,x,y,size,c,a,b,align,limit,animate){
 var l=run('layer.newText',{name:name,text:text,position:[x,y],font:'Meiryo',style:'Bold',size:size,fill:c,justify:align||'left',tracking:0}).layer;
 var obj=app.project.activeItem.layer(name),r=obj.sourceRectAtTime(a,false);
 if(r.width>(limit||790)){size=Math.floor(size*(limit||790)/r.width);run('layer.setText',{layer:l,size:size});r=obj.sourceRectAtTime(a,false);}
 timing(l,a,b);boxes.push({name:name,text:text,x:x+r.left,y:y+r.top,width:r.width,height:r.height,size:size,start:a,end:b});
 if(animate){key(l,'transform/position',a,[x,y+18]);key(l,'transform/position',a+.22,[x,y]);key(l,'transform/opacity',a,0);key(l,'transform/opacity',a+.14,100);}
 return l;
}
function rule(name,w,x,y,c,a,b){return shape(name,w,3,x,y,c,a,b,75,'rect');}
function tag(name,text,x,y,w,a,b,c){shape(name+' pill',w,58,x,y,panel,a,b,100,'rounded',c||mint);return txt(name,text,x,y+10,25,c||mint,a,b,'center',w-26,false);}
function floatChar(name,x,y,s,a,b){var l=pic(name,imported.items[0],x,y,s,a,b);key(l,'transform/position',a,[x+10,y+14]);key(l,'transform/position',a+.45,[x,y]);key(l,'transform/position',b,[x-5,y-10]);key(l,'transform/scale',a,[s*1.025,s*1.025]);key(l,'transform/scale',a+.5,[s,s]);return l;}
// Image-generated background is a quiet texture, not a source of textual content.
var bg=pic('Mint glass stage',imported.items[1],540,960,126,0,D,100);key(bg,'transform/scale',0,[126,126]);key(bg,'transform/scale',22,[132,132]);
shape('Dark readable wash',1080,1920,540,960,'#0B1020',0,D,41,'rect');
for(var z=0;z<7;z++){var d=shape('Mint glint '+z,4+(z%3)*2,4+(z%3)*2,90+z*137,340+(z%4)*365,mint,0,D,35,'ellipse');key(d,'transform/position',0,[90+z*137,340+(z%4)*365]);key(d,'transform/position',D,[120+z*133,310+(z%4)*365]);}
// Persistent identity, within the TikTok safe area.
shape('Identity dot',10,10,107,239,mint,0,D,100,'ellipse');
txt('Identity','OSAYU  /  音桜夢',129,250,26,ink,0,D,'left',710,false);
rule('Top fine line',780,490,282,'#577C81',0,D);

// 00:00—00:03: reward first, immediately visible typography and a close character shot.
floatChar('Hook close character',555,1950,135,0,3);
tag('First challenge','はじめてのビンゴ',272,340,344,0,3,mint);
txt('Hook first line','一列そろったら、',100,482,65,ink,0,3,'left',790,false);
txt('Hook reward','好きなセリフ、',100,596,88,ink,0,3,'left',790,false);
txt('Hook payoff','言います。',96,727,108,mint,0,3,'left',790,false);
tag('Hook foot','11/24  22:00  START',490,1452,780,0,3,mint);

// 00:03—00:07: identity and a simple invitation.
floatChar('Introduction character',382,1340,91,3,7);
txt('Introduction eyebrow','おさゆ、',100,422,59,mint,3,7,'left',780,true);
txt('Introduction headline','ビンゴ初挑戦。',100,532,87,ink,3.12,7,'left',790,true);
shape('Intro side panel',350,390,710,975,panel,3,7,96,'rounded','#426966');
txt('Intro caption 1','初見さんも、',710,890,39,ink,3.3,7,'center',318,true);
txt('Intro caption 2','一緒に。',710,962,57,mint,3.45,7,'center',318,true);
txt('Intro caption 3','ひと言から',710,1052,32,muted,3.6,7,'center',318,true);
txt('Intro caption 4','参加できるよ',710,1103,32,muted,3.7,7,'center',318,true);
tag('Introduction subtitle','はじめての一列、みんなと作りたい。',490,1452,780,3,7,mint);

// 00:07—00:12: free greeting and first-visit goals; no fictitious progress counters.
txt('Easy entry headline','あなたのひと言が、',100,428,62,ink,7,12,'left',790,true);
txt('Easy entry payoff','ひとマスの力に。',100,522,69,mint,7.15,12,'left',790,true);
var xs=[292,698],labs=['初見さん','おはさゆ'],nums=['20人','20回'];
for(var i=0;i<2;i++){
 var x=xs[i];shape('Entry card '+i,374,380,x,899,panel,7,12,98,'rounded',i?pink:mint);
 txt('Entry number '+i,('0'+(i+1)).slice(-2),x-145,790,22,muted,7.15+i*.18,12,'left',300,false);
 txt('Entry label '+i,labs[i],x,866,44,ink,7.2+i*.18,12,'center',330,true);
 txt('Entry goal '+i,nums[i],x,985,80,i?pink:mint,7.35+i*.18,12,'center',330,true);
 txt('Entry goal label '+i,'みんなで目指す目標',x,1049,23,muted,7.5+i*.18,12,'center',330,false);
}
txt('Greeting instruction','配信で「おはさゆ」って',490,1220,42,ink,7.5,12,'center',780,true);
txt('Greeting invitation','声をかけてね。',490,1292,46,pink,7.7,12,'center',780,true);
tag('Entry friendly','はじめまして、大歓迎。',490,1452,780,7,12,mint);

// 00:12—00:17: faithful transcription of the published 3×3 board.
txt('Board title','みんなで、ビンゴ。',100,420,70,ink,12,17,'left',790,true);
txt('Board descriptor','音桜夢のビンゴ企画  /  9つの目標',100,483,27,muted,12,17,'left',790,false);
var labels=['初見さん','いいね','シェア','ギフト','ミンカベア','フォロー','ハートミー','おはさゆ','同事務所凸'];
var amounts=['20人','100K','10回','20個','1個','10人','15個','20回','5人'];
for(var j=0;j<9;j++){
 var col=j%3,row=Math.floor(j/3),xx=228+col*263,yy=675+row*224,ac=j===0||j===7?mint:'#7895AA';
 shape('Bingo cell '+j,246,208,xx,yy,panel,12,17,98,'rounded',ac);
 txt('Bingo label '+j,labels[j],xx,yy-26,31,ink,12,17,'center',220,false);
 txt('Bingo amount '+j,amounts[j],xx,yy+43,53,j===0||j===7?mint:pink,12,17,'center',220,false);
 if(j===3)txt('Any gift','なんでもOK',xx,yy+81,20,muted,12,17,'center',220,false);
}
rule('Reward divider',780,490,1321,'#577C81',12,17);
txt('Line reward','一列ごとに  →  リクエストセリフ',100,1397,34,mint,12,17,'left',790,false);
txt('Complete reward','全マス達成  →  歌ってみたのサビを後日投稿',100,1464,29,pink,12,17,'left',790,false);

// 00:17—00:22: date confirmed by owner; only one destination.
floatChar('Final portrait',650,1940,100,17,D);
shape('Final title backdrop',900,745,490,728,'#111E2B',17,D,93,'rounded');
tag('Final event tag','おさゆの初ビンゴ',310,365,420,17,D,mint);
txt('Final title 1','初めての一列、',100,512,72,ink,17,22,'left',790,true);
txt('Final title 2','一緒につくって。',100,617,75,mint,17.15,22,'left',790,true);
rule('Date divider',780,490,684,'#577C81',17,22);
txt('Final date','11/24',100,820,112,ink,17.3,22,'left',400,true);
txt('Final time','22:00',570,812,86,pink,17.4,22,'left',310,true);
txt('Final date detail','TikTok LIVE',100,886,31,muted,17.5,22,'left',790,false);
shape('Destination button',780,98,490,1000,mint,17,22,100,'rounded');
txt('Destination','プロフィールから、配信へ。',490,1016,39,'#142531',17.7,22,'center',740,true);
tag('Final identity','@oosayuuu2525',490,1452,780,17,22,mint);

// A quiet five-part timeline supports pacing without distracting from the character.
var starts=[0,3,7,12,17],ends=[3,7,12,17,22];
for(var q=0;q<5;q++){shape('Progress base '+q,145,4,175+q*158,1555,'#354352',0,D,80,'rect');var bar=shape('Progress current '+q,145,4,175+q*158,1555,mint,starts[q],D,100,'rect');key(bar,'transform/scale',starts[q],[0,100]);key(bar,'transform/scale',ends[q],[100,100]);}
app.endUndoGroup();writeLn(JSON.stringify({comp:comp,boxes:boxes,duration:D,sourcePost:'7699907163560447233',dateConfirmedByOwner:true}));`;
}

function prepare() {
  const project=file('projects/osayu-bingo.ecproj');
  if(fs.existsSync(project))fs.copyFileSync(project,file('checkpoints/osayu-bingo-'+Date.now()+'.ecproj'));
  fs.writeFileSync(file('source/osayu-bingo.jsx'),composition());
  const built=JSON.parse(call(EC,['--empty','script',nativePath(file('source/osayu-bingo.jsx')),'--save-as',nativePath(project),'--json'],'qa/build.json'));
  if(!built.ok)throw Error(JSON.stringify(built));
  const report=JSON.parse(built.output); save('qa/text-layout.json',report);
  const errors=report.boxes.filter(b=>b.size<20||b.x<94||b.x+b.width>897||b.y<210||b.y+b.height>1530);
  if(errors.length)throw Error('Unsafe text layout: '+JSON.stringify(errors));
  save('qa/checkpoint.json',{saved:true,sha256:hash(project),sourceSha256:hash(file('source/osayu-bingo.jsx'))});
  console.log('Saved native project and measured '+report.boxes.length+' text layers.');
}
async function render() {
  const ec=file('projects/osayu-bingo.ecproj'),fc=file('projects/osayu-bingo.fcproj'),master=file('media/picture-master.mp4');
  if(!fs.existsSync(ec))throw Error('Run prepare first.');
  await run(EC,['render','--project',nativePath(ec),'--comp','Osayu Bingo','--out',nativePath(master),'--format','h264','--bitrate','14000','--audio','off','--progress','--json'],'qa/effectcraft-render.json');
  const music=file('media/normalized.wav');if(!fs.existsSync(music))throw Error('Audio missing: '+music);
  const commands=[{id:'file.newProject',params:{name:'Osayu / first bingo'}},{id:'file.newSequence',params:{name:'Osayu Bingo',width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[nativePath(master),nativePath(music)]}}];
  const init=call(FC,['--save-as',nativePath(fc),'run','-'],'qa/filmcraft-build.json',commands.map(v=>JSON.stringify(v)).join('\n')+'\n');
  let items;for(const l of init.split(/\r?\n/).filter(Boolean)){const j=JSON.parse(l),r=j.result||j;if(r.items)items=r.items;}
  if(items?.length!==2)throw Error('Imported native IDs unavailable.');
  const clips=[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:duration*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:duration*254016000000,video:false,audio:true}}];
  call(FC,['--project',nativePath(fc),'--save','run','-'],'qa/filmcraft-timeline.json',clips.map(v=>JSON.stringify(v)).join('\n')+'\n');
  const output=file('videos/osayu-bingo-1124.mp4');
  const result=JSON.parse(await run(FC,['--project',nativePath(fc),'exec','file.exportMedia',JSON.stringify({path:nativePath(output),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:18,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'qa/filmcraft-export.json'));
  if(result.offlineMedia?.length)throw Error('Offline media: '+JSON.stringify(result.offlineMedia));
  save('qa/rendered.json',{sha256:hash(output),bytes:fs.statSync(output).size,projectHashes:{effectcraft:hash(ec),filmcraft:hash(fc)},duration,fps:30});
  console.log('Exported '+output);
}
async function previews() {
  for(const [name,time]of [['01-hook',.7],['02-character',4.6],['03-participate',9],['04-board',14.5],['05-date',19.5]]){
    await run(EC,['render-frame','--project',nativePath(file('projects/osayu-bingo.ecproj')),'--comp','Osayu Bingo','--time',String(time),'--out',nativePath(file('qa/'+name+'.png')),'--json'],'qa/'+name+'.json');
  }
}
async function verify() {
  const output=file('videos/osayu-bingo-1124.mp4');
  const probe=JSON.parse(call(FP,['-v','error','-show_streams','-show_format','-of','json',nativePath(output)],'qa/probe-command.json'));save('qa/ffprobe.json',probe);
  const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||!a||Math.abs(Number(probe.format.duration)-22)>.1)throw Error('Invalid output media.');
  await run(FF,['-v','error','-i',nativePath(output),'-f','null','-'],'qa/full-decode.json');
  await run(FF,['-hide_banner','-i',nativePath(output),'-af','ebur128=peak=true','-f','null','-'],'qa/audio-ebur128.json');
  await run(FF,['-v','error','-y','-i',nativePath(output),'-vf',"select='eq(n,21)+eq(n,138)+eq(n,270)+eq(n,435)+eq(n,585)',scale=324:576,tile=5x1",'-frames:v','1',nativePath(file('qa/final-contact-sheet.png'))],'qa/final-contact-sheet.json');
  await run(FF,['-v','error','-y','-ss','0.7','-i',nativePath(output),'-frames:v','1',nativePath(file('cover.png'))],'qa/cover.json');
  const check=JSON.parse(call(EC,['--project',nativePath(file('projects/osayu-bingo.ecproj')),'info','--json'],'qa/effectcraft-reopen.json'));
  const film=JSON.parse(call(FC,['--project',nativePath(file('projects/osayu-bingo.fcproj')),'inspect'],'qa/filmcraft-reopen.json'));
  save('qa/technical.json',{status:'TECHNICAL_PASS',visualReview:'PENDING',listening:'PENDING',fullDecode:true,effectcraftReopened:!!check,filmcraftReopened:!!film,sha256:hash(output)});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const mode=process.argv[2];
  if(mode==='prepare')prepare();else if(mode==='previews')await previews();else if(mode==='render')await render();else if(mode==='verify')await verify();else console.log('node produce.mjs prepare|previews|render|verify');
}
