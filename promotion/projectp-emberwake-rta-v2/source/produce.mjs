import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';
import {root,EC,FC,FF,FP,np,file,hash,parse,save,run,readText}from'./native.mjs';
import {buildGameMotion,GAME_VIEWPORT}from'./motion.mjs';
export const stem=e=>e.id+'-'+e.slug;
export function composition(baseRoot,e){
 const assets=e.sources.map(s=>({...s,native:np(path.join(baseRoot,s.path))}));
 const motion=e.shots.map((sh,i)=>sh.kind==='game'?buildGameMotion(sh,e.sources[sh.source],i):null);
 return `app.newProject();app.beginUndoGroup('EMBERWAKE sixty / crowdfunding introduction');
var E=${JSON.stringify(e)},S=${JSON.stringify(assets)},M=${JSON.stringify(motion)},V=${JSON.stringify(GAME_VIEWPORT)},ledger=[],modeLedger=[],boxes=[];
function r(c,p){return app.run(c,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}
function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}
function timing(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function ease(l,p,ts){var ks=[];for(var i=0;i<ts.length;i++)ks.push({layer:l,prop:p,time:Math.round(ts[i]*30)/30});r('keys.select',{keys:ks,timeBase:'comp'});r('keys.interpolation',{interpolation:'bezier'});r('keys.velocity',{inSpeed:0,outSpeed:0,inInfluence:65,outInfluence:65,continuous:false});}
function rect(n,w,h,x,y,col,a,b,op){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:col,strokeWidth:0}).layer;timing(l,a,b);if(op!==undefined)set(l,'transform/opacity',op);return l;}
function txt(n,str,x,y,size,col,a,b,max,font){var l=r('layer.newText',{name:n,text:str,font:font||'Meiryo',style:font?'Regular':'Bold',size:size,fill:col,position:[x,y],justify:font?'left':'center'}).layer;var o=app.project.activeItem.layer(n),q=o.sourceRectAtTime(a,false);if(q.width>(max||870)){size=Math.floor(size*(max||870)/q.width);r('layer.setText',{layer:l,size:size});q=o.sourceRectAtTime(a,false);}set(l,'transform/anchor',[q.left+q.width/2,q.top+q.height/2,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);r('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});boxes.push({name:n,text:str,size:size,center:[x,y],width:q.width,height:q.height,a:a,b:b});return l;}
function item(id,n,a,b,x,y,sc,at,rate,still){var l=r('layer.addItem',{item:id,time:a,duration:b-a}).layer;r('layer.rename',{layer:l,name:n});r('layer.enableTimeRemap',{layers:[l],value:true});key(l,'timeRemap',a,at||0);key(l,'timeRemap',b,still?(at||0):(at||0)+(b-a)*(rate||1));timing(l,a,b);set(l,'transform/position',[x,y,0]);set(l,'transform/scale',[sc,sc,100]);r('layer.setSwitch',{layers:[l],switch:'audio',value:false});r('layer.setSwitch',{layers:[l],switch:'motionBlur',value:false});return l;}
var imported=[];for(var i=0;i<S.length;i++){var im=r('file.import',{paths:[S[i].native],sequence:S[i].sequence,frameRate:30});if(im.errors.length)throw Error(JSON.stringify(im.errors));imported.push(im.items[0]);}
var details=[];
for(var i=0;i<E.shots.length;i++){var sh=E.shots[i];if(sh.kind!=='game'&&sh.kind!=='mode'){details.push(null);continue;}var src=S[sh.source],d=sh.b-sh.a,comp=r('comp.new',{name:(sh.kind==='mode'?'Actual mode focus ':'Game focus ')+i,width:V.width,height:V.height,frameRate:30,duration:d,background:'#08151E'}).comp;
 if(sh.kind==='mode'){
  var fit=V.width/src.width,fill=Math.max(V.width/src.width,V.height/src.height),amb=item(imported[sh.source],'Unchanged menu atmosphere '+i,0,d,V.width/2,V.height/2,fill*100,0,1,true);set(amb,'transform/opacity',22);
  var menu=item(imported[sh.source],'Actual TIME ATTACK menu item '+i,0,d,V.width/2,V.height/2,fit*100,0,1,true);set(menu,'transform/anchor',[src.width/2,src.height/2,0]);
  var menuKeys=[{time:0,scale:fit,focus:[src.width/2,src.height/2]},{time:4/30,scale:1.32,focus:[512,658]},{time:10/30,scale:1.25,focus:[512,658]},{time:d,scale:1.25,focus:[512,658]}],menuRecords=[];
  for(var mk=0;mk<menuKeys.length;mk++){var q=menuKeys[mk],fx=q.focus[0],fy=q.focus[1];if(mk>0){fx=Math.max(V.width/(2*q.scale),Math.min(src.width-V.width/(2*q.scale),fx));fy=Math.max(V.height/(2*q.scale),Math.min(src.height-V.height/(2*q.scale),fy));}var mp=[V.width/2+(src.width/2-fx)*q.scale,V.height/2+(src.height/2-fy)*q.scale,0];key(menu,'transform/position',q.time,mp);key(menu,'transform/scale',q.time,[q.scale*100,q.scale*100,100]);menuRecords.push({time:q.time,scale:q.scale,rotation:0,focus:q.focus,clampedFocus:[fx,fy],focusTarget:{kind:'point',role:'actual-TIME-ATTACK-button',point:[512,658]},position:mp,anchor:[src.width/2,src.height/2,0]});}
  ease(menu,'transform/position',[0,4/30,10/30]);ease(menu,'transform/scale',[0,4/30,10/30]);details.push(comp);modeLedger.push({scene:i,comp:comp,layer:menu,sourceSize:[src.width,src.height],viewport:V,source:sh.source,sourceOffset:0,profile:'whole-menu-to-actual-time-attack-item',keys:menuRecords});continue;
 }
 var plan=M[i],K=plan.keys,l=item(imported[sh.source],'Source detail '+i,0,d,V.width/2,V.height/2,K[0].scale*100,sh.offset,1,false);set(l,'transform/anchor',[src.width/2,src.height/2,0]);
 for(var k=0;k<K.length;k++){var q=K[k];key(l,'transform/position',q.time,q.position);key(l,'transform/scale',q.time,[q.scale*100,q.scale*100,100]);key(l,'transform/rotation',q.time,q.rotation);}
 details.push(comp);ledger.push({scene:i,comp:comp,layer:l,sourceSize:[src.width,src.height],source:sh.source,sourceOffset:sh.offset,profile:plan.profile,viewport:plan.viewport,scaleRange:plan.scaleRange,keys:K});}
var main=r('comp.new',{name:E.compName,width:1080,height:1920,frameRate:30,duration:60,background:'#08151E',shutterAngle:120,shutterPhase:-60,motionBlurSamples:4}).comp;
r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});r('comp.setSwitch',{switch:'motionBlur',value:true});
for(var i=0;i<E.shots.length;i++){var sh=E.shots[i],a=sh.a,b=sh.b,src=sh.source===undefined?null:S[sh.source],d=b-a;
 rect('Scene field '+i,1080,1920,540,960,'#08151E',a,b);
 if(sh.kind==='game'||sh.kind==='mode'){
  var detail=r('layer.addItem',{item:details[i],time:a,duration:d}).layer;r('layer.rename',{layer:detail,name:(sh.kind==='mode'?'Directed actual mode ':'Directed game ')+i});set(detail,'transform/position',[V.mainCenter[0],V.mainCenter[1],0]);timing(detail,a,b);
 }
 if(sh.kind==='cinema'){
  var fill=Math.max(1080/src.width,1920/src.height)*100;
  var bg=item(imported[sh.source],'Concept atmosphere '+i,a,b,540,960,fill,sh.offset,sh.rate||1,false);set(bg,'transform/opacity',22);
  var base=1080/src.width*100,video=item(imported[sh.source],'Development image '+i,a,b,540,1010,base,sh.offset,sh.rate||1,false);
  key(video,'transform/scale',a,[base*1.02,base*1.02,100]);key(video,'transform/scale',b,[base*1.08,base*1.08,100]);ease(video,'transform/scale',[a,b]);
  rect('Cinema top veil '+i,1080,480,540,330,'#08151E',a,b,92);
  txt('Concept provenance '+i,'実ゲームは2D / このカットは開発イメージ',500,1510,29,'#F3E7CA',a,b,870);

 }
 if(sh.kind==='still'){
  item(imported[sh.source],'Current demo still '+i,a,b,540,965,1000/src.width*100,0,1,true);
  txt('Current demo statement','ここから、本制作へ。',500,1390,65,'#EDB468',a,b,870);
 }
 if(sh.kind==='code'){
  rect('Real code panel',950,510,515,960,'#102330',a,b);
  txt('Code label','ゲームの実装ファイルから',500,675,32,'#A8BFC1',a,b,870);
  txt('Real code excerpt',sh.code,520,930,38,'#A8E2CF',a,b,850,'Consolas');
  txt('Code source note',sh.codeSource,500,1280,27,'#A8BFC1',a,b,870);
  txt('Making note','触って、見て、また作る。',500,1435,53,'#F3E7CA',a,b,870);
 }
 if(sh.kind==='funding'){
  item(imported[sh.source],'Actual CAMPFIRE artwork',a,b,540,960,960/src.width*100,0,1,true);
  rect('Preparation field',940,130,500,1400,'#D97038',a,b);
  txt('CAMPFIRE state',E.crowdfunding.statusCopy,500,1400,50,'#08151E',a,b,870);
 }
 if(sh.kind!=='end'){
  var compact=sh.kind==='game'||sh.kind==='mode',labelY=compact?165:202,oneY=compact?240:300,twoY=compact?330:403,captionY=compact?425:492;
  txt('Source label '+i,sh.label,500,labelY,compact?25:27,'#A8BFC1',a,b,870);
  txt('Title one '+i,sh.heading[0],500,oneY,sh.heading[0]==='EMBERWAKE'?100:(compact?72:78),'#F3E7CA',a,b,870);
  var title=txt('Title two '+i,sh.heading[1],500,twoY,sh.heading[1]==='制作、本格化。'?105:(compact?80:85),'#EDB468',a,b,870);
  key(title,'transform/position',a,[500,twoY+37,0]);key(title,'transform/position',a+.13,[500,twoY-6,0]);key(title,'transform/position',a+.23,[500,twoY,0]);ease(title,'transform/position',[a,a+.13,a+.23]);
  txt('Body caption '+i,sh.caption,500,captionY,compact?33:35,'#C3D2D0',a,b,870);
 }
 if(sh.kind==='end'){
  rect('Final clean field',1080,1920,540,960,'#08151E',a,b);
  txt('Final author','ProjectP / ぷい',500,330,35,'#A8BFC1',a,b,870);
  txt('Final title','EMBERWAKE',500,430,105,'#F3E7CA',a,b,900);
  txt('Final subtitle','灰の灯',500,540,52,'#EDB468',a,b,870);
  item(imported[sh.source],'Final real game',a,b,540,825,860/src.width*100,0,1,true);
  rect('Final support plate',1080,420,540,1320,'#08151E',a,b);
  txt('Final support one','この制作を、',500,1135,60,'#F3E7CA',a+.1,b,870);
  txt('Final support two','応援してください。',500,1215,70,'#F3E7CA',a+.1,b,870);
  txt('Final campaign status','CAMPFIRE / '+E.crowdfunding.statusCopy,500,1325,32,'#EDB468',a+.18,b,870);
  txt('Final action',E.crowdfunding.actionCopy,500,1425,39,'#C3D2D0',a+.25,b,870);
 }
}
for(var i=1;i<E.shots.length;i++){var sh=E.shots[i];if(sh.transition==='whip'&&sh.kind!=='game'&&sh.kind!=='mode'){var a=sh.a,sign=i%2?1:-1,w=rect('Transition '+i,1300,2700,-1600*sign,960,'#EDB468',a-.065,a+.12);r('layer.setSwitch',{layers:[w],switch:'motionBlur',value:true});key(w,'transform/position',a-.065,[-1600*sign,960,0]);key(w,'transform/position',a+.12,[2600*sign,960,0]);}}
rect('Author plate',260,44,205,118,'#08151E',0,53,88);txt('Author bug','ぷい / 制作の記録',205,118,24,'#E8DDC6',0,53,245);
app.endUndoGroup();writeLn(JSON.stringify({comp:main,boxes:boxes,motionLedger:ledger,modeMotionLedger:modeLedger,duration:60,scenes:E.shots.length}));`;
}
export async function prepare(e){const id=stem(e),project=file('projects/'+id+'.ecproj');fs.mkdirSync(file('checkpoints'),{recursive:true});if(fs.existsSync(project))fs.copyFileSync(project,file('checkpoints/'+id+'-'+Date.now()+'.ecproj'));fs.writeFileSync(file('source/'+id+'.jsx'),composition(root,e));const r=parse((await run(EC,['--empty','script',np(file('source/'+id+'.jsx')),'--save-as',np(project),'--json'],'qa/'+id+'/build.json')).stdout);if(!r.ok)throw Error(JSON.stringify(r));save('qa/'+id+'/layout-and-motion.json',parse(r.output));console.log('Native60-second composition saved');}
export async function preview(e,t){const id=stem(e);await run(EC,['--project',np(file('projects/'+id+'.ecproj')),'render-frame','--comp',e.compName,'--time',String(t),'--out',np(file('qa/'+id+'/preview-'+t+'.png')),'--json'],'qa/'+id+'/preview-'+t+'.json');}
export async function render(e){const id=stem(e),ec=file('projects/'+id+'.ecproj'),fc=file('projects/'+id+'.fcproj'),master=file('media/'+id+'-master.mov'),mix=file('media/'+e.mix),out=file('videos/'+id+'.mp4'),ecSha=hash(ec),mixSha=hash(mix);
 await run(EC,['--project',np(ec),'render','--comp',e.compName,'--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'qa/'+id+'/ec-render.json');const masterSha=hash(master);
 const first=await run(FC,['--save-as',np(fc),'run','-'],'qa/'+id+'/fc-build.json',[{id:'file.newProject',params:{name:e.title}},{id:'file.newSequence',params:{name:e.compName,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(master),np(mix)]}}].map(x=>JSON.stringify(x)).join('\n')+'\n');let items;for(const line of first.stdout.trim().split(/\r?\n/)){const x=parse(line);if(x.ok===false)throw Error(line);if(x.result?.items)items=x.result.items;}if(items?.length!==2)throw Error('Missing imported IDs');
 await run(FC,['--project',np(fc),'--save','run','-'],'qa/'+id+'/fc-place.json',[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:60*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:60*254016000000,video:false,audio:true}}].map(x=>JSON.stringify(x)).join('\n')+'\n');
 const r=parse((await run(FC,['--project',np(fc),'exec','file.exportMedia',JSON.stringify({path:np(out),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'qa/'+id+'/fc-export.json')).stdout);if(r.offlineMedia?.length||hash(ec)!==ecSha||hash(mix)!==mixSha||hash(master)!==masterSha)throw Error('Offline/changed source after export');save('qa/'+id+'/rendered.json',{sha256:hash(out),ecSha256:ecSha,fcSha256:hash(fc),audioSha256:mixSha,masterSha256:masterSha,bytes:fs.statSync(out).size});console.log('Sixty-second movie exported');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {episodes}=await import('./episodes.mjs');const e=episodes[0],mode=process.argv[2];if(mode==='prepare')await prepare(e);else if(mode==='render')await render(e);else if(mode==='preview')await preview(e,Number(process.argv[3]||1));else throw Error('Use prepare|preview|render');}
