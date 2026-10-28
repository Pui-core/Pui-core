import{file,np,PC,run,save,hash,parse}from'./native.mjs';
const cmds=[
['file.placeEmbedded',{path:np(file('media/round2-neutral-hi.png')),scale:43,fit:false,center:[540,1120],smartObject:true}],
['shape.create',{kind:'rect',rect:[0,0,1080,560],fill:'#130E10',name:'Dark title field'}],
['file.placeEmbedded',{path:np(file('media/logo.png')),scale:43,fit:false,center:[540,190],smartObject:true}],
['type.create',{x:110,y:420,text:'はずした一票。',font:'Meiryo',size:78,weight:700,color:'#F7E9D1',name:'A vote missed'}],
['type.create',{x:110,y:525,text:'得点は、どっち？',font:'Meiryo',size:78,weight:700,color:'#E6BD7B',name:'One clear question'}],
['shape.create',{kind:'rect',rect:[65,1690,950,76],fill:'#130E10',name:'Scope field'}],
['type.create',{x:105,y:1740,text:'1.03検証画面・架空回答の操作例',font:'Meiryo',size:30,weight:700,color:'#C6AF8C',name:'Real QA screenshot / fictional answers'}]
];
const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'TruthOrLie real vote v10 cover',background:'#130E10',resolution:72})];for(const[id,p]of cmds)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(file('covers/truthorlie-real-v10.pcraft'))],'real-v10-photo-build.json');await run(PC,['convert',np(file('covers/truthorlie-real-v10.pcraft')),np(file('covers/truthorlie-real-v10.png')),'--format','png'],'real-v10-photo-export.json');await run(PC,['info',np(file('covers/truthorlie-real-v10.pcraft')),'--compact'],'real-v10-photo-reopen.json');save('qa/real-v10-photo-binding.json',{projectSha256:hash(file('covers/truthorlie-real-v10.pcraft')),pngSha256:hash(file('covers/truthorlie-real-v10.png')),source:'Actual 1.03 QA screenshot and official app logo; editorial title.'});console.log('PhotoCraft v10 cover saved, exported and reopened.');
