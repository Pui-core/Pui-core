import {file,np,PC,run,save} from './native.mjs';
const commands=[['shape.create',{kind:'rect',rect:[0,0,1080,1920],fill:'#101b25',name:'night'}],['shape.create',{kind:'rect',rect:[60,620,960,570],fill:'#e2bb76',name:'frame'}],['file.placeEmbedded',{path:np(file('media/fall-213.png')),scale:100,fit:false,center:[540,900],smartObject:true}],['shape.create',{kind:'rect',rect:[0,0,1080,590],fill:'#101b25',name:'headline'}],['shape.create',{kind:'rect',rect:[0,1230,1080,690],fill:'#101b25',name:'lower'}],['file.placeEmbedded',{path:np(file('media/natural-still.png')),scale:42,fit:false,center:[850,1540],smartObject:true}]];
const t=(name,text,x,y,size,color)=>commands.push(['type.create',{name,text,x,y,font:'Meiryo',weight:700,size,color}]);
t('brand','EMBERWAKE',75,120,64,'#f4e7cc');t('question1','落ちると、',75,300,112,'#f4e7cc');t('question2','記憶を失う？',75,460,100,'#f2c47f');t('scope','開発中の実画面',80,1370,44,'#d1d5cd');t('label','一話クリア後の再挑戦',80,1460,38,'#f4e7cc');t('creator','PROJECT P / ぷい',80,1650,34,'#d1d5cd');
save('source/cover-commands.json',commands);
const args=['run','--new',JSON.stringify({width:1080,height:1920,name:'EMBERWAKE fall question draft',background:'#101b25',resolution:72})];for(const [id,p] of commands)args.push('--cmd',id,'--params',JSON.stringify(p));
await run(PC,[...args,'--out',np(file('covers/emberwake-fall.pcraft'))],'pc-build.json');
console.log('PhotoCraft project saved; conversion and visual inspection pending.');
