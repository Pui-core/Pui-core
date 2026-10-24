/** Posting master has no audio stream; TikTok sound is added after upload. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const postingVideoName='osayu-bingo-v4-1124-tiktok-silent.mp4';
const native=p=>{const r=spawnSync('wslpath',['-w',p],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function makePostingVersion(root){
 const master=path.join(root,'media/picture-master.mp4'),out=path.join(root,'videos',postingVideoName);
 const ff=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
 const fp=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe');
 let r=spawnSync(ff,['-v','error','-y','-i',native(master),'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',native(out)],{encoding:'utf8',timeout:120000});
 if(r.status||r.error)throw Error('Posting remux failed: '+(r.error?.message||r.stderr));
 r=spawnSync(fp,['-v','error','-count_frames','-show_streams','-show_format','-of','json',native(out)],{encoding:'utf8',timeout:120000});
 if(r.status||r.error)throw Error('Posting probe failed');
 const probe=JSON.parse(r.stdout.replace(/^\uFEFF/,'')),video=probe.streams.find(s=>s.codec_type==='video');
 if(probe.streams.length!==1||video?.width!==1080||video?.height!==1920||video?.codec_name!=='h264'||video?.r_frame_rate!=='30/1'||Number(video?.nb_read_frames)!==660)throw Error('Posting master must be a silent 1080p/30/660-frame video');
 r=spawnSync(ff,['-v','error','-i',native(out),'-f','null','-'],{encoding:'utf8',timeout:120000});
 if(r.status||r.error)throw Error('Posting full decode failed');
 const report={status:'PASS',file:postingVideoName,bytes:fs.statSync(out).size,sha256:hash(out),duration:Number(probe.format.duration),frames:Number(video.nb_read_frames),audioStreams:0,
  sourceMasterSha256:hash(master),videoCopiedWithoutReencoding:true,fullDecode:true,containsCharacter:true,aiViewingAllowed:false,
  musicInsertion:'Add the selected sound inside TikTok; use the timing guide. The mixed MP4 is a separate reference.'};
 fs.writeFileSync(path.join(root,'qa/posting-master.json'),JSON.stringify(report,null,2)+'\n');
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify(makePostingVersion(path.resolve(process.argv[2]||'/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-04'))));
}
