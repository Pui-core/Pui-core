import fs from 'node:fs';
import path from 'node:path';
import {root,run,save,hash} from './runtime.mjs';

// The only raster import is the pinned, character-free approved V2 stage.
// This is a material-based proposal, not an assertion of a livestream match.
export const backgroundSize=[1600,2844];
export const approvedPlateSHA='248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6';
export function backgroundActions(variant,plate){
 if(!['solo','collab'].includes(variant))throw Error('variant');
 const a=[],cmd=(command,params={})=>a.push({command,params});
 const layer=(p,opacity=100,glow)=>{cmd('shape.create',p);if(opacity!==100)cmd('layer.layerStyle.blendingOptions',{opacity});if(glow)cmd('layer.layerStyle.outerGlow',{color:glow,opacity:35,size:22,spread:0});};
 const curve=(name,knots,color,width,opacity=100)=>layer({kind:'path',name,path:{subpaths:[{closed:false,knots}]},fill:null,stroke:{color,width,cap:'round',join:'round'}},opacity);
 const glass=(name,knots,from,to,opacity)=>layer({kind:'path',name,path:{subpaths:[{closed:true,knots}]},fill:{gradient:{stops:[[0,from],[1,to]],angle:35,style:'linear'}},stroke:{color:'#E8EDFF',width:2,opacity:50}},opacity);
 cmd('file.placeEmbedded',{path:plate,scale:1600/941*100,fit:false,smartObject:true,center:[800,1422]});
 cmd('layer.renameLayer',{name:'APPROVED V2 MATERIAL - cherry blossom and glass stage'});
 if(variant==='collab')cmd('edit.transform.flipHorizontal');
 if(variant==='solo'){
  // One off-axis crescent frames the performer; the center is left quiet.
  glass('Mint crescent - left foreground',[
   {anchor:[115,590],out:[480,690]}, {anchor:[425,1370],in:[440,920],out:[390,1630]},
   {anchor:[160,2055],in:[250,1930],out:[255,1730]}, {anchor:[300,1360],in:[370,1600],out:[330,1000]},
   {anchor:[115,590],in:[240,740]}],'#C7FBEA','#4C7691',17);
  curve('Crescent highlight',[{anchor:[130,630],out:[450,790]},{anchor:[388,1385],in:[450,1040],out:[340,1770]},{anchor:[160,2020],in:[240,1860]}],'#B9FAE2',4,42);
  glass('Rose glass - opposite upper edge',[
   {anchor:[1420,240],out:[1020,390]},{anchor:[1160,710],in:[1040,590],out:[1250,820]},
   {anchor:[1490,1050],in:[1470,890],out:[1340,810]},{anchor:[1250,680],in:[1290,720],out:[1180,530]},
   {anchor:[1420,240],in:[1250,380]}],'#F9CADF','#8E8DB5',20);
  layer({kind:'roundedRect',name:'Glass title dock',rect:[440,390,720,118],radii:59,fill:'#29374E',stroke:{color:'#F2D9ED',width:2}},36);
  curve('Single focal stage reflected arc',[{anchor:[300,2390],out:[520,2480]},{anchor:[1300,2390],in:[1080,2480]}],'#EBC7F3',3,55);
 }else{
  // Two distinct diagonal conversation bays, with a quiet crossing between them.
  glass('Left conversation glass wing',[
   {anchor:[170,530],out:[560,430]},{anchor:[720,920],in:[730,570],out:[650,1160]},
   {anchor:[335,1720],in:[410,1420],out:[490,1550]},{anchor:[620,940],in:[670,1240],out:[640,640]},
   {anchor:[170,530],in:[440,520]}],'#EDD2F5','#6D628F',29);
  glass('Right conversation glass wing',[
   {anchor:[1430,720],out:[1030,570]},{anchor:[850,1150],in:[880,780],out:[940,1510]},
   {anchor:[1360,1950],in:[1200,1740],out:[1200,1740]},{anchor:[980,1170],in:[1040,1490],out:[940,910]},
   {anchor:[1430,720],in:[1140,770]}],'#BDF6E8','#446C8C',28);
  curve('Conversation crossing light',[
   {anchor:[110,1170],out:[480,1200]},{anchor:[805,1450],in:[590,1450],out:[1090,1450]},{anchor:[1490,1030],in:[1240,1120]}
  ],'#D8DBF9',3,42);
  layer({kind:'roundedRect',name:'Left broadcast window rim',rect:[230,440,560,120],radii:60,fill:'#51405C',stroke:{color:'#F1BEE1',width:2}},44);
  layer({kind:'roundedRect',name:'Right broadcast window rim',rect:[830,635,530,120],radii:60,fill:'#234856',stroke:{color:'#BCF4DE',width:2}},44);
  curve('Left stage light',[{anchor:[200,2320],out:[450,2410]},{anchor:[800,2320],in:[600,2410]}],'#F4C6ED',5,68);
  curve('Right stage light',[{anchor:[800,2380],out:[1000,2470]},{anchor:[1400,2380],in:[1190,2470]}],'#C2F6E7',5,68);
 }
 return a;
}
const pc='C:/Program Files/PhotoCraft/photocraft-cli.exe';
for(const variant of process.argv.slice(2).length?process.argv.slice(2):['solo','collab']){
 const plate=path.join(root,'media','approved-v2-stage-background.png');
 if(hash(plate)!==approvedPlateSHA)throw Error('Unverified background material');
 const base=path.join(root,'backgrounds',variant+'-glass-stage-v09-r01');
 if(fs.existsSync(base+'.pcraft'))throw Error('Preserve existing background');
 fs.mkdirSync(path.dirname(base),{recursive:true});
 const actions=backgroundActions(variant,plate);save(base+'-actions.json',actions);
 const args=['run','--new',JSON.stringify({width:backgroundSize[0],height:backgroundSize[1],background:'#202437',name:'Osayu '+variant+' glass stage v09 proposal',profile:'srgb'})];
 for(const a of actions)args.push('--cmd',a.command,'--params',JSON.stringify(a.params));
 args.push('--out',base+'.pcraft');
 await run(pc,args,variant+'-v09-background-build',{timeoutMs:600000});
 await run(pc,['info',base+'.pcraft'],variant+'-v09-background-reopen');
 await run(pc,['convert',base+'.pcraft',base+'.png'],variant+'-v09-background-export',{timeoutMs:300000});
 save(base+'-provenance.json',{variant,characterFree:true,externalMediaImports:[{path:plate,sha256:approvedPlateSHA,source:'Previously approved V2 character-free background; osayu-video project-context.md'}],actualStreamReference:false,referenceStatus:'PROPOSAL_BASED_ON_APPROVED_V2; actual stream safe plate unidentified',source:'PhotoCraft embedded material, Bezier glass shapes, rounded docks and reflected curves',project:base+'.pcraft',projectSHA256:hash(base+'.pcraft'),png:base+'.png',pngSHA256:hash(base+'.png'),width:backgroundSize[0],height:backgroundSize[1],actionCount:actions.length,creativeAdoption:'UNVERIFIED'});
 console.log(JSON.stringify({variant,backgroundSaved:true,png:base+'.png'}));
}
