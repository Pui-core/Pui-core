import fs from 'node:fs';
import {file,np,FF,run,save,digest} from './native.mjs';
const source=file('media/replay.mp4');
const expected='c0b94ae3e559809216db5536c13f3ca4c9121fc2dd7b1630c91c2257df78eb86';
if(await digest(source)!==expected)throw Error('Source recording changed');
const rows=[];
for(const [id,at] of [['before',0],['after',64.1]]){
  const output=file('media/'+id+'-count-close.png');
  if(fs.existsSync(output))throw Error('Existing crop retained; use a new revision directory.');
  await run(FF,['-hide_banner','-loglevel','error','-ss',String(at),'-i',np(source),'-vf','crop=310:65:80:1014,scale=930:195:flags=lanczos','-frames:v','1',np(output)],id+'-crop.json');
  rows.push({id,sourceSeconds:at,crop:[80,1014,310,65],output:output,sha256:await digest(output)});
}
save('qa/counter-crops.json',{sourceSha256:expected,rows});
