import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Native PhotoCraft only. The background and full song stay in the owner's delivery.
const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const delivery=process.env.PROJECTP_DELIVERY||'/mnt/f/Videos/ProjectP-YouTube-medicate-2026-10-26/revision-01-publication';
const background=process.env.PROJECTP_THUMB_BACKGROUND||path.join(delivery,'assets/thumbnail-background.png');
const exe=process.env.PHOTOCRAFT_CLI||'/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const win=p=>execFileSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'}).trim();
for(const d of ['native/seed','thumbnail','qa','source'])fs.mkdirSync(path.join(delivery,d),{recursive:true});
const native=path.join(delivery,'native/medicate-youtube-thumbnail.pcraft');
const output=path.join(delivery,'thumbnail/medicate-youtube.png');
if([native,output].some(p=>fs.existsSync(p)))throw Error('Existing thumbnail kept. Choose a new delivery revision for a changed design.');
if(!fs.existsSync(background))throw Error('Owner-supplied accepted MV background is required.');
const sourceBackgroundSha256=sha(background);
const commandRuns=[];
function run(args,label){const p=spawnSync(exe,args,{encoding:'utf8',timeout:90000,maxBuffer:8000000,windowsHide:true});if(p.error||p.status!==0)throw Error(label+': '+(p.error?.message||p.stderr));commandRuns.push({stage:label,exit:p.status});return p.stdout;}
const glyphs={
 m:[[[10,39],[8,84],[18,47],[30,31],[43,34],[44,82],[51,49],[64,32],[76,35],[81,58],[78,85],[94,88]]],
 e:[[[17,59],[65,53],[63,37],[49,28],[30,34],[15,52],[15,72],[30,84],[51,83],[68,72]]],
 d:[[[62,49],[52,31],[32,31],[16,48],[15,69],[27,83],[45,76],[62,51],[72,5],[61,82],[78,88]]],
 i:[[[24,33],[23,75],[36,83],[49,74]],[[31,8],[30,10]]],
 c:[[[68,33],[52,27],[30,33],[13,51],[13,70],[26,84],[47,85],[64,74]]],
 a:[[[65,44],[51,29],[32,31],[16,48],[14,69],[25,82],[44,78],[60,60],[65,38],[61,80],[77,87]]],
 t:[[[39,9],[31,44],[28,72],[35,85],[52,80],[62,68]],[[7,41],[64,35]]]
};
function smooth(p){const out=[];for(let i=0;i<p.length-1;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],d=p[Math.min(p.length-1,i+2)],n=Math.max(5,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])));for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}}out.push(p.at(-1));return out;}
const steps=[
 {command:'file.placeEmbedded',params:{path:win(background),fit:true,smartObject:false,center:[640,360]}},
 {command:'layer.setProps',params:{name:'Accepted MV bedroom artwork'}},
 {command:'shape.create',params:{kind:'rect',rect:[0,0,1280,720],fill:'#030814',name:'Quiet blue shade'}},
 {command:'layer.setProps',params:{opacity:.11}},
 {command:'layer.new.layer',params:{name:'medicate — native pressure brush lettering'}}
];
const size=175,scale=size/100;
let x=74,seed=109026,strokes=0;
for(const [index,ch]of [...'medicate'].entries()){
 for(const raw of glyphs[ch]){const curve=smooth(raw);const points=curve.map(([px,py],i)=>{const t=i/Math.max(1,curve.length-1);const pressure=Math.max(.15,Math.min(1,(.30+.60*Math.pow(Math.sin(Math.PI*t),.48))*(.92+.08*Math.sin(t*8+index))));return[x+(px+.5*Math.sin(py*.09+index))*scale,145+(py+.6*Math.sin(px*.07+index))*scale,pressure,0,0,0,i*8];});steps.push({command:'paint.stroke',params:{points,preset:'Dry Bristle',brush:{pressureSize:true,pressureOpacity:false,roundness:.72,angle:-13,shapeDynamics:{enabled:false},smoothing:{enabled:false,amount:0}},size:size*.13,hardness:.96,opacity:.98,flow:.96,spacing:.055,smoothing:0,color:'#EAE7DF',seed:seed++}});strokes++;}
 x+=size*(ch==='i'?.43:ch==='m'?.95:.75);
}
steps.push(
 {command:'shape.create',params:{kind:'rect',rect:[88,345,92,3],fill:'#C6A77A',name:'Warm line'}},
 {command:'type.create',params:{x:85,y:410,text:'ぷい',font:'Yu Gothic UI',size:52,color:'#EAE7DF',name:'Artist — ぷい'}}
);
const actionsFile=path.join(delivery,'source/thumbnail-actions.json'),seedFile=path.join(delivery,'native/seed/medicate-youtube-thumbnail.pcraft');
fs.writeFileSync(actionsFile,JSON.stringify(steps,null,2)+'\n');
run(['run','--new',JSON.stringify({width:1280,height:720,background:'#030814',name:'medicate — YouTube thumbnail'}),'--out',win(seedFile)],'seed');
run(['batch','--actions',win(actionsFile),'--in',win(path.dirname(seedFile)),'--out',win(path.dirname(native)),'--format','pcraft'],'paint-and-type');
run(['convert',win(native),win(output),'--format','png'],'render');
const info=JSON.parse(run(['info',win(native),'--compact'],'inspect'));
if(info.width!==1280||info.height!==720||info.warnings?.length)throw Error('Native size/warnings mismatch');
if(!info.layers?.some(x=>x.name==='medicate — native pressure brush lettering')||!info.layers?.some(x=>x.text?.text==='ぷい'))throw Error('Editable title/artist layers missing');
const reopened=path.join(delivery,'native/medicate-youtube-thumbnail-reopened.pcraft'),roundtrip=path.join(delivery,'qa/thumbnail-reopened.png');
run(['run',win(native),'--out',win(reopened)],'reopen-save-from-delivery');
run(['convert',win(reopened),win(roundtrip),'--format','png'],'render-reopened');
if(sha(output)!==sha(roundtrip))throw Error('Native delivery roundtrip differs');
const small=path.join(delivery,'qa/thumbnail-320.png');
run(['run',win(output),'--cmd','image.imageSize','--params',JSON.stringify({width:320,height:180,resample:'lanczos'}),'--out',win(small),'--format','png'],'small-feed-preview');
const report={schemaVersion:1,issue:109,status:'NATIVE_RENDERED_ROUNDTRIP_MATCH_VISUAL_REVIEW_PENDING',canvas:{width:1280,height:720},thumbnail:{file:'thumbnail/medicate-youtube.png',sha256:sha(output),bytes:fs.statSync(output).size},native:{file:'native/medicate-youtube-thumbnail.pcraft',sha256:sha(native),reopenedFile:'native/medicate-youtube-thumbnail-reopened.pcraft',reopenedSha256:sha(reopened)},sourceBackgroundSha256,backgroundRole:'Previously accepted MV bedroom scene; no new image generation. Original artwork is retained only in owner delivery.',lettering:{text:'medicate',nativePressureBrushStrokes:strokes,latinTrajectoryOrigin:'Bespoke pen trajectories consistent with the accepted MV lettering',physicalHumanHandwriting:false},typeLayers:info.layers.filter(x=>x.text).map(x=>({name:x.name,text:x.text.text,bounds:x.bounds})),nativeLayers:info.layers.map(x=>({name:x.name,kind:x.kind,visible:x.visible,bounds:x.bounds})),nativeWarnings:info.warnings||[],nativeReopenedFromDelivery:true,pngRoundtripIdentical:true,commandRuns,visualReviewPerformed:false,rootNativePreviewPerformed:false,masterVideoOrAudioEdited:false,publicConfirmed:false};
fs.writeFileSync(path.join(delivery,'qa/thumbnail-native.json'),JSON.stringify(report,null,2)+'\n');
for(const file of ['thumbnail/medicate-youtube.png','qa/thumbnail-native.json']){const target=path.join(sourceRoot,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(delivery,file),target);}
console.log(JSON.stringify({thumbnail:report.thumbnail,native:report.native,status:report.status}));
