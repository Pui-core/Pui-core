import fs from 'node:fs';
import {file,np,PC,run,hash,save,copy} from './native.mjs';
for(const label of ['A','B']){
  await run(PC,['run',np(file('projects/wave-'+label+'.pcraft')),'--out',np(file('projects/wave-'+label+'-reopened.pcraft'))],'pc-wave-'+label+'-save.json');
  await run(PC,['convert',np(file('projects/wave-'+label+'-reopened.pcraft')),np(file('qa/pc-wave-'+label+'.png')),'--format','png'],'pc-wave-'+label+'-render.json');
  if(hash(file('qa/pc-wave-'+label+'.png'))!==hash(file('media/wave-'+label+'.png')))throw Error('Wave native reopening changed pixels');
}
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#0A1421',name:'Shorts cover'}],
 ['file.placeEmbedded',{path:np(file('media/listener-portrait.png')),scale:95,fit:false,center:[800,480],smartObject:true}],
 ['file.placeEmbedded',{path:np(file('media/wave-A.png')),scale:80,fit:false,center:[540,1040],smartObject:true}],
 ['file.placeEmbedded',{path:np(file('media/wave-B.png')),scale:80,fit:false,center:[540,1450],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,1190,1080,95],fill:'#0A1421',name:'Clean B label'}],
 ['shape.create',{kind:'rect',rect:[0,1605,1080,315],fill:'#0A1421',name:'Clean footer'}],
 ['type.create',{x:85,y:290,text:'PROJECT P / ぷい',font:'Meiryo',size:28,color:'#AAB9CA',name:'Author'}],
 ['type.create',{x:85,y:415,text:'同じ歌、',font:'Meiryo',size:66,color:'#F4EAD9',weight:700,name:'Question 1'}],
 ['type.create',{x:85,y:520,text:'余韻を減らすと？',font:'Meiryo',size:58,color:'#F1B96B',weight:700,name:'Question 2'}],
 ['type.create',{x:130,y:810,text:'A  調整前',font:'Meiryo',size:36,color:'#D7D8E4',name:'A'}],
 ['type.create',{x:130,y:1220,text:'B  調整後',font:'Meiryo',size:36,color:'#F1B96B',name:'B'}],
 ['type.create',{x:100,y:1640,text:'medicate / MIXから完成MVへ',font:'Meiryo',size:32,color:'#F4EAD9',weight:700,name:'Destination'}]
];
const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'ProjectP YouTube medicate comparison',background:'#0A1421',resolution:72})];
for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
args.push('--out',np(file('covers/mix-process-cover.pcraft')));
await run(PC,args,'pc-cover-build.json');
await run(PC,['convert',np(file('covers/mix-process-cover.pcraft')),np(file('covers/mix-process-cover.png')),'--format','png'],'pc-cover-render.json');
copy(file('covers/mix-process-cover.pcraft'),file('projects/mix-process-cover.pcraft'));
save('qa/photocraft.json',{status:'NATIVE_PC_COVER_BUILT_AND_WAVES_REOPENED',coverSha256:hash(file('covers/mix-process-cover.png')),coverProjectSha256:hash(file('covers/mix-process-cover.pcraft')),waveA:hash(file('media/wave-A.png')),waveB:hash(file('media/wave-B.png')),generatedImages:false,actualPcmVisualization:true});
