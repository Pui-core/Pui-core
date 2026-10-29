import fs from 'node:fs';
import path from 'node:path';
import {stage,native,ff,hash,save} from './background.mjs';

const mode=process.argv[2]||'preview';
const version=process.argv[3]||'v02';if(!/^v[0-9]{2}$/.test(version))throw Error('Version');
if(!['preview','full'].includes(mode))throw Error('Mode preview|full');
const vertical=stage+'/pv-v01',root=stage+'/landscape-v01';
for(const p of ['media','projects','qa','videos','covers'])fs.mkdirSync(root+'/'+p,{recursive:true});
const assets=JSON.parse(fs.readFileSync(vertical+'/source-assets-full-clean.json'));
for(const a of assets.assets){const target=root+'/media/'+path.basename(a.file);if(!fs.existsSync(target))fs.copyFileSync(a.file,target);if(hash(target)!==a.sha256)throw Error('Copied game asset differs');a.file=target;}
const coreOriginal=vertical+'/private/core-closing/natural-silent.mov',core=root+'/media/natural-silent.mov';
if(!fs.existsSync(core))fs.copyFileSync(coreOriginal,core);
if(hash(core)!=='21fdd74aa90391da2e40dc9310a21c11875b77b02f349c575a2c90c8e40d4af1')throw Error('Wrong silent Core');
for(const file of ['pv-music-60.wav','Cipher.mp3']){const target=root+'/media/'+file;if(!fs.existsSync(target))fs.copyFileSync(vertical+'/media/'+file,target);if(hash(target)!==hash(vertical+'/media/'+file))throw Error('Music copy differs');}
const pc=root+'/projects/wordmark.pcraft',wordmark=root+'/media/wordmark.png';
if(!fs.existsSync(pc))fs.copyFileSync(vertical+'/projects/wordmark.pcraft',pc);
if(!fs.existsSync(wordmark)){await native('photocraft',['info',pc,'--compact'],root+'/qa/pc-wordmark-reopen.json');await native('photocraft',['convert',pc,wordmark,'--format','png'],root+'/qa/pc-wordmark-export.json');}
const all=[...JSON.parse(fs.readFileSync(vertical+'/opening-shots.json')),...JSON.parse(fs.readFileSync(vertical+'/pv60-shots.json'))];
const sourceShots=mode==='preview'?all.filter(s=>s.b<=4||s.a>=54.4):all;
const duration=mode==='preview'?9.6:60;
const shots=sourceShots.map(s=>({...s,globalA:s.a,globalB:s.b,a:mode==='preview'&&s.a>=54.4?s.a-50.4:s.a,b:mode==='preview'&&s.a>=54.4?s.b-50.4:s.b}));
const project=root+'/projects/'+mode+'-'+version+'.ecproj';
if(fs.existsSync(project))throw Error('Preserve existing landscape project');
const jsx=[fs.readFileSync(vertical+'/opening-v02.jsx','utf8').split('\n')[0].replace('var D=15.2;',`var D=${duration};`).replaceAll('900','1700')];
const paths=[...assets.assets.map(a=>a.file),wordmark,core];
const compName='151 CAMPFIRE landscape '+mode;
jsx.push(`var paths=${JSON.stringify(paths)},items=r('file.import',{paths:paths,sequence:false}).items;var comp=r('comp.new',{name:${JSON.stringify(compName)},width:1920,height:1080,frameRate:30,duration:D,background:'#090d13'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});`);
function remap(layer,a,b,from,to){return `r('layer.enableTimeRemap',{layers:[${layer}],value:true});r('keys.selectAll',{});var kk=r('keys.info',{}).filter(function(q){return q.layer===${layer}&&q.path==='timeRemap';});r('keys.deselectAll',{});r('keys.select',{keys:kk.map(function(q){return{layer:${layer},prop:'timeRemap',time:q.compTime};}),timeBase:'comp'});r('keys.delete',{});k(${layer},'timeRemap',${a},${from});k(${layer},'timeRemap',${b},${to});`;}
for(const sh of shots){const i=assets.assets.findIndex(a=>a.id===sh.asset),a=assets.assets[i],aa=[sh.anchorA[0]-(a.crop?.[0]||0),sh.anchorA[1]-(a.crop?.[1]||0)],ab=[sh.anchorB[0]-(a.crop?.[0]||0),sh.anchorB[1]-(a.crop?.[1]||0)],isCore=sh.asset==='core-floor',cta=sh.globalA>=54.4,scaleA=isCore?430:Math.max(135,Math.min(185,sh.scaleA*.64)),scaleB=isCore?405:Math.max(130,Math.min(175,sh.scaleB*.64)),end=Math.min(a.duration-1/30,sh.from+(sh.b-sh.a)*(sh.rate||1));
  jsx.push(`var v=r('layer.addItem',{item:items[${i}],time:${sh.a},duration:${sh.b-sh.a}}).layer;r('layer.rename',{layer:v,name:${JSON.stringify(sh.id)}});span(v,${sh.a},${sh.b});s(v,'transform/position',[${cta?650:960},${isCore?340:520},0]);k(v,'transform/anchor',${sh.a},${JSON.stringify([...aa,0])});k(v,'transform/anchor',${sh.b},${JSON.stringify([...ab,0])});k(v,'transform/scale',${sh.a},[${scaleA},${scaleA},100]);k(v,'transform/scale',${sh.a+.133333},[${scaleB},${scaleB},100]);k(v,'transform/scale',${sh.b},[${scaleB-3},${scaleB-3},100]);${remap('v',sh.a,sh.b,sh.from,end)}`);
  jsx.push(`var w=rect(${JSON.stringify(sh.id+' cut light')},1920,1080,960,540,'#d39453',${sh.a},${sh.a+.1},10);k(w,'transform/opacity',${sh.a},10);k(w,'transform/opacity',${sh.a+.1},0);`);
  if(!cta){jsx.push(`rect(${JSON.stringify(sh.id+' lower type field')},1920,260,960,970,'#090d13',${sh.a},${sh.b},88);`);if(sh.copy)jsx.push(`txt(${JSON.stringify(sh.id+' copy')},${JSON.stringify(sh.copy)},960,940,${sh.copy.length>12?70:86},'#f6dfb5',${sh.a+.1},${sh.b});`);if(sh.sub)jsx.push(`txt(${JSON.stringify(sh.id+' sub')},${JSON.stringify(sh.sub)},960,1020,34,'#d8aa70',${sh.a+.3},${sh.b});`);if(sh.logo)jsx.push(`var logo=r('layer.addItem',{item:items[${assets.assets.length}],time:${sh.a},duration:${sh.b-sh.a}}).layer;span(logo,${sh.a},${sh.b});s(logo,'transform/anchor',[500,115,0]);s(logo,'transform/position',[960,946,0]);s(logo,'transform/scale',[83,83,100]);`);}
  if(sh.slow)jsx.push(`txt('Slow-motion label','スロー',1740,145,28,'#c3c2bb',${sh.a},${sh.b});`);
}
const ctaIn=mode==='preview'?4:54.4,coreIn=mode==='preview'?6:56.4;
jsx.push(`rect('Top frame',1920,100,960,50,'#090d13',0,D,90);txt('Development label','開発中の実ゲーム映像',300,48,27,'#b8b8b2',0,D);txt('Small game identity','EMBERWAKE / 灰の灯',1585,48,30,'#d8aa70',0,D);rect('Support panel',850,1080,1495,540,'#090d13',${ctaIn},D,100);txt('Destination service','CAMPFIREで',1495,270,62,'#e0a767',${ctaIn},D);txt('Destination game','EMBERWAKE',1495,378,85,'#f6dfb5',${ctaIn+.1},D);txt('Destination search','を検索',1495,465,58,'#f6dfb5',${ctaIn+.2},D);txt('Support action','詳しくは支援ページ',1495,600,43,'#f6dfb5',${ctaIn+.3},D);txt('Campaign goal','目標50万円',1495,700,40,'#d8aa70',${ctaIn+.4},D);txt('Campaign closing date','2026年12月23日まで',1495,765,35,'#d8aa70',${ctaIn+.4},D);txt('Canonical URL','camp-fire.jp/projects/993744/view',1495,860,29,'#bcb8ae',${ctaIn+.5},D);txt('Music attribution','Music: Cipher / Kevin MacLeod / CC BY 4.0',960,1060,21,'#a7a29a',0,D);`);
jsx.push(`var m=r('layer.addItem',{item:items[${assets.assets.length+1}],time:${coreIn},duration:3.6}).layer;r('layer.rename',{layer:m,name:'Revenant Natural silent Core'});span(m,${coreIn},D);s(m,'transform/anchor',[300,390,0]);s(m,'transform/position',[180,825,0]);s(m,'transform/scale',[24,24,100]);${remap('m',coreIn,duration,0,3.6)}app.endUndoGroup();writeLn(JSON.stringify({duration:D,landscape:true,gameOriginalHorizontal:true,mouthAlways0:true}));`);
const script=root+'/'+mode+'-'+version+'.jsx';fs.writeFileSync(script,jsx.join('\n'));
await native('effectcraft',['--empty','script',script,'--save-as',project,'--json'],root+'/qa/ec-'+mode+'-'+version+'-save.json');
await native('effectcraft',['--project',project,'info','--json'],root+'/qa/ec-'+mode+'-reopen.json');
const frameTimes=mode==='preview'?[.4,1.9,3,4.6,6.3,7.6,9.3]:[16.4,26,35,50,58];
for(const t of frameTimes)await native('effectcraft',['--project',project,'render-frame','--comp',compName,'--time',String(t),'--out',root+'/qa/'+mode+'-'+version+'-'+t+'.png','--json'],root+'/qa/ec-'+mode+'-frame-'+t+'.json');
save(root+'/qa/'+mode+'-'+version+'-layout.json',{issue:151,mode,duration,project,sha256:hash(project),compName,shots,gameInputs:assets.assets.map(a=>({id:a.id,file:a.file,sha256:a.sha256})),independentLandscapeComposition:true,notVerticalScaleOrCrop:true,core:{global:[56.4,60],actualIn:coreIn,mouthAlways0:true,sourceFrames:108,sha256:hash(core)},sharedWindowsActions:0});
console.log(JSON.stringify({ready:true,mode,project,duration}));
