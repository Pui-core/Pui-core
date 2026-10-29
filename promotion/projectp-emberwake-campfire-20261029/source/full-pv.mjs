import fs from'node:fs';import{stage,native,hash,save}from'./background.mjs';
const root=stage+'/pv-v01',D=60,project=root+'/projects/pv60-v02.ecproj';
if(fs.existsSync(project))throw Error('Existing60s project; preserve before revision');
const assets=JSON.parse(fs.readFileSync(root+'/source-assets-full-clean.json'));
const paths=[...assets.assets.map(a=>a.file),root+'/media/wordmark.png',root+'/media/opening-v02.mov'];
const shots=[
 {id:'Carry in motion',asset:'stone-flight',a:15.2,b:18.4,from:0,anchorA:[960,700],anchorB:[960,650],scaleA:250,scaleB:225,copy:'どこへ、運ぶ？'},
 {id:'Choose your foothold',asset:'wind-ascent',a:18.4,b:21.6,from:0,anchorA:[960,730],anchorB:[960,680],scaleA:225,scaleB:250,copy:'足場を選び。'},
 {id:'Aqueduct climb',asset:'aqueduct-run',a:21.6,b:24.8,from:0,anchorA:[960,730],anchorB:[960,710],scaleA:255,scaleB:230,copy:'上へ、進む。'},
 {id:'Wind timing',asset:'wind-transfer',a:24.8,b:28,from:0,anchorA:[960,720],anchorB:[960,660],scaleA:220,scaleB:245,copy:'一瞬の、判断。'},
 {id:'Stone and body together',asset:'stone-flight',a:28,b:31.2,from:1,rate:.5,anchorA:[960,680],anchorB:[960,650],scaleA:300,scaleB:275,copy:'灯を、離さず。',slow:true},
 {id:'Moonward reprise',asset:'moon-run',a:31.2,b:34.4,from:0,anchorA:[390,740],anchorB:[965,700],scaleA:220,scaleB:235,copy:''},
 {id:'Aqueduct close detail',asset:'aqueduct-run',a:34.4,b:37.6,from:.03,anchorA:[960,730],anchorB:[960,710],scaleA:300,scaleB:265,copy:'まだ、制作中。'},
 {id:'Wind and light',asset:'wind-ascent',a:37.6,b:40.8,from:.03,anchorA:[960,720],anchorB:[960,675],scaleA:245,scaleB:215,copy:'この世界の、続きを。'},
 {id:'Support main-game creation',asset:'stone-flight',a:40.8,b:44,from:.03,anchorA:[960,690],anchorB:[960,650],scaleA:245,scaleB:220,copy:'本編制作を、応援する。'},
 {id:'Cut rhythm one',asset:'jump-city',a:44,b:45.6,from:1.35,anchorA:[770,675],anchorB:[950,690],scaleA:280,scaleB:235,copy:''},
 {id:'Cut rhythm two',asset:'wind-transfer',a:45.6,b:47.2,from:1,anchorA:[960,700],anchorB:[960,680],scaleA:260,scaleB:230,copy:''},
 {id:'Cut rhythm three',asset:'core-floor',a:47.2,b:48,from:0,anchorA:[265,300],anchorB:[265,285],scaleA:590,scaleB:550,copy:''},
 {id:'Cut rhythm four',asset:'wind-leap',a:48,b:48.8,from:.3,anchorA:[980,675],anchorB:[990,700],scaleA:270,scaleB:245,copy:''},
 {id:'Game identity',asset:'moon-run',a:48.8,b:52,from:0,anchorA:[390,735],anchorB:[960,700],scaleA:230,scaleB:210,logo:true,copy:''},
 {id:'Campaign starts',asset:'wind-transfer',a:52,b:54.4,from:.3,anchorA:[960,700],anchorB:[960,680],scaleA:240,scaleB:220,copy:'クラファン開始',sub:'物語・演出・検証など 本編制作へ'},
 {id:'Support destination first',asset:'stone-flight',a:54.4,b:57.6,from:.03,anchorA:[960,680],anchorB:[960,650],scaleA:230,scaleB:215,cta:true,copy:''},
 {id:'Support destination final',asset:'wind-transfer',a:57.6,b:60,from:.3,anchorA:[960,700],anchorB:[960,680],scaleA:230,scaleB:210,cta:true,copy:''}
];
// The opening Native master is retained; every later scene has a distinct framing/meaning.
const jsx=[fs.readFileSync(root+'/opening-v02.jsx','utf8').split('\n')[0].replace('var D=15.2;','var D=60;')];
jsx.push(`var paths=${JSON.stringify(paths)},items=r('file.import',{paths:paths,sequence:false}).items;var comp=r('comp.new',{name:'151 CAMPFIRE vertical60',width:1080,height:1920,frameRate:30,duration:D,background:'#090d13'}).comp;r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});var intro=r('layer.addItem',{item:items[${paths.length-1}],time:0,duration:15.2}).layer;s(intro,'transform/anchor',[540,960,0]);s(intro,'transform/position',[540,960,0]);span(intro,0,15.2);`);
for(const sh of shots){if(sh.asset==='wind-transfer'){sh.anchorA=[960,820];sh.anchorB=[960,800];}const index=assets.assets.findIndex(a=>a.id===sh.asset),a=assets.assets[index],rate=sh.rate||1,end=Math.min(a.duration-1/30,sh.from+(sh.b-sh.a)*rate),aa=[sh.anchorA[0]-(a.crop?.[0]||0),sh.anchorA[1]-(a.crop?.[1]||0)],ab=[sh.anchorB[0]-(a.crop?.[0]||0),sh.anchorB[1]-(a.crop?.[1]||0)];
  jsx.push(`var v=r('layer.addItem',{item:items[${index}],time:${sh.a},duration:${sh.b-sh.a}}).layer;r('layer.rename',{layer:v,name:${JSON.stringify(sh.id)}});span(v,${sh.a},${sh.b});s(v,'transform/position',[540,${sh.asset==='core-floor'?880:960},0]);k(v,'transform/anchor',${sh.a},${JSON.stringify([...aa,0])});k(v,'transform/anchor',${sh.b},${JSON.stringify([...ab,0])});k(v,'transform/scale',${sh.a},[${sh.scaleA},${sh.scaleA},100]);k(v,'transform/scale',${sh.a+.133333},[${sh.scaleB},${sh.scaleB},100]);k(v,'transform/scale',${sh.b},[${sh.scaleB-3},${sh.scaleB-3},100]);r('layer.enableTimeRemap',{layers:[v],value:true});r('keys.selectAll',{});var remaps=r('keys.info',{}).filter(function(q){return q.layer===v&&q.path==='timeRemap';});r('keys.deselectAll',{});r('keys.select',{keys:remaps.map(function(q){return{layer:v,prop:'timeRemap',time:q.compTime};}),timeBase:'comp'});r('keys.delete',{});k(v,'timeRemap',${sh.a},${sh.from});k(v,'timeRemap',${sh.b},${end});`);
  jsx.push(`var w=rect(${JSON.stringify(sh.id+' impact')},1080,1920,540,960,'#d39453',${sh.a},${sh.a+.1},10);k(w,'transform/opacity',${sh.a},10);k(w,'transform/opacity',${sh.a+.1},0);rect(${JSON.stringify(sh.id+' copy field')},1080,485,540,1710,'#090d13',${sh.a},${sh.b},88);`);
  if(sh.copy)jsx.push(`txt(${JSON.stringify(sh.id+' copy')},${JSON.stringify(sh.copy)},540,1555,${sh.copy.length>12?72:90},'#f6dfb5',${sh.a+.1},${sh.b});`);
  if(sh.sub)jsx.push(`txt(${JSON.stringify(sh.id+' detail')},${JSON.stringify(sh.sub)},540,1660,35,'#d8aa70',${sh.a+.3},${sh.b});`);
  if(sh.slow)jsx.push(`txt('Slow-motion label','スロー',895,255,26,'#c3c2bb',${sh.a},${sh.b});`);
  if(sh.logo)jsx.push(`var logo=r('layer.addItem',{item:items[${assets.assets.length}],time:${sh.a},duration:${sh.b-sh.a}}).layer;s(logo,'transform/anchor',[500,115,0]);s(logo,'transform/position',[540,1540,0]);span(logo,${sh.a},${sh.b});k(logo,'transform/scale',${sh.a},[94,94,100]);k(logo,'transform/scale',${sh.a+.166667},[86,86,100]);`);
}
jsx.push(`txt('Development notice','開発中',540,142,27,'#c3c2bb',15.2,D);txt('Music attribution','Music: Cipher / Kevin MacLeod / CC BY 4.0',540,1818,22,'#a7a29a',15.2,D);rect('Destination darkfield',1080,675,540,1570,'#090d13',54.4,D,93);txt('Destination service','CAMPFIREで',540,1355,66,'#e0a767',54.4,D);txt('Destination search','EMBERWAKE を検索',540,1470,72,'#f6dfb5',54.533333,D);txt('Support action','詳しくは支援ページ',540,1580,43,'#f6dfb5',54.666667,D);txt('Campaign goal and date','目標50万円 / 2026.12.23まで',540,1675,35,'#d8aa70',54.8,D);txt('Canonical address','camp-fire.jp/projects/993744/view',540,1740,29,'#bcb8ae',54.933333,D);txt('Final music attribution','Music: Cipher / Kevin MacLeod / CC BY 4.0',540,1818,22,'#a7a29a',54.4,D);app.endUndoGroup();writeLn(JSON.stringify({duration:60,originalGameAudio:false,narration:false,model:false,gameGenerated:false}));`);
const script=root+'/pv60-v02.jsx';fs.writeFileSync(script,jsx.join('\n'));
await native('effectcraft',['--empty','script',script,'--save-as',project,'--json'],root+'/qa/ec-pv60-save.json');
await native('effectcraft',['--project',project,'info','--json'],root+'/qa/ec-pv60-reopen.json');
for(const t of [16.4,19.4,22.5,26,29,32,35,39,42,47.5,50,53,55.5,59])await native('effectcraft',['--project',project,'render-frame','--comp','151 CAMPFIRE vertical60','--time',String(t),'--out',root+'/qa/pv60-'+t+'.png','--json'],root+'/qa/ec-pv60-frame-'+t+'.json');
save(root+'/pv60-shots.json',shots);save(root+'/qa/pv60-native-layout.json',{issue:151,duration:D,project,sha256:hash(project),shots,originalOpeningMovieSha256:hash(root+'/media/opening-v02.mov'),gameGenerated:false,narration:false,model:false,framesReady:true,wholePictureRendered:false});console.log(JSON.stringify({layoutReady:true,project,duration:D}));
