import fs from 'node:fs';
import {file,np,FF,run} from './native.mjs';
let e=JSON.parse(fs.readFileSync(file('source/firstcut04k-artinput-agent03-edit.json')));
for(const [id,offset] of [['u099',2],['jump01',3],['jump03',4],['jump06',4.3]]){
 let t=e.cues.find(x=>x.id===id).start+offset;
 await run(FF,['-y','-v','error','-ss',String(t),'-i',np(file('videos/firstcut04k-artinput-agent03.mp4')),'-frames:v','1',np(file(`qa/firstcut04k-artinput-agent03-final-${id}.png`))],`firstcut04k-artinput-agent03-final-${id}.json`);
}
