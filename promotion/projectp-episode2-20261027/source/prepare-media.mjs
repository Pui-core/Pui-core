import fs from 'node:fs';
import path from 'node:path';
import {file,copy,hash,save} from './native.mjs';
const capture='/home/pui/tmp/projectp117-capture-20261026/ep2full05';
const receipt=JSON.parse(fs.readFileSync(path.join(capture,'capture.json'),'utf8'));
if(receipt.status!=='PASS_FULL_CAPTURE_PENDING_ROOT_VISUAL_REVIEW'||receipt.frame_count!==1754)throw Error('Unexpected actual full capture');
const actual=receipt.events.find(e=>e.label==='actual-result');
const branchA=receipt.events.find(e=>e.label==='branch-dash-landed-branch-a');
const branchB=receipt.events.find(e=>e.label==='branch-dash-landed-branch-b');
const journal=receipt.events.find(e=>e.label==='actual-notebook-page'&&e.story_page===1);
if(actual?.hearths?.join(',')!=='0,1,2'||actual?.falls!==0)throw Error('Result claims do not match actual recorded GUI');
if(!branchA||Math.abs(branchA.player_position[1]-979.925)>1)throw Error('Branch A footing does not match recorded y980');
if(!branchB||Math.abs(branchB.player_position[1]-931.925)>1||branchB.player_position[0]>=810)throw Error('Branch B footing is not the exposed optional tile (y932, x<810); PP117-FOOTING-001 would not be satisfied');
if(journal?.labels?.[2]!=='失った記憶：暗い道で二度の灯を交わす合図を決めた夜。')throw Error('Journal text does not match actual recorded GUI');
const inputs=[];
for(let i=0;i<receipt.frame_count;i++){
 const name='frame-'+String(i).padStart(6,'0')+'.png';
 const src=path.join(capture,'frames',name),dst=file('media/game/'+name);
 copy(src,dst);inputs.push({file:'media/game/'+name,sha256:hash(src),bytes:fs.statSync(src).size});
}
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'),'utf8'));
if(hash(edit.bgm.source)!==edit.bgm.sha256)throw Error('BGM108 final revision03 differs');
copy(edit.bgm.source,file('media/connecting-lights-master.wav'));
for(const i of [0,70,115,160,205,480,547,601,627,643,660,669,723,737,804,1089,1154,1314,1399,1554,1700])copy(file('media/game/frame-'+String(i).padStart(6,'0')+'.png'),file('qa/capture-'+String(i).padStart(6,'0')+'.png'));
save('qa/raw-capture-binding.json',{sourceCommit:receipt.sourceCommit,version:receipt.gameVersion,captureAttempt:'ep2full05',captureReceiptSha256:hash(path.join(capture,'capture.json')),frames:receipt.frame_count,fps:30,seconds:receipt.frame_count/30,inputs,actualResult:actual,branchALanding:branchA,branchBLanding:branchB,actualJournal:journal,coreSourceMutated:false,userData:receipt.userdata_proof,gameAudio:false,notHumanPlay:true,notRta:true,footing:{resolves:'PP117-FOOTING-001',branchA:{frame:branchA.frame,position:branchA.player_position,tile:'branches[0] y980'},branchB:{frame:branchB.frame,position:branchB.player_position,tile:'branches[1] y932 exposed left lip; not route[6] y924'}},wholeDirectWatch:false});
console.log(JSON.stringify({framesCopied:inputs.length,resultFrame:actual.frame,branchA:branchA.player_position,branchB:branchB.player_position,journalFrame:journal.frame,bgmSha256:hash(file('media/connecting-lights-master.wav'))}));
