import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stories,cuts} from './stories.mjs';
const root=path.resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),pad=n=>String(n).padStart(2,'0');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const descriptions=[
 '同じ0に見えても、結果が変わる。JavaScriptの3問を、ぷいと実験。引用符と演算子に注目。',
 '相談したいのに、どこを押す？ ボタンの名前・強弱・余白を整える、自主制作のWeb改善デモ。',
 'コピペで整える前に、ルールを作る。全角数字は整形、空欄は要確認。架空データで自動化を実演。',
 '同じ「保存する」操作を3通りに編集。見る場所→操作→結果。伝わり方は、どう変わる？',
 '最終、修正、本当の最終、本当の最終2。あなたのフォルダにも、いる？ ぷいの架空の制作あるある短編。'
];
const tags=['#JavaScript #プログラミング #ぷい','#Web制作 #UIデザイン #ぷい','#業務自動化 #仕事の工夫 #ぷい','#動画編集 #操作説明 #ぷい','#クリエイターあるある #自主制作 #ぷい'];
const posts=stories.map((e,i)=>({id:e.id,title:e.title,description:descriptions[i]+'\n\n制作：ぷい / キャラクター差分：AI生成・編集 / 音楽・演出：自主制作\nVOICEVOX:四国めたん\n作品・制作相談：https://pui-wobbfet.top/\n'+tags[i],suggestedPinnedComment:i===0?'3問のうち、どれが意外だった？':i===4?'最終版、どんな名前になってる？':'どの変化が分かりやすかった？'}));
fs.writeFileSync(path.join(root,'source','投稿文.json'),JSON.stringify(posts,null,2)+'\n');
let script='# 5本の台本と投稿文\n\n各64秒。時刻は音・カットと同じタイムベース。\n';
for(const e of stories){script+='\n## '+pad(e.id)+' '+e.title+'\n\n| 秒 | 主テロップ | 補足 | 映像 |\n| --- | --- | --- | --- |\n';for(const [i,s]of e.scenes.entries())script+='| '+cuts[i]+'–'+cuts[i+1]+' | '+s.head+' | '+s.sub+' | '+s.kind+' |\n';script+='\n投稿文：\n\n'+posts[e.id-1].description+'\n';}
fs.writeFileSync(path.join(root,'source','台本-#0084ぷいの実験室5本.md'),script);
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ぷい｜5つの小さな作品</title><style>
*{box-sizing:border-box}body{margin:0;background:#10162a;color:#f7f9ff;font:16px/1.8 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:38px 24px}header{margin-bottom:32px}header small{color:#aff5da;letter-spacing:.14em}h1{font-size:clamp(28px,5vw,48px);line-height:1.4;margin:8px 0}header p{color:#c1cbe2;max-width:700px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px}article{border:1px solid #39445e;border-radius:18px;padding:18px;background:#181f35}h2{font-size:21px;line-height:1.5;margin:14px 0 8px}video{display:block;width:100%;max-height:580px;background:#090e1b;aspect-ratio:9/16;border-radius:10px}p{margin:10px 0}a{color:#b7f4dc;text-underline-offset:4px}.links{display:flex;gap:20px;flex-wrap:wrap}footer{color:#adb8d1;margin-top:35px;font-size:13px}summary{cursor:pointer;color:#b7f4dc}pre{font:13px/1.8 system-ui;white-space:pre-wrap;overflow-wrap:anywhere}.n{color:#aff5da;font-size:13px}</style><main><header><small>PUI / ORIGINAL SERIES</small><h1>わかる × 気持ちいい。<br>ぷいの、5つの小さな作品。</h1><p>クイズ、画面の変化、制作あるある。1本64秒。作品を見る時間そのものを楽しめるシリーズの試作です。</p></header><section class="grid">${stories.map((e,i)=>{const n=pad(e.id)+'-'+e.slug;return `<article><span class="n">${pad(e.id)} / 64秒</span><h2>${esc(e.title)}</h2><video controls playsinline preload="metadata" poster="videos/${n}-cover.jpg"><source src="videos/${n}.mp4" type="video/mp4"></video><p>${esc(descriptions[i])}</p><p class="links"><a href="videos/${n}.mp4" download>動画を保存</a><a href="projects/${n}.ecproj">EffectCraft</a><a href="projects/${n}.fcproj">FilmCraft</a></p><details><summary>投稿文</summary><pre>${esc(posts[i].description)}</pre></details></article>`;}).join('')}</section><footer>制作：ぷい / キャラクター差分：AI生成・編集 / VOICEVOX:四国めたん<br><a href="制作-%230084SNS動画5本の運用方針.md">制作・運用方針</a> / <a href="source/台本-%230084ぷいの実験室5本.md">台本</a> / <a href="https://pui-wobbfet.top/">作品・制作相談</a></footer></main><script>for(const v of document.querySelectorAll('video'))v.addEventListener('play',()=>{for(const other of document.querySelectorAll('video'))if(other!==v)other.pause()});</script></html>`);
console.log('Wrote index, 5 post captions, 120 timed scenes.');
