import fs from 'node:fs';
import path from 'node:path';
process.env.OSAYU_TELOP_ROOT||='/home/pui/Videos/Osayu-Telop/2026-10-29/revision2';
const {ROOT,author,run,win}=await import('./build.mjs');
const input=path.resolve(process.argv[2]||path.join(ROOT,'material-prototypes/sdf-jelly-v4'));
const stage='/mnt/c/Users/pui/AppData/Local/Temp/osayu-jelly-149-r2';
for(const p of [stage,path.join(ROOT,'qa'),path.join(ROOT,'design')])fs.mkdirSync(p,{recursive:true});
const words=[['arigatou-384','ありがとう'],['welcome-256','初見さん歓迎']];
const steps=[['type.create',{text:'おさゆのぷくシール',font:'Zen Maru Gothic',fontStyle:'Black',weight:900,size:42,x:90,y:88,color:'#4d6a76',name:'見本の見出し'}]];
for(let i=0;i<words.length;i++){
 const[dir,label]=words[i],base=path.join(input,dir),p=fs.readFileSync(path.join(base,'composite.png'));
 const width=p.readUInt32BE(16),height=p.readUInt32BE(20),scale=Math.min(1560/width,370/height)*100;
 for(const layer of ['shadow','whiteborder','rim','body','reflection']){
  steps.push(['file.placeEmbedded',{path:win(path.join(base,layer+'.png')),scale,fit:false,smartObject:false,center:[900,350+i*520]}]);
  steps.push(['layer.setProps',{name:label+' / '+layer}]);
 }
}
const native=path.join(stage,'jelly-preview.pcraft'),png=path.join(stage,'jelly-preview.png');
author('jelly-composed-preview',1800,1130,steps,native,'#fffaf3');
run(['convert',win(native),win(png),'--format','png'],'jelly-preview-export');
for(const[file,name]of[[native,'jelly-preview.pcraft'],[png,'jelly-preview.png']])fs.copyFileSync(file,path.join(ROOT,'design',name));
console.log(path.join(ROOT,'design/jelly-preview.png'));
