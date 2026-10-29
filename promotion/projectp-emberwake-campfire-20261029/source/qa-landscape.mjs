import fs from 'node:fs';
import {stage,native,ff,run,ffRoot,hash,save} from './background.mjs';
const root=stage+'/landscape-v01',q=root+'/qa/final-v02',video=root+'/videos/emberwake-campfire-landscape-full-v02.mp4';
fs.mkdirSync(q,{recursive:true});
const layout=JSON.parse(fs.readFileSync(root+'/qa/full-v02-layout.json'));
const packets={};
for(const[id,file]of[['vertical',stage+'/pv-v01/videos/emberwake-campfire-pv60-v03.mp4'],['landscape',video]]){const r=await run(ffRoot+'/bin/ffprobe',['-v','error','-show_packets','-show_data_hash','sha256','-show_entries','packet=codec_type,pts_time,data_hash','-of','json',file],q+'/'+id+'-packets.json',{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});packets[id]=JSON.parse(r.stdout).packets;}
const aud=p=>p.filter(p=>p.codec_type==='audio'),a=aud(packets.vertical),b=aud(packets.landscape);
if(a.length!==b.length||a.some((p,i)=>p.data_hash!==b[i].data_hash||p.pts_time!==b[i].pts_time))throw Error('Landscape AAC differs');
const pts=packets.landscape.filter(p=>p.codec_type==='video').map(p=>Number(p.pts_time)).sort((a,b)=>a-b);
if(pts.length!==1800||pts.some((t,i)=>Math.abs(t-i/30)>1e-6))throw Error('Irregular landscape PTS');
const frames=[];for(let i=0;i<layout.shots.length;i++){const s=layout.shots[i],at=Math.round((s.a+s.b)*15)/30,file=q+'/scene-'+String(i).padStart(2,'0')+'.png';await ff(['-ss',String(at),'-i',video,'-frames:v','1','-vf','scale=480:270',file],q+'/scene-'+i+'.json');frames.push({id:s.id,at,span:[s.a,s.b],file,sha256:hash(file),copy:s.copy||''});}
await ff(['-i',q+'/scene-%02d.png','-vf','tile=6x5','-frames:v','1',q+'/all-scenes.png'],q+'/all-scenes.json');
const transitions=[];for(const at of [1.6,54.4,56.4]){const dir=q+'/transition-'+at;fs.mkdirSync(dir);const start=(Math.round(at*30)-8)/30;await ff(['-ss',String(start),'-i',video,'-frames:v','22','-vf','scale=384:216',dir+'/frame-%02d.png'],dir+'/extract.json');await ff(['-i',dir+'/frame-%02d.png','-vf','tile=6x4','-frames:v','1',dir+'/contact.png'],dir+'/contact.json');transitions.push({at,frames:22,start,contact:dir+'/contact.png'});}
for(const at of [58,59.7])await ff(['-ss',String(at),'-i',video,'-frames:v','1',q+'/model-'+at+'.png'],q+'/model-'+at+'.json');
const originalSha=hash(layout.project),script=q+'/read-remaps.jsx';fs.writeFileSync(script,"app.run('keys.selectAll',{});writeLn(JSON.stringify(app.run('keys.info',{}).filter(function(q){return q.path==='timeRemap';})));\n");
const kr=await native('effectcraft',['--project',layout.project,'script',script,'--json'],q+'/native-remaps.json');if(hash(layout.project)!==originalSha)throw Error('Native read changed project');
const keys=JSON.parse(JSON.parse(kr.stdout).output),groups=Object.values(Object.groupBy(keys,k=>k.layer)).map(g=>g.sort((a,b)=>a.compTime-b.compTime));
if(groups.length!==27||keys.length!==54||groups.some(g=>g.length!==2||g[1].value<g[0].value))throw Error('Native default or reverse remap keys');
const sourceAssets=JSON.parse(fs.readFileSync(stage+'/pv-v01/source-assets-full-clean.json')).assets;
for(const s of layout.shots){const expectedEnd=Math.min(sourceAssets.find(a=>a.id===s.asset).duration-1/30,s.from+(s.b-s.a)*(s.rate||1));const g=groups.find(g=>Math.abs(g[0].compTime-s.a)<1e-6&&Math.abs(g[1].compTime-s.b)<1e-6);if(!g||Math.abs(g[0].value-s.from)>1e-6||Math.abs(g[1].value-expectedEnd)>1e-6)throw Error('Wrong shot remap '+s.id);}
const core=groups.find(g=>Math.abs(g[0].compTime-56.4)<1e-6&&Math.abs(g[1].compTime-60)<1e-6);if(!core||core[0].value!==0||Math.abs(core[1].value-3.6)>1e-6)throw Error('Core source offset');
save(q+'/summary.json',{issue:151,file:video,sha256:hash(video),all1800PtsUniform30:true,audio:{originalAacPackets:a.length,allPayloadAndPtsIdentical:true,reuseMeasuredLufs:-15.9,reuseTruePeakDbFS:-2,all60OneSecondBinsNonzeroInherited:true},native:{projectSha256:originalSha,readDidNotChangeProject:true,remapLayers:groups.length,keys:keys.length,allOnlyTwoEndpoints:true,coreSource:[0,3.6],coreGlobal:[56.4,60]},frames,transitions,actualVisualReview:'PENDING',subjectiveListen:false,fullRealtimePlayback:false,published:false,nasDelivery:false});
console.log(JSON.stringify({ready:true,contact:q+'/all-scenes.png',sha256:hash(video)}));
