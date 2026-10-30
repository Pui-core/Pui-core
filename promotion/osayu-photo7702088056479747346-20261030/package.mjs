import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {root,hash,save,native,run,ff,probe} from './runtime.mjs';
import {structure} from './audit.mjs';
import {compName} from './motion.mjs';

const destination='/mnt/f/Users/pui/Documents/gara/おさゆ_1103チュートリアルバトル_20261030_v03';
const editable=destination+'/editable',source=path.dirname(fileURLToPath(import.meta.url));
if(fs.existsSync(destination))throw Error('Existing delivery retained; choose a new version');
const posting=JSON.parse(fs.readFileSync(root+'/qa/posting-master.json'));
const opaque=JSON.parse(fs.readFileSync(root+'/qa/opaque-core-proof.json'));
const alpha=JSON.parse(fs.readFileSync(root+'/qa/source-alpha-verification.json'));
if(!posting.passed||!opaque.passed||!alpha.rgbExactMatch)throw Error('Technical prerequisites missing');
structure();
const copied=[];
function copy(a,b){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);if(hash(a)!==hash(b))throw Error('Copy mismatch: '+b);copied.push({file:b.slice(destination.length+1),bytes:fs.statSync(b).size,sha256:hash(b)});}
function tree(a,b){fs.mkdirSync(b,{recursive:true});for(const e of fs.readdirSync(a,{withFileTypes:true})){if(e.isDirectory())tree(path.join(a,e.name),path.join(b,e.name));else if(e.isFile())copy(path.join(a,e.name),path.join(b,e.name));else throw Error('Symlink not included in delivery');}}
tree(root+'/media',editable+'/media');tree(root+'/projects',editable+'/projects');tree(root+'/qa',editable+'/qa');tree(root+'/source',editable+'/generated-scripts');tree(source,editable+'/source');
copy(fileURLToPath(new URL('../gara-bingo/v4/transparency.mjs',import.meta.url)),editable+'/source/reference/transparency-v4.mjs');
for(const f of ['README.md','投稿文.md','音源後付けガイド.md'])copy(source+'/'+f,destination+'/'+f);
const finalVideo=destination+'/'+path.basename(posting.path);copy(posting.path,finalVideo);
const replace=(value,from,to)=>typeof value==='string'&&(value===from||value.startsWith(from+'/'))?to+value.slice(from.length):Array.isArray(value)?value.map(v=>replace(v,from,to)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replace(v,from,to)])):value;
const names=['osayu-tutorial-battle.ecproj','character-free-preview.ecproj','osayu-tutorial-battle.fcproj'];
for(const name of names){const p=editable+'/projects/'+name;fs.writeFileSync(p,JSON.stringify(replace(JSON.parse(fs.readFileSync(p)),root,editable))+'\n');}
const qa=root+'/qa/delivery';fs.mkdirSync(qa,{recursive:true});
for(const name of names){const kind=name.endsWith('ecproj')?'effectcraft':'filmcraft';await native(kind,['--project',editable+'/projects/'+name,'--save',kind==='effectcraft'?'info':'inspect',...(kind==='effectcraft'?['--json']:[])],qa+'/linux-reopen-'+name+'.json');}
structure(editable);
await native('effectcraft',['--project',editable+'/projects/character-free-preview.ecproj','render-frame','--comp',compName,'--time','16.5','--out',editable+'/qa/preview/relocated-linux.png','--json'],qa+'/linux-preview-redraw.json');
await native('effectcraft',['--project',editable+'/projects/osayu-tutorial-battle.ecproj','render-frame','--comp',compName,'--time','16.5','--out',editable+'/qa/local-only/relocated-linux.png','--json'],qa+'/linux-main-redraw.json');
await native('filmcraft',['--project',editable+'/projects/osayu-tutorial-battle.fcproj','render','--seconds','16.5','--out',editable+'/qa/local-only/relocated-linux-film.png'],qa+'/linux-film-redraw.json');

// Windows originals have explicit F-drive media references. No existing GUI is connected.
const win=p=>{const r=spawnSync('wslpath',['-w',p],{encoding:'utf8'});if(r.status)throw Error('Cannot convert native path');return r.stdout.trim().replaceAll('\\','/');};
const windows=editable+'/projects/windows';fs.mkdirSync(windows,{recursive:true});
const windowsTools={effectcraft:'/mnt/c/Program Files/EffectCraft/effectcraft-cli.exe',filmcraft:'/mnt/c/Program Files/FilmCraft/filmcraft-cli.exe'};
const windowsReceipts=[];
for(const name of names){
 const p=windows+'/'+name;fs.writeFileSync(p,JSON.stringify(replace(JSON.parse(fs.readFileSync(editable+'/projects/'+name)),editable,win(editable)))+'\n');
 const kind=name.endsWith('ecproj')?'effectcraft':'filmcraft';
 const r=await run(windowsTools[kind],['--project',win(p),'--save',kind==='effectcraft'?'info':'inspect',...(kind==='effectcraft'?['--json']:[])],qa+'/windows-reopen-'+name+'.json',{timeoutMs:120000});
 windowsReceipts.push({file:name,reopenSaveExit:r.code,sha256:hash(p)});
}
await run(windowsTools.effectcraft,['--project',win(windows+'/osayu-tutorial-battle.ecproj'),'render-frame','--comp',compName,'--time','16.5','--out',win(editable+'/qa/local-only/relocated-windows.png'),'--json'],qa+'/windows-main-redraw.json',{timeoutMs:120000});
await run(windowsTools.filmcraft,['--project',win(windows+'/osayu-tutorial-battle.fcproj'),'render','--seconds','16.5','--out',win(editable+'/qa/local-only/relocated-windows-film.png')],qa+'/windows-film-redraw.json',{timeoutMs:120000});
const decoded=await ff(['-i',finalVideo,'-map','0:v:0','-an','-f','null','-'],qa+'/delivered-all-decode.json');if(decoded.stderr.trim())throw Error('Delivered decode diagnostic');
const metadata=JSON.parse((await probe(['-show_streams','-show_format','-of','json',finalVideo],qa+'/delivered-probe.json')).stdout);
if(metadata.streams.some(s=>s.codec_type==='audio')||hash(finalVideo)!==posting.sha256)throw Error('Delivered master changed');
const summary={at:new Date().toISOString(),destination:win(destination),linuxPath:destination,video:{file:path.basename(finalVideo),sha256:hash(finalVideo),bytes:fs.statSync(finalVideo).size,audioStreams:0,duration:metadata.format.duration,wholeDecodeExit:decoded.code},linuxNativeReopenSaveAndRedraw:true,windowsNativeReopenSaveAndRedraw:true,linuxProjects:names.map(file=>({file,sha256:hash(editable+'/projects/'+file)})),windowsProjects:windowsReceipts,copyVerification:{phase:'Before intentional project relinking, native save and relocated QA updates',files:copied.length,allShaMatch:true},characterAIInput:0,post:0,sharedDesktopInput:0,unverified:['owner creative acceptance','human full realtime viewing of character-containing final','TikTok mobile UI','sound audition/selection/synchronization','publication and growth']};
save(root+'/qa/delivery-summary.json',summary);save(editable+'/qa/delivery-summary.json',summary);save(root+'/qa/delivery-copied-files.json',copied);
console.log(JSON.stringify(summary));
