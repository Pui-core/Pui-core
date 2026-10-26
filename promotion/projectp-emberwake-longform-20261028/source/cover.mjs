import fs from 'node:fs';import path from 'node:path';import {file,np,PC,run,parse,copy,hash,save} from './native.mjs';
const destination='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/revision-01',stage=path.join(destination,'photocraft-stage');
if(fs.existsSync(destination)&&!fs.existsSync(path.join(destination,'.projectp-issue127-delivery.json'))&&fs.readdirSync(destination).some(n=>n!=='photocraft-stage'))throw Error('Existing F output is not known127');
fs.mkdirSync(stage,{recursive:true});fs.writeFileSync(path.join(destination,'.projectp-issue127-delivery.json'),JSON.stringify({issue127:true,sourceRoot:file(''),state:'IN_PROGRESS_OWN_PHOTOCRAFT_STAGE'},null,2)+'\n');
const game='/home/pui/tmp/projectp-emberwake-longform-20261028/production/ep01-pilot01/frames/frame-000800.png';
await run(PC,['run',np(game),'--cmd','image.crop','--params',JSON.stringify({x:730,y:500,width:1000,height:560,deleteCroppedPixels:true,contentAware:false}),'--out',np(path.join(stage,'cover-game.png')),'--format','png'],'pc-game-crop.json');copy(path.join(stage,'cover-game.png'),file('media/cover-game.png'));
const commands=[
['shape.create',{kind:'rect',rect:[0,0,1920,1080],fill:'#07131d',name:'Dark background'}],
['file.placeEmbedded',{path:np(file('media/cover-game.png')),scale:135,fit:false,center:[1470,735],smartObject:true}],
['shape.create',{kind:'rect',rect:[0,0,990,1080],fill:'#07131d',name:'Question field'}],
['shape.create',{kind:'rect',rect:[70,110,8,350],fill:'#edb468',name:'Warm accent'}],
['type.create',{x:110,y:95,text:'自作ゲーム EMBERWAKE',font:'Meiryo',size:34,weight:700,color:'#aac8bf',name:'Game context'}],
['type.create',{x:110,y:200,text:'灯をつけると、',font:'Meiryo',size:90,weight:700,color:'#f1dfc0',name:'Hook'}],
['type.create',{x:110,y:340,text:'思い出が消える。',font:'Meiryo',size:84,weight:700,color:'#edb468',name:'Question payoff'}],
['type.create',{x:110,y:490,text:'制作版0.12.0の実プレイ',font:'Meiryo',size:36,weight:700,color:'#aac8bf',name:'Scope'}],
['file.placeEmbedded',{path:np(file('media/natural/frame-000000.png')),scale:75,fit:false,center:[365,810],smartObject:true}],
['shape.create',{kind:'rect',rect:[0,1000,1920,80],fill:'#07131d',name:'Footer field'}],
['type.create',{x:600,y:1020,text:'約束と、二段の近道。',font:'Meiryo',size:34,weight:700,color:'#f1dfc0',name:'Viewer promise'}],
['type.create',{x:1440,y:1025,text:'PROJECT P / ぷい',font:'Meiryo',size:28,color:'#aac8bf',name:'Author'}]
];save('source/cover-commands.json',commands);
const args=['run','--new',JSON.stringify({width:1920,height:1080,name:'EMBERWAKE formal longform',background:'#07131d',resolution:72})];for(const [id,params]of commands)args.push('--cmd',id,'--params',JSON.stringify(params));
await run(PC,[...args,'--out',np(path.join(stage,'emberwake-longform.pcraft'))],'pc-cover-build.json');await run(PC,['convert',np(path.join(stage,'emberwake-longform.pcraft')),np(path.join(stage,'emberwake-longform.png')),'--format','png'],'pc-cover-export.json');
copy(path.join(stage,'emberwake-longform.pcraft'),file('covers/emberwake-longform.pcraft'));copy(path.join(stage,'emberwake-longform.png'),file('covers/emberwake-longform.png'));
const info=parse((await run(PC,['info',np(file('covers/emberwake-longform.pcraft')),'--compact'],'pc-cover-info.json')).stdout);if(info.warnings?.length)throw Error('PhotoCraft native warnings');
save('qa/cover-binding.json',{pngSha256:hash(file('covers/emberwake-longform.png')),nativeSha256:hash(file('covers/emberwake-longform.pcraft')),sourceActualGameFrame:{episode:1,attempt:'ep01-pilot01',frame:800,crop:[730,500,1000,560]},newCoreFrame:0,canvas:[1920,1080],actualPhotoCraft:true,imageGenerated:false,editedCoverNotGameUi:true,visualReview:'PENDING'});
console.log(JSON.stringify({actualPhotoCraftCover:true,pngSha256:hash(file('covers/emberwake-longform.png'))}));
