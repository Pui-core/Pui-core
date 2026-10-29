import fs from'node:fs';import{spawn}from'node:child_process';import{stage,hash,save}from'./background.mjs';
const time=process.argv.find(s=>/^\d{4}$/.test(s));if(!time)throw Error('JST production HHmm required');
const src=new URL('./deliver-background.ps1',import.meta.url),file=stage+'/jump-v01/source/deliver-background.ps1';
// PowerShell 5.1 needs a BOM for the Japanese directory and file names.
const script='\ufeff'+fs.readFileSync(src,'utf8').replace(/^\ufeff/,'');fs.writeFileSync(file,script);
const action=process.argv.includes('--deliver')?'deliver':'inspect';
const exe='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const args=['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File','F:\\Videos\\ProjectP-EMBERWAKE-Jump-2026-10-29\\jump-v01\\source\\deliver-background.ps1','-Action',action,'-ProductionTime',time];
const p=spawn(exe,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';const started=new Date().toISOString();console.log(JSON.stringify({pid:p.pid,action,started}));
const timer=setTimeout(()=>p.kill('SIGTERM'),200000);p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);
const code=await new Promise((resolve,reject)=>{p.once('error',reject);p.once('close',resolve)});clearTimeout(timer);
save(stage+'/jump-v01/qa/nas-'+action+'-process.json',{exe,args,pid:p.pid,started,ended:new Date().toISOString(),code,stdout,stderr,helperSha256:hash(file),windowsHide:true,sharedDesktopInput:0});
if(code!==0||stderr)throw Error('NAS helper failed; inspect saved process result');const receipt=JSON.parse(stdout.replace(/^\ufeff/,''));if(receipt.consoleWindow!==0||receipt.consoleWindowAfter!==0)throw Error('No-console condition failed');
save(stage+'/jump-v01/qa/nas-'+action+'.json',receipt);console.log(JSON.stringify(receipt));
