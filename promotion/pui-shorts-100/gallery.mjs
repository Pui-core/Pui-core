/** Build the offline delivery page and posting copy from actual delivery evidence.
 * Usage: node gallery.mjs [episodes.json] [output-directory]
 * PUI_PROMO_ROOT changes the default output directory. No network access is used.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.argv[2] || path.join(source, 'episodes.json'));
const root = path.resolve(process.argv[3] || process.env.PUI_PROMO_ROOT || '/home/pui/Videos/Pui-Promo/2026-10-24');
const expectedCount = 100;
const official = {
  site: 'https://pui-wobbfet.top/', about: 'https://pui-wobbfet.top/about/',
  contact: 'https://pui-wobbfet.top/contact/', portfolio: 'https://pui-wobbfet.top/portfolio/',
  logo: 'https://pui-wobbfet.top/images/logo_p.png?v=20260121',
  icon: 'https://pui-wobbfet.top/images/logos/icon-512.png'
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const readJson = name => {
  try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, '')); }
  catch { return null; }
};
const stat = name => {
  try { const value = fs.statSync(path.join(root, name)); return value.isFile() && value.size > 0 ? value : null; }
  catch { return null; }
};
const episodes = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
if (!Array.isArray(episodes) || episodes.length === 0) throw Error('episodes.json must contain a nonempty array.');
const seen = new Set();
for (const episode of episodes) {
  if (!Number.isInteger(episode.id) || episode.id < 1 || episode.id > expectedCount || seen.has(episode.id)) throw Error('Invalid or duplicate episode ID: ' + episode.id);
  seen.add(episode.id);
  for (const key of ['series', 'topic', 'caption']) if (typeof episode[key] !== 'string' || !episode[key].trim()) throw Error(`Episode ${episode.id}: missing ${key}.`);
  for (const key of ['hook', 'insight', 'example', 'tags']) if (!Array.isArray(episode[key]) || episode[key].some(value => typeof value !== 'string')) throw Error(`Episode ${episode.id}: invalid ${key}.`);
}
episodes.sort((a, b) => a.id - b.id);
const asTags = tags => [...new Set([...tags, 'Shorts'])].map(value => '#' + value.replace(/^#+/, '').replace(/\s+/gu, '')).filter(value => value !== '#').join(' ');
const records = episodes.map(episode => {
  const label = String(episode.id).padStart(3, '0');
  const video = `videos/${label}-pui.mp4`, effectcraft = `projects/${label}.ecproj`, filmcraft = `projects/${label}.fcproj`;
  const receipt = readJson(`qa/${label}/rendered.json`), audit = readJson(`qa/${label}/audit.json`);
  const videoStat = stat(video);
  const rendered = Boolean(videoStat && receipt?.id === episode.id && receipt?.filename === path.basename(video) && receipt?.bytes === videoStat.size);
  const required = [video, effectcraft, filmcraft];
  const stale = Boolean(audit && required.some(name => {
    const actual = stat(name), recorded = audit.assets?.[name];
    return !actual || !recorded || actual.size !== recorded.bytes || actual.mtimeMs !== recorded.mtimeMs;
  }));
  const verified = Boolean(rendered && audit?.id === episode.id && audit?.technicalStatus === 'TECHNICAL_PASS' &&
    Array.isArray(audit.checks) && audit.checks.length > 0 && audit.checks.every(check => check.passed === true) && !stale);
  const state = verified ? 'verified' : stale ? 'stale' : audit?.technicalStatus === 'TECHNICAL_FAIL' ? 'failed' : rendered ? 'rendered' : 'pending';
  const tags = asTags(episode.tags);
  const caption = episode.caption.trim() + '\n\n' + tags;
  const title = Array.from(episode.topic + '｜ぷい / Project P #Shorts').slice(0, 100).join('');
  return {...episode, label, video, effectcraft, filmcraft, rendered, verified, state,
    hasEffectcraft: Boolean(stat(effectcraft)), hasFilmcraft: Boolean(stat(filmcraft)),
    contact: stat(`qa/${label}/contact.png`) ? `qa/${label}/contact.png` : null,
    poster: stat(`qa/${label}/creator-poster.png`) ? `qa/${label}/creator-poster.png` : null,
    audit: audit ? `qa/${label}/audit.json` : null, auditedAt: audit?.auditedAt || null,
    failedChecks: Array.isArray(audit?.failedChecks) ? audit.failedChecks : [],
    width: audit?.media?.video?.width ?? null, height: audit?.media?.video?.height ?? null,
    seconds: Number(audit?.media?.format?.duration) || null,
    bytes: rendered ? videoStat.size : null, sha256: rendered ? receipt.sha256 : null,
    tiktok: caption, youtubeTitle: title, youtubeDescription: caption};
});
const series = [...new Set(records.map(record => record.series))];
const renderedCount = records.filter(record => record.rendered).length;
const verifiedCount = records.filter(record => record.verified).length;
const issuesCount = records.filter(record => ['stale', 'failed'].includes(record.state)).length;
const generatedAt = new Date();
const stamp = new Intl.DateTimeFormat('ja-JP', {timeZone: 'Asia/Tokyo', dateStyle: 'medium', timeStyle: 'short'}).format(generatedAt);
const data = JSON.stringify(records).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const statusLabel = {verified: '技術検査済み', rendered: '生成済み・検査待ち', pending: '生成待ち', stale: '更新後の再検査待ち', failed: '検査を要確認'};

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="ぷい / Project P のTikTok・YouTube Shorts向け動画。プレビュー、編集原本、投稿文をまとめたオフライン納品ページ。">
<title>ぷいの、つくると伝える。｜100 SHORTS</title>
<style>
:root{font-family:"Yu Gothic UI","Hiragino Kaku Gothic ProN",Meiryo,sans-serif;color:#eaf4fa;background:#0a1525;--muted:#adc2d2;--line:#2b4258;--cyan:#83e4ed;--panel:#132439;--ink:#eaf4fa;font-synthesis:none;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;line-height:1.65}a{color:var(--cyan);text-underline-offset:.25em}button,input,select,textarea{font:inherit}button,a,input,select,textarea{-webkit-tap-highlight-color:transparent}:focus-visible{outline:3px solid #9cecf2;outline-offset:4px}button{cursor:pointer}button:disabled{cursor:default;opacity:.55}a:focus-visible,button:focus-visible{border-radius:7px}svg{display:block}button svg,a svg{flex:none}.skip{position:absolute;top:-80px;left:16px;background:#effcff;color:#092132;padding:10px;z-index:10}.skip:focus{top:10px}
.wrap{max-width:1512px;margin:auto;padding:0 5.1%}.top{display:flex;align-items:center;justify-content:space-between;gap:22px;border-bottom:1px solid var(--line);padding-top:23px;padding-bottom:22px}.brand{display:flex;align-items:center;gap:16px;text-decoration:none;color:var(--ink)}.brand img{width:160px;height:50px;object-fit:contain}.brand-word{font-size:12px;letter-spacing:.12em;padding-left:16px;border-left:1px solid var(--line);color:var(--muted)}.edition{font-size:11px;letter-spacing:.13em;color:var(--muted)}
.hero{position:relative;padding-top:61px;padding-bottom:43px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;overflow:hidden}.hero:before{content:"";position:absolute;z-index:-1;width:400px;height:400px;border-radius:50%;right:-200px;top:-130px;background:radial-gradient(circle,#214b5b 0,transparent 67%)}.eyebrow{font-size:12px;color:var(--cyan);letter-spacing:.19em;font-weight:700;margin:0 0 16px}.hero h1{font-size:clamp(33px,4.5vw,65px);line-height:1.27;letter-spacing:.015em;margin:0;font-weight:750}.hero h1 span{color:var(--cyan)}.hero h1 .title-last{white-space:nowrap;color:inherit}.intro{color:var(--muted);font-size:14px;margin:21px 0 0;max-width:630px}.hero-side{align-self:center;display:grid;grid-template-columns:auto auto;column-gap:25px;align-items:end}.number{font-size:80px;line-height:1;letter-spacing:-.06em;font-weight:750}.number small{font-size:19px;letter-spacing:0;margin-left:7px;color:var(--muted)}.hero-side p{font-size:12px;color:var(--muted);margin:12px 0 0}.vertical-note{writing-mode:vertical-rl;font-size:11px;letter-spacing:.18em;color:var(--cyan);padding-bottom:5px;grid-column:2;grid-row:1/3}
.delivery{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:20px 24px;background:linear-gradient(100deg,#142d3b,#14243a);border:1px solid #305264;border-radius:13px;margin-bottom:34px}.delivery-stats{display:flex;gap:25px;flex-wrap:wrap}.metric{font-size:12px;color:var(--muted)}.metric strong{display:block;color:var(--ink);font-size:24px;font-weight:650;line-height:1.4}.metric strong span{font-size:13px;font-weight:400;color:var(--muted);margin-left:4px}.delivery-links{display:flex;gap:9px;flex-wrap:wrap}.button{display:inline-flex;justify-content:center;align-items:center;gap:8px;text-decoration:none;color:#ecf8fc;background:#20374b;border:1px solid #3c586b;border-radius:7px;padding:9px 13px;font-size:12px;line-height:1.5;font-weight:600}.button:hover{background:#2b4b60}.button.primary{background:#9ce7eb;color:#0b2835;border-color:#9ce7eb}.button.primary:hover{background:#c2f4f5}.button.quiet{background:transparent}.button.small{padding:7px 10px;font-size:11px}
.library-head{display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin:0 0 16px}.library-head h2{font-size:18px;font-weight:650;margin:0}.library-head p{font-size:12px;color:var(--muted);margin:0}.filter-area{margin-bottom:28px}.toolbar{display:flex;gap:10px;align-items:end;margin-bottom:17px}.search{position:relative;flex:1;max-width:500px}.toolbar label{display:block;font-size:11px;color:var(--muted);margin:0 0 5px}.search input,select{width:100%;height:42px;padding:8px 12px;color:var(--ink);background:#0d1e30;border:1px solid #385169;border-radius:7px;font-size:13px}.search input::placeholder{color:#91a8bc}.status-filter{width:200px}.reset{height:42px}.series-tabs{display:flex;flex-wrap:wrap;gap:7px}.tab{border:1px solid #2b4259;background:#101f32;border-radius:100px;color:#bfd1dd;padding:7px 12px;font-size:11px;font-weight:550}.tab span{font-size:10px;opacity:.72;margin-left:5px}.tab:hover{border-color:#6aa4b6;background:#172e41}.tab[aria-pressed="true"]{background:#d3f4f4;color:#103340;border-color:#d3f4f4}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:26px 18px;padding-bottom:42px}.card{min-width:0}.preview{display:block;position:relative;width:100%;padding:0;border:1px solid #354b5f;border-radius:13px;overflow:hidden;aspect-ratio:9/16;background:#1c3246;color:#edf9fd;text-align:left;transition:transform .18s ease,border-color .18s ease}.preview:hover{transform:translateY(-4px);border-color:#92d5df}.thumbnail{width:100%;height:100%;position:absolute;inset:0;overflow:hidden}.thumbnail img{display:block;width:400%;max-width:none;height:100%;object-fit:fill;object-position:left top}.thumbnail.empty{background:radial-gradient(ellipse at 100% 0,#254c63,transparent 70%),linear-gradient(165deg,#1f3148,#0b1d30);padding:24px 17px;display:flex;flex-direction:column;justify-content:center}.empty .thumb-series{color:#a2e4ed;font-size:11px}.empty .thumb-title{font-size:clamp(14px,1.4vw,21px);line-height:1.6;font-weight:650;margin:20px 0}.empty .thumb-pui{margin-top:35px;font-size:12px;letter-spacing:.15em;color:#b1cddd}.preview-shade{position:absolute;inset:68% 0 0;background:linear-gradient(transparent,rgba(3,15,26,.75));pointer-events:none}.play-circle{position:absolute;bottom:17px;right:14px;width:37px;height:37px;display:grid;place-items:center;border:1px solid #eefaffb3;border-radius:50%;background:#0a243dd9;backdrop-filter:blur(5px)}.clip-length{position:absolute;bottom:23px;left:14px;font-size:11px;letter-spacing:.03em;color:white}.card-id{position:absolute;top:12px;left:12px;padding:3px 7px;border-radius:5px;background:#0a223be6;color:#e4f9fd;font-size:10px;letter-spacing:.1em}.card-content{padding:11px 2px 0}.card-series{font-size:10px;letter-spacing:.02em;color:var(--cyan);margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.card h3{margin:0;font-size:13px;line-height:1.7;font-weight:650;min-height:44px}.status{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#bdd0dd;margin-top:9px}.status:before{content:"";height:5px;width:5px;border-radius:50%;background:#8198ad}.status.verified{color:#9ee2c3}.status.verified:before{background:#8be1b4}.status.stale,.status.failed{color:#f1c189}.status.stale:before,.status.failed:before{background:#e3aa68}.empty-result{padding:60px 20px;text-align:center;border:1px dashed #3c556b;border-radius:12px;color:var(--muted);margin:16px 0 40px}.empty-result h3{color:var(--ink);margin-top:0;font-size:18px}.empty-result p{font-size:13px}
.notes{margin:6px 0 40px;padding:23px 0 25px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:35px}.notes h2{font-size:13px;margin:0 0 8px}.notes p{font-size:12px;color:var(--muted);margin:0}.notes a{font-size:12px}.footer{border-top:1px solid var(--line);padding-top:19px;padding-bottom:25px;display:flex;justify-content:space-between;gap:20px;color:#90a8bc;font-size:11px}.footer a{color:#a6cbd8}
dialog{border:1px solid #39566b;border-radius:17px;background:#102136;color:var(--ink);padding:0;width:min(1050px,calc(100% - 36px));max-height:calc(100dvh - 36px);box-shadow:0 30px 100px #0008;overflow:auto}dialog::backdrop{background:#020b16d9;backdrop-filter:blur(7px)}.modal-top{display:flex;align-items:center;justify-content:space-between;padding:17px 23px;border-bottom:1px solid var(--line);gap:18px}.modal-top p{font-size:11px;color:var(--cyan);letter-spacing:.09em;margin:0}.close{width:35px;height:35px;font-size:24px;line-height:1;border-radius:50%;border:1px solid #426174;background:#1c344a;color:#f0faff}.modal-body{display:grid;grid-template-columns:minmax(220px,350px) minmax(0,1fr);gap:28px;padding:25px}.player-wrap{background:#050e18;border-radius:11px;aspect-ratio:9/16;overflow:hidden;align-self:start;display:grid;place-items:center;position:relative}.player-wrap video{width:100%;height:100%;max-height:69dvh;display:block;background:#06101d;object-fit:contain}.no-video{padding:25px;color:#b6cddc;font-size:13px}.modal-info h2{font-size:24px;line-height:1.5;margin:7px 0 9px;overflow-wrap:anywhere}.modal-summary{font-size:13px;color:#b4ccda;margin:0 0 13px}.metadata{font-size:11px;color:#a9c4d4;padding:10px 0 16px;border-bottom:1px solid var(--line);margin:0;overflow-wrap:anywhere}.file-actions{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0 20px}.copy-section{margin-top:16px}.copy-heading{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px}.copy-heading label{font-size:12px;font-weight:600;color:#e1f2fa}.caption-tabs{display:flex;gap:15px;border-bottom:1px solid var(--line);margin:14px 0}.caption-tab{border:0;background:none;color:#b4c9d7;padding:8px 0 10px;font-size:12px;border-bottom:2px solid transparent}.caption-tab[aria-pressed="true"]{color:#a0eff2;border-bottom-color:#a0eff2}.copy-section textarea{width:100%;resize:vertical;min-height:125px;background:#0b192a;color:#d4e7f1;border:1px solid #38526a;border-radius:7px;font-size:12px;line-height:1.8;padding:11px 12px}.copy-section textarea.title-field{min-height:60px}.copy-feedback{font-size:11px;color:#a9e7d4;min-height:20px;margin:8px 0}.native-hint{color:#98b2c6;font-size:11px;margin:0 0 14px}.contact-proof{font-size:11px;margin-top:15px}.contact-proof summary{cursor:pointer;color:#a5dbe6}.contact-proof img{width:100%;height:auto;border-radius:6px;display:block;margin:9px 0}.tiny{font-size:10px;color:#9db5c9}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[hidden]{display:none!important}
@media(min-width:1500px){.grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
@media(max-width:1100px){.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 15px}.hero-side{display:none}.hero{grid-template-columns:1fr}.hero h1{font-size:49px}.delivery{align-items:flex-start;flex-direction:column;gap:17px}.delivery-stats{gap:32px}}
@media(max-width:760px){.wrap{padding-left:6%;padding-right:6%}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 12px}.brand-word{display:none}.hero{padding-top:38px;padding-bottom:30px}.hero h1{font-size:40px}.intro{font-size:12px}.delivery{padding:18px}.metric strong{font-size:22px}.delivery-stats{gap:21px}.metric{font-size:10px}.notes{grid-template-columns:1fr;gap:22px}.footer{flex-direction:column;gap:8px}.edition{font-size:9px}.library-head{align-items:flex-start;flex-direction:column;gap:5px}.card h3{font-size:12px}.empty .thumb-title{font-size:14px}.modal-body{grid-template-columns:minmax(180px,42%) minmax(0,1fr);gap:18px;padding:18px}.modal-info h2{font-size:19px}.file-actions .button{font-size:10px;padding:8px}.modal-summary{font-size:12px}.modal-top{padding:12px 18px}.button{font-size:11px}.play-circle{width:31px;height:31px;bottom:13px;right:10px}.clip-length{bottom:17px;left:10px}}
@media(max-width:540px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 14px}.hero h1{font-size:34px}.top{padding-top:16px;padding-bottom:16px}.brand img{width:133px;height:42px}.delivery-stats{justify-content:space-between;width:100%;gap:13px}.metric strong{font-size:21px}.toolbar{flex-wrap:wrap}.search{flex-basis:100%;max-width:none}.status-filter{flex:1}.tab{font-size:10px;padding:6px 10px}.series-tabs{gap:6px}.card h3{font-size:12px}.empty .thumb-title{font-size:16px}.modal-body{grid-template-columns:1fr;gap:20px;padding:17px}.player-wrap{width:min(100%,270px);justify-self:center}.player-wrap video{max-height:53dvh}.modal-info h2{font-size:21px}.modal-top p{font-size:10px}.modal-top{position:sticky;top:0;z-index:2;background:#102136}.delivery-links .button{font-size:10px}.notes{margin-bottom:25px}.intro br{display:none}.status{font-size:9px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<a class="skip" href="#library">動画一覧へスキップ</a>
<header class="wrap top"><a class="brand" href="${official.site}" target="_blank" rel="noopener noreferrer"><img src="media/logo-original.png" alt="Project P"><span class="brand-word">ぷいの、つくると伝える。</span></a><span class="edition">CREATOR COLLECTION · 2026.10</span></header>
<main class="wrap">
<section class="hero" aria-labelledby="page-title"><div><p class="eyebrow">PUI / PROJECT P — SHORT VIDEO COLLECTION</p><h1 id="page-title">教える。作る。<br><span>伝える。</span><span class="title-last">ぷいの100本。</span></h1><p class="intro">学びのつまずきも、毎日の手間も、小さな一歩から。<br>TikTok・YouTube Shorts向けの縦動画と投稿文を、ひとつの場所に。</p></div><div class="hero-side" aria-hidden="true"><div class="number">100<small>SHORTS</small></div><p>10のテーマから、今日の一本を。</p><div class="vertical-note">A SMALL STEP, A NEW POSSIBILITY.</div></div></section>
<section class="delivery" aria-label="納品と検品の状況"><div class="delivery-stats"><div class="metric"><strong>${renderedCount}<span>/ 100</span></strong>MP4生成済み</div><div class="metric"><strong>${verifiedCount}<span>/ 100</span></strong>技術検査済み</div><div class="metric"><strong>9:16<span>・18秒</span></strong>制作仕様 / 1080 × 1920</div></div><div class="delivery-links"><a class="button primary" href="posting-captions.csv" download>投稿文CSVを保存 <span aria-hidden="true">↓</span></a><a class="button quiet" href="検品と利用案内.md">使い方・検品の記録 <span aria-hidden="true">↗</span></a></div></section>
<section id="library" aria-labelledby="library-title"><div class="library-head"><h2 id="library-title">今日、伝えたいことから選ぶ。</h2><p id="result-count" role="status" aria-live="polite">${records.length}本を表示${issuesCount ? ' / 再確認が必要な動画 ' + issuesCount + '本' : ''}</p></div>
<div class="filter-area"><div class="toolbar"><div class="search"><label for="search">キーワード</label><input id="search" type="search" placeholder="例：学習、フォーム、自動化" autocomplete="off"></div><div class="status-filter"><label for="status-filter">検品状況</label><select id="status-filter"><option value="all">すべての動画</option><option value="verified">技術検査済み</option><option value="rendered">MP4生成済み</option><option value="attention">検査待ち・要確認</option></select></div><button class="button quiet reset" id="reset" type="button">リセット</button></div><div class="series-tabs" role="group" aria-label="テーマで絞り込み"><button class="tab" type="button" data-series="" aria-pressed="true">すべて<span>${records.length}</span></button>${series.map(name => `<button class="tab" type="button" data-series="${escapeHtml(name)}" aria-pressed="false">${escapeHtml(name)}<span>${records.filter(record => record.series === name).length}</span></button>`).join('')}</div></div>
<div class="grid" id="cards">${records.map(record => `<article class="card" data-id="${record.id}"><button class="preview" type="button" data-open="${record.id}" aria-label="${escapeHtml('No.' + record.label + ' ' + record.topic + 'の動画と投稿文を開く')}">${record.contact ? `<div class="thumbnail"><img src="${record.contact}" alt="" width="1080" height="480" loading="lazy" decoding="async"></div>` : `<div class="thumbnail empty"><span class="thumb-series">${escapeHtml(record.series)}</span><span class="thumb-title">${record.hook.map(escapeHtml).join('<br>')}</span><span class="thumb-pui">ぷい / PROJECT P</span></div>`}<span class="preview-shade"></span><span class="card-id">${record.label}</span><span class="clip-length">${record.rendered ? '00:18' : '制作予定 18秒'}</span><span class="play-circle" aria-hidden="true"><svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M2 1.5 11 7 2 12.5V1.5Z" fill="currentColor"/></svg></span></button><div class="card-content"><p class="card-series">${escapeHtml(record.series)}</p><h3>${escapeHtml(record.topic)}</h3><span class="status ${record.state}">${statusLabel[record.state]}</span></div></article>`).join('')}</div>
<div class="empty-result" id="no-results" hidden><h3>この条件に合う動画はありません。</h3><p>キーワードを短くするか、テーマを「すべて」に戻してください。</p><button type="button" class="button" id="empty-reset">絞り込みをリセット</button></div></section>
<section class="notes" aria-label="このコレクションについて"><div><h2>開いて、見て、投稿文をコピー。</h2><p>各カードから動画を再生できます。TikTok用の投稿文とYouTube用のタイトル・説明文、編集原本も同じ画面から。SNSへの投稿は行っていません。</p></div><div><h2>検品の範囲を、そのまま記録しています。</h2><p>「技術検査済み」は、出力ファイルと検査記録が一致した動画です。人による全編のヘッドホン試聴や実機投稿の確認は含みません。<a href="検品と利用案内.md">詳しい検品と利用案内</a></p></div></section>
</main><footer class="wrap footer"><span>ぷい / Project P · ${escapeHtml(stamp)} JST 時点の生成・検査記録</span><span><a href="${official.site}" target="_blank" rel="noopener noreferrer">公式サイト</a> · <a href="${official.about}" target="_blank" rel="noopener noreferrer">プロフィール</a> · <a href="${official.contact}" target="_blank" rel="noopener noreferrer">ご相談</a></span></footer>
<dialog id="viewer" aria-labelledby="video-title" aria-describedby="video-summary"><div class="modal-top"><p id="modal-series"></p><button type="button" class="close" id="close-viewer" aria-label="プレビューを閉じる">×</button></div><div class="modal-body"><div class="player-wrap"><video id="player" controls playsinline preload="none" aria-label="動画プレビュー"></video><div class="no-video" id="no-video" hidden>この動画の生成はまだ完了していません。投稿文と構成は右側で確認できます。</div></div><div class="modal-info"><span id="modal-status" class="status"></span><h2 id="video-title"></h2><p id="video-summary" class="modal-summary"></p><p class="metadata" id="video-meta"></p><div class="file-actions" id="file-actions"></div><p class="native-hint">編集原本は、同じフォルダ内の media/ を参照します。素材と一緒に保管してください。</p><div class="caption-tabs" role="group" aria-label="投稿先"><button type="button" class="caption-tab" id="tab-tiktok" aria-pressed="true">TikTok</button><button type="button" class="caption-tab" id="tab-youtube" aria-pressed="false">YouTube Shorts</button></div><div class="copy-section" id="youtube-title-block" hidden><div class="copy-heading"><label for="youtube-title">YouTubeタイトル <span id="title-length" class="tiny"></span></label><button type="button" class="button small quiet" data-copy="youtube-title">コピー</button></div><textarea id="youtube-title" class="title-field" readonly></textarea></div><div class="copy-section"><div class="copy-heading"><label for="caption-text" id="caption-label">投稿文・ハッシュタグ</label><button type="button" class="button small" data-copy="caption-text">コピー</button></div><textarea id="caption-text" readonly></textarea></div><p id="copy-feedback" class="copy-feedback" role="status" aria-live="polite"></p><details class="contact-proof" id="contact-proof"><summary>4場面の確認用画像</summary><img id="contact-image" alt="冒頭・ヒント・例・ぷいの紹介の4場面" loading="lazy"></details><p class="tiny" id="audit-link"></p></div></div></dialog>
<script id="episodes-data" type="application/json">${data}</script>
<script>
'use strict';
const records=JSON.parse(document.getElementById('episodes-data').textContent);
const labels=${JSON.stringify(statusLabel)};
const byId=new Map(records.map(item=>[item.id,item]));
const cards=Array.from(document.querySelectorAll('.card'));
const search=document.getElementById('search'),filter=document.getElementById('status-filter'),tabs=Array.from(document.querySelectorAll('[data-series]'));
let activeSeries='',activeRecord=null,activePlatform='tiktok',opener=null;
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase('ja');
const index=new Map(records.map(item=>[item.id,normalize([item.label,item.series,item.topic,...item.hook,...item.insight,...item.example,item.caption,...item.tags].join(' '))]));
function update(){
 const terms=normalize(search.value.trim()).split(/\\s+/u).filter(Boolean);let count=0;
 for(const card of cards){const item=byId.get(Number(card.dataset.id));
  const status=filter.value==='all'||filter.value==='verified'&&item.verified||filter.value==='rendered'&&item.rendered||filter.value==='attention'&&!item.verified;
  const show=(!activeSeries||item.series===activeSeries)&&status&&terms.every(term=>index.get(item.id).includes(term));card.hidden=!show;if(show)count++;
 }
 document.getElementById('result-count').textContent=count+'本を表示 / 全'+records.length+'本';document.getElementById('no-results').hidden=count!==0;
 for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.series===activeSeries));
}
search.addEventListener('input',update);filter.addEventListener('change',update);
for(const tab of tabs)tab.addEventListener('click',()=>{activeSeries=tab.dataset.series;update();});
function reset(){activeSeries='';search.value='';filter.value='all';update();}
document.getElementById('reset').addEventListener('click',reset);document.getElementById('empty-reset').addEventListener('click',reset);
const dialog=document.getElementById('viewer'),player=document.getElementById('player'),feedback=document.getElementById('copy-feedback');
function element(tag,text,attrs){const node=document.createElement(tag);if(text)node.textContent=text;for(const [key,value]of Object.entries(attrs||{}))node.setAttribute(key,value);return node;}
function link(text,href,download){const node=element('a',text,{href,class:'button'+(download?' primary':' quiet')});if(download)node.setAttribute('download','');return node;}
function platform(value){activePlatform=value;document.getElementById('tab-tiktok').setAttribute('aria-pressed',String(value==='tiktok'));document.getElementById('tab-youtube').setAttribute('aria-pressed',String(value==='youtube'));document.getElementById('youtube-title-block').hidden=value!=='youtube';document.getElementById('caption-label').textContent=value==='youtube'?'説明文・ハッシュタグ':'投稿文・ハッシュタグ';document.getElementById('caption-text').value=activeRecord?(value==='youtube'?activeRecord.youtubeDescription:activeRecord.tiktok):'';feedback.textContent='';}
document.getElementById('tab-tiktok').addEventListener('click',()=>platform('tiktok'));document.getElementById('tab-youtube').addEventListener('click',()=>platform('youtube'));
function openRecord(id,button){
 const item=byId.get(id);if(!item)return;activeRecord=item;opener=button;
 document.getElementById('modal-series').textContent='NO. '+item.label+' / '+item.series;
 document.getElementById('video-title').textContent=item.topic;document.getElementById('video-summary').textContent=item.hook.join(' ');
 const status=document.getElementById('modal-status');status.textContent=labels[item.state];status.className='status '+item.state;
 const parts=[item.verified?item.width+' × '+item.height+' / '+item.seconds.toFixed(2)+'秒':'制作仕様：1080 × 1920 / 18秒',item.rendered?(item.bytes/1024/1024).toFixed(1)+' MB':'MP4生成待ち'];
 if(item.auditedAt)parts.push('検査 '+new Date(item.auditedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}));
 document.getElementById('video-meta').textContent=parts.join(' · ');
 const actions=document.getElementById('file-actions');actions.replaceChildren();
 if(item.rendered)actions.append(link('MP4を保存 ↓',item.video,true));
 if(item.hasEffectcraft)actions.append(link('EffectCraft原本',item.effectcraft,true));
 if(item.hasFilmcraft)actions.append(link('FilmCraft原本',item.filmcraft,true));
 document.getElementById('youtube-title').value=item.youtubeTitle;document.getElementById('title-length').textContent=Array.from(item.youtubeTitle).length+'/100文字';
 const proof=document.getElementById('contact-proof'),contact=document.getElementById('contact-image');proof.hidden=!item.contact;proof.open=false;
 if(item.contact)contact.src=item.contact;else contact.removeAttribute('src');
 const auditLink=document.getElementById('audit-link');auditLink.replaceChildren();if(item.audit){auditLink.append(element('a','この動画の技術検査記録',{href:item.audit,target:'_blank',rel:'noopener noreferrer'}));if(item.failedChecks.length)auditLink.append(document.createTextNode(' / 要確認：'+item.failedChecks.join('、')));}
 player.pause();player.removeAttribute('src');player.removeAttribute('poster');
 player.hidden=!item.rendered;document.getElementById('no-video').hidden=item.rendered;
 if(item.rendered){player.src=item.video;if(item.poster)player.poster=item.poster;player.load();}
 platform(activePlatform);dialog.showModal();document.getElementById('close-viewer').focus({preventScroll:true});dialog.scrollTop=0;
}
document.getElementById('cards').addEventListener('click',event=>{const button=event.target.closest('[data-open]');if(button)openRecord(Number(button.dataset.open),button);});
document.getElementById('close-viewer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();feedback.textContent='';if(opener?.isConnected)opener.focus();});
dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();return;}if(event.key!=='Tab')return;const focusable=Array.from(dialog.querySelectorAll('button,a[href],textarea,video[controls]')).filter(node=>!node.disabled&&node.getClientRects().length);const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
player.addEventListener('error',()=>{if(!dialog.open)return;document.getElementById('no-video').hidden=false;document.getElementById('no-video').textContent='動画を読み込めませんでした。MP4を保存して、動画プレーヤーでも確認できます。';player.hidden=true;});
for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',async()=>{const field=document.getElementById(button.dataset.copy);try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(field.value);feedback.textContent='コピーしました。投稿画面に貼り付けて使えます。';}catch{field.focus();field.select();field.setSelectionRange(0,field.value.length);feedback.textContent='文章を選択しました。Ctrl+C（Macは⌘C）でコピーしてください。';}});
</script>
</body>
</html>
`;

// BOM and CRLF preserve Japanese text and multiline fields in spreadsheet apps.
const csvField = value => {
  let text = String(value ?? '');
  if (/^[\t\r\n =+@-]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
};
const header = ['id', 'series', 'topic', 'tiktok_caption_hashtags', 'youtube_title', 'youtube_description_tags', 'filename'];
const csv = '\uFEFF' + [header, ...records.map(record => [record.label, record.series, record.topic, record.tiktok, record.youtubeTitle, record.youtubeDescription, path.basename(record.video)])].map(row => row.map(csvField).join(',')).join('\r\n') + '\r\n';
const readme = `# ぷい / Project P — 縦動画100本の検品と利用案内

生成日時：${stamp} JST

## 現在の納品状況

- 台本・投稿文：${records.length}本 / 予定100本
- MP4生成済み：${renderedCount}本 / 予定100本
- 技術検査済み：${verifiedCount}本 / 予定100本
- 検査結果の要確認・更新後の再検査待ち：${issuesCount}本
- 制作仕様：1080 × 1920（9:16）、30 fps、18秒、H.264、ステレオAAC 48 kHz

この件数はページ生成時点のファイルと検査記録から集計しています。「制作仕様」は全件の検査成功を意味しません。生成・再検査を進めた後は gallery.mjs を再実行し、一覧を更新します。

## 最初に開くもの

同じフォルダの [index.html](./index.html) をブラウザーで開いてください。インターネットへの接続や追加のライブラリは不要です。テーマとキーワードで絞り込み、カードを選ぶと動画と投稿文が開きます。再生は再生ボタンから開始します。

投稿文の「コピー」がブラウザーで許可されない場合は文章を自動選択します。Ctrl+C、Macは⌘Cでコピーしてください。動画のプレビューを閉じると再生も停止します。Escapeキーでも閉じられます。

## TikTok / YouTube Shorts への利用

1. 一覧で動画を選び、内容と音量を確認します。
2. 「MP4を保存」から動画を保存します。
3. 投稿先を切り替え、TikTokは投稿文・ハッシュタグ、YouTubeはタイトルと説明文をコピーします。
4. 各サービスの投稿画面で動画を選び、文を貼り付けて確認します。

投稿文をまとめて扱う場合は [posting-captions.csv](./posting-captions.csv) を利用してください。日本語向けのUTF-8 BOM付きCSVです。id、シリーズ、テーマ、TikTok投稿文、YouTubeタイトル（100文字以内）、説明文、MP4名を収録しています。引用符や改行を含む文はCSVの引用形式で保持します。

SNSへの投稿・予約投稿・アカウント操作は行っていません。公式TikTokアカウントは未特定です。ハッシュタグは投稿内容の整理用で、視聴数や効果を保証するものではありません。

## 検品の範囲

各動画の qa/NNN/audit.json が原記録です。技術検査では映像・音声の全体デコード、寸法・時間・フレーム数・形式、黒画面、無音区間、音量・ピーク、EffectCraft / FilmCraft原本の再読込、素材リンク、文字の実測安全域、出力と原本のハッシュ一致、確認用画像の生成を記録します。

一覧の「技術検査済み」は TECHNICAL_PASS、全検査成功、現在のMP4・両編集原本と原記録のサイズ・更新時刻一致が揃ったものです。検査後にファイルが変わったものは「更新後の再検査待ち」と表示します。生成だけが済んだ動画は「生成済み・検査待ち」です。失敗・未実行を合格に数えません。

qa/NNN/contact.png は1.4秒、5.3秒、10.4秒、15.3秒の4場面を並べた確認用画像です。一覧では左端の冒頭場面を表示します。サンプル画像だけでは全フレームの映像品質は判定できません。人による全編のヘッドホン試聴、物理端末の画面・スピーカー、TikTok / YouTubeアプリでの投稿・再圧縮結果の確認は主張しません。

## 編集原本と保管

- videos/NNN-pui.mp4：投稿用動画
- projects/NNN.ecproj：EffectCraftの編集原本
- projects/NNN.fcproj：FilmCraftの編集原本
- source/：台本と制作ソース
- media/：公式ロゴ・アイコン、各動画の音楽・中間映像
- qa/NNN/：個別の検品記録と確認用画像

編集原本は media/ の素材を参照します。この納品フォルダをまとめて保管してください。別の場所へ移す際は、EffectCraft / FilmCraftで素材の再リンクが必要な場合があります。原本リンクはファイルの保存用です。開くときは対応アプリを使います。

## 本人情報と素材の出所

- [公式サイト](${official.site})
- [公式プロフィール](${official.about})
- [公開ポートフォリオ](${official.portfolio})
- [問い合わせ先](${official.contact})
- [公式Project Pロゴ](${official.logo})
- [公式アイコン](${official.icon})

動画では依頼時の表記「ぷい」を使用しています。公式サイトの本人表記は「ぷぃ」、ブランド名は「Project P」です。本人の活動紹介は公式サイトの公開情報を基にし、架空の顧客実績・未確認の売上・成果保証を加えていません。図は考え方を示すイメージ図で、実際の顧客画面ではありません。音楽は手続き合成による新規インストゥルメンタルで、第三者の既存曲・音源サンプル・本人を模倣した音声は使っていません。

## シリーズ別の本数

| シリーズ | 本数 |
| --- | ---: |
${series.map(name => '| ' + name.replace(/\|/g, '｜') + ' | ' + records.filter(record => record.series === name).length + ' |').join('\n')}
`;

fs.mkdirSync(root, {recursive: true});
fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'posting-captions.csv'), csv);
fs.writeFileSync(path.join(root, '検品と利用案内.md'), readme);
console.log(JSON.stringify({output: root, episodes: records.length, series: series.length, rendered: renderedCount,
  technicalVerified: verifiedCount, needsAttention: issuesCount, generated: ['index.html', 'posting-captions.csv', '検品と利用案内.md']}));
