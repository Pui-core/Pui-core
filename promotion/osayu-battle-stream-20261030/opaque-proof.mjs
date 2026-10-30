/** Conventional numeric-only lossless rendering proof. Never AI-view these rasters. */
import fs from 'node:fs';import path from 'node:path';
import {root,native,run,ffRoot,save} from './runtime.mjs';
import {productionAudit} from './production-audit.mjs';
import {composition} from './audit.mjs';
import {characterBoxes,compName,reviewTimes,duration,fps,variantArg} from './plan.mjs';
const variant=variantArg();productionAudit(variant);
const dir=path.join(root,'qa','numeric-only',variant);fs.mkdirSync(dir,{recursive:true,mode:0o700});
const raw=async(args,name)=>{const chunks=[];await run(path.join(ffRoot,'bin/ffmpeg'),['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2',...args,'-f','rawvideo','pipe:1'],name,{env:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')},consumeStdout:b=>chunks.push(b)});return Buffer.concat(chunks);};
const main=path.join(root,'projects',variant+'-production.ecproj'),p=JSON.parse(fs.readFileSync(main));
const reference=structuredClone(p),c=composition(reference);c.kind.layers=c.kind.layers.filter(l=>l.name.startsWith('CHARACTER ORIGINAL FIXED'));
const referencePath=path.join(dir,'isolated-fixed-reference.ecproj');fs.writeFileSync(referencePath,JSON.stringify(reference));
await native(['--project',referencePath,'--save','info','--json'],variant+'-opaque-reference-reopen');
const referencePng=path.join(dir,'isolated-fixed-reference.png');
await native(['--project',referencePath,'render-frame','--comp',compName,'--time','0','--out',referencePng,'--json'],variant+'-opaque-reference-render');
const masks=[];
for(const b of characterBoxes(variant)){
 const layer=composition(p).kind.layers.find(l=>l.name==='CHARACTER ORIGINAL FIXED '+b.id),item=p.items[layer.source.item],asset=item.kind.path;
 // A downsampled 8-bit alpha can round a tiny translucent contribution to 255.
 // Require every source-resolution alpha in a padded reconstruction footprint to be 255.
 const rgba=await raw(['-i',asset,'-vf','format=rgba','-frames:v','1'],variant+'-'+b.id+'-source-alpha-mask');
 if(rgba.length!==b.sourceWidth*b.sourceHeight*4)throw Error('Source alpha dimensions differ');
 const stride=b.sourceWidth+1,prefix=new Uint32Array(stride*(b.sourceHeight+1));
 for(let y=0;y<b.sourceHeight;y++){let row=0;for(let x=0;x<b.sourceWidth;x++){row+=rgba[(y*b.sourceWidth+x)*4+3]===255?0:1;prefix[(y+1)*stride+x+1]=prefix[y*stride+x+1]+row;}}
 const radius=Math.ceil(b.sourceWidth/b.width*4),offsets=[];
 for(let y=4;y<b.height-4;y++)for(let x=4;x<b.width-4;x++){
  const cx=(x+.5)*b.sourceWidth/b.width-.5,cy=(y+.5)*b.sourceHeight/b.height-.5,x0=Math.max(0,Math.floor(cx-radius)),x1=Math.min(b.sourceWidth,Math.ceil(cx+radius+1)),y0=Math.max(0,Math.floor(cy-radius)),y1=Math.min(b.sourceHeight,Math.ceil(cy+radius+1));
  const translucent=prefix[y1*stride+x1]-prefix[y0*stride+x1]-prefix[y1*stride+x0]+prefix[y0*stride+x0];
  if(translucent===0)for(let n=0;n<3;n++)offsets.push((y*b.width+x)*3+n);
 }
 if(offsets.length<3000)throw Error('Opaque core too small');
 const referenceRgb=await raw(['-i',referencePng,'-vf',`crop=${b.width}:${b.height}:${b.x}:${b.y}:exact=1,format=rgb24`,'-frames:v','1'],variant+'-'+b.id+'-reference-core');
 masks.push({box:b,offsets,reference:referenceRgb});
}
const times=[...new Set([0,...reviewTimes,(duration*fps-1)/fps])],samples=[];
for(let i=0;i<times.length;i++){
 const png=path.join(dir,`native-${i}.png`);
 await native(['--project',main,'render-frame','--comp',compName,'--time',String(times[i]),'--out',png,'--json'],variant+'-opaque-native-'+i);
 for(const m of masks){const b=m.box,rgb=await raw(['-i',png,'-vf',`crop=${b.width}:${b.height}:${b.x}:${b.y}:exact=1,format=rgb24`,'-frames:v','1'],variant+'-'+b.id+'-opaque-'+i);let changed=0,maxDelta=0;
  for(const k of m.offsets){const d=Math.abs(rgb[k]-m.reference[k]);if(d)changed++;maxDelta=Math.max(maxDelta,d);}
  samples.push({seconds:times[i],character:b.id,opaquePixels:m.offsets.length/3,changedChannels:changed,maxDelta,exact:changed===0});
 }
 fs.unlinkSync(png);
}
const report={passed:samples.every(x=>x.exact),variant,method:'Native lossless PNG vs isolated native fixed-character reference; source-resolution alpha exactly 255 across reconstruction footprint padded by four target pixels; full-duration static structure checked separately',sampleTimes:times.length,samples,characterAIInputs:0,lossyTemporalMseUsedAsMotionGate:false};
save(path.join(root,'qa',variant+'-opaque-proof.private.json'),report);
if(!report.passed)throw Error('Native opaque core differs from isolated reference');
console.log(JSON.stringify({variant,passed:true,sampleTimes:times.length,characterComparisons:samples.length,changedChannels:0,characterAIInputs:0}));
