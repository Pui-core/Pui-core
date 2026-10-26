import fs from 'node:fs';
import path from 'node:path';
import {file,copy,hash,save} from './native.mjs';
const capture='/home/pui/tmp/projectp112-capture-20261026/full01';
const receipt=JSON.parse(fs.readFileSync(path.join(capture,'capture.json'),'utf8'));
if(receipt.status!=='PASS_FULL_CAPTURE_PENDING_VIDEO_REVIEW'||receipt.frame_count!==1868)throw Error('Unexpected actual full capture');
const actual=receipt.events.find(e=>e.label==='actual-result');
const journal=receipt.events.find(e=>e.label==='actual-journal-page'&&e.story_page===1);
if(actual?.hearths?.join(',')!=='0,1,2'||actual?.falls!==0||journal?.labels?.[2]!=='失った記憶：公園でルミと走り回った午後。')throw Error('Story claims do not match actual recorded GUI');
const inputs=[];
for(let i=0;i<receipt.frame_count;i++){
 const name='frame-'+String(i).padStart(6,'0')+'.png';
 const src=path.join(capture,'frames',name),dst=file('media/game/'+name);
 copy(src,dst);inputs.push({file:'media/game/'+name,sha256:hash(src),bytes:fs.statSync(src).size});
}
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'),'utf8'));
if(hash(edit.bgm.source)!==edit.bgm.sha256)throw Error('BGM108 final revision03 differs');
copy(edit.bgm.source,file('media/connecting-lights-master.wav'));
for(const i of [10,50,95,140,434,446,507,512,791,805,1107,1125,1160,1400,1500,1680,1860])copy(file('media/game/frame-'+String(i).padStart(6,'0')+'.png'),file('qa/capture-'+String(i).padStart(6,'0')+'.png'));
save('qa/raw-capture-binding.json',{sourceCommit:receipt.sourceCommit,version:receipt.gameVersion,captureReceiptSha256:hash(path.join(capture,'capture.json')),frames:receipt.frame_count,fps:30,seconds:receipt.frame_count/30,inputs,actualResult:actual,actualMemory:journal,coreSourceMutated:false,userData:receipt.userdata_proof,gameAudio:false,notHumanPlay:true,notRta:true,exclusion:{frame:1500,reason:'Original product notebook1 long line clips outside its right viewport; this page is not in the final cut',productFixInScope:false},wholeDirectWatch:false});
console.log(JSON.stringify({framesCopied:inputs.length,resultFrame:actual.frame,journalFrame:journal.frame,bgmSha256:hash(file('media/connecting-lights-master.wav'))}));
