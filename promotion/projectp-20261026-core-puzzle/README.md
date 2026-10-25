# 芯石をはめると、何が変わる？ / revision03

[モデル入り20秒・声/SFX／音楽なし](videos/core-puzzle-voice-no-music.mp4) / [自作曲を合わせた別案](videos/core-puzzle-voice-original-score.mp4) / [SFXのみ](videos/core-puzzle-sfx-only.mp4) / [カバー](covers/core-puzzle-cover.png) / [再生ページ](index.html)

10/26投稿候補です。実ゲームI章の「芯石をはめる→足場が階段へ変わる→登って灯す」を一話にし、owner指定のRevenant Naturalを案内役へ追加しました。旧版は `F:\Videos\ProjectP-Core-Puzzle-2026-10-26\revision-02-ui-safe` に保持しています。今回の別納品は `revision-03-live2d`。現在は **Draft/HOLD** で、今日は追加投稿しません。

## 指定モデルと実際の動き

10/18版 `Revenant_Natural.model3.json` と実参照14ファイルを読み取り、指定MOC SHA `6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e` を既設の正式Cubism Coreで実ロードしました。Core 06.00.0513／MOC5、52パラメーター・58描画メッシュ。今回の検査は `qa/model-native-core.json` に保存しています。

実際の `ParamMouthOpenY` へVOICEVOX3句だけの波形RMSを入力し、無音フレームは口を閉じます。瞬き、微小な首振り、呼吸は編集した動きです。本人のカメラ追跡・肉声の実演ではなく、VTSの物理演算も再現しません。SFXやBGMでは口を動かしません。

600フレームを同じ固定カメラで透過描画しました。頭部へ余白を取り、各フレームを自動fitして画角を変える処理はありません。袖・胴・下部は上半身として意図的に切り出しています。`source/model-cues.json` に実パラメーター、`qa/model-alpha-bounds.json` に全600枚の頭部余白を保存します。

描画はMITのlive2d-agent-kit診断ラスタライザーを元にした、実Core変形とatlasのオフライン合成です。モデルの全58メッシュがnormal blend・標準RGB multiply/screen、反転maskなしであることを調べ、今回の予定姿勢で非対応色を検出したら停止します。白/暗背景で顔・髪・花・服・口と眼のmaskを目視しました。一般のSDK描画との完全等価性やVTS物理の再現を主張するものではありません。

元MOC、atlas、PSD、Core/SDK、配信設定を変更・同梱せず、rawモデルとSDKは公開Gitに追加していません。公開checkoutには連番を再生成するrecipeとSHA、描画した結果・原本を保存します。ローカルのモデルとCoreがないcheckoutでは再生成できません。F納品は描画済み連番とalpha動画を含み、Craft原本をその場所から再読込します。

## 実作品と編集

実ゲームv0.11.0、I章EXPLORE、収録source commit `6233f5d33b24a35e91800357b7bcf8861049cf2a`。frame163は芯石を携帯中で足場が横並び、164から差し込み済み・階段です。capture.jsonのfit199は後の記録点であり、変化の瞬間ではありません。

| 出力 | 元フレーム | 内容 |
| --- | --- | --- |
| 0〜2.4秒 | 163静止 | 問いと案内役 |
| 2.4〜4.8秒 | 92〜163 | 拾って運ぶ実動作 |
| 4.8秒／出力144 | 164 | 芯石が入り足場が変わる |
| 4.8〜14.4秒 | 164〜451 | 登って上の灯へ |
| 14.4〜18秒 | 163／164 | 同じ画角の比較 |
| 18〜20秒 | 420静止 | 作品名と次回への導線 |

実動作12秒は1倍速です。静止・比較は編集として区別し、未収録の操作やRTA/PBを創作しません。HUD時計はPNG保存待ちを含むため画面外に置きます。案内役は上部、ゲームの主人公・芯石・足場は下部に分けています。

PhotoCraftはモデル入りカバーと実画像の比較素材、EffectCraftは実作品への追従とモデル合成、FilmCraftは同じ映像と役割別の音を扱います。生成AI画像は使いません。音源cueは暫定4.8秒で、人気曲を選んだら静止/比較尺で調整可能です。BPMを120へ固定していません。

全身寄りのモデルが足場へ重なったため、本編は顔の大きさを保つ600×450の肩上portraitへ変更し、モデル下端619pxとゲーム表示開始650pxを分けました。カバーも同じ頭/肩cropを使い、下端730pxから比較カード上端819pxまで89px空けています。比較場面は650〜1610pxへ収め直し、「はめる前」「はめた後」の両ラベルを見出しで隠さない構図に修正しました。

## 音の3種類と保留

声は **VOICEVOX:青山龍星（ノーマル／style13）**。既存の3句と現在のpuzzle用SFXを保持しています。SFXは実ゲーム録音ではなく、短いオリジナル編集音です。話者の同梱policy確認は `qa/voice-license.json` を参照。

- `core-puzzle-voice-no-music.mp4`: 声とSFXのみ。人気曲後付け用。
- `core-puzzle-sfx-only.mp4`: SFXのみ。声と音源を別に扱う場合の素材。
- `core-puzzle-voice-original-score.mp4`: 既存の純自作曲を加えた別案。**人気曲を使った版ではありません。**

自作曲の元はIssue88の決定的な加算合成のみ、SHA `565295d97f5525f3f6cec6dd722c5fd8b87932b58b2e10d087a3980762665da9`。外部sample・声・ゲームSEを含まず、Issue89の旧SFX追加mixは使いません。実PCMを測り、source18.000833333秒の立ち上がりを出力4.8秒へsample単位で合わせました。採用区間はsource13.200833333〜33.200833333秒。台詞の語頭120ms前から曲だけを下げ、語尾後まで保護して戻します。声/SFXは一度だけ加えています。実測値とSHAは `qa/original-score.json` に保存。

PP97-SOUNDは未解除です。投稿用途で許可された人気曲のsound ID・区間・利用条件・人気根拠、実拍への調整がまだ必要です。商用のみ・尺制限なしの5検索語0件と通常の公式CMLページ500は限定観測で、全カタログ不可とは結論しません。Hauxenz候補は未採用です。

## 実UIと検査の範囲

revision02の冒頭feed・180字候補caption・カバーは実TikTokで限定確認し、上部小ラベルの重なりを解除しました。その証跡は `qa/pp97-native-ui.json` と `qa/native-ui-binding.json` に旧SHAのまま保持しています。モデルなしの旧版の履歴です。

**revision03は別に実TikTokで確認済みです。** rootが本人`prop_pui`の既存Firefoxで、自作曲別案master SHA `f79e6f38…fe0f4c5` とカバー SHA `76c4b7fd…fa4185f` をアップロードしました。5.37MB／1080P／20秒の完了表示、180字候補captionとVOICEVOX credit、冒頭、約5秒での芯石挿入と3段足場、約14秒の上の灯と主人公、約17秒の比較両ラベル、00:20/00:20の終端を確認しています。実cover canvasとprofile previewで問い・モデル・前後比較・作品名が見え、cover Saveでeditorが閉じました。

この実UI観測7枚とroot記録を `qa/model-native-ui-binding.json` へSHAで結び、制作担当も画像と対応を独立確認しました。確認はupload previewの各場面と終端到達の範囲です。連続した全フレームの直接視聴や主観的な全編試聴を確認済みとは扱いません。人気曲は未選択のままで、自作曲別案を人気曲とは呼びません。

rootはHomeへ退出し、unsaved changesの終了を確認、本人Studio Homeと保存済みBIOへ戻りました。QA uploadは破棄済みでサーバーdraftはなく、追加投稿もありません。cover Saveも破棄したupload内だけの操作です。将来の公開には採用した最終master/coverの再アップロードと設定が必要です。これはrevision03の実UI確認待ちを意味しません。直接全編試聴、実曲選択後の最終音量/同期とtimeline、10/26当日の活動・前投稿分析・創作採用・公開後成果は未確認です。

最終MP4の全AVdecode・形式/尺/音量/ピーク・声の頭と語尾・波形同期、重要遷移の連続画像、全600モデル画像の頭部余白、カバー中央crop、3Craft原本のF再読込・保存・描画を検査します。必要な曲と最終確認が揃うまでPR19はDraft/HOLD、Issue97はOPENです。

保存ECと確認画像の取り違えも検査しています。旧fullbustの6画像は保存ECの更新より古かったため、修正済みECから0/143/144/151/480/570を再取得し、原本・生成JSX・各PNGのSHAと取得時刻を `qa/model-composite-binding.json` へ結びました。最終3MP4は全600フレームのdecoded picture SHAが一致し、3句と4.8秒の音のAAC相関は全てlag0sampleです。この数値/抽出画像検査と、上記の別証跡による実TikTokの限定観測、未確認の全編直接試聴を区別します。

## 再制作

既設環境を環境変数で指定します。`PROJECTP_LIVE2D_MODEL` はNaturalモデルfolder、`PROJECTP_CUBISM_CORE_JAR` はCore jar、`PROJECTP_CUBISM_NATIVE_DIR` は対応DLLのfolder、`PROJECTP_CUBISM_JAVA` はWindows Java実行ファイルです。Java compiler17互換出力・Windows JVM・Node・既設FFmpeg/Craft CLIが必要です。新SDKの取得や規約同意、グローバル導入は行いません。

```bash
node source/live2d.mjs
node source/prepare-assets.mjs
node source/original-score.mjs
node source/picture.mjs
node source/capture-model-composite.mjs
node source/render.mjs
node source/verify.mjs
PROJECTP_PUZZLE_DELIVERY='<new delivery directory>' node source/package.mjs
PROJECTP_PUZZLE_DELIVERY='<same existing delivery directory>' node source/check-delivery-assets.mjs
```

既存声を作り直すときだけ `source/audio.mjs` と既存VOICEVOX実エンジンを使います。旧版や元モデルは保持し、連番が既にある場合は別版へ保存してから再生成します。公開Git外の大きな中間映像は原本とrecipeから再生成できます。F納品には必要な中間と描画済み600枚を保存します。

管理: [制作 #97](https://github.com/Pui-core/-/issues/97) / [継続目標 #93](https://github.com/Pui-core/-/issues/93)
