# EMBERWAKE 開発解説：押す前に、どの道が変わるか

管理 [Pui-core/-#156](https://github.com/Pui-core/-/issues/156) の**仮ナレーション付き45.6秒・冒頭代表稿 v09-r2**。現象→初見の疑問→線と丸印を読む判断→同じ状態を別の処理が参照する実装→実E操作と着地→観測した残課題、を一本の言葉の流れにした。17秒のv08完成MP4を引き伸ばしていない。作者の未発言の心情・制作意図・過去の苦悩や没案を創作しない。

## 現在の実物

| 項目 | 固定値 |
|---|---|
| Windows絶対path | `C:/Users/pui/private-use/emberwake-video156-20261101/v09/videos/emberwake-v09-narrated-intro45-r2.mp4` |
| bytes | `5542059` |
| SHA-256 | `1cc67d9ab34108ce9513ef12e65df03d8d74a748031aca4e45f4b667dc3b7ac3` |
| 映像 | H.264 / 1080×1920 / 30fps / 1368f / 45.600秒 |
| 音声／container | AAC stereo / 45.610秒 |

台本全文と各句のshot対応は [仮台本とshot対応](v09/宣伝-156仮台本とshot対応-v09.md)、参考の観測範囲は [参考確認と構成](v09/宣伝-156参考確認と構成-v09.md)。本稿は縦型の開発解説の冒頭であり、600秒以上の横本編、65秒広告、CTA、創作採用、公開受入を完了したものではない。後続の初見観察・見落とし後の読み直し・別地形への応用は必要章／不足素材として台本末尾に分けた。

## 参考から取り入れた範囲

owner指定チャンネル／動画の本文・音声・transcriptは取得できず、時刻別の作風や全編視聴を観察済みとはしていない。[講談社の本人対談](https://creatorslab.kodansha.co.jp/topics/1138/)（2021-10-28）で確認した、想定される疑問を言語化し、先に録った音声へ映像を合わせる工程を参考にした。今回の台詞・声・具体表現は新たに作り、本人のゲームの目標をEMBERWAKE作者の発言へ転用しない。

仮ナレーションを先に9句生成し、発話に合わせて元rawの異なる区間、実画面の拡大、必要なコード、状態共有の説明図を配置した。静止拡大／説明図／先出し後の再掲／移動の間のカットは画面で区分した。長い字幕の一覧や同じ17秒動画の反復による尺合わせではない。

## 実ゲーム・実コードとの対応

ゲーム0.12.0、Source `71584a6bd0c8852885157de71032fd9252e7a04c`、`res://scenes/campaign.tscn`、第2話・物語モードpractice。v08用に普通のprocess内Inputで記録したrawをSHA照合して再利用し、今回の追加capture・製品コード改変は0。[収録再利用binding](収録再利用binding.json) が、merge済みSource `5053981dffac692f610e62b1b076c14e019b7a1c` 内の入力／trajectory／launch／preflightと、私有caseの実path・同bytesを結ぶ。元71coreのSHA一致も再確認した。

現用の実コード抜粋は [code-pin.json](v09/source/code-pin.json)。ファイル、commit、行、元ファイルSHA、全行原文と部分抜粋の区分を保持する。周辺contextはmerge済み [v08のcode-context](../projectp-emberwake-design-v08-20261101/code-context/) と対応する。

- `scripts/campaign/world.gd:36–40`：switch状態からcollision_layerとplatformsを切り替える。画面のL38は行末の部分抜粋。
- 同`:68–77`：配線はL73、非作動時の輪郭はL76、刻印色はL77。画面のL77内の式だけが配線・輪郭・衝突全体を作るとは説明しない。
- `scripts/world.gd:163–168`：操作側の丸印。今回のgroup1の対応だけを示し、全groupの印の一意性や初見の理解を保証しない。

`stone_circuit.gd` はこのcampaignの実行経路ではないため、今回の根拠にしない。説明図は「1状態を輪郭／刻印色／通れる判定が別々に参照する」関係を示す。いずれも実装に基づく編集解説であり、作者の直接発言としていない。

残課題には、旅人が操作側の丸印に重なる実画面を示す。これは観測した表示条件であり、「初見に必ず伝わらない」との人間検証や、改善済みの機能を作ったという主張ではない。

## 音と原本

音は**仮ナレーション `VOICEVOX:玄野武宏`、speaker11**のみ。本人／Hytackaの声を再現せず、既存localhost50031のengine0.25.1へWindows API clientから生成依頼した。既存WSL forward経由であり、新しいengineやmodelを重複起動したものではない。原ゲーム音、編集SE、新BGMは使用していない。動画内にクレジットを表示。[VOICEVOX規約](https://voicevox.hiroshiba.jp/term/)と[音声ライブラリ規約](https://www.virvoxproject.com/voicevox%E3%81%AE%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84)を確認した。キャラクター立ち絵は使用しない。

各句のquery原票は `v09/source/query-*.json`、採用したWAVの位置／SHA／読み入力は `v09/qa/voice-binding-r3.json`。第6句の「行」はqueryが「くだり」と読んだため、読み入力だけ「ぎょう」に訂正し元音声を保持した。

現用の新原本は次の7件。

- FilmCraft0.10.0：`v09/projects/explainer-cut.fcproj`、`explainer-final-r2.fcproj`。
- EffectCraft0.14.0：`explainer.ecproj` と `v09/source/explainer.jsx`。図示・画角・注目箇所・文の対応を保存。Windows GPUで全1368fの描画完走。
- PhotoCraft0.15.1：`control-clear.pcraft`、`target-outline.pcraft`、`control-occluded.pcraft`、`state-label.pcraft`。実画面の必要部分と説明用ラベルを保存。コード素材2原本はmerge済みv08版をSHA固定で再利用。

Windowsの別private環境／所有Job／下げたCPU優先度で有限処理。共有マウス・global key・foreground・clipboard・PCでの音再生は0。

## 依存と再読込

[依存manifest.json](依存manifest.json) に、raw、ProRes、WAV、再利用画像、現用MP4の実絶対path／bytes／SHAを保存する。**clone単独の全media同梱packageではない**。大media・音声WAV・完全なゲーム製品・engine／modelは私有caseに保持しuploadしない。Root／Reviewerはmanifestの実参照先から照合する。再利用原本／旧Source／v08納品MP4は変更していない。

Sourceのscriptは実制作工程の保存。現用書出しは `build-r2.py`、検査は `verify-r2.py`。絶対参照と既存出力を保持しているため、clone後の一括再実行を指示するものではない。再現時は同SHAのprivate依存を配置し、別attempt／別出力へ行う。旧17秒のCodehelper元 `v07/source-v07.jsx` は共通関数の参照用であり、旧MP4を入力にはしていない。

## 検証と修復の範囲

現用MP4の同SHAで全AVdecode exit0／stderr空。9句のL/R独立・語頭／語尾36検査でlag0、最低相関0.99961996、clip0、最小有声間隔0.310375秒。FilmCraftは開始／durationを30fps frameへ丸めるため、予定sampleと保存tickの差（最大13.33ms）を原票に残し、実保存位置を基準に照合。全句の有声末尾がclip終端内に保護されていることも確認した。数値を主観実聴へ読み替えない。

未提示の初回exportでは、読みを直した第6句の相対media pathが原因で無音になった。語頭照合が実不良を検出したため、全音声を絶対pathにし、別FC原本／別MP4へ修復。初回原票・動画は私有caseに保全した。2版のH.264 elementary stream SHAは同一で、画像検査を継承し、修正版の全AVdecodeと全句AACは改めて検査した。経緯は `v09/qa/初回音声参照失敗と修復.json`。

同映像の1fps全体sheet、9枚の320px幅代表画像、30連続着地frameを抽出して実見した。Source追加先からの原本再読込／byte一致／欠損0は `v09/qa/source-package-check.json`。独立QA、全編実時間視聴、主観実聴、実mobile、owner創作採用、公開受入は未確認。

同writerの新Windows WT／branchをmain `5053981d...` から作成し、このprefixだけを追加する。旧WT／PR96／旧prefixを保全。NAS／投稿／予約／lease／claim／cronはRoot専管で変更しない。最新headと現用MP4をRootへ渡し、必要な新差分の独立判定へ進める。
