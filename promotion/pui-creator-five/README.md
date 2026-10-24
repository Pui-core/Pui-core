# ぷい本人ブランドの制作リール5本

ゲーム・アプリ・ソフト・曲・歌・映像を実作品で見せ、作者を覚えてもらうための試作。[再生一覧](index.html)と[方針書](宣伝-%230084ぷい本人ブランドの方針.md)から参照できます。

ObjectCreator、EMBERWAKE、Glass Folders、Truth or Lie、medicateの実素材を使用。各16.23〜22秒。動画・FilmCraft/EffectCraft原本・編集リンク素材・台本・投稿文・QAを保存しています。素材の出典と採用状態は `qa/*/source-manifest.json`、本人の楽曲確認は方針書に記録。

## 再制作

Node.js / WSL、EffectCraft 0.14.0、FilmCraft 0.10.0、既存Windows FFmpegを使用。

```bash
node source/produce.mjs prepare
node source/produce.mjs render
node source/verify.mjs
node source/make-index.mjs
```

保存済みのtrim済みMP4・完成mixを使うため、`prepare`以降は元の長尺作品を開かず再制作できます。`plates`は元素材からの切出しを作り直す操作で、`source/episodes.mjs`等に記録した元ファイルが必要です。

```bash
node source/produce.mjs plates
node source/package.mjs '/mnt/f/Videos/ぷい本人プロモ5本-2026-10-24'
```

完全納品先は `F:\Videos\ぷい本人プロモ5本-2026-10-24`。Gitは完成動画・原本・trim済み素材・mix・コード・必要なQAを保存。FilmCraft用の中間masterはローカル納品に保存し、Gitからは`render`で生成します。元の長尺楽曲・第三者の別作品・未使用プロジェクト内部資料はGit配布へ含めません。

技術検査、抽出画面の目視、全編の実時間視聴・試聴、ownerの創作評価、投稿後成果は区別します。確認範囲は `qa/納品検査.json`。SNS公開・予約投稿・プロフィール変更は未実行です。

管理: https://github.com/Pui-core/-/issues/84
