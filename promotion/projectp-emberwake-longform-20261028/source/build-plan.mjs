import fs from 'node:fs';import path from 'node:path';
import {file,save,hash} from './native.mjs';
const maximum=Number(process.argv[2]||11),draft=process.argv.includes('--draft');
if(!Number.isInteger(maximum)||maximum<3||maximum>15)throw Error('3..15 measured episodes required');
const workspace='/home/pui/tmp/projectp-emberwake-longform-20261028/production';
const story=JSON.parse(fs.readFileSync(path.join(workspace,'product/scripts/campaign/story.json')));
const selectedPath=file('source/selected-captures.json'),selected=fs.existsSync(selectedPath)?JSON.parse(fs.readFileSync(selectedPath)):{};
const segments=[],episodes=[];let frame=0;
function place(ep,kind,a,b,extra={}){if(!Number.isInteger(a)||!Number.isInteger(b)||b<=a||b>ep.rawFrames)throw Error('Invalid actual-source range');const s={index:segments.length,episode:ep.id,chapter:ep.chapter,kind,startFrame:frame,endFrame:frame+b-a,sourceStartFrame:a,sourceEndFrame:b,sourceFile:'media/ep'+String(ep.id).padStart(2,'0')+'-game.mp4',rate:1,freeze:false,...extra};segments.push(s);frame+=b-a;return s;}
for(let id=1;id<=maximum;id++){
 const attempt=selected[String(id)]||'ep'+String(id).padStart(2,'0')+(id<=3?'-pilot01':'-full01');
 if(!/^ep[0-9]{2}-[a-z0-9-]+$/.test(attempt))throw Error('Invalid explicit capture selection');
 const receiptPath=path.join(workspace,attempt,'capture.json'),r=JSON.parse(fs.readFileSync(receiptPath)),l=JSON.parse(fs.readFileSync(path.join(workspace,attempt+'-launch.json')));
 if(l.status!=='FINISHED'||r.status!=='PASS_EPISODE_CAPTURE_PENDING_REVIEW'||r.episode!==id||hash(receiptPath)!==l.receiptSha256)throw Error('Actual normal episode is not verified '+id);
 const intro=r.events.filter(e=>e.label==='actual-intro-page'),depart=r.events.find(e=>e.label==='ordinary-depart-play'),result=r.events.find(e=>e.label==='actual-result'),memory=r.events.find(e=>e.label==='actual-notebook-page'&&e.story_page===1),row=story.stages[id-1];
 if(!intro.length||!depart||!result||!memory||memory.labels[2]!=='失った記憶：'+row.memory)throw Error('Measured story timeline differs '+id);
 const resultStart=r.events.find(e=>e.label==='after-hearth-3'&&e.state==='result')?.frame??result.frame;
 const ep={id,chapter:row.chapter,episodeInChapter:row.episode,title:row.title,rawFrames:r.frame_count,sourceCommit:r.sourceCommit,captureReceiptSha256:hash(receiptPath),startFrame:frame,memory:row.memory,intro:r.events.filter(e=>e.label==='actual-intro-page').map(e=>({frame:e.frame,text:e.labels[2]})),resultText:result.labels[2],sourceDepartFrame:depart.frame,sourceResultFrame:resultStart,branch:r.events.filter(e=>e.label.startsWith('branch-dash-landed')||e.label==='actual-branch-merge-on-island').map(e=>({label:e.label,frame:e.frame,position:e.player_position,rect:e.actual_footing_rects}))};
 place(ep,'actual-intro',intro[0].frame,depart.frame,{actualPageFrames:intro.map(e=>e.frame)});
 const firstEnding=r.events.find(e=>e.label==='actual-ending-page');
 const play=place(ep,'actual-play',depart.frame,firstEnding?.frame??resultStart,{threeHearths:true,unbroken:true,endingPagesSkipped:!!firstEnding});ep.playStartFrame=play.startFrame;
 place(ep,'actual-result',resultStart,result.frame+180,{actualText:result.labels[2]});
 place(ep,'actual-memory',memory.frame,memory.frame+120,{actualText:memory.labels[2]});
 ep.endFrame=frame;ep.meaningfulSeconds=(ep.endFrame-ep.startFrame)/30;episodes.push(ep);
}
const meaningfulFrames=frame;
if(!draft&&meaningfulFrames<18000)throw Error('Measured meaningful unique footage is below 600sec; capture a distinct later episode rather than padding: '+meaningfulFrames/30);
const closingFrames=240;
segments.push({index:segments.length,kind:'author-closing',startFrame:frame,endFrame:frame+closingFrames,newHostAnimation:true,storyEndingNotClaimed:true});frame+=closingFrames;
const bgm={source:'/mnt/f/Videos/ProjectP-Original-BGM-2026-10-26/revision-03-native-soundcraft/audio/connecting-lights-master.wav',sha256:'4d3bdac03c4bbcd89511ea637265bd13d56e0f11f6b702ca4f01b66af49c50df',bpm:96,licensed:'Own original composition108',musicFrames:2400,backgroundOnly:true};
const edit={schemaVersion:1,status:draft?'DRAFT_MEASURED_PARTIAL_NOT600':'MEASURED_UNIQUE_FOOTAGE_GE600_PENDING_FINAL_RENDER',title:'助けるために、思い出を使える？｜自作ゲーム EMBERWAKE 制作版',question:'助けるために道を進むほど、どんな記憶を失うのか。二段の近道は本当に渡れるのか。',fps:30,width:1920,height:1080,duration:frame/30,frames:frame,meaningfulUniqueFrames:meaningfulFrames,meaningfulUniqueSeconds:meaningfulFrames/30,closingSeconds:closingFrames/30,sourceCommit:'71584a6bd0c8852885157de71032fd9252e7a04c',version:'Production0.12.0 (not verified latest public release)',selectedEpisodeIds:episodes.map(e=>e.id),all15Completed:maximum===15,fullEndingIncluded:false,gameAudioRecorded:false,captureMode:'Ordinary InputEventKey and unmodified physics; automated finite recording, not human/RTA/PB',segments,episodes,bgm,hostIntervals:[{startFrame:0,endFrame:228},...episodes.filter(e=>e.id>1&&e.episodeInChapter===1).map(e=>({startFrame:e.startFrame,endFrame:e.startFrame+240})),{startFrame:meaningfulFrames,endFrame:frame}],limits:['No repeated game frames or slowed gameplay to reach600','First long notebook page omitted; menu navigation omitted','No stone-carrying or path-rearrangement implementation claims','Old82second posts and their receipts retained; no SNS operation by source writer','HUD wallclock includes PNG writing; no time record claim']};
save('source/'+(draft?'edit-draft.json':'edit.json'),edit);
console.log(JSON.stringify({draft,episodes:maximum,meaningfulSeconds:edit.meaningfulUniqueSeconds,totalSeconds:edit.duration,frames:edit.frames,fullEndingIncluded:false}));
