import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const root=process.env.OSAYU160_ROOT;
if(!root || !path.isAbsolute(root) || root===path.parse(root).root || (process.platform!=='win32'&&root.startsWith('/mnt/'))) throw Error('OSAYU160_ROOT must be an independent private directory');
const windows=process.platform==='win32';
export const nativeTools=process.env.OSAYU160_NATIVE_TOOLS || '/home/pui/tmp/projectp146-native-tools';
export const effect=windows?(process.env.OSAYU160_EFFECTCRAFT||'C:/Program Files/EffectCraft/effectcraft-cli.exe'):path.join(nativeTools,'effectcraft/effectcraft-0.14.0-linux-x86_64/bin/effectcraft-cli');
export const film=windows?(process.env.OSAYU160_FILMCRAFT||'C:/Program Files/FilmCraft/filmcraft-cli.exe'):path.join(nativeTools,'filmcraft/filmcraft-0.10.0-linux-x86_64/bin/filmcraft-cli');
export const ffRoot=process.env.OSAYU160_FFMPEG || (windows?path.join(process.env.LOCALAPPDATA||'C:/Users/pui/AppData/Local','Microsoft/WinGet/Links'):'/home/pui/tmp/projectp145-tools/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0');
export const ffmpegPath=windows?path.join(ffRoot,'ffmpeg.exe'):path.join(ffRoot,'bin/ffmpeg');
export const ffprobePath=windows?path.join(ffRoot,'ffprobe.exe'):path.join(ffRoot,'bin/ffprobe');
export const ffEnv=windows?{}:{LD_LIBRARY_PATH:path.join(ffRoot,'lib')};
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const runnerNonce=crypto.randomBytes(12).toString('hex');
export function save(p,v){fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{mode:0o600});}
export function parseNative(s){const i=s.indexOf('{');if(i<0)throw Error('Native response missing');return JSON.parse(s.slice(i).trim());}
export async function run(exe,args,name,{display=false,timeoutMs=180000,env={},consumeStdout,input}={}) {
  const runtime=path.join(root,'runtime'), receipt=path.join(root,'qa',name+'.json');
  if(windows){
    for(const d of ['temp','config','local','roaming'])fs.mkdirSync(path.join(runtime,d),{recursive:true});
    fs.mkdirSync(path.dirname(receipt),{recursive:true});
    const systemRoot=process.env.SystemRoot||process.env.SYSTEMROOT||'C:\\Windows';
    const childEnv={...process.env,...env,SystemRoot:systemRoot,windir:process.env.windir||systemRoot,TEMP:path.join(runtime,'temp'),TMP:path.join(runtime,'temp'),APPDATA:path.join(runtime,'roaming'),LOCALAPPDATA:path.join(runtime,'local'),EFFECTCRAFT_CONFIG_DIR:path.join(runtime,'config'),OMP_NUM_THREADS:'2',RAYON_NUM_THREADS:'2'};
    // Children inherit the task-owned Node process's CPU affinity and priority.
    const limiterScript = "$p=Get-Process -Id "+process.pid+" -ErrorAction Stop; $mask=[long]$p.ProcessorAffinity; $bits=@(); for($i=0;$i -lt 63;$i++){ $b=[long]1 -shl $i; if(($mask -band $b) -ne 0){$bits += $b; if($bits.Count -eq 2){break}} }; if($bits.Count -ne 2){throw 'fewer than two allowed CPUs'}; $p.PriorityClass='BelowNormal'; $p.ProcessorAffinity=[IntPtr]($bits[0] -bor $bits[1])";
    const limiter=spawnSync(path.join(systemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',limiterScript],{windowsHide:true,env:childEnv,timeout:15000,stdio:'ignore'});
    if(limiter.error||limiter.status!==0)throw Error('OWNED_WINDOWS_RESOURCE_LIMIT_FAILED');
    const jobSource=fileURLToPath(new URL('./windows-job-runner.cs',import.meta.url)),jobSourceSha256=hash(jobSource),binDir=path.join(runtime,'bin');fs.mkdirSync(binDir,{recursive:true});
    const jobRunner=path.join(binDir,`job-${process.pid}-${runnerNonce}-${jobSourceSha256.slice(0,16)}.exe`);
    if(!fs.existsSync(jobRunner)){const csc=path.join(systemRoot,'Microsoft.NET','Framework64','v4.0.30319','csc.exe');const compiled=spawnSync(csc,['/nologo','/optimize+','/out:'+jobRunner,jobSource],{env:childEnv,windowsHide:true,timeout:30000,encoding:'utf8'});if(compiled.error||compiled.status!==0)throw Error('JOB_RUNNER_COMPILE_FAILED '+(compiled.stderr||compiled.stdout||''));}
    const jobRunnerSha256=hash(jobRunner),startedAt=new Date().toISOString();let stdout='',stderr='',timedOut=false,consumeError;
    return await new Promise((resolve,reject)=>{
      const p=spawn(jobRunner,[String(process.pid),exe,...args],{env:childEnv,windowsHide:true,stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});
      if(p.stdin)p.stdin.on('error',e=>{consumeError=e;p.kill();});
      if(input!==undefined)p.stdin.end(input);
      try{fs.appendFileSync(path.join(root,'qa','owned-processes.jsonl'),JSON.stringify({pid:p.pid,startedAt,name,exe,platform:'win32'})+'\n');}catch(e){p.kill();reject(e);return;}
      const timer=setTimeout(()=>{timedOut=true;p.kill();},timeoutMs);
      p.stdout.on('data',b=>{if(consumeStdout){try{consumeStdout(b);}catch(e){consumeError=e;p.kill();}}else stdout+=b;});p.stderr.on('data',b=>stderr+=b);
      p.on('error',e=>{clearTimeout(timer);reject(e)});
      p.on('close',code=>{clearTimeout(timer);const v={pid:p.pid,startedAt,endedAt:new Date().toISOString(),code,timedOut,processGroupRemaining:code===0?false:null,processTreeVerification:code===0?'windows-job-empty':'failed-or-unverified',jobSourceSha256,jobRunnerSha256,display,sharedDesktopInput:'unverified',platform:'win32',stdout,stderr};save(receipt,v);if(consumeError)reject(consumeError);else if(code!==0||timedOut||/SCRIPT ERROR:|Parse Error:/.test(stdout+stderr))reject(Error(name+' failed; inspect private receipt'));else resolve(v)});
    });
  }

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
    const p=spawn('nice',command,{env:childEnv,detached:true,stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});
    if(input!==undefined)p.stdin.end(input);
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
export const native=(args,name)=>run(effect,args,name,{display:true,timeoutMs:1800000});
export const filmNative=(args,name,input)=>run(film,args,name,{display:true,input,timeoutMs:240000});
export const ff=async(args,name)=>{const result=await run(ffmpegPath,['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','2','-filter_threads','2',...args],name,{env:ffEnv});if(result.stderr.trim())throw Error(name+' emitted decode errors');return result;};
