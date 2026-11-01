import fs from 'node:fs'; import {hash,save} from './attempt01/source/background.mjs';
const root='C:/Users/pui/private-use/emberwake-video156-20261101/attempt01';
const ec=root+'/projects/intro65-v06.ecproj',picture=root+'/media/intro65-v06-picture.mov';
const receipt=JSON.parse(fs.readFileSync('./qa/ec-full.json'));if(receipt.code||receipt.timedOut)throw Error('picture failed');
save(root+'/qa/picture-render-binding-v06.json',{ec,ecSha256:hash(ec),picture,sha256:hash(picture),seconds:65,frames:1950});
process.argv.push('--export-only');await import('./attempt01/source/v06-render.mjs');
