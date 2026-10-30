/** Reuse the existing read-only V4 verifier. Do not invoke its transparency generator. */
import fs from 'node:fs';
import {root,save} from './runtime.mjs';
const canonical=new URL('../gara-bingo/v4/transparency.mjs',import.meta.url);
const fallback=new URL('./reference/transparency-v4.mjs',import.meta.url);
const {verifyTransparency}=await import(fs.existsSync(canonical)?canonical.href:fallback.href);
const output=root+'/media/character-original.jpg';
if(!fs.existsSync(output))fs.copyFileSync('/mnt/f/Users/pui/Documents/gara/立ち絵.jpg',output);
const report=verifyTransparency(root);
save(root+'/qa/source-alpha-verification.json',{...report,existingCutoutReused:true,newTransparencyGeneration:false});
console.log(JSON.stringify({status:report.status,rgbExactMatch:report.rgbExactMatch,originalFileModified:report.originalFileModified}));
