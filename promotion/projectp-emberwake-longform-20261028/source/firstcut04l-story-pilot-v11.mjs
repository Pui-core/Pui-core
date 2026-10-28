import fs from 'node:fs';
import {file,np,PC,EC,FC,FF,FP,run,parse,save,hash,digest} from './native.mjs';

// Independent creative sample: selected chapter 3/7 story cues, not a full-length master.
const chapter=Number(process.argv[2]);
if (![1,2].includes(chapter)) throw Error('Specify chapter 1 or 2');
const N=`firstcut04l-story-pilot-v11-${chapter}`, C='EMBERWAKE 記憶と手帳 creative sample v11';
const src=`source/firstcut04k-story-agent-rest04-chunk0${chapter+1}-edit.json`;
const cues=JSON.parse(fs.readFileSync(file(src),'utf8')).cues;
const duration=cues.at(-1).end;
for (const c of cues) if(hash(file(c.voice))!==c.sha256) throw Error(`Voice hash differs: ${c.id}`);
const outputs={ec:file(`projects/${N}.ecproj`),fc:file(`projects/${N}.fcproj`),pic:file(`media/${N}-picture.mov`),wav:file(`media/${N}-voice.wav`),mp4:file(`videos/${N}.mp4`)};
const highlights={u042:['道順は書ける','隣を歩いた時間は？'],u070:['顔を思い出せない','それでも、助けに行く'],u078:['残っている指示','失われた決意のいきさつ'],u079:['手帳に記された言葉','今の自分は信じる？']};
if(!process.argv.includes('--render')){
  if(Object.values(outputs).some(fs.existsSync)) throw Error('Existing output protected');
  if(chapter===1){
    const pc=file('projects/traveler-material.pcraft'), png='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04l-pilot/qa/pc-source-v11.png';
    fs.mkdirSync('/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04l-pilot/qa',{recursive:true});
    if(fs.existsSync(png)) throw Error('Existing PhotoCraft QA protected');
    await run(PC,['convert',np(pc),np(png),'--format','png'],`${N}-pc-convert.json`);
  }
  const args=['-v','error'];for(const c of cues)args.push('-i',np(file(c.voice)));
  const af=cues.map((c,i)=>`[${i}:a]adelay=${Math.round((c.start+.05)*48000)}S|${Math.round((c.start+.05)*48000)}S[q${i}]`);
  af.push(cues.map((c,i)=>`[q${i}]`).join('')+`amix=inputs=${cues.length}:normalize=0,apad,atrim=duration=${duration}[out]`);
  await run(FF,[...args,'-filter_complex',af.join(';'),'-map','[out]','-c:a','pcm_s24le','-ar','48000',np(outputs.wav)],`${N}-voice.json`);
  const payload={duration,cues:cues.map(c=>({...c,game:np(file(c.game))})),sprite:np(file('media/traveler-demo.mov')),game06:np(file('media/ep06-game.mp4')),highlights};
  const code=`app.newProject();var D=${JSON.stringify(payload)};function r(i,p){return app.run(i,p||{});}function set(l,p,v){r('prop.set',{layer:l,path:p,value:v});}function key(l,p,t,v){r('prop.addKey',{layer:l,path:p,time:Math.round(t*30)/30,timeBase:'comp',value:v});}function timing(l,a,b){r('layer.timing',{layers:[l],in:a,out:b});}
function rect(n,w,h,x,y,color,a,b){var l=r('layer.newShape',{name:n,kind:'rect',size:[w,h],position:[x,y],fill:color,strokeWidth:0}).layer;timing(l,a,b);return l;}
function txt(n,s,x,y,size,color,a,b,max){var l=r('layer.newText',{name:n,text:s,font:'Meiryo',style:'Bold',size:size,fill:color,position:[x,y],justify:'left'}).layer;var bnd=app.project.activeItem.layer(n).sourceRectAtTime(a,false);if(bnd.width>max)throw Error('overflow '+n+' '+bnd.width);set(l,'transform/anchor',[bnd.left,bnd.top,0]);set(l,'transform/position',[x,y,0]);timing(l,a,b);return l;}
function lines(s,limit){var out=[];while(s.length>limit){var k=Math.max(s.lastIndexOf('、',limit),s.lastIndexOf('。',limit));if(k<5)k=limit;else k++;out.push(s.slice(0,k));s=s.slice(k);}out.push(s);return out;}
var items={};function load(p){if(!items[p]){var q=r('file.import',{paths:[p]});if(q.errors.length||q.items.length!==1)throw Error('import '+p);items[p]=q.items[0];}return items[p];}load(D.sprite);load(D.game06);for(var i=0;i<D.cues.length;i++)load(D.cues[i].game);
r('comp.new',{name:'${C}',width:1920,height:1080,frameRate:30,duration:D.duration,background:'#07131D'});r('file.projectSettings',{workingSpace:'rec709',outputSpace:'rec709',bitDepth:8});
for(var i=0;i<D.cues.length;i++){var c=D.cues[i],a=c.start,b=c.end,notebook=c.sourceField==='notebook',memory=c.sourceField==='memory',narr=c.kind==='narration',right=c.raw.indexOf('ルミ：')===0,artLeft=right||c.id==='u071',tx=artLeft?800:120,sx=artLeft?322:1597;
if(c.id==='u041'||c.id==='u077'){
var isFirst=c.id==='u041', cut=Math.round((a+.05+(isFirst?2.81:2.34))*30)/30, reveal=Math.round((a+.05+(isFirst?4.33:1.21))*30)/30;
rect('story first background '+c.id,1920,1080,960,540,'#07131D',a,cut);
var story=r('layer.addItem',{item:load(c.game),time:a,duration:cut-a}).layer;r('layer.rename',{layer:story,name:'同話の実画面 '+c.id});r('layer.enableTimeRemap',{layers:[story],value:true});key(story,'timeRemap',a,c.gameAt);key(story,'timeRemap',cut,c.gameAt+cut-a);timing(story,a,cut);r('layer.setSwitch',{layers:[story],switch:'audio',value:false});set(story,'transform/anchor',[960,650,0]);set(story,'transform/position',[960,620,0]);set(story,'transform/scale',[130,130,100]);
rect('story top '+c.id,1920,360,960,180,'#07131D',a,cut);rect('story bottom '+c.id,1920,160,960,1020,'#07131D',a,cut);
txt('story label '+c.id,'第'+c.episode+'話 手帳／実原文を編集表示',112,65,29,'#A9C9BF',a,cut,1600);
txt('story first line '+c.id,isFirst?'鐘楼のルミを助け、ふたりで帰る。':'鐘楼へ行け。',112,135,64,'#F2E4C8',a,cut,1680);
if(!isFirst)txt('story first reveal '+c.id,'ルミを助けろ。',112,225,64,'#E7B367',reveal,cut,1680);
txt('story source '+c.id,'同話の実画面／編集表示',112,985,24,'#A9C9BF',a,cut,1600);
rect('story next background '+c.id,1920,1080,960,540,'#173C42',cut,b);
var portrait=r('layer.addItem',{item:load(D.sprite),time:cut,duration:b-cut}).layer;r('layer.rename',{layer:portrait,name:'実原画の動き '+c.id});r('layer.enableTimeRemap',{layers:[portrait],value:true});key(portrait,'timeRemap',cut,0);key(portrait,'timeRemap',b,Math.min(7.9,b-cut));timing(portrait,cut,b);r('layer.setSwitch',{layers:[portrait],switch:'audio',value:false});set(portrait,'transform/anchor',[256,256,0]);set(portrait,'transform/position',[1470,575,0]);set(portrait,'transform/scale',[130,130,100]);
rect('story next rule '+c.id,8,520,120,490,'#E7B367',cut,b);txt('story next label '+c.id,'第'+c.episode+'話 手帳／実原文を編集表示',160,115,29,'#A9C9BF',cut,b,1250);
txt('story next one '+c.id,isFirst?'火は記憶を使う。':'これは俺が、俺に頼んだこと。',160,255,isFirst?72:66,'#F2E4C8',cut,b,1210);
if(isFirst){txt('story next two '+c.id,'それでも、',160,405,72,'#E7B367',reveal,b,1210);txt('story next three '+c.id,'止まればあの子の灯が消える。',160,515,60,'#F2E4C8',reveal,b,1210);}
txt('story next credit '+c.id,'実原画を編集表示',160,940,25,'#A9C9BF',cut,b,1250);continue;
}
if(narr){
var phases={u042:['道順は、書ける。','隣を歩いた時間は？','道順の記録','隣を歩いた記憶'],u070:['顔を思い出せない。','それでも、助けに行く。','同じ指示の書かれた手帳','鐘楼へ行け。あの子を助けろ。'],u078:['残ったもの。','失われたもの。','助けに行く指示','決意に至るいきさつ'],u079:['手帳を読めば、','今することが分かる。','その指示を、','今の自分は信じる？']}[c.id];if(!phases)throw Error('missing phase '+c.id);
var offsets={u042:[1.58,3.95],u070:[1.78,6.05],u078:[3.40,5.88],u079:[1.24,3.06]}[c.id];var one=Math.round((a+.05+offsets[0])*30)/30,two=Math.round((a+.05+offsets[1])*30)/30;
rect('narration 1 background '+c.id,1920,1080,960,540,'#E9D9B9',a,one);txt('narration 1 heading '+c.id,phases[0],150,280,72,'#1B3B3B',a,one,900);rect('narration 1 accent '+c.id,160,8,230,420,'#B77C42',a,one);txt('narration 1 credit '+c.id,'第'+c.episode+'話／ナレーションの要点',150,930,25,'#607B6C',a,one,900);
if(c.id==='u042'||c.id==='u070'||c.id==='u078'){var rawFile=c.id==='u070'?D.game06:c.game,rawAt=c.id==='u042'?51.7:c.id==='u070'?56:56.63333333333333,shotEnd=Math.min(one,a+1.8);if(one-shotEnd<.25)shotEnd=one;var clip=r('layer.addItem',{item:load(rawFile),time:a,duration:shotEnd-a}).layer;r('layer.rename',{layer:clip,name:'原文資料となる実画面 '+c.id});r('layer.enableTimeRemap',{layers:[clip],value:true});key(clip,'timeRemap',a,rawAt);key(clip,'timeRemap',shotEnd,rawAt+shotEnd-a);timing(clip,a,shotEnd);r('layer.setSwitch',{layers:[clip],switch:'audio',value:false});set(clip,'transform/anchor',[960,540,0]);set(clip,'transform/position',[1450,500,0]);set(clip,'transform/scale',[40,40,100]);txt('narration 1 video credit '+c.id,(c.id==='u070'?'第6話':'第'+c.episode+'話')+'の実画面／短い抜粋',1080,730,23,'#607B6C',a,shotEnd,780);if(shotEnd<one){var bridge=r('layer.addItem',{item:load(D.sprite),time:shotEnd,duration:one-shotEnd}).layer;r('layer.rename',{layer:bridge,name:'実原画切替 '+c.id});r('layer.enableTimeRemap',{layers:[bridge],value:true});key(bridge,'timeRemap',shotEnd,0);key(bridge,'timeRemap',one,one-shotEnd);timing(bridge,shotEnd,one);r('layer.setSwitch',{layers:[bridge],switch:'audio',value:false});set(bridge,'transform/anchor',[256,256,0]);set(bridge,'transform/position',[1450,500,0]);set(bridge,'transform/scale',[75,75,100]);txt('narration 1 art credit '+c.id,'実原画を編集表示',1200,790,23,'#607B6C',shotEnd,one,660);}}
rect('narration 2 background '+c.id,1920,1080,960,540,'#102934',one,two);var mini=r('layer.addItem',{item:load(D.sprite),time:one,duration:two-one}).layer;r('layer.rename',{layer:mini,name:'実原画の動き '+c.id});r('layer.enableTimeRemap',{layers:[mini],value:true});key(mini,'timeRemap',one,0);key(mini,'timeRemap',two,Math.min(7.9,two-one));timing(mini,one,two);r('layer.setSwitch',{layers:[mini],switch:'audio',value:false});set(mini,'transform/anchor',[256,256,0]);set(mini,'transform/position',[365,590,0]);set(mini,'transform/scale',[115,115,100]);var mid=c.id==='u070'?Math.round((a+.05+3.31)*30)/30:two;txt('narration 2 heading '+c.id,phases[1],700,380,78,'#F2E4C8',one,mid,1100);if(c.id==='u070')txt('narration 2 reason '+c.id,'理由を確かめたい。',700,380,78,'#E7B367',mid,two,1100);txt('narration 2 credit '+c.id,'実原画とナレーション要点／編集表示',150,930,25,'#8CB2A9',one,two,1500);
rect('narration 3 background '+c.id,1920,1080,960,540,'#07131D',two,b);
if(c.id==='u079'){
var context=r('layer.addItem',{item:load(c.game),time:two,duration:b-two}).layer;r('layer.rename',{layer:context,name:'第7話の実画面 '+c.id});r('layer.enableTimeRemap',{layers:[context],value:true});key(context,'timeRemap',two,c.gameAt);key(context,'timeRemap',b,c.gameAt+b-two);timing(context,two,b);r('layer.setSwitch',{layers:[context],switch:'audio',value:false});set(context,'transform/anchor',[960,700,0]);set(context,'transform/position',[960,590,0]);set(context,'transform/scale',[125,125,100]);rect('narration 3 safe top '+c.id,1920,360,960,180,'#07131D',two,b);rect('narration 3 safe bottom '+c.id,1920,160,960,1020,'#07131D',two,b);txt('narration 3 heading '+c.id,phases[3],150,130,72,'#F2E4C8',two,b,1600);
}else if(c.id==='u070'){
txt('narration 3 heading '+c.id,phases[2],120,150,54,'#F2E4C8',two,b,900);var proof=r('layer.addItem',{item:load(c.game),time:two,duration:b-two}).layer;r('layer.rename',{layer:proof,name:'第7話原文の実画面 '+c.id});r('layer.enableTimeRemap',{layers:[proof],value:true});key(proof,'timeRemap',two,3.1666666666666665);key(proof,'timeRemap',b,3.1666666666666665+Math.min(2.2,b-two));timing(proof,two,b);r('layer.setSwitch',{layers:[proof],switch:'audio',value:false});set(proof,'transform/anchor',[960,540,0]);set(proof,'transform/position',[1360,530,0]);set(proof,'transform/scale',[47,47,100]);txt('narration 3 proof credit '+c.id,'第7話の実画面／短い抜粋',1000,850,23,'#8CB2A9',two,b,800);
}else{
rect('narration 3 left '+c.id,760,430,545,515,'#173C42',two,b);rect('narration 3 right '+c.id,760,430,1375,515,'#E9D9B9',two,b);txt('narration 3 left label '+c.id,'記録に残る',215,350,32,'#A9C9BF',two,b,650);txt('narration 3 right label '+c.id,'記憶の側',1045,350,32,'#8A6D47',two,b,650);txt('narration 3 left text '+c.id,phases[2],215,470,49,'#F2E4C8',two,b,650);txt('narration 3 right text '+c.id,phases[3],1045,470,49,'#293C38',two,b,650);
}
txt('narration 3 credit '+c.id,'実原文とナレーションに基づく編集図解',150,930,25,'#8CB2A9',two,b,1600);continue;
}
if(c.id==='u071'){
rect('echo background '+c.id,1920,1080,960,540,'#102934',a,b);txt('echo heading '+c.id,'同じことが、何度も書いてある。',120,130,70,'#F2E4C8',a,b,1680);
for(var k=0;k<3;k++){var t=a+k*.25;rect('echo card '+k,1390,105,880,392+k*140,k===2?'#E7B367':'#2A5053',t,b);txt('echo phrase '+k,'鐘楼へ行け。あの子を助けろ。',235,355+k*140,45,k===2?'#102934':'#D4E2CE',t,b,1330);}
txt('echo credit '+c.id,'第7話の原文を使った編集図解',120,952,24,'#A9C9BF',a,b,1650);continue;
}
if(c.id==='u072'){
rect('call background '+c.id,1920,1080,960,540,'#07131D',a,b);rect('call accent '+c.id,12,680,170,490,'#E7B367',a,b);
txt('call who '+c.id,'第7話／アッシュ',220,105,31,'#8CB2A9',a,b,1400);txt('call first '+c.id,'鐘楼へ行け。',220,270,100,'#F2E4C8',a,b,1550);txt('call second '+c.id,'あの子を助けろ。',220,440,100,'#E7B367',a,b,1550);txt('call credit '+c.id,'実ゲーム原文を編集表示',220,910,24,'#8CB2A9',a,b,1400);continue;
}
if(c.id==='u074'||c.id==='u075'){
var live=r('layer.addItem',{item:load(c.game),time:a,duration:b-a}).layer;r('layer.rename',{layer:live,name:'第7話の実画面 '+c.id});r('layer.enableTimeRemap',{layers:[live],value:true});key(live,'timeRemap',a,c.gameAt);key(live,'timeRemap',b,c.gameAt+(b-a));timing(live,a,b);r('layer.setSwitch',{layers:[live],switch:'audio',value:false});set(live,'transform/anchor',[960,650,0]);set(live,'transform/position',[960,620,0]);set(live,'transform/scale',[130,130,100]);
var left=c.id==='u074',textX=left?130:590;rect('old UI safety cover '+c.id,1920,360,960,180,'#07131D',a,b);rect('old UI bottom cover '+c.id,1920,160,960,1020,'#07131D',a,b);txt('dialogue speaker '+c.id,left?'アッシュ':'ルミ',textX,116,31,'#E7B367',a,b,1150);
var dialogue=c.text, pieces=lines(dialogue,17);for(var t=0;t<pieces.length;t++)txt('dialogue text '+c.id+' '+t,pieces[t],textX,174+t*72,55,'#F2E4C8',a,b,1150);rect('dialogue credit backing '+c.id,685,60,420,1000,'#07131D',a,b);txt('dialogue credit '+c.id,'第7話の実画面／台詞は編集表示',104,985,24,'#A9C9BF',a,b,655);continue;
}
rect('base '+c.id,1920,1080,960,540,notebook?'#E9D9B9':memory?'#1B3440':'#07131D',a,b);rect('side field '+c.id,645,1080,sx,540,notebook?'#173C42':right?'#274A51':'#102934',a,b);rect('fine frame '+c.id,3,700,artLeft?683:1234,570,notebook?'#A9844C':'#547A77',a,b);
if(narr||right){var game=r('layer.addItem',{item:load(c.game),time:a,duration:b-a}).layer;r('layer.rename',{layer:game,name:'同話実画面 '+c.id});r('layer.enableTimeRemap',{layers:[game],value:true});key(game,'timeRemap',a,c.gameAt);key(game,'timeRemap',b,c.gameAt+(b-a));timing(game,a,b);r('layer.setSwitch',{layers:[game],switch:'audio',value:false});set(game,'transform/anchor',[960,540,0]);set(game,'transform/position',[artLeft?330:1570,530,0]);set(game,'transform/scale',[31,31,100]);rect('game bottom mask '+c.id,660,158,artLeft?330:1590,883,right?'#274A51':'#102934',a,b);txt('game credit '+c.id,'同話の実画面／自動入力',artLeft?80:1300,841,23,'#A9C9BF',a,b,570);
}else{var sprite=r('layer.addItem',{item:load(D.sprite),time:a,duration:b-a}).layer;r('layer.rename',{layer:sprite,name:'実原画の動き '+c.id});r('layer.enableTimeRemap',{layers:[sprite],value:true});key(sprite,'timeRemap',a,0);key(sprite,'timeRemap',b,Math.min(7.95,b-a));timing(sprite,a,b);r('layer.setSwitch',{layers:[sprite],switch:'audio',value:false});set(sprite,'transform/anchor',[256,256,0]);set(sprite,'transform/scale',[98,98,100]);key(sprite,'transform/position',a,[artLeft?255:1652,626,0]);key(sprite,'transform/position',a+.30,[artLeft?330:1575,626,0]);txt('art credit '+c.id,'実原画を編集表示',artLeft?120:1376,905,23,'#A9C9BF',a,b,480);}
txt('chapter '+c.id,'EMBERWAKE  /  第'+c.episode+'話',tx,80,27,notebook?'#5A6F63':'#8CB2A9',a,b,1100);rect('rule '+c.id,90,5,tx+45,143,notebook?'#A66B36':'#E7B367',a,b);
var body=c.raw.split('：'),who=narr?'記録と記憶':(body.length>1?body[0]:(notebook?'手帳':memory?'失われた記憶':'原文'));body=body.length>1?body.slice(1).join('：'):c.raw;
txt('who '+c.id,who,tx,188,35,notebook?'#955B2D':'#E7B367',a,b,1010);
if(narr){var h=D.highlights[c.id];if(!h)throw Error('Missing editorial summary '+c.id);txt('first '+c.id,h[0],tx,300,62,'#F2E4C8',a,b,1050);var d=Math.min(.85,(b-a)/4);txt('second '+c.id,h[1],tx,408,58,'#E7B367',a+d,b,1050);txt('source '+c.id,'ナレーションの要点を編集表示',tx,883,24,'#8CB2A9',a,b,1050);
}else{var L=lines(body,17);if(L.length>5)throw Error('quote too long '+c.id);for(var j=0;j<L.length;j++)txt('quote '+c.id+' '+j,L[j],tx,294+j*86,52,notebook?'#293C38':'#F2E4C8',a,b,1050);txt('source '+c.id,'実ゲームの原文／編集して改行',tx,883,24,notebook?'#5A6F63':'#8CB2A9',a,b,1050);}
rect('progress back '+c.id,1050,4,tx+525,984,notebook?'#C3B799':'#274751',a,b);var bar=rect('progress '+c.id,1050,4,tx+525,984,notebook?'#A66B36':'#E7B367',a,b);set(bar,'transform/anchor',[-525,0,0]);set(bar,'transform/position',[tx,984,0]);key(bar,'transform/scale',a,[0,100,100]);key(bar,'transform/scale',b,[100,100,100]);
}writeLn(JSON.stringify({cues:D.cues.length,duration:D.duration}));`;
  fs.writeFileSync(file(`source/${N}.jsx`),code,{flag:'wx'});
  const built=parse((await run(EC,['--empty','script',np(file(`source/${N}.jsx`)),'--save-as',np(outputs.ec),'--json'],`${N}-build.json`)).stdout);if(!built.ok)throw Error('EffectCraft build failed');
  save(`source/${N}-edit.json`,{duration,cues,summaryLabels:highlights,timingBasis:{method:'VOICEVOX保存済みqueryの各モーラ長・speedScaleから推定。WAVを直接聴いた確定値ではない。',quoteCueOffsets:{u041:[2.81,4.33],u077:[1.21,2.34]},firstSecondCueOffsets:{u042:[1.58,3.95],u070:[1.78,6.05],u078:[3.40,5.88],u079:[1.24,3.06]},u070AdditionalReasonOffset:3.31,voicePlacementOffset:.05,queryFiles:['source/firstcut04-u042-query.json','source/firstcut04-u070-query.json','source/firstcut04-u078-query.json','source/firstcut04-u079-query.json']},scope:'第3話・第7話の実原文・既存VOICEVOX・実原画を用いた編集サンプル',fullFilm:false,subjectiveListen:false,published:false});
  for(const c of cues){await run(EC,['--project',np(outputs.ec),'render-frame','--comp',C,'--time',String(c.start+Math.min(1.2,(c.end-c.start)/2)),'--out',np(file(`qa/${N}-${c.id}.png`)),'--json'],`${N}-${c.id}.json`);}
  console.log(JSON.stringify({duration,cues:cues.length,stage:'preview'}));
}else{
  if(!fs.existsSync(outputs.ec)||!fs.existsSync(outputs.wav)||[outputs.fc,outputs.pic,outputs.mp4].some(fs.existsSync))throw Error('Missing input or existing output protected');
  await run(EC,['--project',np(outputs.ec),'render','--comp',C,'--out',np(outputs.pic),'--format','prores','--prores','4444','--audio','off','--json'],`${N}-ec-render.json`);
  const seq=[{id:'file.newProject',params:{name:C}},{id:'file.newSequence',params:{name:C,width:1920,height:1080,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(outputs.pic),np(outputs.wav)]}}];let ids;
  for(const line of (await run(FC,['--save-as',np(outputs.fc),'run','-'],`${N}-fc-init.json`,seq.map(JSON.stringify).join('\n')+'\n')).stdout.trim().split(/\r?\n/)){const q=parse(line);if(q.ok===false)throw Error(line);if(q.result?.items)ids=q.result.items;}
  if(ids?.length!==2)throw Error('FilmCraft import failure');await run(FC,['--project',np(outputs.fc),'--save','run','-'],`${N}-fc-place.json`,ids.map((id,i)=>({id:'timeline.place',params:{item:id,track:i?'A1':'V1',seconds:0,duration:duration*254016000000,video:i===0,audio:i===1}})).map(JSON.stringify).join('\n')+'\n');
  const exported=parse((await run(FC,['--project',np(outputs.fc),'exec','file.exportMedia',JSON.stringify({path:np(outputs.mp4),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],`${N}-fc-export.json`)).stdout);if(exported.offlineMedia?.length)throw Error('offline media');
  const probe=parse((await run(FP,['-v','error','-count_frames','-show_streams','-show_format','-of','json',np(outputs.mp4)],`${N}-probe.json`)).stdout);await run(FF,['-v','error','-xerror','-i',np(outputs.mp4),'-f','null','-'],`${N}-decode.json`);
  save(`qa/${N}-render.json`,{duration:probe.format.duration,frames:probe.streams.find(s=>s.codec_type==='video').nb_read_frames,sha256:await digest(outputs.mp4),decode:true,fullFilm:false,subjectiveListen:false,published:false});console.log(JSON.stringify({duration:probe.format.duration,sha256:await digest(outputs.mp4)}));
}
