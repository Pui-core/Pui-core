import fs from 'node:fs';
import path from 'node:path';
import {file,hash,copy,save} from './native.mjs';
const origin=process.env.PROJECTP_MIX_REUSE||'/mnt/f/Videos/ProjectP-Mix-Process-2026-10-27/revision-02-native-safe';
const evidence=JSON.parse(fs.readFileSync(file('qa/reuse-binding.json'),'utf8'));
for(const item of evidence.files){
 const input=path.join(origin,item.file),output=file(item.file);
 if(hash(input)!==item.sha256)throw Error('Original reused asset changed: '+item.file);
 if(fs.existsSync(output)&&hash(output)!==item.sha256)throw Error('Preserve different existing asset: '+item.file);
 if(!fs.existsSync(output))copy(input,output);
}
save('qa/reuse-current.json',{status:'PASS_FROZEN_APPROVED_MIX99_ASSETS',files:evidence.files,newCoreRenderCount:0,oldSourceMutated:false});
