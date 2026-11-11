import fs from 'node:fs';
import {file,np,PC,run,save} from './native.mjs';
const cards=[['01','朝いちばんに','コーヒーをいれる'],['02','初恋の思い出','まだ、ない。'],['03','子どもの頃の夢','パン屋'],['04','寝る前の習慣','読書'],['05','住んでみたい街','京都']];
for(const [num,question,answer] of cards){
 const dest=file(`projects/card-${num}.pcraft`); if(fs.existsSync(dest))throw Error('Existing card must be preserved: '+dest);
 const cmds=[['shape.create',{name:'Ivory paper',kind:'rect',rect:[0,0,880,154],fill:{gradient:{stops:[[0,'#cbb48b'],[.35,'#eee1c5'],[1,'#d5c19b']],angle:90}}}],['shape.create',{name:'Inner border',kind:'rect',rect:[8,8,864,138],fill:null,stroke:{width:2,color:'#a88958'}}],['type.create',{name:'Number',text:num,x:24,y:95,font:'Yu Mincho',weight:700,size:54,color:'#8c302f'}],['type.create',{name:'Question',text:question,x:120,y:57,font:'Yu Gothic',weight:700,size:31,color:'#695238'}],['type.create',{name:'Answer',text:answer,x:120,y:120,font:'Yu Mincho',weight:700,size:53,color:'#302319'}]];
 save(`source/card-${num}-commands.json`,cmds);const args=['run','--new',JSON.stringify({width:880,height:154,name:`TruthOrLie vertical ${num}`,background:'transparent',resolution:72})];for(const [id,p] of cmds)args.push('--cmd',id,'--params',JSON.stringify(p));
 await run(PC,[...args,'--out',np(dest)],`pc-card-${num}-build.json`);await run(PC,['convert',np(dest),np(file(`media/card-${num}.png`)),'--format','png'],`pc-card-${num}-render.json`);await run(PC,['info',np(dest),'--compact'],`pc-card-${num}-info.json`);
}
console.log('Five PhotoCraft card originals saved and rendered.');
