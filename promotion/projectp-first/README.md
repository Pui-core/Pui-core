# ProjectP 初投稿

[動画を再生](index.html) / [MP4](videos/01-projectp-first.mp4) / [台本](source/%E5%8F%B0%E6%9C%AC-%230087ProjectP%E5%88%9D%E6%8A%95%E7%A8%BF.md)

実際のAI相談から、制作中のObjectCreatorの剣分解・モデル原本・コード・再組立を見せ、medicateの歌声につなぐ1本です。27.267秒、818フレーム、30fps。3本完成や年末の完成保証を示す内容ではありません。

## 再制作

WSLのNode.js、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。

```bash
node source/produce.mjs plates
node source/audio.mjs
node source/produce.mjs prepare
node source/produce.mjs render
node source/verify.mjs
node source/make-index.mjs
node source/package.mjs
```

保存済みのplateとmixがそろっていればprepareから再出力できます。platesとaudioを作り直すには、ソースに記録した元素材が必要です。packageの既定納品先は `F:\Videos\ProjectP-初投稿-2026-10-25`。既存素材を再リンクし、その場所から編集原本を再読込・保存・描画する工程はpackage側が担当します。

## 素材と編集の入口

- [source/episodes.mjs](source/episodes.mjs)：元素材の所在、カット、字幕、カメラと時刻。
- [source/audio.mjs](source/audio.mjs) / [media/first-mix.wav](media/first-mix.wav)：同曲の伴奏・声・残響の接続とmix。本人制作と確認済みのmedicate V6を使用し、[投稿文](source/%E6%8A%95%E7%A8%BF%E6%96%87.json)に曲・歌・MV：ぷいと記載しています。beatの単独作曲や写真の被写体の本人性は断定しません。
- [EffectCraft原本](projects/01-projectp-first.ecproj) / [FilmCraft原本](projects/01-projectp-first.fcproj)：編集プロジェクト。
- media：切り出し済み素材・mix。元の長尺音源や会話の全景を再配布する入口ではありません。

## 確認範囲

形式・全デコード・音量・素材欠損・動画/mix/原本のSHA・納品先からの再読込と描画は、最終の `qa/01-projectp-first/technical.json`、`qa/portable-package.json` と各検査記録を参照します。このページの生成は検査成功の判定ではありません。

全編の直接視聴・試聴とSNS公開は未実施。ownerの創作採用と公開後の結果は技術検査から分けて扱います。Blender素材は既存原本の視点操作で、新規モデリングの実演ではありません。人物画像を本人の写真とは断定しません。

管理：Pui-core/- #87。一覧と台本は `node source/make-index.mjs` で再生成します。投稿文正本を更新した場合も再実行します。
