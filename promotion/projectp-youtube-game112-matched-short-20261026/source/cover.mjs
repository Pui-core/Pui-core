import fs from 'node:fs';import path from 'node:path';import {file,np,PC,run,parse,copy,hash,save} from './native.mjs';
const stage='/mnt/f/Videos/ProjectP-YouTube-Game112-Short-2026-10-26/revision-01/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#08151e',name:'Background'}],
 ['type.create',{x:80,y:155,text:'自作ゲーム EMBERWAKE',font:'Meiryo',size:43,weight:700,color:'#aacac3',name:'Game context'}],
 ['shape.create',{kind:'rect',rect:[80,195,920,5],fill:'#5a817d',name:'Top divider'}],
 ['type.create',{x:80,y:310,text:'クリアしたら、',font:'Meiryo',size:89,weight:700,color:'#f3e7ca',name:'Result hook'}],
 ['type.create',{x:80,y:460,text:'思い出が、',font:'Meiryo',size:112,weight:700,color:'#edb468',name:'Memory hook1'}],
 ['type.create',{x:80,y:610,text:'1つ消えた。',font:'Meiryo',size:112,weight:700,color:'#edb468',name:'Memory hook2'}],
 ['file.placeEmbedded',{path:np(file('media/count-after.png')),scale:255,fit:false,center:[540,765],smartObject:true}],
 ['type.create',{x:80,y:920,text:'第1話、最初の忘却。',font:'Meiryo',size:48,weight:700,color:'#aacac3',name:'Scope'}],
 ['file.placeEmbedded',{path:np(file('media/cover-game.png')),scale:140,fit:false,center:[540,1275],smartObject:true}],
 ['file.placeEmbedded',{path:np(file('media/natural-cover.png')),scale:66,fit:false,center:[800,1280],smartObject:true}],
 ['shape.create',{kind:'rect',rect:[0,1590,1080,330],fill:'#08151e',name:'CTA field'}],
 ['type.create',{x:80,y:1660,text:'約束から、最初の忘却まで。',font:'Meiryo',size:46,weight:700,color:'#f3e7ca',name:'Matched question'}],
 ['type.create',{x:80,y:1735,text:'PROJECT P / ぷい',font:'Meiryo',size:39,color:'#aacac3',name:'Creator'}]
];save('source/cover-commands.json',commands);const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'EMBERWAKE first forgetting Short cover',background:'#08151e',resolution:72})];for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));await run(PC,[...args,'--out',np(path.join(stage,'first-forgetting-short.pcraft'))],'pc-cover-build.json');await run(PC,['convert',np(path.join(stage,'first-forgetting-short.pcraft')),np(path.join(stage,'first-forgetting-short.png')),'--format','png'],'pc-cover-export.json');copy(path.join(stage,'first-forgetting-short.pcraft'),file('covers/first-forgetting-short.pcraft'));copy(path.join(stage,'first-forgetting-short.png'),file('covers/first-forgetting-short.png'));const info=parse((await run(PC,['info',np(file('covers/first-forgetting-short.pcraft')),'--compact'],'pc-cover-info.json')).stdout);if(info.warnings?.length)throw Error('PhotoCraft cover warnings');save('qa/cover-binding.json',{nativePhotoCraft:true,nativeSha256:hash(file('covers/first-forgetting-short.pcraft')),coverSha256:hash(file('covers/first-forgetting-short.png')),actualGameFrame:805,actualCounterFrame:1400,naturalActualCoreFrame:0,canvas:[1080,1920],generatedImage:false,visualReview:'PENDING',nativeYouTubeSelected:false});console.log('PhotoCraft cover saved and converted');
