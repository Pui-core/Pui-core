import fs from 'node:fs';import path from 'node:path';
import {root,file,np,PC,run,parse,copy,hash,save} from './native.mjs';
const delivery='/mnt/f/Videos/ProjectP-Missyou-Room-2026-10-27/revision-02',marker=delivery+'/.projectp-issue118-repair-owner.json';
if(fs.existsSync(delivery)&&!fs.existsSync(marker)&&fs.readdirSync(delivery).length)throw Error('Preserve existing unowned revision02');fs.mkdirSync(delivery,{recursive:true});if(!fs.existsSync(marker))fs.writeFileSync(marker,JSON.stringify({issue:118,sourceRoot:root,scope:'Only revision02 repair; revision01 preserved'},null,2)+'\n');
const stage=delivery+'/photocraft-stage';fs.mkdirSync(stage,{recursive:true});
await run(PC,['run',np(file('media/actual-persisted-room.png')),'--cmd','image.crop','--params',JSON.stringify({x:0,y:350,width:1080,height:1120,deleteCroppedPixels:true,contentAware:false}),'--out',np(stage+'/room-crop.png'),'--format','png'],'pc-actual-room-crop.json');copy(stage+'/room-crop.png',file('media/room-crop.png'));
const commands=[
 ['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#f8f2e7',name:'Warm background'}],
 ['shape.create',{kind:'rect',rect:[75,190,7,360],fill:'#963e5b',name:'Accent'}],
 ['type.create',{x:110,y:185,text:'閉じても、',font:'Meiryo',size:95,weight:700,color:'#68303f',name:'Hook context'}],
 ['type.create',{x:110,y:330,text:'日記は、残る？',font:'Meiryo',size:91,weight:700,color:'#963e5b',name:'Question'}],
 ['type.create',{x:110,y:475,text:'missyou / 開発中',font:'Meiryo',size:43,weight:700,color:'#68303f',name:'App'}],
 ['type.create',{x:110,y:550,text:'開発中の実画面・検証データ',font:'Meiryo',size:30,color:'#7e6a63',name:'Truthful capture scope'}],
 ['file.placeEmbedded',{path:np(file('media/room-crop.png')),scale:80,fit:false,center:[580,1050],smartObject:true}],
 ['file.placeEmbedded',{path:np(file('media/natural/frame-000000.png')),scale:56,fit:false,center:[250,1490],smartObject:true}],
 ['type.create',{x:480,y:1530,text:'額も、花も。',font:'Meiryo',size:51,weight:700,color:'#68303f',name:'Real result'}],
 ['type.create',{x:480,y:1620,text:'同じ日記も。',font:'Meiryo',size:51,weight:700,color:'#963e5b',name:'Persistent diary'}],
 ['type.create',{x:110,y:1775,text:'PROJECT P / ぷい',font:'Meiryo',size:37,weight:700,color:'#68303f',name:'Author'}],
 ['type.create',{x:110,y:1850,text:'再起動後の実画面',font:'Meiryo',size:28,color:'#7e6a63',name:'Actual footage label'}]
];save('source/cover-commands.json',commands);const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'missyou118 revision02 actual room',background:'#f8f2e7',resolution:72})];for(const[id,p]of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(stage+'/missyou118-cover.pcraft')],'pc-cover-build.json');await run(PC,['convert',np(stage+'/missyou118-cover.pcraft'),np(stage+'/missyou118-cover.png'),'--format','png'],'pc-cover-export.json');copy(stage+'/missyou118-cover.pcraft',file('covers/missyou118-cover.pcraft'));copy(stage+'/missyou118-cover.png',file('covers/missyou118-cover.png'));
const info=parse((await run(PC,['info',np(file('covers/missyou118-cover.pcraft')),'--compact'],'pc-cover-info.json')).stdout);if(info.warnings?.length)throw Error('PhotoCraft cover warnings');save('qa/cover-binding.json',{nativeSha256:hash(file('covers/missyou118-cover.pcraft')),pngSha256:hash(file('covers/missyou118-cover.png')),actualPhotoCraft:true,actualPersistedRoomSourceSha256:hash(file('media/actual-persisted-room.png')),gameOrAppUiInvented:false,modelActualCoreFrame:0,frameAndFlowerNotCovered:true,scope:'Layered cover uses actual recorded persisted room crop and newly rendered specified Core model',visualReview:'PENDING'});console.log('Actual PhotoCraft editable cover and PNG created in owned revision02');
