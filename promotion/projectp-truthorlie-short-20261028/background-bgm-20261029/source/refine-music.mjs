import fs from 'node:fs';
import path from 'node:path';
import {file,hash,run,ff,makeMusic,save} from './produce.mjs';
const video=file('videos/truthorlie-v11-bgm.mp4');
if(await hash(video)!=='10c535a4e9bb1754a99eb9abc4592bdd91c5cec96f03c3bd052bbddbaf5c5f85')throw Error('Expected first-pass artifact only; no repeat');
const archive=file('history/firstpass');if(fs.existsSync(archive))throw Error('First-pass archive exists; no repeat');fs.mkdirSync(archive,{recursive:true});
for(const p of ['videos/truthorlie-v11-bgm.mp4','media/mix-v11.wav','media/cipher-bed-v11.wav']){const target=path.join(archive,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(file(p),target);}
fs.renameSync(file('qa'),path.join(archive,'qa'));fs.mkdirSync(file('qa'),{recursive:true});fs.mkdirSync(file('qa/pcm'),{recursive:true});
for(const p of ['input-bindings.json','native-offline-preparation.json'])fs.copyFileSync(path.join(archive,'qa',p),file('qa/'+p));
await makeMusic();
await run('ffmpeg',ff(['-i',file('media/narration-real-v9.wav'),'-i',file('media/sfx-real-v9.wav'),'-i',file('media/cipher-bed-v11.wav'),'-filter_complex','[0:a][1:a][2:a]amix=inputs=3:normalize=0:duration=longest,apad,atrim=duration=19.2[out]','-map','[out]','-ar','48000','-c:a','pcm_s24le',file('media/mix-v11.wav')]),'pcm-mix.json');
await run('ffmpeg',ff(['-i',file('media/accepted-v10.mp4'),'-i',file('media/mix-v11.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart','-metadata','comment=Cipher — Kevin MacLeod (incompetech.com), CC BY 4.0. Excerpt, level, voice-priority ducking and fade edits. Background BGM confirmation v11; not TikTok native sound selection.',video]),'packet-copy-export.json');
save('qa/production-job.json',{issue:145,pid:process.pid,status:'refined-awaiting-QA',finished:new Date().toISOString(),video,sha256:await hash(video),firstPassPreserved:true,windowsExe:0,gui:0,focus:0,publicationIntents:0});
console.log(JSON.stringify({refined:video,sha256:await hash(video)}));
