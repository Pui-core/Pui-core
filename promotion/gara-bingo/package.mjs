/** Copy the local deliverable to Windows and relink through each native editor. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {root,nativePath} from './produce.mjs';

const source=path.dirname(fileURLToPath(import.meta.url));
const destination=process.argv[2]||'/mnt/f/Users/pui/Documents/gara/bingo-1124';
const editable=path.join(destination,'editable');
fs.mkdirSync(editable,{recursive:true});
for(const name of ['media','projects','source','qa'])fs.cpSync(path.join(root,name),path.join(editable,name),{recursive:true});
fs.copyFileSync(path.join(root,'videos/osayu-bingo-1124.mp4'),path.join(destination,'osayu-bingo-1124.mp4'));
fs.copyFileSync(path.join(root,'cover.png'),path.join(destination,'cover.png'));
for(const name of ['README.md','image-prompts.md','produce.mjs','audio.mjs','package.mjs'])fs.copyFileSync(path.join(source,name),path.join(editable,'source',name));
fs.copyFileSync(path.join(source,'README.md'),path.join(destination,'制作方針と投稿文.md'));

// Replace only the known media-root prefix, preserving all unrelated project values.
const from=nativePath(root),to=nativePath(editable);
function relocate(v){if(typeof v==='string')return v.startsWith(from)?to+v.slice(from.length):v;if(Array.isArray(v))return v.map(relocate);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,val])=>[k,relocate(val)]));return v;}
for(const name of ['osayu-bingo.ecproj','osayu-bingo.fcproj']){
  const p=path.join(editable,'projects',name);fs.writeFileSync(p,JSON.stringify(relocate(JSON.parse(fs.readFileSync(p)))));
}
const EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe',FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
const receipts=[];
for(const[exe,args]of[
  [EC,['--project',nativePath(path.join(editable,'projects/osayu-bingo.ecproj')),'--save','info','--json']],
  [FC,['--project',nativePath(path.join(editable,'projects/osayu-bingo.fcproj')),'--save','inspect']],
  [EC,['--project',nativePath(path.join(editable,'projects/osayu-bingo.ecproj')),'render-frame','--comp','Osayu Bingo','--time','9','--out',nativePath(path.join(editable,'qa/relocated-effectcraft.png')),'--json']],
  [FC,['--project',nativePath(path.join(editable,'projects/osayu-bingo.fcproj')),'render','--seconds','19.5','--out',nativePath(path.join(editable,'qa/relocated-filmcraft.png'))]]
]){
  const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
  receipts.push({exe,args,exit:r.status,stdout:r.stdout,stderr:r.stderr});
  if(r.error||r.status)throw Error(JSON.stringify(receipts.at(-1)).slice(-3000));
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const video=path.join(destination,'osayu-bingo-1124.mp4');
if(hash(video)!==hash(path.join(root,'videos/osayu-bingo-1124.mp4')))throw Error('Copied video hash differs.');
const report={destination:nativePath(destination),bytes:fs.statSync(video).size,sha256:hash(video),nativeReopenAndRender:true,receipts};
fs.writeFileSync(path.join(editable,'qa/portable-package.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({destination:report.destination,sha256:report.sha256,nativeReopenAndRender:true}));
