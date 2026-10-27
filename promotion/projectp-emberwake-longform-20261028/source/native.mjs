import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(process.env.PROJECTP_HORIZONTAL_ROOT||fileURLToPath(new URL('..',import.meta.url)));
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
export function run(exe,args,receipt,input){return new Promise((resolve,reject)=>{const p=spawn(exe,args,{stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});let stdout='',stderr='';if(input!==undefined)p.stdin.end(input);p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('error',reject);p.on('close',code=>{const r={exit:code,exe,args,stdout:stdout.replace(/^\uFEFF/,''),stderr};if(receipt)save('qa/'+receipt,r);if(code!==0)reject(Error(JSON.stringify(r).slice(-4000)));else resolve(r);});});}
export function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);if(hash(a)!==hash(b))throw Error('Copy hash differs: '+b);}
// A portable-F proof deliberately hides only this task's source media.
// A concurrent helper must not recreate an empty media directory and block restoration.
for(const hidden of ['media-hidden-for-F-proof','media-hidden-for-F-proof04'])if(fs.existsSync(file(hidden))&&!fs.existsSync(file('media')))throw Error('Owned F native proof is active; use its F assets or wait for source media restoration');
for(const p of ['source','media','projects','videos','covers','qa'])fs.mkdirSync(file(p),{recursive:true});
