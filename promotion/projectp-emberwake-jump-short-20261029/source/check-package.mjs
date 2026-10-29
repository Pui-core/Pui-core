import fs from'node:fs';import path from'node:path';import{execFileSync}from'node:child_process';import{hash,save}from'./background.mjs';
const root=path.dirname(path.dirname(new URL(import.meta.url).pathname)),manifest=root+'/qa/package-manifest.json';
const packageData=JSON.parse(fs.readFileSync(manifest,'utf8'));
for(const f of packageData.files){const p=root+'/'+f.file;if(hash(p)!==f.sha256||fs.statSync(p).size!==f.bytes)throw Error('Manifest mismatch '+f.file);if(/\.(mp4|mov|wav|mp3|dll|jar|moc3)$/i.test(f.file))throw Error('Raw/model/audio/final binary in Source '+f.file);}
const syntax=[];for(const name of fs.readdirSync(root+'/source').filter(n=>n.endsWith('.mjs'))){execFileSync(process.execPath,['--check',root+'/source/'+name],{stdio:'pipe'});syntax.push(name);}
for(const name of['jump-v03.ecproj','jump-v03-bgm.fcproj','jump-v03-voice.fcproj'])JSON.parse(fs.readFileSync(root+'/projects/'+name,'utf8'));
const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();if(branch!=='feature/issue-152-emberwake-jump-short')throw Error('Wrong branch');
const changed=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:root,encoding:'utf8'}).split('\n').filter(Boolean).map(s=>s.slice(3));
if(changed.some(p=>!p.startsWith('promotion/projectp-emberwake-jump-short-20261029/')))throw Error('Out-of-scope change');
execFileSync('git',['diff','--check'],{cwd:root,stdio:'pipe'});execFileSync('git',['diff','--cached','--check'],{cwd:root,stdio:'pipe'});
save(root+'/qa/package-check.json',{issue:152,manifestSha256:hash(manifest),manifestEntries:packageData.files.length,manifestHashesMatch:true,syntaxChecked:syntax,nativeJsonParsed:3,sourceBranch:branch,changedFilesWithinPrefix:true,scopeChangedFiles:changed,finalMp4InGit:0,modelSdkOrVoiceAudioInGit:0,sharedGui:0,wholeRealtimeWatch:false,subjectiveListen:false});console.log(JSON.stringify({manifestEntries:packageData.files.length,syntaxFiles:syntax.length,scopedChanged:changed.length,result:'PASS code/package scope only; not subjective AV review'}));
