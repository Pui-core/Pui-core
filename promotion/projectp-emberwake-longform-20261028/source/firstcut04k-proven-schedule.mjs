import fs from 'node:fs';
import {file,hash,save} from './native.mjs';
const previous=JSON.parse(fs.readFileSync(file('source/firstcut04j-edit.json')));
const plan=JSON.parse(fs.readFileSync(file('source/firstcut04k-paper-edit.json')));
const newVoices=JSON.parse(fs.readFileSync(file('qa/firstcut04k-voice-measurement.json'))).generatedCues;
const jump07=JSON.parse(fs.readFileSync(file('source/firstcut04k-jump07.json')));
const scenes={
 hook:[{file:'media/ep01-game.mp4',start:56.1,duration:2,description:'最初の喪失についての実ゲーム表示'}],
 mechanics:[{file:'media/ep01-game.mp4',start:30.1,duration:5,description:'第1話の灯と操作の実収録'}],
 fall:[{file:'media/ep01-replay-controls01-game.mp4',start:6.5333333333,duration:1,description:'短押しによる落下'}, {file:'media/ep01-replay-controls01-game.mp4',start:13.3333333333,duration:1,description:'同じ出発足場から長押しで着地'}],
 routes:[{file:'videos/emberwake-firstcut04k-route-pilot03.mp4',start:0,duration:7,description:'実収録の左右同期比較、音声は重ねない'}],
 art:[{file:'videos/emberwake-art-history20d.mp4',start:7,duration:6,description:'保存原画の二版の動作を同じ枠で比較、元の声は使わない'}],
 input:[{file:'videos/emberwake-firstcut04j-f-native.mp4',start:483,duration:5,description:'当時の入力実測値を使った比較図。元動画の音は使わない'}],
 city:[{file:'media/ep13-game.mp4',start:45,duration:2,description:'第13話のアーチが画面内に見える実収録'}]
};
const blocks=plan.blocks.map(b=>({...b,voices:[...b.voices],newVoiceIds:[...(b.newVoiceIds||[])]}));
blocks[0].voices.splice(1,0,'u002');
blocks.splice(1,0,{id:'mechanics',title:'灯とダッシュ',voices:['u006','u007','u008'],newVoiceIds:[]});
const input=blocks.find(b=>b.id==='input');input.newVoiceIds.splice(input.newVoiceIds.indexOf('jump06'),0,'jump07');
const sequence=[];let frame=0;const ids=new Set();
function addVoice(v){if(ids.has(v.id))throw Error('Duplicate voice '+v.id);ids.add(v.id);const p=file(v.file.startsWith('media/')?v.file:'media/'+v.file);if(!fs.existsSync(p)||hash(p)!==v.sha256)throw Error('Missing voice or mismatch '+v.id);const frames=Math.ceil(v.duration*30);sequence.push({type:'voice',id:v.id,file:p,startFrame:frame,endFrame:frame+frames,seconds:v.duration,sha256:v.sha256});frame+=frames+6;}
for(const b of blocks){
 for(const id of b.voices){const v=previous.voices.find(x=>x.id===id);if(!v)throw Error('Missing old voice '+id);addVoice({id,file:v.file,duration:v.end-v.at,sha256:v.sha256});}
 for(const id of b.newVoiceIds){const v=id==='jump07'?jump07:newVoices.find(x=>x.id===id);if(!v||!Number.isFinite(v.duration))throw Error('Missing measured new voice '+id);addVoice(v);}
 for(const a of scenes[b.id]||[]){if(!fs.existsSync(file(a.file)))throw Error('Missing visual source '+a.file);const frames=Math.round(a.duration*30);sequence.push({type:'distinct-visual-window',section:b.id,...a,startFrame:frame,endFrame:frame+frames,audio:'muted',sourceVerified:'candidate clip; selected proof frames or previous native render, full motion review pending'});frame+=frames;}
}
const out={status:'EXPERIMENTAL_MEASURED_SCHEDULE_NOT_RENDERED',frames:frame,duration:frame/30,voices:ids.size,sequence,
  limits:['Voice sample boundaries measured; 0.2s gap after each voice','Seven visual source windows allocated separately but their complete motion, current context and visual quality are not yet verified','Visual windows follow each section in this draft; this is not yet an accepted edit rhythm','Repeated information and thematic transitions require review','No actual 600-second MP4 is produced','Subjective listening and continuous viewing not performed'],published:false};
if(fs.existsSync(file('source/firstcut04k-proven-schedule.json')))throw Error('Preserve earlier schedule');
save('source/firstcut04k-proven-schedule.json',out);console.log(JSON.stringify({seconds:out.duration,voices:out.voices,visualWindows:sequence.filter(x=>x.type==='distinct-visual-window').length,rendered:false}));
