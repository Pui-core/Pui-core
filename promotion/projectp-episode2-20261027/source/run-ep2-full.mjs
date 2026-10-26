// Issue117 episode-2 FULL continuation runner.
// Dedicated Linux Xvfb only. No Windows GUI input and no default user-data profile.
// Each attempt gets a fresh owned userdata prefix seeded byte-for-byte with the known
// legitimate episode-1-cleared private save (exact SHA256). The product's own guards and
// pinned-source hashes are enforced; nothing in the product tree is modified.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

const WORKSPACE='/home/pui/tmp/projectp117-capture-20261026';
const RECIPE='/mnt/f/Videos/ProjectP-YouTube-Game-Horizontal-2026-10-26/revision-01';
const KNOWN_SAVE='/home/pui/tmp/projectp112-capture-20261026/full01-userdata/godot/app_userdata/EMBERWAKE/emberwake-campaign-1.0-jump-1.1.json';
const EXPECTED_SAVE_SHA='f5eae6b0b22ff83476b9d9e7846ce6da6fef79f53ebf0fadfdefcf875afb1494';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const attempt=process.argv[2];
if(!/^[-a-z0-9]+$/.test(attempt||''))throw Error('Usage: node run-ep2-full.mjs <unique-attempt>');
const product=path.join(WORKSPACE,'product');
const out=path.join(WORKSPACE,attempt);
const data=path.join(WORKSPACE,attempt+'-userdata');
const config=path.join(WORKSPACE,attempt+'-config');
const cache=path.join(WORKSPACE,attempt+'-cache');
if([out,data,config,cache].some(p=>fs.existsSync(p)))throw Error('Attempt/profile already exists; preserve it and use a new attempt name');

// Enforce the 72 pinned core-source hashes before launch.
const before=JSON.parse(fs.readFileSync(path.join(RECIPE,'qa/product-source-before.json'),'utf8'));
for(const f of before.files)if(hash(path.join(product,f.file))!==f.sha256)throw Error('Pinned core source changed: '+f.file);

// Seed a fresh owned userdata prefix with the known legitimate save, verified by SHA.
if(hash(KNOWN_SAVE)!==EXPECTED_SAVE_SHA)throw Error('Known private save SHA mismatch; refusing to seed');
const saveDir=path.join(data,'godot','app_userdata','EMBERWAKE');
fs.mkdirSync(saveDir,{recursive:true});
const seeded=path.join(saveDir,'emberwake-campaign-1.0-jump-1.1.json');
fs.copyFileSync(KNOWN_SAVE,seeded);
if(hash(seeded)!==EXPECTED_SAVE_SHA)throw Error('Seeded save SHA differs from source');

fs.mkdirSync(out,{recursive:true});
const log=fs.openSync(path.join(WORKSPACE,attempt+'.log'),'wx');
const driver=path.join(WORKSPACE,'source-117','capture-ep2-full.gd');
const driverSha=hash(driver);
const args=['-a','-s','-screen 0 1920x1080x24 -nolisten tcp','/home/pui/.local/bin/godot','--path',product,'--rendering-method','gl_compatibility','--audio-driver','Dummy','--fixed-fps','30','--disable-vsync','--resolution','1920x1080','--script',driver,'--','--out',out];
const env={...process.env,XDG_DATA_HOME:data,XDG_CONFIG_HOME:config,XDG_CACHE_HOME:cache,PROJECTP_CAPTURE_DATA_ROOT:data,LP_NUM_THREADS:'2',LIBGL_ALWAYS_SOFTWARE:'1'};
const started=new Date().toISOString();
const processHandle=spawn('/usr/bin/xvfb-run',args,{env,stdio:['ignore',log,log]});
const launch={mode:'ep2-full',attempt,started,launcherPid:processHandle.pid,exe:'/usr/bin/xvfb-run',args,driverSha256:driverSha,seededSaveSha256:hash(seeded),ownedPaths:{workspace:WORKSPACE,product,out,data,config,cache},limits:{nativeWallSeconds:720,maxFrames:6000},status:'RUNNING'};
fs.writeFileSync(path.join(WORKSPACE,attempt+'-launch.json'),JSON.stringify(launch,null,2)+'\n');
console.log(JSON.stringify(launch));
processHandle.on('error',error=>{fs.writeFileSync(path.join(WORKSPACE,attempt+'-launch.json'),JSON.stringify({...launch,status:'LAUNCH_ERROR',error:error.message},null,2)+'\n');fs.closeSync(log);process.exitCode=1;});
processHandle.on('close',(code,signal)=>{fs.closeSync(log);const changed=before.files.filter(f=>hash(path.join(product,f.file))!==f.sha256).map(f=>f.file);const result={...launch,status:code===0&&changed.length===0?'FINISHED':'FAILED',exitCode:code,signal,finished:new Date().toISOString(),coreFilesChecked:before.files.length,changedCore:changed};fs.writeFileSync(path.join(WORKSPACE,attempt+'-launch.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(code!==0||changed.length)process.exitCode=1;});
