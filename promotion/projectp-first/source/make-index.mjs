/** ProjectP first post: local player, exact post copy and reproducible notes. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const DEFAULT_ROOT=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const link=s=>s.split('/').map(encodeURIComponent).join('/');
const seconds=t=>t.toFixed(3);
const scriptName='台本-#0087ProjectP初投稿.md';

export function makeIndex(destination=DEFAULT_ROOT){
  const root=path.resolve(destination),e=episodes[0];
  if(episodes.length!==1||!e||e.id!=='01'||e.slug!=='projectp-first')throw Error('Expected the single ProjectP first-post episode.');
  const posts=JSON.parse(fs.readFileSync(path.join(root,'source','投稿文.json'),'utf8').replace(/^\uFEFF/,''));
  for(const key of ['title','tiktok','shortsTitle','shortsDescription'])if(typeof posts[key]!=='string'||!posts[key].trim())throw Error('Missing post field: '+key);
  const frames=Math.round(e.duration*30);
  const n=e.id+'-'+e.slug,video='videos/'+n+'.mp4',cover='videos/'+n+'-cover.jpg';
  const title=posts.title,shortsCopy=posts.shortsTitle+'\n\n'+posts.shortsDescription;
  const nativeSource=fs.readFileSync(path.join(root,'source','produce.mjs'),'utf8');
  const nativeText=name=>nativeSource.match(new RegExp("txt\\('"+name+"','([^']*)'"))?.[1]||'';
  const hook=[nativeText('Hook top'),nativeText('Hook question')].filter(Boolean).join(' / ');
  const signature=[nativeText('PUI reveal'),nativeText('Signature line one'),nativeText('Signature line two')].filter(Boolean).join(' / ');
  const question=posts.tiktok.match(/『([^』]+)』/)?.[1]||'';
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
for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',()=>copyPost(button));`;
  const html=`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src 'self' file:; img-src 'self' file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>${esc(title)}｜ProjectP</title>
<style>
:root{color-scheme:light;--paper:#f5f1e8;--ink:#17212b;--muted:#56616b;--line:#d5d1c7;--accent:#d35a20}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:1080px;margin:auto;padding:36px 24px 24px}.eyebrow{margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:.09em;color:var(--accent)}h1{margin:0;font-size:clamp(26px,4.4vw,43px);line-height:1.55;font-weight:750;letter-spacing:-.02em}.intro{margin:12px 0 25px;color:var(--muted)}.layout{display:grid;grid-template-columns:minmax(260px,370px) minmax(0,1fr);gap:38px;align-items:start}.player{margin:0;position:sticky;top:20px}video{display:block;width:100%;aspect-ratio:9/16;max-height:78vh;object-fit:contain;background:#10151c;border-radius:14px;box-shadow:0 10px 28px #17212b1a}.video-meta{margin:11px 0;color:var(--muted);font-size:13px}.actions{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0 0}a{color:var(--ink);text-underline-offset:4px}.action,button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 13px;border:1px solid var(--line);border-radius:9px;background:#fffdf8;color:var(--ink);font:inherit;font-size:14px;font-weight:650;text-decoration:none;cursor:pointer}.action.primary{background:var(--ink);border-color:var(--ink);color:white}button:hover,.action:hover{border-color:var(--accent)}:focus-visible{outline:3px solid #d35a20;outline-offset:3px}.post{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--line)}.post-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}h2{font-size:21px;line-height:1.5;margin:0}label{display:block;font-size:13px;font-weight:650;margin:10px 0 4px;color:var(--muted)}textarea{display:block;width:100%;resize:vertical;padding:13px 14px;border:1px solid var(--line);border-radius:9px;background:#fffdf8;color:var(--ink);font:14px/1.85 system-ui,sans-serif;overflow-wrap:anywhere}#tiktok-copy{min-height:277px}#shorts-description{min-height:250px}.copy-hint{font-size:12px;color:var(--muted);margin:4px 0 0}.copy-status{min-height:1.8em;font-size:13px;margin:0 0 16px;color:var(--accent)}details{font-size:13px;color:var(--muted)}summary{cursor:pointer;text-decoration:underline;text-underline-offset:4px}details p{margin:9px 0}.small-links{display:flex;gap:16px;flex-wrap:wrap}footer{margin-top:28px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}footer p{margin:5px 0}@media(max-width:760px){main{padding:24px 18px}.layout{grid-template-columns:1fr;gap:25px}.player{position:static;max-width:390px;width:100%;margin:0 auto}video{max-height:76vh}.post-head{align-items:flex-start}h1{font-size:27px}.intro{font-size:14px}.post{margin-bottom:20px;padding-bottom:20px}}
</style>
</head>
<body><main>
<header><p class="eyebrow">PROJECTP / 制作の記録 001</p><h1>${esc(title)}</h1><p class="intro">実際の問いから、いま作っているゲームへ。最後は、ぷいの歌声で。</p></header>
<div class="layout">
<figure class="player"><video controls playsinline preload="metadata" poster="${cover}" aria-label="${esc(title)}"><source src="${video}" type="video/mp4">動画は<a href="${video}">こちらから再生</a>できます。</video><figcaption class="video-meta">1本・${e.duration.toFixed(2)}秒</figcaption><div class="actions"><a class="action primary" href="${video}" target="_blank" rel="noopener">別ウィンドウで再生</a><a class="action" href="${video}" download>動画をダウンロード</a></div></figure>
<div class="posts">
<section class="post" aria-labelledby="tiktok-heading"><div class="post-head"><h2 id="tiktok-heading">TikTok</h2><button type="button" data-copy="tiktok-copy" aria-label="TikTokの投稿文をコピー">投稿文をコピー</button></div><label for="tiktok-copy">投稿文</label><textarea id="tiktok-copy" readonly rows="12" spellcheck="false">${esc(posts.tiktok)}</textarea></section>
<section class="post" aria-labelledby="shorts-heading"><div class="post-head"><h2 id="shorts-heading">YouTube Shorts</h2><button type="button" data-copy="shorts-copy" aria-label="YouTube Shortsのタイトルと説明をコピー">タイトル＋説明をコピー</button></div><label for="shorts-title">タイトル</label><textarea id="shorts-title" readonly rows="2" spellcheck="false">${esc(posts.shortsTitle)}</textarea><label for="shorts-description">説明</label><textarea id="shorts-description" readonly rows="12" spellcheck="false">${esc(posts.shortsDescription)}</textarea><textarea id="shorts-copy" hidden aria-hidden="true" readonly>${esc(shortsCopy)}</textarea><p class="copy-hint">タイトル、空行、説明の順にコピーします。</p></section>
<p id="copy-status" class="copy-status" role="status" aria-live="polite"></p>
<details><summary>制作ファイルと台本</summary><p class="small-links"><a href="projects/${n}.ecproj">EffectCraft原本</a><a href="projects/${n}.fcproj">FilmCraft原本</a><a href="source/${link(scriptName)}">台本</a><a href="README.md">再制作・確認範囲</a></p></details>
</div></div>
<footer><p>ぷい / 作ってる途中を、見せます。</p><p>ObjectCreatorは開発中の作品です。</p></footer>
</main><script>${controls}</script></body></html>\n`;
  const rows=e.shots.map((s,i)=>{
    const text=s.kind==='chat'?'本人の実際の問い：'+question:s.end?signature:s.caption||'実映像';
    const treatment=s.freeze?'実フレーム保持':s.source.endsWith('.png')?'実画像':s.rate&&s.rate!==1?'再生速度 '+s.rate+'倍':'実動画';
    return '| '+String(i+1).padStart(2,'0')+' | '+seconds(s.a)+'–'+seconds(s.b)+' | '+Math.round(s.a*30)+'–'+Math.round(s.b*30)+' | '+s.label+' | '+text.replaceAll('|','／')+' | '+treatment+' |';
  });
  const script=`# ProjectP 初投稿・台本\n\n${title}\n\n${frames}フレーム / 30fps / ${seconds(e.duration)}秒。実素材の時刻・字幕は [episodes.mjs](episodes.mjs)、投稿文は [投稿文.json](${link('投稿文.json')}) を正本とします。再生成時に読み直します。\n\n## 一話の軸\n\n本人がAIへ相談した問いから、いま制作中のObjectCreatorの1本へ進みます。剣の分解、既存Blender原本、実C#、実再組立を見せ、最後は本人のmedicateの歌へつなぎます。「3本完成した」という内容や、年末の完成保証ではありません。\n\n冒頭の共通テロップ：${hook}\n\n実際の本人の問い：『${question}』\n\n## カット\n\nフレーム区間の終端は次カットの開始です。\n\n| カット | 完成動画の秒 | フレーム | 作品・出典表示 | 表示内容 | 素材の扱い |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nmedicateの主紹介は完成動画 ${seconds(e.chorus.start)}–${seconds(e.chorus.end)}秒、元MV ${seconds(e.chorus.sourceAt)}–${seconds(e.chorus.sourceEnd)}秒。音の導入・残響の接続は audio.mjs を参照します。\n\n## 表記と確認範囲\n\n- 実ChatGPT画面は本人の制作に関する問いの切り出しです。\n- Blenderは保存済み原本を開き、視点を動かした実画面です。新規モデリングや人間の手作業の実演とは呼びません。C#は実ファイルを開いた画面です。\n- ObjectCreatorは開発中。音楽導入の人物画像はMVの映像素材として扱い、写真の被写体がぷい本人とは断定しません。\n- 全編の直接視聴・試聴、ownerの創作採用、SNS公開は、この台本生成では実施・判定していません。技術検査は最終のqaを参照します。\n\n## TikTok投稿文\n\n${posts.tiktok}\n\n## YouTube Shortsタイトル\n\n${posts.shortsTitle}\n\n## YouTube Shorts説明\n\n${posts.shortsDescription}\n`;
  const readme=`# ProjectP 初投稿\n\n[動画を再生](index.html) / [MP4](${video}) / [台本](source/${link(scriptName)})\n\n実際のAI相談から、制作中のObjectCreatorの剣分解・モデル原本・コード・再組立を見せ、medicateの歌声につなぐ1本です。${seconds(e.duration)}秒、${frames}フレーム、30fps。3本完成や年末の完成保証を示す内容ではありません。\n\n## 再制作\n\nWSLのNode.js、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。\n\n\x60\x60\x60bash\nnode source/produce.mjs plates\nnode source/audio.mjs\nnode source/produce.mjs prepare\nnode source/produce.mjs render\nnode source/verify.mjs\nnode source/make-index.mjs\nnode source/package.mjs\n\x60\x60\x60\n\n保存済みのplateとmixがそろっていればprepareから再出力できます。platesとaudioを作り直すには、ソースに記録した元素材が必要です。packageの既定納品先は \x60F:\\Videos\\ProjectP-初投稿-2026-10-25\x60。既存素材を再リンクし、その場所から編集原本を再読込・保存・描画する工程はpackage側が担当します。\n\n## 素材と編集の入口\n\n- [source/episodes.mjs](source/episodes.mjs)：元素材の所在、カット、字幕、カメラと時刻。\n- [source/audio.mjs](source/audio.mjs) / [media/first-mix.wav](media/first-mix.wav)：同曲の伴奏・声・残響の接続とmix。本人制作と確認済みのmedicate V6を使用し、[投稿文](source/${link('投稿文.json')})に曲・歌・MV：ぷいと記載しています。beatの単独作曲や写真の被写体の本人性は断定しません。\n- [EffectCraft原本](projects/${n}.ecproj) / [FilmCraft原本](projects/${n}.fcproj)：編集プロジェクト。\n- media：切り出し済み素材・mix。元の長尺音源や会話の全景を再配布する入口ではありません。\n\n## 確認範囲\n\n形式・全デコード・音量・素材欠損・動画/mix/原本のSHA・納品先からの再読込と描画は、最終の \x60qa/${n}/technical.json\x60、\x60qa/portable-package.json\x60 と各検査記録を参照します。このページの生成は検査成功の判定ではありません。\n\n全編の直接視聴・試聴とSNS公開は未実施。ownerの創作採用と公開後の結果は技術検査から分けて扱います。Blender素材は既存原本の視点操作で、新規モデリングの実演ではありません。人物画像を本人の写真とは断定しません。\n\n管理：Pui-core/- #87。一覧と台本は \x60node source/make-index.mjs\x60 で再生成します。投稿文正本を更新した場合も再実行します。\n`;
  fs.writeFileSync(path.join(root,'index.html'),html);
  fs.writeFileSync(path.join(root,'README.md'),readme);
  fs.writeFileSync(path.join(root,'source',scriptName),script);
  const references=[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(m=>decodeURIComponent(m[1]));
  const missingFiles=[...new Set(references.filter(p=>!fs.existsSync(path.join(root,p))))];
  const result={generated:['index.html','README.md','source/'+scriptName],episodes:1,frames:Math.round(e.duration*30),seconds:e.duration,localReferences:references.length,missingFiles};
  console.log(JSON.stringify(result));return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))makeIndex(process.env.PUI_CREATOR_ROOT||DEFAULT_ROOT);
