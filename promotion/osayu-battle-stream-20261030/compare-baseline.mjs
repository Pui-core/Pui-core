/** Optional private saved-native baseline. Never copies paths or image fingerprints into public output. */
import fs from 'node:fs';import path from 'node:path';
import {root,save} from './runtime.mjs';
import {composition,prop,projected,ticks} from './audit.mjs';
import {trackWindows,variantArg} from './plan.mjs';
const variant=variantArg();
const baselineFile=process.env.OSAYU158_BASELINE;
if(!baselineFile)throw Error('Explicit private PM saved-camera summary required');
const baseline=JSON.parse(fs.readFileSync(baselineFile));
const old=baseline.find(x=>x.version==='v03');if(!old?.rigs?.length)throw Error('v03 saved-native baseline missing');
// The last two saved keys are the post-entrance hold, not the initial punch.
const oldHolds=old.rigs.map(r=>{
 const pos=r.transform.find(x=>x.path==='transform/position').keys.slice(-2),scale=r.transform.find(x=>x.path==='transform/scale').keys.slice(-2);
 const screen=(point,p,s)=>[p[0]+(point[0]-540)*s[0]/100,p[1]+(point[1]-960)*s[1]/100];
 const a=screen([540,960],pos[0][1],scale[0][1]),b=screen([540,960],pos[1][1],scale[1][1]);
 return {from:pos[0][0],to:pos[1][0],screenTravelPixels:Math.hypot(b[0]-a[0],b[1]-a[1]),scaleTravelPercent:Math.abs(scale[1][1][0]-scale[0][1][0])};
});
const p=JSON.parse(fs.readFileSync(path.join(root,'projects',variant+'-neutral-probe.ecproj'))),layers=composition(p).kind.layers,rig=layers.find(x=>x.name.startsWith('STAGE CAMERA'));
const current=trackWindows.map(w=>{
 const keys=prop(rig,'position').keys.filter(k=>k.time>=w.from*ticks&&k.time<=w.to*ticks),points=keys.map(k=>projected({parent:rig.id,props:{children:[{match:'transform',children:[{match:'position',value:{v:[540,480,0]}},{match:'anchor',value:{v:[0,0,0]}},{match:'scale',value:{v:[100,100,100]}}]}]}},rig,k.time/ticks));
 const travel=Math.max(...points.map(x=>x[0]))-Math.min(...points.map(x=>x[0]));
 return {id:w.id,from:w.from,to:w.to,screenTravelOfFixedStageReferencePixels:travel,cameraPositionSpanPixels:Math.max(...keys.map(k=>k.value.v[0]))-Math.min(...keys.map(k=>k.value.v[0]))};
});
const actual=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-native-video-tracking.json')));
const report={passed:oldHolds.every(x=>x.screenTravelPixels===0&&x.scaleTravelPercent===0)&&current.every(x=>x.screenTravelOfFixedStageReferencePixels>20)&&actual.passed,definition:'screen = native position + (world - native anchor) * native scale; source pixels in each saved composition. Old anchors are [540,960], new [540,480]. Compare post-entry camera response, not different artwork.',old:{savedRigs:oldHolds.length,postEntry:oldHolds,oldVideoRerendered:false},current:{tracks:current,nativeRenderedFrames:actual.decodedFrames,nativeRenderedMaxTrackedErrorPixels:actual.maxTrackedErrorPixels},backgroundAccepted:false,productionComplete:false};
save(path.join(root,'qa',variant+'-baseline-comparison.json'),report);if(!report.passed)throw Error('Post-entry camera movement comparison failed');
console.log(JSON.stringify({passed:report.passed,oldPostEntryStationaryRigs:oldHolds.length,newMovingTracks:current.length,nativeRenderedFrames:actual.decodedFrames}));
