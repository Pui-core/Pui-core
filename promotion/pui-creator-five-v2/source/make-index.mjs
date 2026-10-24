/** V2 gallery, captions and script. Safe to import without writing files. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {episodes} from './episodes.mjs';

const idOf=e=>e.id+'-'+e.slug;
const videoName=e=>idOf(e)+(['01','05'].includes(e.id)?'-audiofix':'')+'.mp4';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const descriptions={
  '01':['開く、遊ぶ、直す。ゲーム・道具・アプリから、medicateのサビへ。作っている人は、ぷい。','ObjectCreator・EMBERWAKEは開発中の実ゲーム映像。Glass Folders・Truth or Lieは実UI。medicate：曲・歌・MV ぷい。','#個人開発 #ゲーム制作 #ぷい'],
  '02':['剣は開いた。けど、下の部品が台座に埋まっていた。実際の試作から直していく、制作途中の話。','ObjectCreator / 開発中。実ChatGPTの制作相談、Blenderの原本確認、修正前後の実試作を使用。','#ObjectCreator #ゲーム開発 #ぷい'],
  '03':['跳んで、灯して、少し先へ。この一歩も、この夜も作っています。','EMBERWAKE / 開発中の実ゲーム映像。実フレームの保持と短い再演を含む編集です。','#EMBERWAKE #インディーゲーム #ぷい'],
  '04':['欲しい道具を、作って、触って、直す。Glass Foldersの初版から今の画面へ。','旧版・現行版の実UIと検証用データを使用。Windowsのファイル確認画面を含みます。','#個人開発 #デスクトップ #ぷい'],
  '05':['リバーブ、かけすぎた。同じ歌を聴き比べて、声の強弱を残す方へ。曲を仕上げる途中の話。','曲・歌・MV：ぷい。実際のV5/V6音源の同一区間を比較し、最後にサビ1句。','#medicate #オリジナル曲 #ぷい']
};

export function makeIndex(destination){
  const root=path.resolve(destination||process.env.PUI_CREATOR_ROOT||fileURLToPath(new URL('..',import.meta.url)));
  fs.mkdirSync(path.join(root,'source'),{recursive:true});
  const posts=episodes.map(e=>{const d=descriptions[e.id]||[e.title,'',''];return{id:e.id,title:e.title,seconds:e.duration,caption:d[0]+'\n\n'+d[1]+'\nぷい、また作ってる。\n'+d[2],version:'V2'};});
  fs.writeFileSync(path.join(root,'source','投稿文.json'),JSON.stringify(posts,null,2)+'\n');
  const scriptName='台本-#0085ぷい本人プロモV2.md';
  let script='# ぷい本人プロモ V2・台本\n\nIssue85。実作品を使い、対象への追従・寄り引き・切り返しを作品ごとに設計。技術検査と作品の採用は区別します。\n';
  for(const e of episodes){
    script+='\n## '+e.id+' '+e.title+'\n\n'+e.duration.toFixed(3)+'秒 / 30fps / '+Math.round(e.duration*30)+'フレーム\n\n| 秒 | 字幕 | 作品 | 遷移 |\n| --- | --- | --- | --- |\n';
    for(const s of e.shots)script+='| '+s.a.toFixed(3)+'–'+s.b.toFixed(3)+' | '+(s.end?'ぷい / また、作ってる。':s.caption||'実作品の動き')+' | '+s.label+' | '+(s.transition||'cut')+' |\n';
    if(e.chorus)script+='\nサビ：完成動画 '+e.chorus.start.toFixed(3)+'–'+e.chorus.end.toFixed(3)+'秒 / 元MV '+e.chorus.sourceAt.toFixed(3)+'–'+e.chorus.sourceEnd.toFixed(3)+'秒。\n';
    if(e.id==='05')script+='\nV5/V6の元曲21.7–25.1秒を同じ条件で聴き比べ、最後は元MV76.3–79.733秒のサビ。実制作メモの要旨を表示します。\n';
    script+='\n'+posts.find(p=>p.id===e.id).caption+'\n';
  }
  fs.writeFileSync(path.join(root,'source',scriptName),script);

  const policy='宣伝-#0085ぷい本人プロモV2の方針.md',hasPolicy=fs.existsSync(path.join(root,policy));
  const localLink=p=>p.split('/').map(encodeURIComponent).join('/');
  fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ぷい、また作ってる。V2</title><style>*{box-sizing:border-box}body{margin:0;background:#0b121a;color:#f8fafb;font:16px/1.8 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:35px 24px}header{margin-bottom:30px}small,.no{color:#9fe7d3}h1{font-size:clamp(32px,6vw,58px);line-height:1.4;margin:8px 0}header p{max-width:720px;color:#bfccd4}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:25px}article{padding:17px;background:#131f2b;border:1px solid #2d4654;border-radius:18px}h2{font-size:21px;line-height:1.5;margin:10px 0 15px}video{display:block;width:100%;aspect-ratio:9/16;max-height:580px;border-radius:11px;background:#050b10}p{margin:10px 0}a,summary{color:#aceedc}a{text-underline-offset:4px}.links{display:flex;gap:18px;flex-wrap:wrap}summary{cursor:pointer}pre{font:13px/1.8 system-ui;white-space:pre-wrap;overflow-wrap:anywhere}footer{margin-top:32px;font-size:13px;color:#a5b6c3}</style><main><header><small>PUI / MAKER REELS · V2</small><h1>ぷい、また作ってる。</h1><p>剣の中へ、跳ぶ主人公へ、手元の道具へ。ゲームも、ソフトも、曲も。完成品も、埋まった部品も、音を聴いて直す途中も。ぷいの制作を追う5本です。</p></header><section class="grid">${episodes.map(e=>{const n=idOf(e),d=descriptions[e.id]||[e.title];return `<article><span class="no">${e.id} / ${e.duration.toFixed(2)}秒</span><h2>${esc(e.title)}</h2><video controls playsinline preload="metadata" poster="videos/${n}-cover.jpg"><source src="videos/${videoName(e)}" type="video/mp4"></video><p>${esc(d[0])}</p><p class="links"><a href="videos/${videoName(e)}" download>動画を保存</a><a href="projects/${n}.ecproj">EffectCraft</a><a href="projects/${n}.fcproj">FilmCraft</a></p><details><summary>投稿文</summary><pre>${esc(posts.find(p=>p.id===e.id).caption)}</pre></details></article>`;}).join('')}</section><footer><a href="README.md">再制作・確認範囲</a> / <a href="source/${localLink(scriptName)}">台本</a>${hasPolicy?' / <a href="'+localLink(policy)+'">本人ブランドの方針</a>':''}<p>medicate：曲・歌・MV ぷい。開発中の作品を含みます。出典と確認範囲は同梱記録を参照。</p></footer></main><script>for(const v of document.querySelectorAll('video'))v.addEventListener('play',()=>{for(const w of document.querySelectorAll('video'))if(w!==v)w.pause()});</script></html>`);
  fs.writeFileSync(path.join(root,'README.md'),`# ぷい本人プロモ5本 V2\n\n[再生一覧](index.html) / [台本](source/${localLink(scriptName)})${hasPolicy?' / [本人ブランドの方針]('+localLink(policy)+')':''}\n\n実作品の対象へ寄る・追う・引く動きと、短い切り返しを加えたIssue85の試作です。01に実C#画面、02に本物のChatGPTの問いとBlender原本の確認を追加しました。01にはmedicateのサビを約3.4秒、05には実際の調整前後の聴き比べとサビ1句を使用。01/05は音声修正版。声の頭と語尾を保護し、曲の伴奏や無声部分でつなぎ直しています。曲・歌・MVという制作範囲はowner確認済み。写真の被写体の本人断定や、beat単独作曲の追加クレジットは行いません。\n\n## 再制作\n\nWSLのNode.js、EffectCraft 0.14.0、FilmCraft 0.10.0、既存Windows FFmpegを使用します。保存済みのフル画角plate・mixから次の操作で再制作できます。\n\n\x60\x60\x60bash\nnode source/produce.mjs prepare\nnode source/produce.mjs render\nnode source/verify.mjs\nnode source/make-index.mjs\n\x60\x60\x60\n\n元作品から切出しを作り直す場合は、sourceに記録した元ファイルが必要です。音源mixはsource/audio-v2.mjs（01）、audio-episodes-v2.mjs（02〜04）、audio-process-05.mjs（05）の専用経路を使用します。既存mixはplatesで上書きしません。\n\n\x60\x60\x60bash\nnode source/produce.mjs plates\nnode source/package.mjs '/mnt/f/Videos/ぷい本人プロモ5本-V2-2026-10-24'\nnode source/verify.mjs --integrity-only\n\x60\x60\x60\n\n納品先からのverifyは、同じ完成動画SHAに結び付けた再リンク後のnative SHAを照合します。動画/audioのSHAも維持します。V1の納品は保持し、V2で上書きしません。\n\n## 保存と確認範囲\n\n完成動画はvideos、編集原本はprojects、フル画角plate・mix・tileはmedia、コードと台本はsource、検査とネイティブ描画証跡はqa。Gitから中間masterを除く場合はrenderで再生成できます。\n\n各shotの画面と主要4箇所の連続18フレーム、最終AAC音量、A/V全デコード、素材欠損、納品先からのEC/FC再読込・保存・描画を別々に確認します。抽出画面の検品は全編の実時間視聴・試聴やownerの創作承認を意味しません。確認結果はqaの各technical.jsonとportable-package.json、最終監査を参照。SNS公開・予約投稿・プロフィール変更は未実行です。\n\n管理: https://github.com/Pui-core/-/issues/85\n`);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const refs=[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(m=>m[1]).filter(p=>!/^https?:/.test(p));
  const missing=refs.map(p=>decodeURIComponent(p)).filter(p=>!fs.existsSync(path.join(root,p)));
  const result={version:'V2',episodes:episodes.length,localReferences:refs.length,missingFiles:missing};
  console.log(JSON.stringify(result));return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))makeIndex(process.argv[2]);
