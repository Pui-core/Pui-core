/** Preserve graphical interludes; show matching live footage for every spoken phrase. */
import fs from 'node:fs';
import path from 'node:path';
import {root,version,archive,playbackRate,snap,loadEdit} from './config.mjs';

const oldRoot='/home/pui/Videos/Osayu-Bingo/2026-10-26/archive-jet-v4';
const selected=JSON.parse(fs.readFileSync(oldRoot+'/research/selections.json','utf8'));
const roles=selected.selections;
function voice(id,role,start,duration){const s=roles[role];return {id,role,start,duration,sourceIn:s.sourceIn,sourceOut:s.sourceIn+duration*playbackRate,playbackRate,pitchPreserved:true,transcript:s.transcript,caption:s.caption};}
const voices=[voice('opening','opening',0,2.6),voice('first-viewer','request',6.85,2.4),voice('gift-reaction','reaction',10.9,1.5),voice('bingo','bingo',17.3,2.3),voice('closing','closing',21,1.5),voice('teaser-promise','teaser',22.65,32/15)].map(v=>({...v,start:snap(v.start)}));
const inserts=voices.map((v,i)=>{
  const start=v.start,end=i===4?voices[5].start:i===5?25:snap(v.start+v.duration),id=v.id+'-live';
  return {id,voiceId:v.id,start,end,kind:'archive',group:id,caption:v.caption,sourceIn:v.sourceIn,sourceOut:v.sourceIn+(end-start)*playbackRate,playbackRate};
});
const shots=[];let cursor=0,index=0;
for(const s of inserts){if(s.start>cursor)shots.push({id:'original-graphics-'+(++index),start:cursor,end:s.start,kind:'title',group:'original-graphics-'+index,caption:'',originalGraphics:true});shots.push(s);cursor=s.end;}
if(cursor<25)shots.push({id:'original-graphics-'+(++index),start:cursor,end:25,kind:'teaser',group:'original-graphics-'+index,caption:'',originalGraphics:true});
const edit={version,compositionMode:'live-during-all-speech',duration:25,drop:2,musicStart:0,musicGainMode:'constant',climax:17,outro:21,archive,archiveSha256:selected.archiveSha256,playbackRate,pitchPreserved:true,sourceClock:'archive-container-seconds',audioCutMode:'direct-container-seek-continuous-samples',shots,voice:voices,inserts,originalGraphicsSeconds:25-inserts.reduce((n,s)=>n+s.end-s.start,0),originalGraphicsSource:'V3 thankyou-3plans motion; character and paper background unchanged',dialogueFabricated:false,sourceSpeechTimeStretched:true,storyChronology:'Live reactions and promises with graphical bingo interludes; not a chronological reconstruction.',bingoGridOrder:'Original illustrative stamp order preserved.'};
fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'edit-manifest.json'),JSON.stringify(edit,null,2)+'\n');loadEdit();
console.log(JSON.stringify({version,duration:25,frames:750,insertCount:inserts.length,insertSeconds:25-edit.originalGraphicsSeconds,originalGraphicsSeconds:edit.originalGraphicsSeconds,voiceEvents:voices.length,playbackRate}));
