import fs from 'node:fs';
import {file,np,FF,run,save} from '../native.mjs';
const attempts=process.argv.slice(2);
for(const attempt of attempts){
 if(!/^demo0[1-5]-[-a-z0-9]+$/.test(attempt))throw Error('Explicit attempt required');
 const b=JSON.parse(fs.readFileSync(file(`qa/demo05/${attempt}-binding.json`)));
 const launch=JSON.parse(fs.readFileSync(file(`qa/demo05/${attempt}-launch.json`)));
 const captured=JSON.parse(fs.readFileSync(launch.out+'/capture.json'));
 const rows=Math.ceil(b.seconds/2/5);
 await run(FF,['-v','error','-i',np(file(b.video)),'-vf',`fps=1/2,scale=480:270,tile=5x${rows}`,'-frames:v','1',np(file(`qa/demo05/${attempt}-actual-contact.png`))],`demo05/${attempt}-contact.json`);
 save(`qa/demo05/${attempt}-observations.json`,{video:b.video,sha256:b.sha256,seconds:b.seconds,setup:b.setup,events:captured.events.map(x=>({...x,captureSeconds:x.captureFrame/30})),routeTrace:captured.routeTrace,visualReview:'PENDING',gameClock:'Not used for competitive or elapsed-video comparisons: PNG drawing affects clock',audioRecorded:false});
 console.log(JSON.stringify({attempt,contact:`qa/demo05/${attempt}-actual-contact.png`,seconds:b.seconds}));
}
