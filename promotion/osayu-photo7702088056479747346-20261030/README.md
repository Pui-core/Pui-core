# おさゆ・11/3チュートリアルバトル告知

管理 [Issue157](https://github.com/Pui-core/-/issues/157)。制作担当 native session `01a18a7f-ac54-7632-af87-2be7ecedc5b2`。このディレクトリは制作コード・参照レシピ・投稿文・非秘密の検品要約を保存します。人物素材、人物入りの本番動画/画像、試聴音源はGitへ含めません。

## 今回の内容と演出

元投稿：<https://www.tiktok.com/@oosayuuu2525/photo/7702088056479747346?lang=ja-JP>。ORBITがowner提供のスクリーンショットから読み取った文章を用います。creatorは人物入り添付をAIへ再入力していません。

11月3日のチュートリアルバトル、先生は尊敬するセラ先輩、緊張しているけれど頑張るという気持ちと応援の呼びかけを、19秒・7場面へ編集しました。大きな日付→バトル告知→企画名→先生紹介→意気込み→応援→日付と配信への単一導線、の順です。開始時刻・開催年・対戦ルール・目標数字は補っていません。

暗いステージ、ミント・ピンクの文字と図形、短い飛来・行き過ぎ・着地、同じ方向のワイプを使います。人物を含む画面全体を動かさず、人物は全編固定の独立した最上位レイヤーです。旧11/24ビンゴ、旧22秒、150BPM、ProjectPの65秒制約を流用していません。

## 私的な素材と原本

- 元JPEG：`F:/Users/pui/Documents/gara/立ち絵.jpg`。905×1810、SHA-256 `89729c246851b636dd535fb077e2098dca9f59f32e7cd19846e0a09e0aaf57c2`。
- 既存通常透過PNG：V4の `character-cutout.png`、SHA-256 `e9947701b3ae601f8ef098c4e2ab0e55e76d0fa32f3c5aef0d08dca015b36bef`。新しい背景除去・再描画・人物生成を行いません。
- 人物なしの承認背景：V4の `stage-background.png`、SHA-256 `248b7ab464152f87b48beb80dd8e94b3399c12c28b4734cd7138c84b54c115e6`。
- Linux制作root：`/home/pui/Videos/Osayu/2026-10-30/photo7702088056479747346/revision-03/`。
- 版付き納品root：`F:/Users/pui/Documents/gara/おさゆ_1103チュートリアルバトル_20261030_v03/`。実在・検品結果は `qa/delivery-summary.json` を参照します。

`editable/projects/` はLinux版原本、`editable/projects/windows/` はFドライブへ再リンクしたWindows版原本です。EffectCraftが文字・図形・固定人物の編集原本、FilmCraftが本番映像を置いた無音の仕上げ原本です。`character-free-preview.ecproj` は人物を非表示にした原本ではなく、人物をimportしていない別原本です。

## 再生成

既存Linux EffectCraft0.14.0 / FilmCraft0.10.0と既存FFmpegを使用します。新規の依存ダウンロードや常駐サービスは必要ありません。`runtime.mjs` は専用XDG、所有Xvfb、2CPUへの制限と有限timeoutを使い、共有PCの入力や既存GUIへ接続しません。

新しい版を作るときは、空のLinux専用rootを `OSAYU157_ROOT` に明示します。既存の原本や書き出しがあれば上書きを拒否します。

```bash
node build.mjs
node build.mjs --production-draft
node verify-source.mjs
node audit.mjs
node render.mjs preview
node review-preview.mjs
node render.mjs main
node film.mjs
node audit.mjs opaque
```

`--production-draft` は人物をimportする本番原本の生成スイッチ名です。人物をAIへ表示する許可ではありません。文字内容は `motion.mjs`、出典と未確認値は `content.json` にあります。音声素材への依存はありません。

## 検品の範囲

人物の位置 `[725,1210,0]`、scale `450/905×100`、rotation0、opacity100、19秒全編、親・キー・式・マスク・効果・ブラー・3Dなしを保存原本から確認します。人物を除くレイヤーは確認版と本番で正規化して照合し、文字の着地時の重なり・予約領域との交差・画面外を検査します。

人物未importの各場面と遷移だけをAIで実見します。本番の人物領域は通常ソフトによる可逆描画と不透明内部の数値一致で確認します。有損H.264のフレーム間MSEだけを人物移動の合否に使いません。

主投稿MP4は音声stream0、全フレームdecode、解像度・fps・尺・フレーム数を検査します。納品先で原本を再読込・保存・描画し、ファイルのSHAを照合します。実結果は `qa/` の要約へ記録します。ownerの創作採用、本番全編の人間による視聴、TikTok実機、曲の試聴/同期、投稿・集客効果は技術検品とは別です。

## 価値と未検証の効果

初見が日付・企画・先生・応援先を短時間で理解し、プロフィールから配信へ進みやすくするのが目的です。視聴維持・配信流入・売上増は仮説で、未投稿のため実測していません。年商5,000,000円は事業目標であり、この制作を実売上として計上していません。
