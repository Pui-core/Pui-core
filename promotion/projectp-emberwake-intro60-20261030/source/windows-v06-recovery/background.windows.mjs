import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {spawn} from 'node:child_process';
const root='C:/Users/pui/private-use/emberwake-video156-20261101';
export const ffRoot='C:/Users/pui/AppData/Local/Microsoft/WinGet/Links';
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const save=(p,j)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');};
let n=0;
export async function run(exe,args,receipt,{input,timeoutMs=180000}={}){
 exe=exe.replace(ffRoot+'/bin/',ffRoot+'/'); if(!exe.endsWith('.exe'))exe+='.exe';
 const name='qa-'+Date.now()+'-'+n++;
 await new Promise((resolve,reject)=>{const p=spawn('C:/Users/pui/AppData/Local/Programs/Python/Python312/python.exe',[root+'/invoke.py'],{cwd:root,windowsHide:true,stdio:['pipe','ignore','pipe']});let err='';p.stderr.on('data',b=>err+=b);p.stdin.end(JSON.stringify({name,args:[exe,...args],input,timeout:timeoutMs/1000}));p.on('error',reject);p.on('close',code=>code?reject(Error(err)):resolve());});
 const r=JSON.parse(fs.readFileSync(root+'/qa/'+name+'.json')); if(receipt)save(receipt,r);return r;
}
export const native=(name,args,receipt,input,timeoutMs)=>run('C:/Program Files/'+(name==='effectcraft'?'EffectCraft':'FilmCraft')+'/'+name+'-cli.exe',args,receipt,{input,timeoutMs});
export const ff=(args,receipt)=>run(ffRoot+'/ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-filter_complex_threads','2',...args],receipt);
