import fs from'node:fs';import{stage,native,save,hash}from'./background.mjs';
const root=stage+'/devstory-v01',base='/home/pui/tmp/projectp146-capture/output',assets=JSON.parse(fs.readFileSync(root+'/source/assets-details.json'));
for(const kind of['tap0','tap2','tap6','hold60','buffer1','buffer7','buffer12','repeat20']){
 const extra=['tap6','buffer12'].includes(kind),j=['old','new'].map(v=>JSON.parse(fs.readFileSync(base+'/'+(extra?'jx-':'j-')+v+'/capture.json')).cases.find(c=>c.case===kind));
 const count=({tap0:52,tap2:32,tap6:38,hold60:56,buffer1:110,buffer7:80,buffer12:70,repeat20:180})[kind];for(const c of j)c.samples=c.samples.slice(0,count);const yScale=260/Math.max(...j.flatMap(c=>c.samples.map(s=>1160-s.position[1])));
 const pc=root+'/projects/photocraft/graph-'+kind+'-layout02.pcraft',out=root+'/media/graph-'+kind+'-layout02.png',cmd=[['shape.create',{kind:'rect',rect:[75,365,1130,2],fill:'#9da7ac',name:'Common zero height'}]];
 for(let i=0;i<2;i++){const cSampleCount=j[i].samples.length,knots=j[i].samples.map((s,index)=>[80+index/(cSampleCount-1)*1120,365-(1160-s.position[1])*yScale]);cmd.push(['shape.create',{kind:'path',path:{subpaths:[{closed:false,knots}]},fill:null,stroke:{width:4,color:i?'#267c68':'#d64949',join:'round'},name:i?'Recorded new trajectory':'Recorded old trajectory'}]);}
 const args=['run','--new',JSON.stringify({width:1280,height:420,name:'Measured jump graph '+kind,background:'#f5f2ed'})];for(const[id,params]of cmd)args.push('--cmd',id,'--params',JSON.stringify(params));
 await native('photocraft',[...args,'--out',pc],root+'/qa/assets/graph-'+kind+'-save.json');await native('photocraft',['info',pc,'--compact'],root+'/qa/assets/graph-'+kind+'-reopen.json');await native('photocraft',['convert',pc,out],root+'/qa/assets/graph-'+kind+'-export.json');
 assets['graph-'+kind]={file:out,kind:'image',width:1280,height:420,sha256:hash(out),provenance:{type:'PhotoCraft paths from actual physics sample positions, editorial graph',photocraftSha:hash(pc),case:kind,graphScale:yScale,plotCount:count,oldHeight:j[0].height,newHeight:j[1].height,samples:j.map(c=>c.samples.map(s=>({step:s.step,y:s.position[1],held:s.space_held,floor:s.on_floor})))}};
}
save(root+'/source/assets-layout02.json',assets);console.log(JSON.stringify({graphsReady:true,assets:Object.keys(assets).length}));
