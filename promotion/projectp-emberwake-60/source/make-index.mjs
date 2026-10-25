/** Issue88: offline player, exact post copy and notes derived from the edit. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const DEFAULT_ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const SCRIPT_NAME='台本-#0088EMBERWAKE初投稿60秒.md';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const link=s=>s.split('/').map(encodeURIComponent).join('/');
const sec=t=>Number(t).toFixed(3);
const cell=s=>String(s).replaceAll('|','／').replaceAll('\n',' / ');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));

export function makeIndex(destination=DEFAULT_ROOT){
  const root=path.resolve(destination),e=json(path.join(root,'source/edit.json'));
  if(episodes.length!==1||e.id!=='01'||e.slug!=='emberwake-campfire-60'||e.duration!==60||e.shots.length!==18)throw Error('Expected the single eighteen-shot EMBERWAKE sixty-second edit.');
  if(JSON.stringify(e)!==JSON.stringify(episodes[0]))throw Error('edit.json and episodes.mjs differ; rebuild the edit first.');
  const posts=json(path.join(root,'source/投稿文.json'));
  for(const key of ['title','tiktok','shortsTitle','shortsDescription'])if(typeof posts[key]!=='string'||!posts[key].trim())throw Error('Missing post field: '+key);
  if(e.crowdfunding.state!=='unpublished'||posts.crowdfunding?.state!=='unpublished'||e.crowdfunding.publicSupportUrl!==null||posts.crowdfunding.publicSupportUrl!==null||posts.url!=='')throw Error('CAMPFIRE publication state changed; review the CTA before generating this preparation version.');
  for(const key of ['statusCopy','actionCopy'])if(posts.crowdfunding[key]!==e.crowdfunding[key])throw Error('Post/edit CAMPFIRE CTA differs: '+key);
  if([posts.tiktok,posts.shortsTitle,posts.shortsDescription].some(s=>/https?:\/\//i.test(s)))throw Error('This preparation version must not include an unconfirmed URL.');
  const n=e.id+'-'+e.slug,video='videos/'+n+'.mp4',cover='videos/'+n+'-cover.jpg';
  const frames=Math.round(e.duration*30),shortsCopy=posts.shortsTitle+'\n\n'+posts.shortsDescription;
  const controls=String.raw`const status=document.getElementById('copy-status');
async function copyPost(button){
  const text=document.getElementById(button.dataset.copy).value;
  let copied=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{}
  if(!copied){
    const previous=document.activeElement,buffer=document.createElement('textarea');
    buffer.value=text;buffer.readOnly=true;buffer.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(buffer);buffer.select();buffer.setSelectionRange(0,text.length);
    try{copied=document.execCommand('copy');}catch{}
    buffer.remove();if(previous&&typeof previous.focus==='function')previous.focus();
  }
  status.textContent=copied?'コピーしました。':'コピーできませんでした。投稿文を選択してコピーしてください。';
}
for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',()=>copyPost(button));
const player=document.getElementById('film'),notice=document.getElementById('play-status');
player.addEventListener('loadedmetadata',()=>{notice.hidden=true;});
player.querySelector('source').addEventListener('error',()=>{notice.hidden=false;});`;
  const html=`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src 'self' file:; img-src 'self' file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>${esc(posts.title)}｜ProjectP</title>
<style>
:root{color-scheme:dark;--field:#08151e;--panel:#10232d;--ink:#f3e7ca;--muted:#b1c4c6;--line:#3f555c;--ember:#edb468}*{box-sizing:border-box}body{margin:0;background:var(--field);color:var(--ink);font:16px/1.85 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:1100px;margin:auto;padding:36px 24px 24px}.eyebrow{margin:0 0 8px;color:var(--ember);font-size:13px;font-weight:700;letter-spacing:.12em}h1{font-size:clamp(28px,4.3vw,44px);line-height:1.5;letter-spacing:-.02em;margin:0}.intro{margin:13px 0 12px;color:var(--muted)}.campaign{margin:0 0 28px;padding:11px 15px;border-left:3px solid var(--ember);background:var(--panel);font-size:14px}.layout{display:grid;grid-template-columns:minmax(260px,370px) minmax(0,1fr);gap:38px;align-items:start}.player{margin:0;position:sticky;top:20px}video{display:block;width:100%;aspect-ratio:9/16;max-height:78vh;object-fit:contain;background:#03090e;border:1px solid var(--line);border-radius:12px}.video-meta,.play-status{font-size:13px;color:var(--muted);margin:10px 0}.play-status{padding:8px;border:1px solid var(--line)}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}a{color:var(--ink);text-underline-offset:4px}.action,button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 13px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:inherit;font-size:14px;font-weight:650;text-decoration:none;cursor:pointer}.action.primary{background:var(--ember);border-color:var(--ember);color:var(--field)}button:hover,.action:hover{border-color:var(--ember)}:focus-visible{outline:3px solid var(--ember);outline-offset:3px}.post{padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid var(--line)}.post-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}h2{margin:0;font-size:21px;line-height:1.5}label{display:block;font-size:13px;font-weight:650;margin:10px 0 4px;color:var(--muted)}textarea{display:block;width:100%;resize:vertical;padding:13px 14px;border:1px solid var(--line);border-radius:8px;background:#0b1b25;color:var(--ink);font:14px/1.85 system-ui,sans-serif;overflow-wrap:anywhere}#tiktok-copy{min-height:330px}#shorts-description{min-height:360px}.copy-hint{font-size:12px;color:var(--muted);margin:5px 0 0}.copy-status{min-height:1.8em;color:var(--ember);font-size:13px;margin:0 0 16px}details{font-size:13px;color:var(--muted)}summary{cursor:pointer;text-decoration:underline;text-underline-offset:4px}.small-links{display:flex;gap:16px;flex-wrap:wrap}footer{margin-top:28px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}footer p{margin:5px 0}[hidden]{display:none!important}@media(max-width:760px){main{padding:24px 18px}.layout{grid-template-columns:1fr;gap:26px}.player{position:static;max-width:390px;width:100%;margin:auto}video{max-height:76vh}.post-head{align-items:flex-start}h1{font-size:28px}.intro{font-size:14px}.campaign{font-size:13px}.post{padding-bottom:20px;margin-bottom:20px}}
</style>
</head>
<body><main>
<header><p class="eyebrow">PROJECTP / ぷいの制作記録</p><h1>EMBERWAKE<br>制作、本格化。</h1><p class="intro">灯を運び、道をひらく。全5章のデモから、本制作へ。</p><p class="campaign">CAMPFIREでの${esc(e.crowdfunding.statusCopy)}。${esc(e.crowdfunding.actionCopy)}</p></header>
<div class="layout">
<figure class="player"><video id="film" controls playsinline preload="metadata" poster="${cover}" aria-label="${esc(posts.title)}"><source src="${video}" type="video/mp4">動画は<a href="${video}">こちらから再生</a>できます。</video><figcaption class="video-meta">EMBERWAKE 灰の灯 / 1本・60秒</figcaption><p id="play-status" class="play-status" role="status" hidden>動画ファイルを読み込めません。書き出し完了後、動画と同じフォルダー構成で開いてください。</p><div class="actions"><a class="action primary" href="${video}" target="_blank" rel="noopener">別ウィンドウで再生</a><a class="action" href="${video}" download>動画をダウンロード</a></div></figure>
<div class="posts">
<section class="post" aria-labelledby="tiktok-heading"><div class="post-head"><h2 id="tiktok-heading">TikTok</h2><button type="button" data-copy="tiktok-copy" aria-label="TikTokの投稿文をコピー">投稿文をコピー</button></div><label for="tiktok-copy">投稿文</label><textarea id="tiktok-copy" readonly rows="15" spellcheck="false">${esc(posts.tiktok)}</textarea></section>
<section class="post" aria-labelledby="shorts-heading"><div class="post-head"><h2 id="shorts-heading">YouTube Shorts</h2><button type="button" data-copy="shorts-copy" aria-label="YouTube Shortsのタイトルと説明をコピー">タイトル＋説明をコピー</button></div><label for="shorts-title">タイトル</label><textarea id="shorts-title" readonly rows="2" spellcheck="false">${esc(posts.shortsTitle)}</textarea><label for="shorts-description">説明</label><textarea id="shorts-description" readonly rows="18" spellcheck="false">${esc(posts.shortsDescription)}</textarea><textarea id="shorts-copy" hidden aria-hidden="true" readonly>${esc(shortsCopy)}</textarea><p class="copy-hint">タイトル、空行、説明の順にコピーします。</p></section>
<p id="copy-status" class="copy-status" role="status" aria-live="polite"></p>
<details><summary>編集原本と台本</summary><p class="small-links"><a href="projects/${n}.ecproj">EffectCraft原本</a><a href="projects/${n}.fcproj">FilmCraft原本</a><a href="source/${link(SCRIPT_NAME)}">台本</a><a href="README.md">再制作・確認範囲</a></p></details>
</div></div>
<footer><p>ProjectP / ぷい</p><p>開発中の実ゲームと、3Dの開発イメージを含みます。</p></footer>
</main><script>${controls}</script></body></html>\n`;

  const rows=e.shots.map((s,i)=>{
    const source=e.sources[s.source];
    let input,handling;
    if(s.kind==='code'){input=s.codeSource;handling='実ファイルの抜粋を組版。IDE操作の収録ではない';}
    else if(source.sequence){input=source.path+' / 元 '+sec(s.offset)+'–'+sec(s.offset+s.b-s.a)+'秒';handling='実ゲームPNG連番30fps / 全景と注目部分';}
    else if(s.kind==='cinema'){input=source.path+' / 元 '+sec(s.offset||0)+'–'+sec((s.offset||0)+(s.b-s.a)*(s.rate||1))+'秒';handling='Blenderによる開発イメージ / '+(s.rate||1)+'倍速';}
    else {input=source.path;handling=s.kind==='funding'?'実CAMPFIRE制作素材のメイン画像':'実ゲームの保存画像';}
    const display=[...s.heading,s.caption,...(s.kind==='end'?[e.crowdfunding.statusCopy,e.crowdfunding.actionCopy]:[])].join(' / ');
    return '| '+String(i+1).padStart(2,'0')+' | '+sec(s.a)+'–'+sec(s.b)+' | '+Math.round(s.a*30)+'–'+Math.round(s.b*30)+' | '+cell(display)+' | '+cell(s.label)+' | '+cell(input)+' | '+cell(handling)+' |';
  });
  const script=`# EMBERWAKE 初投稿60秒・台本\n\n${posts.title}\n\n${frames}フレーム / 30fps / ${sec(e.duration)}秒 / ${e.shots.length}カット。時刻・字幕・素材は [edit.json](edit.json) と [episodes.mjs](episodes.mjs)、投稿文は [投稿文.json](${link('投稿文.json')}) を正本とします。\n\n## 一話の軸\n\n芯石をはめると道ができる実ゲームの変化から始め、EMBERWAKEの制作本格化を伝えます。I章の運ぶ・はめる・登る・灯すという遊びと、II〜V章の景色を見せ、全5章デモから本制作へ進む現在地を示します。実装の一部、3Dの開発イメージを挟み、CAMPFIREでの応援と公開案内のフォローへつなぎます。\n\nCAMPFIREの現在の表現は「${e.crowdfunding.statusCopy}」。締めは「この制作を、応援してください。」「${e.crowdfunding.actionCopy}」。支援リンクは記載しません。\n\n## カットと画面の文言\n\nフレーム区間の終端は次カットの開始です。ゲームの元時刻は30fps連番の先頭を0秒とします。\n\n| カット | 完成動画の秒 | フレーム | 主な表示 | 出典ラベル | 元素材・使用区間 | 扱い |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n## 実コードの抜粋\n\n${e.shots.find(s=>s.kind==='code').codeSource}\n\n\x60\x60\x60gdscript\n${e.shots.find(s=>s.kind==='code').code.trimEnd()}\n\x60\x60\x60\n\n[real-code-excerpt.txt](real-code-excerpt.txt) と元素材の照合記録を参照します。コードを組版したカットであり、エディタで入力・編集した実演ではありません。\n\n## 素材の区別と音\n\n- 実ゲームは開発中の v${e.gameVersion}。全5章のデモが存在することと、製品版が完成・公開済みであることを区別します。\n- 3Dカットは「開発イメージ（3D演出）」と表示します。実ゲームは2Dであり、そのプレイ画面や完成版の仕様として説明しません。\n- CAMPFIREカットは制作済みの実メイン画像です。募集ページの公開画面の収録ではありません。\n- BGMは本動画用の制作音源。歌・台詞・外部サンプルは使いません。音の処理と検査記録は [audio.mjs](audio.mjs) と最終qaを参照します。\n\n## 投稿前の扱い\n\n${e.crowdfunding.checkedForDate}時点の制作判断は公開準備中です。正式な公開状態・公開URLを再確認し、公開後に案内へ変更する場合は動画・投稿文・一覧をそろえます。募集中、プロフィールへのリンク、金額、リターン、提供日、完成保証を未確認で追加しません。\n\nこの台本・一覧の生成は動画の品質合格を意味しません。直接の全編視聴・試聴、実機での再生、ownerの創作採用、SNS投稿・予約、CAMPFIRE公開は、それぞれ最終qaと実施記録で確認します。この生成作業では実施していません。\n\n## TikTok投稿文\n\n${posts.tiktok}\n\n## YouTube Shortsタイトル\n\n${posts.shortsTitle}\n\n## YouTube Shorts説明\n\n${posts.shortsDescription}\n`;

  const readme=`# EMBERWAKE 初投稿60秒\n\n[動画を再生](index.html) / [MP4](${video}) / [台本](source/${link(SCRIPT_NAME)}) / [投稿文](source/${link('投稿文.json')})\n\nEMBERWAKEの制作本格化と、CAMPFIREでの応援につなぐ初投稿1本です。${sec(e.duration)}秒、${frames}フレーム、1080×1920、30fps。芯石の仕掛けから全5章のデモ、実コードと開発イメージを見せます。\n\n## 公開案内の現在地\n\n${e.crowdfunding.checkedForDate}時点ではCAMPFIREは公開準備中。動画・投稿文・一覧は「応援してください」「フォローで、公開のお知らせを。」で統一し、支援URLは空欄です。正式な公開状態と公開URLを再確認し、公開済みとなった場合にCTAを更新します。未確認の募集開始、リンク先、目標額、リターン、提供日や完成保証は追加しません。SNSへの投稿・予約やCAMPFIREページの編集・公開は、この制作には含めていません。\n\n## 再制作\n\nWSLのNode.jsと、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。\n\n\x60\x60\x60bash\nnode source/build-edit.mjs\nnode source/audio.mjs\nnode source/produce.mjs prepare\nnode source/produce.mjs render\nnode source/verify.mjs\nnode source/make-index.mjs\nnode source/package.mjs\n\x60\x60\x60\n\n\x60build-edit.mjs\x60 をやり直すには、同スクリプトが参照する元素材、全5章のcaptureとfocus記録、PNG連番、3D映像、CAMPFIREメイン画像、GDScript原ファイルが必要です。\x60audio.mjs\x60 は参照元の音源・制作スクリプトも照合するため、同ファイルに記録した元パスが必要です。\n\n保存済みの \x60source/edit.json\x60、\x60source/episodes.mjs\x60、\x60media\x60 内の各PNG連番・映像・画像とmixがそろっていれば、prepareから再出力できます。素材のフォルダー構成とPNG連番の名前を保ってください。 納品先にはFilmCraft参照用のProResマスターも同梱します。大容量マスターはGitには含めず、必要ならprepare・renderから再生成します。packageは納品先へコピー・再リンクし、その場所から原本を再読込・保存・描画して対応するSHAを記録する工程です。既定納品先は \x60F:\\Videos\\ProjectP-EMBERWAKE-60秒-2026-10-25\x60。ネイティブcomp名は \x60${e.compName}\x60 です。\n\n## 素材と編集の入口\n\n- [edit.json](source/edit.json) / [episodes.mjs](source/episodes.mjs)：18カットの時刻、文字、素材パス、注目位置、CAMPFIREの状態。\n- [build-edit.mjs](source/build-edit.mjs)：元素材の入口と連番コピー。ゲーム v${e.gameVersion}、元commit \x60${e.sourceCommit}\x60。\n- \x60media/chapter-I\x60〜\x60chapter-V\x60：実ゲームの30fps PNG連番。\x60dawn-still.png\x60 は実ゲームの保存画像。\n- \x60media/cinema-*.mp4\x60：Blenderで制作した開発イメージ。実ゲームは2Dで、3Dのプレイ動画ではありません。\n- [real-code-excerpt.txt](source/real-code-excerpt.txt)：実GDScriptの抜粋。組版表示で、入力操作の収録ではありません。\n- [CAMPFIREメイン画像](media/campfire-main.png)：制作済みの実画像。公開ページの収録ではありません。\n- [audio.mjs](source/audio.mjs) / [mix](media/${e.mix})：本動画用の制作BGM。外部サンプル・歌声なし。制作方法と音量等の記録は最終qaを参照します。\n- [EffectCraft原本](projects/${n}.ecproj) / [FilmCraft原本](projects/${n}.fcproj)：編集プロジェクト。\n\n## 確認範囲\n\n動画・原本・qaは制作の進行に合わせて生成されます。一覧と台本の生成だけで検査成功にはしません。形式・全デコード・音量・素材欠損・動画/mix/原本のSHAは最終の \x60qa/${n}/technical.json\x60 と各検査記録、納品先からの再読込・保存・描画とSHAは \x60qa/portable-package.json\x60 を参照します。\n\nこの文書の生成作業では、直接の全編視聴・試聴、スマートフォン等の実機再生、ownerの創作採用、SNSへの投稿は実施・判定していません。実施した検査と残る確認は最終qaと報告で区別します。全5章のデモは製品版の完成・公開や完成保証を意味しません。\n\n管理：Pui-core/- #88。一覧・README・台本は \x60node source/make-index.mjs\x60 で再生成します。投稿文正本を変更した場合も再実行します。\n`;

  fs.writeFileSync(path.join(root,'index.html'),html);
  fs.writeFileSync(path.join(root,'README.md'),readme);
  fs.writeFileSync(path.join(root,'source',SCRIPT_NAME),script);
  const references=[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(m=>decodeURIComponent(m[1]));
  const missingFiles=[...new Set(references.filter(p=>!fs.existsSync(path.join(root,p))))];
  const result={generated:['index.html','README.md','source/'+SCRIPT_NAME],frames,seconds:e.duration,shots:e.shots.length,localReferences:references.length,missingFiles};
  console.log(JSON.stringify(result));return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))makeIndex(process.env.PUI_CREATOR_ROOT||DEFAULT_ROOT);
