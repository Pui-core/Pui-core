import fs from 'node:fs';
import {file,np,FF,run,save,digest} from './native.mjs';
const tag='emberwake-firstcut04h-f-native', r=JSON.parse(fs.readFileSync(file('qa/'+tag+'-render.json'))), p=file(r.video);
const frames=[630,735,840,933,960,1005,1065,1500,7515,7605,7662,7665];
const select=frames.map(n=>'eq(n\\,'+n+')').join('+');
const filter="select="+select+",scale=480:270:flags=area,drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='%{pts\\:hms}':fontsize=20:fontcolor=white:box=1:boxcolor=black@0.8:x=5:y=5,tile=3x4:nb_frames=12:padding=3:margin=3:color=0x07131d";
await run(FF,['-v','error','-i',np(p),'-vf',filter,'-frames:v','1','-threads','1',np(file('qa/firstcut04h-actual-review-grid.png'))],'firstcut04h-actual-review-grid.json');
save('qa/firstcut04h-actual-review-grid-evidence.json',{sha256:await digest(p),frames,seconds:frames.map(x=>x/30),image:'qa/firstcut04h-actual-review-grid.png',inspected:false,wholeDirectWatch:false,subjectiveListen:false});
console.log('actual grid generated');
