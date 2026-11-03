# おさゆ v09：実音源に合わせた通常版・コラボ版

From.[ショート動画ディレクター] — [Issue160](https://github.com/Pui-core/-/issues/160) の継続。

v08の背景・ポップアップが創作差戻しとなったため、人物なしV2素材をPhotoCraftの曲線・ガラス面・照明レイヤーと組み合わせ、通常版とコラボ版で異なる背景を作る。実測した Elektronomia — Sky High / Regular / NCS公式原盤の46.0755秒を動画0秒に合わせ、カット、ポップアップの登場・着地・退場、斜めの寄り引きを構成した。通常版18.766667秒、コラボ版19.700000秒。無音と音源ありの計4本を保存する。

実配信画像待ちは過去owner訂正で撤回済み。使用したV2背景を実配信原本とは称さない。TikTokの登録ID・地域・当該accountでの利用は未確認であり、後の設定・公開時の確認事項。今回の私的制作・受渡しを止める条件にしない。創作採用、実聴、公開承認も技術検査とは別に記録する。

## 原本と実行

PhotoCraft 0.15.1、EffectCraft 0.14.0、FilmCraft 0.10.0をWindowsの専用worktree/private caseから実行する。画像、音源、native原本、人物、private binding、成果物の絶対pathはGitへ登録しない。`OSAYU160_ROOT` に新revision、`OSAYU160_BINDING` に原素材のSHA/bytesを持つprivate bindingを指定する。CPU2個・BelowNormal・Windows Jobの終了証跡を保持する。

r01候補で保存した2つの `.pcraft` / PNG / provenanceと同一公式音源をSHA照合して再利用する。人物をimportしないneutral原本と本番原本を別々に生成する。人物のローカル変形は固定し、共通の2D親によるpan/zoomのみ。背景にだけ3D遠近、人物や文字に回転・歪み・マスク・ブラーを適用しない。

```powershell
# 必要な背景・provenance・音源を新revisionへ固定した後に実行する。
foreach ($variant in @('solo','collab')) {
  node full-build-v09.mjs $variant neutral
  node full-audit-v09.mjs $variant neutral
  node full-render-v09.mjs $variant neutral
  # provenance確認済みneutralで見え方を確認し、人物入り画像はAIへ渡さない。
  node full-build-v09.mjs $variant production
  node full-audit-v09.mjs $variant production
  node compare.mjs $variant
  node full-character-proof-v09.mjs $variant full-r02
  node full-render-v09.mjs $variant production
  node full-pixel-safety-v09.mjs $variant production
  node full-film-v09.mjs $variant
  node full-final-audit-v09.mjs $variant
}
node full-guide-v09.mjs
node full-source-attest-v09.mjs
```

各プロセスの非0を後続工程前に拒否する。既存成果は上書きしない。FilmCraftの一括トラック削除が拒否された通常版では、出力済みAVを保全し、保存原本の音声トラックIDに対する `sequence.deleteTrack` を使用した。`full-film-v09.mjs solo --resume-exported` はAV出力成功receiptと原本契約を照合して無音原本の派生から再開する。通常の新規作成でこのオプションは使わない。

FilmCraftで音源の開始点・音量-6dB・末尾8frame fadeを編集してAVを1回exportする。無音nativeは音声トラックだけを削除して保存する。無音MP4は既存AVの映像をstream-copyし、音声streamを含めない。同variantの映像全frameとPTSを一致確認するため、音だけの差分で映像を再renderしない。

## 検証と引渡し

- 保存nativeの全frameでカメラ・popup・文字の時間、人物の固定変形、cropを検査する。通常版のカットは85/112/141/140/85frame、コラボ版は85/140/113/140/113frame。異なる画角と内容で切り替え、静止連続90frame未満・動きのある1cut150frame以下を守る。
- neutralと本番の共有レイヤー構造を比較し、原人物SHA、過去の同一素材の等倍検査、今回3時点の数値合成検査を結び付ける。人物入り検査画像はAI入力禁止。
- 実finalの全decode、寸法・fps・音声stream、同variantの映像一致、数値による全frame動き、指定原盤区間とAACの相関、音声頭尾とclipを検査する。数値は実聴や創作採用の代用ではない。
- `full-guide-v09.mjs` は保存nativeから着地と退場時刻を照合し、全編の実尺で原盤終端を再計算した `音源指定.txt` を保存する。通常版の原盤終端64.842167秒、コラボ版65.775500秒。曲名・作者・版・公式URL・動画0秒対応・主要cue・TikTok未設定を記載し、映像には焼き込まない。
- 候補QAのV09-CUE-001は表記訂正。f141はwide到着/hold、popup退場の設計開始f159、最初の位置変更f160と区別する。旧r01原票・mediaは保全し、補足binding/txtとSource表で訂正する。全編は別の時刻表・4SHAで同Reviewerの必要deltaを受ける。
- 4本の私的プレビューを先に提出する。最新headの必要QA・通常merge後、新NAS prefixへ動画のみ排他copyし、実NAS bytes/SHA/full decodeを固定する。音源指定txtは私的別添。旧v05/v07/v08・PR100・旧QAは保全する。

r01候補用は `preview-*-v09.mjs`、v08以前のスクリプトは履歴として残す。全編は上記 `full-*-v09.mjs` を使い、旧技術承認を創作採用へ転用しない。
