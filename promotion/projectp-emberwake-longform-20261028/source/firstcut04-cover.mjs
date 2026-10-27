import fs from 'node:fs';import path from 'node:path';
import {file,np,PC,run,parse,save,hash,copy} from './native.mjs';
const project=file('covers/emberwake-firstcut04.pcraft'),png=file('covers/emberwake-firstcut04.png');if(fs.existsSync(project)||fs.existsSync(png))throw Error('Retain existing cover revision');
const stage='/mnt/f/Videos/ProjectP-EMBERWAKE-Longform-2026-10-28/firstcut-04/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
const raw='/home/pui/tmp/projectp-emberwake-longform-20261028/production/ep01-pilot01/frames/frame-000800.png',crop=path.join(stage,'firstcut04-game-crop.png');
await run(PC,['run',np(raw),'--cmd','image.crop','--params',JSON.stringify({x:860,y:650,width:700,height:400,deleteCroppedPixels:true,contentAware:false}),'--out',np(crop),'--format','png'],'firstcut04-cover-game-crop-F-recovery.json');
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1920,1080],fill:'#07131d',name:'Background'}],
 ['file.placeEmbedded',{path:np(crop),scale:250,fit:false,center:[1635,610],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,0,915,1080],fill:'#07131d',name:'Readable question'}],
 ['shape.create',{kind:'rect',rect:[95,173,7,380],fill:'#edb468',name:'Warm accent'}],
 ['type.create',{x:132,y:95,text:'EMBERWAKE',font:'Meiryo',size:43,weight:700,color:'#aac8bf',name:'Game'}],
 ['type.create',{x:132,y:224,text:'助けたい。',font:'Meiryo',size:104,weight:700,color:'#f1dfc0',name:'Promise'}],
 ['type.create',{x:132,y:388,text:'でも、',font:'Meiryo',size:95,weight:700,color:'#f1dfc0',name:'Turn'}],
 ['type.create',{x:132,y:540,text:'忘れていく。',font:'Meiryo',size:94,weight:700,color:'#edb468',name:'Cost'}],
 ['type.create',{x:132,y:786,text:'落下・近道・手帳を比べる',font:'Meiryo',size:37,weight:700,color:'#aac8bf',name:'Concrete promise'}],
 ['type.create',{x:132,y:944,text:'ぷい｜ゲームをつくる',font:'Meiryo',size:29,color:'#aac8bf',name:'Author'}]
];
const args=['run','--new',JSON.stringify({width:1920,height:1080,name:'EMBERWAKE firstcut04 cover',background:'#07131d',resolution:72})];for(const[id,params]of commands)args.push('--cmd',id,'--params',JSON.stringify(params));
save('source/firstcut04-cover-commands.json',commands);await run(PC,[...args,'--out',np(path.join(stage,'emberwake-firstcut04.pcraft'))],'firstcut04-cover-build.json');await run(PC,['convert',np(path.join(stage,'emberwake-firstcut04.pcraft')),np(path.join(stage,'emberwake-firstcut04.png')),'--format','png'],'firstcut04-cover-export.json');copy(path.join(stage,'emberwake-firstcut04.pcraft'),project);copy(path.join(stage,'emberwake-firstcut04.png'),png);copy(crop,file('covers/firstcut04-game-crop-F.png'));const info=parse((await run(PC,['info',np(project),'--compact'],'firstcut04-cover-info.json')).stdout);if(info.warnings?.length)throw Error('Native cover warnings');
save('qa/firstcut04-cover-binding.json',{nativePhotoCraft:true,imageGenerationThisPass:false,sourceActualFrame:{attempt:'ep01-pilot01',frame:800,sha256:hash(raw),crop:[860,650,700,400]},nativeSha256:hash(project),pngSha256:hash(png),editedCoverNotGameUi:true,rootAccepted:false});console.log(JSON.stringify({cover:png,sha256:hash(png)}));
