import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ff=fs.realpathSync('/mnt/c/Users/pui/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe');
const np=p=>spawnSync('wslpath',['-w',p],{encoding:'utf8'}).stdout.trim();
function pcm(rel){const r=spawnSync(ff,['-v','error','-i',np(path.join(root,rel)),'-vn','-ac','1','-ar','48000','-f','f32le','-'],{maxBuffer:20*1024*1024,timeout:90000});if(r.status!==0)throw Error(String(r.stderr));const a=new Float32Array(r.stdout.length/4);for(let i=0;i<a.length;i++)a[i]=r.stdout.readFloatLE(i*4);return a;}
const results=[];
for(const [video,wav,windows]of [
 ['emberwake-voice-sfx-no-music','voice-sfx-no-music',[[.1,2.3],[9.9,12.3],[53.9,56.8]]],
 ['emberwake-sfx-only','editorial-sfx',[[.0,1.7],[9.6,10.1],[31.0,31.4]]]
]){
 const source=pcm('media/'+wav+'.wav'),final=pcm('videos/'+video+'.mp4');
 for(const[a,b]of windows){let best={correlation:-1,lagSamples:0};for(let lag=-1600;lag<=1600;lag+=4){let cross=0,ss=0,ff=0;for(let i=Math.round(a*48000);i<Math.round(b*48000);i+=16){const j=i+lag;if(i<0||j<0||j>=final.length)continue;const x=source[i],y=final[j];cross+=x*y;ss+=x*x;ff+=y*y;}const correlation=cross/Math.sqrt(ss*ff);if(correlation>best.correlation)best={correlation,lagSamples:lag};}results.push({video,window:[a,b],...best,lagSeconds:best.lagSamples/48000,lagFrames:best.lagSamples/1600});}
}
const pass=results.every(r=>Math.abs(r.lagFrames)<=1&&r.correlation>.80);
fs.writeFileSync(path.join(root,'qa/audio-sync.json'),JSON.stringify({status:pass?'PASS_AAC_NUMERIC_TIMING_WITHIN_ONE_VIDEO_FRAME':'FAIL',method:'Normalized waveform cross correlation on three separate windows per AAC output; ±1600 samples, 4-sample lag steps, 16-sample signal steps.',sampleRate:48000,fps:30,results,scope:{numericTimingOnly:true,directWholeAudition:false,popularSongSync:false}},null,2)+'\n');
if(!pass)throw Error('AAC timing/correlation check failed');console.log('AAC timing verified');
