import fs from 'node:fs';
import path from 'node:path';
import {file,np,FF,run,save,hash,copy} from './native.mjs';
const long='/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02';
const old='/mnt/f/Videos/ProjectP-TruthOrLie-Short-2026-10-28/revision-04-clue-visual';
const input=path.join(long,'media/round2-hi-cfr.mp4'),expected='af30770f63e5e3d8a7b12c6e70d5790c7e8e67ad210db3d132fc9c15c8a12e0b';
if(hash(input)!==expected)throw Error('Existing real R2 video differs from its package manifest');
for(const n of ['round2-neutral-hi.png','round2-result-hi.png','round2-score-hi.png','cipher-source.mp3'])copy(path.join(long,'media',n),file('media/'+n));
for(const n of ['logo.png','natural-still.png'])copy(path.join(old,'media',n),file('media/'+n));
if(hash(file('media/cipher-source.mp3'))!=='d3d0614535a61d748e2fd8d5117fc4d781022a7624794802a2462d8af3fdd522')throw Error('Music source mismatch');
const clips=[
 {id:'five',from:44.7,to:47.9,crop:[1100,1500,40,570]},
 {id:'vote',from:61.8,to:63.4,crop:[1100,1510,40,480]},
 {id:'confirm',from:65.2,to:67.2,crop:[1100,2230,40,200]},
 {id:'result',from:67.1,to:69.1,crop:[1100,1350,40,280]},
 {id:'score',from:70.7,to:73.1,crop:[1100,2200,40,160]}
];
for(const c of clips){await run(FF,['-hide_banner','-v','error','-y','-ss',String(c.from),'-i',np(input),'-t',String(c.to-c.from),'-vf','crop='+c.crop.join(':'),'-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',np(file(`media/r2-${c.id}-v9.mp4`))],`v9-source-${c.id}.json`);c.file=`media/r2-${c.id}-v9.mp4`;c.sha256=hash(file(c.file));}
// Detail shots retain recorded UI and labels. No replacement questions or answers.
for(const [n,png,crop]of[['card2','neutral',[1030,370,80,850]],['card5','neutral',[1030,300,80,1820]],['scoreplus','score',[900,220,120,180]],['resultline','result',[1030,500,80,300]]]){
 await run(FF,['-hide_banner','-v','error','-y','-loop','1','-i',np(file(`media/round2-${png}-hi.png`)),'-t','1.6','-vf','crop='+crop.join(':'),'-an','-r','30','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',np(file(`media/r2-${n}-v9.mp4`))],`v9-detail-${n}.json`);
}
const driver='/home/pui/tmp/projectp-longform-20261027/capture/coder-round2-vote01/driver-source.swift',summary='/home/pui/tmp/projectp-longform-20261027/capture/coder-round2-vote01/test-summary.json';
const test=JSON.parse(fs.readFileSync(summary));if(test.result!=='Passed'||test.failedTests!==0)throw Error('Source QA did not pass');
save('source/real-v9-evidence.json',{inputSha256:expected,rawSha256:'7f1f903976c07aa34e17189f2886261f00dfb7ecc6abbacb25c6846a60d25315',recording:'coder-round2-vote01/normal-ui.mov',driverSha256:hash(driver),testSummarySha256:hash(summary),testPassed:1,answers:['美術館をゆっくり歩く','ワイヤレスイヤホン','温かい味噌汁','小説を読むこと','机の片づけ'],lieZeroBased:4,voteZeroBased:1,speaker:'操作例BB',guesser:'操作例AA',actualResult:'正解者なし・操作例BBに1点',actualScore:{AA:0,BB:2,roundDelta:{AA:0,BB:1}},clips,allClipsSameRecordedRound:true,fictionalAnswers:true,noNewUiOrVotesSynthesized:true});
save('source/bgm-cipher-v9-license.json',{title:'Cipher',composer:'Kevin MacLeod',sha256:hash(file('media/cipher-source.mp3')),bpm:150,source:'https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100844',primaryMetadata:'https://remote.incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1100844',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',licensePage:'https://incompetech.com/music/royalty-free/licenses/',credit:'Cipher — Kevin MacLeod (incompetech.com), CC BY 4.0. Excerpt, level, ducking and fade edits.',currentPrimarySourceVerified:true,subjectiveAudition:false,nativeTikTokSelection:false});
console.log('Real R2 clips prepared with source hashes, test proof, original questions and real outcome.');
