import {file,np,PC,run,save,hash,parse} from './native.mjs';
const commands=[
  ['file.placeEmbedded',{path:np(file('media/room-clean.png')),scale:180,fit:false,center:[540,960],smartObject:true}],
  ['shape.create',{kind:'rect',rect:[80,160,920,380],fill:'#fff7ed',name:'Warm ivory title field'}],
  ['shape.create',{kind:'rect',rect:[115,211,55,6],fill:'#b97967',name:'Terracotta accent'}],
  ['type.create',{x:195,y:239,text:'missyou / 新しい部屋',font:'Meiryo',size:33,weight:700,color:'#71514d',name:'App and preview title'}],
  ['type.create',{x:115,y:365,text:'この手紙、',font:'Meiryo',size:68,weight:700,color:'#49363f',name:'Cover first line'}],
  ['type.create',{x:115,y:465,text:'まだ開けない。',font:'Meiryo',size:80,weight:700,color:'#49363f',name:'Cover second line'}],
  ['shape.create',{kind:'rect',rect:[80,1430,525,72],fill:'#fff7ed',name:'Development disclosure field'}],
  ['type.create',{x:105,y:1480,text:'開発版・架空の例',font:'Meiryo',size:32,weight:700,color:'#49363f',name:'Development disclosure'}]
];
const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'MISSYOU / new room / final cover',background:'#f6ece1',resolution:72})];
for(const [id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(file('covers/missyou-story05-cover.pcraft'))],'final05-photocraft-build.json');
await run(PC,['convert',np(file('covers/missyou-story05-cover.pcraft')),np(file('covers/missyou-story05-cover.png')),'--format','png'],'final05-photocraft-export.json');
const info=parse((await run(PC,['info',np(file('covers/missyou-story05-cover.pcraft')),'--compact'],'final05-photocraft-reopen.json')).stdout);
save('qa/final05-photo-binding.json',{projectSha256:hash(file('covers/missyou-story05-cover.pcraft')),pngSha256:hash(file('covers/missyou-story05-cover.png')),warnings:info.warnings||[],source:'Actual development room art; typography is editorial.'});
console.log('PhotoCraft final cover saved, exported and reopened.');
