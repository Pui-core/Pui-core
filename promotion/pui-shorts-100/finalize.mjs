/** Seal the completed delivery and stage public review artifacts for Git.
 * Refuses incomplete/changed media or unresolved visual findings.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {composition} from './produce.mjs';

const source=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.env.PUI_PROMO_ROOT||'/home/pui/Videos/Pui-Promo/2026-10-24');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const episodes=json(path.join(source,'episodes.json')),diagrams=json(path.join(source,'diagram-labels.json'));
assert.equal(episodes.length,100);assert.equal(new Set(episodes.map(e=>e.id)).size,100);
assert.equal(new Set(episodes.map(e=>JSON.stringify([e.hook,e.insight,e.example]))).size,100);
assert.equal(Object.keys(diagrams).length,100);
const expectedVideos=episodes.map(e=>String(e.id).padStart(3,'0')+'-pui.mp4').sort();
assert.deepEqual(fs.readdirSync(path.join(root,'videos')).filter(n=>n.endsWith('.mp4')).sort(),expectedVideos,'The final videos folder must contain exactly the requested 100 movies.');
for(const ext of ['ecproj','fcproj'])assert.deepEqual(fs.readdirSync(path.join(root,'projects')).filter(n=>n.endsWith('.'+ext)).sort(),episodes.map(e=>String(e.id).padStart(3,'0')+'.'+ext).sort(),'Native project count mismatch: '+ext);
const ledgers=['visual-review-001-030.json','visual-review-031-065.json','visual-review-066-100.json'];
const visual=new Map();
for(const name of ledgers){
 const ledger=json(path.join(root,'qa',name));
 assert.equal(ledger.pendingIds?.length||0,0,'Pending visual review: '+name);
 assert.equal(ledger.unresolvedFindings?.length||0,0,'Unresolved visual findings: '+name);
 for(const r of ledger.reviews||ledger.results||[]){
  assert.ok(['PASS','VISUAL_PASS'].includes(r.status||r.verdict),'Visual finding: '+r.id);
  assert.equal((r.findings||r.criticalFindings||[]).length,0,'Unresolved finding: '+r.id);
  assert.ok(!visual.has(r.id),'Duplicate visual review ownership: '+r.id);
  visual.set(r.id,{sha:r.videoSha256||r.videoSHA256,ledger:'qa/'+name,reviewedAt:r.reviewedAt});
 }
}
assert.equal(visual.size,100,'All 100 final videos must have sampled visual review.');
const aggregated=spawnSync(process.execPath,[path.join(source,'audit.mjs'),'--summarize'],{encoding:'utf8',env:{...process.env,PUI_AUDIT_SUMMARY:'qa/audit-summary.json'}});
assert.equal(aggregated.status,0,aggregated.stdout+'\n'+aggregated.stderr);
const summary=json(path.join(root,'qa','audit-summary.json'));
assert.equal(summary.technicalStatus,'TECHNICAL_PASS');assert.equal(summary.reports.length,100);
assert.equal(summary.missingIds.length,0);assert.equal(summary.failedIds.length,0);
assert.equal(json(path.join(root,'qa','recovery-verification.json')).status,'PASS','Minimal-delivery recovery verification must pass.');
const lum=h=>h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const videos=[],allFiles=[],videoHashes=new Set();let minMain=Infinity,minContrast=Infinity,maxPeak=-Infinity,minLUFS=Infinity,maxLUFS=-Infinity;
for(const e of episodes){
 const id=String(e.id).padStart(3,'0'),q=path.join(root,'qa',id),audit=json(path.join(q,'audit.json')),checkpoint=json(path.join(q,'checkpoint.json'));
 assert.equal(audit.technicalStatus,'TECHNICAL_PASS','Technical failure: '+id);assert.ok(audit.checks.length>=20);
 assert.ok(audit.checks.every(c=>c.passed===true),'Failed check: '+id);
 assert.deepEqual(checkpoint.episode,{...e,diagram:diagrams[e.id]},'Storyboard changed after rendering: '+id);
 assert.equal(fs.readFileSync(path.join(root,'source',id+'.jsx'),'utf8'),composition({...e,diagram:diagrams[e.id]}),'Composition changed after rendering: '+id);
 for(const rel of ['videos/'+id+'-pui.mp4','projects/'+id+'.ecproj','projects/'+id+'.fcproj']){
  const sha=hash(path.join(root,rel));assert.equal(sha,audit.assets[rel].sha256,'Changed asset: '+rel);
  allFiles.push({path:rel,sha256:sha,bytes:fs.statSync(path.join(root,rel)).size});
 }
 const videoSha=allFiles.at(-3).sha256;assert.equal(visual.get(e.id)?.sha,videoSha,'Visual review targets older movie: '+id);
 assert.ok(!videoHashes.has(videoSha),'Duplicate final video: '+id);videoHashes.add(videoSha);
 const layout=json(path.join(q,'text-layout.json'));
 const main=layout.boxes.filter(b=>/^Stage [012] line /.test(b.name));assert.equal(main.length,6);
 const minimum=Math.min(...main.map(b=>b.size));assert.ok(minimum>=60,'Main copy too small: '+id);minMain=Math.min(minMain,minimum);
 for(const role of ['ink','muted','accent']){const c=contrast(layout.palette[role],layout.palette.bg);assert.ok(c>=4.5,'Low text contrast: '+id+' '+role);minContrast=Math.min(minContrast,c);}
 const peak=Number(audit.signals.loudness.input_tp),lufs=Number(audit.signals.loudness.input_i);maxPeak=Math.max(maxPeak,peak);minLUFS=Math.min(minLUFS,lufs);maxLUFS=Math.max(maxLUFS,lufs);
 const stepCount=layout.boxes.filter(b=>/^Step number /.test(b.name)).length;
 if([5,23,73,94].includes(e.id))assert.equal(stepCount,2,'Two-operation diagram must contain two numbered steps: '+id);
 videos.push({id:e.id,series:e.series,topic:e.topic,file:'videos/'+id+'-pui.mp4',sha256:videoSha,seconds:18,width:1080,height:1920,fps:30,frames:540,
  audio:{integratedLUFS:lufs,truePeakDbTP:peak},native:['projects/'+id+'.ecproj','projects/'+id+'.fcproj'],technical:'PASS',visual:{status:'PASS',...visual.get(e.id)},minimumMainFontPixels:minimum});
}
const manifest={createdAt:new Date().toISOString(),date:'2026-10-24',timezone:'Asia/Tokyo',creator:'ぷい / Project P',status:'COMPLETE',count:100,secondsEach:18,totalSeconds:1800,
 tools:{EffectCraft:'0.14.0',FilmCraft:'0.10.0'},quality:{fullDecodeCount:100,sampledVisualReviewCount:100,framesSampledPerVideo:[42,159,312,459],minimumMainFontPixels:minMain,
 minimumTextBackgroundContrast:minContrast,integratedLUFSRange:[minLUFS,maxLUFS],maximumTruePeakDbTP:maxPeak,realTimeHumanHeadsetListening:'NOT_CLAIMED',socialPosting:'NOT_PERFORMED'},
 videos,files:allFiles};
save(path.join(root,'manifest.json'),manifest);
save(path.join(root,'qa','final-acceptance.json'),{status:'PASS',count:100,minimumMainFontPixels:minMain,minimumTextBackgroundContrast:minContrast,
 uniqueTopics:100,uniqueStoryboards:100,uniqueFinalVideos:videoHashes.size,technicalChecksPerVideo:20,visualReviewCount:visual.size,unresolvedFindings:0,sourceVerified:true,
 outputSHA256Verified:true,integratedLUFSRange:[minLUFS,maxLUFS],maximumTruePeakDbTP:maxPeak,reviewScope:'Four exact final-MP4 sample frames per video; full audio/video decode for every video.',manifestSHA256:hash(path.join(root,'manifest.json'))});

// Preserve the current production recipe independently of the temporary worktree.
const tooling=['produce.mjs','audit.mjs','gallery.mjs','finalize.mjs','episodes.json','diagram-labels.json','README.md'];
for(const name of tooling)fs.copyFileSync(path.join(source,name),path.join(root,'source',name));
const gallery=spawnSync(process.execPath,[path.join(source,'gallery.mjs')],{encoding:'utf8'});
assert.equal(gallery.status,0,gallery.stderr);process.stdout.write(gallery.stdout);

// Only final native projects and MP4s are copied to Git; full intermediate media stay in the delivery.
for(const d of ['videos','projects']){
 fs.mkdirSync(path.join(source,d),{recursive:true});
 for(const e of episodes){const id=String(e.id).padStart(3,'0');for(const ext of d==='videos'?['-pui.mp4']:['.ecproj','.fcproj']){
  const name=id+ext;fs.copyFileSync(path.join(root,d,name),path.join(source,d,name));
 }}
}
fs.mkdirSync(path.join(source,'media'),{recursive:true});
for(const name of ['logo-original.png','icon-original.png'])fs.copyFileSync(path.join(root,'media',name),path.join(source,'media',name));
fs.mkdirSync(path.join(source,'compositions'),{recursive:true});
fs.mkdirSync(path.join(source,'qa'),{recursive:true});
for(const e of episodes){const id=String(e.id).padStart(3,'0');fs.copyFileSync(path.join(root,'source',id+'.jsx'),path.join(source,'compositions',id+'.jsx'));
 fs.cpSync(path.join(root,'qa',id),path.join(source,'qa',id),{recursive:true,preserveTimestamps:true});}
for(const name of ['audit-summary.json','final-acceptance.json','recovery-verification.json',...ledgers])fs.copyFileSync(path.join(root,'qa',name),path.join(source,'qa',name));
if(fs.existsSync(path.join(root,'qa','gallery')))fs.cpSync(path.join(root,'qa','gallery'),path.join(source,'qa','gallery'),{recursive:true,preserveTimestamps:true});
for(const name of ['index.html','posting-captions.csv','検品と利用案内.md','manifest.json','sources.json'])fs.copyFileSync(path.join(root,name),path.join(source,name));
for(const entry of allFiles)assert.equal(hash(path.join(source,entry.path)),entry.sha256,'Git artifact copy differs: '+entry.path);
console.log(JSON.stringify({sealed:true,count:100,quality:manifest.quality,gitArtifacts:source}));
