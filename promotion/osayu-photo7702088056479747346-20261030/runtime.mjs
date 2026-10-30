import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

export const root=path.resolve(process.env.OSAYU157_ROOT||'/home/pui/Videos/Osayu/2026-10-30/photo7702088056479747346/revision-03');
export const runtime=path.join(root,'runtime');
export const toolsRoot='/home/pui/tmp/projectp146-native-tools';
export const cli={effectcraft:toolsRoot+'/effectcraft/effectcraft-0.14.0-linux-x86_64/bin/effectcraft-cli',filmcraft:toolsRoot+'/filmcraft/filmcraft-0.10.0-linux-x86_64/bin/filmcraft-cli'};
export const ffRoot='/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0';
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function save(p,data){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');}
export function parseNative(stdout){const start=stdout.indexOf('{');if(start<0)throw Error('Native JSON missing');return JSON.parse(stdout.slice(start).trim());}

export async function run(exe,args,receipt,{input,env={},display=false,timeoutMs=180000}={}){
  if(!fs.existsSync(exe))throw Error('Existing tool missing: '+exe);
  fs.mkdirSync(runtime,{recursive:true,mode:0o700});
  const xdgr=path.join(runtime,'run');fs.mkdirSync(xdgr,{recursive:true,mode:0o700});fs.chmodSync(xdgr,0o700);
  const fonts=path.join(runtime,'fonts.conf');
  fs.writeFileSync(fonts,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/mnt/c/Windows/Fonts</dir><dir>/usr/share/fonts</dir><cachedir>${runtime}/cache/fontconfig</cachedir></fontconfig>`);
  const childEnv={...process.env,XDG_CONFIG_HOME:runtime+'/config',XDG_CACHE_HOME:runtime+'/cache',XDG_DATA_HOME:runtime+'/data',XDG_RUNTIME_DIR:xdgr,FONTCONFIG_FILE:fonts,EFFECTCRAFT_CONFIG_DIR:runtime+'/config/effectcraft',LIBGL_ALWAYS_SOFTWARE:'1',LP_NUM_THREADS:'2',OMP_NUM_THREADS:'2',RAYON_NUM_THREADS:'2',...env};
  for(const key of ['DISPLAY','WAYLAND_DISPLAY','DBUS_SESSION_BUS_ADDRESS','XAUTHORITY'])delete childEnv[key];
  const allowed=fs.readFileSync('/proc/self/status','utf8').match(/^Cpus_allowed_list:\s*(.+)$/m)[1].split(',').flatMap(p=>{const[a,b=a]=p.split('-').map(Number);return Array.from({length:b-a+1},(_,i)=>a+i);}).slice(0,2).join(',');
  const command=['-n','10','ionice','-c','3','/usr/bin/taskset','-c',allowed,...(display?['/usr/bin/xvfb-run','-a','-s','-screen 0 1280x720x24 -nolisten tcp']:[]),exe,...args];
  fs.mkdirSync(path.dirname(receipt),{recursive:true});
  return await new Promise((resolve,reject)=>{
    const started=new Date().toISOString();let stdout='',stderr='',timedOut=false,killTimer;
    const p=spawn('/usr/bin/nice',command,{env:childEnv,detached:true,stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});
    const stop=()=>{try{process.kill(-p.pid,'SIGTERM');}catch{};killTimer=setTimeout(()=>{try{process.kill(-p.pid,'SIGKILL');}catch{}},5000);};
    const timer=setTimeout(()=>{timedOut=true;stop();},timeoutMs);
    fs.appendFileSync(path.join(root,'qa','owned-processes.jsonl'),JSON.stringify({pid:p.pid,started,exe,args,display,receipt})+'\n');
    console.log(JSON.stringify({started,pid:p.pid,tool:path.basename(exe),args:args.slice(0,3),receipt}));
    if(input!==undefined)p.stdin.end(input);
    p.stdout.on('data',b=>{stdout+=b;fs.appendFileSync(receipt+'.stdout',b);});
    p.stderr.on('data',b=>{stderr+=b;fs.appendFileSync(receipt+'.stderr',b);});
    p.on('error',error=>{clearTimeout(timer);clearTimeout(killTimer);reject(error);});
    p.on('close',code=>{clearTimeout(timer);clearTimeout(killTimer);const result={exe,args,pid:p.pid,started,ended:new Date().toISOString(),code,timedOut,display,sharedDesktopInput:0,stdout,stderr};save(receipt,result);if(code!==0||timedOut||/SCRIPT ERROR:|Parse Error:/.test(stdout+stderr))reject(Error(JSON.stringify({code,timedOut,receipt,stderr:stderr.slice(-1500),stdout:stdout.slice(-1500)})));else resolve(result);});
  });
}
export const native=(name,args,receipt,input,timeoutMs)=>run(cli[name],args,receipt,{input,display:true,timeoutMs});
export const ff=(args,receipt)=>run(ffRoot+'/bin/ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2',...args],receipt,{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});
export const probe=(args,receipt)=>run(ffRoot+'/bin/ffprobe',['-v','error',...args],receipt,{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});
