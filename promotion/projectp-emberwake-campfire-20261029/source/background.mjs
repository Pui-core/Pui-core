import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
export const toolsRoot='/home/pui/tmp/projectp146-native-tools';
export const stage='/mnt/f/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29';
export const runtimeRoot='/home/pui/tmp/projectp151-runtime';
export const ffRoot='/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0';
export const cli=Object.fromEntries([['effectcraft','0.14.0'],['filmcraft','0.10.0'],['photocraft','0.15.1']].map(([n,v])=>[n,`${toolsRoot}/${n}/${n}-${v}-linux-x86_64/bin/${n}-cli`]));
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const allowed=fs.readFileSync('/proc/self/status','utf8').match(/^Cpus_allowed_list:\s*(.+)$/m)[1].split(',').flatMap(part=>{const[a,b=a]=part.split('-').map(Number);return Array.from({length:b-a+1},(_,i)=>a+i);});
export const cpuSubset=allowed.slice(0,2).join(',');
export function save(p,j){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');}
export async function run(exe,args,receipt,{input,env={},timeoutMs=180000,privateDisplay=false,failOnScriptError=false}={}){
  if(receipt)fs.mkdirSync(path.dirname(receipt),{recursive:true});
  const runtime=runtimeRoot+'/runtime';fs.mkdirSync(runtime,{recursive:true,mode:0o700});fs.chmodSync(runtime,0o700);
  const childEnv={...process.env,XDG_CONFIG_HOME:runtimeRoot+'/config',XDG_CACHE_HOME:runtimeRoot+'/cache',XDG_DATA_HOME:runtimeRoot+'/data',XDG_RUNTIME_DIR:runtime,FONTCONFIG_FILE:runtimeRoot+'/fonts.conf',EFFECTCRAFT_CONFIG_DIR:runtimeRoot+'/config/effectcraft',LIBGL_ALWAYS_SOFTWARE:'1',LP_NUM_THREADS:'2',OMP_NUM_THREADS:'2',RAYON_NUM_THREADS:'2',...env};
  delete childEnv.DISPLAY;delete childEnv.WAYLAND_DISPLAY;delete childEnv.DBUS_SESSION_BUS_ADDRESS;delete childEnv.XAUTHORITY;
  const commandArgs=['-n','10','ionice','-c','3','/usr/bin/taskset','-c',cpuSubset,...(privateDisplay?['/usr/bin/xvfb-run','-a','-s','-screen 0 1280x720x24 -nolisten tcp']:[]),exe,...args];
  return await new Promise((resolve,reject)=>{
    const started=new Date().toISOString(),p=spawn('/usr/bin/nice',commandArgs,{env:childEnv,detached:true,stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});let stdout='',stderr='',timedOut=false;
    const stop=()=>{try{process.kill(-p.pid,'SIGTERM');}catch{}};
    const timer=setTimeout(()=>{timedOut=true;stop();},timeoutMs);
    console.log(JSON.stringify({pid:p.pid,exe,args,started,privateDisplay}));
    if(input!==undefined)p.stdin.end(input);
    for(const[stream,key]of[[p.stdout,'out'],[p.stderr,'err']])stream.on('data',b=>{if(key==='out')stdout+=b;else stderr+=b;if(receipt)fs.appendFileSync(receipt+'.live.log',b);if(failOnScriptError&&/SCRIPT ERROR:|Parse Error:/.test(stdout+stderr))stop();});
    p.on('error',reject);p.on('close',code=>{clearTimeout(timer);const result={exe,args,pid:p.pid,started,ended:new Date().toISOString(),code,timedOut,stdout,stderr,privateDisplay,waylandUnset:true,sharedDesktopInput:0};if(receipt)save(receipt,result);if(code!==0||timedOut||(failOnScriptError&&/SCRIPT ERROR:|Parse Error:/.test(stdout+stderr)))reject(Error(JSON.stringify(result).slice(-3500)));else resolve(result);});
  });
}
export const native=(name,args,receipt,input,timeoutMs=180000)=>run(cli[name],args,receipt,{privateDisplay:true,input,timeoutMs});
export const ff=(args,receipt)=>run(ffRoot+'/bin/ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-filter_complex_threads','2',...args],receipt,{env:{LD_LIBRARY_PATH:ffRoot+'/lib'}});
