import fs from 'node:fs';
import path from 'node:path';
import {file,np,PC,run,parse,copy,hash,save} from './native.mjs';
// Crop an actual recorded game region; PhotoCraft keeps every authored layer editable.
// PhotoCraft's durable-save check rejects WSL UNC writes; use this owned F delivery only.
const stage='/mnt/f/Videos/ProjectP-YouTube-Game-Horizontal-2026-10-26/revision-01/photocraft-stage';
fs.mkdirSync(stage,{recursive:true});
await run(PC,['run',np(file('media/game/frame-000805.png')),'--cmd','image.crop','--params',JSON.stringify({x:360,y:380,width:1240,height:650,deleteCroppedPixels:true,contentAware:false}),'--out',np(path.join(stage,'cover-game.png')),'--format','png'],'pc-game-crop.json');
copy(path.join(stage,'cover-game.png'),file('media/cover-game.png'));
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1920,1080],fill:'#08151e',name:'Dark background'}],
 ['file.placeEmbedded',{path:np(file('media/cover-game.png')),scale:110,fit:false,center:[1530,690],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,0,990,1080],fill:'#08151e',name:'Title field'}],
 ['shape.create',{kind:'rect',rect:[70,110,8,320],fill:'#edb468',name:'Warm accent'}],
 ['type.create',{x:110,y:95,text:'自作ゲーム EMBERWAKE',font:'Meiryo',size:34,weight:700,color:'#aacac3',name:'Game and author context'}],
 ['type.create',{x:110,y:200,text:'灯は、ついた。',font:'Meiryo',size:91,weight:700,color:'#f3e7ca',name:'Clear'}],
 ['type.create',{x:110,y:340,text:'思い出は、消えた。',font:'Meiryo',size:83,weight:700,color:'#edb468',name:'Cost'}],
 ['type.create',{x:110,y:490,text:'第1話、最初の忘却。',font:'Meiryo',size:42,weight:700,color:'#aacac3',name:'Episode scope'}],
 ['file.placeEmbedded',{path:np(file('media/natural/frame-000000.png')),scale:75,fit:false,center:[350,820],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,1000,1920,80],fill:'#07131d',name:'Footer field'}],
 ['type.create',{x:580,y:1020,text:'3つの灯の先で、何を失った？',font:'Meiryo',size:35,weight:700,color:'#f3e7ca',name:'Viewer question'}],
 ['type.create',{x:1430,y:1025,text:'PROJECT P / ぷい',font:'Meiryo',size:28,color:'#aacac3',name:'Brand'}]
];
save('source/cover-commands.json',commands);
const args=['run','--new',JSON.stringify({width:1920,height:1080,name:'EMBERWAKE first forgetting',background:'#08151e',resolution:72})];
for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(path.join(stage,'first-forgetting.pcraft'))],'pc-cover-build.json');
await run(PC,['convert',np(path.join(stage,'first-forgetting.pcraft')),np(path.join(stage,'first-forgetting.png')),'--format','png'],'pc-cover-export.json');
copy(path.join(stage,'first-forgetting.pcraft'),file('covers/first-forgetting.pcraft'));
copy(path.join(stage,'first-forgetting.png'),file('covers/first-forgetting.png'));
const info=parse((await run(PC,['info',np(file('covers/first-forgetting.pcraft')),'--compact'],'pc-cover-info.json')).stdout);
if(info.warnings?.length)throw Error('PhotoCraft cover warnings');
save('qa/cover-binding.json',{pngSha256:hash(file('covers/first-forgetting.png')),nativeSha256:hash(file('covers/first-forgetting.pcraft')),gameFrame:805,modelFrame:0,canvas:[1920,1080],actualPhotoCraft:true,generatedImage:false,editedArtworkNotGameUi:true,visualReview:'PENDING'});
console.log('PhotoCraft cover native and PNG saved');
