import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

export const root=process.env.OSAYU158_ROOT;
if(!root || !path.isAbsolute(root) || root==='/' || root.startsWith('/mnt/')) throw Error('OSAYU158_ROOT must be an independent private Linux directory');
export const nativeTools=process.env.OSAYU158_NATIVE_TOOLS || '/home/pui/tmp/projectp146-native-tools';
export const effect=path.join(nativeTools,'effectcraft/effectcraft-0.14.0-linux-x86_64/bin/effectcraft-cli');
export const film=path.join(nativeTools,'filmcraft/filmcraft-0.10.0-linux-x86_64/bin/filmcraft-cli');
export const ffRoot=process.env.OSAYU158_FFMPEG || '/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0';
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function save(p,v){fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{mode:0o600});}
export function parseNative(s){const i=s.indexOf('{');if(i<0)throw Error('Native response missing');return JSON.parse(s.slice(i).trim());}
export async function run(exe,args,name,{display=false,timeoutMs=180000,env={},consumeStdout}={}) {
  const runtime=path.join(root,'runtime'), receipt=path.join(root,'qa',name+'.json');
  for(const d of ['run','config','cache','data'])fs.mkdirSync(path.join(runtime,d),{recursive:true,mode:0o700});
  fs.mkdirSync(path.dirname(receipt),{recursive:true,mode:0o700});
  const fonts=path.join(runtime,'fonts.conf');
  fs.writeFileSync(fonts,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/mnt/c/Windows/Fonts</dir><dir>/usr/share/fonts</dir><cachedir>${runtime}/cache/fontconfig</cachedir></fontconfig>`);
  const childEnv={...process.env,XDG_CONFIG_HOME:runtime+'/config',XDG_CACHE_HOME:runtime+'/cache',XDG_DATA_HOME:runtime+'/data',XDG_RUNTIME_DIR:runtime+'/run',FONTCONFIG_FILE:fonts,EFFECTCRAFT_CONFIG_DIR:runtime+'/config/effectcraft',LIBGL_ALWAYS_SOFTWARE:'1',LP_NUM_THREADS:'2',OMP_NUM_THREADS:'2',RAYON_NUM_THREADS:'2',...env};
  for(const k of ['DISPLAY','WAYLAND_DISPLAY','DBUS_SESSION_BUS_ADDRESS','XAUTHORITY'])delete childEnv[k];
  const cpu=fs.readFileSync('/proc/self/status','utf8').match(/^Cpus_allowed_list:\s*(.+)$/m)[1].split(',').flatMap(p=>{const[a,b=a]=p.split('-').map(Number);return Array.from({length:b-a+1},(_,i)=>a+i);}).slice(0,2).join(',');
  const command=['-n','10','ionice','-c','3','taskset','-c',cpu,...(display?['xvfb-run','-a','-s','-screen 0 1280x720x24 -nolisten tcp']:[]),exe,...args];
  const startedAt=new Date().toISOString(); let stdout='',stderr='',timedOut=false;
  return await new Promise((resolve,reject)=>{
    const p=spawn('nice',command,{env:childEnv,detached:true,stdio:['ignore','pipe','pipe']});
    const stop=()=>{try{process.kill(-p.pid,'SIGTERM');}catch{}};
    process.once('SIGINT',stop);process.once('SIGTERM',stop);
    fs.appendFileSync(path.join(root,'qa/owned-processes.jsonl'),JSON.stringify({pid:p.pid,startedAt,name,exe})+'\n');
    let escalation;
    const timer=setTimeout(()=>{timedOut=true;stop();escalation=setTimeout(()=>{try{process.kill(-p.pid,'SIGKILL');}catch{}},5000);},timeoutMs);
    let consumeError;
    p.stdout.on('data',b=>{if(consumeStdout){try{consumeStdout(b);}catch(e){consumeError=e;stop();}}else stdout+=b;});p.stderr.on('data',b=>stderr+=b);
    p.on('error',e=>{clearTimeout(timer);clearTimeout(escalation);process.off('SIGINT',stop);process.off('SIGTERM',stop);reject(e);});
    p.on('close',async code=>{
      clearTimeout(timer);clearTimeout(escalation);process.off('SIGINT',stop);process.off('SIGTERM',stop);
      // xvfb-run may close its streams just before its own Xvfb exits.
      let processGroupRemaining=false;
      for(let i=0;i<80;i++){
        processGroupRemaining=false;try{process.kill(-p.pid,0);processGroupRemaining=true;}catch{}
        if(!processGroupRemaining)break;
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      const v={pid:p.pid,startedAt,endedAt:new Date().toISOString(),code,timedOut,processGroupRemaining,display,sharedDesktopInput:0,stdout,stderr};save(receipt,v);
      if(consumeError)reject(consumeError);else if(code!==0 || timedOut || processGroupRemaining || /SCRIPT ERROR:|Parse Error:/.test(stdout+stderr))reject(Error(`${name} failed; inspect private receipt`));else resolve(v);
    });
  });
}
export const native=(args,name)=>run(effect,args,name,{display:true});
export const ff=(args,name)=>run(path.join(ffRoot,'bin/ffmpeg'),['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2',...args],name,{env:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')}});
