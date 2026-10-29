import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import readline from 'node:readline';

const root=process.env.OSAYU_TELOP_ROOT||'/home/pui/Videos/Osayu-Telop/2026-10-29';
const list=fs.existsSync(path.join(root,'cherry-codepoints.json'))?path.join(root,'cherry-codepoints.json'):new URL('../font/cherry-codepoints.json',import.meta.url);
const codepoints=JSON.parse(fs.readFileSync(list,'utf8'));
const child=spawn('/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe',['serve'],{stdio:['pipe','pipe','pipe']});
const pending=new Map(); let next=0, stderr='';
child.stderr.on('data',d=>stderr+=d);
readline.createInterface({input:child.stdout}).on('line',line=>{
  const response=JSON.parse(line.replace(/^\uFEFF/,'')), task=pending.get(response.id);
  if(!task)return; pending.delete(response.id); clearTimeout(task.timer);
  response.ok ? task.resolve(response.result) : task.reject(Error(JSON.stringify(response)));
});
child.on('error',error=>{for(const x of pending.values())x.reject(error);pending.clear();});
child.on('exit',code=>{for(const x of pending.values())x.reject(Error('PhotoCraft exited '+code+' '+stderr));pending.clear();});
function call(method,params) {
  return new Promise((resolve,reject)=>{
    const id=++next, timer=setTimeout(()=>reject(Error('PhotoCraft request timeout '+id)),30000);
    pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,method,params})+'\n');
  });
}
const command=(id,params={})=>call('engine.execute',{command:id,params});
const glyphs=[];
try {
  for(const codepoint of codepoints) {
    await call('doc.new',{width:1600,height:1550,name:'Osayu Puku '+codepoint.toString(16),background:'transparent',resolution:72});
    const created=await command('type.create',{x:100,y:1200,text:String.fromCodePoint(codepoint),font:'Cherry Bomb One',size:1000,color:'#000000'});
    const caret=await command('type.caret',{index:1});
    const advance=caret.segment[0][0]-100;
    let outline={subpaths:[],fillRule:'nonzero'};
    if(created.bounds[2]>created.bounds[0] && created.bounds[3]>created.bounds[1]) {
      await command('type.convertToShape');
      // PhotoCraft-authored optical proportions and a small round expansion.
      // Extra advance is deliberate spacing for a thick sticker outline.
      const sx=1.025, sy=1.02;
      await command('shape.edit',{transform:[sx,0,0,sy,100*(1-sx),1200*(1-sy)],stroke:{width:8,color:'#000000',cap:'round',join:'round',align:'center'}});
      const shape=await command('shape.info'); outline=shape.path;
    }
    glyphs.push({codepoint,advance:advance*1.025+(advance>0?16:0),path:outline,stroke:{width:8,cap:'round',join:'round'}});
    await command('file.close');
    if(glyphs.length%40===0)console.log('PhotoCraft glyphs '+glyphs.length+'/'+codepoints.length);
  }
  const output=path.join(root,'native-glyphs.json');
  fs.writeFileSync(output,JSON.stringify({font:'Cherry Bomb One',derivative:'Osayu Puku',size:1000,baseline:1200,baselineX:100,upm:1000,design:{horizontalScale:1.025,verticalScale:1.02,roundStroke:8,extraAdvance:16},glyphs},null,2));
  console.log(output+' / '+glyphs.length+' glyphs');
} finally {
  child.stdin.end();
  await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);});
}
