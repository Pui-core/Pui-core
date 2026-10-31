import fs from'node:fs';import{srcRoot as src,caseRoot as out,lampFrame,fps,captionOut}from'./v06-config.mjs';import{native,save,hash}from'./background.mjs';
// RC-156-02: 結果字幕「最初の灯が、点いた。」を点灯frame(523=17.4333s)以後へ移す。点灯前の副行は外し、
// スイッチ副行は結果字幕の終端(18.9s)から開始。映像素材/尺/他layer/cue08以降は変更しない。
fs.mkdirSync(out+'/projects',{recursive:true});fs.mkdirSync(out+'/qa',{recursive:true});
const f=n=>n/fps,lampT=f(lampFrame),endT=captionOut,shiftLight=lampFrame-453,shiftSwitch=567-543;
const jsx=out+'/projects/v06-lamp-sync.jsx';
fs.writeFileSync(jsx,`function r(i,p){return app.run(i,p||{});}
app.beginUndoGroup('156 v06 align result caption to lamp-on frame');
var comp=app.project.activeItem,light=comp.layer('Detail light').index,sw=comp.layer('Detail switch').index;
function mv(l,p,a,b){r('keys.set',{layer:l,path:p,time:a/${fps},newTime:b/${fps},timeBase:'comp'});}
// 後ろのkeyから移動(衝突回避)。light: 15.1s(453f)=entry開始 → 点灯frame。 switch: 18.1s(543f) → 結果字幕の終端。
mv(light,'transform/position',457,457+${shiftLight});mv(light,'transform/position',453,453+${shiftLight});
mv(light,'transform/opacity',455,455+${shiftLight});mv(light,'transform/opacity',453,453+${shiftLight});
r('layer.timing',{layers:[light],in:${lampT},out:${endT}});
mv(sw,'transform/position',547,547+${shiftSwitch});mv(sw,'transform/position',543,543+${shiftSwitch});
mv(sw,'transform/opacity',545,545+${shiftSwitch});mv(sw,'transform/opacity',543,543+${shiftSwitch});
r('layer.timing',{layers:[sw],in:${endT},out:21});
app.endUndoGroup();
writeLn(JSON.stringify({light:[comp.layer('Detail light').inPoint,comp.layer('Detail light').outPoint],sw:[comp.layer('Detail switch').inPoint,comp.layer('Detail switch').outPoint]}));
`);
const ec=out+'/projects/intro65-v06.ecproj';
if(fs.existsSync(ec))throw Error('Preserve existing v06 project');
await native('effectcraft',['--project',src+'/projects/intro65-v05.ecproj','script',jsx,'--save-as',ec,'--json'],out+'/qa/ec-v06-save.json');
await native('effectcraft',['--project',ec,'info','--json'],out+'/qa/ec-v06-reopen.json');
const times=[15.5,17.3,17.4,lampT,17.5,17.7,18.5,18.85,19.0,19.5,20.9];
for(const t of times){const tag=String(Math.round(t*1000)/1000).replace('.','_');await native('effectcraft',['--project',ec,'render-frame','--comp','156 EMBERWAKE intro65','--time',String(t),'--out',out+'/qa/native-v06-'+tag+'.png','--json'],out+'/qa/native-v06-'+tag+'.json');}
save(out+'/qa/layout-repair-v06-binding.json',{issue:156,task:'RC-156-02',fromProject:src+'/projects/intro65-v05.ecproj',fromSha256:hash(src+'/projects/intro65-v05.ecproj'),ec,sha256:hash(ec),lampOnFrame:lampFrame,lampOnSeconds:lampT,caption:{text:'最初の灯が、点いた。',inSeconds:lampT,outSeconds:endT,preLampSubline:'removed (head 近づいて、点ける。 kept)'},switchSubline:{inSeconds:endT,outSeconds:21,text:'スイッチの前後を、実画面で。'},unchanged:['game footage','duration 65s/1950f','cue08 start 19.8886s','all other layers'],renderedFrames:times,rootVisualAcceptance:'pending',subjectiveListen:false});
console.log(JSON.stringify({ready:true,ec,lampT,endT}));
