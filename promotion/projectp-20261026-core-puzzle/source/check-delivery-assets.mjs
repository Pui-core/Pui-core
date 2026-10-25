import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {file,save,copy} from './native.mjs';

const destination=process.env.PROJECTP_PUZZLE_DELIVERY;
if(!destination||!fs.existsSync(destination))throw Error('Provide the existing delivery directory');
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]);}
async function digest(p){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(p))h.update(chunk);return h.digest('hex');}
const assets=[];
for(const source of files(file('media')).sort()){
 const relative=path.relative(file(''),source),target=path.join(destination,relative);
 if(!fs.existsSync(target))throw Error('Missing copied asset '+relative);
 const bytes=fs.statSync(source).size;
 if(fs.statSync(target).size!==bytes)throw Error('Asset size changed '+relative);
 const sha256=await digest(source);
 if(await digest(target)!==sha256)throw Error('Copied asset SHA differs '+relative);
 assets.push({file:relative.replaceAll(path.sep,'/'),bytes,sha256});
}
const modelFrames=assets.filter(x=>/^media\/revenant-natural\/frame-\d{6}\.png$/.test(x.file));
if(modelFrames.length!==600)throw Error('Expected all600 actual Core frames');
save('qa/delivery-assets.json',{schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Source/delivery SHA identity for all rendered and referenced media; no raw model or SDK',allMatch:true,assetCount:assets.length,modelFrameCount:modelFrames.length,bytes:assets.reduce((n,x)=>n+x.bytes,0),assets});
copy(file('qa/delivery-assets.json'),path.join(destination,'qa/delivery-assets.json'));
console.log(JSON.stringify({allMatch:true,assetCount:assets.length,modelFrameCount:modelFrames.length,bytes:assets.reduce((n,x)=>n+x.bytes,0)}));
