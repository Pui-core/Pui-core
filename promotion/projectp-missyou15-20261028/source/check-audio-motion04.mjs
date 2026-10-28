import { spawnSync } from 'node:child_process'; import crypto from 'node:crypto'; import {FF, np, file, save} from './native.mjs';
const old='/mnt/f/Videos/ProjectP-Missyou15-Preview-2026-10-28/revision-03-motion/videos/missyou15-motion03-voice.mp4';
const paths=[old,file('videos/missyou15-motion04-voice.mp4')];
const values=paths.map(p=>{const r=spawnSync(FF,['-v','error','-i',np(p),'-map','0:a:0','-f','s16le','-acodec','pcm_s16le','-'],{maxBuffer:16*1024*1024});if(r.status!==0)throw Error('audio decode failed');return {bytes:r.stdout.length,sha256:crypto.createHash('sha256').update(r.stdout).digest('hex')};});
if(values[0].bytes!==values[1].bytes||values[0].sha256!==values[1].sha256)throw Error('AAC decoded PCM differs');
save('qa/motion04-voice-pcm-comparison.json',{oldVersion:'motion03',newVersion:'motion04',decodedPcm:values,identical:true,subjectiveListen:false});
console.log('decoded AAC PCM matches previous version');
