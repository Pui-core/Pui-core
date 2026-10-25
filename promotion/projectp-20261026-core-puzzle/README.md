# 芯石をはめると、何が変わる？

[20秒プレビュー・声とSFX／音楽なし](videos/core-puzzle-voice-no-music.mp4) / [SFXのみ](videos/core-puzzle-sfx-only.mp4) / [カバー](covers/core-puzzle-cover.png) / [中央3:4](qa/cover-center-3x4.png)

2026-10-26投稿候補の先行制作です。公開済み60秒紹介を繰り返さず、実ゲームI章の「芯石をはめる→足場が階段へ変わる→登って灯す」一つの仕掛けへ絞りました。現在は実楽曲・実TikTok UIが未確認の **Draft/HOLD**。10/25には追加投稿せず、10/26の実活動・owner指示・前投稿の結果を照合して公開担当が題材を再判断します。

## 上部UIの修正・revision02

初回の実TikTok stagingでは小さい作者名/開発中ラベルがナビに重なったため、動画から2行を外して主見出しを45px下へ移しました。主見出しの上端は約251px。作者・探索モードはカバー/投稿文/原本へ保持し、v1納品はそのまま保存しています。修正版は `revision-02-ui-safe/` へ別納品。実UI再確認は未完了です。

## 音と公開前の残条件

今のMP4はVOICEVOXの短い説明3句と編集SFXだけです。BGMは入れておらず、人気曲同期済み・公開可能とは判定していません。SFXは実ゲーム音ではなく、制作した短い編集音です。

- 必要な実音源区間は暫定20秒。基準の強い着地は **4.8秒／出力frame144**。source163→164の実変化と編集音を合わせています。
- 曲のBPMは未設定です。実際に利用可能な曲・sound ID・区間・利用条件・観測した人気根拠が決まってから、冒頭の静止と比較尺を調整します。120BPM固定ではありません。
- 曲が決まったら `source/edit.json` の `revealAt` をフレーム境界へ設定し、picture・audio・render・verifyを再実行します。映像の実動作は1倍速の12秒を保持し、静止/比較部分で全体の18〜28秒へ対応します。
- 音源選択・実TikTokプレビュー・曲と声の実聴、当日の公開判断はroot/排他確保済みpublisherの担当です。CML等のraw音源を公開Gitへ再配布しません。

## 実際の変化と編集

収録は開発中v0.11.0、I章EXPLORE。source commit `6233f5d33b24a35e91800357b7bcf8861049cf2a`。実キー入力と通常物理による既存のlossless PNG連番です。

| 出力 | 元フレーム | 内容 |
| --- | --- | --- |
| 0〜2.4秒 | 163静止 | 何が変わるかを問う |
| 2.4〜4.8秒 | 92〜163 | 拾って運び、差込口へ |
| 4.8秒 | 164 | 芯石が入り、横並び3足場が階段へ |
| 4.8〜14.4秒 | 164〜451 | 実変化、登る、上の灯へ到達 |
| 14.4〜18秒 | 163／164静止 | 同じカメラで前後を比較 |
| 18〜20秒 | 420静止 | 作品名と次の仕掛けへの導線 |

capture.jsonのfit frame199は挿入後の記録点です。実画像の163は携帯中、164は挿入済みで、cameraとplayer位置が同一であることを確認。比較素材は両方ともsource x460/y300/w1080/h600の同じ範囲をPhotoCraftで切り出しました。元のHUD時計はPNG保存待ちを含むため、RTA・最速記録・PB更新の証拠にはせず、動画では視野から外しています。架空の正解ルートや操作を追加しません。

## 編集原本

- PhotoCraft: `covers/core-puzzle-cover.pcraft`、`projects/comparison.pcraft`。実画像埋め込み・編集可能な文字と図形。画像生成モデルは使いません。
- EffectCraft: `projects/core-puzzle.ecproj`。実ゲームの拾う区間は左寄り追従、挿入で3段足場へ引き、その後は主人公と着地点を追います。重要文字へmotion blurを付けません。
- FilmCraft: `projects/core-puzzle-voice-no-music.fcproj`、`core-puzzle-sfx-only.fcproj`。映像マスターと音源を分け、元素材の音を重ねません。
- `source/cue-map.json` に実変化・静止・比較・必要音源尺と未確認項目、`qa/layout-motion.json` に保存したカメラ計画と文字boundsを保存。

声は **VOICEVOX:青山龍星（ノーマル／style13）**。本人の肉声や実発言の録音ではなく、既存事実の短い説明です。個人の商用/非商用利用をクレジット付きで認め、企業関与には別確認を求める同梱policyを確認した前案件と同じ用途です。`qa/voice-license.json` を参照し、別用途へ条件を拡張しません。

## 再制作と保存

WSL Node、Windows PhotoCraft 0.15.1／EffectCraft 0.14.0／FilmCraft 0.10.0、既存FFmpegを使用。入力は `~/Videos/ProjectP/2026-10-25/EMBERWAKE-demo` の既存収録です。制作担当はGUI・キーボード・マウス・ライブブラウザを操作しません。

```bash
node source/prepare-assets.mjs
node source/audio.mjs
node source/picture.mjs
node source/render.mjs
node source/verify.mjs
node source/package.mjs
```

VOICEVOX工程はlocalhost:50025の実エンジンを使います。PhotoCraft原本はWindows一時フォルダーへ保存してSHA一致でLinuxへ移し、F納品先から再読込・保存・描画します。最終F納品は `F:\Videos\ProjectP-Core-Puzzle-2026-10-26`。既存納品先を上書きしないため、再納品時は `PROJECTP_PUZZLE_DELIVERY` へ別版を指定します。

ProRes中間マスターは大きいためGit対象外で、EffectCraftの原本・連番から再生成できます。F納品にはこのマスターも含めます。元の公開作品、元ゲーム、他Issueのsource、次日claim/runtimeは変更していません。

## 検査の範囲

全MP4の形式・全AVデコード・最終AAC音量・3区間の波形相関・語頭語尾、保存原本からのtimeRemap163→164、カバー中央3:4の文字boundsを検査します。`qa/technical.json`、`qa/visual-review.json`、`qa/delivery-native.json` と最終動画/原本SHAを対応させます。最終MP4の全場面、切替18連続フレーム、終わりの実画像を目視します。

これは実楽曲・実TikTok UI・直接の全編視聴/試聴・ownerの創作採用・公開後成果を確認済みとする判定ではありません。必要な音源・UI確認が揃うまでPRはDraft/HOLD、IssueはOPENです。

管理: [制作 #97](https://github.com/Pui-core/-/issues/97) / [継続目標 #93](https://github.com/Pui-core/-/issues/93)
