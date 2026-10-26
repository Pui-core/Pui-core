/** A single A plan: promise first, achievement explains it, real sentence wraps EOF. */
import fs from 'node:fs';
import path from 'node:path';
import {root,version,archive,playbackRate,snap,loadEdit} from './config.mjs';
const oldRoot='/home/pui/Videos/Osayu-Bingo/2026-10-26/archive-jet-v4';
const selected=JSON.parse(fs.readFileSync(oldRoot+'/research/selections.json','utf8'));
const roles=selected.selections,duration=736/30;
function voice(id,role,start,duration){const s=roles[role];return {id,role,start:snap(start),duration,sourceIn:s.sourceIn,sourceOut:s.sourceIn+duration*playbackRate,playbackRate,pitchPreserved:true,transcript:s.transcript,caption:s.caption};}
const head=voice('promise-hook','teaser',0,64/30);
head.transcript='後日歌ってみたサビだけ投稿だからね。';
const tailDuration=31/30;
const tail={id:'loop-condition',role:'loop-condition',start:705/30,duration:tailDuration,sourceIn:head.sourceIn-tailDuration*playbackRate,sourceOut:head.sourceIn,playbackRate,pitchPreserved:true,transcript:'でもね、これ全部埋まったらね。',caption:'歌ってみたサビ、後日公開！'};
const voices=[head,voice('first-viewer','request',206/30,72/30),voice('gift-reaction','reaction',327/30,45/30),voice('bingo','bingo',519/30,69/30),voice('thanks','closing',21,45/30),tail];
const inserts=voices.map((v,i)=>{const start=v.start,end=i===0?70/30:snap(v.start+v.duration),id=v.id+'-live';return {id,voiceId:v.id,start,end,kind:'archive',group:id,caption:v.caption,sourceIn:v.sourceIn,sourceOut:v.sourceIn+(end-start)*playbackRate,playbackRate,loopLeadIn:i===5};});
const shots=[];let cursor=0,index=0;
for(const s of inserts){if(s.start>cursor)shots.push({id:'original-graphics-'+(++index),start:cursor,end:s.start,kind:'title',group:'original-graphics-'+index,caption:'',originalGraphics:true});shots.push(s);cursor=s.end;}
const loop={enabled:true,openingShotId:'promise-hook-live',bridgeShotId:'loop-condition-live',seamTime:duration,bridgeDuration:tailDuration,musicJoinSeconds:.15,reasonStart:22.5,reasonEnd:23.5,
  musicBeatCount:72,idealBeatDuration:72*60/176,frameQuantizationErrorSeconds:duration-72*60/176,
  voiceJoin:{headCueId:head.id,prefixCueId:tail.id,sourceIn:tail.sourceIn,sourceOut:head.sourceOut,sourceSeam:head.sourceIn,playbackRate,sampleRate:48000,splitSamples:49600,totalSamples:152000,fadeInSeconds:.015,fadeOutSeconds:.020,internalJoinFadeSeconds:0,processing:'One continuous original decode and atempo, then split and rotate across EOF'}};
const edit={version,compositionMode:'live-during-all-speech',duration,drop:2,musicStart:0,musicGainMode:'constant',climax:17,outro:21,archive,archiveSha256:selected.archiveSha256,playbackRate,pitchPreserved:true,sourceClock:'archive-container-seconds',audioCutMode:'direct-container-seek-continuous-samples',shots,voice:voices,inserts,loop,originalGraphicsSeconds:duration-inserts.reduce((n,s)=>n+s.end-s.start,0),originalGraphicsSource:'V3 thankyou-3plans motion; A styling and original artwork retained',dialogueFabricated:false,sourceSpeechTimeStretched:true,storyChronology:'Promise is stated first, bingo reactions explain it, then the original conditional sentence continues over the loop seam.',bingoGridOrder:'Original illustrative stamp order preserved.'};
fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'edit-manifest.json'),JSON.stringify(edit,null,2)+'\n');loadEdit();
console.log(JSON.stringify({version,plans:1,duration,frames:736,insertCount:inserts.length,voiceEvents:voices.length,loop,originalGraphicsSeconds:edit.originalGraphicsSeconds}));
