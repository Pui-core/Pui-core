import fs from'node:fs';import{stage,native,save,hash}from'./background.mjs';
const root=stage+'/devstory-v01',assets=JSON.parse(fs.readFileSync(root+'/source/assets-graphs.json'));
for(const v of['old','new'])for(const[name,box]of[['face',[215,470,80,58]],['sleeve',[224,505,68,45]],['feet',[214,524,88,35]]]){
 const source=assets['v-'+v+'-idle-full'].file,pc=root+'/projects/photocraft/v-'+v+'-'+name+'.pcraft',out=root+'/media/v-'+v+'-'+name+'.png';
 await native('photocraft',['run',source,'--cmd','image.crop','--params',JSON.stringify({x:box[0],y:box[1],width:box[2],height:box[3],deleteCroppedPixels:true,contentAware:false}),'--out',pc],root+'/qa/assets/v-'+v+'-'+name+'-save.json');await native('photocraft',['info',pc,'--compact'],root+'/qa/assets/v-'+v+'-'+name+'-reopen.json');await native('photocraft',['convert',pc,out],root+'/qa/assets/v-'+v+'-'+name+'-export.json');
 assets['v-'+v+'-'+name]={file:out,kind:'image',width:box[2],height:box[3],sha256:hash(out),provenance:{sourceSha:hash(source),box,photocraftSha:hash(pc),type:'matching editorial detail crop of real renderer image'}};
}
save(root+'/source/assets-details.json',assets);console.log(JSON.stringify({detailsReady:true,count:Object.keys(assets).length}));
