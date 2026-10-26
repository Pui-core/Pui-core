import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(process.env.PP111_ROOT||fileURLToPath(new URL('..',import.meta.url)));
export const file=p=>path.join(root,p);
export const PC='/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe',EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe',FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
export const FF=fs.realpathSync('/mnt/f/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'),FP=fs.realpathSync('/mnt/f/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
export const np=p=>execFileSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'}).trim();
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const parse=s=>JSON.parse(s.replace(/^\uFEFF/,'').trim());
export function save(p,v){fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),JSON.stringify(v,null,2)+'\n');}
export async function run(exe,args,receipt,input){return await new Promise((resolve,reject)=>{
 const child=spawn(exe,args,{stdio:[input===undefined?'ignore':'pipe','pipe','pipe'],windowsHide:true});let stdout='',stderr='';
 console.log(JSON.stringify({event:'native-start',tool:path.basename(exe),stage:receipt,pid:child.pid,at:new Date().toISOString()}));
 if(input!==undefined)child.stdin.end(input);child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
 child.on('error',reject);child.on('close',code=>{const result={at:new Date().toISOString(),exit:code,tool:path.basename(exe),args,stdout:stdout.replace(/^\uFEFF/,''),stderr};if(receipt)save('qa/'+receipt,result);console.log(JSON.stringify({event:'native-end',stage:receipt,exit:code,at:result.at}));if(code!==0)reject(Error(JSON.stringify(result).slice(-3500)));else resolve(result);});
 });}
for(const d of ['source','media','projects','covers','videos','qa'])fs.mkdirSync(file(d),{recursive:true});
