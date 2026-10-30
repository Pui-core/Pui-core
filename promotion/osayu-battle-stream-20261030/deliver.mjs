/** Existing SMB connection only. Ordinary COPY, then decode the actual NAS file. */
import fs from 'node:fs';import path from 'node:path';import cp from 'node:child_process';
import {root,run,hash,save} from './runtime.mjs';
const folder=process.env.OSAYU158_NAS_FOLDER;
if(!folder?.startsWith('\\\\')||/["&|<>^%!\r\n]/.test(folder))throw Error('Explicit safe NAS version folder required');
const ps='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',cmd='/mnt/c/Windows/System32/cmd.exe';
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const powershell=script=>{const r=cp.spawnSync(ps,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;"+script],{cwd:'/mnt/c/Windows',encoding:'utf8',timeout:30000,maxBuffer:262144});if(r.status!==0)throw Error('Read-only NAS metadata command failed');return r.stdout.replace(/^\uFEFF/,'').trim();};
const identity=p=>{const s=powershell(`if(Test-Path -LiteralPath ${quote(p)}){$f=Get-Item -LiteralPath ${quote(p)};if($f.PSIsContainer -or ($f.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Not regular file'};[ordered]@{bytes=$f.Length;sha256=(Get-FileHash -LiteralPath ${quote(p)} -Algorithm SHA256).Hash.ToLowerInvariant()}|ConvertTo-Json -Compress}else{'null'}`);return JSON.parse(s);};
const builtin=args=>{const r=cp.spawnSync(cmd,['/d','/c',...args],{cwd:'/mnt/c/Windows',input:'',encoding:'utf8',timeout:60000,maxBuffer:65536});if(r.status!==0)throw Error('Ordinary NAS file operation failed; no retry or overwrite');};
const tools=JSON.parse(powershell("[ordered]@{ffmpeg=(Get-Command ffmpeg.exe).Source;ffprobe=(Get-Command ffprobe.exe).Source}|ConvertTo-Json -Compress"));
const tool=p=>cp.execFileSync('wslpath',['-u',p],{encoding:'utf8'}).trim();
const exists=powershell(`Test-Path -LiteralPath ${quote(folder)}`)==='True';if(!exists)builtin(['mkdir',folder]);
const receipts=[];
for(const [variant,name]of [['solo','通常版.mp4'],['collab','セラ先輩版.mp4']]){
 const accepted=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-final.private.json'))),opaque=JSON.parse(fs.readFileSync(path.join(root,'qa',variant+'-opaque-proof.private.json'))),pack=JSON.parse(fs.readFileSync(path.join(root,'qa','editable-package.private.json')));
 if(!accepted.passed||!opaque.passed||!pack.passed||hash(accepted.path)!==accepted.sha256)throw Error('Delivery prerequisites failed');
 const destination=folder+'\\'+name,partial=destination+'.partial',match=i=>i?.bytes===accepted.bytes&&i.sha256===accepted.sha256;
 let existing=identity(destination),copied=false;
 if(existing&&!match(existing))throw Error('Existing NAS video differs; choose a new version');
 if(!existing){if(identity(partial))throw Error('Existing partial retained; manual state verification needed');const source=cp.execFileSync('wslpath',['-w',accepted.path],{encoding:'utf8'}).trim();if(/["&|<>^%!\r\n]/.test(source))throw Error('Unsafe source filename');builtin(['copy','/b','/-y',source,partial]);if(!match(identity(partial)))throw Error('NAS copy identity mismatch');copied=true;}
 const actual=existing?destination:partial;
 const probed=await run(tool(tools.ffprobe),['-v','error','-count_frames','-show_streams','-show_format','-of','json',actual],variant+'-nas-probe',{timeoutMs:180000});
 const p=JSON.parse(probed.stdout),v=p.streams.filter(x=>x.codec_type==='video'),a=p.streams.filter(x=>x.codec_type==='audio');
 if(v.length!==1||a.length||v[0].width!==1080||v[0].height!==1920||v[0].avg_frame_rate!=='30/1'||Number(v[0].nb_read_frames)!==570||Math.abs(Number(p.format.duration)-19)>.01)throw Error('Actual NAS streams mismatch');
 const decoded=await run(tool(tools.ffmpeg),['-nostdin','-hide_banner','-loglevel','error','-threads','2','-i',actual,'-map','0:v:0','-an','-progress','pipe:1','-nostats','-f','null','-'],variant+'-nas-decode',{timeoutMs:180000});
 const frames=[...decoded.stdout.matchAll(/^frame=(\d+)\r?$/gm)].map(x=>Number(x[1]));
 if(frames.at(-1)!==570||!decoded.stdout.includes('progress=end')||decoded.stderr.trim()||!match(identity(actual)))throw Error('Actual NAS whole decode or identity failed');
 if(!existing){if(identity(destination))throw Error('Destination appeared; partial retained');builtin(['move','/-y',partial,destination]);}
 const final=identity(destination);if(!match(final)||hash(accepted.path)!==accepted.sha256)throw Error('Final/source identity changed');
 receipts.push({variant,destination,source:accepted.path,...final,copied,frames:570,audioStreams:0,width:1080,height:1920,fps:'30/1',duration:19,nasWholeDecodeExit:0,ownedDecodeExited:true});
 save(path.join(root,'qa','nas-delivery.private.json'),{passed:receipts.length===2,at:new Date().toISOString(),folder,videos:receipts,actualNasFilesDecoded:true,characterAIInput:0,sourceOrOldDeliveryDeleted:false});
 console.log(JSON.stringify({variant,actualNasVerified:true,frames:570,audioStreams:0,bytes:final.bytes}));
}
