import fs from'node:fs';import{stage,ff,hash,save}from'./background.mjs';
const root=stage+'/pv-v01',j=JSON.parse(fs.readFileSync(root+'/source-assets-full.json')),a=j.assets.find(a=>a.id==='wind-transfer'),file=root+'/media/wind-transfer-air.mp4',receipt=root+'/qa/wind-transfer-revise.json';
if(fs.existsSync(file)){const r=JSON.parse(fs.readFileSync(receipt));if(r.code!==0||r.args.at(-1)!==file)throw Error('Existing unverified revised asset');}
else await ff(['-ss','13','-i',a.input,'-t','3.3','-vf','crop=1920:720:0:360','-an','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',file],receipt);
Object.assign(a,{from:13,file,sha256:hash(file),editorialReason:'Use isolated airborne traverse after the earlier shrine approach, preserving central protagonist and avoiding interaction context.'});save(root+'/source-assets-full-clean.json',j);
