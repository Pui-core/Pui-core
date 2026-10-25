/** Issue89: offline player and notes for the EMBERWAKE RTA V2 edit. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';
const DEFAULT_ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const SCRIPT_NAME='台本-#0089EMBERWAKE追従RTA版.md';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const link=s=>s.split('/').map(encodeURIComponent).join('/');
const sec=t=>Number(t).toFixed(3);
const cell=s=>String(s).replaceAll('|','／').replaceAll('\n',' / ');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const fence='`'.repeat(3);
const controls=String.raw`const status=document.getElementById('copy-status');
async function copyPost(button){
 const text=document.getElementById(button.dataset.copy).value;let copied=false;
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{}
 if(!copied){const previous=document.activeElement,buffer=document.createElement('textarea');buffer.value=text;buffer.readOnly=true;buffer.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(buffer);buffer.select();buffer.setSelectionRange(0,text.length);try{copied=document.execCommand('copy');}catch{}buffer.remove();previous?.focus?.();}
 status.textContent=copied?'コピーしました。':'コピーできませんでした。投稿文を選択してコピーしてください。';
}
for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',()=>copyPost(button));
const player=document.getElementById('film'),notice=document.getElementById('play-status');
player.addEventListener('loadedmetadata',()=>{notice.hidden=true;});
player.querySelector('source').addEventListener('error',()=>{notice.hidden=false;});`;

export function makeIndex(destination=DEFAULT_ROOT){
 const root=path.resolve(destination),e=json(path.join(root,'source/edit.json'));
 if(episodes.length!==1||e.id!=='01'||e.slug!=='emberwake-rta-v2'||e.compName!=='EMBERWAKE RTA V2'||e.duration!==60||e.shots.length!==18)throw Error('Expected the eighteen-shot EMBERWAKE RTA V2 edit.');
 if(JSON.stringify(e)!==JSON.stringify(episodes[0]))throw Error('edit.json and episodes.mjs differ; rebuild the edit first.');
 if(e.shots[4].kind!=='mode'||e.sources[e.shots[4].source]?.name!=='time-attack-menu'||e.shots.slice(9,13).some(s=>s.kind!=='game'||e.sources[s.source]?.chapter!=='I'))throw Error('Expected the real TIME ATTACK menu and chapter-I action edit.');
 const posts=json(path.join(root,'source/投稿文.json'));
 for(const k of ['title','tiktok','shortsTitle','shortsDescription'])if(typeof posts[k]!=='string'||!posts[k].trim())throw Error('Missing post field: '+k);
 if(e.crowdfunding.state!=='unpublished'||posts.crowdfunding?.state!=='unpublished'||e.crowdfunding.publicSupportUrl!==null||posts.crowdfunding.publicSupportUrl!==null||posts.url!=='')throw Error('Review the CAMPFIRE CTA before changing publication state.');
 for(const k of ['statusCopy','actionCopy'])if(posts.crowdfunding[k]!==e.crowdfunding[k])throw Error('Post/edit CTA differs: '+k);
 if([posts.tiktok,posts.shortsTitle,posts.shortsDescription].some(s=>/https?:\/\//i.test(s)))throw Error('No unconfirmed URL in this preparation version.');
 const n=e.id+'-'+e.slug,video='videos/'+n+'.mp4',cover='videos/'+n+'-cover.jpg',frames=Math.round(e.duration*30),shortsCopy=posts.shortsTitle+'\n\n'+posts.shortsDescription;
 const html=`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src 'self' file:; img-src 'self' file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>${esc(posts.title)}｜ProjectP</title>
<style>
:root{color-scheme:dark;--field:#08151e;--panel:#10232d;--ink:#f3e7ca;--muted:#b1c4c6;--line:#3f555c;--ember:#edb468}*{box-sizing:border-box}body{margin:0;background:var(--field);color:var(--ink);font:16px/1.85 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:1100px;margin:auto;padding:36px 24px 24px}.eyebrow{margin:0 0 8px;color:var(--ember);font-size:13px;font-weight:700;letter-spacing:.12em}h1{font-size:clamp(28px,4.3vw,44px);line-height:1.5;letter-spacing:-.02em;margin:0}.intro{margin:13px 0 12px;color:var(--muted)}.campaign{margin:0 0 28px;padding:11px 15px;border-left:3px solid var(--ember);background:var(--panel);font-size:14px}.layout{display:grid;grid-template-columns:minmax(260px,370px) minmax(0,1fr);gap:38px;align-items:start}.player{margin:0;position:sticky;top:20px}video{display:block;width:100%;aspect-ratio:9/16;max-height:78vh;object-fit:contain;background:#03090e;border:1px solid var(--line);border-radius:12px}.video-meta,.play-status{font-size:13px;color:var(--muted);margin:10px 0}.play-status{padding:8px;border:1px solid var(--line)}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}a{color:var(--ink);text-underline-offset:4px}.action,button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 13px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:inherit;font-size:14px;font-weight:650;text-decoration:none;cursor:pointer}.action.primary{background:var(--ember);border-color:var(--ember);color:var(--field)}button:hover,.action:hover{border-color:var(--ember)}:focus-visible{outline:3px solid var(--ember);outline-offset:3px}.post{padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid var(--line)}.post-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}h2{margin:0;font-size:21px;line-height:1.5}label{display:block;font-size:13px;font-weight:650;margin:10px 0 4px;color:var(--muted)}textarea{display:block;width:100%;resize:vertical;padding:13px 14px;border:1px solid var(--line);border-radius:8px;background:#0b1b25;color:var(--ink);font:14px/1.85 system-ui,sans-serif;overflow-wrap:anywhere}#tiktok-copy{min-height:330px}#shorts-description{min-height:360px}.copy-hint{font-size:12px;color:var(--muted);margin:5px 0 0}.copy-status{min-height:1.8em;color:var(--ember);font-size:13px;margin:0 0 16px}details{font-size:13px;color:var(--muted)}summary{cursor:pointer;text-decoration:underline;text-underline-offset:4px}.small-links{display:flex;gap:16px;flex-wrap:wrap}footer{margin-top:28px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}footer p{margin:5px 0}[hidden]{display:none!important}@media(max-width:760px){main{padding:24px 18px}.layout{grid-template-columns:1fr;gap:26px}.player{position:static;max-width:390px;width:100%;margin:auto}video{max-height:76vh}.post-head{align-items:flex-start}h1{font-size:28px}.intro{font-size:14px}.campaign{font-size:13px}.post{padding-bottom:20px;margin-bottom:20px}}
</style></head><body><main>
<header><p class="eyebrow">PROJECTP / ぷいの制作記録</p><h1>その一手で、<br>何秒縮める？</h1><p class="intro">EMBERWAKE 灰の灯。章ごとのTIME ATTACKで、自己ベストへ。制作、本格化。</p><p class="campaign">CAMPFIREでの${esc(e.crowdfunding.statusCopy)}。${esc(e.crowdfunding.actionCopy)}</p></header>
<div class="layout"><figure class="player"><video id="film" controls playsinline preload="metadata" poster="${cover}" aria-label="${esc(posts.title)}"><source src="${video}" type="video/mp4">動画は<a href="${video}">こちらから再生</a>できます。</video><figcaption class="video-meta">EMBERWAKE / 追従RTA版 V2 / 60秒</figcaption><p id="play-status" class="play-status" role="status" hidden>動画ファイルを読み込めません。書き出し完了後、動画と同じフォルダー構成で開いてください。</p><div class="actions"><a class="action primary" href="${video}" target="_blank" rel="noopener">別ウィンドウで再生</a><a class="action" href="${video}" download>動画をダウンロード</a></div></figure>
<div class="posts">
<section class="post" aria-labelledby="tiktok-heading"><div class="post-head"><h2 id="tiktok-heading">TikTok</h2><button type="button" data-copy="tiktok-copy" aria-label="TikTokの投稿文をコピー">投稿文をコピー</button></div><label for="tiktok-copy">投稿文</label><textarea id="tiktok-copy" readonly rows="15" spellcheck="false">${esc(posts.tiktok)}</textarea></section>
<section class="post" aria-labelledby="shorts-heading"><div class="post-head"><h2 id="shorts-heading">YouTube Shorts</h2><button type="button" data-copy="shorts-copy" aria-label="YouTube Shortsのタイトルと説明をコピー">タイトル＋説明をコピー</button></div><label for="shorts-title">タイトル</label><textarea id="shorts-title" readonly rows="2" spellcheck="false">${esc(posts.shortsTitle)}</textarea><label for="shorts-description">説明</label><textarea id="shorts-description" readonly rows="18" spellcheck="false">${esc(posts.shortsDescription)}</textarea><textarea id="shorts-copy" hidden aria-hidden="true" readonly>${esc(shortsCopy)}</textarea><p class="copy-hint">タイトル、空行、説明の順にコピーします。</p></section>
<p id="copy-status" class="copy-status" role="status" aria-live="polite"></p><details><summary>編集原本と台本</summary><p class="small-links"><a href="projects/${n}.ecproj">EffectCraft原本</a><a href="projects/${n}.fcproj">FilmCraft原本</a><a href="source/${link(SCRIPT_NAME)}">台本</a><a href="README.md">再制作・確認範囲</a></p></details>
</div></div><footer><p>ProjectP / ぷい</p><p>プレイ映像は探索モードの編集です。3Dカットは開発イメージです。</p></footer>
</main><script>${controls}</script></body></html>\n`;
 const rows=e.shots.map((s,i)=>{
  const source=e.sources[s.source];let input,handling;
  if(s.kind==='code'){input=s.codeSource;handling='実ファイルの抜粋を組版 / IDE操作の収録ではない';}
  else if(s.kind==='mode'){input=source.path;handling='実タイトル画面のTIME ATTACK項目 / 静止画像';}
  else if(source.sequence){input=source.path+' / 元 '+sec(s.offset)+'–'+sec(s.offset+s.b-s.a)+'秒';handling='EXPLORE収録の再編集 / 主人公・芯石・着地点へ追従';}
  else if(s.kind==='cinema'){input=source.path+' / 元 '+sec(s.offset||0)+'–'+sec((s.offset||0)+(s.b-s.a)*(s.rate||1))+'秒';handling='Blender開発イメージ / '+(s.rate||1)+'倍速';}
  else {input=source.path;handling=s.kind==='funding'?'実CAMPFIRE制作素材のメイン画像':'実ゲームV章の保存画像';}
  const display=[...s.heading,s.caption,...(s.kind==='end'?[e.crowdfunding.statusCopy,e.crowdfunding.actionCopy]:[])].join(' / ');
  return '| '+String(i+1).padStart(2,'0')+' | '+sec(s.a)+'–'+sec(s.b)+' | '+Math.round(s.a*30)+'–'+Math.round(s.b*30)+' | '+cell(display)+' | '+cell(s.label)+' | '+cell(input)+' | '+cell(handling)+' |';
 });
 const rtaNotes=[
  '章ごとの固定コースに挑むTIME ATTACKとローカル自己ベストは実装に基づく紹介です。オンラインランキングや全章通算タイマーはありません。',
  'TIME ATTACK項目は実タイトル画面の静止画です。機能の入口が存在する根拠で、完走やPB更新を示しません。',
  '動作カットはI章のEXPLORE収録の再編集です。HUD時計はPNG保存・encoding待ち時間を含み、実RTA完走・PB更新・タイム短縮や実機性能の証拠には使いません。架空のタイマーやランキングを後付けしません。',
  'I章のこの収録はdash未習得。ジャンプをdashの実演とは説明しません。'
 ];
 const provenance=[
  '元プレイ収録は開発中の v'+e.gameVersion+'。全5章デモが存在することと、製品版が完成・公開済みであることを区別します。',
  '3DカットはBlenderによる開発イメージです。実ゲームは2Dで、そのプレイ画面や完成版の仕様として説明しません。',
  'CAMPFIREカットは制作済みの実メイン画像です。募集ページの公開画面の収録ではありません。',
  'GDScriptは実ファイルの抜粋を組版。エディタで入力・編集した実演ではありません。',
  '音はaudio-v2.mjsとV2専用mixを使います。旧mixは素材ベースとして保持。FXは編集上の演出音で、実ゲームSEとは区別します。音量・境界等の検査は最終qaを参照します。'
 ];
 const statusNote=e.crowdfunding.checkedForDate+'時点ではowner確認済みのCAMPFIRE公開前です。「応援してください」「'+e.crowdfunding.actionCopy+'」で統一し、支援URLは空欄です。正式な公開状態と公開URLを再確認し、公開済みとなった場合に動画・投稿文・一覧のCTAをそろえて更新します。未確認の募集開始、リンク先、目標額、リターン、提供日や完成保証は追加しません。SNSへの投稿・予約、CAMPFIREページの編集・公開、支援の送金は実施していません。';
 const verification='動画・原本・qaは制作の進行に合わせて生成されます。一覧と台本の生成だけで検査成功にはしません。形式・全デコード・音量・素材欠損・動画/mix/原本のSHAは最終の `qa/'+n+'/technical.json` と各検査記録、納品先からの再読込・保存・描画とSHAは `qa/portable-package.json` を参照します。保存カメラ値・連続遷移フレーム・対象の実画像による追従確認も、最終qaで確認します。';
 const notPerformed='この文書の生成作業では、直接の全編視聴・試聴、スマートフォン等の実機再生、ownerの創作採用、SNSへの投稿は実施・判定していません。実施した検査と残る確認を分けて報告します。';
 const script=[
  '# EMBERWAKE 追従RTA版 V2・台本','',posts.title,'',frames+'フレーム / 30fps / '+sec(e.duration)+'秒 / '+e.shots.length+'カット。時刻・字幕・素材は [edit.json](edit.json) と [episodes.mjs](episodes.mjs)、投稿文は [投稿文.json]('+link('投稿文.json')+') を正本とします。','',
  '## 一話の軸','',
  '「その一手で、何秒縮める？」から、運ぶ・はめる・跳ぶという操作と、同じコースで自己ベストへ挑む面白さを見せます。9.8〜12秒は実タイトル画面のTIME ATTACK項目。26.2〜36.6秒はI章のジャンプと芯石を再編集し、主人公・芯石・着地点への大きい追従を軸にします。全5章デモから本制作へ進む現在地、実コード、3Dの開発イメージを挟み、作者ぷいのCAMPFIREでの応援と公開案内のフォローへつなぎます。全5章の景色を順に紹介する構成ではありません。','',
  '## カットと画面の文言','',
  'フレーム区間の終端は次カットの開始です。ゲームの元時刻は30fps連番の先頭を0秒とします。HUD時計やRTAの実測タイムではありません。','',
  '| カット | 完成動画の秒 | フレーム | 主な表示 | 出典ラベル | 元素材・使用区間 | 扱い |',
  '| --- | --- | --- | --- | --- | --- | --- |',...rows,'',
  '## RTAの根拠と映像の限界','','根拠は [rta-source.json](../qa/rta-source.json)。','',...rtaNotes.map(s=>'- '+s),'',
  '## 実コードの抜粋','',e.shots.find(s=>s.kind==='code').codeSource,'',fence+'gdscript',e.shots.find(s=>s.kind==='code').code.trimEnd(),fence,'','[real-code-excerpt.txt](real-code-excerpt.txt) と元素材の照合記録を参照します。','',
  '## 素材の区別と音','',...provenance.map(s=>'- '+s),'','音の入口：[audio-v2.mjs](audio-v2.mjs)。','',
  '## 公開案内の現在地','',statusNote,'','## 確認範囲','',verification,'',notPerformed,'',
  '## TikTok投稿文','',posts.tiktok,'','## YouTube Shortsタイトル','',posts.shortsTitle,'','## YouTube Shorts説明','',posts.shortsDescription,''
 ].join('\n');
 const readme=[
  '# EMBERWAKE 追従RTA版 V2','',
  '[動画を再生](index.html) / [MP4]('+video+') / [台本](source/'+link(SCRIPT_NAME)+') / [投稿文](source/'+link('投稿文.json')+')','',
  '「その一手で、何秒縮める？」。EMBERWAKEの章別TIME ATTACKとローカル自己ベストを前面に、主人公・芯石・着地点を追う60秒版です。作者ぷいの本制作とCAMPFIREでの応援へつなぎます。'+sec(e.duration)+'秒、'+frames+'フレーム、1080×1920、30fps、18カット。','',
  '## 機能紹介と映像の区別','','根拠は [qa/rta-source.json](qa/rta-source.json)。','',...rtaNotes.map(s=>'- '+s),'',
  '9.8〜12秒は実TAメニューの静止画、26.2〜36.6秒はI章のジャンプと芯石の再編集です。全5章の景色紹介ではありません。全5章デモの存在は調査記録と現行資料に基づき、V章の保存画像とともに現在地として説明します。','',
  '## 公開案内の現在地','',statusNote,'','## 再制作','',
  'WSLのNode.jsと、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。','',
  fence+'bash','node source/build-edit.mjs','node source/audio-v2.mjs','node source/produce.mjs prepare','node source/produce.mjs render','node source/verify.mjs','node source/make-index.mjs','node source/package.mjs',fence,'',
  '`build-edit.mjs` をやり直すには、同スクリプトが参照する元素材、captureとfocus記録、I章のPNG連番、実TAメニュー画像、3D映像、CAMPFIREメイン画像、GDScript原ファイルが必要です。音の再制作は `source/audio-v2.mjs` に記録した参照素材が必要です。旧 `audio.mjs` と旧mixは素材ベースとして保持し、出力にはV2専用mixを使います。','',
  '保存済みの `source/edit.json`、`source/episodes.mjs`、`media` 内のPNG連番・映像・画像とV2mixがそろっていれば、prepareから再出力できます。素材のフォルダー構成とPNG連番の名前を保ってください。納品先にはFilmCraft参照用のProResマスターも同梱します。大容量マスターはGitには含めず、必要ならprepare・renderから再生成します。','',
  'packageは別の納品フォルダーへコピー・再リンクし、その場所から原本を再読込・保存・描画して対応するSHAを記録する工程です。既定納品先は `F:/Videos/ProjectP-EMBERWAKE-RTA-V2-2026-10-25`。ネイティブcomp名は `'+e.compName+'` です。旧60秒版・27秒版・過去の5本は別フォルダーに保持します。','',
  '## 素材と編集の入口','',
  '- [edit.json](source/edit.json) / [episodes.mjs](source/episodes.mjs)：18カットの時刻、文字、素材パス、注目位置、CAMPFIREの状態。',
  '- [build-edit.mjs](source/build-edit.mjs)：元素材の入口。元プレイは v'+e.gameVersion+'、収録元commit `'+e.sourceCommit+'`。TA実装の調査commitとは区別します。',
  '- `media/chapter-I`：本編で使う実ゲームの30fps PNG連番。未使用のII〜V章連番は本V2に含めず、元captureと旧V1に保持します。',
  '- [time-attack-menu.png](media/time-attack-menu.png)：TIME ATTACK項目がある実タイトル画面。完走やPB更新の証拠ではありません。',
  '- `media/dawn-still.png`：実ゲームV章の保存画像。`media/cinema-*.mp4`：Blenderによる開発イメージ。',
  '- [real-code-excerpt.txt](source/real-code-excerpt.txt)：実GDScriptの抜粋。',
  '- [CAMPFIREメイン画像](media/campfire-main.png)：制作済みの実画像。公開ページの収録ではありません。',
  '- [audio-v2.mjs](source/audio-v2.mjs) / [V2mix](media/'+e.mix+')：本版の音楽・編集演出音。FXを実ゲームSEとは説明しません。制作方法と音量等の検査は最終qaを参照します。',
  '- [EffectCraft原本](projects/'+n+'.ecproj) / [FilmCraft原本](projects/'+n+'.fcproj)：編集プロジェクト。','',
  '## 素材の表記','',...provenance.map(s=>'- '+s),'','## 確認範囲','',verification,'',notPerformed,'',
  '管理：Pui-core/- #89。一覧・README・台本は `node source/make-index.mjs` で再生成します。投稿文正本を変更した場合も再実行します。',''
 ].join('\n');
 fs.writeFileSync(path.join(root,'index.html'),html);
 fs.writeFileSync(path.join(root,'README.md'),readme);
 fs.writeFileSync(path.join(root,'source',SCRIPT_NAME),script);
 const references=[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(m=>decodeURIComponent(m[1]));
 const result={generated:['index.html','README.md','source/'+SCRIPT_NAME],frames,seconds:e.duration,shots:e.shots.length,localReferences:references.length,missingFiles:[...new Set(references.filter(p=>!fs.existsSync(path.join(root,p))))]};
 console.log(JSON.stringify(result));return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))makeIndex(process.env.PUI_CREATOR_ROOT||DEFAULT_ROOT);
