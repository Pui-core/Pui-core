# EMBERWAKE：押す長さで変わる跳躍

管理 [Issue152](https://github.com/Pui-core/-/issues/152) の8秒縦動画1案。実開発画面の短押し失敗→長押し着地を見せ、末尾2秒で [CAMPFIRE](https://camp-fire.jp/projects/993744/view) の開発支援へつなぐ。BGM版と声・効果音版は同じ映像であり、別々の新作2本として再投稿するためのものではない。

## 完成動画と原本

NAS保存先は `\\100.105.2.75\private\work\videos\2026-10-29\エンバーウェイク\2119_押下で変わる跳躍_見出し音改_v03\`。時刻2119は最終BGM書き出しの実更新時刻。動画2本だけを保存した。

| 用途 | ファイル | SHA-256 |
|---|---|---|
| YouTube候補 | BGM版.mp4 | 9e1a38827ec67bdc59876bc4abc7627e8927c95960bc1a529d7332dcc607bbf2 |
| TikTok候補 | 声・効果音版.mp4 | c669117064ac5c37f151ddf47d3869156c058634c525e01e3db65fcd36c2df11 |

両方とも1080×1920 / 30fps / 240frame / 8.000秒 / H.264＋AAC48kHz stereo。NAS上の各ファイルを直接全AVデコードしexit0、SHA一致。マウス・グローバルキー・前面化変更0、WindowsコンソールHWND0。最初の保存先時刻2135は誤指定だったため、自分の同SHA2本だけのフォルダーと確認して2119へ修正し、修正先で再hash・直接decodeした。経緯はQA票へ残した。

編集原本と依存素材は `F:\Videos\ProjectP-EMBERWAKE-Jump-2026-10-29\jump-v01\` に保持。今回の `projects/` はその実PhotoCraft/EffectCraft/FilmCraft原本の同SHAバックアップで、参照先はF上の制作パッケージ。F上で保存・再open・描画・書き出しを実行しており、Gitコピーを単独で開けば全素材が同梱される、という意味ではない。raw、全版、指定モデル、SDK、曲・声の原WAVはGit/NASへ混ぜず保全した。ローカル完成コピーも次の投稿工程のため保持。

## 実素材と構成

原rawは `ep01-replay-controls01-game.mp4`、SHA `c0b94ae3e559809216db5536c13f3ca4c9121fc2dd7b1630c91c2257df78eb86`。ゲーム0.12.0 / Source commit `71584a6bd0c8852885157de71032fd9252e7a04c` の通常InputEventKey自動化収録。製品の状態setterによる演出ではない。入力・軌跡原票とSHAは `qa/provenance.json`。

短押し開始f196、長押し開始f400の位置・速度・足場・世界状態が一致。横入力は双方開始9displayframe後に解除、対応18組のx差0。短押しはf197で解除してf217でチェックポイント位置[95,1160]・足場[32,1160,210,48]へ復帰（開始足場[200,1124,104,14]とは別）、長押しはf418で解除・目標足場へ着地する。HUD時計にはPNG待機が含まれるため、実所要時間や「0.03秒押し」等の主張には使っていない。

| 動画区間 | rawの採用frame（両端含む） | 見せること | 読むための末尾静止 |
|---|---|---|---|
| 0–1.6秒 | 176–216 | この段差、届く？／短押しで届かない | 7frame |
| 1.6–3.2秒 | 394–432 | 同じ足場から長押し、実着地 | 9frame |
| 3.2–4.0秒 | 196–213 | 比較リプレイ：短押し | 6frame |
| 4.0–4.8秒 | 400–417 | 比較リプレイ：長押し | 6frame |
| 4.8–6.0秒 | 418–453 | 比較リプレイ：届いた結果 | 0frame |
| 6.0–8.0秒 | 既存Core素材0.6–2.6秒 | 制作支援CTA／指定モデルのidle・blink | なし |

ゲーム動作は原fps、スロー演出なし。crop `[740,430,720,650]` でHUD・物語文・上側ルートを除外し、対応ショットは同倍率。同じ足場のカメラ追従は元ゲームの動きで、加工したRTAや固定カメラ比較ではない。結末・ボス・COMPLETE・謎の解答は見せていない。133の落下/記憶案とrawの一部が重なるが、新たな問いは押下時間と着地の因果。151縦PVと同じ別音版ではなく、146制作秘話のfixtureとも別区間。

モデルは既存の実CoreJNI `Revenant_Natural` 120frameの無声idle/blinkから60frameを採用。新収録、口パク、物理演技、トラッキングとは称していない。

## 音と修正

VOICEVOX玄野武宏の「短く。」「長く。」「届いた。」だけを使い、説明の主体は実プレイにした。原ゲーム音は未収録、SEは編集音。声の実有声範囲は0.690–1.145 / 1.955–2.325 / 3.040–3.405秒。

BGMは既存確認済み `Cipher / Kevin MacLeod (incompetech.com)`。出典は <https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100844>、ライセンス [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。同原曲の0.835秒から8秒を抜粋し、音量調整・声区間duck・終端fade。帰属はMP4 metadataと `source/posting.json` の概要欄案へ記載。新作曲・VST導入はしていない。

初回の声マスクと5.120秒以降の無意図なBGM無音を修正。声は元WAVから+6.0206dB、曲は同一区間を再処理し実有声範囲へgain envelopeを適用した。旧chain内部原因は未確定であり、sidechain入力EOFが原因と断定しない。v03の声/BGM差は同一cue RMSで9.42–10.80dB、曲は7.99秒まで残り、意図したfadeは7.7–8.0秒。AAC頭尾・peak・同期は `qa/audio-summary.json`。

## 実検証と制約

- 実3Craftの原本作成・再open・描画・FC2書き出し、参照ファイル存在、全AVdecode、最終2本の240frame映像一致、NAS2本の直接decode/SHA一致を確認。
- 最終MP4から全header適用172frameをRGB測定し、文字の上端182–194px、横中心540–540.5px。全画面シート、3.2–6.0秒の連続header strip、終端7.966667秒をWriterとRootが実見。Rootは構図・密度・主役/目標・CTA終端の美術を受入済み。
- 最初の360px検出はゲームの金色灯を8frameで混入。原fail票を保持し、同じ色条件を上部0–309px文字ROIと下側310–359pxに分類。f38/f113実画像でも灯を確認。上端y0を検査から除外していない。
- **初回の上端欠け観測と保持原票の同一性は未確定。** いま保持するv01実MP4・first-pass PNGでは欠けが再現せず、旧v01 REDは未実証。保持v01を不良品と断定せず、実際に無いREDを作っていない。
- 最終AACのlag0sample、clip0、語頭尾相関min0.99937、true peak声版−3.8/BGM版−3.5dBTP。これは数値検証であり、**全編を実時間で直接視聴・試聴した評価ではない**。聴感の自然さは未検証。

`qa/final-v03-quality.json` と `qa/package-manifest.json` が現版の対応票。`source/qa.mjs --resume` は終端exit0だった保存済decode/format記録を最終SHAと結び、成功済処理を二重実行せず最終票を組み立てる。`source/inspect-headers.mjs` は原failを上書きせず分類を別票へ保存する。

制作コードは既存限定環境の実行履歴を再現するためのもの。`prepare` → `audio` → `picture` → `render`(v01) → `repair-headers`(v02) → `render --v02` → `repair-headers --center` → `rebalance-audio-v03` → `render --v03` → `cover` を実行した。既存ファイルがあれば中止する設計なので、保持パッケージへ再実行して上書きしない。NativeバージョンはPhotoCraft0.15.1 / EffectCraft0.14.0 / FilmCraft0.10.0。Linux専用Xvfbと個別XDG設定を使い、共有Windowsデスクトップには入力しない。

## 次の工程

今回は制作・NAS・Source納品。SNS投稿・予約・native曲選択・Related設定・CAMPFIRE編集は0。投稿案は `source/posting.json` に分離し、146制作秘話へのRelatedは候補だけ。TikTokではJP native曲・区間・音量、接続先・quota・既投稿/予約を実確認してから別工程で1intentにする。

owner最新指示は「デモは2026年12月提供見込み、本編時期未定」、CAMPFIRE表示は変更しない。公開後24h/72hの継続視聴・維持率・フォロー・送客を測るまで、伸長・売上への寄与は仮説。年商500万円の目標を実売上とせず、実売上・年度・期限は未確認のまま維持する。
