/** Conventional exterior alpha floodfill. Never displays an image or raw pixels. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const originalPath = '/mnt/f/Users/pui/Documents/gara/立ち絵.jpg';
export const originalSha = '89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2';
export const magick = '/mnt/c/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe';
const WIDTH=905, HEIGHT=1810, PIXELS=WIDTH*HEIGHT;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
export const hashFile = filename => hash(fs.readFileSync(filename));
export function nativePath(filename) {
  const r=spawnSync('wslpath',['-w',path.resolve(filename)],{encoding:'utf8',timeout:10000});
  if(r.error||r.status!==0||!r.stdout?.trim())throw Error('Native path conversion failed.');
  return r.stdout.trim();
}
function execute(args, raw=false) {
  const r=spawnSync(magick,args,{encoding:raw?undefined:'utf8',timeout:120000,maxBuffer:24*1024*1024,windowsHide:true});
  if(r.error||r.status!==0)throw Error('ImageMagick operation failed: '+(r.error?.message||String(r.stderr).slice(-1500)));
  return raw?r.stdout:r.stdout.trim();
}
function rgb(filename) {
  const bytes=execute([nativePath(filename),'-alpha','off','-depth','8','RGB:-'],true);
  if(bytes.length!==PIXELS*3)throw Error('Unexpected decoded RGB byte count.');
  return bytes;
}
export function alphaBytes(filename) {
  const bytes=execute([nativePath(filename),'-alpha','extract','-depth','8','GRAY:-'],true);
  if(bytes.length!==PIXELS)throw Error('Unexpected decoded alpha byte count.');
  return bytes;
}
function pngMetadata(filename) {
  const bytes=fs.readFileSync(filename);
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Output is not PNG.');
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bitDepth:bytes[24],colorType:bytes[25],bytes:bytes.length};
}
function alphaSummary(alpha, sourceRGB) {
  let transparent=0,opaque=0,partial=0,whiteInteriorOpaque=0,minX=WIDTH,minY=HEIGHT,maxX=-1,maxY=-1;
  const boundaryOpaque={top:0,bottom:0,left:0,right:0};
  for(let p=0;p<PIXELS;p++){
    const a=alpha[p],x=p%WIDTH,y=Math.floor(p/WIDTH);
    if(a===0)transparent++;else{
      if(a===255)opaque++;else partial++;
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      if(y===0)boundaryOpaque.top++;if(y===HEIGHT-1)boundaryOpaque.bottom++;
      if(x===0)boundaryOpaque.left++;if(x===WIDTH-1)boundaryOpaque.right++;
      if(a===255&&sourceRGB&&sourceRGB[p*3]>=245&&sourceRGB[p*3+1]>=245&&sourceRGB[p*3+2]>=245)whiteInteriorOpaque++;
    }
  }
  const seen=new Uint8Array(PIXELS),queue=new Int32Array(PIXELS);
  let head=0,tail=0;
  function seed(p){if(!alpha[p]&&!seen[p]){seen[p]=1;queue[tail++]=p;}}
  for(let x=0;x<WIDTH;x++){seed(x);seed((HEIGHT-1)*WIDTH+x);}
  for(let y=1;y<HEIGHT-1;y++){seed(y*WIDTH);seed(y*WIDTH+WIDTH-1);}
  while(head<tail){const p=queue[head++],x=p%WIDTH;if(x)seed(p-1);if(x<WIDTH-1)seed(p+1);if(p>=WIDTH)seed(p-WIDTH);if(p<PIXELS-WIDTH)seed(p+WIDTH);}
  const exteriorTransparent=tail;
  seen.fill(0);
  const components=[];
  for(let start=0;start<PIXELS;start++){
    if(!alpha[start]||seen[start])continue;
    head=0;tail=1;queue[0]=start;seen[start]=1;
    let area=0,x0=WIDTH,y0=HEIGHT,x1=-1,y1=-1;
    function add(p){if(alpha[p]&&!seen[p]){seen[p]=1;queue[tail++]=p;}}
    while(head<tail){const p=queue[head++],x=p%WIDTH,y=Math.floor(p/WIDTH);area++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);if(x)add(p-1);if(x<WIDTH-1)add(p+1);if(p>=WIDTH)add(p-WIDTH);if(p<PIXELS-WIDTH)add(p+WIDTH);}
    components.push({area,bbox:[x0,y0,x1-x0+1,y1-y0+1]});
  }
  components.sort((a,b)=>b.area-a.area);
  return {transparent,opaque,partial,foregroundFraction:(opaque+partial)/PIXELS,transparentFraction:transparent/PIXELS,
    bbox:maxX>=0?[minX,minY,maxX-minX+1,maxY-minY+1]:null,boundaryOpaque,
    exteriorTransparent,disconnectedTransparent:transparent-exteriorTransparent,whiteInteriorOpaque,
    foregroundComponents:components.length,largestComponents:components.slice(0,20),
    smallComponentCounts:{upTo4:components.filter(c=>c.area<=4).length,from5To15:components.filter(c=>c.area>=5&&c.area<=15).length,
      from16To63:components.filter(c=>c.area>=16&&c.area<=63).length},
    smallComponentsRemoved:0};
}
function save(root,name,value){fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa',name),JSON.stringify(value,null,2)+'\n');}

export function verifyTransparency(root) {
  if(!path.isAbsolute(root))throw Error('An absolute media root is required.');
  const input=path.join(root,'media/character-original.jpg'),output=path.join(root,'media/character-cutout.png');
  const before=hashFile(originalPath),copied=hashFile(input);
  if(before!==originalSha||copied!==originalSha)throw Error('Original/copy SHA differs from the approved JPEG.');
  const sourceRGB=rgb(input),outputRGB=rgb(output),sourceRGBHash=hash(sourceRGB),outputRGBHash=hash(outputRGB);
  if(sourceRGBHash!==outputRGBHash)throw Error('Decoded RGB changed during alpha processing.');
  const metadata=pngMetadata(output);
  if(metadata.width!==WIDTH||metadata.height!==HEIGHT||metadata.bitDepth!==8||metadata.colorType!==6)throw Error('Unexpected PNG dimensions or RGBA format.');
  const alpha=alphaSummary(alphaBytes(output),sourceRGB);
  if(!alpha.transparent||!alpha.opaque||alpha.disconnectedTransparent||alpha.partial)throw Error('Unexpected exterior alpha topology.');
  if(hashFile(originalPath)!==before)throw Error('Original JPEG changed.');
  return {status:'PASS_ALPHA_ONLY',originalSha256:before,copySha256:copied,outputSha256:hashFile(output),
    sourceRGBSha256:sourceRGBHash,outputRGBSha256:outputRGBHash,rgbExactMatch:true,metadata,alpha,
    visualInspection:'NOT_PERFORMED',aiImageInput:'NONE',originalFileModified:false};
}

export function transparency(root) {
  if(!path.isAbsolute(root))throw Error('An absolute media root is required.');
  const media=path.join(root,'media'),qa=path.join(root,'qa'),candidates=path.join(qa,'transparency-candidates');
  fs.mkdirSync(media,{recursive:true});fs.mkdirSync(candidates,{recursive:true});
  const input=path.join(media,'character-original.jpg'),output=path.join(media,'character-cutout.png');
  const sourceHash=hashFile(originalPath);
  if(sourceHash!==originalSha)throw Error('Original SHA differs from the approved JPEG.');
  if(fs.existsSync(input)&&hashFile(input)!==sourceHash)throw Error('Existing original copy has unexpected bytes.');
  if(!fs.existsSync(input))fs.copyFileSync(originalPath,input);
  if(fs.existsSync(output)){
    const checkpoint=path.join(qa,'transparency-checkpoints',new Date().toISOString().replace(/[:.]/g,'-'));
    fs.mkdirSync(checkpoint,{recursive:true});fs.copyFileSync(output,path.join(checkpoint,'character-cutout.png'));
    if(fs.existsSync(path.join(qa,'transparency.json')))fs.copyFileSync(path.join(qa,'transparency.json'),path.join(checkpoint,'transparency.json'));
  }
  const sourceRGB=rgb(input),rgbHash=hash(sourceRGB),reports=[];
  let chosenAlpha,comparisonAlpha;
  for(const fuzz of [5,6]){
    const filename=path.join(candidates,'character-fuzz-'+fuzz+'.png');
    const args=[nativePath(input),'-alpha','set','-bordercolor','white','-border','1x1','-fuzz',fuzz+'%',
      '-fill','none','-draw','alpha 0,0 floodfill','-shave','1x1','+repage','-depth','8',
      '-define','png:color-type=6','PNG32:'+nativePath(filename)];
    execute(args);
    const decodedRGBHash=hash(rgb(filename));
    if(decodedRGBHash!==rgbHash)throw Error('Candidate RGB differs at fuzz '+fuzz+'%.');
    const alpha=alphaBytes(filename),summary=alphaSummary(alpha,sourceRGB),metadata=pngMetadata(filename);
    reports.push({fuzzPercent:fuzz,filename:path.relative(root,filename),sha256:hashFile(filename),rgbSha256:decodedRGBHash,metadata,alpha:summary});
    if(fuzz===5)chosenAlpha=alpha;else comparisonAlpha=alpha;
  }
  let addedTransparentPixels=0,lostTransparentPixels=0;
  for(let i=0;i<PIXELS;i++){if(chosenAlpha[i]&&comparisonAlpha[i]===0)addedTransparentPixels++;if(chosenAlpha[i]===0&&comparisonAlpha[i])lostTransparentPixels++;}
  fs.copyFileSync(path.join(candidates,'character-fuzz-5.png'),output);
  const verified=verifyTransparency(root);
  const report={...verified,algorithm:'ImageMagick alpha floodfill from artificial exterior white border; RGB untouched',
    imageMagickVersion:execute(['-version']).split(/\r?\n/)[0],chosenFuzzPercent:5,
    selectionReason:'Conservative exterior removal; 6% is measured as a comparison, not automatically selected.',
    feathering:false,erosion:false,rgbDecontamination:false,ordinaryNonAIProcessing:true,
    comparison:{addedTransparentPixels,lostTransparentPixels,addedFraction:addedTransparentPixels/PIXELS,
      largeDifferenceFlag:addedTransparentPixels/PIXELS>.01},candidates:reports,
    limitations:['Exterior-connected white clothing can be reached through a gap; numeric topology is not a visual identity review.',
      'No small foreground component is deleted, no RGB edge recoloring, no AI input or regeneration.']};
  save(root,'transparency-audit.json',report);
  save(root,'transparency.json',report);
  return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=process.argv[2];
  if(!root)throw Error('Usage: node transparency.mjs /absolute/media/root');
  const result=transparency(path.resolve(root));
  console.log(JSON.stringify({status:result.status,rgbExactMatch:result.rgbExactMatch,outputSha256:result.outputSha256,
    transparent:result.alpha.transparent,opaque:result.alpha.opaque,fuzzComparison:result.comparison}));
}
