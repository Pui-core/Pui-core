# 嘘か誠か v10：締めの指定モデルを実Core口パクへ

TikTok用の19.2秒・声と効果音の候補。既v09のR2投票②→嘘⑤→出題側に+1点という実画面、字幕、6句、App Store案内を継承し、16.8〜19.2秒のNatural静止PNGを72フレームの透過動画へ変更する。既YouTube投稿やTikTok下書きを変更・再送する作業ではない。

## 保存と実装

- 管理 [#143](https://github.com/Pui-core/-/issues/143)。Sourceはこのフォルダーだけを編集する。未マージの[制作134／PR67](https://github.com/Pui-core/Pui-core/pull/67)とFのrevision-05-real-roundを読取専用で参照し、元recipe・音声bindingをsource/baselineへ保全。
- Fの独立stageは ProjectP-TruthOrLie-Short-2026-10-28/model-motion-20261029。PhotoCraftカバー、EffectCraft原本、FilmCraft原本、依存、最終MP4とQAを保持する。完成動画だけを指定NASの制作日／作品／時刻・内容・修正・版へ保存し、Rootアップロード用のlocal finalも保持する。
- SeeThrough-workflowsのRevenant_Naturalを既141と同じMOC・2atlas・正式Core jar/JNIのSHAで固定。Coreで毎フレームgeometryを更新し、600×780の透過PNG72枚とProRes4444へ描画。旧v09の声のみPCMのglobal16.8秒から1600samples／frameでRMSを取り、口へ入力する。瞬き・小さい頭／呼吸変化は手続き入力で、カメラ／人間のtrackingや物理simulationではない。
- EffectCraftの開始／in点16.8秒、out点19.2秒と、実保存されたlayer-local timeRemap 0→0／2.4→2.4を照合する。in/outだけでmovie終端が静止する状態を許容しない。

## 再現

導入済みのPhotoCraft／EffectCraft／FilmCraft CLI、ffmpeg、Linux javac、Windows Javaと正式ローカルCore、指定モデル、既v09のF依存を使用する。SDK・MOC・atlas・モデル原本はGitとNASへ含めない。rendererのMIT noticeはsourceに保持する。

新しい空stageへ PROJECTP143_STAGE を指定し、順に source/prepare.mjs、source/model.mjs、生成stageのsource/photo-v10.mjs、source/render.mjs、source/verify-audio.mjs、source/verify-picture.mjs、source/deliver.mjs をnodeで実行する。既存の描画／WAV／原本／完成物は保全し、同名の別内容を上書きしない。初期stageの既定値と各依存位置はsource/common.mjs・model.mjsに記録する。

## 確認範囲

qaの記録へ、72Core frames・実Alpha範囲・口／目だけの入力差による可視pixel変化、3Craftの保存／再open／render、元6句PCMと最終AAC頭中尾・全AV、504フレームの既映像packet完全一致、最終64連続face ROIと口入力の位相、完成NAS SHAと直接decodeを保存する。最終全体／締め画像の目視と、全編リアルタイム視聴・主観試聴・ownerの創作採用・公開後成果は区別する。

本文の正式ストアリンクは [caption.txt](metadata/caption.txt) に保持。これは声・効果音のみの未投稿候補で、150BPMのcut格子を実際の人気曲への音はめ完了とは扱わない。Rootがnative音源の曲ID／日本向け商用利用／開始拍／実プレビューと声のバランスを確認してから投稿を進める。技術完了を公開済み・成長効果の実証へ読み替えない。
