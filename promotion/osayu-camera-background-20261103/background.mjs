import fs from 'node:fs';
import path from 'node:path';
import {root,run,save,hash} from './runtime.mjs';

// Original, character-free vector artwork. No reference image is imported.
export function backgroundActions(variant){
  if(!['solo','collab'].includes(variant))throw Error('variant');
  const a=[];
  const shape=p=>a.push({command:'shape.create',params:p});
  const grad=(c,d,angle=90)=>({gradient:{stops:[[0,c],[1,d]],angle,style:'linear',scale:100}});
  const ellipse=(name,r,fill,stroke)=>shape({kind:'ellipse',name,rect:r,fill,stroke:stroke?{color:stroke,width:4}:null});
  const rounded=(name,r,radius,fill,stroke)=>shape({kind:'roundedRect',name,rect:r,radii:radius,fill,stroke:stroke?{color:stroke,width:3}:null});
  const curve=(name,knots,color,width)=>shape({kind:'path',name,path:{subpaths:[{closed:false,knots}]},fill:null,stroke:{color,width,cap:'round',join:'round'}});
  a.push({command:'paint.gradient',params:{from:[160,0],to:[1420,2400],colors:variant==='solo'?['#102E38','#142336','#26203D']:['#28213F','#162C42','#101E2C'],dither:true}});
  if(variant==='solo'){
    ellipse('Velvet central alcove',[95,260,1410,1870],grad('#254B55','#102735'));
    ellipse('Mint architectural arch',[165,330,1270,1740],null,'#62CBB8');
    ellipse('Inset depth rim',[198,374,1204,1660],null,'#326873');
    ellipse('Upper rose halo',[450,100,950,580],null,'#D58CB4');
    curve('Left flowing ribbon',[
      {anchor:[-80,500],out:[240,400]},
      {anchor:[300,1030],in:[300,700],out:[300,1400]},
      {anchor:[-40,1900],in:[120,1580]}],'#3D8989',58);
    curve('Right pearl ribbon',[
      {anchor:[1700,380],out:[1360,600]},
      {anchor:[1290,1200],in:[1260,850],out:[1320,1540]},
      {anchor:[1660,2050],in:[1390,1900]}],'#B97CA3',36);
    rounded('Soft live-console housing',[420,380,760,135],64,grad('#254E59','#193945'),'#82CCBF');
    for(let i=0;i<3;i++)ellipse('Console lamp '+i,[470+i*45,433,16,16],['#A9F5DB','#FFC6DB','#ECE6BD'][i]);
    rounded('Console blank display',[650,425,440,30],15,'#326773');
    ellipse('Raised stage shadow',[250,1710,1100,300],'#10202C');
    ellipse('Raised stage top',[250,1660,1100,260],grad('#4C777B','#28434E'));
    ellipse('Stage edge',[250,1660,1100,260],null,'#80BFB5');
    rounded('Floating left chat pod',[205,860,150,310],64,grad('#31616B','#203E52'),'#608B98');
    for(let i=0;i<3;i++)rounded('Pod signal '+i,[239,930+i*59,82,13],6,'#8ABFB9');
    ellipse('Upper light orb',[270,320,64,64],'#EDC4D7');
    ellipse('Lower light orb',[1315,1550,48,48],'#BDEBD7');
  }else{
    ellipse('Left conversation bay',[-90,290,1120,1760],grad('#3E3559','#1C2940'));
    ellipse('Right conversation bay',[580,490,1110,1750],grad('#275C64','#142C41'));
    ellipse('Left coral arch',[-30,360,1000,1600],null,'#C995B6');
    ellipse('Right mint arch',[640,555,990,1590],null,'#72C8BF');
    curve('Connecting S ribbon',[
      {anchor:[100,300],out:[1100,100]},
      {anchor:[1260,850],in:[1360,430],out:[1130,1250]},
      {anchor:[320,1680],in:[300,1350],out:[320,2080]},
      {anchor:[1510,2300],in:[750,2360]}],'#558B9E',45);
    curve('Rose conversation thread',[
      {anchor:[-100,700],out:[380,620]},
      {anchor:[780,1230],in:[480,960],out:[1100,1520]},
      {anchor:[1750,1430],in:[1400,1570]}],'#9679AB',22);
    rounded('Two-window upper console',[245,440,570,120],55,grad('#644766','#352D4B'),'#D1A2C2');
    rounded('Two-window lower console',[850,630,500,120],55,grad('#356D72','#214350'),'#89CFC8');
    for(let i=0;i<3;i++)ellipse('Left console lamp '+i,[290+i*38,486,14,14],'#F4C7E0');
    for(let i=0;i<3;i++)ellipse('Right console lamp '+i,[895+i*38,676,14,14],'#B4F3DF');
    ellipse('Left stage shadow',[130,1715,700,240],'#131E30');
    ellipse('Left stage platform',[130,1675,700,220],grad('#705877','#34384F'),'#B991B2');
    ellipse('Right stage shadow',[770,1780,700,240],'#102532');
    ellipse('Right stage platform',[770,1740,700,220],grad('#50868A','#243F52'),'#8ABCB8');
    rounded('Side rounded chat',[1300,1080,155,330],70,grad('#2A4F63','#203448'),'#6A91A6');
    for(let i=0;i<3;i++)rounded('Chat line '+i,[1333,1160+i*57,87,14],7,'#8FBEC8');
  }
  // Sparse floating lights, not a repeated full-frame grid.
  for(const [i,x,y,r] of [[0,190,1500,9],[1,1420,380,8],[2,1180,2110,12],[3,420,2160,7],[4,1400,940,6]])ellipse('Ambient light '+i,[x,y,r,r],'#B9C9CF');
  return a;
}

const pc='C:/Program Files/PhotoCraft/photocraft-cli.exe';
for(const variant of process.argv.slice(2).length?process.argv.slice(2):['solo','collab']){
  const base=path.join(root,'backgrounds',variant+'-curved-studio-v07');
  if(fs.existsSync(base+'.pcraft'))throw Error('Preserve existing background');
  fs.mkdirSync(path.dirname(base),{recursive:true});
  const actions=backgroundActions(variant);
  save(base+'-actions.json',actions);
  const args=['run','--new',JSON.stringify({width:1600,height:2400,background:'#142B3B',name:'Osayu '+variant+' curved studio',profile:'srgb'})];
  for(const a of actions)args.push('--cmd',a.command,'--params',JSON.stringify(a.params));
  args.push('--out',base+'.pcraft');
  await run(pc,args,variant+'-background-build',{timeoutMs:600000});
  await run(pc,['info',base+'.pcraft'],variant+'-background-reopen');
  await run(pc,['convert',base+'.pcraft',base+'.png'],variant+'-background-export',{timeoutMs:300000});
  save(base+'-provenance.json',{variant,characterFree:true,externalMediaImports:0,actualStreamReference:false,source:'Original PhotoCraft gradient, Bezier curves and rounded vector shapes',project:base+'.pcraft',projectSHA256:hash(base+'.pcraft'),png:base+'.png',pngSHA256:hash(base+'.png'),width:1600,height:2400,actionCount:actions.length,creativeAdoption:'UNVERIFIED'});
  console.log(JSON.stringify({variant,backgroundSaved:true,png:base+'.png'}));
}
