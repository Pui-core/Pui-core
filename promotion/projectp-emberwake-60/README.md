# EMBERWAKE 初投稿60秒

[動画を再生](index.html) / [MP4](videos/01-emberwake-campfire-60.mp4) / [台本](source/%E5%8F%B0%E6%9C%AC-%230088EMBERWAKE%E5%88%9D%E6%8A%95%E7%A8%BF60%E7%A7%92.md) / [投稿文](source/%E6%8A%95%E7%A8%BF%E6%96%87.json)

EMBERWAKEの制作本格化と、CAMPFIREでの応援につなぐ初投稿1本です。60.000秒、1800フレーム、1080×1920、30fps。芯石の仕掛けから全5章のデモ、実コードと開発イメージを見せます。

## 公開案内の現在地

2026-10-25時点ではCAMPFIREは公開準備中。動画・投稿文・一覧は「応援してください」「フォローで、公開のお知らせを。」で統一し、支援URLは空欄です。正式な公開状態と公開URLを再確認し、公開済みとなった場合にCTAを更新します。未確認の募集開始、リンク先、目標額、リターン、提供日や完成保証は追加しません。SNSへの投稿・予約やCAMPFIREページの編集・公開は、この制作には含めていません。

## 再制作

WSLのNode.jsと、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。

```bash
node source/build-edit.mjs
node source/audio.mjs
node source/produce.mjs prepare
node source/produce.mjs render
node source/verify.mjs
node source/make-index.mjs
node source/package.mjs
```

`build-edit.mjs` をやり直すには、同スクリプトが参照する元素材、全5章のcaptureとfocus記録、PNG連番、3D映像、CAMPFIREメイン画像、GDScript原ファイルが必要です。`audio.mjs` は参照元の音源・制作スクリプトも照合するため、同ファイルに記録した元パスが必要です。

保存済みの `source/edit.json`、`source/episodes.mjs`、`media` 内の各PNG連番・映像・画像とmixがそろっていれば、prepareから再出力できます。素材のフォルダー構成とPNG連番の名前を保ってください。 納品先にはFilmCraft参照用のProResマスターも同梱します。大容量マスターはGitには含めず、必要ならprepare・renderから再生成します。packageは納品先へコピー・再リンクし、その場所から原本を再読込・保存・描画して対応するSHAを記録する工程です。既定納品先は `F:\Videos\ProjectP-EMBERWAKE-60秒-2026-10-25`。ネイティブcomp名は `EMBERWAKE Support 60` です。

## 素材と編集の入口

- [edit.json](source/edit.json) / [episodes.mjs](source/episodes.mjs)：18カットの時刻、文字、素材パス、注目位置、CAMPFIREの状態。
- [build-edit.mjs](source/build-edit.mjs)：元素材の入口と連番コピー。ゲーム v0.11.0、元commit `6233f5d33b24a35e91800357b7bcf8861049cf2a`。
- `media/chapter-I`〜`chapter-V`：実ゲームの30fps PNG連番。`dawn-still.png` は実ゲームの保存画像。
- `media/cinema-*.mp4`：Blenderで制作した開発イメージ。実ゲームは2Dで、3Dのプレイ動画ではありません。
- [real-code-excerpt.txt](source/real-code-excerpt.txt)：実GDScriptの抜粋。組版表示で、入力操作の収録ではありません。
- [CAMPFIREメイン画像](media/campfire-main.png)：制作済みの実画像。公開ページの収録ではありません。
- [audio.mjs](source/audio.mjs) / [mix](media/emberwake-60-mix.wav)：本動画用の制作BGM。外部サンプル・歌声なし。制作方法と音量等の記録は最終qaを参照します。
- [EffectCraft原本](projects/01-emberwake-campfire-60.ecproj) / [FilmCraft原本](projects/01-emberwake-campfire-60.fcproj)：編集プロジェクト。

## 確認範囲

動画・原本・qaは制作の進行に合わせて生成されます。一覧と台本の生成だけで検査成功にはしません。形式・全デコード・音量・素材欠損・動画/mix/原本のSHAは最終の `qa/01-emberwake-campfire-60/technical.json` と各検査記録、納品先からの再読込・保存・描画とSHAは `qa/portable-package.json` を参照します。

この文書の生成作業では、直接の全編視聴・試聴、スマートフォン等の実機再生、ownerの創作採用、SNSへの投稿は実施・判定していません。実施した検査と残る確認は最終qaと報告で区別します。全5章のデモは製品版の完成・公開や完成保証を意味しません。

管理：Pui-core/- #88。一覧・README・台本は `node source/make-index.mjs` で再生成します。投稿文正本を変更した場合も再実行します。
