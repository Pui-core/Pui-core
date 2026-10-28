import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
export const root=path.resolve(process.env.PROJECTP143_STAGE||'/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/model-motion-20261029');
export const file=p=>path.join(root,p);
export const PC='/mnt/c/Program Files/PhotoCraft/photocraft-cli.exe';
export const EC='/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe';
export const FC='/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe';
export const FF=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
export const FP=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export async function digest(p){const h=crypto.createHash('sha256');for await(const block of fs.createReadStream(p))h.update(block);return h.digest('hex');}
export function np(p){const r=spawnSync('wslpath',['-w',path.resolve(p)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout.trim();}
export function parse(s){return JSON.parse(s.replace(/^\uFEFF/,'').trim());}
export function save(p,data){const target=file(p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');}
export function run(exe,args,receipt,input){return new Promise((resolve,reject)=>{const p=spawn(exe,args,{stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});let stdout='',stderr='',timedOut=false;const timer=setTimeout(()=>{timedOut=true;p.kill('SIGTERM');},300000);if(input!==undefined)p.stdin.end(input);p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('close',code=>{clearTimeout(timer);const r={exit:code,ownedPid:p.pid,timedOut,exe,args,stdout:stdout.replace(/^\uFEFF/,''),stderr};if(receipt)save('qa/'+receipt,r);if(code!==0||timedOut)reject(Error(JSON.stringify(r).slice(-4000)));else resolve(r);});});}
export function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);if(hash(a)!==hash(b))throw Error('Copy hash differs: '+b);}
for(const p of ['source','media','projects','videos','covers','qa'])fs.mkdirSync(file(p),{recursive:true});
