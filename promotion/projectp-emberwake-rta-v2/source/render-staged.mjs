/** Render picture while the mix is prepared; assemble only from the bound native picture. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';
import {episodes}from'./episodes.mjs';
import {EC,FC,np,file,hash,parse,save,run}from'./native.mjs';
export async function picture(e=episodes[0]){
 const id=e.id+'-'+e.slug,ec=file('projects/'+id+'.ecproj'),master=file('media/'+id+'-master.mov'),ecSha=hash(ec);
 await run(EC,['--project',np(ec),'render','--comp',e.compName,'--out',np(master),'--format','prores','--prores','4444','--audio','off','--progress','--json'],'qa/'+id+'/ec-render.json');
 if(hash(ec)!==ecSha)throw Error('Native project changed during picture render');
 const r={ecSha256:ecSha,masterSha256:hash(master),comp:e.compName,duration:e.duration};save('qa/'+id+'/picture.json',r);console.log('Picture ready '+id);return r;
}
export async function assemble(e=episodes[0]){
 const id=e.id+'-'+e.slug,ec=file('projects/'+id+'.ecproj'),fc=file('projects/'+id+'.fcproj'),master=file('media/'+id+'-master.mov'),mix=file('media/'+e.mix),out=file('videos/'+id+'.mp4'),q=JSON.parse(fs.readFileSync(file('qa/'+id+'/picture.json'))),ecSha=hash(ec),mixSha=hash(mix),masterSha=hash(master);
 if(q.ecSha256!==ecSha||q.masterSha256!==masterSha||q.duration!==e.duration||q.comp!==e.compName)throw Error('Picture/native binding is stale');
 const first=await run(FC,['--save-as',np(fc),'run','-'],'qa/'+id+'/fc-build.json',[{id:'file.newProject',params:{name:e.title}},{id:'file.newSequence',params:{name:e.compName,width:1080,height:1920,fps:30,sampleRate:48000,video:1,audio:1}},{id:'file.import',params:{paths:[np(master),np(mix)]}}].map(x=>JSON.stringify(x)).join('\n')+'\n');
 let items;for(const line of first.stdout.trim().split(/\r?\n/)){const x=parse(line);if(x.ok===false)throw Error(line);if(x.result?.items)items=x.result.items;}if(items?.length!==2)throw Error('Missing imported IDs');
 await run(FC,['--project',np(fc),'--save','run','-'],'qa/'+id+'/fc-place.json',[{id:'timeline.place',params:{item:items[0],track:'V1',seconds:0,duration:e.duration*254016000000,video:true,audio:false}},{id:'timeline.place',params:{item:items[1],track:'A1',seconds:0,duration:e.duration*254016000000,video:false,audio:true}}].map(x=>JSON.stringify(x)).join('\n')+'\n');
 const r=parse((await run(FC,['--project',np(fc),'exec','file.exportMedia',JSON.stringify({path:np(out),format:'h264',audio:true,audioCodec:'aac',bitrateMode:'crf',crf:17,hardwareEncoding:'off',gpuRendering:'off',wait:true})],'qa/'+id+'/fc-export.json')).stdout);
 if(r.offlineMedia?.length||hash(ec)!==ecSha||hash(mix)!==mixSha||hash(master)!==masterSha)throw Error('Offline or changed assembly source');
 const record={sha256:hash(out),ecSha256:ecSha,fcSha256:hash(fc),audioSha256:mixSha,masterSha256:masterSha,bytes:fs.statSync(out).size};save('qa/'+id+'/rendered.json',record);console.log('V2 MP4 ready');return record;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const mode=process.argv[2];if(mode==='picture')await picture();else if(mode==='assemble')await assemble();else if(mode==='both'){await picture();await assemble();}else throw Error('Use picture|assemble|both');}
