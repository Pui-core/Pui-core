import fs from 'node:fs';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawn} from 'node:child_process';
const root='/home/pui/tmp/projectp145-tools',archive=root+'/ffmpeg-n9-shared.tar.xz';
const url='https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0.tar.xz';
const expected='3ffc4dafa2309adb18f5f598f5e23e84f3d400c1444f2538dcbcfb0d5c60b5ac';
fs.mkdirSync(root,{recursive:true});
if(!fs.existsSync(archive)){const response=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('HTTP '+response.status);await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(archive,{flags:'wx'}));}
const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(archive))h.update(b);if(h.digest('hex')!==expected)throw Error('Pinned tool archive mismatch; not extracted');
if(!fs.existsSync(root+'/ffmpeg-n9.0-latest-linux64-gpl-shared-9.0/bin/ffmpeg'))await new Promise((resolve,reject)=>{const p=spawn('/usr/bin/nice',['-n','10','ionice','-c','3','tar','-xJf',archive,'-C',root],{stdio:['ignore','pipe','pipe'],env:{...process.env,XZ_DEFAULTS:'-T1'}});let e='';p.stderr.on('data',b=>e+=b);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error('tar '+c+': '+e)));});
console.log(JSON.stringify({linuxPrivateToolsReady:true,archiveSha256:expected,windowsExeInvocations:0,gui:0}));
