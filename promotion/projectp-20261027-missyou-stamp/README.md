# ProjectP — missyou「文章なしでも、送れる？」

10/25の実制作を紹介する10/27の投稿候補。交換日記アプリを「スタンプが主役、一言は任意」へ変えた判断を、実際の検証画面2枚の拡大で見せる。架空のタップ・送信成功、作者の感情や利用実績を加えていない。

- 動画：`videos/missyou-stamp.mp4`（1080×1920、30fps、22秒）。VOICEVOXナレーションmaster。
- カバー：`covers/missyou-stamp-cover.png`。編集原本：`projects/*.pcraft`、`projects/missyou-stamp.ecproj`、`projects/missyou-stamp.fcproj`。
- 投稿文：`source/caption.txt`、当日判断用metadata：`source/投稿文.json`。
- 納品先：`F:\Videos\ProjectP-Missyou-Stamp-2026-10-27\revision-01-live2d`。

## 実素材と説明の範囲

管理[Issue100](https://github.com/Pui-core/-/issues/100)、日次運用[親93](https://github.com/Pui-core/-/issues/93)。missyou [Issue162](https://github.com/Pui-core/com.pui-core.missyou/issues/162)に10/25のowner指示「一言は任意、スタンプをメイン」をCTOが保存。owner本人の直筆GitHub投稿や、今回収録した本人の発話とは呼ばない。PR165/main `604117fffe1cee686ce5302d5bc8fba910570d60`へ接続する制作記録であり、内部TestFlightの検証をApp Store一般公開・外部審査完了へ広げない。

Beforeは文章欄中心、Afterは実際の選択状態・任意欄・送信ボタン。画面は合成QAデータ。元PNGのSHAとcrop座標は`qa/source-images.json`に保持し、相手名のある上部を含めない。原本のUIを描き直さず、PhotoCraftでそのままcrop/埋込みした。初期r4b動画、招待コード、無関係な画面は使用していない。変更前の画像だけから「文章必須だった」と断定しない。静止画のパンと切替を実操作録画とは説明しない。

## モデル・声・共同検討

指定`Revenant_Natural`のMOCをローカルの正式Cubism Coreへ実ロード。今回の新VOICEVOX音声の33.333ms PCM RMSから口開閉を作り、瞬き・視線・呼吸と合わせた660フレームを描画する。旧99の口閉じlistenerloopを流用しない。カメラ取得・VTube Studio・物理演算の実行は含まない。原MOC/atlas/SDKを変更・Git公開・納品せず、再現用recipeと描画済み素材を扱う。

`AvatarCore.java`は既存99の最小Core描画utilityを再利用。元はlive2d-agent-kitのMIT renderer（Copyright 2026 Ariakage）。全文許諾は`source/live2d-renderer-LICENSE.txt`。SDKとモデル自体の再配布許諾を表すnoticeではない。

ナレーションは`VOICEVOX:青山龍星（合成音声）`。有限のheadless engineを今回だけ起動・終了し、既存ポートやGUIには触れない。外部楽曲・推測音源・app固有SEは加えていない。人気楽曲の選定は親93/97で未達として継続する。

Claude実CLI（`claude-opus-5-5`、success）による編集検討を受領し、具体的な問い・最初から実UI・タップの捏造なしを採用。sanitizeした実行結果要旨と元SHAは`qa/claude-editorial.json`。Claudeが画像/動画を直接見た、音を聴いたとは説明しない。単一時点の維持率低下を、原因が証明された結果へ読み替えない。

## 再現と検証

既存ローカルPhotoCraft/EffectCraft/FilmCraft、Java、Cubism、VOICEVOX、ffmpegを使用。`source/native.mjs`のパスと元画像所在を環境に合わせる。原PNG/MOC/SDKは持ち出さず、既存の正しい入力を使う。

```text
node source/audio.mjs
node source/model.mjs
node source/assets.mjs
node source/assets.mjs cover
node source/picture.mjs
node source/render.mjs
node source/verify.mjs
node source/package.mjs
```

Core sequenceと納品先は既存出力があれば拒否し、再実行で保全済み素材を上書きしない。画面や音だけの修正で元Core660枚を再生成する必要はない。

最終MP4は1080×1920/30fps/660frame/22秒・H.264/AAC、全AVデコード成功。実5cueのAAC対PCMは全lag0、相関0.999899以上。最終音量-20.1 LUFS/true peak-4.0dBFS。Core660枚の頭髪上余白は全24px/頭部edge接触0、無音425frameは口値0、有音235frameで口値最大0.849986、瞬き最小0。実測は`qa/technical.json`、`qa/audio-model-sync.json`、`qa/model-alpha-bounds.json`へ記録。重要切替の連続frameと最終動画SHAの結合は`qa/final-frame-binding.json`。カバーと主要場面を原寸で目視し、相手名・UI/顔/字幕の重なり・ラベル欠けを確認した。納品先3Craftの実再保存・描画・欠損・source/F SHA結果は`qa/delivery.json`を正とする。数値検査や静止画目視を全編の直接主観試聴へ読み替えない。

## 投稿への引継ぎ

これはnative UIの限定確認を終えた制作候補。現在の確認状態は`qa/current-status.json`、実画面と操作観測の正本は`qa/native-ui/native-ui.json`。Rootが固定master/coverと192文字captionを実TikTok stagingへ入れ、主要9場面と22/22終端、cover2点、ownbrand ON・第三者brand OFF・AIGC ON・著作権/簡易contentの両check問題なしを確認した。profile側coverの画像はmock表示であり、本人の実プロフィール公開・フォロワー数の証明ではない。

初回stageはcounter02/seek06で画面が進まずeditor loaderも完了しなかった。元bytesのまま1回の同ファイル差替え後に22/22へ到達し、caption/cover/開示等を再設定した最終replayも22/22を確認。原因を動画/encoder/ブラウザ等へ断定しない。9phone画像は最終replay、2cover画像は初回stage側の同じ固定coverの証跡として区別する。名目採取秒は正確なmedia frameや音声同期の証明ではなく、連続全編目視・直接の主観全編試聴へ広げない。

Rootはstagingを破棄し、下書き保存・投稿・予約・プロフィール保存は0。StudioHomeへ戻り、既存の初投稿ID7700540849909763336と26日19:15のMIX予約ID7700634126155648264を保持した。この候補には公開IDがなく、実公開は未確認。残る直接全編主観試聴、10/27当日の採用・最新活動/前投稿metrics、最終音源・公開時の再確認と公開receiptは親93の単独publisher範囲。AIGC/ownbrandの確認は破棄したstagingの結果なので、将来の投稿で再適用/再確認する。人気曲を使った・一般公開済みとはせず、既存GOに新しいowner承認待ちを加えない。

制作時点の`qa/technical.json`等にあるnative未確認/描画直後pendingの値は、その段階の履歴として保持する。旧863fileのsource/F検証receiptは`qa/delivery-production-863.json`（SHA`30d5bddb8c5df1b10d74d0494087808e1cd45174246ba448810bd813ae6f891d`）へbyte一致保存。今回の後続native追補とsmall文書/metadata同期を含む対応は、更新後の`qa/delivery.json`で区別する。動画/cover/caption/3Craft原本は不変更で、再描画や全編試聴を再実行したという記録ではない。

### 検証recipeの抽出順の追補

初回制作の実MP4と56枚の結合画像は正しい。追加画像の番号を配列の途中へ加えた検証recipeでは、将来の一括再実行時にffmpegの時系列出力と保存名の対応がずれるため、抽出配列を番号順に整列した。修正後のproduction抽出・rename処理そのものを固定MP4へ実行し、既存56枚の全SHA一致を確認。`qa/verify-order-regression.json`に旧順序の不一致と実再抽出結果を保持する。モデル/音/MP4/カバー/投稿文/3Craft原本は不変更で、Fへはhelper・文書・証跡のsmall追補だけ反映した。
