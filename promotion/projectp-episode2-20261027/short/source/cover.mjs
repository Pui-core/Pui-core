import fs from 'node:fs';import path from 'node:path';
import {file,np,PC,run,parse,copy,hash,save} from './native.mjs';
const parent=path.resolve(file('..')),stage='/mnt/f/Videos/ProjectP-Episode2-2026-10-27/revision-01/photocraft-stage/short';fs.mkdirSync(stage,{recursive:true});
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#08151e',name:'Dark background'}],
 ['file.placeEmbedded',{path:np(path.join(parent,'media/cover-game.png')),scale:77,fit:false,center:[540,1040],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[70,240,7,470],fill:'#edb468',name:'Warm accent'}],
 ['type.create',{x:110,y:240,text:'二段の近道、',font:'Meiryo',size:86,weight:700,color:'#f3e7ca',name:'Question context'}],
 ['type.create',{x:110,y:370,text:'ダッシュで',font:'Meiryo',size:104,weight:700,color:'#edb468',name:'Question action'}],
 ['type.create',{x:110,y:520,text:'渡れる？',font:'Meiryo',size:118,weight:700,color:'#edb468',name:'Question'}],
 ['type.create',{x:110,y:700,text:'同じ島へ、別の道。',font:'Meiryo',size:45,weight:700,color:'#aacac3',name:'Episode route context'}],
 ['file.placeEmbedded',{path:np(path.join(parent,'media/natural/frame-000000.png')),scale:58,fit:false,center:[760,1440],smartObject:true}],
 ['type.create',{x:90,y:1400,text:'自作ゲーム',font:'Meiryo',size:45,weight:700,color:'#f3e7ca',name:'Authorship'}],
 ['type.create',{x:90,y:1490,text:'EMBERWAKE',font:'Meiryo',size:44,weight:700,color:'#aacac3',name:'Game'}],
 ['type.create',{x:90,y:1625,text:'第2話「ふたりの合図」',font:'Meiryo',size:37,weight:700,color:'#f3e7ca',name:'Episode'}],
 ['type.create',{x:90,y:1725,text:'PROJECT P / ぷい',font:'Meiryo',size:34,color:'#aacac3',name:'Brand'}]
];save('source/cover-commands.json',commands);
const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'EMBERWAKE episode2 matched Short',background:'#08151e',resolution:72})];for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(path.join(stage,'episode2-short.pcraft'))],'pc-cover-build.json');
await run(PC,['convert',np(path.join(stage,'episode2-short.pcraft')),np(path.join(stage,'episode2-short.png')),'--format','png'],'pc-cover-export.json');
copy(path.join(stage,'episode2-short.pcraft'),file('covers/episode2-short.pcraft'));copy(path.join(stage,'episode2-short.png'),file('covers/episode2-short.png'));
const info=parse((await run(PC,['info',np(file('covers/episode2-short.pcraft')),'--compact'],'pc-cover-info.json')).stdout);if(info.warnings?.length)throw Error('Cover warning');
save('qa/cover-binding.json',{pngSha256:hash(file('covers/episode2-short.png')),nativeSha256:hash(file('covers/episode2-short.pcraft')),canvas:[1080,1920],actualPhotoCraft:true,generatedImage:false,gameFrame:660,modelFrame:0,visualReview:'PENDING'});console.log('Short PhotoCraft cover complete');
