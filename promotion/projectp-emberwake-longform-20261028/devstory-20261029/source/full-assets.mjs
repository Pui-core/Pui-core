import fs from'node:fs';import path from'node:path';import{spawnSync}from'node:child_process';import{stage,ff as invokeFF,native,save,hash}from'./background.mjs';
const root=stage+'/devstory-v01',cap='/home/pui/tmp/projectp146-capture/output',assets={};
for(const d of['media','qa/assets','projects/photocraft','private/v-motion-old','private/v-motion-new'])fs.mkdirSync(root+'/'+d,{recursive:true});
async function ff(args,receipt){const out=args.at(-1);if(fs.existsSync(out)&&fs.statSync(out).size>0&&fs.existsSync(receipt)){const j=JSON.parse(fs.readFileSync(receipt));if(j.code===0&&JSON.stringify(j.args.slice(-args.length))===JSON.stringify(args))return j;throw Error('Existing asset has unmatched receipt '+out);}return invokeFF(args,receipt);}
const pngSize=p=>{const b=fs.readFileSync(p);return[b.readUInt32BE(16),b.readUInt32BE(20)];};
const add=(name,file,kind,seconds,provenance)=>assets[name]={file,kind,seconds,provenance,sha256:hash(file)};
async function cropPC(name,source,box){const original=root+'/media/'+name+'-source.png',pc=root+'/projects/photocraft/'+name+'.pcraft',out=root+'/media/'+name+'.png';fs.copyFileSync(source,original);await native('photocraft',['run',original,'--cmd','image.crop','--params',JSON.stringify({x:box[0],y:box[1],width:box[2],height:box[3],deleteCroppedPixels:true,contentAware:false}),'--out',pc],root+'/qa/assets/pc-'+name+'-save.json');await native('photocraft',['info',pc,'--compact'],root+'/qa/assets/pc-'+name+'-reopen.json');await native('photocraft',['convert',pc,out],root+'/qa/assets/pc-'+name+'-export.json');add(name,out,'image',null,{sourceSha:hash(source),box,photocraftSha:hash(pc),kind:'actual source crop; no generated game UI'});}
console.log(JSON.stringify({phase:'full-assets',pid:process.pid,root}));
for(const key of['tap0','tap2','hold60','buffer1','buffer7','repeat20','tap6','buffer12']){
 const base=['tap6','buffer12'].includes(key)?'jx-':'j-',out=root+'/media/j-'+key+'.mp4';
 await ff(['-framerate','60','-i',cap+'/'+base+'old/'+key+'/frame-%04d.png','-framerate','60','-i',cap+'/'+base+'new/'+key+'/frame-%04d.png','-filter_complex','[0:v]fps=30,scale=490:456:flags=neighbor[o];[1:v]fps=30,scale=490:456:flags=neighbor[n];[o]pad=1140:456:0:0:color=0xf5f2ed[p];[p][n]overlay=650:0[out]','-map','[out]','-t','3','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',out],root+'/qa/assets/j-'+key+'.json');add('j-'+key,out,'video',3,{type:'actual fixed-camera automated physics',sourceOld:cap+'/'+base+'old/'+key,sourceNew:cap+'/'+base+'new/'+key,relativeLandingComparison:key.startsWith('buffer')});
}
for(const[v,keys]of[['old',['conflict']],['new',['conflict','safe_floor','airborne']]])for(const key of keys){const out=root+'/media/c-'+v+'-'+key+'.mp4';await ff(['-framerate','60','-i',cap+'/c-'+v+'/'+key+'/frame-%04d.png','-vf','fps=30,scale=600:-2:flags=neighbor','-t','4','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',out],root+'/qa/assets/c-'+v+'-'+key+'.json');add('c-'+v+'-'+key,out,'video',4,{type:'explicit initial state fixture then real input and physics',capture:cap+'/c-'+v+'/capture.json'});}
for(const[v,dir,suffix]of[['old','emberwake-detail64-before02','display'],['new','emberwake-detail64-preview03','native']])for(const pose of['idle','carry_idle','walk']){
 const source='/home/pui/tmp/'+dir+'/'+pose+'-'+suffix+'.png',dest=root+'/media/v-'+v+'-'+pose+'-full.png';fs.copyFileSync(source,dest);add('v-'+v+'-'+pose+'-full',dest,'image',null,{type:'same camera same source state fixture',sourceSha:hash(source)});
 if(pose!=='walk')await cropPC('v-'+v+'-'+pose,source,[185,445,140,130]);
}
for(const[v,commit,file,cell]of[['old','fc810ca','traveler_motion.png',24],['new','40aebcb','traveler_detail64.png',64]]){
 const source=root+'/media/atlas-'+v+'.png',r=spawnSync('git',['-C','/mnt/f/dev/EMBERWAKE','show',commit+':assets/characters/'+file]);if(r.status!==0)throw Error('atlas '+v);fs.writeFileSync(source,r.stdout);await cropPC('atlas-'+v+'-first',source,[0,0,cell,cell]);
}
// Normalize recorded image-sequence time from actual 3 physics ticks/sample.
// Only a character-following editorial crop is used, so no socket solution is revealed.
for(const[v,dir]of[['old','emberwake-visual33-motion02'],['new','emberwake-detail64-motion01']]){
 const base='/home/pui/tmp/'+dir,j=JSON.parse(fs.readFileSync(base+'/scope.json')),frames=j.samples.filter(s=>s.step<=144),seq=root+'/private/v-motion-'+v;
 for(let i=0;i<frames.length;i++){
  const s=frames[i],p=base+'/'+String(s.step).padStart(3,'0')+'.png',[w,h]=pngSize(p),sx=w/480,sy=h/270,x=Math.round((s.position[0]-s.camera_center[0]+240-32)*sx),y=Math.round((s.position[1]-s.camera_center[1]+135-38)*sy),out=seq+'/frame-'+String(i).padStart(4,'0')+'.png';
  await ff(['-i',p,'-vf',`crop=${Math.round(64*sx)}:${Math.round(58*sy)}:${x}:${y},scale=384:348:flags=neighbor`,'-frames:v','1',out],root+'/qa/assets/v-motion-'+v+'-'+i+'.json');
 }
 const out=root+'/media/v-motion-'+v+'.mp4';await ff(['-framerate','20','-i',seq+'/frame-%04d.png','-vf','fps=30','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',out],root+'/qa/assets/v-motion-'+v+'.json');add('v-motion-'+v,out,'video',frames.length/20,{type:'character-following editorial crop of real synchronized physics frames',sampleStep:3,physicsHz:60,frames:frames.map(s=>({step:s.step,physics:s.physics_frame,position:s.position,state:s.visual_state})),sourceScopeSha:hash(base+'/scope.json')});
}
const hints='/home/pui/tmp/projectp146-capture/copies/hints/artifacts';
for(const name of fs.readdirSync(hints).filter(n=>n.startsWith('hints-')&&n.endsWith('.png'))){
 const id=name.slice(6,-4),source=hints+'/'+name;await cropPC('h-'+id+'-banner',source,[180,42,135,48]);
 if(id.startsWith('nearby-unlocked'))await cropPC('h-'+id+'-prompt',source,[215,125,120,70]);
 if(id==='touch-spent'||id==='touch-restored'||id==='touch-locked')await cropPC('h-'+id+'-buttons',source,[367,145,108,120]);
}
const paper=root+'/media/editorial-paper.png';fs.copyFileSync(stage+'/pilot02/media/editorial-paper.png',paper);fs.copyFileSync(stage+'/pilot02/projects/editorial-paper.pcraft',root+'/projects/photocraft/editorial-paper.pcraft');add('paper',paper,'image',null,{type:'PhotoCraft editable native graphic',original:stage+'/pilot02/projects/editorial-paper.pcraft'});
const opening=root+'/media/opening.mov';fs.copyFileSync(stage+'/pilot02/media/pilot02-picture.mov',opening);add('opening',opening,'video',32,{type:'accepted candidate revised native opening, audio from r4',pictureSha:hash(opening)});
save(root+'/source/assets.json',assets);console.log(JSON.stringify({assetsReady:true,count:Object.keys(assets).length,root}));
