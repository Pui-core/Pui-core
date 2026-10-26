import fs from 'node:fs';
import path from 'node:path';
import {file,np,PC,run,parse,copy,hash,save} from './native.mjs';
// Crop an actual recorded game region; PhotoCraft keeps every authored layer editable.
// PhotoCraft's durable-save check rejects WSL UNC writes; use this owned F delivery only.
const stage='/mnt/f/Videos/ProjectP-Episode2-2026-10-27/revision-01/photocraft-stage';
fs.mkdirSync(stage,{recursive:true});
await run(PC,['run',np(file('media/game/frame-000660.png')),'--cmd','image.crop','--params',JSON.stringify({x:340,y:460,width:1260,height:560,deleteCroppedPixels:true,contentAware:false}),'--out',np(path.join(stage,'cover-game.png')),'--format','png'],'pc-game-crop.json');
copy(path.join(stage,'cover-game.png'),file('media/cover-game.png'));
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1920,1080],fill:'#08151e',name:'Dark background'}],
 ['file.placeEmbedded',{path:np(file('media/cover-game.png')),scale:110,fit:false,center:[1530,720],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,0,990,1080],fill:'#08151e',name:'Title field'}],
 ['shape.create',{kind:'rect',rect:[70,110,8,320],fill:'#edb468',name:'Warm accent'}],
 ['type.create',{x:110,y:95,text:'自作ゲーム EMBERWAKE / 第2話',font:'Meiryo',size:34,weight:700,color:'#aacac3',name:'Game and author context'}],
 ['type.create',{x:110,y:200,text:'急な二段の近道。',font:'Meiryo',size:88,weight:700,color:'#f3e7ca',name:'Hook'}],
 ['type.create',{x:110,y:340,text:'ダッシュで、渡れる？',font:'Meiryo',size:80,weight:700,color:'#edb468',name:'Question'}],
 ['type.create',{x:110,y:490,text:'ふたりの合図 / 答えは本編で。',font:'Meiryo',size:42,weight:700,color:'#aacac3',name:'Episode scope'}],
 ['file.placeEmbedded',{path:np(file('media/natural/frame-000000.png')),scale:75,fit:false,center:[350,820],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,1000,1920,80],fill:'#07131d',name:'Footer field'}],
 ['type.create',{x:580,y:1020,text:'二段の近道も、同じ島へ。',font:'Meiryo',size:35,weight:700,color:'#f3e7ca',name:'Viewer question'}],
 ['type.create',{x:1430,y:1025,text:'PROJECT P / ぷい',font:'Meiryo',size:28,color:'#aacac3',name:'Brand'}]
];
save('source/cover-commands.json',commands);
const args=['run','--new',JSON.stringify({width:1920,height:1080,name:'EMBERWAKE episode2 futari no aizu',background:'#08151e',resolution:72})];
for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(path.join(stage,'episode2-futari-no-aizu.pcraft'))],'pc-cover-build.json');
await run(PC,['convert',np(path.join(stage,'episode2-futari-no-aizu.pcraft')),np(path.join(stage,'episode2-futari-no-aizu.png')),'--format','png'],'pc-cover-export.json');
copy(path.join(stage,'episode2-futari-no-aizu.pcraft'),file('covers/episode2-futari-no-aizu.pcraft'));
copy(path.join(stage,'episode2-futari-no-aizu.png'),file('covers/episode2-futari-no-aizu.png'));
const info=parse((await run(PC,['info',np(file('covers/episode2-futari-no-aizu.pcraft')),'--compact'],'pc-cover-info.json')).stdout);
if(info.warnings?.length)throw Error('PhotoCraft cover warnings');
save('qa/cover-binding.json',{pngSha256:hash(file('covers/episode2-futari-no-aizu.png')),nativeSha256:hash(file('covers/episode2-futari-no-aizu.pcraft')),gameFrame:660,modelFrame:0,canvas:[1920,1080],actualPhotoCraft:true,generatedImage:false,editedArtworkNotGameUi:true,visualReview:'PENDING'});
console.log('PhotoCraft episode2 cover native and PNG saved');
