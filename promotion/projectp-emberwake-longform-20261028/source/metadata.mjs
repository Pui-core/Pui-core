import fs from 'node:fs';import {file,save,hash} from './native.mjs';
const edit=JSON.parse(fs.readFileSync(file('source/edit.json'))),last=edit.episodes.at(-1),pad=n=>String(n).padStart(2,'0'),stamp=t=>{const s=Math.floor(t);return Math.floor(s/60)+':'+pad(s%60);};
const chapters=[{time:0,title:'約束と、最初の忘却'},{time:edit.episodes[1].startFrame/30,title:'急な二段の近道、渡れる？'},...edit.episodes.filter(e=>e.id>3&&e.episodeInChapter===1).map(e=>({time:e.startFrame/30,title:({2:'面影：雨の街と向かい風',3:'忘却：風向きと、遠ざかる声',4:'帰る場所：鐘楼の記録',5:'最後の灯へ続く道'})[e.chapter]})),{time:edit.meaningfulUniqueSeconds,title:'作品の続きを'}];
const description=[
'各話を初めてクリアするたび、思い出をひとつ失う。',
'今回は1章1話〜'+last.chapter+'章'+last.episodeInChapter+'話「'+last.title+'」までの物語を含みます。',
'自作ゲーム「EMBERWAKE」の制作版を、約束と道の選択からたどります。',
'急な二段の近道へのダッシュ、変わる地形と風、点灯のあとに残る手帳。実際の操作と結果をつないだ本編です。',
'',
'制作版0.12.0の自動入力による実画面です。',
'',
...chapters.map(c=>stamp(c.time)+' '+c.title),
'',
'ゲーム・アプリを作る、ぷい。作品の仕掛けと、その続きを発信しています。',
'',
'VOICEVOX:青山龍星',
'BGM: Connecting Lights（自作BGM）',
'キャラクターモデル: Revenant_Natural',
'ゲーム音は未収録。ナレーションとBGMを合わせています。',
'',
'#EMBERWAKE #自作ゲーム #インディーゲーム'
].join('\n');
fs.mkdirSync(file('metadata'),{recursive:true});fs.writeFileSync(file('metadata/title.txt'),edit.title+'\n');fs.writeFileSync(file('metadata/description.txt'),description+'\n');
save('metadata/youtube.json',{title:edit.title,description,madeForKids:false,paidPromotion:false,alteredContent:false,alteredContentRationale:"Owner latest instruction: no blanket AI label; actual fictional gameplay, generic VOICEVOX narration and clearly animated Live2D host; no realistic person/event impersonation",category:'Gaming',tags:[],language:'ja',sourceVersion:'Production0.12.0',claimedLatestPublicVersion:false,actualPublishId:null,actualPublishedAt:null,desiredPublication:'Root to decide current slot and publish; source writer performs no SNS operation',duration:edit.duration,meaningfulUniqueSeconds:edit.meaningfulUniqueSeconds,chapters,existingMatchingShort:{id:'GrBDKzvnW58',url:'https://www.youtube.com/shorts/GrBDKzvnW58',currentRelatedTargetPreserved:'a0TstalrQ64',newRelatedTarget:null,nativeNewRelatedConfigured:false},heldEpisode2Short:{actualNativeId:null,sourceProductionIssue:117,publishRequiresRootDecision:true,matchingBranchAnswerIncluded:true},musicThemeVideo:false,sourceCommit:edit.sourceCommit});
const html='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EMBERWAKE 正式本編</title><style>body{margin:0;background:#07131d;color:#f1dfc0;font-family:Meiryo,sans-serif}main{max-width:1100px;margin:40px auto;padding:24px}video{width:100%;max-height:70vh;background:#000}a{color:#edb468}p{line-height:1.8}</style><main><h1>助けるために、思い出を使える？</h1><p>自作ゲーム EMBERWAKE 制作版0.12.0 ／ '+Math.floor(edit.duration/60)+'分'+pad(Math.round(edit.duration%60))+'秒</p><video controls preload="metadata" poster="covers/emberwake-longform.png" src="videos/emberwake-formal-longform.mp4"></video><p><a href="videos/emberwake-formal-longform.mp4">動画</a> ／ <a href="covers/emberwake-longform.png">サムネイル</a> ／ <a href="metadata/description.txt">投稿文</a></p><p>実ゲームの通常入力と結果をつないだ本編。技術検査と抽出画像の目視、全編の直接視聴・主観試聴、公開後の結果は個別にQA記録へ残しています。</p></main></html>';
const direction=file('qa/editorial-direction.json');const held=fs.existsSync(direction)&&JSON.parse(fs.readFileSync(direction)).sequential661FullRenderHold;fs.writeFileSync(file(held?'metadata/planned-formal-index.html':'index.html'),html);console.log(JSON.stringify({metadataReady:true,chapters:chapters.length,lastEpisode:last.id,duration:edit.duration,publicId:null}));
