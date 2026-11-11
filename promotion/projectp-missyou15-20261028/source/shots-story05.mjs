import fs from 'node:fs';
import {file,np,PC,FF,run,save,hash} from './native.mjs';
const raw='/home/pui/tmp/projectp136-private-capture-A9pELNAs/actual-ui.mp4';
if(!fs.existsSync(raw))throw Error('Private source recording is required; never fabricate it.');
const variants={
 sealed:[
 ['shape.create',{kind:'rect',rect:[78,510,1010,250],fill:'#f7ecd9',name:'Editorial example name field'}],
 ['type.create',{x:95,y:565,text:'みおから届いています。送ると、',font:'Meiryo',size:42,weight:700,color:'#49363f',name:'Synthetic name / peer already sent'}],
 ['type.create',{x:95,y:625,text:'ひらけます。',font:'Meiryo',size:42,weight:700,color:'#49363f',name:'Original app rule preserved'}],
 ['type.create',{x:95,y:726,text:'みおとの交換日記',font:'Meiryo',size:48,weight:400,color:'#49363f',name:'Synthetic example title'}]
 ],
 opened:[
 ['shape.create',{kind:'rect',rect:[90,1140,600,93],fill:'#f7ecd9',name:'Editorial fictional partner name'}],
 ['type.create',{x:100,y:1205,text:'みお',font:'Meiryo',size:46,weight:700,color:'#49363f',name:'Fictional name'}],
 ['shape.create',{kind:'rect',rect:[90,1600,1000,112],fill:'#f7ecd9',name:'Editorial fictional diary sentence'}],
 ['type.create',{x:100,y:1668,text:'帰り道の空が、きれいだったよ。',font:'Meiryo',size:36,weight:400,color:'#49363f',name:'Fictional diary sentence'}]
 ]
};
for(const [name,commands] of Object.entries(variants)){
 const args=['run','--new',JSON.stringify({width:1180,height:2556,name:'MISSYOU fictional text / '+name,background:'transparent',resolution:72})];
 for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
 await run(PC,[...args,'--out',np(file(`projects/example-${name}.pcraft`))],`story05-photo-${name}.json`);
 await run(PC,['convert',np(file(`projects/example-${name}.pcraft`)),np(file(`media/example-${name}.png`)),'--format','png'],`story05-photo-${name}-png.json`);
 await run(PC,['info',np(file(`projects/example-${name}.pcraft`)),'--compact'],`story05-photo-${name}-reopen.json`);
}
const specs=[
 {file:'sealed-story05.mp4',start:152.132,end:153.05,overlay:'sealed'},
 {file:'select-story05.mp4',start:153.58,end:153.80,overlay:'sealed'},
 {file:'opened-story05.mp4',start:156.94,end:158.20,overlay:'opened'}
];
for(const s of specs){
 const length=s.end-s.start;
 // Preserve each recorded picture and omit the multi-second waits with explicit cuts.
 // Padding holds an existing frame; it does not invent an app transition.
 await run(FF,['-hide_banner','-v','error','-y','-i',np(raw),'-i',np(file(`media/example-${s.overlay}.png`)),
 '-filter_complex',`[0:v]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS[v];[v][1:v]overlay=0:0:format=auto,crop=1100:1800:40:340,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=3,trim=duration=3[out]`,
 '-map','[out]','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',np(file('media/'+s.file))],`story05-shot-${s.overlay}-${s.start}.json`);
 s.rawRecordingSha256=hash(raw);s.outputSha256=hash(file('media/'+s.file));s.rawDuration=length;s.frameHold=true;
}
save('qa/story05-shot-provenance.json',{source:'Isolated offline QA testB actual recording. Names and fixture body changed in explicit editorial overlays.',containsActualNames:false,remoteNetworkCalls:0,rawKeptPrivate:true,shots:specs,editorialRule:'The peer has already sent. Our stamp seals the entry and opens the mutual page. The wait is removed with a hard cut; no missing animation is synthesized.'});
console.log('Broad actual app shots with fictional text overlays produced.');
