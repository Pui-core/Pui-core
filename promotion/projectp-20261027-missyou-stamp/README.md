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

これは制作候補。TikTok native UI、実際のAI生成コンテンツ開示toggle、直接の全編主観試聴、10/27当日の採用、最終音源、予約・公開・公開後結果は親93の単独publisherが扱う。今回の合成音声に対するAI開示はONを予定し、実アプリ画面の編集と合成ナレーションを明記する。人気楽曲を使った・全編試聴済み・一般公開済みとはしない。10/26の既存MIX予約と初投稿を変更せず、この候補制作を根拠に新しいowner承認待ちは追加しない。
